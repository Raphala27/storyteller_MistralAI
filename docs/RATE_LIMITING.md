# Rate Limiting Implementation Guide

## Overview

This project implements **production-ready rate limiting** using Redis and the **token bucket algorithm** to protect the MistralAI API endpoints and prevent abuse.

## Architecture

### Token Bucket Algorithm
- **Smooth rate limiting** with burst support
- **Tokens refill continuously** at a configured rate
- **Atomic operations** via Redis Lua scripts (thread-safe under high concurrency)
- **Per-user and per-IP tracking** for fair resource allocation

### Multi-Tier Rate Limits

Different endpoints have different limits based on their cost and importance:

| Endpoint Type | User Type | Rate | Burst Capacity | Description |
|--------------|-----------|------|----------------|-------------|
| **AI Endpoints** (MistralAI calls) | Authenticated | 2 req/sec | 5 requests | Story generation endpoints |
| **AI Endpoints** | Anonymous | 0.5 req/sec | 2 requests | Limited for unauthenticated users |
| **Regular API** | Authenticated | 10 req/sec | 20 requests | CRUD operations |
| **Regular API** | Anonymous | 5 req/sec | 10 requests | Public API access |
| **Auth Endpoints** | All | 0.5 req/sec | 3 requests | Login/signup (brute force protection) |

### Protected Endpoints

#### AI Endpoints (Strictest limits)
- `POST /start-story` - Generates story opening
- `POST /continue-story` - Continues story
- `POST /end-story` - Generates story ending
- `GET /suggestions` - AI-generated suggestions

#### API Endpoints (Regular limits)
- `GET /stories` - List user stories
- `GET /stories/{story_id}` - Get story details
- `DELETE /stories/{story_id}` - Delete story
- `GET /me` - Get user info

#### Auth Endpoints (Brute force protection)
- `POST /signup` - User registration
- `POST /login` - User authentication

## Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

The following packages are required:
- `redis>=5.0.0` - Redis client
- `slowapi>=0.1.9` - Additional rate limiting utilities (if needed)

### 2. Set Up Redis

#### Local Development (Docker)
```bash
# Run Redis in Docker
docker run -d --name redis -p 6379:6379 redis:7-alpine

# Verify it's running
docker ps
```

#### Local Development (Direct Install)
**Windows:**
```powershell
# Using Chocolatey
choco install redis-64

# Or download from: https://github.com/microsoftarchive/redis/releases
```

**macOS:**
```bash
brew install redis
brew services start redis
```

**Linux:**
```bash
sudo apt-get install redis-server
sudo systemctl start redis
```

#### Production (Cloud Redis)

**Option 1: Upstash (Free tier available)**
1. Go to https://upstash.com/
2. Create a new Redis database
3. Copy the Redis URL

**Option 2: Render.com**
1. Add Redis service in Render dashboard
2. Copy the Internal Redis URL

**Option 3: Redis Labs**
1. Create free account at https://redis.com/
2. Create database
3. Get connection string

### 3. Configure Environment

Update your `.env` file:

```bash
# Redis Configuration
REDIS_URL=redis://localhost:6379/0

# For production with password:
# REDIS_URL=redis://default:your_password@host:port

# For TLS connection:
# REDIS_URL=rediss://default:your_password@host:port
```

### 4. Test Redis Connection

```bash
# Test local connection
redis-cli ping
# Should return: PONG

# Or test from Python
python -c "import redis; r = redis.from_url('redis://localhost:6379/0'); print(r.ping())"
```

## How It Works

### 1. Token Bucket Algorithm

Each user/IP gets a "bucket" of tokens:
- **Capacity**: Maximum tokens (burst limit)
- **Refill rate**: Tokens added per second
- **Cost**: Each request consumes tokens

Example for AI authenticated users:
```
Capacity: 5 tokens
Refill: 2 tokens/second
Cost: 1 token per request

Timeline:
0s:  5 tokens → Request → 4 tokens ✓
0.5s: 5 tokens → Request → 4 tokens ✓  
1s:  5 tokens → Request → 4 tokens ✓
1.5s: 5 tokens → Request → 4 tokens ✓
2s:  5 tokens → Request → 4 tokens ✓
2.1s: 4.2 tokens → Request → BLOCKED ❌ (429 Error)
2.5s: 5 tokens → Request → 4 tokens ✓ (refilled)
```

### 2. Identifier Strategy

