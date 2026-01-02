#!/bin/bash

# Insertabot Deployment Verification Script
# Run this before pushing to main branch

set -e

WORKER_URL="https://insertabot.io"
API_KEY="ib_sk_demo_12345678901234567890123456789012"
INVALID_KEY="invalid-key"

# 1. Validate tenant isolation
echo "\n=== Testing tenant validation ==="
response=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "X-API-Key: $API_KEY" \
  "$WORKER_URL/chat" -d '{"messages":[{"role":"user","content":"test"}]}')

if [ "$response" != "200" ]; then
  echo "❌ Tenant validation failed (expected 200, got $response)"
  exit 1
fi

# 2. Test invalid API key
echo "\n=== Testing invalid API key ==="
response=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "X-API-Key: $INVALID_KEY" \
  "$WORKER_URL/chat" -d '{"messages":[{"role":"user","content":"test"}]}')

if [ "$response" != "401" ]; then
  echo "❌ Invalid key test failed (expected 401, got $response)"
  exit 1
fi

# 3. Verify rate limiting
echo "\n=== Testing rate limiting ==="
for i in {1..101}; do
  curl -s -o /dev/null \
    -H "X-API-Key: $API_KEY" \
    "$WORKER_URL/chat" -d '{"messages":[{"role":"user","content":"rate test"}]}'
  sleep 0.1
done

response=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "X-API-Key: $API_KEY" \
  "$WORKER_URL/chat" -d '{"messages":[{"role":"user","content":"rate test"}]}')

if [ "$response" != "429" ]; then
  echo "❌ Rate limiting test failed (expected 429, got $response)"
  exit 1
fi

# 4. Test multimodal message handling
echo "\n=== Testing multimodal messages ==="
response=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "X-API-Key: $API_KEY" \
  "$WORKER_URL/chat" -d '{"messages":[{"role":"user","content":[{"type":"text","text":"test"}]}]}')

if [ "$response" != "200" ]; then
  echo "❌ Multimodal test failed (expected 200, got $response)"
  exit 1
fi

# 5. Verify database schema integrity
echo "\n=== Checking database schema ==="
if ! wrangler d1 execute insertabot-production --command=".schema" | grep -q "customer_id TEXT PRIMARY KEY"; then
  echo "❌ Database schema verification failed"
  exit 1
fi

echo "\n✅ All deployment checks passed! Safe to deploy"
exit 0