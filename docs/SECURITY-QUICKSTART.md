# Security Features - Quick Start Guide

## 🎯 What's New

Your Insertabot installation now includes enterprise-grade security features:

- ✅ **Password Authentication** - Secure password-based login with PBKDF2 hashing
- ✅ **Two-Factor Authentication (2FA)** - TOTP-based 2FA compatible with Google Authenticator, Authy
- ✅ **Session Management** - Secure httpOnly cookies for session handling
- ✅ **Account Protection** - Rate limiting and automatic account lockout
- ✅ **Password Reset** - Secure password recovery flow
- ✅ **Security Audit Logs** - Comprehensive logging of all security events
- ✅ **Backup Codes** - Recovery codes for 2FA

## 🚀 Quick Setup (5 minutes)

### Step 1: Run Database Migration

```bash
# For local development
./scripts/run-auth-migration.sh local

# For production
./scripts/run-auth-migration.sh production
```

### Step 2: Deploy (if production)

```bash
cd worker
wrangler deploy
```

### Step 3: Test It!

1. Visit `/signup` - create account with password
2. Login at `/login` with email + password
3. Access dashboard with session-based auth

**That's it!** 🎉 Your authentication system is ready.

## 🔐 For End Users

### Creating an Account

1. Go to `/signup`
2. Enter email, company name, and a strong password
3. Password must have:
   - At least 12 characters
   - One uppercase letter
   - One lowercase letter
   - One number
   - One special character

### Logging In

1. Go to `/login`
2. Enter your email and password
3. If you have 2FA enabled, enter your 6-digit code

### Enabling 2FA (Recommended!)

1. Login to your dashboard
2. Go to Security Settings
3. Click "Enable 2FA"
4. Scan the QR code with your authenticator app
5. Enter the 6-digit code to verify
6. **Save your 8 backup codes** in a secure place!

### If You Forget Your Password

1. Go to `/login`
2. Click "Forgot password?"
3. Enter your email
4. Check your email for reset link (or get token from admin)
5. Set your new password

## 📊 For Administrators

### View Security Logs

Query the `security_audit_log` table:

```sql
-- Recent login attempts
SELECT * FROM security_audit_log
WHERE event_type LIKE 'login%'
ORDER BY timestamp DESC
LIMIT 50;

-- Failed 2FA attempts
SELECT * FROM security_audit_log
WHERE event_type = '2fa_failed'
ORDER BY timestamp DESC;

-- Account locks
SELECT * FROM security_audit_log
WHERE event_type = 'login_locked'
ORDER BY timestamp DESC;
```

### Unlock a Locked Account

```sql
UPDATE customers
SET failed_login_attempts = 0,
    account_locked_until = NULL
WHERE email = 'user@example.com';
```

### View Active Sessions

```sql
SELECT s.*, c.email
FROM sessions s
JOIN customers c ON s.customer_id = c.customer_id
WHERE s.is_valid = 1
  AND s.expires_at > unixepoch('now')
ORDER BY s.last_accessed_at DESC;
```

### Invalidate All Sessions for a User

```sql
UPDATE sessions
SET is_valid = 0
WHERE customer_id = (
  SELECT customer_id FROM customers WHERE email = 'user@example.com'
);
```

## 🧪 Testing Checklist

- [ ] Sign up with strong password works
- [ ] Sign up with weak password fails
- [ ] Login with correct credentials works
- [ ] Login with wrong password fails
- [ ] Account locks after 5 failed attempts
- [ ] 2FA enrollment creates QR code
- [ ] 2FA login with authenticator code works
- [ ] Backup codes work
- [ ] Password change works
- [ ] Password reset works
- [ ] Logout invalidates session
- [ ] Session expires after 24 hours

## 🔧 Troubleshooting

### Problem: "Account temporarily locked"
**Solution:** Wait 15 minutes or run the unlock SQL query above.

### Problem: "Invalid 2FA code"
**Solutions:**
- Check device clock is synchronized
- Use a backup code instead
- Codes are valid for ±30 seconds

### Problem: Session not persisting
**Check:**
- Cookies are enabled in browser
- HTTPS is being used (required for secure cookies)
- `session_id` cookie is being set

### Problem: Password validation failing
**Check:**
- Password meets all requirements (12+ chars, upper, lower, number, special)
- No common words like "password", "123456"

## 📚 Full Documentation

For complete details, see [AUTHENTICATION-SECURITY.md](./AUTHENTICATION-SECURITY.md)

## 🆘 Support

Need help?
1. Check security audit logs for error details
2. Review [AUTHENTICATION-SECURITY.md](./AUTHENTICATION-SECURITY.md)
3. Open an issue on GitHub

---

**Security Tip:** Always enable 2FA for production accounts! 🔒
