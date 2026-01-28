#!/bin/bash

# Apply All Pending Migrations Script
# Runs all migration files in order to bring database up to date
#
# Usage:
#   ./scripts/apply-all-migrations.sh production

set -e  # Exit on error

ENVIRONMENT="${1:-production}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
WORKER_DIR="$PROJECT_DIR/worker"
MIGRATION_DIR="$PROJECT_DIR/worker/migrations"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_info "🔄 Insertabot Database Migration Tool"
log_info "======================================"
echo ""
log_info "Environment: $ENVIRONMENT"
echo ""

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    log_error "wrangler CLI not found"
    echo "Install it with: npm install -g wrangler"
    exit 1
fi

# Determine database name based on environment
if [ "$ENVIRONMENT" = "production" ]; then
    DB_NAME="insertabot-production"
    log_warning "⚠️  WARNING: You are about to modify the PRODUCTION database!"
    echo ""
    read -p "Are you sure you want to continue? (yes/no): " -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        log_error "Migration cancelled"
        exit 1
    fi
else
    log_error "Invalid environment. Use: production"
    exit 1
fi

log_info "📋 Database setup steps:"
echo ""
echo "  1. Base schema (schema.sql)"
echo "  2. Migration 001: Add auth fields"
echo "  3. Migration 002: Add email verification"
echo ""

# First, check if base schema is needed
log_info "🔍 Checking if base schema is already applied..."
cd "$WORKER_DIR"

# Try to query the customers table to see if it exists
if wrangler d1 execute "$DB_NAME" --command="SELECT name FROM sqlite_master WHERE type='table' AND name='customers';" 2>&1 | grep -q "customers"; then
    log_success "Base schema already exists"
    APPLY_BASE_SCHEMA=false
else
    log_warning "Base schema NOT found - will apply schema.sql first"
    APPLY_BASE_SCHEMA=true
fi
echo ""

# Apply base schema if needed
if [ "$APPLY_BASE_SCHEMA" = true ]; then
    BASE_SCHEMA="$PROJECT_DIR/schema.sql"

    if [ -f "$BASE_SCHEMA" ]; then
        log_info "🚀 Applying base schema..."

        if wrangler d1 execute "$DB_NAME" --file="$BASE_SCHEMA" 2>&1 | tee /tmp/schema_output.log; then
            log_success "Base schema applied successfully"
        else
            log_error "Failed to apply base schema"
            log_error "Cannot continue without base schema"
            exit 1
        fi
        echo ""
    else
        log_error "Base schema file not found: $BASE_SCHEMA"
        exit 1
    fi
fi

# Now apply migrations
log_info "🚀 Applying migrations..."
echo ""

# Find all migration files, excluding rollback scripts, and sort them
MIGRATIONS=($(find "$MIGRATION_DIR" -type f -name "*.sql" ! -name "*rollback*" | sort))

for migration in "${MIGRATIONS[@]}"; do
    migration_name=$(basename "$migration")

    if [ -f "$migration" ]; then
        log_info "Applying: $migration_name"

        if wrangler d1 execute "$DB_NAME" --file="$migration" 2>&1 | tee /tmp/migration_output.log; then
            # Check if it was already applied
            if grep -q "duplicate column name" /tmp/migration_output.log; then
                log_warning "$migration_name: Already applied (columns exist)"
            elif grep -q "table .* already exists" /tmp/migration_output.log; then
                log_warning "$migration_name: Already applied (table exists)"
            else
                log_success "$migration_name: Applied successfully"
            fi
        else
            log_error "Failed to apply $migration_name"
            log_warning "Continuing with remaining migrations..."
        fi
        echo ""
    else
        log_warning "Migration file not found: $migration"
    fi
done

log_success "✅ Migration process completed!"
echo ""
log_info "📝 Next Steps:"
echo "  1. Verify the login page works"
echo "  2. Test user authentication"
echo "  3. Monitor logs for any issues: cd worker && wrangler tail"
echo ""
