# 🔌 Customer Integration Guide

This guide explains how your customers can embed Insertabot on their websites.

## For SaaS Customers (B2B)

If you're selling Insertabot as a white-label chatbot service, your customers will embed the widget on their websites using their unique API key.

### Customer Onboarding Flow

1. **You create a customer account:**

   ```bash
   cd /home/m1styk/Projects/Insertabot-AIGateway-Project-main/cloudflare-saas
   node scripts/add-customer.js
   ```

2. **Customer receives:**
   - Unique API key (e.g., `ib_sk_customer_abc123...`)
   - Dashboard access (future feature)
   - Integration instructions (this guide)

3. **Customer customizes their widget:**
   - Brand colors
   - Bot name & avatar
   - Greeting message
   - System prompt

4. **Customer embeds on their website**

## Integration Methods

### Method 1: Inline Script (Recommended)

The easiest way for customers to integrate. They copy/paste this into their HTML:

```html
<!DOCTYPE html>
<html>
<head>
    <title>My Website</title>
</head>
<body>
    <!-- Your customer's website content -->
    <h1>Welcome to My Business</h1>
    
    <!-- Insertabot Widget - Add before closing </body> tag -->
    <script data-api-key="CUSTOMER_API_KEY_HERE">
    (function() {
        const script = document.currentScript;
        const apiKey = script?.getAttribute("data-api-key");
        const apiBase = script?.getAttribute("data-api-base") || "https://insertabot.io";
        
        // Widget code goes here
        // See /widget/insertabot.js for full implementation
        
        if (!apiKey) {
            console.error("[Insertabot] Missing API key");
            return;
        }
        
        // Initialize widget
        // (Full widget code should be copied from insertabot.js)
    })();
    </script>
</body>
</html>
```

### Method 2: External Script (Future - Requires CDN Hosting)

Once you host the widget on a CDN, customers can use:

```html
<script
    src="https://cdn.insertabot.io/widget.js"
    data-api-key="CUSTOMER_API_KEY_HERE">
</script>
```

**Status:** Not yet implemented. Requires:

- Hosting `insertabot.js` on Cloudflare Pages or R2
- Setting up CDN distribution
- Versioning strategy

## Widget Customization

Each customer can customize their widget through the database:

```sql
-- Example: Update widget config for a customer
UPDATE widget_configs 
SET 
    primary_color = '#FF6B6B',
    bot_name = 'SupportBot',
    greeting_message = 'Hi! How can I help you today?',
    bot_avatar_url = 'https://customer-site.com/bot-avatar.png'
WHERE customer_id = 'cust_abc123';
```

### Customizable Properties

- **Visual:**
  - `primary_color` - Main brand color (hex code)
  - `position` - `bottom-right` or `bottom-left`
  - `bot_avatar_url` - URL to bot avatar image
  - `bot_name` - Display name for the bot

- **Behavior:**
  - `greeting_message` - First message shown to users
  - `system_prompt` - AI personality and instructions
  - `temperature` - AI creativity (0.0 - 2.0)
  - `max_tokens` - Response length limit
  - `model` - AI model to use

## Customer Dashboard (Future Feature)

You can build a dashboard where customers can:

1. **Customize widget** - Visual settings, messages, behavior
2. **View analytics** - Message volume, user engagement
3. **Manage subscription** - Upgrade/downgrade plans
4. **Access support** - Help docs, contact support
5. **Export data** - Download conversation transcripts

### Quick Dashboard Setup

Create a new route in `index.ts`:

```typescript
// Customer dashboard endpoint
if (url.pathname === '/dashboard' && request.method === 'GET') {
    // Verify API key
    const apiKey = getApiKey(request);
    const customer = await getCustomerConfig(env.DB, apiKey);
    
    // Serve dashboard HTML
    return new Response(dashboardHTML, {
        headers: { 'Content-Type': 'text/html' }
    });
}
```

## Example Customer Websites

Here's how different types of businesses would use Insertabot:

### E-commerce Store

```html
<!-- Shopify, WooCommerce, etc. -->
<script data-api-key="ib_sk_store_xyz123">
    // Widget configured for:
    // - Product recommendations
    // - Order tracking
    // - Customer support
</script>
```

### SaaS Company

```html
<!-- Help documentation site -->
<script data-api-key="ib_sk_saas_abc456">
    // Widget configured for:
    // - Feature explanations
    // - Troubleshooting
    // - Onboarding assistance
</script>
```

### Restaurant

```html
<!-- Restaurant website -->
<script data-api-key="ib_sk_restaurant_def789">
    // Widget configured for:
    // - Menu questions
    // - Reservation info
    // - Hours and location
</script>
```

## Testing Customer Integration

