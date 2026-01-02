export function getWidgetScript(apiOrigin: string): string {
  return `(function() {
    'use strict';

    // ============================================================================
    // API KEY VALIDATION - Prevents silent failures
    // ============================================================================
    const scriptElement = document.currentScript;
    const apiKey = scriptElement?.getAttribute("data-api-key");
    
    // Validate API key exists and is not a placeholder
    if (!apiKey || apiKey === "" || apiKey === "ib_sk_demo_REPLACE") {
        console.error("═══════════════════════════════════════════════════════");
        console.error("🚫 [Insertabot] MISSING OR INVALID API KEY");
        console.error("═══════════════════════════════════════════════════════");
        console.error("");
        console.error("The Insertabot widget requires a valid API key to function.");
        console.error("");
        console.error("❌ Current value:", apiKey || "(empty)");
        console.error("");
        console.error("📝 Correct usage:");
        console.error('   <script src="' + scriptElement?.src + '"');
        console.error('           data-api-key="YOUR_API_KEY_HERE"></script>');
        console.error("");
        console.error("🔑 Get your API key:");
        console.error("   → Sign up at: https://insertabot.mistyk.media/signup");
        console.error("   → Or visit dashboard: https://insertabot.mistyk.media/dashboard");
        console.error("");
        console.error("💡 Need help? Check the docs:");
        console.error("   https://github.com/M1ztick/insertabot_by_mistyk_media/blob/main/SETUP_GUIDE.md");
        console.error("");
        console.error("═══════════════════════════════════════════════════════");
        
        // Show visual error indicator on page
        const errorBanner = document.createElement("div");
        errorBanner.style.cssText = 'position:fixed;bottom:20px;right:20px;background:#dc2626;color:white;padding:16px 24px;border-radius:12px;box-shadow:0 4px 12px rgba(220,38,38,0.4);z-index:9999999;font-family:system-ui,-apple-system,sans-serif;max-width:400px;animation:slideInRight 0.3s ease-out';
        errorBanner.innerHTML = '<div style="display:flex;align-items:start;gap:12px"><svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg><div><strong style="display:block;font-size:15px;margin-bottom:4px">Insertabot Configuration Error</strong><p style="margin:0;font-size:13px;opacity:0.95;line-height:1.4">Missing API key. Check browser console for details.</p></div><button onclick="this.parentElement.parentElement.remove()" style="background:rgba(255,255,255,0.2);border:none;color:white;cursor:pointer;padding:4px;border-radius:6px;margin-left:auto" aria-label="Dismiss"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 4L4 12M4 4l8 8"/></svg></button></div><style>@keyframes slideInRight{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}</style>';
        document.body.appendChild(errorBanner);
        
        // Auto-dismiss after 15 seconds
        setTimeout(() => errorBanner.remove(), 15000);
        
        return; // Stop widget initialization
    }

    // Configuration & State Management
    const InsertabotCore = {
        scriptRef: scriptElement,
        credentials: {
            key: apiKey, // Now guaranteed to be valid
            endpoint: scriptElement?.getAttribute("data-api-base") || "${apiOrigin}"
        },
        quotas: {
            freeTierMax: 50,
            storageIdentifier: 'ib_usage_tracker'
        },
        state: {
            widgetConfig: null,
            isWidgetVisible: false,
            conversationHistory: [],
            processingRequest: false,
            userQuota: { consumed: 0, resetDate: null },
            requestAbortSignal: null,
            subscriptionTier: 'free'
        },
        ui: {
            launcher: null,
            chatFrame: null,
            messageContainer: null,
            inputField: null,
            submitForm: null
        }
    };

    // Quota Management System
    const QuotaManager = {
        retrieveUsageData() {
            const cached = localStorage.getItem(InsertabotCore.quotas.storageIdentifier);
            if (!cached) return this.resetQuota();

            const parsedData = JSON.parse(cached);
            const currentDate = new Date().toDateString();

            if (parsedData.resetDate !== currentDate) {
                return this.resetQuota();
            }
            return parsedData;
        },

        resetQuota() {
            const freshQuota = { consumed: 0, resetDate: new Date().toDateString() };
            localStorage.setItem(InsertabotCore.quotas.storageIdentifier, JSON.stringify(freshQuota));
            return freshQuota;
        },

        recordUsage() {
            const usage = this.retrieveUsageData();
            usage.consumed++;
            localStorage.setItem(InsertabotCore.quotas.storageIdentifier, JSON.stringify(usage));
            return usage.consumed;
        },

        hasReachedLimit() {
            const usage = this.retrieveUsageData();
            return usage.consumed >= InsertabotCore.quotas.freeTierMax;
        }
    };

    // Upgrade Prompt System
    const UpgradePrompt = {
        display() {
            const overlay = document.createElement('div');
            overlay.setAttribute('role', 'dialog');
            overlay.setAttribute('aria-modal', 'true');
            overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:10000000;font-family:system-ui,-apple-system,sans-serif;animation:fadeIn 0.2s ease-out';

            overlay.innerHTML = '<div style="background:#ffffff;border-radius:20px;padding:40px;max-width:440px;box-shadow:0 25px 75px rgba(0,0,0,0.25);text-align:center;animation:slideUp 0.3s ease-out"><div style="width:64px;height:64px;margin:0 auto 20px;background:linear-gradient(135deg,#f59e0b,#ef4444);border-radius:50%;display:flex;align-items:center;justify-content:center"><svg width="32" height="32" fill="white" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg></div><h2 style="margin:0 0 12px;font-size:28px;color:#111827;font-weight:700">Daily Limit Reached</h2><p style="margin:0 0 28px;color:#6b7280;font-size:17px;line-height:1.6">You\\'ve used all <strong>50 free messages</strong> today.<br>Upgrade to Pro for unlimited playground chats + 500 embedded messages/month.</p><div style="display:flex;gap:12px;flex-direction:column"><a href="#pricing" style="display:block;background:linear-gradient(135deg,#6366f1,#a855f7);color:white;padding:16px 28px;border-radius:12px;text-decoration:none;font-weight:700;font-size:16px;box-shadow:0 4px 14px rgba(99,102,241,0.4);transition:transform 0.2s,box-shadow 0.2s" onmouseover="this.style.transform=\\'translateY(-2px)\\';this.style.boxShadow=\\'0 6px 20px rgba(99,102,241,0.5)\\'" onmouseout="this.style.transform=\\'\\';this.style.boxShadow=\\'0 4px 14px rgba(99,102,241,0.4)\\'" onclick="this.closest(\\'[role=dialog]\\').remove();document.querySelector(\\'#pricing\\')?.scrollIntoView({behavior:\\'smooth\\'})">⚡ Upgrade to Pro — $9.99/mo</a><button onclick="this.closest(\\'[role=dialog]\\').remove()" style="background:#f3f4f6;color:#374151;padding:14px 28px;border:2px solid #e5e7eb;border-radius:12px;font-weight:600;font-size:15px;cursor:pointer;transition:all 0.2s" onmouseover="this.style.background=\\'#e5e7eb\\'" onmouseout="this.style.background=\\'#f3f4f6\\'">Continue Tomorrow</button></div><p style="margin:24px 0 0;font-size:13px;color:#9ca3af">Resets at midnight in your local timezone</p></div><style>@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }@keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }</style>';
            document.body.appendChild(overlay);
        }
    };

    // Configuration Loader
    const ConfigLoader = {
        async fetch() {
            try {
                const response = await fetch(InsertabotCore.credentials.endpoint + '/v1/widget/config', {
                    headers: { "X-API-Key": InsertabotCore.credentials.key }
                });

                if (!response.ok) {
                    throw new Error('Configuration fetch failed with status: ' + response.status);
                }

                InsertabotCore.state.widgetConfig = await response.json();
                return InsertabotCore.state.widgetConfig;
            } catch (err) {
                console.error("[Insertabot] Configuration retrieval error:", err);
                throw err;
            }
        }
    };

    // UI Builder - Launcher Button
    const LauncherButton = {
        build() {
            const cfg = InsertabotCore.state.widgetConfig;
            const button = document.createElement("button");
            button.id = "ib-launcher";
            button.setAttribute('aria-label', 'Open chat widget');
            button.innerHTML = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>';

            const position = cfg.position === "bottom-left" ? "left:28px" : "right:28px";
            button.style.cssText = 'position:fixed;bottom:28px;' + position + ';width:64px;height:64px;background:' + cfg.primary_color + ';border:none;border-radius:50%;color:white;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,0.2);transition:all 0.3s cubic-bezier(0.4,0,0.2,1);z-index:9999998;';

            button.addEventListener("mouseenter", function() {
                button.style.transform = "scale(1.15) rotate(5deg)";
                button.style.boxShadow = "0 8px 32px rgba(0,0,0,0.25)";
            });
            button.addEventListener("mouseleave", function() {
                button.style.transform = "scale(1) rotate(0deg)";
                button.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";
            });
            button.addEventListener("click", function() {
                WidgetController.toggle();
            });

            document.body.appendChild(button);
            InsertabotCore.ui.launcher = button;
        }
    };

    // Message Renderer
    const MessageRenderer = {
        create(sender, textContent) {
            InsertabotCore.state.conversationHistory.push({ role: sender, content: textContent });

            const bubble = document.createElement("div");
            bubble.className = 'ib-msg ib-msg-' + sender;
            bubble.innerHTML = '<div class="ib-msg-text">' + this.sanitize(textContent) + '</div>';

            InsertabotCore.ui.messageContainer.appendChild(bubble);
            this.scrollToBottom();
            return bubble;
        },

        update(bubbleElement, textContent) {
            bubbleElement.querySelector(".ib-msg-text").textContent = textContent;
            this.scrollToBottom();
            return bubbleElement;
        },

        sanitize(rawText) {
            const wrapper = document.createElement('div');
            wrapper.textContent = rawText;
            return wrapper.innerHTML;
        },

        scrollToBottom() {
            InsertabotCore.ui.messageContainer.scrollTop = InsertabotCore.ui.messageContainer.scrollHeight;
        }
    };

    // AI Communication Handler
    const AIMessenger = {
        async process(userInput) {
            const usageCount = QuotaManager.recordUsage();
            console.log('[Insertabot] Request #' + usageCount + '/' + InsertabotCore.quotas.freeTierMax);

            InsertabotCore.state.requestAbortSignal = new AbortController();
            const cfg = InsertabotCore.state.widgetConfig;

            const payload = {
                messages: InsertabotCore.state.conversationHistory,
                stream: true,
                temperature: cfg.temperature,
                max_tokens: cfg.max_tokens
            };

            try {
                const apiResponse = await fetch(InsertabotCore.credentials.endpoint + '/v1/chat/completions', {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-API-Key": InsertabotCore.credentials.key
                    },
                    body: JSON.stringify(payload),
                    signal: InsertabotCore.state.requestAbortSignal.signal
                });

                if (!apiResponse.ok) {
                    let errText = null;
                    try {
                        const json = await apiResponse.json();
                        errText = json?.error || JSON.stringify(json);
                    } catch (e) {
                        try { errText = await apiResponse.text(); } catch (e2) { }
                    }
                    console.error('[Insertabot] API response error', apiResponse.status, errText);
                    throw new Error(errText || 'API request failed (status=' + apiResponse.status + ')');
                }

                const streamReader = apiResponse.body.getReader();
                const textDecoder = new TextDecoder();
                let accumulatedResponse = "";
                let messageBubble = null;

                while (true) {
                    const result = await streamReader.read();
                    if (result.done) break;

                    const chunk = textDecoder.decode(result.value, { stream: true });
                    chunk.split("\\n")
                        .filter(function(line) { return line.trim(); })
                        .forEach(function(line) {
                            if (line.startsWith("data: ")) {
                                const payload = line.slice(6);
                                if (payload === "[DONE]") return;

                                try {
                                    const parsed = JSON.parse(payload);
                                    const token = parsed.choices?.[0]?.delta?.content;
                                    if (token) {
                                        accumulatedResponse += token;
                                        messageBubble = messageBubble
                                            ? MessageRenderer.update(messageBubble, accumulatedResponse)
                                            : MessageRenderer.create("assistant", accumulatedResponse);
                                    }
                                } catch (parseErr) {
                                    // Ignore malformed JSON chunks
                                }
                            }
                        });
                }

                InsertabotCore.state.conversationHistory.push({
                    role: "assistant",
                    content: accumulatedResponse
                });

                // Check quota limit
                if (usageCount >= InsertabotCore.quotas.freeTierMax) {
                    setTimeout(function() { UpgradePrompt.display(); }, 1200);
                }
            } catch (err) {
                if (err.name !== "AbortError") {
                    console.error("[Insertabot] Communication error:", err);
                    MessageRenderer.create("assistant", "⚠️ Unable to process your message. Please retry.");
                }
            }
        }
    };

    // Main Chat Interface Builder
    const ChatInterface = {
        build() {
            const cfg = InsertabotCore.state.widgetConfig;
            const frame = document.createElement("div");
            frame.id = "ib-chat-frame";
            frame.setAttribute('role', 'complementary');
            frame.setAttribute('aria-label', 'Chat interface');

            const alignment = cfg.position === "bottom-left" ? "left:28px" : "right:28px";
            frame.style.cssText = 'position:fixed;bottom:28px;' + alignment + ';width:420px;max-width:calc(100vw - 56px);height:640px;max-height:calc(100vh - 120px);background:#ffffff;border-radius:20px;box-shadow:0 12px 48px rgba(0,0,0,0.18);display:none;flex-direction:column;overflow:hidden;z-index:9999998;font-family:-apple-system,BlinkMacSystemFont,\\'Segoe UI\\',Roboto,\\'Helvetica Neue\\',Arial,sans-serif;';

            frame.innerHTML = '<header style="background:' + cfg.primary_color + ';color:#fff;padding:20px;display:flex;align-items:center;justify-content:space-between;border-radius:20px 20px 0 0"><div style="display:flex;align-items:center;gap:12px">' + (cfg.bot_avatar_url ? '<img src="' + cfg.bot_avatar_url + '" alt="Bot avatar" style="width:36px;height:36px;border-radius:50%;border:2px solid rgba(255,255,255,0.3);object-fit:cover"/>' : '<div style="width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;font-weight:bold">' + cfg.bot_name[0] + '</div>') + '<div><div style="font-weight:600;font-size:16px;letter-spacing:-0.2px">' + cfg.bot_name + '</div><div style="font-size:12px;opacity:0.9;margin-top:2px">🟢 Active now</div></div></div><button id="ib-close-btn" aria-label="Close chat" style="background:rgba(255,255,255,0.2);border:none;color:#fff;cursor:pointer;padding:4px;display:flex;align-items:center;justify-content:center"><svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button></header><div id="ib-messages" style="flex:1;overflow-y:auto;padding:20px;display:flex;flex-direction:column;gap:14px;background:linear-gradient(to bottom, #f8fafc, #f1f5f9)"></div><footer style="padding:18px;background:#fff;border-top:2px solid #e2e8f0"><form id="ib-input-form" style="display:flex;gap:10px;align-items:flex-end"><input type="text" id="ib-text-input" placeholder="Ask me anything..." aria-label="Message input" style="flex:1;padding:14px 16px;border:2px solid #e2e8f0;border-radius:12px;font-size:15px;outline:none;font-family:inherit;transition:border-color 0.2s;background:#f8fafc"/><button type="submit" id="ib-send-btn" aria-label="Send message" style="background:' + cfg.primary_color + ';color:white;border:none;border-radius:12px;padding:14px 24px;cursor:pointer;font-weight:700;font-size:15px;transition:opacity 0.2s;min-width:80px" onmouseover="if(!this.disabled) this.style.opacity=\\'0.85\\'" onmouseout="this.style.opacity=\\'1\\'">Send</button></form></footer>';

            // Inject custom styles
            const styleSheet = document.createElement("style");
            styleSheet.textContent = '#ib-messages::-webkit-scrollbar { width: 8px; }#ib-messages::-webkit-scrollbar-track { background: transparent; }#ib-messages::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }#ib-messages::-webkit-scrollbar-thumb:hover { background: #94a3b8; }.ib-msg { display: flex; gap: 10px; max-width: 85%; animation: slideIn 0.3s ease-out; }.ib-msg-user { margin-left: auto; flex-direction: row-reverse; }.ib-msg-text { background: #ffffff; color: #1e293b; padding: 12px 16px; border-radius: 16px; font-size: 15px; line-height: 1.5; box-shadow: 0 2px 8px rgba(0,0,0,0.06); word-wrap: break-word; }.ib-msg-user .ib-msg-text { background: ' + cfg.primary_color + '; color: #fff; border-bottom-right-radius: 4px; }.ib-msg-assistant .ib-msg-text { border-bottom-left-radius: 4px; }#ib-text-input:focus { border-color: ' + cfg.primary_color + '; background: #fff; }#ib-send-btn:disabled { opacity: 0.5; cursor: not-allowed; }@keyframes slideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }';
            document.head.appendChild(styleSheet);
            document.body.appendChild(frame);

            // Store UI references
            InsertabotCore.ui.chatFrame = frame;
            InsertabotCore.ui.messageContainer = document.getElementById("ib-messages");
            InsertabotCore.ui.inputField = document.getElementById("ib-text-input");
            InsertabotCore.ui.submitForm = document.getElementById("ib-input-form");

            // Display welcome message
            MessageRenderer.create("assistant", cfg.greeting_message);

            // Wire up event handlers
            document.getElementById("ib-close-btn").addEventListener("click", function() {
                WidgetController.toggle();
            });

            InsertabotCore.ui.submitForm.addEventListener("submit", async function(evt) {
                evt.preventDefault();

                const userText = InsertabotCore.ui.inputField.value.trim();
                if (!userText || InsertabotCore.state.processingRequest) return;

                MessageRenderer.create("user", userText);
                InsertabotCore.ui.inputField.value = "";

                InsertabotCore.state.processingRequest = true;
                InsertabotCore.ui.inputField.disabled = true;
                document.getElementById("ib-send-btn").disabled = true;

                try {
                    InsertabotCore.state.conversationHistory.push({
                        role: "user",
                        content: userText
                    });
                    await AIMessenger.process(userText);
                } catch (processingErr) {
                    console.error("[Insertabot] Processing error:", processingErr);
                    MessageRenderer.create("assistant", "⚠️ Unable to process your message. Please retry.");
                } finally {
                    InsertabotCore.state.processingRequest = false;
                    InsertabotCore.ui.inputField.disabled = false;
                    document.getElementById("ib-send-btn").disabled = false;
                    InsertabotCore.ui.inputField.focus();
                }
            });
        }
    };

    // Widget Visibility Controller
    const WidgetController = {
        toggle() {
            InsertabotCore.state.isWidgetVisible = !InsertabotCore.state.isWidgetVisible;

            if (InsertabotCore.state.isWidgetVisible) {
                InsertabotCore.ui.launcher.style.display = "none";
                InsertabotCore.ui.chatFrame.style.display = "flex";
                InsertabotCore.ui.inputField.focus();
            } else {
                InsertabotCore.ui.launcher.style.display = "flex";
                InsertabotCore.ui.chatFrame.style.display = "none";
            }
        }
    };

    // Application Bootstrapper
    async function bootstrap() {
        try {
            // Initialize quota tracking
            const usage = QuotaManager.retrieveUsageData();
            InsertabotCore.state.userQuota = usage;
            console.log('[Insertabot] Usage: ' + usage.consumed + '/' + InsertabotCore.quotas.freeTierMax);

            // Fetch widget configuration
            await ConfigLoader.fetch();

            // Add system prompt to conversation
            InsertabotCore.state.conversationHistory.push({
                role: "system",
                content: InsertabotCore.state.widgetConfig.system_prompt
            });

            // Build UI components
            LauncherButton.build();
            ChatInterface.build();

            console.log("[Insertabot] Widget initialized successfully ✓");
        } catch (initError) {
            console.error("[Insertabot] Initialization failed:", initError);
        }
    }

    // Start widget when DOM is ready
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", bootstrap);
    } else {
        bootstrap();
    }
})();`;
}
