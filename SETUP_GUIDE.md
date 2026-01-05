# Insertabot Setup and Troubleshooting Guide

## Current Issue: Chatbot Not Working on insertabot.io

This guide will help you fix the chatbot on your main site.

## Root Causes Identified

1. **Incomplete Widget Config API Response** - FIXED in this PR
2. **Missing Database Columns** - Needs manual fix
3. **CORS Configuration** - Needs verification
4. **API Key Setup** - Needs verification

---

## Step 1: Update Database Schema

Your `widget_configs` table is missing two columns that the widget expects.

### Run this SQL on your D1 database:

```sql
-- Add missing columns to widget_configs table
ALTER TABLE widget_configs 
ADD COLUMN placeholder_text TEXT DEFAULT 'Type your message...';

ALTER TABLE widget_configs 
ADD COLUMN show_branding INTEGER DEFAULT 1;

-- Verify the columns were added
PRAGMA table_info(widget_configs);
```

### How to run this:

```bash
# Method 1: Via wrangler CLI
cd worker
wrangler d1 execute insertabot-production --command "ALTER TABLE widget_configs ADD COLUMN placeholder_text TEXT DEFAULT 'Type your message...'"
wrangler d1 execute insertabot-production --command "ALTER TABLE widget_configs ADD COLUMN show_branding INTEGER DEFAULT 1"

# Method 2: Via Cloudflare Dashboard
# 1. Go to Cloudflare Dashboard > Workers & Pages > D1
# 2. Select 'insertabot-production' database
# 3. Click 'Console' tab
# 4. Paste and run the SQL commands above
```

---

## Step 2: Verify Your Widget Configuration

### Check your database has a valid widget config:

```sql
SELECT * FROM widget_configs 
WHERE customer_id IN (
  SELECT customer_id FROM customers 
  WHERE status = 'active' 
  LIMIT 1
);
```

### If you don't have a widget config, create one:

```sql
INSERT INTO widget_configs (
  customer_id,
  primary_color,
  position,
  greeting_message,
  bot_name,
  bot_avatar_url,
  model,
  temperature,
  max_tokens,
  system_prompt,
  allowed_domains,
  placeholder_text,
  show_branding
) VALUES (
  'YOUR_CUSTOMER_ID_HERE',
  '#667eea',
  'bottom-right',
  'Hi! How can I help you today?',
  'Insertabot',
  NULL,
  '@cf/meta/llama-3.1-8b-instruct',
  0.7,
  500,
  'You are a helpful AI assistant.',
  'https://insertabot.io',
  'Type your message...',
  1
);
```

---

## Step 3: Update CORS Settings

### Your allowed_domains must include your site:

```sql
UPDATE widget_configs
SET allowed_domains = 'https://insertabot.io'
WHERE customer_id = 'YOUR_CUSTOMER_ID_HERE';

-- For development, you can allow multiple domains:
UPDATE widget_configs
SET allowed_domains = 'https://insertabot.io,http://localhost:3000'
WHERE customer_id = 'YOUR_CUSTOMER_ID_HERE';
```

### Verify CORS_ORIGINS in wrangler.toml:

```toml
[vars]
CORS_ORIGINS = "https://insertabot.io"
```

**IMPORTANT:** After changing `wrangler.toml`, you MUST redeploy:

```bash
cd worker
npm run deploy
```

---

## Step 4: Get Your API Key

### Find or create your API key:

```sql
-- Find existing API key
SELECT api_key, status, plan_type 
FROM customers 
WHERE status = 'active'
LIMIT 1;

-- If you need to create a new customer with API key:
INSERT INTO customers (
  customer_id,
  email,
  api_key,
  plan_type,
  status,
  rate_limit_per_hour,
  rate_limit_per_day,
  rag_enabled
) VALUES (
  'cust_' || lower(hex(randomblob(16))),
  'your-email@example.com',
  'ib_sk_' || lower(hex(randomblob(32))),
  'free',
  'active',
  100,
  1000,
  0
);
```

---

## Step 5: Embed Widget on Your Site

### Add this to your HTML (before closing `</body>` tag):

```html
<!-- Insertabot Widget -->
<script
  src="https://insertabot.io/widget.js"
  data-api-key="YOUR_API_KEY_HERE"
  data-api-base="https://api.insertabot.io"
></script>
```

### For the landing page specifically:

Update `worker/src/html/landing.ts` line 56:

```typescript
<!-- Live Demo Widget -->
<script 
  src="${origin}/widget.js" 
  data-api-key="YOUR_REAL_API_KEY_HERE"
></script>
```

**Current issue:** The landing page uses a demo key `ib_sk_demo_REPLACE` which doesn't exist in your database. Replace it with a real API key or configure the demo customer via `scripts/setup-demo-customer.sql`.

---

## Step 6: Deploy Changes

```bash
# 1. Pull this branch
git checkout fix/cors-widget-config
git pull origin fix/cors-widget-config

# 2. Deploy to Cloudflare
cd worker
npm install
npm run deploy

# 3. Verify deployment
curl https://api.insertabot.io/health
```

---

## Troubleshooting

### Test 1: Check API Health

```bash
curl https://api.insertabot.io/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "checks": {
    "database": true,
    "tavily_configured": true,
    "timestamp": "2024-..."
  }
}
```

### Test 2: Check Widget Config

```bash
curl -H "X-API-Key: YOUR_API_KEY" \
     https://api.insertabot.io/v1/widget/config
```

