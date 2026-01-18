# insertabot-v1.0

AI-powered chatbot widget for websites. Embed customizable AI chat on any site in minutes.

## Features

- **Instant Setup** - Add AI chat to your website with one script tag
- **Fully Customizable** - Colors, position, bot name, avatar, and system prompts
- **Smart AI** - Powered by Cloudflare Workers AI with web search capabilities
- **Secure** - API key authentication, rate limiting, and CORS protection
- **Stripe Integration** - Built-in subscription management
- **Analytics** - Track usage and performance

## Commands

### Setup (First Time)

```bash
# Install
npm install && cd worker && npm install

# Set secrets
cd worker
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put STRIPE_WEBHOOK_SECRET
wrangler secret put STRIPE_PRO_PRICE_ID
wrangler secret put TAVILY_API_KEY
```

### Development

```bash
npm run dev
# Access at http://localhost:8787
```

### Deploy

```bash
npm run deploy
# Live at https://insertabot.io
```

### Takedown

```bash
cd worker
wrangler delete
wrangler d1 delete insertabot-production
wrangler kv:namespace delete --namespace-id=YOUR_KV_NAMESPACE_ID
wrangler vectorize delete insertabot-embeddings
```

## Project Structure

```
insertabot_by_mistyk_media/
├── worker/                 # Cloudflare Worker API
│   ├── src/               # TypeScript source files
│   │   ├── index.ts       # Main request handler
│   │   ├── customer.ts    # Customer management
│   │   ├── stripe.ts      # Stripe integration
│   │   ├── rag.ts         # RAG/embeddings
│   │   ├── search.ts      # Web search
│   │   └── validation.ts  # Input validation
│   ├── public/            # Static assets
│   └── wrangler.toml      # Worker configuration
├── widget/                # Embeddable widget
│   ├── insertabot.js      # Widget source
│   └── demo.html          # Demo page
├── scripts/               # Utility scripts
│   ├── add-customer.js    # Create new customer
│   └── test-api.js        # API testing
├── docs/                  # Documentation
└── schema.sql             # Database schema

```

## Usage

### Embed Widget on Your Site

```html
<script
  src="https://insertabot.io/widget.js"
  data-api-key="YOUR_API_KEY">
</script>
```

### API Endpoints

- `POST /v1/chat/completions` - OpenAI-compatible chat endpoint
- `GET /v1/widget/config` - Get widget configuration
- `POST /v1/checkout` - Create Stripe checkout session
- `GET /health` - Health check

## Documentation

See the `docs/` folder for detailed documentation:

- [Quick Start](docs/QUICKSTART.md)
- [Deployment Guide](docs/DEPLOYMENT_GUIDE.md)
- [Setup Guide](docs/SETUP_GUIDE.md)
- [Customer Integration](docs/CUSTOMER-INTEGRATION.md)
- [Stripe Setup](docs/STRIPE-SETUP.md)
- [Agents Documentation](docs/AGENTS.md)

## Tech Stack

- **Runtime**: Cloudflare Workers
- **Database**: D1 (SQLite)
- **Storage**: KV (rate limiting)
- **AI**: Workers AI (Llama 3.1, Vision models)
- **Search**: Tavily API
- **Payments**: Stripe
- **Vector DB**: Vectorize (RAG)

## License

GNU-v2

## Support

For issues or questions, please contact Mistyk Media at support@insertabot.io or admin@mistykmedia.io. Thank you!

