-- Migration: Add Email Verification Fields
-- This adds email verification tracking to the customers table

-- Add email verification columns
ALTER TABLE customers ADD COLUMN email_verified BOOLEAN DEFAULT 0;
ALTER TABLE customers ADD COLUMN email_verification_token TEXT;
ALTER TABLE customers ADD COLUMN email_verification_expires INTEGER; -- Unix timestamp
ALTER TABLE customers ADD COLUMN email_verification_sent_at INTEGER; -- Unix timestamp for rate limiting

-- Create index for verification token lookups
CREATE INDEX IF NOT EXISTS idx_customers_verification_token ON customers(email_verification_token);

-- Mark existing customers as verified (grandfather them in)
UPDATE customers SET email_verified = 1 WHERE email_verified IS NULL OR email_verified = 0;
