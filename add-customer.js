#!/usr/bin/env node

/**
 * Interactive customer management CLI
 * Adds new customers to the Insertabot platform
 */

const { generateApiKey } = require('./generate-api-key.js');
const readline = require('readline');
const { execSync } = require('child_process');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

function generateCustomerId() {
  const crypto = require('crypto');
  return 'cust_' + crypto.randomBytes(8).toString('hex');
}

async function main() {
  console.log('\n🎯 Insertabot Customer Setup Tool\n');
  
  try {
    // Collect customer information
    const email = await prompt('Customer email: ');
    const companyName = await prompt('Company name: ');
    const websiteUrl = await prompt('Website URL (optional): ');
    const planType = await prompt('Plan type (free/starter/pro/enterprise) [free]: ') || 'free';
    
    // Generate IDs and keys
    const customerId = generateCustomerId();
    const apiKey = generateApiKey();
    
    console.log(`\n✅ Generated customer ID: ${customerId}`);
    console.log(`✅ Generated API key: ${apiKey}\n`);
    
    // Determine rate limits based on plan
    const rateLimits = {
      free: { hour: 100, day: 1000 },
      starter: { hour: 500, day: 5000 },
      pro: { hour: 2000, day: 20000 },
      enterprise: { hour: 10000, day: 100000 }
    };
    
    const limits = rateLimits[planType] || rateLimits.free;
    
    // Create SQL for customer
    const customerSql = `
INSERT INTO customers (
  customer_id, email, company_name, website_url, plan_type, status, api_key,
  created_at, updated_at, rate_limit_per_hour, rate_limit_per_day,
  rag_enabled, custom_branding, analytics_enabled
) VALUES (
  '${customerId}', '${email}', '${companyName}', '${websiteUrl || ''}',
  '${planType}', 'active', '${apiKey}',
  unixepoch(), unixepoch(), ${limits.hour}, ${limits.day},
  ${planType !== 'free' ? 1 : 0}, ${planType === 'enterprise' ? 1 : 0}, 1
);`;
    
    // Create SQL for widget config
    const widgetSql = `
INSERT INTO widget_configs (
  customer_id, primary_color, position, greeting_message, bot_name,
  bot_avatar_url, initial_message, placeholder_text, show_branding,
  model, temperature, max_tokens, system_prompt, allowed_domains,
  created_at, updated_at
) VALUES (
  '${customerId}', '#6366f1', 'bottom-right', 'Hi! How can I help you today?',
  'Assistant', NULL, NULL, 'Type your message...', 1,
  'llama-3-8b', 0.7, 500, 'You are a helpful customer service assistant.',
  NULL, unixepoch(), unixepoch()
);`;
    
    // Write to temporary SQL file
    const sqlContent = `BEGIN TRANSACTION;\n${customerSql}\n${widgetSql}\nCOMMIT;\n\n-- Verify:\nSELECT c.customer_id, c.email, c.company_name, c.plan_type, c.api_key, w.bot_name FROM customers c LEFT JOIN widget_configs w ON c.customer_id = w.customer_id WHERE c.customer_id = '${customerId}';`;
    
    require('fs').writeFileSync('/tmp/add-customer.sql', sqlContent);
    
    console.log('📝 SQL commands prepared. Choose deployment target:');
    console.log('1. Development (local)');
    console.log('2. Production');
    
    const target = await prompt('Enter choice (1 or 2): ');
    
    let dbCommand;
    if (target === '1') {
      dbCommand = 'cd worker && wrangler d1 execute insertabot-development --local --file=/tmp/add-customer.sql';
    } else {
      dbCommand = 'cd worker && wrangler d1 execute insertabot-production --file=/tmp/add-customer.sql';
    }
    
    console.log('\n🚀 Executing database commands...');
    const output = execSync(dbCommand, { encoding: 'utf8' });
    console.log(output);
    
    console.log('\n✅ Customer added successfully!');
    console.log('\n📋 Customer Details:');
    console.log(`   Customer ID: ${customerId}`);
    console.log(`   Email: ${email}`);
    console.log(`   Company: ${companyName}`);
    console.log(`   Plan: ${planType}`);
    console.log(`   API Key: ${apiKey}`);
    console.log(`   Rate Limits: ${limits.hour}/hour, ${limits.day}/day`);
    
    console.log('\n📄 Widget Integration Code:');
    console.log(`<script src="https://cdn.insertabot.io/widget.js"`);
    console.log(`        data-api-key="${apiKey}"></script>`);
    
    // Clean up
    require('fs').unlinkSync('/tmp/add-customer.sql');
    
  } catch (error) {
    console.error('\n❌ Error adding customer:', error.message);
  } finally {
    rl.close();
  }
}

main();