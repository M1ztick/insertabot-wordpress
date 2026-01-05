# CORS Whitelabeling

## Overview

Insertabot implements customer-specific CORS (Cross-Origin Resource Sharing) whitelabeling to ensure that each customer's chatbot widget only accepts requests from their authorized domains.

## How It Works

### 1. Database Configuration

Each customer has an `allowed_domains` field in their `widget_configs` table that stores a comma-separated list of allowed origins:

```sql
-- Example: Allow specific domains
allowed_domains = 'https://example.com,https://www.example.com'

-- Example: Allow all subdomains
allowed_domains = '*.example.com'

-- Example: Allow all origins (development only)
allowed_domains = '*'
```

### 2. Request Flow

1. **Request arrives** with an `Origin` header
2. **API key validation** - System identifies the customer
3. **Fetch widget config** - Retrieves customer's `allowed_domains`
4. **Origin validation** - Checks if request origin matches allowed domains
5. **CORS headers applied** - Response includes appropriate CORS headers

### 3. Origin Validation Rules

The `isOriginAllowed()` function supports:

- **Exact match**: `https://example.com` matches only `https://example.com`
- **Wildcard subdomains**: `*.example.com` matches `https://app.example.com`, `https://www.example.com`, etc.
- **Wildcard all**: `*` matches any origin (use only in development)

### 4. Production Safety

In production environments (`ENVIRONMENT=production`), the global `CORS_ORIGINS` environment variable is validated to ensure it doesn't contain wildcards:

```typescript
// This will throw an error in production
CORS_ORIGINS="*"  // ❌ Not allowed

// This is correct
CORS_ORIGINS="https://insertabot.io"  // ✅ Allowed
```

## Configuration

### For Customers

When creating or updating a customer's widget configuration, set the `allowed_domains` field:

```javascript
// Using the add-customer script
await updateWidgetConfig(db, customerId, {
  allowed_domains: 'https://mysite.com,https://www.mysite.com'
});
```

### Environment Variables

Set the global CORS configuration in `wrangler.toml`:

```toml
[env.production.vars]
ENVIRONMENT = "production"
CORS_ORIGINS = "https://insertabot.io"

[env.development.vars]
ENVIRONMENT = "development"
CORS_ORIGINS = "*"
```

## Security Benefits

1. **Prevents unauthorized access** - Only whitelisted domains can use the API
2. **Per-customer isolation** - Each customer controls their own allowed domains
3. **Subdomain support** - Flexible wildcard patterns for complex setups
4. **Production enforcement** - Wildcards blocked in production

## Testing

### Test CORS with curl

```bash
# Should succeed (if domain is whitelisted)
curl -H "Origin: https://example.com" \
     -H "X-API-Key: your_api_key" \
     -X OPTIONS \
     https://api.insertabot.io/v1/chat/completions

# Should fail with 403
curl -H "Origin: https://unauthorized.com" \
     -H "X-API-Key: your_api_key" \
     -X OPTIONS \
     https://api.insertabot.io/v1/chat/completions
```

### Update Allowed Domains

```sql
-- Update via SQL
UPDATE widget_configs 
SET allowed_domains = 'https://newdomain.com,*.example.com'
WHERE customer_id = 'cust_123';
```

## Best Practices

1. **Be specific** - List exact domains rather than using wildcards
2. **Include all variants** - Add both `www` and non-`www` versions
3. **Use HTTPS** - Always specify `https://` in production
4. **Test thoroughly** - Verify CORS works from all your domains
5. **Update regularly** - Keep the list current as domains change

## Troubleshooting

### "Origin not allowed" error

- Check the `allowed_domains` field in `widget_configs` table
- Verify the origin header matches exactly (including protocol and port)
- Ensure wildcards are formatted correctly (`*.domain.com`, not `*domain.com`)

### CORS headers not appearing

- Verify the request includes an `Origin` header
- Check that the API key is valid
- Ensure the customer's widget config exists

### Wildcard not working in production

- This is intentional - wildcards are blocked in production for security
- Use specific domain names instead
