# Security Policy

## Supported Versions

Insertabot is currently in active development. We support the latest production version deployed at insertabot.io.

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x (current) | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

### How to Report

Send a detailed report to **security@insertabot.io** or **admin@mistykmedia.io** with:

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Any proof-of-concept code (if applicable)

### What to Expect

- **Initial Response**: Within 48 hours
- **Status Updates**: Weekly until resolved
- **Resolution Timeline**: 
  - Critical vulnerabilities: 7 days
  - High severity: 14 days
  - Medium/Low severity: 30 days

### In Scope

Security issues in:
- API authentication and authorization
- Data leakage or unauthorized access
- Stripe payment handling
- XSS, CSRF, or injection vulnerabilities
- Rate limiting bypass
- Sensitive data exposure

### Out of Scope

- Social engineering attacks
- Physical security
- Denial of service attacks (DDoS)
- Issues in third-party dependencies (report to upstream)

## Security Features

Insertabot implements:
- API key authentication
- Rate limiting (100 req/min per IP)
- CORS protection
- Input validation and sanitization
- Secure Stripe webhook verification
- Encrypted data transmission (HTTPS only)

## Bug Bounty

We don't currently offer a bug bounty program, but we deeply appreciate responsible disclosure and will credit researchers (with permission) in our acknowledgments.

## Questions?

For non-security questions, contact us at support@insertabot.io
