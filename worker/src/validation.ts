/**
 * Request Validation Schemas using Zod
 * Provides runtime type safety and input sanitization
 */

import { z } from "zod";

// Chat message schema - supports both text and multimodal (vision) content
export const chatMessageSchema = z.object({
  role: z.enum(["system", "user", "assistant"]),
  content: z.union([
    // String content for text-only messages
    z
      .string()
      .min(1, "Message cannot be empty")
      .max(10000, "Message exceeds maximum length of 10000 characters")
      .refine(
        (val) => {
          // Prevent SQL injection attempts
          const lowerVal = val.toLowerCase();
          if (lowerVal.includes("sql") && val.includes(";")) return false;
          if (lowerVal.includes("drop table")) return false;
          if (lowerVal.includes("delete from")) return false;
          return true;
        },
        { message: "Invalid message content detected" }
      ),
    // Array content for multimodal messages (text + images)
    z.array(
      z.object({
        type: z.enum(["text", "image_url"]),
        text: z.string().optional(),
        image_url: z
          .object({
            url: z.string().url(),
          })
          .optional(),
      })
    ),
  ]),
});

// Chat request schema
export const chatRequestSchema = z.object({
  messages: z
    .array(chatMessageSchema)
    .min(1, "At least one message is required")
    .max(50, "Too many messages in conversation"),
  stream: z.boolean().optional().default(false),
  temperature: z.number().min(0).max(2).optional(),
  max_tokens: z.number().int().min(1).max(4000).optional(),
  model: z.string().max(100).optional(),
});

// Checkout request schema
export const checkoutRequestSchema = z.object({
  email: z.string().email("Invalid email address").max(255),
  success_url: z.string().url().optional(),
  cancel_url: z.string().url().optional(),
});

// Stripe webhook event schema (basic)
export const stripeWebhookSchema = z.object({
  id: z.string(),
  type: z.string(),
  data: z.object({
    object: z.any(),
  }),
  created: z.number(),
});

// API key validation
export const apiKeySchema = z
  .string()
  .min(10, "Invalid API key format")
  .max(200, "Invalid API key format")
  .regex(/^ib_sk_[a-zA-Z0-9_]+$/, "Invalid API key format");

// Generic request body size limit
export const MAX_REQUEST_SIZE = 10 * 1024 * 1024; // 10MB (supports base64-encoded images up to ~7MB)

/**
 * Validate and parse request body with schema
 */
export async function validateRequest<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    // Check content type
    const contentType = request.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      return { success: false, error: "Content-Type must be application/json" };
    }

    // Check request size (prevent DOS)
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > MAX_REQUEST_SIZE) {
      return { success: false, error: "Request body too large" };
    }

    // Parse JSON
    let body: any;
    try {
      body = await request.json();
    } catch (e) {
      return { success: false, error: "Invalid JSON in request body" };
    }

    // Validate with schema
    const result = schema.safeParse(body);
    if (!result.success) {
      // Extract first error message
      const firstError = result.error.errors[0];
      return {
        success: false,
        error: `${firstError.path.join(".")}: ${firstError.message}`,
      };
    }

    return { success: true, data: result.data };
  } catch (error) {
    return { success: false, error: "Request validation failed" };
  }
}

/**
 * Validate API key format
 */
export function validateApiKey(apiKey: string | null): boolean {
  if (!apiKey) return false;
  return apiKeySchema.safeParse(apiKey).success;
}

/**
 * Sanitize user input for logging (prevent log injection)
 */
export function sanitizeForLog(input: string): string {
  return input
    .replace(/[\r\n]/g, " ") // Remove newlines
    .replace(/[^\x20-\x7E]/g, "") // Remove non-printable chars
    .substring(0, 100); // Limit length
}

// Tenant context validation
import { D1Database } from "@cloudflare/workers-types";

/**
 * Validates API key and returns associated tenant ID
 * @throws Error if API key is invalid
 */
export async function validateTenant(
  db: D1Database,
  apiKey: string
): Promise<string> {
  const result = await db
    .prepare('SELECT customer_id FROM customers WHERE api_key = ?')
    .bind(apiKey)
    .first();

  if (!result || !result.customer_id) {
    throw new Error('Invalid API key');
  }

  return result.customer_id as string;
}
