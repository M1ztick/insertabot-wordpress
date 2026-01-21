
export function getLandingHTML(origin: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Insertabot by Mistyk Media – AI Chatbots for Every Website</title>

  <meta name="description" content="Launch a white-label AI chatbot on your website in minutes. No code. Powered by Cloudflare Workers AI." />
  <meta name="theme-color" content="#000000" />

  <style>
    :root {
      --bg: #000;
      --panel: rgba(10,10,10,0.7);
      --text: #e2e8f0;
      --muted: #94a3b8;
      --cyan: #00f5ff;
      --magenta: #ff00ff;
      --radius: 16px;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
    }

    a {
      color: inherit;
      text-decoration: none;
    }

    /* ---------- NAV ---------- */

    header {
      position: sticky;
      top: 0;
      z-index: 1000;
      backdrop-filter: blur(10px);
      background: rgba(0,0,0,0.9);
      border-bottom: 1px solid rgba(0,245,255,0.2);
    }

    .nav {
      max-width: 1200px;
      margin: 0 auto;
      padding: 18px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 16px;
    }

    .logo {
      font-size: 1.5rem;
      font-weight: 800;
      background: linear-gradient(135deg, var(--cyan), var(--magenta));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .nav-links {
      display: flex;
      gap: 24px;
      align-items: center;
      flex-wrap: wrap;
    }

    .nav-links a {
      font-size: 0.95rem;
      color: var(--muted);
      transition: color 0.2s ease;
    }

    .nav-links a:hover {
      color: var(--cyan);
    }

    .nav-cta {
      padding: 10px 22px;
      border-radius: 10px;
      font-weight: 600;
      background: linear-gradient(135deg, var(--cyan), var(--magenta));
      color: #fff;
      box-shadow: 0 0 15px rgba(0,245,255,0.3);
    }

    /* ---------- HERO ---------- */

    .hero {
      padding: 110px 20px 90px;
      text-align: center;
      position: relative;
      background: radial-gradient(circle at center, rgba(0,245,255,0.06), transparent 65%);
      border-bottom: 2px solid transparent;
      border-image: linear-gradient(90deg, var(--cyan), var(--magenta)) 1;
    }

    .hero img {
      max-width: 180px;
      margin-bottom: 24px;
    }

    .hero h1 {
      font-size: clamp(2.5rem, 6vw, 3.6rem);
      font-weight: 800;
      background: linear-gradient(135deg, var(--cyan), var(--magenta));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 16px;
    }

    .hero h2 {
      font-size: 1.8rem;
      margin-bottom: 10px;
      font-weight: 700;
    }

    .hero h3 {
      font-size: 1.2rem;
      font-weight: 400;
      margin-bottom: 36px;
      background: linear-gradient(135deg, var(--cyan), #a855f7);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .hero-actions {
      display: flex;
      justify-content: center;
      gap: 18px;
      flex-wrap: wrap;
    }

    .btn {
      padding: 15px 42px;
      border-radius: 12px;
      font-weight: 700;
      font-size: 1rem;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .btn-primary {
      background: linear-gradient(135deg, var(--cyan), var(--magenta));
      color: #fff;
      box-shadow: 0 0 20px rgba(0,245,255,0.35);
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 0 30px rgba(0,245,255,0.6);
    }

    .btn-outline {
      border: 2px solid var(--cyan);
      color: var(--cyan);
    }

    /* ---------- MISSION ---------- */

    .mission {
      max-width: 900px;
      margin: 80px auto;
      padding: 0 20px;
      text-align: center;
    }

    .mission h2 {
      font-size: 2.2rem;
      font-weight: 700;
      margin-bottom: 28px;
      background: linear-gradient(135deg, var(--cyan), var(--magenta));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .mission p {
      font-size: 1.1rem;
      line-height: 1.8;
      color: var(--text);
      margin-bottom: 20px;
      text-align: left;
    }

    .mission p:last-of-type {
      margin-bottom: 0;
    }

    .mission-quote {
      position: relative;
      padding: 0 30px;
    }

    .mission-quote::before {
      content: '"';
      position: absolute;
      left: 0;
      top: -10px;
      font-size: 4rem;
      color: var(--cyan);
      opacity: 0.5;
      line-height: 1;
    }

    .mission-quote::after {
      content: '"';
      position: absolute;
      right: 0;
      bottom: -30px;
      font-size: 4rem;
      color: var(--magenta);
      opacity: 0.5;
      line-height: 1;
    }

    .mission-attribution {
      margin-top: 24px;
      font-style: italic;
      font-size: 1rem;
      color: var(--cyan);
      text-align: right;
    }

    /* ---------- FEATURES ---------- */

    main {
      max-width: 1200px;
      margin: 80px auto;
      padding: 0 20px;
    }

    .features-heading {
      font-size: 2.4rem;
      font-weight: 700;
      text-align: center;
      margin-bottom: 50px;
      background: linear-gradient(135deg, var(--cyan), var(--magenta));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .features {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 28px;
    }

    @media (min-width: 768px) {
      .features {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    .feature {
      background: var(--panel);
      border-radius: var(--radius);
      padding: 36px 30px;
      border: 1px solid rgba(0,245,255,0.2);
      text-align: center;
      transition: transform 0.25s ease, box-shadow 0.25s ease;
    }

    .feature:hover {
      transform: translateY(-6px);
      box-shadow: 0 0 28px rgba(0,245,255,0.15);
    }

    .feature h3 {
      font-size: 1.4rem;
      color: var(--cyan);
      margin-bottom: 12px;
    }

    .feature p {
      color: var(--muted);
      font-size: 0.95rem;
    }

    /* ---------- DEMO ---------- */

    .demo {
      margin: 90px 0;
      padding: 90px 20px;
      text-align: center;
      border-top: 2px solid transparent;
      border-bottom: 2px solid transparent;
      border-image: linear-gradient(90deg, var(--magenta), var(--cyan)) 1;
      background: radial-gradient(circle at center, rgba(255,0,255,0.05), transparent 70%);
    }

    .demo h2 {
      font-size: 2.6rem;
      margin-bottom: 16px;
      background: linear-gradient(135deg, var(--magenta), var(--cyan));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .demo p {
      font-size: 1.1rem;
      color: var(--muted);
    }

    /* ---------- FOOTER ---------- */

    footer {
      padding: 50px 20px;
      text-align: center;
      border-top: 1px solid rgba(0,245,255,0.2);
      color: #64748b;
      font-size: 0.9rem;
    }

    footer p + p {
      margin-top: 10px;
      opacity: 0.7;
    }
  </style>
</head>

<body>

<header>
  <nav class="nav" aria-label="Main navigation">
    <div class="logo">Insertabot</div>
    <div class="nav-links">
      <a href="/playground">Playground</a>
      <a href="/login">Login</a>
      <a href="/signup" class="nav-cta">Get Started Free</a>
    </div>
  </nav>
</header>

<section class="hero">
  <img src="/logo.png" alt="Insertabot logo" />
  <h1>Insertabot</h1>
  <h2>Insert an AI chatbot on your website in a flash</h2>
  <h3>Traveling at the speed of innovation</h3>

  <div class="hero-actions">
    <a href="/signup" class="btn btn-primary">Get Started Free</a>
    <a href="/playground" class="btn btn-outline">Try Live Demo →</a>
  </div>
</section>

<section class="mission">
  <h2>Who We Are</h2>
  <div class="mission-quote">
    <p>We are pioneers standing elbow-to-elbow with you on the front lines of the digital market. At Insertabot, we know the grit it takes to build something real—to deliver quality without sacrificing our values for a paycheck.</p>
    <p>We built Insertabot as a small but ongoing effort to close the resource gap between corporate giants and 'us little guys.' We refuse to compromise on privacy or ethics just to make a buck. That's why we created a tool that actually works, protects your users, and doesn't cost a fortune. Affordable, ethical, and built for the independent.</p>
  </div>
  <p class="mission-attribution">— Mistyk Media</p>
</section>

<main>
  <h2 class="features-heading">Product Features</h2>
  <section class="features">
    <article class="feature">
      <h3>⚡ Instant Setup</h3>
      <p>Drop in one script tag and launch your AI chatbot instantly.</p>
    </article>

    <article class="feature">
      <h3>🎨 Fully Customizable</h3>
      <p>Brand colors, position, prompts, avatars — fully white‑label.</p>
    </article>

    <article class="feature">
      <h3>🧠 Smart AI</h3>
      <p>Powered by Tavily for real‑time web search and fresh answers.</p>
    </article>

    <article class="feature">
      <h3>🔒 Secure</h3>
      <p>API keys, rate limiting, and CORS protection included.</p>
    </article>

    <article class="feature">
      <h3>🛡️ Privacy Focused</h3>
      <p>No tracking, no third-party analytics. Your data stays yours.</p>
    </article>

    <article class="feature">
      <h3>📚 RAG Support</h3>
      <p>Use Vectorize for knowledge‑aware AI responses.</p>
    </article>
  </section>
</main>

<section class="demo">
  <h2>See It In Action</h2>
  <p>Click the chat bubble in the bottom‑right corner to try the live demo.</p>
</section>

<footer>
  <p>© 2026 Insertabot. All rights reserved.</p>
  <p>Powered by Cloudflare Workers AI • D1 • KV • Vectorize</p>
</footer>

<script src="${origin}/widget.js"
        data-api-key="ib_sk_demo_62132eda22a524d715034a7013a7b20e2a36f93b71b588d3354d74e4024e9ed7">
</script>

</body>
</html>`;
}
