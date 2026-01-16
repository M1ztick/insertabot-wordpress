# Authentication & Security Implementation

## Overview

This document describes the comprehensive password and 2FA authentication system implemented for Insertabot. The system provides industry-standard security features including:

- **Password-based authentication** with PBKDF2 hashing
- **Two-Factor Authentication (2FA/TOTP)** compatible with Google Authenticator, Authy, etc.
- **Session management** with secure httpOnly cookies
- **Rate limiting** and account lockout protection
- **Password reset** functionality
- **Security audit logging** for compliance and incident response
- **Backup codes** for account recovery

## Architecture

### Core Modules

1. **[auth.ts](../worker/src/auth.ts)** - Password hashing, 2FA/TOTP, backup codes
2. **[session.ts](../worker/src/session.ts)** - Session creation, validation, management
3. **[security-audit.ts](../worker/src/security-audit.ts)** - Security event logging
4. **[auth-endpoints.ts](../worker/src/auth-endpoints.ts)** - API endpoint handlers

### Database Schema

The system adds the following tables and fields:

#### Extended `customers` table:
```sql
- password_hash TEXT
- password_salt TEXT
- totp_secret TEXT
- totp_enabled INTEGER (0 or 1)
- backup_codes TEXT (JSON array of hashed codes)
- password_reset_token TEXT
- password_reset_expires INTEGER
- last_login_at INTEGER
- failed_login_attempts INTEGER
- account_locked_until INTEGER
```

#### New `sessions` table:
```sql
CREATE TABLE sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT UNIQUE NOT NULL,
    customer_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    last_accessed_at INTEGER NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    is_valid INTEGER DEFAULT 1
);
```

#### New `security_audit_log` table:
```sql
CREATE TABLE security_audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    metadata TEXT
);
```

## Setup Instructions

### 1. Run Database Migration

Apply the database schema changes:

```bash
# For local D1 database
wrangler d1 execute DB --local --file=migrations/001_add_auth_fields.sql

# For production D1 database
wrangler d1 execute DB --file=migrations/001_add_auth_fields.sql
```

### 2. No Configuration Changes Required

The authentication system integrates seamlessly with the existing codebase. All endpoints are automatically available.

### 3. Test the System

1. **Sign up**: Visit `/signup` - now requires password
2. **Login**: Visit `/login` - requires email + password
3. **Enable 2FA**: After login, use the dashboard security settings
4. **Password reset**: Use `/reset-password` link

## API Endpoints

### Public Endpoints (No Authentication)

#### **POST /api/customer/login**
Login with email and password (with optional 2FA).

**Request:**
```json
{
  "email": "user@example.com",
  "password": "<your_password>",
  "totp_code": "<totp_code>",  // Optional, required if 2FA is enabled
  "backup_code": "<backup_code>"  // Alternative to totp_code
}
```

**Response (Success):**
```json
{
  "success": true,
  "session_id": "<session_id>",
  "message": "Login successful"
}
```

**Response (2FA Required):**
```json
{
  "success": false,
  "requires_2fa": true,
  "message": "Please provide your 2FA code"
}
```

#### **POST /api/auth/set-password**
Set password for an account (first-time setup).

**Request:**
```json
{
  "email": "user@example.com",
  "password": "<your_password>"
}
```

#### **POST /api/auth/password-reset-request**
Request a password reset token.

**Request:**
```json
{
  "email": "user@example.com"
}
```

#### **POST /api/auth/password-reset**
Reset password using token.

**Request:**
```json
{
  "token": "<reset_token>",
  "new_password": "<new_password>"
}
```

### Authenticated Endpoints (Require Session)

All authenticated endpoints require a valid session cookie or `Authorization: Session <session_id>` header.

#### **POST /api/auth/logout**
Invalidate the current session.

#### **POST /api/auth/change-password**
Change password (requires current password).

**Request:**
```json
{
  "current_password": "<current_password>",
  "new_password": "<new_password>"
}
```

#### **POST /api/auth/2fa/enable**
Generate 2FA secret and backup codes.

**Response:**
```json
{
  "success": true,
  "secret": "<base32_secret>",
  "qr_uri": "otpauth://totp/Insertabot:user@example.com?secret=<secret>",
  "backup_codes": ["<code1>", "<code2>", ...]
}
```

#### **POST /api/auth/2fa/verify**
Verify and activate 2FA with TOTP code.

**Request:**
```json
{
  "totp_code": "<totp_code>"
}
```

#### **POST /api/auth/2fa/disable**
Disable 2FA (requires password confirmation).

**Request:**
```json
{
  "password": "<your_password>"
}
```

## Password Requirements

The system enforces strong password requirements:

