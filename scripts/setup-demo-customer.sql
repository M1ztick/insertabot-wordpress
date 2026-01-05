-- Insertabot Demo Customer Setup Script
-- Run this against your D1 database to setup the demo for insertabot.io

-- 1. Create demo customer with API key that matches landing page
INSERT OR REPLACE INTO customers (
  customer_id,
  email,
  company_name,
  api_key,
  plan_type,
  status,
  rate_limit_per_hour,
  rate_limit_per_day,
  rag_enabled,
  created_at,
  updated_at
) VALUES (
  'demo-customer-001',
  'demo@insertabot.io',
  'Mistyk Media (Demo)',
  'ib_sk_demo_0fc7793e948d37c9ef0422ff3df1edc6bb47dfd9458ff2b03f9e614c57b3898f',
  'free',
  'active',
  100,
  1000,
  0,
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
  'demo-customer-001',
  '#667eea',
  'bottom-right',
  'Hi! I''m the Insertabot demo. Ask me anything about AI chatbots, Cloudflare Workers, or just say hello!',
  'Demo Bot',
  NULL,
  '@cf/meta/llama-3.1-8b-instruct',
  0.7,
  500,
  'You are a helpful, friendly AI assistant demonstrating the Insertabot platform. You help users understand how AI chatbots work, answer questions about the platform, and engage in casual conversation. Be concise, friendly, and helpful. If asked about technical details, explain them clearly.',
  'https://insertabot.io,https://api.insertabot.io,http://localhost:8787,*',
  'Type your message...',
  1,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
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