**Authenticated users**: Tracked by `user_id` (more accurate, survives IP changes)
**Anonymous users**: Tracked by IP address (with proxy handling)

```python
# Extracts from X-Forwarded-For header if behind proxy
identifier = f"user:{user_id}" if user_id else f"ip:{client_ip}"
```

### 3. Redis Key Structure

```
rate_limit:user:abc123         # Authenticated user
rate_limit:ip:192.168.1.1      # Anonymous user by IP

Value (Redis Hash):
{
  "tokens": 3.5,              # Current tokens available
  "last_update": 1699900000.0  # Last update timestamp
}
```

### 4. HTTP Response Headers

**On successful request:**
```http
HTTP/1.1 200 OK
RateLimit-Limit: 5
RateLimit-Remaining: 3
RateLimit-Reset: 1699900060
```

**On rate limit exceeded:**
```http
HTTP/1.1 429 Too Many Requests
Retry-After: 2
RateLimit-Limit: 5
RateLimit-Remaining: 0
RateLimit-Reset: 1699900062

{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Please try again in 2 seconds.",
  "retry_after": 2,
  "limit": 5,
  "rate": "2 requests/second"
}
```

## Customization

### Adjust Rate Limits

Edit `backend/rate_limiter.py`:

```python
RATE_LIMITS = {
    "ai_authenticated": {
        "tokens_per_second": 2,      # Change this
        "burst_capacity": 5,          # And this
        "description": "AI endpoints for authenticated users"
    },
    # ... other configurations
}
```

### Add Rate Limiting to New Endpoints

```python
from rate_limiter import rate_limit_ai, rate_limit_api, rate_limit_auth

# For AI endpoints
@app.post("/new-ai-endpoint")
async def new_ai_endpoint(
    request: Request,
    user_id: Optional[str] = Depends(get_current_user_id_optional)
):
    await rate_limit_ai(request, user_id)
    # ... your endpoint logic

# For regular API endpoints
@app.get("/new-api-endpoint")
async def new_api_endpoint(
    request: Request,
    user_id: str = Depends(get_current_user_id)
):
    await rate_limit_api(request, user_id)
    # ... your endpoint logic

# For auth endpoints
@app.post("/new-auth-endpoint")
async def new_auth_endpoint(request: Request):
    await rate_limit_auth(request)
    # ... your endpoint logic
```

### Create Custom Rate Limit Tiers

```python
# In rate_limiter.py
RATE_LIMITS["premium_user"] = {
    "tokens_per_second": 10,
    "burst_capacity": 20,
    "description": "Premium users with higher limits"
}

# In your endpoint
from rate_limiter import rate_limiter

@app.post("/premium-endpoint")
async def premium_endpoint(request: Request, user_id: str = Depends(get_current_user_id)):
    config = RATE_LIMITS["premium_user"]
    identifier = f"user:{user_id}"
    allowed, info = rate_limiter.check_rate_limit(identifier, config)
    
    if not allowed:
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    
    # ... endpoint logic
```

## Testing

### Test Rate Limiting

```python
# Test script (test_rate_limit.py)
import requests
import time

BASE_URL = "http://localhost:8000"
TOKEN = "your_jwt_token_here"

headers = {"Authorization": f"Bearer {TOKEN}"}

# Test AI endpoint limits
for i in range(10):
    response = requests.post(
        f"{BASE_URL}/start-story",
        json={
            "genre": "Fantasy",
            "characters": "A wizard and a dragon",
            "opening_line": "The portal shimmered before them."
        },
        headers=headers
    )
    
    print(f"Request {i+1}: {response.status_code}")
    print(f"  Remaining: {response.headers.get('RateLimit-Remaining')}")
    print(f"  Limit: {response.headers.get('RateLimit-Limit')}")
    
    if response.status_code == 429:
        print(f"  Retry-After: {response.headers.get('Retry-After')} seconds")
        print(f"  Message: {response.json()['detail']['message']}")
        break
    
    time.sleep(0.1)  # Small delay between requests
```

### Load Testing

```bash
# Install Apache Bench
# Windows: Download from https://www.apachelounge.com/
# macOS: brew install httpd
# Linux: sudo apt-get install apache2-utils

# Test with 100 requests, 10 concurrent
ab -n 100 -c 10 -H "Authorization: Bearer YOUR_TOKEN" \
   -p story.json -T application/json \
   http://localhost:8000/start-story
```

