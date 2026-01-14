-- Fix missing widget configs for mainsite customer
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
  'cust_insertabot_001',
  '#4F46E5',
  'bottom-right',
  'Hi! I''m Insertabot. Ask me anything about our chatbot platform!',
  'Insertabot',
  NULL,
  '@cf/meta/llama-3.1-8b-instruct',
  0.7,
  500,
  'You are Insertabot, an AI assistant for the Insertabot platform. Help users understand how to embed AI chatbots on their websites. Be friendly, helpful, and concise.',
  '*',
  'Type your message...',
  1,
  strftime('%s', 'now'),
  strftime('%s', 'now')
);
