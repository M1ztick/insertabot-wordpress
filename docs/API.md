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
