-- Rollback: Remove Email Verification Fields

-- Drop index
DROP INDEX IF EXISTS idx_customers_verification_token;

-- Remove columns (SQLite doesn't support DROP COLUMN directly, so we recreate the table)
-- For development rollback only - in production, keep a backup before running
-- This is a destructive operation

-- Note: SQLite requires table recreation to drop columns
-- If you need to rollback in production, consult the backup strategy first
