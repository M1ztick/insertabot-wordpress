export function getLandingHTML(origin: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Insertabot by Mistyk Media - AI Chatbot Platform for Every Brand</title>
    <meta name="description" content="Deploy white-label AI chatbots powered by Cloudflare Workers AI. No code required. Multi-tenant SaaS platform.">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; line-height: 1.6; color: #333; }
        .hero { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 100px 20px; text-align: center; }
        .hero h1 { font-size: 3rem; margin-bottom: 20px; }
        .hero p { font-size: 1.5rem; margin-bottom: 30px; opacity: 0.9; }
        .cta-button { display: inline-block; background: white; color: #667eea; padding: 15px 40px; border-radius: 50px; text-decoration: none; font-weight: bold; font-size: 1.1rem; transition: transform 0.2s; }
        .cta-button:hover { transform: scale(1.05); }
        .features { max-width: 1200px; margin: 80px auto; padding: 0 20px; display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 40px; }
        .feature { text-align: center; padding: 30px; }
        .feature h3 { color: #667eea; margin-bottom: 15px; font-size: 1.5rem; }
        .feature p { color: #666; }
        .demo { background: #f8f9fa; padding: 80px 20px; text-align: center; }
        .demo h2 { font-size: 2.5rem; margin-bottom: 20px; color: #333; }
        .demo p { font-size: 1.2rem; color: #666; margin-bottom: 40px; }
        footer { background: #2d3748; color: white; padding: 40px 20px; text-align: center; }
    </style>
</head>
<body>
    <div class="hero">
        <img src="/logo.png" alt="Insertabot Logo" style="max-width: 200px; margin-bottom: 20px;">
        <h1>Insertabot</h1>
        <p>AI-Powered Chatbot Widget for Your Website</p>
        <a href="/playground" class="cta-button">Try Live Demo →</a>
    </div>

    <div class="features">
        <div class="feature">
            <h3>⚡ Instant Setup</h3>
            <p>Add AI chat to your website with one script tag. No complex configuration required.</p>
        </div>
        <div class="feature">
            <h3>🎨 Fully Customizable</h3>
            <p>Colors, position, bot name, avatar, and system prompts - make it yours.</p>
        </div>
        <div class="feature">
            <h3>🧠 Smart AI</h3>
            <p>Powered by Cloudflare Workers AI with web search capabilities for current information.</p>
        </div>
        <div class="feature">
            <h3>🔒 Secure</h3>
            <p>API key authentication, rate limiting, and CORS protection built-in.</p>
        </div>
        <div class="feature">
            <h3>💳 Stripe Integration</h3>
            <p>Built-in subscription management with Stripe for easy monetization.</p>
        </div>
        <div class="feature">
            <h3>📊 Analytics</h3>
            <p>Track usage and performance with built-in analytics engine.</p>
        </div>
    </div>

    <div class="demo">
        <h2>See It In Action</h2>
        <p>Click the chat button in the bottom right corner to try our demo bot!</p>
        <p style="color: #999; font-size: 0.9rem;">Powered by Cloudflare Workers AI • Llama 3.1 8B</p>
    </div>

    <footer>
        <p>&copy; 2024 Mistyk Media. All rights reserved.</p>
        <p style="margin-top: 10px; opacity: 0.7;">Built with Cloudflare Workers • D1 • KV • Vectorize</p>
    </footer>

    <!-- Live Demo Widget -->
    <script src="${origin}/widget.js" data-api-key="ib_sk_demo_REPLACE"></script>
</body>
</html>`;
}