**Expected response (after this fix):**
```json
{
  "primary_color": "#667eea",
  "position": "bottom-right",
  "greeting_message": "Hi! How can I help you today?",
  "bot_name": "Insertabot",
  "bot_avatar_url": null,
  "temperature": 0.7,
  "max_tokens": 500,
  "system_prompt": "You are a helpful AI assistant.",
  "placeholder_text": "Type your message...",
  "show_branding": true
}
```

### Test 3: Check CORS

```bash
curl -H "Origin: https://insertabot.io" \
     -H "X-API-Key: YOUR_API_KEY" \
     -v \
     https://api.insertabot.io/v1/widget/config
```

**Look for this header in response:**
```
Access-Control-Allow-Origin: https://insertabot.io
```

#### Automated CORS test script

There is a convenience script to run a preflight check plus simple GET/POST checks:

```bash
# Make it executable first: chmod +x scripts/test-cors.sh
# Usage: scripts/test-cors.sh [WORKER_URL] [ORIGIN] [API_KEY]
scripts/test-cors.sh https://api.insertabot.io https://your-site.example ib_sk_...
```

The script performs:
- OPTIONS preflight to `/v1/chat/completions` (verifies `Access-Control-Allow-Origin` is returned)
- GET `/v1/widget/config` with `X-API-Key`
- POST `/v1/chat/completions` with a small message payload

If any step fails, the script exits non-zero and prints the headers/body to help troubleshoot CORS or auth issues.


### Common Issues:

#### Issue: "Invalid API key"
**Solution:** 
- Verify API key exists in database
- Check customer status is 'active'
- Ensure you're using the correct API key format: `ib_sk_...`

#### Issue: "Origin not allowed"
**Solution:**
- Update `allowed_domains` in widget_configs table
- Ensure origin matches exactly (https vs http, with/without www)
- Redeploy after changing wrangler.toml

#### Issue: "Widget loads but doesn't respond"
**Solution:**
- Check browser console for errors
- Verify /v1/chat/completions endpoint is accessible
- Check rate limits in database

#### Issue: "Configuration error"
**Solution:**
- Run the SQL commands in Step 1 to add missing columns
- Verify widget_configs record exists
- Check all required fields have values

---

## Quick Fix Checklist

- [ ] Run SQL to add missing columns (Step 1)
- [ ] Verify widget config exists in database (Step 2)
- [ ] Update allowed_domains to include your site (Step 3)
- [ ] Get/verify your API key (Step 4)
- [ ] Update landing.ts with real API key (Step 5)
- [ ] Deploy changes to Cloudflare (Step 6)
- [ ] Test with curl commands (Troubleshooting section)
- [ ] Check browser console for errors
- [ ] Verify chatbot appears and responds

---

### Secrets & local testing 🔐

**Never commit real API keys or secrets to the repository.** Use these recommended patterns for local testing and worker secrets:

- **Set a local environment variable (temporary):**
  - DEMO_API_KEY=ib_sk_xxx ./scripts/test-cors.sh https://api.insertabot.io https://your-site.example $DEMO_API_KEY
  - Or interactively: `read -s DEMO_API_KEY; ./scripts/test-cors.sh <worker> <origin> $DEMO_API_KEY; unset DEMO_API_KEY`
- **Store secrets for your Worker runtime:**
  - `wrangler secret put DEMO_API_KEY` (enter key when prompted)
  - Refer to it in your Worker via `env.DEMO_API_KEY` (set in `wrangler.toml` or use dev vars)
- **If you committed a real key by accident:** rotate the key immediately and remove it from the repo history.

### Pre-commit secret scanning (recommended)

We've added a Node-based secret scanner using **secretlint** and **Husky** to prevent accidental commits of secrets, avoiding Python tooling.

- To initialize on your machine:
  1. Install dependencies: `npm ci` (or `npm install`).
  2. Install Husky hooks: `npm run prepare` (runs `husky install`).
  3. Optionally scan manually: `npm run scan:secrets`.

- CI integration:
  - A GitHub Action (`.github/workflows/pre-commit.yml`) runs `npm ci` and `npm run lint:secrets` on every push/PR and will fail the check if a secret is detected.

Note: If secretlint reports a false positive, update the config in `.secretlintrc.json` or add an exception using the secretlint rules. Review reported matches before committing.

---

## Still Not Working?

### Check Cloudflare Workers Logs:

```bash
cd worker
wrangler tail
```

Then try to load your site and watch for errors.

### Check Browser Console:

1. Open your site: https://insertabot.io/
2. Press F12 to open DevTools
3. Go to Console tab
4. Look for Insertabot errors
5. Look for CORS errors
6. Look for 401/403/404 errors

### Common Console Errors:

```
[Insertabot] Missing data-api-key attribute
→ Fix: Add data-api-key to script tag

[Insertabot] Failed to fetch config: 401
→ Fix: API key is invalid or customer is inactive

[Insertabot] Failed to fetch config: 403
→ Fix: Origin not in allowed_domains

CORS policy: No 'Access-Control-Allow-Origin' header
→ Fix: Update allowed_domains in database AND wrangler.toml
```

---

## Need More Help?

If you're still stuck:

1. Check the GitHub issues for similar problems
2. Run all the test commands and share the output
3. Share any error messages from browser console
4. Share any error messages from `wrangler tail`
