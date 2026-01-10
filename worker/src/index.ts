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
import { getLoginHTML } from "./html/login";
import { getLandingHTML } from "./html/landing";
import { getWidgetScript } from "./html/widget-script";
import {
  performWebSearch,
  formatSearchResultsForAI,
  shouldPerformSearch,
} from "./search";
import { extractTextFromMessage } from "./utils";
import {
  ErrorHandler,
  AppError,
  ErrorCode,
  ValidationError,
  AuthenticationError,
  RateLimitError,
  DatabaseError,
  ExternalServiceError,
  withTimeout,
  withDatabase,
  withRetry
} from "./errors";

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
  if (!origin || typeof origin !== 'string') return false;
  if (!allowedDomains || typeof allowedDomains !== 'string') return false;

  try {
    const domains = allowedDomains.split(',').map(d => d.trim()).filter(d => d.length > 0);
    return domains.some(domain => {
      if (domain === '*') return true;
      if (domain === origin) return true;
      if (domain.startsWith('*.')) {
        const baseDomain = domain.slice(2);
        if (!baseDomain || baseDomain.length === 0) return false;
        return origin === baseDomain || origin.endsWith('.' + baseDomain);
      }
      return false;
    });
  } catch (error) {
    console.error('Error validating origin:', error);
    return false;
  }
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

function validateCorsConfig(env: Env): void {
  if (env.ENVIRONMENT === "production") {
    const origins = env.CORS_ORIGINS.split(",").map((s) => s.trim());
    if (origins.includes("*")) {
      throw new AppError(
        ErrorCode.INVALID_REQUEST,
        "CORS_ORIGINS must not contain wildcard '*' in production",
        400
      );
    }
  }
}

async function checkPublicRateLimit(
  kv: KVNamespace,
  clientIP: string,
  pathname: string
): Promise<void> {
  const key = `public:${pathname}:${clientIP}`;
  
  try {
    const count = parseInt(await kv.get(key) || '0');
    
    if (count >= 100) {
      throw new RateLimitError(3600, 'hourly');
    }
    
    await kv.put(key, String(count + 1), { expirationTtl: 3600 });
  } catch (error) {
    if (error instanceof RateLimitError) throw error;
    throw new AppError(ErrorCode.SERVICE_UNAVAILABLE, 'Rate limiting service unavailable');
  }
}

function getApiKey(request: Request): string | null {
  const headerKey = request.headers.get("X-API-Key");
  if (headerKey) return headerKey;

  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) return authHeader.slice(7);

  return null;
}

async function fetchSingle<T>(
  db: D1Database,
  query: string,
  params: any[],
  operationName: string = 'fetch'
): Promise<T | null> {
  return withDatabase(async () => {
    const result = await db
      .prepare(query)
      .bind(...params)
      .first<T>();
    return result || null;
  }, operationName);
}

async function getCustomerConfig(
  db: D1Database,
  apiKey: string
): Promise<CustomerConfig> {
  if (!validateApiKey(apiKey)) {
    throw new AuthenticationError(ErrorCode.INVALID_API_KEY, 'Invalid API key format');
  }
  
  const config = await fetchSingle<CustomerConfig>(
    db,
    `SELECT customer_id, api_key, plan_type, status, rate_limit_per_hour, rate_limit_per_day, rag_enabled
		 FROM customers WHERE api_key = ? AND status = 'active'`,
    [apiKey],
    'getCustomerConfig'
  );
  
  if (!config) {
    throw new AuthenticationError(ErrorCode.INVALID_API_KEY, 'Invalid or inactive API key');
  }
  
  return config;
}

async function getWidgetConfig(
  db: D1Database,
  customerId: string
): Promise<WidgetConfig> {
  const config = await fetchSingle<WidgetConfig>(
    db,
    `SELECT primary_color, position, greeting_message, bot_name, bot_avatar_url,
		        model, temperature, max_tokens, system_prompt, allowed_domains,
		        COALESCE(placeholder_text, 'Type your message...') as placeholder_text,
		        COALESCE(show_branding, 1) as show_branding
		 FROM widget_configs WHERE customer_id = ?`,
    [customerId],
    'getWidgetConfig'
  );
  
  if (!config) {
    throw new AppError(ErrorCode.CONFIG_NOT_FOUND, 'Widget configuration not found');
  }
  
  return config;
}

