/**
 * Insertabot SaaS - Cloudflare Workers API
 * Multi-tenant chatbot service with AI Gateway integration
 */

import { getRelevantContext } from "./rag";
import { StructuredLogger } from "./monitoring";
import {
  createCheckoutSession,
  verifyWebhookSignature,
  processWebhookEvent,
  getSubscriptionStatus,
} from "./stripe";
import {
  validateRequest,
  chatRequestSchema,
  checkoutRequestSchema,
  validateApiKey,
  sanitizeForLog,
  validateTenant,
} from "./validation";
import {
  createCustomer,
  getCustomerByEmail,
  updateWidgetConfig,
} from "./customer";
import { getPlaygroundHTML } from "./playground";
import { getDashboardHTML } from "./html/dashboard";
import { getSignupHTML } from "./html/signup";
import { getLandingHTML } from "./html/landing";
import { getWidgetScript } from "./html/widget-script";
import {
  performWebSearch,
  formatSearchResultsForAI,
  shouldPerformSearch,
} from "./search";
import { extractTextFromMessage } from "./utils";

export interface Env {
  DB: D1Database;
  VECTORIZE: VectorizeIndex;
  RATE_LIMITER: KVNamespace;
  ANALYTICS: AnalyticsEngineDataset;
  AI: any; // Cloudflare Workers AI binding
  ENVIRONMENT: string; // 'development' | 'production'
  CORS_ORIGINS: string; // comma-separated
  STRIPE_SECRET_KEY?: string; // Stripe API secret key
  STRIPE_PUBLISHABLE_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  STRIPE_PRO_PRICE_ID?: string; // Price ID for Pro plan on Stripe
  TAVILY_API_KEY?: string; // Tavily Search API key for web search (AI-optimized)
}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content:
    | string
    | Array<{
        type: "text" | "image_url";
        text?: string;
        image_url?: { url: string };
      }>;
}

interface ChatRequest {
  messages: ChatMessage[];
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
  model?: string;
}

interface CustomerConfig {
  customer_id: string;
  api_key: string;
  plan_type: string;
  status: string;
  rate_limit_per_hour: number;
  rate_limit_per_day: number;
  rag_enabled: boolean;
}

interface WidgetConfig {
  primary_color: string;
  position: string;
  greeting_message: string;
  bot_name: string;
  bot_avatar_url: string | null;
  model: string;
  temperature: number;
  max_tokens: number;
  system_prompt: string;
  allowed_domains: string | null;
  placeholder_text: string;
  show_branding: boolean;
}

// Security headers for all responses
const SECURITY_HEADERS: HeadersInit = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "SAMEORIGIN",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
};

// Validate origin against customer's allowed domains
function isOriginAllowed(origin: string, allowedDomains: string | null): boolean {
  if (!allowedDomains) return false;
  const domains = allowedDomains.split(',').map(d => d.trim());
  return domains.some(domain => {
    if (domain === '*') return true;
    if (domain === origin) return true;
    // Support wildcard subdomains: *.example.com
    if (domain.startsWith('*.')) {
      const baseDomain = domain.slice(2);
      return origin.endsWith(baseDomain);
    }
    return false;
  });
}

