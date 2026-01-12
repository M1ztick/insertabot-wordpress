-- Migration: Add Password and 2FA Authentication
-- Description: Adds password hashing, 2FA/TOTP, and session management to the system
-- Date: 2026-01-12

-- Add authentication fields to customers table
ALTER TABLE customers ADD COLUMN password_hash TEXT;
ALTER TABLE customers ADD COLUMN password_salt TEXT;
ALTER TABLE customers ADD COLUMN totp_secret TEXT;
ALTER TABLE customers ADD COLUMN totp_enabled INTEGER DEFAULT 0;
ALTER TABLE customers ADD COLUMN backup_codes TEXT; -- JSON array of hashed backup codes
ALTER TABLE customers ADD COLUMN password_reset_token TEXT;
ALTER TABLE customers ADD COLUMN password_reset_expires INTEGER;
ALTER TABLE customers ADD COLUMN last_login_at INTEGER;
ALTER TABLE customers ADD COLUMN failed_login_attempts INTEGER DEFAULT 0;
ALTER TABLE customers ADD COLUMN account_locked_until INTEGER;

-- Create sessions table for secure session management
CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT UNIQUE NOT NULL,
    customer_id TEXT NOT NULL,

    -- Session data
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    last_accessed_at INTEGER NOT NULL,

    -- Security metadata
    ip_address TEXT,
    user_agent TEXT,
    is_valid INTEGER DEFAULT 1,

    -- Index for efficient lookups
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE
);

CREATE INDEX idx_sessions_session_id ON sessions(session_id);
CREATE INDEX idx_sessions_customer_id ON sessions(customer_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

-- Create audit log for security events
CREATE TABLE IF NOT EXISTS security_audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id TEXT NOT NULL,
    event_type TEXT NOT NULL, -- login_success, login_failed, password_changed, 2fa_enabled, etc.
    timestamp INTEGER NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    metadata TEXT, -- JSON for additional context

    FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE
);

CREATE INDEX idx_audit_customer_timestamp ON security_audit_log(customer_id, timestamp);
CREATE INDEX idx_audit_event_type ON security_audit_log(event_type);
