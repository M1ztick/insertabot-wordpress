-- Insertabot SaaS Multi-Tenant Database Schema
-- For Cloudflare D1 (SQLite-compatible)

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    company_name TEXT NOT NULL,
    website_url TEXT,
    plan_type TEXT DEFAULT 'free', -- free, starter, pro, enterprise
    status TEXT DEFAULT 'active', -- active, suspended, cancelled
    api_key TEXT UNIQUE NOT NULL,
    created_at INTEGER NOT NULL, -- Unix timestamp
    updated_at INTEGER NOT NULL,

    -- Auth
    password_hash TEXT,
    password_salt TEXT,
    totp_enabled BOOLEAN DEFAULT 0,
    totp_secret TEXT,
    backup_codes TEXT, -- JSON array of hashed backup codes
    failed_login_attempts INTEGER DEFAULT 0,
    account_locked_until INTEGER, -- Unix timestamp
    password_reset_token TEXT,
    password_reset_expires INTEGER, -- Unix timestamp
    last_login_at INTEGER,

    -- Rate limiting
    rate_limit_per_hour INTEGER DEFAULT 5,
    rate_limit_per_day INTEGER DEFAULT 20,

    -- Feature flags
    rag_enabled BOOLEAN DEFAULT 0,
    custom_branding BOOLEAN DEFAULT 0,
    analytics_enabled BOOLEAN DEFAULT 1,

    -- Billing
    stripe_customer_id TEXT,
    subscription_id TEXT,
    subscription_status TEXT,
    trial_ends_at INTEGER
);

CREATE INDEX idx_customers_api_key ON customers(api_key);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_status ON customers(status);
CREATE INDEX idx_customers_reset_token ON customers(password_reset_token);

-- User sessions
CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT UNIQUE NOT NULL,
    customer_id TEXT NOT NULL,

    ip_address TEXT,
    user_agent TEXT,

    created_at INTEGER NOT NULL, -- Unix timestamp
    expires_at INTEGER NOT NULL, -- Unix timestamp
    last_seen_at INTEGER NOT NULL, -- Unix timestamp

    FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE
);

CREATE INDEX idx_sessions_id ON sessions(session_id);
CREATE INDEX idx_sessions_customer ON sessions(customer_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

-- Security audit trail
CREATE TABLE IF NOT EXISTS security_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id TEXT,

    event_type TEXT NOT NULL, -- e.g., login_success, login_failed, 2fa_enabled, password_changed
    timestamp INTEGER NOT NULL, -- Unix timestamp

    ip_address TEXT,
    user_agent TEXT,
    metadata TEXT, -- JSON string for additional details

    FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE
);

CREATE INDEX idx_security_logs_customer_event ON security_logs(customer_id, event_type);
CREATE INDEX idx_security_logs_timestamp ON security_logs(timestamp);

-- Widget configurations
CREATE TABLE IF NOT EXISTS widget_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id TEXT NOT NULL,

    -- Appearance
    primary_color TEXT DEFAULT '#6366f1',
    position TEXT DEFAULT 'bottom-right', -- bottom-right, bottom-left
    greeting_message TEXT DEFAULT 'Hi! How can I help you today?',
    bot_name TEXT DEFAULT 'Insertabot',
    bot_avatar_url TEXT,

    -- Behavior
    initial_message TEXT,
    placeholder_text TEXT DEFAULT 'Type your message...',
    show_branding BOOLEAN DEFAULT 1,

    -- AI Settings
    model TEXT DEFAULT 'llama-3-8b',
    temperature REAL DEFAULT 0.7,
    max_tokens INTEGER DEFAULT 500,
    system_prompt TEXT DEFAULT 'You are a knowledgeable and friendly AI assistant who loves helping people. You believe that great chatbots should be conversational, helpful, and build genuine connections with users. You understand that modern chatbots are powerful tools that can transform customer service by providing instant, personalized assistance 24/7. When engaging with users, be warm and personable while remaining professional. Share insights when appropriate, ask clarifying questions to better understand needs, and provide thoughtful, well-explained answers. Remember: the best chatbot experiences feel like talking to a helpful friend who genuinely cares about solving problems.',

    -- Advanced
    allowed_domains TEXT, -- comma-separated list
    custom_css TEXT,

    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,

    FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE
);

CREATE INDEX idx_widget_customer ON widget_configs(customer_id);