// CORS helper with Vary header for proper caching
function createCorsHeaders(origin: string, allowed: boolean): HeadersInit {
  return {
    "Access-Control-Allow-Origin": allowed ? origin : "null",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

/**
 * Validate CORS configuration at runtime.
 * In production we never allow a wildcard origin – it defeats the purpose of CORS.
 */
function validateCorsConfig(env: Env): void {
  if (env.ENVIRONMENT === "production") {
    const origins = env.CORS_ORIGINS.split(",").map((s) => s.trim());
    if (origins.includes("*")) {
      throw new Error(
        "CORS_ORIGINS must not contain wildcard '*' in production. Please configure specific allowed origins.",
      );
    }
  }
}

/**
 * Rate limit public endpoints by IP address
 */
async function checkPublicRateLimit(
  kv: KVNamespace,
  clientIP: string,
  pathname: string
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const key = `public:${pathname}:${clientIP}`;
  const count = parseInt(await kv.get(key) || '0');
  
  // 100 requests per hour for public endpoints
  if (count >= 100) {
    return { allowed: false, retryAfter: 3600 };
  }
  
  await kv.put(key, String(count + 1), { expirationTtl: 3600 });
  return { allowed: true };
}

// Extract API key from headers
function getApiKey(request: Request): string | null {
  const headerKey = request.headers.get("X-API-Key");
  if (headerKey) return headerKey;

  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) return authHeader.slice(7);

  return null;
}

// Fetch single record helper
async function fetchSingle<T>(
  db: D1Database,
  query: string,
  params: any[]
): Promise<T | null> {
  try {
    const result = await db
      .prepare(query)
      .bind(...params)
      .first<T>();
    return result || null;
  } catch (error) {
    console.error("Database fetch error:", error);
    return null;
  }
}

async function getCustomerConfig(
  db: D1Database,
  apiKey: string
): Promise<CustomerConfig | null> {
  return fetchSingle<CustomerConfig>(
    db,
    `SELECT customer_id, api_key, plan_type, status, rate_limit_per_hour, rate_limit_per_day, rag_enabled
		 FROM customers WHERE api_key = ? AND status = 'active'`,
    [apiKey]
  );
}

async function getWidgetConfig(
  db: D1Database,
  customerId: string
): Promise<WidgetConfig | null> {
  return fetchSingle<WidgetConfig>(
    db,
    `SELECT primary_color, position, greeting_message, bot_name, bot_avatar_url,
		        model, temperature, max_tokens, system_prompt, allowed_domains,
		        COALESCE(placeholder_text, 'Type your message...') as placeholder_text,
		        COALESCE(show_branding, 1) as show_branding
		 FROM widget_configs WHERE customer_id = ?`,
    [customerId]
  );
}

// Rate limiting for customer endpoints
async function checkRateLimit(
  kv: KVNamespace,
  customerId: string,
  limitPerHour: number,
  limitPerDay: number
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const now = Date.now();
  const hourKey = `ratelimit:${customerId}:hour:${Math.floor(now / 3600000)}`;
  const dayKey = `ratelimit:${customerId}:day:${Math.floor(now / 86400000)}`;

  const increment = async (key: string, ttl: number): Promise<number> => {
    const current = parseInt((await kv.get(key)) || "0");
    const updated = current + 1;
    await kv.put(key, updated.toString(), { expirationTtl: ttl });
    return updated;
  };

  const currentHourCount = await increment(hourKey, 3600);
  const currentDayCount = await increment(dayKey, 86400);

  const allowed =
    currentHourCount <= limitPerHour && currentDayCount <= limitPerDay;

  if (!allowed) {
    const retryAfter = currentHourCount > limitPerHour ? 3600 : 86400;
    return { allowed: false, retryAfter };
  }

  return { allowed: true };
}

// Input validation
function validateChatMessage(message: any): string | null {
  if (Array.isArray(message)) {
    const textPart = message.find((part: any) => part.type === "text");
    if (!textPart || !textPart.text) return null;
    const trimmed = textPart.text.trim();
    if (trimmed.length > 10000) {
      return "Message exceeds maximum length of 10000 characters";
    }
    return null;
  }

  if (!message || typeof message !== "string") {
    return "Message must be a non-empty string";
  }

  const trimmed = message.trim();
  if (trimmed.length === 0) return "Message cannot be empty";
  if (trimmed.length > 10000) return "Message exceeds maximum length of 10000 characters";
  if (trimmed.toLowerCase().includes("sql") && trimmed.includes(";")) {
    return "Invalid message content";
  }

  return null;
}

// Response validation
function isCoherentResponse(content: string): boolean {
  if (!content || content.length === 0) return false;
  if (content.length < 10) return false;
  if (content.length > 50000) return false;
  if (content.toLowerCase() === "[error]") return false;
  if (content.includes("undefined") || content.includes("null")) return false;

  const words = content.split(/\s+/);
  const wordCounts = new Map<string, number>();
  for (const word of words) {
    wordCounts.set(
      word.toLowerCase(),
      (wordCounts.get(word.toLowerCase()) || 0) + 1
    );
  }

  const maxRepetition = Math.max(...Array.from(wordCounts.values()));
  if (maxRepetition > words.length * 0.3) return false;

  return true;
}

// Fallback response
function getFallbackResponse(widgetConfig: WidgetConfig): string {
  const fallbacks = [
    `Hi! I'm ${widgetConfig.bot_name}. I'm having a moment of confusion. Could you try asking your question again?`,
    `I appreciate your message, but I need to reset. Could you rephrase that for me?`,
    `Sorry, I lost my train of thought. What was your question?`,
    `My apologies! I didn't process that correctly. Could you try again?`,
  ];
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

// Main chat handler
async function handleChatRequest(
  request: Request,
  env: Env,
  customerId: string,
  customerConfig: CustomerConfig,
  widgetConfig: WidgetConfig,
  corsHeaders: HeadersInit
): Promise<Response> {
  const logger = new StructuredLogger(
    "chat-handler",
    env.ENVIRONMENT,
    env.ANALYTICS
  );

  try {
    const startTime = Date.now();
    const chatRequest = (await request.json()) as ChatRequest;

    if (!chatRequest.messages || !Array.isArray(chatRequest.messages)) {
      return new Response(
        JSON.stringify({ error: "Invalid request: messages array required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders, ...SECURITY_HEADERS },
        }
      );
    }

    const userMessage = chatRequest.messages[chatRequest.messages.length - 1];
    const validationError = validateChatMessage(userMessage?.content);
    if (validationError) {
      return new Response(JSON.stringify({ error: validationError }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders, ...SECURITY_HEADERS },
      });
    }

    let ragContext = "";
    if (customerConfig.rag_enabled && env.VECTORIZE) {
      const contextResults = await getRelevantContext(
        env,
        env.DB,
        customerId,
        userMessage.content
      );
      if (contextResults.length > 0) {
        ragContext = `\n\nRelevant context:\n${contextResults.join("\n\n")}`;
      }
    }

    let searchContext = "";
    const textContent = extractTextFromMessage(userMessage.content);
    const shouldSearch = shouldPerformSearch(textContent);

    if (env.TAVILY_API_KEY && shouldSearch) {
      logger.info("Triggering web search", {
        query: userMessage.content.substring(0, 100),
        customerId,
      });

      try {
        const searchResults = await performWebSearch(
          userMessage.content,
          env.TAVILY_API_KEY,
          5
        );

        if (searchResults.length > 0) {
          searchContext = formatSearchResultsForAI(searchResults);
          logger.info("Web search completed", {
            resultCount: searchResults.length,
            customerId,
          });
        }
      } catch (searchError) {
        logger.error("Web search failed", {
          error: String(searchError),
          customerId,
        });
      }
    }

    const maxTokens = chatRequest.max_tokens ?? widgetConfig.max_tokens ?? 500;

    const messages: ChatMessage[] = [
      {
        role: "system",
        content: widgetConfig.system_prompt + ragContext + searchContext,
      },
      ...chatRequest.messages,
    ];

    let aiResponse: any;
    try {
      const response = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        max_tokens: Math.min(maxTokens, 2000),
      });

      aiResponse = response;
    } catch (aiError) {
      logger.error("AI model error", { error: String(aiError) });
      return new Response(
        JSON.stringify({
          id: `msg-${Date.now()}`,
          content: getFallbackResponse(widgetConfig),
          model: widgetConfig.model,
          usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders, ...SECURITY_HEADERS },
        }
      );
    }

    const responseText = aiResponse?.result?.response || aiResponse?.response || "";

    if (!isCoherentResponse(responseText)) {
      logger.warn("Incoherent response detected", {
        response: responseText.substring(0, 100),
      });
      return new Response(
        JSON.stringify({
          id: `msg-${Date.now()}`,
          content: getFallbackResponse(widgetConfig),
          model: widgetConfig.model,
          usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders, ...SECURITY_HEADERS },
        }
      );
    }

    const responseTime = Date.now() - startTime;

    await logger.info("Chat request processed", {
      customerId,
      responseTime,
      messageLength: userMessage.content.length,
    });

    return new Response(
      JSON.stringify({
        id: `msg-${Date.now()}`,
        content: responseText,
        model: widgetConfig.model,
        usage: {
          prompt_tokens: messages.reduce(
            (acc, m) => acc + m.content.split(/\s+/).length,
            0
          ),
          completion_tokens: responseText.split(/\s+/).length,
          total_tokens:
            messages.reduce(
              (acc, m) => acc + m.content.split(/\s+/).length,
              0
            ) + responseText.split(/\s+/).length,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders, ...SECURITY_HEADERS },
      }
    );
  } catch (error) {
    logger.error("Chat request error", { error: String(error) });
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders, ...SECURITY_HEADERS },
    });
  }
}

