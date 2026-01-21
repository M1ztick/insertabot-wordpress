#!/bin/bash
# Migration script to add avatars to existing widget configurations
# Usage: ./scripts/migrate-add-avatars.sh [production|development]

set -e

ENVIRONMENT="${1:-development}"

if [ "$ENVIRONMENT" = "production" ]; then
    DB_NAME="insertabot-production"
    echo "⚠️  Running migration on PRODUCTION database: $DB_NAME"
    read -p "Are you sure? (yes/no): " CONFIRM
    if [ "$CONFIRM" != "yes" ]; then
        echo "Migration cancelled."
        exit 0
    fi
else
    DB_NAME="insertabot-development"
    echo "Running migration on DEVELOPMENT database: $DB_NAME"
fi

echo ""
echo "============================================"
echo "Migration: Add Avatars to Widget Configs"
echo "Database: $DB_NAME"
echo "============================================"
echo ""

# Check if wrangler is available
if ! command -v wrangler &> /dev/null; then
    echo "❌ Error: wrangler CLI not found"
    echo "Install it with: npm install -g wrangler"
    exit 1
fi

# Run the migration
echo "📝 Executing migration..."
wrangler d1 execute "$DB_NAME" \
    --file=migrations/add-avatar-to-existing-configs.sql \
    --remote

echo ""
echo "✅ Migration completed successfully!"
echo ""
echo "Next steps:"
echo "  1. Deploy your worker: npm run deploy"
echo "  2. Clear any caches if needed"
echo "  3. Test the widget to see the avatar"
echo ""