async function checkRateLimit(
  kv: KVNamespace,
  customerId: string,
  limitPerHour: number,
  limitPerDay: number
): Promise<void> {
  const now = Date.now();
  const hourKey = `ratelimit:${customerId}:hour:${Math.floor(now / 3600000)}`;
  const dayKey = `ratelimit:${customerId}:day:${Math.floor(now / 86400000)}`;

  const increment = async (key: string, ttl: number): Promise<number> => {
    try {
      const current = parseInt((await kv.get(key)) || "0");
      const updated = current + 1;
      await kv.put(key, updated.toString(), { expirationTtl: ttl });
      return updated;
    } catch (error) {
      throw new AppError(ErrorCode.SERVICE_UNAVAILABLE, 'Rate limiting service unavailable');
    }
  };

  const currentHourCount = await increment(hourKey, 3600);
  const currentDayCount = await increment(dayKey, 86400);

  if (currentHourCount > limitPerHour) {
    throw new RateLimitError(3600, 'hourly');
  }
  
  if (currentDayCount > limitPerDay) {
    throw new RateLimitError(86400, 'daily');
  }
}

function validateChatMessage(message: any): void {
  if (Array.isArray(message)) {
    const textPart = message.find((part: any) => part.type === "text");
    if (!textPart || !textPart.text) {
      throw new ValidationError('Multimodal message must contain text content');
    }
    const trimmed = textPart.text.trim();
    if (trimmed.length > 10000) {
      throw new ValidationError('Message exceeds maximum length of 10000 characters');
    }
    return;
  }

  if (!message || typeof message !== "string") {
    throw new ValidationError('Message must be a non-empty string');
  }

  const trimmed = message.trim();
  if (trimmed.length === 0) {
    throw new ValidationError('Message cannot be empty');
  }
  if (trimmed.length > 10000) {
    throw new ValidationError('Message exceeds maximum length of 10000 characters');
  }
  if (trimmed.toLowerCase().includes("sql") && trimmed.includes(";")) {
    throw new ValidationError('Invalid message content detected');
  }
}

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

function getFallbackResponse(widgetConfig: WidgetConfig): string {
  const fallbacks = [
    `Hi! I'm ${widgetConfig.bot_name}. I'm having a moment of confusion. Could you try asking your question again?`,
    `I appreciate your message, but I need to reset. Could you rephrase that for me?`,
    `Sorry, I lost my train of thought. What was your question?`,
    `My apologies! I didn't process that correctly. Could you try again?`,
  ];
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

async function handleChatRequest(
  request: Request,
  env: Env,
  customerId: string,
  customerConfig: CustomerConfig,
  widgetConfig: WidgetConfig,
  corsHeaders: HeadersInit
): Promise<Response> {
  const logger = new StructuredLogger("chat-handler", env.ENVIRONMENT, env.ANALYTICS);

  try {
    const startTime = Date.now();
    const chatRequest = (await request.json()) as ChatRequest;

    if (!chatRequest.messages || !Array.isArray(chatRequest.messages)) {
      throw new ValidationError('Invalid request: messages array required');
    }

    const userMessage = chatRequest.messages[chatRequest.messages.length - 1];
    validateChatMessage(userMessage?.content);

    const textContent = extractTextFromMessage(userMessage.content);

    let ragContext = "";
    if (customerConfig.rag_enabled && env.VECTORIZE) {
      try {
        const contextResults = await withTimeout(
          () => getRelevantContext(env, env.DB, customerId, textContent),
          5000,
          'RAG context retrieval'
        );
        if (contextResults.length > 0) {
          ragContext = `\n\nRelevant context:\n${contextResults.join("\n\n")}`;
        }
      } catch (error) {
        logger.warn("RAG context retrieval failed", { error: String(error) });
      }
    }

    let searchContext = "";
    const shouldSearch = shouldPerformSearch(textContent);

    if (env.TAVILY_API_KEY && shouldSearch) {
      logger.info("Triggering web search", {
        query: textContent.substring(0, 100),
        customerId,
      });

      try {
        const searchResults = await withRetry(
          () => withTimeout(
            () => performWebSearch(textContent, env.TAVILY_API_KEY!, 5),
            10000,
            'web search'
          ),
          2,
          1000,
          'web search with retry'
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

    const shouldStream = chatRequest.stream === true;

    // AI model call with timeout and retry
    const aiResponse = await withRetry(
      () => withTimeout(
        () => env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
          messages: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          max_tokens: Math.min(maxTokens, 2000),
          stream: false,
        }),
        30000,
        'AI model inference'
      ),
      2,
      1000,
      'AI model call'
    ).catch((error) => {
      logger.error("AI model error", { error: String(error) });
      return {
        result: { response: getFallbackResponse(widgetConfig) },
        fallback: true
      };
    });

    const responseText = aiResponse?.result?.response || aiResponse?.response || "";

    if (!isCoherentResponse(responseText)) {
      logger.warn("Incoherent response detected", {
        response: responseText.substring(0, 100),
      });

      const fallbackText = getFallbackResponse(widgetConfig);

      if (shouldStream) {
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          start(controller) {
            const sseChunk = `data: ${JSON.stringify({
              choices: [{ delta: { content: fallbackText } }]
            })}\n\n`;
            controller.enqueue(encoder.encode(sseChunk));
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          }
        });

        return new Response(stream, {
          status: 200,
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            ...corsHeaders,
            ...SECURITY_HEADERS,
          },
        });
      }

      return new Response(
        JSON.stringify({
          id: `msg-${Date.now()}`,
          content: fallbackText,
          model: widgetConfig.model,
          usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders, ...SECURITY_HEADERS },
        }
      );
    }

    if (shouldStream) {
      const encoder = new TextEncoder();
      const words = responseText.split(/(\s+)/);

      const stream = new ReadableStream({
        async start(controller) {
          try {
            for (const word of words) {
              if (word.trim().length > 0 || word.match(/\s/)) {
                const sseChunk = `data: ${JSON.stringify({
                  choices: [{ delta: { content: word } }]
                })}\n\n`;
                controller.enqueue(encoder.encode(sseChunk));
              }
            }
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          } catch (error) {
            controller.error(error);
          }
        },
      });

      return new Response(stream, {
        status: 200,
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
          ...corsHeaders,
          ...SECURITY_HEADERS,
        },
      });
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
            (acc, m) => acc + extractTextFromMessage(m.content).split(/\s+/).length,
            0
          ),
          completion_tokens: responseText.split(/\s+/).length,
          total_tokens:
            messages.reduce(
              (acc, m) => acc + extractTextFromMessage(m.content).split(/\s+/).length,
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
    
    const fallbackText = getFallbackResponse(widgetConfig);
    
    return new Response(
      JSON.stringify({
        id: `msg-${Date.now()}`,
        content: fallbackText,
        model: widgetConfig.model,
        usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
        error: 'service_temporarily_unavailable'
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders, ...SECURITY_HEADERS },
      }
    );
  }
}

