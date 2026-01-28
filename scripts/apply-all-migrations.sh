#!/bin/bash

# Apply All Pending Migrations Script
# Runs all migration files in order to bring database up to date
#
# Usage:
#   ./scripts/apply-all-migrations.sh production

set -e  # Exit on error

ENVIRONMENT="${1:-production}"
WORKER_DIR="worker"
MIGRATION_DIR="worker/migrations"

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

log_info "📋 Migrations to apply:"
echo ""

# List all migration files
MIGRATIONS=(
    "worker/migrations/001_add_auth_fields.sql"
    "worker/migrations/002_add_email_verification.sql"
)

for migration in "${MIGRATIONS[@]}"; do
    if [ -f "$migration" ]; then
        echo "  • $(basename $migration)"
    else
        log_warning "Migration file not found: $migration"
    fi
done

echo ""
log_info "🚀 Applying migrations..."
echo ""

# Apply each migration
cd "$WORKER_DIR"
for migration in "${MIGRATIONS[@]}"; do
    migration_name=$(basename "$migration")

    if [ -f "../$migration" ]; then
        log_info "Applying: $migration_name"

        if wrangler d1 execute "$DB_NAME" --file="../$migration" 2>&1 | tee /tmp/migration_output.log; then
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
    fi
done

log_success "✅ Migration process completed!"
echo ""
log_info "📝 Next Steps:"
echo "  1. Verify the login page works"
echo "  2. Test user authentication"
echo "  3. Monitor logs for any issues: cd worker && wrangler tail"
echo ""
