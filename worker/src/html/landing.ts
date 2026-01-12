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
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            background: #000000;
            color: #e2e8f0;
        }
        nav {
            background: rgba(10, 10, 10, 0.95);
            border-bottom: 1px solid rgba(0, 245, 255, 0.2);
            padding: 20px 40px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            position: sticky;
            top: 0;
            z-index: 1000;
            backdrop-filter: blur(10px);
        }
        nav .logo {
            font-size: 24px;
            font-weight: bold;
            background: linear-gradient(135deg, #00f5ff, #ff00ff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        nav .nav-links {
            display: flex;
            gap: 30px;
            align-items: center;
        }
        nav a {
            color: #94a3b8;
            text-decoration: none;
            transition: all 0.2s;
            font-size: 15px;
        }
        nav a:hover {
            color: #00f5ff;
            text-shadow: 0 0 10px rgba(0, 245, 255, 0.5);
        }
        nav .nav-cta {
            background: linear-gradient(135deg, #00f5ff, #ff00ff);
            color: white;
            padding: 10px 24px;
            border-radius: 8px;
            font-weight: 600;
            box-shadow: 0 0 15px rgba(0, 245, 255, 0.3);
        }
        nav .nav-cta:hover {
            box-shadow: 0 0 25px rgba(0, 245, 255, 0.5);
            transform: translateY(-1px);
        }
        .hero {
            background: linear-gradient(135deg, #050505 0%, #0a0a0a 100%);
            color: white;
            padding: 120px 20px;
            text-align: center;
            position: relative;
            border-bottom: 2px solid transparent;
            border-image: linear-gradient(90deg, #00f5ff, #ff00ff, #00f5ff) 1;
        }
        .hero::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: radial-gradient(circle at 50% 50%, rgba(0, 245, 255, 0.05), transparent 70%);
            pointer-events: none;
        }
        .hero h1 {
            font-size: 3.5rem;
            margin-bottom: 20px;
            background: linear-gradient(135deg, #00f5ff, #ff00ff, #00f5ff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            position: relative;
            z-index: 1;
        }
        .hero p {
            font-size: 1.5rem;
            margin-bottom: 40px;
            color: #94a3b8;
            position: relative;
            z-index: 1;
        }
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #00f5ff, #ff00ff);
            color: white;
            padding: 16px 48px;
            border-radius: 12px;
            text-decoration: none;
            font-weight: bold;
            font-size: 1.1rem;
            transition: all 0.3s;
            border: 2px solid transparent;
            box-shadow: 0 0 20px rgba(0, 245, 255, 0.3);
            position: relative;
            z-index: 1;
        }
        .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 0 30px rgba(0, 245, 255, 0.5), 0 0 40px rgba(255, 0, 255, 0.3);
        }
        .features {
            max-width: 1200px;
            margin: 80px auto;
            padding: 0 20px;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 30px;
        }
        .feature {
            text-align: center;
            padding: 40px 30px;
            background: rgba(10, 10, 10, 0.6);
            border: 1px solid rgba(0, 245, 255, 0.2);
            border-radius: 16px;
            transition: all 0.3s;
            position: relative;
            overflow: hidden;
        }
        .feature::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 2px;
            background: linear-gradient(90deg, transparent, #00f5ff, transparent);
            transition: left 0.5s;
        }
        .feature:hover::before {
            left: 100%;
        }
        .feature:hover {
            border-color: rgba(0, 245, 255, 0.5);
            box-shadow: 0 0 30px rgba(0, 245, 255, 0.1);
            transform: translateY(-5px);
        }
        .feature h3 {
            color: #00f5ff;
            margin-bottom: 15px;
            font-size: 1.5rem;
            text-shadow: 0 0 10px rgba(0, 245, 255, 0.3);
        }
        .feature p {
            color: #94a3b8;
            line-height: 1.8;
        }
        .demo {
            background: linear-gradient(135deg, #050505 0%, #0a0a0a 100%);
            padding: 100px 20px;
            text-align: center;
            border-top: 2px solid transparent;
            border-bottom: 2px solid transparent;
            border-image: linear-gradient(90deg, #ff00ff, #00f5ff, #ff00ff) 1;
            position: relative;
        }
        .demo::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: radial-gradient(circle at 50% 50%, rgba(255, 0, 255, 0.05), transparent 70%);
            pointer-events: none;
        }
        .demo h2 {
            font-size: 2.8rem;
            margin-bottom: 20px;
            background: linear-gradient(135deg, #ff00ff, #00f5ff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            position: relative;
            z-index: 1;
        }
        .demo p {
            font-size: 1.2rem;
            color: #94a3b8;
            margin-bottom: 15px;
            position: relative;
            z-index: 1;
        }
        footer {
            background: #000000;
            color: #64748b;
            padding: 50px 20px;
            text-align: center;
            border-top: 1px solid rgba(0, 245, 255, 0.2);
        }
    </style>
</head>
<body>
    <nav>
        <div class="logo">Insertabot</div>
        <div class="nav-links">
            <a href="/playground">Playground</a>
            <a href="/login">Login</a>
            <a href="/signup" class="nav-cta">Get Started Free</a>
        </div>
    </nav>
    <div class="hero">
        <img src="/logo.png" alt="Insertabot Logo" style="max-width: 200px; margin-bottom: 20px;">
        <h1>Insertabot</h1>
        <h2 style="font-size: 2em; margin: 20px 0 10px 0; font-weight: 700;">Insert an AI chatbot on your website in a flash!</h2>
        <h3 style="font-size: 1.3em; margin: 0 0 30px 0; font-weight: 400; background: linear-gradient(135deg, #00f5ff, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">Traveling at the speed of innovation</h3>
        <div style="display: flex; gap: 20px; justify-content: center; align-items: center;">
            <a href="/signup" class="cta-button">Get Started Free</a>
            <a href="/playground" class="cta-button" style="background: transparent; border: 2px solid #00f5ff; box-shadow: none;">Try Live Demo →</a>
        </div>
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
            <p>Integrated with <span style="color: #00f5ff; font-weight: 700; text-shadow: 0 0 10px rgba(0, 245, 255, 0.5);">Tavily</span> for current web search capabilities.</p>
        </div>
        <div class="feature">
            <h3>🔒 Secure</h3>
            <p>API key authentication, rate limiting, and CORS protection built-in.</p>
        </div>
        <div class="feature">
            <h3>💳 Stripe Integration</h3>
            <p>Accept payments seamlessly with Stripe - credit cards, digital wallets, and more.</p>
        </div>
        <div class="feature">
            <h3>📚 RAG Support</h3>
            <p>Vectorize integration enables context-aware responses using your custom knowledge base.</p>
        </div>
    </div>

    <div class="demo">
        <h2>See It In Action</h2>
        <p>Click the chat button in the bottom right corner to try our demo bot!</p>
    </div>

    <footer>
        <p>&copy; 2026 Insertabot. All rights reserved.</p>
        <p style="margin-top: 10px; opacity: 0.7;">Powered by Cloudflare Workers AI • D1 • KV • Vectorize</p>
    </footer>

    <!-- Live Demo Widget -->
    <script src="${origin}/widget.js" data-api-key="ib_sk_demo_62132eda22a524d715034a7013a7b20e2a36f93b71b588d3354d74e4024e9ed7"></script>
</body>
</html>`;
}
