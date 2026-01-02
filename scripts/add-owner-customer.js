#!/usr/bin/env node

/**
 * Create unlimited customer for mistykmedia.com
 */

const { generateApiKey } = require('./generate-api-key.js');
const { execSync } = require('child_process');
const crypto = require('crypto');

const customerId = 'cust_' + crypto.randomBytes(8).toString('hex');
const apiKey = generateApiKey();

const customerSql = `
INSERT INTO customers (
  customer_id, email, company_name, website_url, plan_type, status, api_key,
  created_at, updated_at, rate_limit_per_hour, rate_limit_per_day,
  rag_enabled, custom_branding, analytics_enabled
) VALUES (
  '${customerId}', 'contact@mistykmedia.com', 'Mistyk Media', 'https://mistykmedia.com',
  'owner', 'active', '${apiKey}',
  unixepoch(), unixepoch(), 999999, 999999,
  1, 1, 1
);`;

const widgetSql = `
INSERT INTO widget_configs (
  customer_id, primary_color, position, greeting_message, bot_name,
  bot_avatar_url, initial_message, placeholder_text, show_branding,
  model, temperature, max_tokens, system_prompt, allowed_domains,
  created_at, updated_at
) VALUES (
  '${customerId}', '#3b82f6', 'bottom-right', 'Hi! How can I help you today?',
  'Mistyk Assistant', NULL, NULL, 'Ask me anything...', 0,
  'llama-3.1-8b', 0.7, 800, 'You are a helpful assistant for Mistyk Media. Be friendly, professional, and knowledgeable about web development, AI, and digital marketing.',
  'mistykmedia.com', unixepoch(), unixepoch()
);`;

const sqlContent = `BEGIN TRANSACTION;\n${customerSql}\n${widgetSql}\nCOMMIT;\n\n-- Verify:\nSELECT c.customer_id, c.email, c.company_name, c.plan_type, c.api_key, c.rate_limit_per_hour, c.rate_limit_per_day FROM customers c WHERE c.customer_id = '${customerId}';`;

require('fs').writeFileSync('/tmp/add-owner.sql', sqlContent);

console.log('🎯 Creating unlimited customer for Mistyk Media...\n');

try {
  const output = execSync('cd worker && wrangler d1 execute insertabot-production --file=/tmp/add-owner.sql', { encoding: 'utf8' });
  console.log(output);
  
  console.log('\n✅ Owner customer created successfully!\n');
  console.log('📋 Details:');
  console.log(`   Customer ID: ${customerId}`);
  console.log(`   Email: contact@mistykmedia.com`);
  console.log(`   Website: https://mistykmedia.com`);
  console.log(`   Plan: owner (unlimited)`);
  console.log(`   API Key: ${apiKey}`);
  console.log(`   Rate Limits: UNLIMITED`);
  
  console.log('\n📄 Add this to mistykmedia.com:');
  console.log(`<script src="https://insertabot.io/widget.js"`);
  console.log(`        data-api-key="${apiKey}"></script>`);
  
  require('fs').unlinkSync('/tmp/add-owner.sql');
} catch (error) {
  console.error('❌ Error:', error.message);
}