// Health check endpoint
async function handleHealthCheck(env: Env): Promise<Response> {
  try {
    const result = await env.DB.prepare("SELECT 1").first();
    const dbHealthy = !!result;

    return new Response(
      JSON.stringify({
        status: dbHealthy ? "healthy" : "degraded",
        checks: {
          database: dbHealthy,
          tavily_configured: !!env.TAVILY_API_KEY,
          timestamp: new Date().toISOString(),
        },
      }),
      {
        status: dbHealthy ? 200 : 503,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        status: "unhealthy",
        error: String(error),
      }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// Main request handler
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);
    const origin = request.headers.get("origin") || "";
    const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
    
    // Validate CORS configuration
    try {
      validateCorsConfig(env);
    } catch (error) {
      return new Response(JSON.stringify({ error: String(error) }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...SECURITY_HEADERS },
      });
    }

    const logger = new StructuredLogger("request-handler", env.ENVIRONMENT, env.ANALYTICS);

    // Public routes that don't require authentication
    const publicRoutes = [
      '/', '/signup', '/playground', '/health',
      '/favicon.ico', '/logo.png', '/widget.js',
      '/v1/stripe/webhook', '/checkout-success'
    ];
    
    // Handle public routes with global CORS
    if (publicRoutes.includes(url.pathname)) {
      const globalOrigins = env.CORS_ORIGINS.split(',').map(o => o.trim());
      const allowed = globalOrigins.includes('*') || globalOrigins.includes(origin);
      const corsHeaders = createCorsHeaders(origin, allowed);
      
      // Rate limit public endpoints
      if (url.pathname !== '/favicon.ico') {
        const rateLimit = await checkPublicRateLimit(env.RATE_LIMITER, clientIP, url.pathname);
        if (!rateLimit.allowed) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
            status: 429,
            headers: {
              "Content-Type": "application/json",
              "Retry-After": String(rateLimit.retryAfter),
              ...corsHeaders,
              ...SECURITY_HEADERS
            },
          });
        }
      }
      
      if (request.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: { ...corsHeaders, ...SECURITY_HEADERS } });
      }

      // Handle public route responses
      try {
        // Playground
        if (url.pathname === "/playground" && request.method === "GET") {
          const html = getPlaygroundHTML(url.origin);
          return new Response(html, {
            status: 200,
            headers: {
              "Content-Type": "text/html; charset=utf-8",
              "Cache-Control": "public, max-age=3600",
              ...corsHeaders,
              ...SECURITY_HEADERS,
            },
          });
        }

        // Widget script
        if (url.pathname === "/widget.js" && request.method === "GET") {
          const widgetJs = getWidgetScript(url.origin);
          return new Response(widgetJs, {
            status: 200,
            headers: {
              "Content-Type": "application/javascript",
              "Cache-Control": "public, max-age=3600",
              ...corsHeaders,
              ...SECURITY_HEADERS,
            },
          });
        }

        // Landing page
        if (url.pathname === "/" && request.method === "GET") {
          const html = getLandingHTML(url.origin);
          return new Response(html, {
            status: 200,
            headers: {
              "Content-Type": "text/html; charset=utf-8",
              "Cache-Control": "public, max-age=3600",
              ...corsHeaders,
              ...SECURITY_HEADERS,
            },
          });
        }

        // Favicon
        if (url.pathname === "/favicon.ico") {
          return new Response(null, { status: 204 });
        }

        // Health check
        if (url.pathname === "/health" && request.method === "GET") {
          const response = await handleHealthCheck(env);
          const responseHeaders: Record<string, string> = {};
          response.headers.forEach((value, key) => {
            responseHeaders[key] = value;
          });
          return new Response(response.body, {
            status: response.status,
            headers: { ...responseHeaders, ...corsHeaders, ...SECURITY_HEADERS },
          });
        }
      } catch (error) {
        console.error("Public route error:", error);
        return new Response(JSON.stringify({ error: "Internal server error" }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders, ...SECURITY_HEADERS },
        });
      }
    }

    // Allow CORS preflight for protected endpoints without requiring an API key.
    // Preflight requests do not include custom headers like X-API-Key, so
    // we must respond based on the global CORS_ORIGINS setting rather than
    // performing per-customer origin validation which requires an API key.
    if (request.method === "OPTIONS") {
      const globalOrigins = env.CORS_ORIGINS.split(',').map(o => o.trim());
      const allowed = globalOrigins.includes('*') || globalOrigins.includes(origin);
      const preflightCors = createCorsHeaders(origin, allowed);
      return new Response(null, { status: 204, headers: { ...preflightCors, ...SECURITY_HEADERS } });
    }

    // Protected routes - require API key
    const apiKey = getApiKey(request);
    if (!apiKey) {
      const corsHeaders = createCorsHeaders(origin, false);
      return new Response(JSON.stringify({ error: "Missing API key" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders, ...SECURITY_HEADERS },
      });
    }

    // Get customer config
    const customerConfig = await getCustomerConfig(env.DB, apiKey);
    if (!customerConfig) {
      const corsHeaders = createCorsHeaders(origin, false);
      return new Response(JSON.stringify({ error: 'Invalid API key' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders, ...SECURITY_HEADERS },
      });
    }

    // Get widget config for CORS validation
    const widgetConfig = await getWidgetConfig(env.DB, customerConfig.customer_id);
    if (!widgetConfig) {
      const corsHeaders = createCorsHeaders(origin, false);
      return new Response(JSON.stringify({ error: 'Invalid configuration' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders, ...SECURITY_HEADERS },
      });
    }

    // Validate origin against customer's allowed domains
    const originAllowed = isOriginAllowed(origin, widgetConfig.allowed_domains);
    const corsHeaders = createCorsHeaders(origin, originAllowed);
    
    if (!originAllowed && origin) {
      // Log blocked origin for monitoring
      await logger.warn("Blocked origin attempt", {
        origin,
        apiKey: apiKey.substring(0, 12) + '...',
        customerId: customerConfig.customer_id,
        path: url.pathname,
      });
      
      return new Response(JSON.stringify({ error: 'Origin not allowed' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', ...corsHeaders, ...SECURITY_HEADERS },
      });
    }

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: { ...corsHeaders, ...SECURITY_HEADERS } });
    }

    try {
      // Chat completions endpoint
      if (url.pathname === "/v1/chat/completions" && request.method === "POST") {
        const rateLimit = await checkRateLimit(
          env.RATE_LIMITER,
          customerConfig.customer_id,
          customerConfig.rate_limit_per_hour,
          customerConfig.rate_limit_per_day
        );

        if (!rateLimit.allowed) {
          return new Response(
            JSON.stringify({ error: "Rate limit exceeded" }),
            {
              status: 429,
              headers: {
                "Content-Type": "application/json",
                "Retry-After": String(rateLimit.retryAfter),
                ...corsHeaders,
                ...SECURITY_HEADERS,
              },
            }
          );
        }

        return handleChatRequest(
          request,
          env,
          customerConfig.customer_id,
          customerConfig,
          widgetConfig,
          corsHeaders
        );
      }

      // Widget config endpoint - FIXED: Now returns ALL required fields
      if (url.pathname === "/v1/widget/config" && request.method === "GET") {
        return new Response(
          JSON.stringify({
            primary_color: widgetConfig.primary_color,
            position: widgetConfig.position,
            greeting_message: widgetConfig.greeting_message,
            bot_name: widgetConfig.bot_name,
            bot_avatar_url: widgetConfig.bot_avatar_url,
            temperature: widgetConfig.temperature,
            max_tokens: widgetConfig.max_tokens,
            system_prompt: widgetConfig.system_prompt,
            placeholder_text: widgetConfig.placeholder_text,
            show_branding: widgetConfig.show_branding,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders, ...SECURITY_HEADERS },
          }
        );
      }

      // 404 for unknown routes
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders, ...SECURITY_HEADERS },
      });
    } catch (error) {
      console.error("Request handler error:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders, ...SECURITY_HEADERS },
      });
    }
  },
};
