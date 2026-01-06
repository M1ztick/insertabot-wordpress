# Insertabot Deployment Guide

## Prerequisites
- Node.js 18+ installed
- Wrangler CLI installed (`npm install -g wrangler`)
- Cloudflare account with Workers enabled

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Authenticate with Cloudflare
```bash
wrangler login
```

### 3. Set Up Environment Variables

#### For Local Development
Copy `.env.example` to `.env` and fill in your values:
```bash
cp .env.example .env
```

#### For Production (Required Secrets)
Set secrets using Wrangler (DO NOT put these in .env files):

```bash
# Optional: Tavily API Key (for web search)
wrangler secret put TAVILY_API_KEY

# Optional: Stripe Keys (for payments)
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put STRIPE_WEBHOOK_SECRET
```

### 4. Verify Database Setup
Check that your D1 databases are properly configured:
```bash
# List databases
wrangler d1 list

# Check production database
wrangler d1 execute insertabot-production --command "SELECT COUNT(*) FROM customers"
```

### 5. Deploy to Production
```bash
# Deploy to production
wrangler deploy

# Or deploy to development
wrangler deploy --env development
```

## Configuration Files

### wrangler.toml
- Contains all Worker configuration
- Database bindings (D1)
- KV namespace bindings
- AI model bindings
- Environment variables (non-secret)

### .env files
- `.env` - Local development (git-ignored)
- `.env.production` - Production reference (git-ignored)
- `.env.example` - Template for team members (committed)

## Database Management

### Run Migrations
```bash
# Production
wrangler d1 migrations apply insertabot-production

# Development
wrangler d1 migrations apply insertabot-development
```

### Query Database Directly
```bash
# Production
wrangler d1 execute insertabot-production --command "SELECT * FROM customers LIMIT 5"

# Development
wrangler d1 execute insertabot-development --command "SELECT * FROM customers LIMIT 5"
```

### Backup Database
```bash
wrangler d1 export insertabot-production --output=backup-$(date +%Y%m%d).sql
```

## Testing

### Local Development Server
```bash
# Start local dev server
wrangler dev

# With remote database
wrangler dev --remote
```

### Test Endpoints
```bash
# Health check
curl http://localhost:8787/health

# Landing page
curl http://localhost:8787/

# Widget config (requires API key)
curl -H "X-API-Key: YOUR_KEY" http://localhost:8787/v1/widget/config
```

## Troubleshooting

### Issue: "Invalid API Key" errors
**Solution:** Verify your API key exists in the database:
```bash
wrangler d1 execute insertabot-production \
  --command "SELECT customer_id, email, api_key FROM customers"
```

### Issue: "Origin not allowed" CORS errors
**Solution:** Check `allowed_domains` in widget_configs table:
```bash
wrangler d1 execute insertabot-production \
  --command "SELECT customer_id, allowed_domains FROM widget_configs"
```

Update if needed:
```bash
wrangler d1 execute insertabot-production \
  --command "UPDATE widget_configs SET allowed_domains='*' WHERE customer_id='YOUR_ID'"
```

### Issue: Rate limit errors
**Solution:** Check KV namespace is bound correctly in wrangler.toml

### Issue: AI responses not working
**Solution:** Verify Workers AI is enabled in your Cloudflare account:
- Go to Workers & Pages > AI
- Ensure it's enabled

## Monitoring

### View Logs
```bash
# Tail production logs
wrangler tail

# Tail development logs
wrangler tail --env development
```

### Analytics
View analytics in Cloudflare Dashboard:
- Workers & Pages > Your Worker > Analytics

## Security Checklist

- [ ] All secrets stored via `wrangler secret put` (not in .env files)
- [ ] CORS_ORIGINS restricted to specific domains in production
- [ ] Rate limiting enabled and tested
- [ ] Database backups scheduled
- [ ] API keys rotated regularly
- [ ] Webhook secrets configured for Stripe
- [ ] HTTPS enforced on all routes

## Useful Commands Reference

```bash
# Deploy
wrangler deploy                          # Production
wrangler deploy --env development        # Development

# Secrets
wrangler secret put SECRET_NAME          # Add/update secret
wrangler secret list                     # List secret names
wrangler secret delete SECRET_NAME       # Remove secret

# Database
wrangler d1 list                         # List databases
wrangler d1 execute DB_NAME --command "SQL"  # Run SQL
wrangler d1 migrations list DB_NAME      # List migrations
wrangler d1 migrations apply DB_NAME     # Apply migrations

# Development
wrangler dev                             # Local dev server
wrangler dev --remote                    # Use remote resources

# Monitoring
wrangler tail                            # Stream logs
wrangler tail --format pretty            # Pretty logs

# Other
wrangler whoami                          # Show account info
wrangler logout                          # Logout
wrangler login                           # Re-authenticate
```

## Getting Help

- Wrangler Docs: https://developers.cloudflare.com/workers/wrangler/
- D1 Docs: https://developers.cloudflare.com/d1/
- Workers AI Docs: https://developers.cloudflare.com/workers-ai/
- Insertabot GitHub: (your repo URL)

## License
Proprietary - Mistyk Media
