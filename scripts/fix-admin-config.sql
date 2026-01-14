-- Fix missing widget config for admin account
INSERT INTO widget_configs (
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
  'cust_1d8a1e664e64d7f0',
  '#4F46E5',
  'bottom-right',
  'Hi! How can I help you today?',
  'Insertabot',
  NULL,
  '@cf/meta/llama-3.1-8b-instruct',
  0.7,
  500,
  'You are a helpful AI assistant.',
  '*',
  'Type your message...',
  1,
  strftime('%s', 'now'),
  strftime('%s', 'now')
);
