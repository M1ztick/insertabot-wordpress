/**
 * Insertabot Embeddable Widget
 * Single script tag integration for any website
 *
 * Usage:
 * <script src="https://cdn.insertabot.io/widget.js" data-api-key="ib_sk_your_key_here"></script>
 */

(function () {
  "use strict";

  // Configuration
  const SCRIPT_TAG = document.currentScript;
  // Prefer short-lived widget token (data-widget-token). Fall back to legacy data-api-key.
  const API_WIDGET_TOKEN = SCRIPT_TAG?.getAttribute("data-widget-token");
  const API_KEY = SCRIPT_TAG?.getAttribute("data-api-key");
  const API_CREDENTIAL = API_WIDGET_TOKEN || API_KEY;
  const API_CREDENTIAL_HEADER = API_WIDGET_TOKEN ? 'X-Widget-Token' : 'X-API-Key';
  const API_BASE =
    SCRIPT_TAG?.getAttribute("data-api-base") ||
    "https://insertabot.io";
  const DEBUG = SCRIPT_TAG?.getAttribute("data-debug") === "true";

  // Validation
  if (!API_CREDENTIAL) {
    console.error("[Insertabot] Missing data-widget-token or data-api-key attribute");
    return;
  }

  // Logger
  const log = {
    info: (...args) => DEBUG && console.log("[Insertabot]", ...args),
    error: (...args) => console.error("[Insertabot]", ...args),
  };

  // State
  let widgetConfig = null;
  let isOpen = false;
  let messages = [];
  let isGenerating = false;
  let abortController = null;

  // DOM Elements
  let chatBubble = null;
  let chatContainer = null;
  let chatMessages = null;
  let chatInput = null;
  let chatForm = null;
  let tooltipElement = null;

  /**
   * Fetch widget configuration from API
   */
  async function fetchConfig() {
    try {
      const headers = {};
      headers[API_CREDENTIAL_HEADER] = API_CREDENTIAL;

      const response = await fetch(`${API_BASE}/v1/widget/config`, {
        headers: headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch config: ${response.status}`);
      }

      widgetConfig = await response.json();
      log.info("Config loaded:", widgetConfig);
      return widgetConfig;
    } catch (error) {
      log.error("Failed to load configuration:", error);
      throw error;
    }
  }

  /**
   * Create chat bubble (minimized state)
   */
  function createChatBubble() {
    chatBubble = document.createElement("div");
    chatBubble.id = "insertabot-bubble";
    chatBubble.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;

    const safeColor = escapeHtmlAttr(widgetConfig.primary_color || '#3b82f6');
    chatBubble.style.cssText = `
      position: fixed;
      ${widgetConfig.position === "bottom-left" ? "left: 16px;" : "right: 16px;"}
      bottom: 80px;
      width: 56px;
      height: 56px;
      background: ${safeColor};
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      transition: transform 0.2s, box-shadow 0.2s;
      z-index: 999999;
    `;

    chatBubble.addEventListener("mouseenter", () => {
      chatBubble.style.transform = "scale(1.1)";
      chatBubble.style.boxShadow = "0 6px 16px rgba(0, 0, 0, 0.2)";
    });

    chatBubble.addEventListener("mouseleave", () => {
      chatBubble.style.transform = "scale(1)";
      chatBubble.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
    });

    chatBubble.addEventListener("click", toggleChat);

    document.body.appendChild(chatBubble);
    createTooltip();
  }

  function createTooltip() {
    tooltipElement = document.createElement("div");
    tooltipElement.innerHTML = `<span class="insertabot-dots"></span>Try me!`;
    tooltipElement.style.cssText = `position:fixed;${widgetConfig.position==="bottom-left"?"left:82px;":"right:82px;"}bottom:95px;background:white;color:#1f2937;padding:10px 16px;border-radius:20px;font-size:14px;font-weight:600;box-shadow:0 4px 12px rgba(0,0,0,0.15);z-index:999998;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;animation:insertabot-bounce 2s ease-in-out infinite;display:flex;align-items:center;gap:8px;`;
    const style = document.createElement("style");
    const safeColor = escapeHtmlAttr(widgetConfig.primary_color || '#3b82f6');
    style.textContent = `@keyframes insertabot-bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}@keyframes insertabot-pulse{0%,100%{opacity:0.4}50%{opacity:1}}.insertabot-dots{width:6px;height:6px;background:${safeColor};border-radius:50%;position:relative;animation:insertabot-pulse 1.5s ease-in-out infinite}.insertabot-dots::before,.insertabot-dots::after{content:'';position:absolute;width:6px;height:6px;background:${safeColor};border-radius:50%;top:0}.insertabot-dots::before{left:-10px;animation:insertabot-pulse 1.5s ease-in-out infinite 0.2s}.insertabot-dots::after{left:10px;animation:insertabot-pulse 1.5s ease-in-out infinite 0.4s}`;
    document.head.appendChild(style);
    tooltipElement.addEventListener("click", toggleChat);
    document.body.appendChild(tooltipElement);
    setTimeout(() => { if (tooltipElement && !isOpen) tooltipElement.style.display = "none"; }, 10000);
  }

  /**
   * Create chat container (expanded state)
   */
  function createChatContainer() {
    chatContainer = document.createElement("div");
    chatContainer.id = "insertabot-container";
    chatContainer.style.cssText = `
      position: fixed;
      ${widgetConfig.position === "bottom-left" ? "left: 16px;" : "right: 16px;"}
      bottom: 80px;
      width: 400px;
      max-width: calc(100vw - 32px);
      height: 600px;
      max-height: calc(100vh - 80px);
      background: #1a1a1a;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
      display: none;
      flex-direction: column;
      overflow: hidden;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    `;

    // Sanitize config values to prevent XSS
    const sanitizedConfig = {
      primary_color: escapeHtmlAttr(widgetConfig.primary_color || '#3b82f6'),
      bot_avatar_url: escapeHtmlAttr(widgetConfig.bot_avatar_url || ''),
      bot_name: escapeHtml(widgetConfig.bot_name || 'Assistant'),
      greeting_message: escapeHtml(widgetConfig.greeting_message || 'Hello! How can I help you?'),
      placeholder_text: escapeHtmlAttr(widgetConfig.placeholder_text || 'Type your message...')
    };

    chatContainer.innerHTML = `
      <div id="insertabot-header" style="
        background: ${sanitizedConfig.primary_color};
        color: white;
        padding: 16px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      ">
        <div style="display: flex; align-items: center; gap: 12px;">
          ${
            sanitizedConfig.bot_avatar_url
              ? `<img src="${sanitizedConfig.bot_avatar_url}" alt="${sanitizedConfig.bot_name}" style="width: 36px; height: 36px; border-radius: 50%; border: 2px solid white;" />`
              : `<div style="width: 36px; height: 36px; border-radius: 50%; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; font-weight: bold;">${escapeHtml(widgetConfig.bot_name ? widgetConfig.bot_name[0] : 'A')}</div>`
          }
          <div>
            <div style="font-weight: 600; font-size: 16px;">${sanitizedConfig.bot_name}</div>
            <div style="font-size: 12px; opacity: 0.9;">Online</div>
          </div>
        </div>
        <button id="insertabot-close" style="
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <div id="insertabot-messages" style="
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        background: #0f0f0f;
      ">
        <div class="insertabot-message insertabot-message-assistant">
          <div class="insertabot-message-content">${sanitizedConfig.greeting_message}</div>
        </div>
      </div>

      <div id="insertabot-input-container" style="
        padding: 16px;
        background: #1a1a1a;
        border-top: 1px solid #2a2a2a;
      ">
        <form id="insertabot-form" style="display: flex; gap: 8px; align-items: center;">

          <input
            type="text"
            id="insertabot-input"
            placeholder="${sanitizedConfig.placeholder_text}"
            style="
              flex: 1;
              padding: 12px;
              border: 1px solid #2a2a2a;
              border-radius: 8px;
              font-size: 14px;
              outline: none;
              background: #0f0f0f;
              color: #e5e7eb;
            "
          />
          <button
            type="submit"
            id="insertabot-send"
            style="
              background: ${sanitizedConfig.primary_color};
              color: white;
              border: none;
              border-radius: 8px;
              padding: 12px 20px;
              cursor: pointer;
              font-weight: 600;
              font-size: 14px;
              transition: opacity 0.2s;
            "
          >
            Send
          </button>
        </form>
        ${
          widgetConfig.show_branding
            ? `<div style="text-align: center; margin-top: 8px; font-size: 11px; color: #9ca3af;">
               Powered by <a href="https://insertabot.io" target="_blank" style="color: ${widgetConfig.primary_color}; text-decoration: none;">Insertabot</a>
             </div>`
            : ""
        }
      </div>
    `;

    // Add message styles
    const style = document.createElement("style");
    style.textContent = `
      #insertabot-messages::-webkit-scrollbar {
        width: 6px;
      }
      #insertabot-messages::-webkit-scrollbar-track {
        background: transparent;
      }
      #insertabot-messages::-webkit-scrollbar-thumb {
        background: #2a2a2a;
        border-radius: 3px;
      }
      #insertabot-messages::-webkit-scrollbar-thumb:hover {
        background: #3a3a3a;
      }
      .insertabot-message {
        display: flex;
        gap: 8px;
        max-width: 80%;
      }
      .insertabot-message-user {
        margin-left: auto;
        flex-direction: row-reverse;
      }
      .insertabot-message-content {
        background: #1a1a1a;
        color: #e5e7eb;
        padding: 10px 14px;
        border-radius: 12px;
        font-size: 14px;
        line-height: 1.6;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        border: 1px solid #2a2a2a;
      }
      .insertabot-message-content a {
        word-break: break-all;
      }
      .insertabot-message-assistant:hover .insertabot-copy-btn {
        opacity: 1;
      }
      .insertabot-copy-btn:hover {
        background: rgba(0,0,0,0.8) !important;
      }
      .insertabot-message-user .insertabot-message-content {
        background: ${widgetConfig.primary_color};
        color: white;
        border: none;
      }
      #insertabot-input:focus {
        border-color: ${widgetConfig.primary_color};
      }
      #insertabot-input::placeholder {
        color: #6b7280;
      }
      #insertabot-send:hover:not(:disabled) {
        opacity: 0.9;
      }
      #insertabot-send:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

    `;
    document.head.appendChild(style);

    document.body.appendChild(chatContainer);

    // Cache DOM elements
    chatMessages = document.getElementById("insertabot-messages");
    chatInput = document.getElementById("insertabot-input");
    chatForm = document.getElementById("insertabot-form");

    // Event listeners
    document
      .getElementById("insertabot-close")
      .addEventListener("click", toggleChat);
    chatForm.addEventListener("submit", handleSubmit);
  }

  /**
   * Toggle chat open/closed
   */
  function toggleChat() {
    isOpen = !isOpen;

    if (isOpen) {
      chatBubble.style.display = "none";
      if (tooltipElement) tooltipElement.style.display = "none";
      chatContainer.style.display = "flex";
      chatInput.focus();
    } else {
      chatBubble.style.display = "flex";
      chatContainer.style.display = "none";
    }

    log.info("Chat toggled:", isOpen ? "open" : "closed");
  }

  /**
   * Add message to chat
   */
  function addMessage(role, content) {
    messages.push({ role, content });

    const messageDiv = document.createElement("div");
    messageDiv.className = `insertabot-message insertabot-message-${role}`;
    
    const copyBtn = role === 'assistant' ? `
      <button class="insertabot-copy-btn" title="Copy message" style="
        position: absolute;
        top: 8px;
        right: 8px;
        background: rgba(0,0,0,0.6);
        border: none;
        border-radius: 4px;
        padding: 4px 8px;
        cursor: pointer;
        opacity: 0;
        transition: opacity 0.2s;
        color: white;
        font-size: 11px;
      ">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
      </button>
    ` : '';
    
    messageDiv.innerHTML = `
      <div class="insertabot-message-content" style="position: relative;">
        ${copyBtn}
        <div class="insertabot-message-text">${formatMessage(escapeHtml(content))}</div>
      </div>
    `;

    if (role === 'assistant') {
      const btn = messageDiv.querySelector('.insertabot-copy-btn');
      btn.addEventListener('click', () => copyToClipboard(content, btn));
    }

    chatMessages.appendChild(messageDiv);
    smartScroll();

    return messageDiv;
  }



  /**
   * Format message content (markdown-like formatting)
   */
  function formatMessage(text) {
    return text
      // Convert line breaks
      .replace(/\n/g, '<br>')
      // Convert bullet points
      .replace(/^\* (.+)$/gm, '<div style="margin-left: 16px;">• $1</div>')
      // Convert numbered lists
      .replace(/^(\d+)\. (.+)$/gm, '<div style="margin-left: 16px;">$1. $2</div>')
      // Convert URLs to links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" style="color: #60a5fa; text-decoration: underline;">$1</a>')
      // Convert bare URLs
      .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" style="color: #60a5fa; text-decoration: underline;">$1</a>');
  }

  /**
   * Check if user is scrolled to bottom
   */
  function isScrolledToBottom() {
    const threshold = 100;
    return chatMessages.scrollHeight - chatMessages.scrollTop - chatMessages.clientHeight < threshold;
  }

  /**
   * Smart scroll - only auto-scroll if user is at bottom
   */
  function smartScroll() {
    if (isScrolledToBottom()) {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }

  /**
   * Update message content (for streaming)
   */
  function updateMessage(messageDiv, content) {
    const textDiv = messageDiv.querySelector(".insertabot-message-text");
    textDiv.innerHTML = formatMessage(escapeHtml(content));
    smartScroll();
  }

  /**
   * Copy text to clipboard
   */
  function copyToClipboard(text, button) {
    navigator.clipboard.writeText(text).then(() => {
      const originalHTML = button.innerHTML;
      button.innerHTML = '<span style="font-size: 11px;">✓ Copied</span>';
      button.style.background = 'rgba(34, 197, 94, 0.8)';
      setTimeout(() => {
        button.innerHTML = originalHTML;
        button.style.background = 'rgba(0,0,0,0.6)';
      }, 2000);
    }).catch(err => {
      log.error('Failed to copy:', err);
    });
  }



  /**
   * Handle form submission
   */
  async function handleSubmit(e) {
    e.preventDefault();

    const message = chatInput.value.trim();
    if (!message || isGenerating) return;

    addMessage("user", message);
    chatInput.value = "";

    // Disable input
    isGenerating = true;
    chatInput.disabled = true;
    document.getElementById("insertabot-send").disabled = true;

    try {
      await sendMessage(message);
    } catch (error) {
      log.error("Error sending message:", error);
      
      // Remove the failed user message from history to prevent broken state
      messages.pop();
      
      addMessage("assistant", "Sorry, I encountered an error. Please try again.");
    } finally {
      isGenerating = false;
      chatInput.disabled = false;
      document.getElementById("insertabot-send").disabled = false;
      chatInput.focus();
    }
  }

  /**
   * Send message to API
   */
  async function sendMessage(message) {
    abortController = new AbortController();

    const requestBody = {
      messages,
      stream: true,
    };

    const response = await fetch(`${API_BASE}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": API_KEY,
      },
      body: JSON.stringify(requestBody),
      signal: abortController.signal,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Request failed");
    }

    // Handle streaming response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let assistantMessage = "";
    let messageDiv = null;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter((line) => line.trim() !== "");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;

              if (content) {
                assistantMessage += content;

                if (!messageDiv) {
                  messageDiv = addMessage("assistant", assistantMessage);
                } else {
                  updateMessage(messageDiv, assistantMessage);
                }
              }
            } catch (e) {
              log.error("Failed to parse chunk:", e);
            }
          }
        }
      }

      // Update messages array with final response
      if (assistantMessage) {
        messages.push({ role: "assistant", content: assistantMessage });
      }
    } catch (error) {
      if (error.name === "AbortError") {
        log.info("Request aborted");
      } else {
        throw error;
      }
    }
  }

  /**
   * Escape HTML to prevent XSS
   */
  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Escape HTML attribute values
   */
  function escapeHtmlAttr(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /**
   * Initialize widget
   */
  async function init() {
    try {
      log.info("Initializing Insertabot...");

      // Load configuration
      await fetchConfig();

      // Initialize system message
      messages.push({
        role: "system",
        content: widgetConfig.system_prompt,
      });

      // Create UI
      createChatBubble();
      createChatContainer();

      log.info("Insertabot initialized successfully");
    } catch (error) {
      log.error("Failed to initialize Insertabot:", error);
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
