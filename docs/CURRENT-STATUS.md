# 🎯 Current Project Status

**Last Updated:** November 3, 2025

## ✅ What's Deployed

- **Live URLs:**
  - <https://insertabot-api.mistykmedia.workers.dev>
  - <https://insertabot.io>
- **AI Provider:** Cloudflare Workers AI (FREE tier - @cf/meta/llama-3.1-8b-instruct)
- **Database:** D1 Production (insertabot-production)
- **Demo Customer:** `ib_sk_demo_12345678901234567890123456789012`
- **Payment Processing:** Stripe integration ready (needs API keys to activate)

## 🚀 Quick Deploy Command

```bash
cd /home/m1styk/Projects/Insertabot-AIGateway-Project-main/cloudflare-saas/worker
npx wrangler deploy --legacy-env false
```

## 📡 Available Endpoints

- **Landing Page:** <https://insertabot-api.mistykmedia.workers.dev/>
  - Dark mode design
  - Live chatbot demo in bottom-right corner
  
- **Health Check:** <https://insertabot-api.mistykmedia.workers.dev/health>
  
- **Widget Config:** <https://insertabot-api.mistykmedia.workers.dev/v1/widget/config>
  - Requires: `X-API-Key` header
  
- **Chat Completions:** <https://insertabot-api.mistykmedia.workers.dev/v1/chat/completions>
  - Requires: `X-API-Key` header
  - Supports streaming (SSE)

## 🔑 Secrets Configured

```bash
# View current secrets
wrangler secret list

# Current secrets (set when Stripe account is ready):
# - STRIPE_SECRET_KEY (not yet set)
# - STRIPE_PUBLISHABLE_KEY (not yet set)
# - STRIPE_WEBHOOK_SECRET (not yet set)
# - STRIPE_PRO_PRICE_ID (not yet set)
```

## 🗄️ Database Info

**Production Database:**

- ID: `3d7d004d-ed6c-486c-a51e-a59f51bcd307`
- Name: `insertabot-production`

**Demo Customer:**

- ID: `cust_demo_001`
- Name: Mistyk Media
- API Key: `ib_sk_demo_12345678901234567890123456789012`

**Query Database:**

```bash
npx wrangler d1 execute insertabot-production --remote --command "SELECT * FROM customers;"
```

## 🧪 Quick Test Commands

```bash
# Test health
curl https://insertabot-api.mistykmedia.workers.dev/health | jq .

# Test widget config
curl -H "X-API-Key: ib_sk_demo_12345678901234567890123456789012" \
     https://insertabot.io/v1/widget/config | jq .

# Test chat (non-streaming)
curl -X POST \
  -H "Content-Type: application/json" \
  -H "X-API-Key: ib_sk_demo_12345678901234567890123456789012" \
  -d '{"messages":[{"role":"user","content":"Hello!"}],"stream":false}' \
  https://insertabot.io/v1/chat/completions | jq .
```

## 🎨 Widget Demo

**Local Demo Server:**

```bash
cd /home/m1styk/Projects/Insertabot-AIGateway-Project-main/cloudflare-saas/widget
python3 -m http.server 8080
# Open: http://localhost:8080/demo.html
```

## 📝 Recent Changes

1. ✅ **Switched to Cloudflare Workers AI** - Now using FREE AI models (no API costs!)
2. ✅ **Streaming responses working** - OpenAI-compatible SSE format
3. ✅ **Free tier message counter** - 50 messages/day limit with localStorage tracking
4. ✅ **Three-tier pricing display** - Free ($0), Pro ($9.99/mo), Enterprise (Custom)
5. ✅ **Complete Stripe integration**:
   - Checkout endpoint (`/v1/checkout`) for Pro signups
   - Webhook handler (`/v1/stripe/webhook`) for subscription events
   - Subscription status endpoint (`/v1/subscription/status`)
   - Database schema with Stripe fields (stripe_customer_id, subscription_id, etc.)
6. ✅ **Upgrade modal** - Appears after 50 daily messages with CTA to upgrade
7. ✅ **Consumer-friendly landing page** - Clear value prop, live demo, pricing
8. ✅ **Dark mode design** - Professional aesthetic throughout

## 🔄 Update System Prompt

```bash
npx wrangler d1 execute insertabot-production --remote --command \
  "UPDATE widget_configs SET system_prompt = 'Your new prompt here' WHERE customer_id = 'cust_demo_001';"
```

## 📊 View Deployments

```bash
wrangler deployments list
```

## 🛠️ Common Tasks

### Make Code Changes

1. Edit files in `/worker/src/`
2. Test locally if needed
3. Deploy: `npx wrangler deploy --legacy-env false`

### Update Widget Configuration

```bash
# Query current config
npx wrangler d1 execute insertabot-production --remote --command \
  "SELECT * FROM widget_configs WHERE customer_id = 'cust_demo_001';"

# Update specific fields
npx wrangler d1 execute insertabot-production --remote --command \
  "UPDATE widget_configs SET primary_color = '#8b5cf6' WHERE customer_id = 'cust_demo_001';"
```

### Check Logs

```bash
wrangler tail
```

## 💳 Stripe Integration Status

The backend is ready! To activate payments:

1. **Set up Stripe account** (if you haven't already)
2. **Create Pro product and price** ($9.99/month)
3. **Add Stripe secrets** to Wrangler (see [STRIPE-SETUP.md](STRIPE-SETUP.md))
4. **Deploy** with `wrangler deploy`
5. **Test checkout flow** using the test guide in STRIPE-SETUP.md

For detailed instructions, see [STRIPE-SETUP.md](STRIPE-SETUP.md).

## 🎯 Next Steps

**Immediate (Ready to activate):**

- [x] Set up custom domain (insertabot.io) ✅
- [x] 50-message free tier with upgrade modal ✅
- [x] Three-tier pricing display ✅
- [x] Stripe integration backend ✅
- [x] Set up custom domain (insertabot.io) ✅
- [ ] **Create Stripe account and add API keys** (see [STRIPE-SETUP.md](STRIPE-SETUP.md))
- [ ] Test checkout flow with Stripe test cards
- [ ] Deploy with Stripe secrets configured

**Short-term (after getting first users):**

- [ ] Add quick-prompt suggestion buttons to widget
- [ ] Setup basic conversion tracking (page views, upgrade clicks)
- [ ] Create customer testimonials section
- [ ] Add FAQ section to landing page
- [ ] Set up email capture for waitlist/newsletter

**Future enhancements:**

- [ ] Host widget on CDN (Cloudflare Pages)
- [ ] Add more customers to database
- [ ] Implement RAG/vector search as Pro feature
- [ ] Add usage analytics dashboard
- [ ] Set up monitoring/alerts
- [ ] Build admin panel for customer management
- [ ] Add referral program
- [ ] Implement web search as premium feature

## 📞 Need Help?

- Check logs: `wrangler tail`
- View errors: Check Cloudflare Dashboard → Workers → insertabot-api → Logs
- Test endpoint: Use curl commands above
