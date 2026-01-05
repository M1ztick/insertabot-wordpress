#!/usr/bin/env node

/**
 * List and manage existing customers
 * Provides overview of all customers and their usage
 */

const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

function formatDate(timestamp) {
  if (!timestamp) return 'Never';
  return new Date(timestamp * 1000).toLocaleDateString();
}

function formatPlan(plan) {
  const colors = {
    free: '\x1b[90m',      // Gray
    starter: '\x1b[34m',   // Blue
    pro: '\x1b[35m',       // Magenta
    enterprise: '\x1b[33m' // Yellow
  };
  return `${colors[plan] || '\x1b[0m'}${plan.toUpperCase()}\x1b[0m`;
}

async function listCustomers(target = 'production') {
  const dbName = target === 'development' ? 'insertabot-development' : 'insertabot-production';
  const localFlag = target === 'development' ? '--local' : '';
  
  const query = `
    SELECT 
      c.customer_id,
      c.email,
      c.company_name,
      c.plan_type,
      c.status,
      c.created_at,
      c.rate_limit_per_hour,
      c.rate_limit_per_day,
      c.rag_enabled,
      w.bot_name,
      w.primary_color,
      COUNT(u.id) as total_requests,
      SUM(u.total_tokens) as total_tokens,
      MAX(u.timestamp) as last_activity
    FROM customers c
    LEFT JOIN widget_configs w ON c.customer_id = w.customer_id
    LEFT JOIN usage_logs u ON c.customer_id = u.customer_id
    GROUP BY c.customer_id
    ORDER BY c.created_at DESC
  `;
  
  try {
    const command = `cd worker && wrangler d1 execute ${dbName} ${localFlag} --command="${query}"`;
    const output = execSync(command, { encoding: 'utf8' });
    
    console.log('\n📊 Customer Overview\n');
    console.log('─'.repeat(120));
    console.log('Customer ID'.padEnd(20) + 'Email'.padEnd(25) + 'Company'.padEnd(20) + 'Plan'.padEnd(12) + 'Status'.padEnd(10) + 'Requests'.padEnd(10) + 'Tokens'.padEnd(10) + 'Last Active');
    console.log('─'.repeat(120));
    
    // Parse the output (this is a simplified parser, wrangler output may vary)
    const lines = output.split('\n').filter(line => line.trim() && !line.includes('─') && !line.includes('Customer ID'));
    
    if (lines.length === 0) {
      console.log('No customers found.');
      return;
    }
    
    // This is a simplified display - in reality you'd need to parse the actual output format
    console.log('Customer data found. For detailed view, check the Cloudflare dashboard or run specific queries.');
    
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error('❌ Error: wrangler command not found. Please install Cloudflare CLI.');
    } else if (error.status === 1) {
      console.error('❌ Database error: Check if database exists and you have proper permissions.');
    } else {
      console.error('❌ Error fetching customers:', error.message);
    }
    process.exit(1);
  }
}

async function getCustomerDetails(customerId, target = 'production') {
  const dbName = target === 'development' ? 'insertabot-development' : 'insertabot-production';
  const localFlag = target === 'development' ? '--local' : '';
  
  const query = `
    SELECT 
      c.*,
      w.*
    FROM customers c
    LEFT JOIN widget_configs w ON c.customer_id = w.customer_id
    WHERE c.customer_id = '${customerId}' OR c.email = '${customerId}'
  `;
  
  try {
    const command = `cd worker && wrangler d1 execute ${dbName} ${localFlag} --command="${query}"`;
    const output = execSync(command, { encoding: 'utf8' });
    console.log('\n📋 Customer Details:\n');
    console.log(output);
    
    // Get usage stats
    const usageQuery = `
      SELECT 
        COUNT(*) as total_requests,
        SUM(total_tokens) as total_tokens,
        AVG(response_time_ms) as avg_response_time,
        MAX(timestamp) as last_request
      FROM usage_logs 
      WHERE customer_id = '${customerId}'
    `;
    
    const usageCommand = `cd worker && wrangler d1 execute ${dbName} ${localFlag} --command="${usageQuery}"`;
    const usageOutput = execSync(usageCommand, { encoding: 'utf8' });
    console.log('\n📈 Usage Statistics:\n');
    console.log(usageOutput);
    
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error('❌ Error: wrangler command not found. Please install Cloudflare CLI.');
    } else if (error.status === 1) {
      console.error('❌ Database error: Customer not found or database access denied.');
    } else {
      console.error('❌ Error fetching customer details:', error.message);
    }
    process.exit(1);
  }
}

