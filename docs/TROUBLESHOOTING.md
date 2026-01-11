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