### Test on Local Development

Customer can test locally:

```bash
# Create a test HTML file
cat > test.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Widget Test</title>
</head>
<body>
    <h1>Testing Insertabot</h1>
    <script
        data-api-key="ib_sk_demo_12345678901234567890123456789012"
        data-api-base="https://insertabot.io">
        // Widget code here
    </script>
</body>
</html>
EOF

# Serve locally
python3 -m http.server 8000

# Open http://localhost:8000/test.html
```

### Test API Endpoints

Verify customer's API key works:

```bash
# Get widget config
curl -H "X-API-Key: CUSTOMER_API_KEY" \
    https://insertabot.io/v1/widget/config | jq .

# Test chat
curl -X POST \
    -H "Content-Type: application/json" \
    -H "X-API-Key: CUSTOMER_API_KEY" \
    -d '{"messages":[{"role":"user","content":"Test"}]}' \
    https://insertabot.io/v1/chat/completions | jq .
```

## Rate Limits Per Plan

Inform customers of their limits:

### Free Plan

- 100 messages/hour
- 1,000 messages/day
- Standard AI model
- Basic customization

### Pro Plan ($9.99/month)

- 1,000 messages/hour
- 10,000 messages/day
- Advanced AI model
- Full customization
- Priority support

### Enterprise Plan (Custom)

- Unlimited messages
- Dedicated infrastructure
- Custom AI training
- White-label branding
- SLA guarantee

## Troubleshooting for Customers

### Widget Not Appearing

1. **Check API key:** Verify it's correct and active
2. **Check console:** Look for errors in browser dev tools
3. **Check CORS:** Ensure customer's domain is allowed
4. **Check placement:** Script should be before `</body>`

### Slow Responses

1. **Check rate limits:** Customer may have hit their limit
2. **Check network:** Test API endpoint directly
3. **Upgrade plan:** More resources on Pro/Enterprise

### Incorrect Branding

1. **Update widget config:** Change colors/messages in database
2. **Clear cache:** Customer may need to hard refresh
3. **Check API key:** Ensure using correct customer's key

## Support for Your Customers

### Documentation Links

- Integration guide: This document
- API reference: `API-REFERENCE.md` (create this)
- Troubleshooting: `TROUBLESHOOTING.md` (create this)

### Support Channels

- Email: <support@insertabot.io> (set this up)
- Chat: Use Insertabot on your own site! (dogfooding)
- Docs: <https://docs.insertabot.io> (build this)

## Multi-Tenant Architecture

Your platform supports multiple customers simultaneously:

```
Customer A (ecommerce.com)
  ├─ API Key: ib_sk_customer_a_123
  ├─ Widget Config: Blue theme, "ShopBot"
  └─ Rate Limit: Pro tier (10k/day)

Customer B (saas-app.com)
  ├─ API Key: ib_sk_customer_b_456
  ├─ Widget Config: Green theme, "HelpBot"
  └─ Rate Limit: Free tier (1k/day)

Customer C (restaurant.com)
  ├─ API Key: ib_sk_customer_c_789
  ├─ Widget Config: Red theme, "MenuBot"
  └─ Rate Limit: Enterprise (unlimited)
```

Each customer:

- Has isolated data
- Gets their own branding
- Pays separately
- Has independent rate limits

## Revenue Model

When selling to B2B customers:

**Free Tier (Lead Magnet)**

- Free forever
- 1,000 messages/day
- Basic features
- "Powered by Insertabot" badge

**Pro Tier ($49/month)**

- 10,000 messages/day
- Full customization
- Remove branding
- Priority support
- Analytics dashboard

**Enterprise Tier (Custom)**

- Unlimited messages
- Dedicated resources
- Custom AI training
- SLA guarantee
- White-label resale rights

## Scaling Considerations

As you add more customers:

1. **Database:** D1 free tier supports 5M reads/day
2. **Workers:** Free tier supports 100k requests/day
3. **AI:** Free tier supports ~1k AI messages/day total

**When to upgrade:**

- 10+ customers → Consider Workers Paid ($5/month)
- 100+ customers → Definitely need Workers Paid
- 1000+ customers → Consider dedicated infrastructure

## Summary

**For Direct Users (B2C):**

- They use YOUR website (insertabot.io)
- They chat directly on your landing page
- They pay YOU for Pro access

**For Customers (B2B SaaS):**

- They embed YOUR widget on THEIR websites
- They customize it with THEIR branding
- They pay YOU monthly for the service
- Their users chat on THEIR sites

**You can do BOTH:**

- Run B2C (users on your site) AND
- Run B2B (sell to other businesses)
- Same infrastructure, different use cases

---

Your platform is **fully multi-tenant** and ready for both models! 🚀
