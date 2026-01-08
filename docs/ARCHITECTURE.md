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
