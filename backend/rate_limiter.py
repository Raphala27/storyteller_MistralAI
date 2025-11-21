"""
Rate limiting middleware and utilities using Redis token bucket algorithm.

This module provides comprehensive rate limiting for the API with:
- Token bucket algorithm for smooth rate limiting with burst support
- Different limits for authenticated vs anonymous users
- Stricter limits for AI-intensive endpoints (MistralAI API calls)
- Per-user and per-IP tracking
- Standard HTTP 429 responses with proper headers
"""

import os
import time
from typing import Optional, Tuple
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
import redis
from dotenv import load_dotenv

load_dotenv()

# Redis connection
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

try:
    redis_client = redis.from_url(REDIS_URL, decode_responses=True)
    redis_client.ping()  # Test connection
    print(f"✓ Connected to Redis at {REDIS_URL}")
except Exception as e:
    print(f"⚠ Warning: Could not connect to Redis ({e}). Rate limiting will be disabled.")
    redis_client = None


# Rate limit configurations (tokens per second, burst capacity)
RATE_LIMITS = {
    # AI endpoints - strictest limits (expensive operations)
    "ai_authenticated": {
        "tokens_per_second": 2,      # 2 requests per second
        "burst_capacity": 5,          # Can burst up to 5 requests
        "description": "AI endpoints for authenticated users"
    },
    "ai_anonymous": {
        "tokens_per_second": 0.5,     # 1 request every 2 seconds
        "burst_capacity": 2,          # Can burst up to 2 requests
        "description": "AI endpoints for anonymous users"
    },
    
    # Regular API endpoints
    "api_authenticated": {
        "tokens_per_second": 10,      # 10 requests per second
        "burst_capacity": 20,         # Can burst up to 20 requests
        "description": "Regular API endpoints for authenticated users"
    },
    "api_anonymous": {
        "tokens_per_second": 5,       # 5 requests per second
        "burst_capacity": 10,         # Can burst up to 10 requests
        "description": "Regular API endpoints for anonymous users"
    },
    
    # Auth endpoints (login, signup)
    "auth": {
        "tokens_per_second": 0.5,     # 1 request every 2 seconds
        "burst_capacity": 3,          # Can burst up to 3 requests
        "description": "Authentication endpoints (prevent brute force)"
    }
}


# Lua script for atomic token bucket rate limiting
# This ensures accurate rate limiting even under high concurrency
TOKEN_BUCKET_LUA_SCRIPT = """
local key = KEYS[1]
local now = tonumber(ARGV[1])
local rate = tonumber(ARGV[2])
local capacity = tonumber(ARGV[3])
local tokens_requested = tonumber(ARGV[4])
local ttl = tonumber(ARGV[5])

-- Get current bucket state
local bucket = redis.call("HMGET", key, "tokens", "last_update")
local tokens = tonumber(bucket[1])
local last_update = tonumber(bucket[2])

-- Initialize if bucket doesn't exist
if tokens == nil then
    tokens = capacity
    last_update = now
end

-- Calculate tokens to add based on time passed
local time_passed = math.max(0, now - last_update)
local tokens_to_add = time_passed * rate
tokens = math.min(capacity, tokens + tokens_to_add)

-- Check if we have enough tokens
if tokens >= tokens_requested then
    -- Consume tokens
    tokens = tokens - tokens_requested
    redis.call("HMSET", key, "tokens", tokens, "last_update", now)
    redis.call("EXPIRE", key, ttl)
    return {1, tokens, capacity, rate}
else
    -- Not enough tokens
    redis.call("HMSET", key, "tokens", tokens, "last_update", now)
    redis.call("EXPIRE", key, ttl)
    return {0, tokens, capacity, rate}
end
"""


