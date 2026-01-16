# 🔒 Security Deployment Checklist

Use this checklist when deploying the password and 2FA authentication system.

## Pre-Deployment

### Code Review
- [ ] Review all authentication code in `worker/src/auth.ts`
- [ ] Review session management in `worker/src/session.ts`
- [ ] Review API endpoints in `worker/src/auth-endpoints.ts`
- [ ] Verify no passwords or secrets in code
- [ ] Check TypeScript compilation succeeds: `cd worker && npm run build`

### Documentation Review
- [ ] Read [AUTHENTICATION-SECURITY.md](docs/AUTHENTICATION-SECURITY.md)
- [ ] Read [SECURITY-QUICKSTART.md](docs/SECURITY-QUICKSTART.md)
- [ ] Understand migration process
- [ ] Know how to troubleshoot common issues

## Local Testing

### Database Migration
- [ ] Run local migration: `./scripts/run-auth-migration.sh local`
- [ ] Verify all tables created: `sessions`, `security_audit_log`
- [ ] Verify customers table has new columns
- [ ] Check for migration errors

### Local Worker Testing
- [ ] Start local worker: `cd worker && npm run dev`
- [ ] Test signup flow at `/signup`
  - [ ] Create account with strong password
  - [ ] Try weak password (should fail)
  - [ ] Verify password strength indicator works
  - [ ] Verify auto-login after signup
- [ ] Test login flow at `/login`
  - [ ] Login with correct credentials
  - [ ] Login with wrong password (should fail)
  - [ ] Verify 5 failed attempts locks account
  - [ ] Wait 15 minutes or reset lock manually
- [ ] Test 2FA enrollment
  - [ ] Access dashboard after login
  - [ ] Enable 2FA (will need UI or API call)
  - [ ] Scan QR code with authenticator app
  - [ ] Verify code from app
  - [ ] Save backup codes
- [ ] Test 2FA login
  - [ ] Logout
  - [ ] Login with password
  - [ ] Enter 2FA code when prompted
  - [ ] Try backup code
- [ ] Test password change
  - [ ] Use API endpoint to change password
  - [ ] Verify old password required
  - [ ] Verify all sessions invalidated
- [ ] Test password reset
  - [ ] Request reset
  - [ ] Get token from response (or database)
  - [ ] Reset password with token
  - [ ] Verify can login with new password

### Database Verification
- [ ] Check sessions table has entries after login
- [ ] Check security_audit_log has events
- [ ] Verify passwords are hashed (not plain text)
- [ ] Verify 2FA secrets are stored
- [ ] Verify backup codes are hashed

## Production Deployment

### Backup
- [ ] Backup current production database
- [ ] Export current customers table
- [ ] Document rollback procedure

### Migration
- [ ] Run production migration: `./scripts/run-auth-migration.sh production`
- [ ] Verify migration succeeded
- [ ] Check database schema changes applied
- [ ] No data loss occurred

### Deploy Worker
- [ ] Deploy to production: `cd worker && wrangler deploy`
- [ ] Verify deployment succeeded
- [ ] Check no errors in deployment logs

### Smoke Tests
- [ ] Visit production `/signup` page
- [ ] Create test account
- [ ] Login with test account
- [ ] Verify session cookie is set
- [ ] Access dashboard
- [ ] Logout and verify session cleared

### Security Verification
- [ ] HTTPS is enforced
- [ ] Cookies have Secure flag
- [ ] Cookies have HttpOnly flag
- [ ] Cookies have SameSite=Strict
- [ ] Session IDs are random UUIDs
- [ ] No sensitive data in client-side storage

## Post-Deployment

### Monitoring (First 24 Hours)
- [ ] Monitor error logs for auth failures
- [ ] Check security_audit_log for suspicious activity
- [ ] Verify users can sign up successfully
- [ ] Verify users can login successfully
- [ ] Monitor session creation rate
- [ ] Check for database errors

### User Communication
- [ ] Notify existing users about new security features
- [ ] Provide instructions for setting passwords
- [ ] Encourage 2FA adoption
- [ ] Share password reset instructions

### Database Maintenance
- [ ] Set up periodic session cleanup (old/expired sessions)
- [ ] Set up audit log cleanup (keep 90 days)
- [ ] Monitor database size growth

## Ongoing Security

### Weekly
- [ ] Review security audit logs
- [ ] Check for locked accounts
- [ ] Monitor failed login attempts
- [ ] Check for 2FA enrollment rate

### Monthly
- [ ] Review session patterns
- [ ] Analyze login failure patterns
- [ ] Update password blacklist if needed
- [ ] Review backup code usage

### Quarterly
- [ ] Security audit
- [ ] Review compliance requirements
- [ ] Update documentation
- [ ] Consider security enhancements

## Troubleshooting Quick Reference

### Issue: Users can't login
**Check:**
1. Account locked? Check `account_locked_until` in customers table
2. Password set? Check `password_hash` is not null
3. Session creation working? Check sessions table
4. Check security_audit_log for error details

### Issue: 2FA codes not working
**Check:**
1. Device clock synchronized?
2. Secret stored correctly? Check `totp_secret` in database
3. Code is 6 digits?
4. Try backup code instead

### Issue: Sessions not persisting
**Check:**
1. HTTPS being used? (required for Secure cookies)
2. Cookies enabled in browser?
3. Session not expired? Check `expires_at` in sessions table
4. Session marked valid? Check `is_valid = 1`

### Issue: Password reset not working
**Check:**
1. Token not expired? Check `password_reset_expires`
2. Token matches? Check `password_reset_token` in database
3. Check security_audit_log for password_reset events

## Rollback Procedure

If major issues occur:

1. **Immediate**: Restore previous worker version
   ```bash
   wrangler rollback
   ```

2. **Database**: Restore from backup
   ```bash
   # Restore customers table from backup
   wrangler d1 execute DB --file=backup.sql
   ```

3. **Verify**: Test core functionality still works

4. **Investigate**: Review logs to understand issue

5. **Fix**: Address issue and re-deploy

## Emergency Contacts

- Database admin: _____________
- Security team: _____________
- On-call engineer: _____________

## Success Criteria

Deployment is successful when:
- ✅ Users can sign up with passwords
- ✅ Users can login with passwords
- ✅ 2FA enrollment works
- ✅ 2FA login works
- ✅ Password reset works
- ✅ Sessions persist correctly
- ✅ Account lockout works
- ✅ Security logs are populated
- ✅ No critical errors in logs
- ✅ Performance is acceptable

## Sign-Off

- [ ] **Deployed by**: _________________ Date: _________
- [ ] **Tested by**: _________________ Date: _________
- [ ] **Approved by**: _________________ Date: _________

---

**Keep this checklist for future reference and security audits.**
