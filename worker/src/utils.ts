/**
 * Utility Functions
 */

export function generateApiKey(): string {
  const array = new Uint8Array(24);
  crypto.getRandomValues(array);
  const hex = Array.from(array)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return "ib_sk_" + hex;
}

export function generateCustomerId(): string {
  const array = new Uint8Array(8);
  crypto.getRandomValues(array);
  const hex = Array.from(array)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return "cust_" + hex;
}

/**
 * Escapes HTML special characters to prevent XSS attacks
 * @param str - The string to escape
 * @returns The escaped string safe for insertion into HTML
 */
export function escapeHtml(str: string | null | undefined): string {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Extracts text content from multi-part messages
 * Handles both string messages and array-based multi-modal messages
 */
export function extractTextFromMessage(
  content: string | { type: string; text?: string }[]
): string {
  if (typeof content === "string") return content;
  return content
    .filter((part) => part.type === "text" && part.text)
    .map((part) => part.text)
    .join(" ");
}
