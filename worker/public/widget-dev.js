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
  let currentImage = null; // Store uploaded image data

  // DOM Elements
  let chatBubble = null;
  let chatContainer = null;
  let chatMessages = null;
  let chatInput = null;
  let chatForm = null;
  let imagePreview = null;
  let imageInput = null;

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

    chatBubble.style.cssText = `
      position: fixed;
      ${widgetConfig.position === "bottom-left" ? "left: 24px;" : "right: 24px;"}
      bottom: 24px;
      width: 60px;
      height: 60px;
      background: ${widgetConfig.primary_color};
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
  }

  /**
   * Create chat container (expanded state)
   */
  function createChatContainer() {
    chatContainer = document.createElement("div");
    chatContainer.id = "insertabot-container";
    chatContainer.style.cssText = `
      position: fixed;
      ${widgetConfig.position === "bottom-left" ? "left: 24px;" : "right: 24px;"}
      bottom: 24px;
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

    chatContainer.innerHTML = `
      <div id="insertabot-header" style="
        background: ${widgetConfig.primary_color};
        color: white;
        padding: 16px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      ">
        <div style="display: flex; align-items: center; gap: 12px;">
          ${
            widgetConfig.bot_avatar_url
              ? `<img src="${widgetConfig.bot_avatar_url}" alt="${widgetConfig.bot_name}" style="width: 36px; height: 36px; border-radius: 50%; border: 2px solid white;" />`
              : `<div style="width: 36px; height: 36px; border-radius: 50%; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; font-weight: bold;">${widgetConfig.bot_name[0]}</div>`
          }
          <div>
            <div style="font-weight: 600; font-size: 16px;">${widgetConfig.bot_name}</div>
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
        background: #f9fafb;
      ">
        <div class="insertabot-message insertabot-message-assistant">
          <div class="insertabot-message-content">${widgetConfig.greeting_message}</div>
        </div>
      </div>

      <div id="insertabot-input-container" style="
        padding: 16px;
        background: white;
        border-top: 1px solid #e5e7eb;
      ">
        <div id="insertabot-image-preview" style="display: none; margin-bottom: 12px; padding: 12px; background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <img id="insertabot-preview-img" style="max-width: 100px; max-height: 100px; border-radius: 4px; object-fit: cover;" />
              <span id="insertabot-preview-name" style="font-size: 12px; color: #6b7280;"></span>
            </div>
            <button type="button" id="insertabot-remove-image" style="background: #ef4444; color: white; border: none; border-radius: 4px; padding: 6px 12px; cursor: pointer; font-size: 12px; transition: opacity 0.2s;">
              Remove
            </button>
          </div>
        </div>
        <form id="insertabot-form" style="display: flex; gap: 8px;">
          <input type="file" id="insertabot-image-input" accept="image/jpeg,image/jpg,image/png,image/webp" style="display: none;" />
          <button
            type="button"
            id="insertabot-image-btn"
            style="
              background: #f3f4f6;
              color: #6b7280;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              padding: 12px;
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
              transition: background 0.2s;
            "
            title="Upload image"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
          </button>
          <input
            type="text"
            id="insertabot-input"
            placeholder="${widgetConfig.placeholder_text}"
            style="
              flex: 1;
              padding: 12px;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              font-size: 14px;
              outline: none;
            "
          />
          <button
            type="submit"
            id="insertabot-send"
            style="
              background: ${widgetConfig.primary_color};
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
               Powered by <a href="https://insertabot.com" target="_blank" style="color: ${widgetConfig.primary_color}; text-decoration: none;">Insertabot</a>
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
        background: white;
        padding: 10px 14px;
        border-radius: 12px;
        font-size: 14px;
        line-height: 1.5;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      }
      .insertabot-message-user .insertabot-message-content {
        background: ${widgetConfig.primary_color};
        color: white;
      }
      #insertabot-input:focus {
        border-color: ${widgetConfig.primary_color};
      }
      #insertabot-send:hover:not(:disabled) {
        opacity: 0.9;
      }
      #insertabot-send:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      #insertabot-image-btn:hover {
        background: #e5e7eb;
      }
      #insertabot-remove-image:hover {
        opacity: 0.9;
      }
      .insertabot-message-image {
        max-width: 200px;
        max-height: 200px;
        border-radius: 8px;
        margin-top: 8px;
        object-fit: cover;
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(chatContainer);

    // Cache DOM elements
    chatMessages = document.getElementById("insertabot-messages");
    chatInput = document.getElementById("insertabot-input");
    chatForm = document.getElementById("insertabot-form");
    imagePreview = document.getElementById("insertabot-image-preview");
    imageInput = document.getElementById("insertabot-image-input");

    // Event listeners
    document
      .getElementById("insertabot-close")
      .addEventListener("click", toggleChat);
    chatForm.addEventListener("submit", handleSubmit);
    document
      .getElementById("insertabot-image-btn")
      .addEventListener("click", () => imageInput.click());
    imageInput.addEventListener("change", handleImageUpload);
    document
      .getElementById("insertabot-remove-image")
      .addEventListener("click", removeImage);
  }

  /**
   * Toggle chat open/closed
   */
  function toggleChat() {
    isOpen = !isOpen;

    if (isOpen) {
      chatBubble.style.display = "none";
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
  function addMessage(role, content, imageData = null) {
    messages.push({ role, content });

    const messageDiv = document.createElement("div");
    messageDiv.className = `insertabot-message insertabot-message-${role}`;

    let imageHtml = "";
    if (imageData) {
      imageHtml = `<img src="${imageData}" class="insertabot-message-image" />`;
    }

    messageDiv.innerHTML = `
      <div class="insertabot-message-content">
        ${escapeHtml(content)}
        ${imageHtml}
      </div>
    `;

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    return messageDiv;
  }

  /**
   * Update message content (for streaming)
   */
  function updateMessage(messageDiv, content) {
    const contentDiv = messageDiv.querySelector(".insertabot-message-content");
    contentDiv.textContent = content;
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  /**
   * Handle image upload
   */
  async function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      alert("Please upload a valid image (JPEG, PNG, or WebP)");
      return;
    }

    // Validate file size (4MB max)
    const maxSize = 4 * 1024 * 1024;
    if (file.size > maxSize) {
      alert("Image must be less than 4MB");
      return;
    }

    try {
      // Convert to base64
      const base64Image = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Store image data
      currentImage = {
        name: file.name,
        data: base64Image,
      };

      // Show preview
      showImagePreview(file.name, base64Image);

      log.info("Image uploaded:", file.name);
    } catch (error) {
      log.error("Error uploading image:", error);
      alert("Failed to upload image. Please try again.");
    }
  }

  /**
   * Show image preview
   */
  function showImagePreview(filename, imageData) {
    document.getElementById("insertabot-preview-img").src = imageData;
    document.getElementById("insertabot-preview-name").textContent = filename;
    imagePreview.style.display = "block";
  }

  /**
   * Remove uploaded image
   */
  function removeImage() {
    currentImage = null;
    imagePreview.style.display = "none";
    imageInput.value = "";
    log.info("Image removed");
  }

  /**
   * Handle form submission
   */
  async function handleSubmit(event) {
    event.preventDefault();

    const message = chatInput.value.trim();
    if ((!message && !currentImage) || isGenerating) return;

    const messageText = message || "What do you see in this image?";
    const imageData = currentImage ? currentImage.data : null;

    // Add user message with image
    addMessage("user", messageText, imageData);
    chatInput.value = "";

    // Clear image preview
    if (currentImage) {
      removeImage();
    }

    // Disable input
    isGenerating = true;
    chatInput.disabled = true;
    document.getElementById("insertabot-send").disabled = true;
    document.getElementById("insertabot-image-btn").disabled = true;

    try {
      await sendMessage(messageText, imageData);
    } catch (error) {
      log.error("Error sending message:", error);
      addMessage(
        "assistant",
        "Sorry, I encountered an error. Please try again.",
      );
    } finally {
      isGenerating = false;
      chatInput.disabled = false;
      document.getElementById("insertabot-send").disabled = false;
      document.getElementById("insertabot-image-btn").disabled = false;
      chatInput.focus();
    }
  }

  /**
   * Send message to API
   */
  async function sendMessage(userMessage, imageData = null) {
    abortController = new AbortController();

    // Build the message content
    let messageContent;
    if (imageData) {
      // Vision request with image
      messageContent = [
        { type: "text", text: userMessage },
        { type: "image_url", image_url: { url: imageData } },
      ];
    } else {
      // Regular text message
      messageContent = userMessage;
    }

    // Update messages array with the new user message
    messages[messages.length - 1] = {
      role: "user",
      content: messageContent,
    };

    const requestBody = {
      messages: messages,
      stream: true,
      temperature: widgetConfig.temperature,
      max_tokens: widgetConfig.max_tokens,
      model: imageData ? "llama-3.2-vision" : widgetConfig.model, // Use vision model if image attached
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
