#!/bin/bash
# Insertabot Repository Cleanup Script
# Run from root of your repository

echo "🧹 Starting Insertabot Cleanup..."

# Phase 1: Create new directory structure
mkdir -p src/worker
mkdir -p src/widget
mkdir -p scripts/backup
mkdir -p .github

# Phase 2: Move files to proper locations
echo "📁 Moving files to proper directories..."

# Move worker and widget
mv worker src/worker 2>/dev/null || echo "⚠️  worker folder already moved"
mv widget src/widget 2>/dev/null || echo "⚠️  widget folder already moved"

# Move utility scripts
mv add-customer.js scripts/ 2>/dev/null || echo "⚠️  add-customer.js already in scripts"
mv dev-server.js scripts/ 2>/dev/null || echo "⚠️  dev-server.js already in scripts"
mv test-api.js scripts/ 2>/dev/null || echo "⚠️  test-api.js already in scripts"

# Move configuration
mv .secretlintrc.json .github/ 2>/dev/null || echo "⚠️  .secretlintrc.json not found"

# Move schema
mv schema.sql docs/database-schema.sql 2>/dev/null || echo "⚠️  schema.sql not found"

# Phase 3: Clean root level
echo "🗑️  Cleaning root level..."
rm -f package-scripts.json 2>/dev/null || echo "⚠️  package-scripts.json not found"

# Phase 4: Delete wordpress-plugin from main branch
echo "❌ Removing wordpress-plugin folder..."
rm -rf wordpress-plugin

# Phase 5: Create new documentation files
echo "📝 Creating new documentation..."

cat > docs/API.md << 'EOF'
# Insertabot API Documentation

## Base URL
- Production: `https://insertabot.io`
- Development: `http://localhost:8787`

## Authentication
All requests require an API key via the `Authorization` header or `data-api-key` attribute.
```
Authorization: Bearer YOUR_API_KEY
```

## Endpoints

### POST /v1/chat/completions
OpenAI-compatible chat endpoint.

**Request:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Hello!"
    }
  ],
  "model": "llama-3.1",
  "max_tokens": 1024
}
```

**Response:**
```json
{
  "choices": [
    {
      "message": {
        "content": "Hi! How can I help you?",
        "role": "assistant"
      }
    }
  ]
}
```

### GET /v1/widget/config
Get widget configuration for a specific API key.

**Response:**
```json
{
  "apiKey": "your-api-key",
  "botName": "Insertabot",
  "theme": "dark",
  "position": "bottom-right"
}
```

### POST /v1/checkout
Create a Stripe checkout session for premium features.

**Request:**
```json
{
  "priceId": "price_xxxxx"
}
```

**Response:**
```json
{
  "url": "https://checkout.stripe.com/pay/cs_xxx"
}
```

### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-01-07T17:00:00Z"
}
```

## Rate Limiting
- Free tier: 100 requests/hour
- Pro tier: 10,000 requests/hour

## Error Handling
See `/docs/TROUBLESHOOTING.md` for common errors and solutions.
EOF

cat > docs/ARCHITECTURE.md << 'EOF'
# Insertabot Architecture

## Overview
Insertabot is a serverless AI chatbot widget built on Cloudflare Workers with the following components:

## System Architecture
```
┌─────────────────────────────────────────────────────┐
│                 Client Websites                      │
│         (Embed widget.js via script tag)             │
└────────────────────────┬────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│              Insertabot Widget                       │
│  (src/widget/insertabot.js - embeddable JS)         │
└────────────────────────┬────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│          Cloudflare Workers (Edge Network)           │
│              (src/worker/src/index.ts)              │
└────────────────────────┬────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Workers AI   │ │ D1 Database  │ │ KV Storage   │
│ (Llama 3.1)  │ │ (SQLite)     │ │ (Cache/Rate  │
│              │ │              │ │  Limiting)   │
└──────────────┘ └──────────────┘ └──────────────┘
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼
┌──────────────┐ ┌──────────────┐
│ Tavily API   │ │ Stripe API   │
│ (Web Search) │ │ (Payments)   │
└──────────────┘ └──────────────┘
```

## Core Components

### 1. Worker (src/worker/)
- **index.ts**: Main request handler and routing
- **customer.ts**: Customer management and subscriptions
- **stripe.ts**: Stripe integration for payments
- **rag.ts**: Retrieval-Augmented Generation using Vectorize
- **search.ts**: Web search via Tavily API
- **validation.ts**: Input validation and sanitization
- **errors.ts**: Structured error handling

