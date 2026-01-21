-- Migration: Add default avatar URL to existing widget configurations
-- Description: Updates all widget_configs that have NULL bot_avatar_url to use the default avatar
-- Date: 2026-01-20

-- Update all existing widget configurations without an avatar
UPDATE widget_configs
SET bot_avatar_url = '/insertabot-avatar.png',
    updated_at = strftime('%s', 'now')
WHERE bot_avatar_url IS NULL;

-- Verify the update
SELECT
    customer_id,
    bot_name,
    bot_avatar_url,
    datetime(updated_at, 'unixepoch') as last_updated
FROM widget_configs
ORDER BY updated_at DESC;
