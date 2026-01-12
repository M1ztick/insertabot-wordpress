-- Insertabot Demo Customer Setup Script
-- Run this against your D1 database to setup the demo for insertabot.io

-- 1. Create demo customer with API key that matches landing page
INSERT OR REPLACE INTO customers (
  customer_id,
  email,
  company_name,
  website_url,
  api_key,
  plan_type,
  status,
  rate_limit_per_hour,
  rate_limit_per_day,
  rag_enabled,
  custom_branding,
  analytics_enabled,
  created_at,
  updated_at
) VALUES (
  'cust_insertabot_001',
  'mainsite@insertabot.io',
  'Insertabot',
  'https://insertabot.io',
  'ib_sk_demo_62132eda22a524d715034a7013a7b20e2a36f93b71b588d3354d74e4024e9ed7',
  'owner',
  'active',
  100,
  1000,
  1,
  1,
  1,
  strftime('%s','now'),
  strftime('%s','now')
);

-- 2. Create widget configuration for demo customer
INSERT OR REPLACE INTO widget_configs (
  customer_id,
  primary_color,
  position,
  greeting_message,
  bot_name,
  bot_avatar_url,
  model,
  temperature,
  max_tokens,
  system_prompt,
  allowed_domains,
  placeholder_text,
  show_branding,
  created_at,
  updated_at
) VALUES (
  'cust_insertabot_001',
  '#6366f1',
  'bottom-right',
  'Hi there! 👋 I''m Insertabot, your friendly AI assistant and the official mascot of Insertabot.io! I''m here to chat, answer questions, and show you what our platform can do. Try me out!',
  'Insertabot',
  'https://insertabot.io/insertabot-avatar.png',
  '@cf/meta/llama-3.1-8b-instruct',
  0.7,
  500,
  'You are Insertabot, the enthusiastic and friendly mascot of Insertabot.io! Your personality is warm, engaging, and helpful. You love talking about AI chatbots, the Insertabot platform, and helping visitors understand how easy it is to add an AI assistant to any website. You''re proud of features like one-script installation, customization options, RAG support, and web search capabilities. When chatting, be conversational and personable - you''re not just a demo, you''re THE Insertabot! Keep responses concise but enthusiastic. If asked about the platform, highlight its simplicity and power.',
  'https://insertabot.io,https://api.insertabot.io,http://localhost:8787,*',
  'Chat with Insertabot...',
  1,
  strftime('%s','now'),
  strftime('%s','now')
);

-- 3. Verify the setup
SELECT 
  c.customer_id,
  c.email,
  c.api_key,
  c.status,
  w.bot_name,
  w.allowed_domains,
  w.greeting_message
FROM customers c
LEFT JOIN widget_configs w ON c.customer_id = w.customer_id
WHERE c.api_key = 'ib_sk_demo_REPLACE';