### 2. Widget (src/widget/)
- **insertabot.js**: Embeddable chat widget
- **demo.html**: Demo page for testing

### 3. Database (D1)
SQLite database with customer data, conversation logs, and usage analytics.

### 4. Key-Value Storage (KV)
Used for:
- Rate limiting per API key
- Session caching
- Configuration caching

### 5. Vectorize
Vector database for RAG embeddings, enabling semantic search across documents.

## Request Flow

1. **Widget Initialization**: User loads page with `<script src="https://insertabot.io/widget.js">`
2. **Chat Request**: Widget sends message to `/v1/chat/completions`
3. **Authentication**: Worker validates API key
4. **Processing**: 
   - Check rate limits (KV)
   - Query database for context
   - Call Workers AI for response
   - Optionally enrich with web search
5. **Response**: Return message to widget
6. **Display**: Widget renders response

## Deployment

The worker is deployed via Wrangler to Cloudflare:
```bash
cd src/worker
wrangler deploy
```

## Environment Variables

See `.env.example` for required secrets:
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `TAVILY_API_KEY`
- Database bindings in `wrangler.toml`
EOF

cat > docs/TROUBLESHOOTING.md << 'EOF'
# Troubleshooting Guide

## Common Issues

### Widget Not Appearing
**Problem**: The chat widget doesn't show up on the page.

**Solutions**:
1. Verify the script tag is in your HTML:
```html
   <script src="https://insertabot.io/widget.js" data-api-key="YOUR_API_KEY"></script>
```
2. Check browser console for errors (F12 → Console tab)
3. Verify your API key is valid: `curl https://insertabot.io/health`
4. Check if there's a Content Security Policy (CSP) blocking the script

### Rate Limiting Errors
**Problem**: Getting 429 "Too Many Requests" errors.

**Solutions**:
1. Upgrade to Pro plan for higher limits
2. Implement request batching on your side
3. Add delays between requests
4. Contact support for custom limits

### Authentication Errors
**Problem**: "Invalid API key" or "Unauthorized" errors.

**Solutions**:
1. Generate a new API key in the dashboard
2. Ensure the API key is passed correctly
3. Check for typos or trailing spaces in the key
4. Verify the key hasn't been revoked

### Search Not Working
**Problem**: Web search queries return no results.

**Solutions**:
1. Check if search is enabled in your widget config
2. Verify Tavily API key is set correctly
3. Try a simpler search query
4. Check Tavily API status: https://tavily.com/status

### Database Connection Errors
**Problem**: "Database connection failed" errors.

**Solutions**:
1. Check D1 database is provisioned: `wrangler d1 list`
2. Verify wrangler.toml has correct database binding
3. Check for any Cloudflare service outages
4. Re-deploy the worker: `wrangler deploy`

## Getting Help

- **Email**: support@insertabot.io
- **GitHub Issues**: https://github.com/M1ztick/insertabot-v1.0/issues
- **Documentation**: /docs/

## Debug Mode

Enable debug logging by adding `?debug=true` to widget initialization:
```html
<script src="https://insertabot.io/widget.js?debug=true" data-api-key="YOUR_API_KEY"></script>
```
EOF

# Phase 6: Update scripts README
cat > scripts/README.md << 'EOF'
# Utility Scripts

## add-customer.js
Create a new customer in the database.
```bash
node add-customer.js
```

Follow the prompts to enter customer details.

## dev-server.js
Start local development server.
```bash
node dev-server.js
```

Access at `http://localhost:8787`

## test-api.js
Test API endpoints.
```bash
node test-api.js
```

Tests all endpoints and outputs results.
EOF

echo "✅ Creating .github/README.md..."
cat > .github/README.md << 'EOF'
# GitHub Configuration

This directory contains GitHub-specific configuration:

- `.secretlintrc.json` - Secret scanning rules
- `workflows/` - GitHub Actions workflows
- `copilot-instructions.md` - Copilot integration setup
EOF

echo "✅ All files have been cleaned up and reorganized!"
echo ""
echo "Next steps:"
echo "1. Review the changes: git status"
echo "2. Stage files: git add ."
echo "3. Commit: git commit -m 'refactor: reorganize project structure and remove wordpress-plugin from main'"
echo "4. Push: git push origin main"
