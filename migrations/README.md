# Database Migrations

This directory contains SQL migration scripts for updating the Insertabot database schema and data.

## Available Migrations

### Add Avatar to Existing Configs
**File:** `add-avatar-to-existing-configs.sql`
**Purpose:** Updates all existing widget configurations to include the default avatar URL

**When to run:**
- After updating the schema to include default avatar URL
- If you have existing widget configs without avatars

**How to run:**

```bash
# Run migration on production database (requires confirmation)
npm run db:migrate:avatars

# Or run directly with wrangler
npx wrangler d1 execute insertabot-production --file=migrations/add-avatar-to-existing-configs.sql --remote
```

## Migration Best Practices

1. **Backup before running migrations**
   ```bash
   npm run db:backup
   ```

3. **Review the SQL before running**
   - Check the migration file to understand what changes will be made
   - Ensure it matches your expectations

4. **Monitor after deployment**
   - Check application logs for any errors
   - Test affected features thoroughly

## Creating New Migrations

1. Create a new `.sql` file in this directory
2. Name it descriptively: `YYYY-MM-DD-description.sql`
3. Include comments explaining:
   - What the migration does
   - Why it's needed
   - Any rollback procedures
4. Add corresponding npm scripts in `package.json` if needed

## Rollback

If you need to rollback the avatar migration:

```sql
-- Remove avatars from widget configs
UPDATE widget_configs
SET bot_avatar_url = NULL,
    updated_at = strftime('%s', 'now')
WHERE bot_avatar_url = '/insertabot-avatar.png';
```