async function main() {
  console.log('\n🎯 Insertabot Customer Management\n');
  
  try {
    const action = await prompt('Choose action:\n1. List all customers\n2. Get customer details\n3. Show usage stats\n4. Export customer data\n\nEnter choice (1-4): ');
    
    const target = await prompt('Environment (development/production) [production]: ') || 'production';
    
    switch (action) {
      case '1':
        await listCustomers(target);
        break;
        
      case '2':
        const customerId = await prompt('Enter customer ID or email: ');
        await getCustomerDetails(customerId, target);
        break;
        
      case '3':
        console.log('\n📊 Usage Statistics (Last 30 Days):\n');
        const usageQuery = `
          SELECT 
            customer_id,
            COUNT(*) as requests,
            SUM(total_tokens) as tokens,
            AVG(response_time_ms) as avg_response_time,
            DATE(timestamp, 'unixepoch') as date
          FROM usage_logs 
          WHERE timestamp > unixepoch() - 2592000
          GROUP BY customer_id, DATE(timestamp, 'unixepoch')
          ORDER BY date DESC, requests DESC
          LIMIT 50
        `;
        
        const dbName = target === 'development' ? 'insertabot-development' : 'insertabot-production';
        const localFlag = target === 'development' ? '--local' : '';
        const command = `cd worker && wrangler d1 execute ${dbName} ${localFlag} --command="${usageQuery}"`;
        try {
          const output = execSync(command, { encoding: 'utf8' });
          console.log(output);
        } catch (error) {
          if (error.code === 'ENOENT') {
            console.error('❌ Error: wrangler command not found. Please install Cloudflare CLI.');
          } else {
            console.error('❌ Error fetching usage statistics:', error.message);
          }
          return;
        }
        break;
        
      case '4':
        console.log('\n📤 Export customer data...');
        const exportQuery = `
          SELECT 
            c.customer_id,
            c.email,
            c.company_name,
            c.plan_type,
            c.status,
            c.created_at,
            COUNT(u.id) as total_requests,
            SUM(u.total_tokens) as total_tokens
          FROM customers c
          LEFT JOIN usage_logs u ON c.customer_id = u.customer_id
          GROUP BY c.customer_id
        `;
        
        const exportDbName = target === 'development' ? 'insertabot-development' : 'insertabot-production';
        const exportLocalFlag = target === 'development' ? '--local' : '';
        const exportCommand = `cd worker && wrangler d1 execute ${exportDbName} ${exportLocalFlag} --command="${exportQuery}"`;
        try {
          const exportOutput = execSync(exportCommand, { encoding: 'utf8' });
          
          const fs = require('fs');
          const filename = `customer-export-${new Date().toISOString().split('T')[0]}.csv`;
          fs.writeFileSync(filename, exportOutput);
          console.log(`✅ Data exported to ${filename}`);
        } catch (error) {
          if (error.code === 'ENOENT') {
            console.error('❌ Error: wrangler command not found. Please install Cloudflare CLI.');
          } else {
            console.error('❌ Error exporting data:', error.message);
          }
          return;
        }
        break;
        
      default:
        console.log('Invalid choice.');
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    rl.close();
  }
}

if (require.main === module) {
  main();
}

module.exports = { listCustomers, getCustomerDetails };