-- Knowledge base entries (for RAG)
CREATE TABLE IF NOT EXISTS knowledge_base (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id TEXT NOT NULL,

    content TEXT NOT NULL,
    source_type TEXT NOT NULL, -- manual, scraped, uploaded
    source_url TEXT,
    title TEXT,
    metadata TEXT, -- JSON string

    embedding_id TEXT, -- Reference to Vectorize embedding

    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,

    FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE
);

CREATE INDEX idx_knowledge_customer ON knowledge_base(customer_id);
CREATE INDEX idx_knowledge_source ON knowledge_base(source_type);

-- Usage tracking (for billing and analytics)
CREATE TABLE IF NOT EXISTS usage_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id TEXT NOT NULL,

    request_id TEXT NOT NULL,
    timestamp INTEGER NOT NULL,

    -- Request details
    model TEXT NOT NULL,
    prompt_tokens INTEGER DEFAULT 0,
    completion_tokens INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,

    -- Response details
    response_time_ms INTEGER,
    status_code INTEGER,
    error_message TEXT,

    -- Cost calculation
    estimated_cost_usd REAL DEFAULT 0.0,

    -- Context
    user_ip TEXT,
    user_country TEXT,
    referer_url TEXT,

    FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE
);

CREATE INDEX idx_usage_customer_timestamp ON usage_logs(customer_id, timestamp);
CREATE INDEX idx_usage_timestamp ON usage_logs(timestamp);

-- Conversations (optional - for analytics)
CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id TEXT UNIQUE NOT NULL,
    customer_id TEXT NOT NULL,

    session_id TEXT,
    user_id TEXT, -- If customer implements user tracking

    started_at INTEGER NOT NULL,
    last_message_at INTEGER NOT NULL,
    message_count INTEGER DEFAULT 0,

    -- Analytics
    user_agent TEXT,
    user_ip TEXT,
    page_url TEXT,

    FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE
);

CREATE INDEX idx_conversations_customer ON conversations(customer_id);
CREATE INDEX idx_conversations_session ON conversations(session_id);

-- Messages (optional - for conversation history)
CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id TEXT NOT NULL,
    customer_id TEXT NOT NULL,

    role TEXT NOT NULL, -- system, user, assistant
    content TEXT NOT NULL,
    timestamp INTEGER NOT NULL,

    -- Context used (for RAG)
    context_used TEXT, -- JSON array of knowledge base IDs used

    FOREIGN KEY (conversation_id) REFERENCES conversations(conversation_id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_timestamp ON messages(timestamp);

-- API Keys (for rotating keys, multiple keys per customer)
CREATE TABLE IF NOT EXISTS api_keys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id TEXT NOT NULL,

    key_hash TEXT UNIQUE NOT NULL, -- SHA-256 hash of the key
    key_prefix TEXT NOT NULL, -- First 8 chars for identification
    name TEXT, -- User-defined name

    is_active BOOLEAN DEFAULT 1,
    last_used_at INTEGER,

    created_at INTEGER NOT NULL,
    expires_at INTEGER, -- NULL = never expires

    FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE
);

CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_customer ON api_keys(customer_id);

-- Seed data for development
INSERT INTO customers (customer_id, email, company_name, website_url, plan_type, api_key, created_at, updated_at, rate_limit_per_hour, rate_limit_per_day)
VALUES (
    'cust_demo_001',
    'demo@insertabot.io',
    'Insertabot Demo',
    'https://insertabot.io',
    'pro',
    'ib_sk_demo_12345678901234567890123456789012',
    strftime('%s', 'now'),
    strftime('%s', 'now'),
    1000,
    10000
);

INSERT INTO widget_configs (customer_id, bot_name, greeting_message, system_prompt, created_at, updated_at)
VALUES (
    'cust_demo_001',
    'Mistyk Assistant',
    'Welcome to Mistyk Media! How can I help you today?',
    'You are a knowledgeable and enthusiastic assistant for Mistyk Media, a creative agency specializing in web design and digital marketing. You''re passionate about helping visitors learn about our services, answer questions about web development, design, and digital marketing, and guide them toward solutions that fit their needs. Be conversational and friendly while staying professional. Share insights about modern web technologies, design trends, and digital marketing strategies when relevant. Your goal is to make every interaction feel personal and valuable, building trust and showcasing the quality of service Mistyk Media provides.',
    strftime('%s', 'now'),
    strftime('%s', 'now')
);
