#!/usr/bin/env node

/**
 * Automated setup script for Cloudflare resources
 * Creates D1 databases, KV namespaces, Vectorize indexes, etc.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class CloudflareSetup {
  constructor() {
    this.resources = {
      databases: {},
      kvNamespaces: {},
      vectorizeIndexes: {},
      analyticsDatasets: {}
    };
  }

  log(message, type = 'info') {
    const colors = {
      info: '\x1b[36m',    // Cyan
      success: '\x1b[32m', // Green
      warning: '\x1b[33m', // Yellow
      error: '\x1b[31m'    // Red
    };
    console.log(`${colors[type]}${message}\x1b[0m`);
  }

  exec(command, options = {}) {
    try {
      return execSync(command, { 
        encoding: 'utf8', 
        stdio: options.quiet ? 'pipe' : 'inherit',
        ...options 
      });
    } catch (error) {
      if (!options.ignoreErrors) {
        throw error;
      }
      return error.stdout || '';
    }
  }

  async createD1Databases() {
    this.log('\n📊 Creating D1 Databases...', 'info');
    
    const databases = [
      { name: 'insertabot-production', env: 'production' },
      { name: 'insertabot-development', env: 'development' }
    ];

    for (const db of databases) {
      try {
        this.log(`Creating ${db.name}...`);
        const output = this.exec(`wrangler d1 create ${db.name}`, { quiet: true });
        
        // Parse database ID from output
        const idMatch = output.match(/database_id = "([^"]+)"/);
        if (idMatch) {
          this.resources.databases[db.env] = {
            name: db.name,
            id: idMatch[1]
          };
          this.log(`✅ Created ${db.name} with ID: ${idMatch[1]}`, 'success');
        }
      } catch (error) {
        if (error.message.includes('already exists')) {
          this.log(`⚠️  Database ${db.name} already exists`, 'warning');
        } else {
          this.log(`❌ Failed to create ${db.name}: ${error.message}`, 'error');
        }
      }
    }
  }

  async createKVNamespaces() {
    this.log('\n🗄️  Creating KV Namespaces...', 'info');
    
    const namespaces = [
      { name: 'RATE_LIMITER', env: 'production' },
      { name: 'RATE_LIMITER', env: 'development', preview: true }
    ];

    for (const ns of namespaces) {
      try {
        const previewFlag = ns.preview ? '--preview' : '';
        this.log(`Creating ${ns.name} (${ns.env})...`);
        const output = this.exec(`wrangler kv:namespace create "${ns.name}" ${previewFlag}`, { quiet: true });
        
        // Parse namespace ID from output
        const idMatch = output.match(/id = "([^"]+)"/);
        if (idMatch) {
          this.resources.kvNamespaces[ns.env] = {
            name: ns.name,
            id: idMatch[1]
          };
          this.log(`✅ Created ${ns.name} (${ns.env}) with ID: ${idMatch[1]}`, 'success');
        }
      } catch (error) {
        if (error.message.includes('already exists')) {
          this.log(`⚠️  KV namespace ${ns.name} (${ns.env}) already exists`, 'warning');
        } else {
          this.log(`❌ Failed to create ${ns.name} (${ns.env}): ${error.message}`, 'error');
        }
      }
    }
  }

  async createVectorizeIndex() {
    this.log('\n🔍 Creating Vectorize Index...', 'info');
    
    try {
      this.log('Creating insertabot-embeddings index...');
      const output = this.exec(
        'wrangler vectorize create insertabot-embeddings --dimensions=768 --metric=cosine',
        { quiet: true }
      );
      
      this.log('✅ Created Vectorize index: insertabot-embeddings', 'success');
      this.resources.vectorizeIndexes.production = {
        name: 'insertabot-embeddings',
        dimensions: 768,
        metric: 'cosine'
      };
    } catch (error) {
      if (error.message.includes('already exists')) {
        this.log('⚠️  Vectorize index already exists', 'warning');
      } else {
        this.log(`❌ Failed to create Vectorize index: ${error.message}`, 'error');
      }
    }
  }

  async updateWranglerConfig() {
    this.log('\n⚙️  Updating wrangler.toml...', 'info');
    
    const wranglerPath = path.join(__dirname, '../worker/wrangler.toml');
    
    if (!fs.existsSync(wranglerPath)) {
      this.log('❌ wrangler.toml not found', 'error');
      return;
    }

    let config = fs.readFileSync(wranglerPath, 'utf8');
    
    // Update database IDs
    if (this.resources.databases.production) {
      config = config.replace(
        /database_id = "your-database-id-here"/,
        `database_id = "${this.resources.databases.production.id}"`
      );
    }
    
    if (this.resources.databases.development) {
      config = config.replace(
        /database_id = "your-dev-database-id-here"/,
        `database_id = "${this.resources.databases.development.id}"`
      );
    }
    
    // Update KV namespace IDs
    if (this.resources.kvNamespaces.production) {
      config = config.replace(
        /id = "your-kv-id-here"/,
        `id = "${this.resources.kvNamespaces.production.id}"`
      );
    }
    
    if (this.resources.kvNamespaces.development) {
      config = config.replace(
        /id = "your-dev-kv-id-here"/,
        `id = "${this.resources.kvNamespaces.development.id}"`
      );
    }
    
    fs.writeFileSync(wranglerPath, config);
    this.log('✅ Updated wrangler.toml with resource IDs', 'success');
  }

  async migrateDatabase(env = 'production') {
    this.log(`\n🗃️  Running database migrations (${env})...`, 'info');
    
    const dbName = env === 'development' ? 'insertabot-development' : 'insertabot-production';
    const localFlag = env === 'development' ? '--local' : '';
    
    try {
      this.log('Applying schema.sql...');
      this.exec(`cd worker && wrangler d1 execute ${dbName} ${localFlag} --file=../schema.sql`);
      this.log(`✅ Database migration completed for ${env}`, 'success');
    } catch (error) {
      this.log(`❌ Database migration failed: ${error.message}`, 'error');
    }
  }

  async setupSecrets() {
    this.log('\n🔐 Setting up required secrets...', 'info');
    
    const secrets = [
      'AI_GATEWAY_ACCOUNT_ID',
      'AI_GATEWAY_ID',
      'AI_GATEWAY_TOKEN'
    ];

    this.log('ℹ️  You need to set these secrets manually:');
    for (const secret of secrets) {
      this.log(`   wrangler secret put ${secret}`);
    }
    
    this.log('\n📖 To get your AI Gateway credentials:');
    this.log('   1. Go to https://dash.cloudflare.com/?to=/:account/ai/ai-gateway');
    this.log('   2. Create a new gateway named "insertabot-gateway"');
    this.log('   3. Copy the Account ID and Gateway ID');
    this.log('   4. Create an API token with AI Gateway permissions');
  }

  async displaySummary() {
    this.log('\n📋 Setup Summary', 'success');
    this.log('─'.repeat(50));
    
    if (Object.keys(this.resources.databases).length > 0) {
      this.log('\n📊 D1 Databases:');
      for (const [env, db] of Object.entries(this.resources.databases)) {
        this.log(`   ${env}: ${db.name} (${db.id})`);
      }
    }
    
    if (Object.keys(this.resources.kvNamespaces).length > 0) {
      this.log('\n🗄️  KV Namespaces:');
      for (const [env, kv] of Object.entries(this.resources.kvNamespaces)) {
        this.log(`   ${env}: ${kv.name} (${kv.id})`);
      }
    }
    
    if (Object.keys(this.resources.vectorizeIndexes).length > 0) {
      this.log('\n🔍 Vectorize Indexes:');
      for (const [env, vi] of Object.entries(this.resources.vectorizeIndexes)) {
        this.log(`   ${env}: ${vi.name} (${vi.dimensions}d, ${vi.metric})`);
      }
    }
    
    this.log('\n🚀 Next Steps:');
    this.log('   1. Set up your AI Gateway secrets (see above)');
    this.log('   2. Update your domain settings in wrangler.toml');
    this.log('   3. Deploy with: npm run deploy');
    this.log('   4. Test with: npm run test');
  }

  async run() {
    this.log('🚀 Insertabot Cloudflare Resource Setup', 'info');
    this.log('This will create D1 databases, KV namespaces, and Vectorize indexes');
    
    try {
      await this.createD1Databases();
      await this.createKVNamespaces();
      await this.createVectorizeIndex();
      await this.updateWranglerConfig();
      await this.migrateDatabase('development');
      await this.migrateDatabase('production');
      await this.setupSecrets();
      await this.displaySummary();
      
      this.log('\n✅ Setup completed successfully!', 'success');
    } catch (error) {
      this.log(`\n❌ Setup failed: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

if (require.main === module) {
  const setup = new CloudflareSetup();
  setup.run();
}

module.exports = CloudflareSetup;