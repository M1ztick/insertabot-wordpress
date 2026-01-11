export function getPlaygroundHTML(origin: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Insertabot Playground - Chat with AI</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { height: 100%; width: 100%; overflow: hidden; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #0f172a 0%, #1a1f3a 100%);
            display: flex;
            flex-direction: column;
        }

        .playground-container {
            display: flex;
            flex-direction: column;
            height: 100vh;
            max-width: 900px;
            margin: 0 auto;
            width: 100%;
            background: #1e293b;
            box-shadow: 0 0 40px rgba(0,0,0,0.4);
        }

        .playground-header {
            background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
            color: white;
            padding: 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
        }

        .header-info {
            display: flex;
            align-items: center;
            gap: 16px;
        }

        .header-title h1 {
            font-size: 24px;
            font-weight: 700;
            margin: 0;
        }

        .header-title p {
            font-size: 13px;
            opacity: 0.9;
            margin: 4px 0 0 0;
        }

        .quota-badge {
            background: rgba(255,255,255,0.2);
            padding: 8px 16px;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .quota-bar {
            width: 120px;
            height: 6px;
            background: rgba(255,255,255,0.3);
            border-radius: 3px;
            overflow: hidden;
        }

        .quota-fill {
            height: 100%;
            background: rgba(255,255,255,0.9);
            border-radius: 3px;
            transition: width 0.3s ease;
        }

        .messages-area {
            flex: 1;
            overflow-y: auto;
            padding: 24px;
            display: flex;
            flex-direction: column;
            gap: 16px;
            background: linear-gradient(to bottom, #1e293b, #0f172a);
        }

        .message {
            display: flex;
            gap: 12px;
            animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .message.user {
            justify-content: flex-end;
        }

        .message-bubble {
            max-width: 70%;
            padding: 12px 16px;
            border-radius: 12px;
            line-height: 1.5;
            word-wrap: break-word;
        }

        .message.assistant .message-bubble {
            background: #334155;
            color: #e2e8f0;
            border-radius: 12px 12px 12px 4px;
        }

        .message.user .message-bubble {
            background: linear-gradient(135deg, #6366f1, #a855f7);
            color: white;
            border-radius: 12px 12px 4px 12px;
        }

        .typing-indicator {
            display: flex;
            gap: 4px;
            padding: 12px 16px;
        }

        .typing-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #94a3b8;
            animation: bounce 1.4s infinite;
        }

        .typing-dot:nth-child(2) {
            animation-delay: 0.2s;
        }

        .typing-dot:nth-child(3) {
            animation-delay: 0.4s;
        }

        @keyframes bounce {
            0%, 60%, 100% { transform: translateY(0); }
            30% { transform: translateY(-10px); }
        }

        .input-area {
            padding: 20px 24px;
            background: #0f172a;
            border-top: 2px solid #334155;
            display: flex;
            gap: 12px;
            align-items: flex-end;
        }

        .input-form {
            display: flex;
            gap: 12px;
            width: 100%;
            align-items: flex-end;
        }

        .input-field {
            flex: 1;
            padding: 14px 16px;
            border: 2px solid #334155;
            border-radius: 12px;
            font-size: 15px;
            font-family: inherit;
            outline: none;
            transition: border-color 0.2s;
            background: #1e293b;
            color: #e2e8f0;
        }

        .input-field:focus {
            border-color: #6366f1;
            background: #0f172a;
            color: #e2e8f0;
        }

        .send-btn {
            background: linear-gradient(135deg, #6366f1, #a855f7);
            color: white;
            border: none;
            padding: 14px 24px;
            border-radius: 12px;
            font-weight: 600;
            font-size: 15px;
            cursor: pointer;
            transition: all 0.2s;
            min-width: 80px;
        }

        .send-btn:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 4px 14px rgba(99, 102, 241, 0.3);
        }

        .send-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .empty-state {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: #94a3b8;
            text-align: center;
            padding: 40px;
        }

        .empty-state-icon {
            font-size: 48px;
            margin-bottom: 16px;
        }

        .empty-state h3 {
            font-size: 20px;
            font-weight: 600;
            color: #cbd5e1;
            margin: 0 0 8px 0;
        }

        .empty-state p {
            color: #64748b;
            font-size: 14px;
            margin: 0;
        }

        @media (max-width: 768px) {
            .playground-container {
                max-width: 100%;
                border-radius: 0;
            }

            .message-bubble {
                max-width: 85%;
            }
        }
    </style>
</head>
<body>
    <div class="playground-container">
        <div class="playground-header">
            <div class="header-info">
                <div class="header-title">
                    <h1>Insertabot Playground</h1>
                    <p>Chat with AI, test unlimited ideas</p>
                </div>
            </div>
            <div class="quota-badge">
                <span id="quota-text">50/50</span>
                <div class="quota-bar">
                    <div class="quota-fill" id="quota-fill" style="width: 100%"></div>
                </div>
            </div>
        </div>

        <div class="messages-area" id="messages"></div>

        <div class="input-area">
            <form class="input-form" id="chat-form">
                <input
                    type="text"
                    id="user-input"
                    class="input-field"
                    placeholder="Ask me anything..."
                    autocomplete="off"
                />
                <button type="submit" class="send-btn" id="send-btn">Send</button>
            </form>
        </div>
    </div>

    <script>
        const API_ENDPOINT = '${origin}/v1/chat/completions';
        // Demo API key - automatically configured for the playground
        const API_KEY = 'ib_sk_demo_62132eda22a524d715034a7013a7b20e2a36f93b71b588d3354d74e4024e9ed7';
        const QUOTA_MAX = 50;
        const STORAGE_KEY = 'playground_quota';

        let conversationHistory = [];
        let quotaUsed = 0;
        let isProcessing = false;

        function initPlayground() {
            loadQuota();
            updateQuotaDisplay();

            const messagesDiv = document.getElementById('messages');
            if (messagesDiv.children.length === 0) {
                showEmptyState();
            }

            document.getElementById('chat-form').addEventListener('submit', handleSendMessage);
        }

        function showEmptyState() {
            const messagesDiv = document.getElementById('messages');
            messagesDiv.innerHTML = '<div class="empty-state"><div class="empty-state-icon">💬</div><h3>Welcome to Insertabot</h3><p>Start a conversation by typing a message below</p></div>';
        }

        function loadQuota() {
            const today = new Date().toDateString();
            const stored = localStorage.getItem(STORAGE_KEY);

            if (stored) {
                const data = JSON.parse(stored);
                if (data.date === today) {
                    quotaUsed = data.used;
                    return;
                }
            }

            quotaUsed = 0;
            saveQuota();
        }

        function saveQuota() {
            const today = new Date().toDateString();
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                date: today,
                used: quotaUsed
            }));
        }

        function updateQuotaDisplay() {
            const remaining = QUOTA_MAX - quotaUsed;
            document.getElementById('quota-text').textContent = remaining + '/50';
            const percentUsed = (quotaUsed / QUOTA_MAX) * 100;
            document.getElementById('quota-fill').style.width = (100 - percentUsed) + '%';
        }

        async function handleSendMessage(e) {
            e.preventDefault();

            if (isProcessing) return;

            const input = document.getElementById('user-input');
            const message = input.value.trim();

            if (!message) return;

            if (quotaUsed >= QUOTA_MAX) {
                alert('Daily limit reached! Upgrade to Pro for unlimited messages.');
                return;
            }

            input.value = '';
            input.disabled = true;
            document.getElementById('send-btn').disabled = true;
            isProcessing = true;

            const messagesDiv = document.getElementById('messages');
            if (messagesDiv.querySelector('.empty-state')) {
                messagesDiv.innerHTML = '';
            }

            addMessage('user', message);
            conversationHistory.push({ role: 'user', content: message });

            try {
                const systemMessage = {
                    role: 'system',
                    content: 'You are a helpful, friendly AI assistant. Answer questions directly and concisely.'
                };

                const messagesToSend = [systemMessage, ...conversationHistory];

                const response = await fetch(API_ENDPOINT, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-API-Key': API_KEY
                    },
                    body: JSON.stringify({
                        messages: messagesToSend,
                        stream: true,
                        temperature: 0.7,
                        max_tokens: 500
                    })
                });

                if (!response.ok) {
                    throw new Error('API request failed');
                }

                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let accumulatedText = '';
                let messageDiv = null;

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });
                    const lines = chunk.split('\\n');

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = line.slice(6);
                            if (data === '[DONE]') continue;

                            try {
                                const parsed = JSON.parse(data);
                                const token = parsed.choices?.[0]?.delta?.content;

                                if (token) {
                                    accumulatedText += token;

                                    if (!messageDiv) {
                                        messageDiv = addMessage('assistant', token);
                                    } else {
                                        messageDiv.querySelector('.message-bubble').textContent = accumulatedText;
                                    }
                                }
                            } catch (e) {}
                        }
                    }
                }

                conversationHistory.push({ role: 'assistant', content: accumulatedText });
                quotaUsed++;
                saveQuota();
                updateQuotaDisplay();

            } catch (error) {
                console.error('Error:', error);
                addMessage('assistant', '⚠️ Sorry, something went wrong. Please try again.');
            } finally {
                input.disabled = false;
                document.getElementById('send-btn').disabled = false;
                isProcessing = false;
                input.focus();
            }
        }

        function addMessage(role, content) {
            const messagesDiv = document.getElementById('messages');
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message ' + role;

            const bubble = document.createElement('div');
            bubble.className = 'message-bubble';
            bubble.textContent = content;

            messageDiv.appendChild(bubble);
            messagesDiv.appendChild(messageDiv);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;

            return messageDiv;
        }

        initPlayground();
    </script>
</body>
</html>`;
}
