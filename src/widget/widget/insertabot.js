/**
 * Insertabot Embeddable Widget
 * Single script tag integration for any website
 *
 * Usage:
 * <script src="https://cdn.insertabot.io/widget.js" data-api-key="ib_sk_your_key_here"></script>
 */

(function() {
  'use strict';

  // Configuration
  const SCRIPT_TAG = document.currentScript;
  const API_KEY = SCRIPT_TAG?.getAttribute('data-api-key');
  // Default API_BASE to the same origin as the script, or allow override via data-api-base
  const SCRIPT_ORIGIN = SCRIPT_TAG ? new URL(SCRIPT_TAG.src).origin : window.location.origin;
  const API_BASE = SCRIPT_TAG?.getAttribute('data-api-base') || SCRIPT_ORIGIN;
  const DEBUG = SCRIPT_TAG?.getAttribute('data-debug') === 'true';

  // Validation
  if (!API_KEY) {
    console.error('[Insertabot] Missing data-api-key attribute');
    return;
  }

  // Logger
  const log = {
    info: (...args) => DEBUG && console.log('[Insertabot]', ...args),
    error: (...args) => console.error('[Insertabot]', ...args),
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
      const response = await fetch(`${API_BASE}/v1/widget/config`, {
        headers: {
          'X-API-Key': API_KEY,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch config: ${response.status}`);
      }

      widgetConfig = await response.json();
      log.info('Config loaded:', widgetConfig);
      return widgetConfig;
    } catch (error) {
      log.error('Failed to load configuration:', error);
      throw error;
    }
  }

  /**
   * Escape HTML to prevent XSS
   */
  function escapeHtml(text) {
    const div = document.createElement('div');
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
   * Create chat bubble (minimized state)
   */
  function createChatBubble() {
    chatBubble = document.createElement('div');
    chatBubble.id = 'insertabot-bubble';
    chatBubble.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;

    const safeColor = escapeHtmlAttr(widgetConfig.primary_color || '#3b82f6');
    chatBubble.style.cssText = `
      position: fixed;
      ${widgetConfig.position === 'bottom-left' ? 'left: 24px;' : 'right: 24px;'}
      bottom: 80px;
      width: 60px;
      height: 60px;
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

    chatBubble.addEventListener('mouseenter', () => {
      chatBubble.style.transform = 'scale(1.1)';
      chatBubble.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)';
    });

    chatBubble.addEventListener('mouseleave', () => {
      chatBubble.style.transform = 'scale(1)';
      chatBubble.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    });

    chatBubble.addEventListener('click', toggleChat);

    document.body.appendChild(chatBubble);
    createTooltip();
  }

  /**
   * Create tooltip with "Try me!" message
   */
  function createTooltip() {
    tooltipElement = document.createElement('div');
    tooltipElement.id = 'insertabot-tooltip';
    tooltipElement.innerHTML = `
      <span class="insertabot-dots"></span>
      Try me!
    `;

    tooltipElement.style.cssText = `
      position: fixed;
      ${widgetConfig.position === 'bottom-left' ? 'left: 94px;' : 'right: 94px;'}
      bottom: 95px;
      background: white;
      color: #1f2937;
      padding: 10px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 999998;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      animation: insertabot-bounce 2s ease-in-out infinite;
      display: flex;
      align-items: center;
      gap: 8px;
    `;

    const style = document.createElement('style');
    const safeColorForStyle = escapeHtmlAttr(widgetConfig.primary_color || '#3b82f6');
    style.textContent = `
      @keyframes insertabot-bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-5px); }
      }
      @keyframes insertabot-pulse {
        0%, 100% { opacity: 0.4; }
        50% { opacity: 1; }
      }
      .insertabot-dots {
        width: 6px;
        height: 6px;
        background: ${safeColorForStyle};
        border-radius: 50%;
        position: relative;
        animation: insertabot-pulse 1.5s ease-in-out infinite;
      }
      .insertabot-dots::before,
      .insertabot-dots::after {
        content: '';
        position: absolute;
        width: 6px;
        height: 6px;
        background: ${safeColorForStyle};
        border-radius: 50%;
        top: 0;
      }
      .insertabot-dots::before {
        left: -10px;
        animation: insertabot-pulse 1.5s ease-in-out infinite 0.2s;
      }
      .insertabot-dots::after {
        left: 10px;
        animation: insertabot-pulse 1.5s ease-in-out infinite 0.4s;
      }
    `;
    document.head.appendChild(style);

    tooltipElement.addEventListener('click', toggleChat);
    document.body.appendChild(tooltipElement);

    // Hide tooltip after 10 seconds or on first interaction
    setTimeout(() => {
      if (tooltipElement && !isOpen) {
        tooltipElement.style.display = 'none';
      }
    }, 10000);
  }

  /**
   * Create chat container (expanded state)
   */
  function createChatContainer() {
    chatContainer = document.createElement('div');
    chatContainer.id = 'insertabot-container';
    chatContainer.style.cssText = `
      position: fixed;
      ${widgetConfig.position === 'bottom-left' ? 'left: 24px;' : 'right: 24px;'}
      bottom: 80px;
      width: 400px;
      max-width: calc(100vw - 48px);
      height: 600px;
      max-height: calc(100vh - 100px);
      background: white;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
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
          ${sanitizedConfig.bot_avatar_url
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
        background: #1f2937;
      ">
        <div class="insertabot-message insertabot-message-assistant">
          <div class="insertabot-message-content">${sanitizedConfig.greeting_message}</div>
        </div>
      </div>

      <div id="insertabot-input-container" style="
        padding: 16px;
        background: #111827;
        border-top: 1px solid #374151;
      ">
        <form id="insertabot-form" style="display: flex; gap: 8px;">
          <input
            type="text"
            id="insertabot-input"
            placeholder="${sanitizedConfig.placeholder_text}"
            style="
              flex: 1;
              padding: 12px;
              border: 1px solid #374151;
              border-radius: 8px;
              font-size: 14px;
              outline: none;
              background: #1f2937;
              color: #f9fafb;
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
        ${widgetConfig.show_branding
          ? `<div style="text-align: center; margin-top: 8px; font-size: 11px; color: #9ca3af;">
               Powered by <a href="https://insertabot.io" target="_blank" style="color: #60a5fa; text-decoration: none;">Insertabot</a>
             </div>`
          : ''
        }
      </div>
    `;

    // Add message styles
    const style = document.createElement('style');
    style.textContent = `
      #insertabot-messages::-webkit-scrollbar {
        width: 6px;
      }
      #insertabot-messages::-webkit-scrollbar-track {
        background: transparent;
      }
      #insertabot-messages::-webkit-scrollbar-thumb {
        background: #d1d5db;
        border-radius: 3px;
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
        background: #374151;
        color: #f9fafb;
        padding: 10px 14px;
        border-radius: 12px;
        font-size: 14px;
        line-height: 1.5;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
      }
      .insertabot-message-user .insertabot-message-content {
        background: ${sanitizedConfig.primary_color};
        color: white;
      }
      #insertabot-input::placeholder {
        color: #6b7280;
      }
      #insertabot-input:focus {
        border-color: ${sanitizedConfig.primary_color};
      }
      #insertabot-send:hover:not(:disabled) {
        opacity: 0.9;
      }
      #insertabot-send:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .insertabot-typing-indicator {
        display: flex;
        gap: 4px;
        align-items: center;
        padding: 14px !important;
      }
      .insertabot-typing-indicator span {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #d1d5db;
        animation: insertabot-typing-bounce 1.4s infinite ease-in-out both;
      }
      .insertabot-typing-indicator span:nth-child(1) {
        animation-delay: -0.32s;
      }
      .insertabot-typing-indicator span:nth-child(2) {
        animation-delay: -0.16s;
      }
      @keyframes insertabot-typing-bounce {
        0%, 80%, 100% {
          transform: scale(0.8);
          opacity: 0.5;
        }
        40% {
          transform: scale(1);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(chatContainer);

    // Cache DOM elements
    chatMessages = document.getElementById('insertabot-messages');
    chatInput = document.getElementById('insertabot-input');
    chatForm = document.getElementById('insertabot-form');

    // Event listeners
    document.getElementById('insertabot-close').addEventListener('click', toggleChat);
    chatForm.addEventListener('submit', handleSubmit);
  }

  /**
   * Toggle chat open/closed
   */
  function toggleChat() {
    isOpen = !isOpen;

    if (isOpen) {
      chatBubble.style.display = 'none';
      if (tooltipElement) tooltipElement.style.display = 'none';
      chatContainer.style.display = 'flex';
      chatInput.focus();
    } else {
      chatBubble.style.display = 'flex';
      chatContainer.style.display = 'none';
    }

    log.info('Chat toggled:', isOpen ? 'open' : 'closed');
  }

  /**
   * Add message to chat
   */
  function addMessage(role, content) {
    messages.push({ role, content });

    const messageDiv = document.createElement('div');
    messageDiv.className = `insertabot-message insertabot-message-${role}`;
    messageDiv.innerHTML = `
      <div class="insertabot-message-content">${escapeHtml(content)}</div>
    `;

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    return messageDiv;
  }

  /**
   * Update message content (for streaming)
   */
  function updateMessage(messageDiv, content) {
    const contentDiv = messageDiv.querySelector('.insertabot-message-content');
    contentDiv.textContent = content;
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  /**
   * Add typing indicator
   */
  function addTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'insertabot-message insertabot-message-assistant';
    typingDiv.id = 'insertabot-typing';
    typingDiv.innerHTML = `
      <div class="insertabot-message-content insertabot-typing-indicator">
        <span></span>
        <span></span>
        <span></span>
      </div>
    `;

    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    return typingDiv;
  }

  /**
   * Remove typing indicator
   */
  function removeTypingIndicator() {
    const typingDiv = document.getElementById('insertabot-typing');
    if (typingDiv) {
      typingDiv.remove();
    }
  }

  /**
   * Handle form submission
   */
  async function handleSubmit(event) {
    event.preventDefault();

    const message = chatInput.value.trim();
    if (!message || isGenerating) return;

    // Add user message
    addMessage('user', message);
    chatInput.value = '';

    // Disable input
    isGenerating = true;
    chatInput.disabled = true;
    document.getElementById('insertabot-send').disabled = true;

    try {
      await sendMessage(message);
    } catch (error) {
      log.error('Error sending message:', error);
      addMessage('assistant', 'Sorry, I encountered an error. Please try again.');
    } finally {
      isGenerating = false;
      chatInput.disabled = false;
      document.getElementById('insertabot-send').disabled = false;
      chatInput.focus();
    }
  }

  /**
   * Send message to API
   */
  async function sendMessage(userMessage) {
    // Show typing indicator immediately
    addTypingIndicator();

    abortController = new AbortController();

    const requestBody = {
      messages: messages,
      stream: true,
      temperature: widgetConfig.temperature,
      max_tokens: widgetConfig.max_tokens,
    };

    try {
      const response = await fetch(`${API_BASE}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY,
        },
        body: JSON.stringify(requestBody),
        signal: abortController.signal,
      });

      if (!response.ok) {
        removeTypingIndicator();
        const error = await response.json();
        throw new Error(error.error || 'Request failed');
      }

      // Handle streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';
      let messageDiv = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;

              if (content) {
                assistantMessage += content;

                if (!messageDiv) {
                  // Remove typing indicator when first chunk arrives
                  removeTypingIndicator();
                  messageDiv = addMessage('assistant', assistantMessage);
                } else {
                  updateMessage(messageDiv, assistantMessage);
                }
              }
            } catch (e) {
              log.error('Failed to parse chunk:', e);
            }
          }
        }
      }

      // Update messages array with final response
      if (assistantMessage) {
        messages.push({ role: 'assistant', content: assistantMessage });
      }
    } catch (error) {
      removeTypingIndicator();
      if (error.name === 'AbortError') {
        log.info('Request aborted');
      } else {
        throw error;
      }
    }
  }

  /**
   * Initialize widget
   */
  async function init() {
    try {
      log.info('Initializing Insertabot...');

      // Load configuration
      await fetchConfig();

      // Initialize system message
      messages.push({
        role: 'system',
        content: widgetConfig.system_prompt,
      });

      // Create UI
      createChatBubble();
      createChatContainer();

      log.info('Insertabot initialized successfully');
    } catch (error) {
      log.error('Failed to initialize Insertabot:', error);
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();