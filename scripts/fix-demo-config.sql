-- Fix missing widget config for demo account
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
  'main_demo_001',
  '#4F46E5',
  'bottom-right',
  'Hi! I''m the Insertabot demo. Ask me anything!',
  'Insertabot Demo',
  NULL,
  '@cf/meta/llama-3.1-8b-instruct',
  0.7,
  500,
  'You are Insertabot, a helpful AI assistant demonstrating the capabilities of the Insertabot platform. Be friendly, concise, and helpful.',
  '*',
  'Type your message...',
  1,
  strftime('%s', 'now'),
  strftime('%s', 'now')
);