class RateLimiter:
    """Token bucket rate limiter using Redis"""
    
    def __init__(self):
        self.redis = redis_client
        if self.redis:
            # Register the Lua script
            try:
                self.script_sha = self.redis.script_load(TOKEN_BUCKET_LUA_SCRIPT)
            except:
                self.script_sha = None
    
    def is_enabled(self) -> bool:
        """Check if rate limiting is enabled (Redis is available)"""
        return self.redis is not None and self.script_sha is not None
    
    def check_rate_limit(
        self,
        identifier: str,
        rate_limit_config: dict,
        tokens_requested: int = 1
    ) -> Tuple[bool, dict]:
        """
        Check if request should be allowed based on token bucket algorithm.
        
        Args:
            identifier: Unique identifier for the rate limit bucket (e.g., user_id or IP)
            rate_limit_config: Configuration dict with tokens_per_second and burst_capacity
            tokens_requested: Number of tokens to consume (default 1)
        
        Returns:
            Tuple of (allowed: bool, info: dict with tokens_remaining, limit, rate, retry_after)
        """
        if not self.is_enabled():
            # Rate limiting disabled - allow all requests
            return True, {"tokens_remaining": 999, "limit": 999, "rate": 999, "retry_after": None}
        
        rate = rate_limit_config["tokens_per_second"]
        capacity = rate_limit_config["burst_capacity"]
        key = f"rate_limit:{identifier}"
        now = time.time()
        ttl = int(capacity / rate * 2) + 60  # TTL is ~2x refill time + buffer
        
        try:
            # Execute Lua script atomically
            result = self.redis.evalsha(
                self.script_sha,
                1,
                key,
                now,
                rate,
                capacity,
                tokens_requested,
                ttl
            )
            
            allowed = result[0] == 1
            tokens_remaining = result[1]
            limit = result[2]
            tokens_per_second = result[3]
            
            # Calculate retry_after if rate limited
            retry_after = None
            if not allowed:
                # Time to wait for enough tokens to accumulate
                tokens_needed = tokens_requested - tokens_remaining
                if tokens_per_second > 0:
                    retry_after = max(1, int(tokens_needed / tokens_per_second) + 1)
                else:
                    retry_after = 1
            
            return allowed, {
                "tokens_remaining": int(tokens_remaining),
                "limit": int(limit),
                "rate": tokens_per_second,
                "retry_after": retry_after
            }
        
        except Exception as e:
            print(f"Rate limiting error: {e}")
            import traceback
            traceback.print_exc()
            # On error, allow the request (fail open)
            return True, {"tokens_remaining": 999, "limit": 999, "rate": 999, "retry_after": None}
    
    def get_identifier(self, request: Request, user_id: Optional[str] = None) -> str:
        """
        Get unique identifier for rate limiting.
        Prefers user_id for authenticated users, falls back to IP address.
        """
        if user_id:
            return f"user:{user_id}"
        
        # Get client IP (handle proxies and load balancers)
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            ip = forwarded.split(",")[0].strip()
        else:
            ip = request.client.host if request.client else "unknown"
        
        return f"ip:{ip}"
    
    def get_rate_limit_config(
        self,
        endpoint_type: str,
        is_authenticated: bool
    ) -> dict:
        """
        Get appropriate rate limit configuration based on endpoint type and auth status.
        
        Args:
            endpoint_type: Type of endpoint ("ai", "api", "auth")
            is_authenticated: Whether user is authenticated
        
        Returns:
            Rate limit configuration dict
        """
        if endpoint_type == "ai":
            return RATE_LIMITS["ai_authenticated" if is_authenticated else "ai_anonymous"]
        elif endpoint_type == "auth":
            return RATE_LIMITS["auth"]
        else:  # "api"
            return RATE_LIMITS["api_authenticated" if is_authenticated else "api_anonymous"]


# Global rate limiter instance
rate_limiter = RateLimiter()


def add_rate_limit_headers(response: JSONResponse, info: dict) -> JSONResponse:
    """Add rate limit headers to response"""
    response.headers["RateLimit-Limit"] = str(info["limit"])
    response.headers["RateLimit-Remaining"] = str(info["tokens_remaining"])
    response.headers["RateLimit-Reset"] = str(int(time.time()) + (info.get("retry_after") or 60))
    
    if info.get("retry_after"):
        response.headers["Retry-After"] = str(info["retry_after"])
    
    return response


async def check_rate_limit(
    request: Request,
    endpoint_type: str = "api",
    user_id: Optional[str] = None
) -> None:
    """
    Rate limiting dependency for FastAPI endpoints.
    
    Args:
        request: FastAPI request object
        endpoint_type: Type of endpoint ("ai", "api", "auth")
        user_id: Optional user ID for authenticated requests
    
    Raises:
        HTTPException: 429 Too Many Requests if rate limit exceeded
    """
    if not rate_limiter.is_enabled():
        return  # Rate limiting disabled
    
    is_authenticated = user_id is not None
    identifier = rate_limiter.get_identifier(request, user_id)
    config = rate_limiter.get_rate_limit_config(endpoint_type, is_authenticated)
    
    allowed, info = rate_limiter.check_rate_limit(identifier, config)
    
    if not allowed:
        retry_after = info.get("retry_after", 1)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "error": "Rate limit exceeded",
                "message": f"Too many requests. Please try again in {retry_after} seconds.",
                "retry_after": retry_after,
                "limit": info["limit"],
                "rate": f"{config['tokens_per_second']} requests/second"
            },
            headers={
                "Retry-After": str(retry_after),
                "RateLimit-Limit": str(info["limit"]),
                "RateLimit-Remaining": "0",
                "RateLimit-Reset": str(int(time.time()) + retry_after)
            }
        )


# Convenience functions for different endpoint types
async def rate_limit_ai(request: Request, user_id: Optional[str] = None):
    """Rate limit for AI endpoints (MistralAI API calls)"""
    await check_rate_limit(request, endpoint_type="ai", user_id=user_id)


async def rate_limit_api(request: Request, user_id: Optional[str] = None):
    """Rate limit for regular API endpoints"""
    await check_rate_limit(request, endpoint_type="api", user_id=user_id)


async def rate_limit_auth(request: Request):
    """Rate limit for authentication endpoints"""
    await check_rate_limit(request, endpoint_type="auth", user_id=None)
