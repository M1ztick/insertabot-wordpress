-- Rollback Migration: Remove Password and 2FA Authentication
-- Description: Removes authentication fields and tables if rollback is needed
-- Date: 2026-01-12
-- WARNING: This will remove all authentication data!

-- Drop new tables
DROP TABLE IF EXISTS security_audit_log;
DROP TABLE IF EXISTS sessions;

-- Remove authentication columns from customers table
-- Note: SQLite doesn't support DROP COLUMN, so we recreate the table

-- Create backup of customers table
CREATE TABLE customers_backup AS SELECT 
    customer_id,
    email,
    company_name,
    api_key,
    plan_type,
    status,
    rate_limit_per_hour,
    rate_limit_per_day,
    rag_enabled,
    stripe_customer_id,
    subscription_id,
    subscription_status,
    created_at,
    updated_at
FROM customers;

-- Drop original customers table
DROP TABLE customers;

-- Recreate customers table without auth fields
CREATE TABLE customers (
    customer_id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    company_name TEXT NOT NULL,
    api_key TEXT UNIQUE NOT NULL,
    plan_type TEXT DEFAULT 'free',
    status TEXT DEFAULT 'active',
    rate_limit_per_hour INTEGER DEFAULT 5,
    rate_limit_per_day INTEGER DEFAULT 20,
    rag_enabled INTEGER DEFAULT 0,
    stripe_customer_id TEXT,
    subscription_id TEXT,
    subscription_status TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

-- Restore data from backup
INSERT INTO customers SELECT * FROM customers_backup;

-- Drop backup table
DROP TABLE customers_backup;

-- Recreate indexes
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_api_key ON customers(api_key);
CREATE INDEX idx_customers_status ON customers(status);