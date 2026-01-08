/**
 * Web Search Integration for Insertabot
 * Powered by Tavily Search API (AI-optimized, ToS compliant)
 */

export interface SearchResult {
  title: string;
  url: string;
  content: string;
  score?: number;
  published_date?: string;
}

export interface TavilySearchResponse {
  results: Array<{
    title: string;
    url: string;
    content: string;
    score: number;
    published_date?: string;
  }>;
}

/**
 * Perform web search using Tavily Search API
 * Tavily is specifically designed for AI/LLM applications and allows AI inference
 *
 * @param query - The search query
 * @param apiKey - Tavily API key
 * @param count - Number of results to return (default: 5)
 * @returns Array of search results
 */
export async function performWebSearch(
  query: string,
  apiKey: string,
  count: number = 5,
): Promise<SearchResult[]> {
  if (!apiKey) {
    console.warn("[Search] Tavily API key not configured");
    return [];
  }

  try {
    console.log(
      `[Search] Performing search for: "${query.substring(0, 50)}..."`,
    );

    // Call Tavily Search API
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: apiKey,
        query: query.trim(),
        max_results: count,
        search_depth: "basic", // 'basic' or 'advanced'
        include_answer: false, // We want raw results, not Tavily's answer
        include_raw_content: false, // Don't need full HTML
        include_images: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `[Search] Tavily API error: ${response.status} ${response.statusText}`,
        errorText,
      );

      // Check if it's a PII error
      if (errorText.includes("PII detected")) {
        console.warn(
          "[Search] Query blocked due to PII detection. This is common with specific addresses/names on free tier.",
        );
        // Return empty results instead of throwing - let AI respond without search
        return [];
      }

      throw new Error(
        `Tavily API request failed: ${response.status} ${response.statusText}`,
      );
    }

    const data: TavilySearchResponse = await response.json();
    console.log(`[Search] Received ${data.results?.length || 0} results`);

    // Extract and format results
    const results = data.results || [];
    return results.slice(0, count).map((result) => ({
      title: result.title,
      url: result.url,
      content: result.content,
      score: result.score,
      published_date: result.published_date,
    }));
  } catch (error) {
    console.error("[Search] Web search error:", error);
    throw error; // Re-throw so caller can handle it
  }
}

/**
 * Format search results for AI context
 * @param results - Array of search results
 * @returns Formatted string for AI prompt
 */
export function formatSearchResultsForAI(results: SearchResult[]): string {
  if (results.length === 0) {
    return "";
  }

  const formatted = results
    .map((result, index) => {
      return `[${index + 1}] ${result.title}
Source: ${result.url}
${result.content}${result.published_date ? `\nPublished: ${result.published_date}` : ""}${result.score ? `\nRelevance: ${(result.score * 100).toFixed(0)}%` : ""}`;
    })
    .join("\n\n");

  return `\n\n=== Web Search Results ===\n${formatted}\n=== End of Search Results ===\n\nUse the above search results to provide accurate, up-to-date information. Always cite your sources using the [number] format when referencing these results.`;
}

/**
 * Determine if a query needs web search
 * @param message - User message
 * @returns Boolean indicating if search is needed
 */
export function shouldPerformSearch(message: string): boolean {
  const lowerMessage = message.toLowerCase();

  // Keywords that indicate need for current information
  const searchIndicators = [
    "latest",
    "recent",
    "current",
    "today",
    "now",
    "news",
    "what is happening",
    "what happened",
    "price of",
    "stock price",
    "weather",
    "score",
    "who won",
    "when is",
    "search for",
    "look up",
    "find information",
    "tell me about",
  ];

  // Check if message contains search indicators
  const needsSearch = searchIndicators.some((indicator) =>
    lowerMessage.includes(indicator),
  );

  // Also check for question words that might need current info
  const questionWords = ["what", "when", "where", "who", "how"];
  const isQuestion = questionWords.some((word) =>
    lowerMessage.startsWith(word),
  );

  // Questions about recent events likely need search
  if (
    isQuestion &&
    (lowerMessage.includes("2024") || lowerMessage.includes("2025"))
  ) {
    console.log(
      `[Search] Query needs search (recent year mentioned): "${message.substring(0, 50)}..."`,
    );
    return true;
  }

  if (needsSearch) {
    console.log(
      `[Search] Query needs search (keyword match): "${message.substring(0, 50)}..."`,
    );
  } else {
    console.log(
      `[Search] Query does NOT need search: "${message.substring(0, 50)}..."`,
    );
  }

  return needsSearch;
}