- ✅ Minimum 12 characters
- ✅ At least one uppercase letter (A-Z)
- ✅ At least one lowercase letter (a-z)
- ✅ At least one number (0-9)
- ✅ At least one special character (!@#$%^&*, etc.)
- ❌ No common passwords (password, 12345678, etc.)

## Security Features

### 1. Password Hashing
- Uses **PBKDF2** with SHA-256
- 100,000 iterations for strong key derivation
- Random salt per password
- Uses Web Crypto API for native implementation

### 2. Two-Factor Authentication (2FA)
- **TOTP-based** (Time-based One-Time Password)
- Compatible with Google Authenticator, Authy, 1Password, etc.
- 30-second time window
- ±1 window tolerance for clock drift
- QR code generation for easy enrollment

### 3. Backup Codes
- 8 backup codes generated during 2FA enrollment
- SHA-256 hashed before storage
- One-time use (removed after verification)
- For account recovery if 2FA device is lost

### 4. Session Management
- Secure httpOnly cookies (prevents XSS attacks)
- 24-hour expiration by default
- Sessions stored in database
- Automatic cleanup of expired sessions

### 5. Rate Limiting & Account Protection
- **5 failed login attempts** triggers account lock
- **15-minute lockout** period
- Prevents brute-force attacks
- Failed attempts counter resets on successful login

### 6. Security Audit Logging
Events logged:
- `login_success` / `login_failed` / `login_locked`
- `password_created` / `password_changed`
- `password_reset_requested` / `password_reset_completed`
- `2fa_enabled` / `2fa_disabled` / `2fa_verified` / `2fa_failed`
- `backup_code_used`
- `session_created` / `session_invalidated`
- `account_created` / `account_locked` / `account_unlocked`

Each event includes:
- Customer ID
- Timestamp
- IP address
- User agent
- Additional metadata

### 7. Password Reset Flow
1. User requests reset with email
2. System generates secure random token (64 bytes)
3. Token expires after 1 hour
4. User sets new password with valid token
5. All sessions invalidated after reset
6. Failed login attempts reset

## UI Components

### Updated Signup Page
- Password input with strength indicator
- Real-time validation of password requirements
- Visual feedback (weak/medium/strong)
- Auto-login after successful signup

### Updated Login Page
- Email + password authentication
- Conditional 2FA code input
- Backup code alternative
- "Forgot password?" link
- Session cookie-based authentication

### Dashboard Security Settings (To Be Implemented)
- Enable/disable 2FA
- View backup codes
- Change password
- View active sessions
- View security audit log
- Password strength requirements

## Migration Path

### For Existing Users Without Passwords

The system maintains backward compatibility:

1. **Legacy login** still works (email-only lookup returns API key)
2. Users are prompted to set a password on next login
3. `/api/auth/set-password` endpoint allows password creation
4. After password is set, legacy login is disabled for that account

### Recommended Migration Steps

1. Deploy the updated code
2. Run database migration
3. Send email to existing users: "We've added password security - please set your password"
4. Provide link to password setup page
5. After grace period, enforce password requirement

## Testing

### Manual Testing Checklist

- [ ] Sign up with strong password
- [ ] Sign up with weak password (should fail)
- [ ] Login with correct credentials
- [ ] Login with incorrect password (should fail)
- [ ] Login with correct password after 5 failed attempts (should be locked)
- [ ] Enable 2FA and scan QR code
- [ ] Login with password + 2FA code
- [ ] Login with password + backup code
- [ ] Disable 2FA
- [ ] Change password
- [ ] Request password reset
- [ ] Complete password reset
- [ ] Logout and verify session is invalid

### Security Testing

- [ ] Verify passwords are hashed (never stored in plain text)
- [ ] Verify sessions use httpOnly cookies
- [ ] Verify 2FA secrets are not exposed in API responses
- [ ] Verify backup codes are hashed
- [ ] Verify rate limiting works
- [ ] Verify TOTP codes from authenticator app work
- [ ] Verify expired sessions are rejected

## Security Best Practices

### For Administrators

1. **Monitor audit logs** regularly for suspicious activity
2. **Run session cleanup** periodically (already implemented)
3. **Enforce password complexity** (already enforced)
4. **Encourage 2FA adoption** for all users
5. **Keep backup codes** in a secure location

### For Users

1. **Use a strong, unique password**
2. **Enable 2FA** for added security
3. **Store backup codes** securely (password manager, printed copy)
4. **Don't share passwords** or 2FA codes
5. **Log out** from shared/public computers

## Troubleshooting

### "Account temporarily locked"
- Wait 15 minutes for automatic unlock
- Or contact support to manually unlock

### "Invalid 2FA code"
- Ensure device clock is synchronized
- Use backup code if authenticator app is unavailable
- System accepts codes ±30 seconds from current time

### "Password reset token expired"
- Tokens expire after 1 hour
- Request a new password reset

### Lost 2FA device
- Use one of the 8 backup codes
- Contact support if all backup codes are used

## Future Enhancements

Potential improvements:

- [ ] Email verification for signup
- [ ] Email notifications for security events
- [ ] Password reset via email (currently returns token for testing)
- [ ] WebAuthn/FIDO2 support (hardware keys)
- [ ] OAuth/SSO integration
- [ ] Admin dashboard for user management
- [ ] IP-based geolocation blocking
- [ ] Device fingerprinting
- [ ] Remember this device option
- [ ] Passwordless authentication (magic links)

## Compliance

This implementation supports:

- **GDPR**: Audit logs, right to erasure
- **PCI DSS**: Strong authentication, session management
- **SOC 2**: Access controls, audit logging
- **NIST 800-63B**: Password requirements, MFA

## Support

For questions or issues:
- Review security audit logs for failed login details
- Check database for account lock status
- Verify session validity in sessions table
- Review error logs for authentication failures

---

**Last Updated**: 2026-01-12
**Version**: 1.0
**Author**: Claude Code Assistant
