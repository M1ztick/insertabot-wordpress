-- Add a new customer to Insertabot
-- Usage: Replace the values below and run via wrangler d1 execute

-- Generate an API key first using: node scripts/generate-api-key.js

BEGIN TRANSACTION;

-- Insert customer
INSERT INTO customers (
    customer_id,
    email,
    company_name,
    website_url,
    plan_type,
    status,
    api_key,
    created_at,
    updated_at,
    rate_limit_per_hour,
    rate_limit_per_day,
    rag_enabled,
    custom_branding,
    analytics_enabled
) VALUES (
    'cust_' || lower(hex(randomblob(8))),  -- Generates random customer ID
    'customer@example.com',                 -- CHANGE THIS
    'Example Company',                      -- CHANGE THIS
    'https://example.com',                  -- CHANGE THIS
    'free',                                 -- 'free', 'starter', 'pro', 'enterprise'
    'active',
    'ib_sk_PASTE_YOUR_GENERATED_KEY_HERE',  -- CHANGE THIS (from generate-api-key.js)
    unixepoch(),
    unixepoch(),
    100,    -- 100 requests per hour (free tier)
    1000,   -- 1000 requests per day (free tier)
    0,      -- RAG disabled for free tier
    0,      -- Custom branding disabled
    1       -- Analytics enabled
);

-- Get the customer_id we just created
-- Save this output to use in the next statement
SELECT customer_id, email, api_key FROM customers WHERE email = 'customer@example.com';

-- Insert default widget configuration
-- Replace 'cust_XXXXXXXX' with the customer_id from the previous query
INSERT INTO widget_configs (
    customer_id,
    primary_color,
    position,
    greeting_message,
    bot_name,
    bot_avatar_url,
    initial_message,
    placeholder_text,
    show_branding,
    model,
    temperature,
    max_tokens,
    system_prompt,
    allowed_domains,
    created_at,
    updated_at
) VALUES (
    'cust_XXXXXXXX',                        -- CHANGE THIS to customer_id from above
    '#6366f1',                              -- Primary color (indigo)
    'bottom-right',                         -- Widget position
    'Hi! How can I help you today?',        -- Greeting
    'Assistant',                            -- Bot name
    NULL,                                   -- No custom avatar
    NULL,                                   -- No initial message
    'Type your message...',                 -- Input placeholder
    1,                                      -- Show Insertabot branding
    'llama-3-8b',                          -- AI model
    0.7,                                   -- Temperature
    500,                                   -- Max tokens
    'You are a helpful customer service assistant.', -- System prompt
    NULL,                                   -- No domain restrictions
    unixepoch(),
    unixepoch()
);

COMMIT;

-- Verify the customer was created
SELECT
    c.customer_id,
    c.email,
    c.company_name,
    c.plan_type,
    c.api_key,
    w.bot_name,
    w.greeting_message
FROM customers c
LEFT JOIN widget_configs w ON c.customer_id = w.customer_id
WHERE c.email = 'customer@example.com';