async function handleHealthCheck(env: Env): Promise<Response> {
  try {
    const result = await withTimeout(
      () => env.DB.prepare("SELECT 1").first(),
      5000,
      'health check database query'
    );
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

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);
    const origin = request.headers.get("origin") || "";
    const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
    
    const logger = new StructuredLogger("request-handler", env.ENVIRONMENT, env.ANALYTICS);
    const errorHandler = new ErrorHandler(env.ENVIRONMENT, env.ANALYTICS);
    
    try {
      validateCorsConfig(env);
    } catch (error) {
      return errorHandler.handleError(
        error instanceof AppError ? error : new AppError(ErrorCode.INVALID_REQUEST, String(error), 400),
        { url: url.pathname, origin, clientIP }
      );
    }

    const publicRoutes = [
      '/', '/signup', '/login', '/playground', '/health', '/dashboard',
      '/favicon.ico', '/logo.png', '/widget.js',
      '/v1/stripe/webhook', '/checkout-success', '/api/customer/create', '/api/customer/login'
    ];
    
    if (publicRoutes.includes(url.pathname)) {
      const globalOrigins = env.CORS_ORIGINS.split(',').map(o => o.trim());
      const allowed = globalOrigins.includes('*') || globalOrigins.includes(origin);
      const corsHeaders = createCorsHeaders(origin, allowed);
      
      if (url.pathname !== '/favicon.ico') {
        try {
          await checkPublicRateLimit(env.RATE_LIMITER, clientIP, url.pathname);
        } catch (error) {
          if (error instanceof RateLimitError) {
            const response = await errorHandler.handleError(error, { url: url.pathname, clientIP });
            const responseHeaders: Record<string, string> = {};
            response.headers.forEach((value, key) => {
              responseHeaders[key] = value;
            });
            return new Response(response.body, {
              status: response.status,
              headers: { ...responseHeaders, ...corsHeaders }
            });
          }
          throw error;
        }
      }
      
      if (request.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: { ...corsHeaders, ...SECURITY_HEADERS } });
      }

      try {
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

        if (url.pathname === "/signup" && request.method === "GET") {
          const html = getSignupHTML();
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

        if (url.pathname === "/login" && request.method === "GET") {
          const html = getLoginHTML();
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

        if (url.pathname === "/dashboard" && request.method === "GET") {
          const apiKeyParam = url.searchParams.get('key');
          if (!apiKeyParam) {
            throw new AuthenticationError(
              ErrorCode.MISSING_API_KEY,
              "API key required. Access dashboard via your signup confirmation or use ?key=YOUR_API_KEY"
            );
          }

          const customer = await getCustomerConfig(env.DB, apiKeyParam);
          const widgetConfigData = await getWidgetConfig(env.DB, customer.customer_id);

          const html = getDashboardHTML(customer, widgetConfigData, url.origin);
          return new Response(html, {
            status: 200,
            headers: {
              "Content-Type": "text/html; charset=utf-8",
              "Cache-Control": "private, no-cache",
              ...corsHeaders,
              ...SECURITY_HEADERS,
            },
          });
        }

        if (url.pathname === "/api/customer/create" && request.method === "POST") {
          const body = await request.json() as { email: string; company_name: string };

          const existingCustomer = await getCustomerByEmail(env.DB, body.email);
          if (existingCustomer) {
            throw new AppError(ErrorCode.INVALID_REQUEST, "Email already registered", 409);
          }

          const customer = await createCustomer(env.DB, body.email, body.company_name);
          if (!customer) {
            throw new AppError(ErrorCode.INTERNAL_ERROR, "Failed to create account", 500);
          }

          return new Response(
            JSON.stringify({
              success: true,
              api_key: customer.api_key,
              message: "Account created successfully"
            }),
            {
              status: 201,
              headers: { "Content-Type": "application/json", ...corsHeaders, ...SECURITY_HEADERS },
            }
          );
        }

        if (url.pathname === "/api/customer/login" && request.method === "POST") {
          const body = await request.json() as { email: string };

          const customer = await getCustomerByEmail(env.DB, body.email);
          if (!customer) {
            return new Response(
              JSON.stringify({
                success: false,
                message: "No account found with this email address"
              }),
              {
                status: 404,
                headers: { "Content-Type": "application/json", ...corsHeaders, ...SECURITY_HEADERS },
              }
            );
          }

          return new Response(
            JSON.stringify({
              success: true,
              api_key: customer.api_key,
              message: "Login successful"
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json", ...corsHeaders, ...SECURITY_HEADERS },
            }
          );
        }

        if (url.pathname === "/favicon.ico") {
          return new Response(null, { status: 204 });
        }

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
        const response = await errorHandler.handleError(
          error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Public route error'),
          { url: url.pathname, origin, clientIP }
        );
        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });
        return new Response(response.body, {
          status: response.status,
          headers: { ...responseHeaders, ...corsHeaders }
        });
      }
    }

    if (request.method === "OPTIONS") {
      const globalOrigins = env.CORS_ORIGINS.split(',').map(o => o.trim());
      const allowed = globalOrigins.includes('*') || globalOrigins.includes(origin);
      const preflightCors = createCorsHeaders(origin, allowed);
      return new Response(null, { status: 204, headers: { ...preflightCors, ...SECURITY_HEADERS } });
    }

    try {
      const apiKey = getApiKey(request);
      if (!apiKey) {
        throw new AuthenticationError(ErrorCode.MISSING_API_KEY, 'Missing API key');
      }

      const customerConfig = await getCustomerConfig(env.DB, apiKey);
      const widgetConfig = await getWidgetConfig(env.DB, customerConfig.customer_id);

      const originAllowed = isOriginAllowed(origin, widgetConfig.allowed_domains);
      const corsHeaders = createCorsHeaders(origin, originAllowed);
      
      if (!originAllowed && origin) {
        await logger.warn("Blocked origin attempt", {
          origin,
          apiKey: apiKey.substring(0, 12) + '...',
          customerId: customerConfig.customer_id,
          path: url.pathname,
        });
        
        throw new AppError(ErrorCode.ORIGIN_NOT_ALLOWED, 'Origin not allowed', 403);
      }

      if (request.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: { ...corsHeaders, ...SECURITY_HEADERS } });
      }

      if (url.pathname === "/v1/chat/completions" && request.method === "POST") {
        await checkRateLimit(
          env.RATE_LIMITER,
          customerConfig.customer_id,
          customerConfig.rate_limit_per_hour,
          customerConfig.rate_limit_per_day
        );

        return handleChatRequest(
          request,
          env,
          customerConfig.customer_id,
          customerConfig,
          widgetConfig,
          corsHeaders
        );
      }

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

      if (url.pathname === "/api/customer/config" && request.method === "PUT") {
        const body = await request.json() as any;

        const result = await updateWidgetConfig(env.DB, customerConfig.customer_id, body);
        if (!result) {
          throw new AppError(ErrorCode.INTERNAL_ERROR, "Failed to update configuration", 500);
        }

        return new Response(
          JSON.stringify({ success: true, message: "Configuration updated" }),
          {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders, ...SECURITY_HEADERS },
          }
        );
      }

      throw new AppError(ErrorCode.INVALID_REQUEST, 'Endpoint not found', 404);
      
    } catch (error) {
      const response = await errorHandler.handleError(
        error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Request processing failed'),
        { url: url.pathname, origin, clientIP, method: request.method }
      );
      
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });
      
      try {
        const corsHeaders = createCorsHeaders(origin, false);
        return new Response(response.body, {
          status: response.status,
          headers: { ...responseHeaders, ...corsHeaders }
        });
      } catch {
        return response;
      }
    }
  },
};