## Monitoring

### Check Redis Keys

```bash
# Connect to Redis CLI
redis-cli

# List all rate limit keys
KEYS rate_limit:*

# Check specific user
HGETALL rate_limit:user:abc123

# Monitor real-time commands
MONITOR
```

### Metrics to Track

1. **429 response rate**: High rate indicates limits are too strict
2. **Average retry-after values**: Long wait times = user frustration
3. **Distribution by endpoint**: Which endpoints get rate limited most
4. **Auth vs anonymous usage**: Balance between security and usability

### Logging Rate Limits

Add logging to `rate_limiter.py`:

```python
import logging

logger = logging.getLogger(__name__)

# In check_rate_limit method:
if not allowed:
    logger.warning(
        f"Rate limit exceeded: {identifier}, "
        f"endpoint_type: {endpoint_type}, "
        f"tokens_remaining: {tokens_remaining}"
    )
```

## Production Deployment

### Render.com

1. **Add Redis service:**
   - Dashboard → New → Redis
   - Copy the Internal Redis URL

2. **Environment variables:**
   ```
   REDIS_URL=<internal_redis_url>
   ```

3. **Update backend service:**
   - Redeploy to pick up new environment variable

### Docker Compose

```yaml
version: '3.8'
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    
  backend:
    build: ./backend
    environment:
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - redis

volumes:
  redis_data:
```

### High Availability Redis

For production with HA requirements:
- **Redis Sentinel**: Automatic failover
- **Redis Cluster**: Horizontal scaling
- **Managed services**: AWS ElastiCache, Azure Cache, Google Memorystore

## Graceful Degradation

The implementation **fails open** - if Redis is unavailable, rate limiting is disabled:

```python
if not redis_client:
    print("⚠ Rate limiting disabled (Redis unavailable)")
    return True, {"tokens_remaining": 999, ...}
```

To fail closed (block all requests if Redis fails):
```python
if not redis_client:
    raise HTTPException(503, "Service temporarily unavailable")
```

## Security Considerations

### 1. Distributed Denial of Service (DDoS)
- Rate limits protect against single-source attacks
- Consider adding CDN/WAF (Cloudflare, AWS WAF) for volumetric attacks

### 2. Token Manipulation
- Rate limit keys use server-side identifiers
- Clients cannot manipulate their limits

### 3. IP Spoofing
- Trust `X-Forwarded-For` only from verified proxies
- Consider checking proxy configuration

### 4. Account Enumeration
- Auth endpoints limited to prevent username/email enumeration

### 5. Cost Control
- AI endpoints strictly limited to control MistralAI API costs
- Monitor usage and adjust limits based on budget

## Troubleshooting

### Rate limiting not working
```bash
# Check Redis connection
python -c "import redis; r = redis.from_url('redis://localhost:6379/0'); print(r.ping())"

# Check environment variable
echo $REDIS_URL  # Linux/Mac
echo %REDIS_URL%  # Windows CMD
$env:REDIS_URL    # Windows PowerShell
```

### All requests getting rate limited
```bash
# Clear all rate limit keys
redis-cli KEYS "rate_limit:*" | xargs redis-cli DEL

# Or flush entire database (development only!)
redis-cli FLUSHDB
```

### Different limits per environment
```python
# rate_limiter.py
import os

env = os.getenv("ENVIRONMENT", "development")

if env == "development":
    # More relaxed limits for testing
    RATE_LIMITS["ai_authenticated"]["tokens_per_second"] = 10
```

## Future Enhancements

1. **Dynamic limits based on user tier** (free, premium, enterprise)
2. **Time-based quotas** (e.g., 100 AI requests per day)
3. **Cost-based limiting** (different costs for different AI models)
4. **Admin dashboard** for viewing/adjusting limits
5. **Webhook alerts** when limits are frequently exceeded
6. **Geolocation-based limits** (stricter for certain regions)

## References

- [Redis Token Bucket Pattern](https://redis.io/docs/manual/patterns/rate-limiter/)
- [IETF Rate Limit Headers Draft](https://datatracker.ietf.org/doc/html/draft-ietf-httpapi-ratelimit-headers)
- [FastAPI Dependencies](https://fastapi.tiangolo.com/tutorial/dependencies/)
- [Token Bucket Algorithm](https://en.wikipedia.org/wiki/Token_bucket)
