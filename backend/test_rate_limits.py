"""
Test script to verify rate limiting is working correctly.

Usage:
    python test_rate_limits.py

Requirements:
    pip install requests
"""

import requests
import time
import sys
from datetime import datetime

BASE_URL = "http://localhost:8000"

def print_separator():
    print("\n" + "="*70 + "\n")

def test_endpoint(url, method="GET", data=None, headers=None, max_requests=10):
    """Test rate limiting on an endpoint"""
    print(f"Testing: {method} {url}")
    print(f"Making {max_requests} rapid requests...")
    print("-" * 70)
    
    success_count = 0
    rate_limited_count = 0
    
    for i in range(max_requests):
        try:
            if method == "GET":
                response = requests.get(url, headers=headers, timeout=10)
            else:
                response = requests.post(url, json=data, headers=headers, timeout=10)
            
            # Print response info
            status = response.status_code
            limit = response.headers.get('RateLimit-Limit', 'N/A')
            remaining = response.headers.get('RateLimit-Remaining', 'N/A')
            
            if status == 200:
                print(f"✓ Request {i+1}: Success (Limit: {limit}, Remaining: {remaining})")
                success_count += 1
            elif status == 429:
                retry_after = response.headers.get('Retry-After', 'N/A')
                detail = response.json().get('detail', {})
                message = detail.get('message', 'Rate limit exceeded') if isinstance(detail, dict) else detail
                print(f"✗ Request {i+1}: RATE LIMITED (Retry after: {retry_after}s)")
                print(f"  Message: {message}")
                rate_limited_count += 1
            else:
                print(f"? Request {i+1}: Status {status}")
            
            # Small delay to simulate rapid requests
            time.sleep(0.1)
            
        except requests.exceptions.RequestException as e:
            print(f"✗ Request {i+1}: Error - {e}")
    
    print("-" * 70)
    print(f"Results: {success_count} successful, {rate_limited_count} rate limited")
    return success_count, rate_limited_count

def main():
    print("\n🚀 Rate Limiting Test Suite")
    print("=" * 70)
    print(f"Testing against: {BASE_URL}")
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print_separator()
    
    # Test 1: Anonymous user - AI endpoint (strictest limits)
    print("TEST 1: Anonymous User - AI Endpoint (0.5 req/sec, burst 2)")
    print("Expected: Should rate limit after 2-3 requests")
    success, limited = test_endpoint(f"{BASE_URL}/suggestions", max_requests=6)
    
    if limited > 0:
        print("✅ Rate limiting is WORKING for anonymous AI endpoints!")
    else:
        print("⚠️  Warning: No rate limiting detected. Is Redis running?")
    
    print_separator()
    
    # Test 2: Auth endpoint (login)
    print("TEST 2: Auth Endpoint - Login (0.5 req/sec, burst 3)")
    print("Expected: Should rate limit after 3-4 requests")
    
    login_data = {
        "username": "testuser",
        "password": "wrongpassword"
    }
    
    print("Note: These will fail with 401 (wrong credentials), but we're testing rate limiting")
    success, limited = test_endpoint(
        f"{BASE_URL}/login", 
        method="POST", 
        data=login_data,
        max_requests=6
    )
    
    if limited > 0:
        print("✅ Rate limiting is WORKING for auth endpoints!")
    else:
        print("⚠️  Warning: No rate limiting detected. Is Redis running?")
    
    print_separator()
    
    # Test 3: Check if Redis is accessible
    print("TEST 3: Redis Connection Check")
    try:
        import redis
        r = redis.from_url("redis://localhost:6379/0", decode_responses=True)
        r.ping()
        print("✅ Redis is RUNNING and accessible")
        
        # Show rate limit keys
        keys = r.keys("rate_limit:*")
        print(f"   Found {len(keys)} rate limit keys in Redis")
        if keys:
            print("   Sample keys:")
            for key in keys[:3]:
                data = r.hgetall(key)
                print(f"   - {key}: {data}")
    except Exception as e:
        print(f"⚠️  Redis connection failed: {e}")
        print("   Rate limiting will be disabled without Redis")
    
    print_separator()
    
    # Summary
    print("📊 TEST SUMMARY")
    print("-" * 70)
    print("To verify rate limiting is working:")
    print("1. Make sure Redis is running: docker ps | findstr redis")
    print("2. Check backend logs for: '✓ Connected to Redis'")
    print("3. Run this script again to see 429 errors")
    print("\nIf rate limiting is not working:")
    print("1. Start Redis: docker run -d --name storyteller-redis -p 6379:6379 redis:7-alpine")
    print("2. Set REDIS_URL in .env: redis://localhost:6379/0")
    print("3. Restart the backend: uvicorn main:app --reload")
    print_separator()

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nTest interrupted by user")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Error running tests: {e}")
        sys.exit(1)
