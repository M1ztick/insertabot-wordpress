# Stripe Integration Setup Guide

This guide walks you through setting up Stripe for the Insertabot Pro tier ($9.99/month unlimited messages).

## Step 1: Create Stripe Product

1. Go to [Stripe Dashboard](https://dashboard.stripe.com) → **Products**
2. Click **Add product**
3. Fill in:
   - **Name**: `Insertabot Pro`
   - **Description**: `Unlimited messages, priority support, faster responses`
   - **Pricing model**: `Recurring`
4. Click **Create product**

## Step 2: Create Pricing

In the product you just created:

1. Click **Add pricing**
2. Set:
   - **Price**: `9.99` USD
   - **Billing period**: `Monthly`
   - **Billing cycle**: `Month`
3. Click **Save product**

After saving, you'll see the **Price ID** displayed on the product page. It looks like: `price_1ABC123XYZ...`

**Save this Price ID** - you'll need it in Step 4.

## Step 3: Get Your Stripe Keys

1. In Stripe Dashboard, go to **Developers** → **API Keys**
2. You'll see two keys:
   - **Publishable key** (starts with `pk_live_` or `pk_test_`)
   - **Secret key** (starts with `sk_live_` or `sk_test_`)

**Important**: For testing, use **Test Mode** keys. When you're ready to go live, switch to live keys.

Save both keys - you'll need them in the next step.

## Step 4: Get Webhook Secret

1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Set:
   - **Endpoint URL**: `https://insertabot.io/v1/stripe/webhook`
   - **Events to send**: Select `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`
4. Click **Add endpoint**
5. You'll see a **Signing secret** displayed. It looks like: `whsec_1ABC123XYZ...`

**Save this signing secret** - you'll need it in Step 5.

## Step 5: Add Secrets to Wrangler

Run these commands in your terminal (replace the values with your actual keys):

```bash
cd /home/m1styk/Projects/Insertabot-AIGateway-Project-main/cloudflare-saas/worker

# Add your Stripe keys as secrets
wrangler secret put STRIPE_SECRET_KEY
# Paste: sk_live_... (or sk_test_... for testing)

wrangler secret put STRIPE_WEBHOOK_SECRET
# Paste: whsec_...

wrangler secret put STRIPE_PRO_PRICE_ID
# Paste: price_...
```

**Note**: Secrets are different from environment variables - they're encrypted and not visible in your config file.

## Step 6: Update wrangler.toml (Optional)

You can also add the publishable key as a regular environment variable (it's public, so it's safe):

```toml
[vars]
STRIPE_PUBLISHABLE_KEY = "pk_live_..."
```

## Step 7: Deploy

```bash
# From the worker directory
wrangler deploy
```

## Step 8: Test the Flow

### Test Checkout Endpoint

```bash
curl -X POST https://insertabot.io/v1/checkout \
  -H "Content-Type: application/json" \
  -H "X-API-Key: ib_sk_demo_12345678901234567890123456789012" \
  -d '{"email":"test@example.com"}' | jq .
```

You should get back a response with `sessionId` and `url`. Open the `url` in a browser to test the Stripe checkout.

### Test Subscription Status

```bash
curl https://insertabot.io/v1/subscription/status \
  -H "X-API-Key: ib_sk_demo_12345678901234567890123456789012" | jq .
```

You should get back:
```json
{
  "subscription_status": "none",
  "plan_type": "free",
  "is_pro": false
}
```

After completing a test checkout, this will change to show `is_pro: true`.

## Step 9: Test Webhook (Local Testing)

To test webhooks locally before deploying:

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Authenticate: `stripe login`
3. Forward webhooks: `stripe listen --forward-to localhost:8787/v1/stripe/webhook`
4. Use the webhook signing secret from the output
5. Trigger a test event: `stripe trigger payment_intent.succeeded`

## Testing Checklist

- [ ] Can create checkout session without errors
- [ ] Checkout URL redirects to Stripe payment page
- [ ] Can complete test payment with Stripe test card: `4242 4242 4242 4242`
- [ ] Subscription status updates to `is_pro: true` after payment
- [ ] Webhook handler successfully processes subscription events

## Stripe Test Cards

For testing in development:

- **Valid card**: `4242 4242 4242 4242`
- **Decline card**: `4000 0000 0000 0002`
- **Requires 3D Secure**: `4000 0025 0000 3155`

Use any future expiry date and any CVC.

## Live Mode

When ready to accept real payments:

1. Complete Stripe account verification (ID, business info, bank account)
2. Switch from Test keys to Live keys
3. Update `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` with live keys
4. Update webhook endpoint in Stripe Dashboard to your production URL
5. Redeploy: `wrangler deploy`

## FAQ

**Q: Can I test without a live Stripe account?**
A: Yes! Use Stripe's Test Mode (free) for all development. Switch to Live Mode only when you're ready to accept real payments.

**Q: What happens if webhook delivery fails?**
A: Stripe retries webhooks for 3 days. You can manually replay failed events in the Stripe Dashboard.

**Q: How do I handle failed payments?**
A: The webhook handler catches `payment_intent.payment_failed` events. You can extend `processWebhookEvent()` in `stripe.ts` to handle these.

**Q: Can I offer multiple tiers?**
A: Yes! Create multiple products/prices in Stripe, then add them to the checkout endpoint and subscription handling.
