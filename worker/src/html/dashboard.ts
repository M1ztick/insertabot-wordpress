
/**
 * Customer Dashboard HTML
 * Improved for accessibility, maintainability, and UX
 */

// Inline escapeHtml function to avoid import issues
function escapeHtml(str: string | null | undefined): string {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function getDashboardHTML(
  customer: any,
  widgetConfig: any,
  origin: string
): string {
  const embedCode = `<script src="${origin}/widget.js" data-api-key="${customer.api_key}"></script>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Dashboard – Insertabot</title>

  <!-- Google Analytics (loaded after consent) -->
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}

    function loadGoogleTag() {
      if (window.__gaLoaded) return;
      window.__gaLoaded = true;

      var s = document.createElement('script');
      s.async = true;
      s.src = 'https://www.googletagmanager.com/gtag/js?id=G-PDSX0R0Q3Y';
      document.head.appendChild(s);

      gtag('js', new Date());
      gtag('config', 'G-PDSX0R0Q3Y');
    }

    if (localStorage.getItem('cookieConsent') === 'true') {
      loadGoogleTag();
    }

    window.addEventListener('storage', function(e) {
      if (e.key === 'cookieConsent' && e.newValue === 'true') {
        loadGoogleTag();
      }
    });
  </script>

  <style>
    :root {
      --bg: #000;
      --panel: rgba(10,10,10,0.85);
      --border: rgba(0,245,255,0.25);
      --cyan: #00f5ff;
      --magenta: #ff00ff;
      --text: #e2e8f0;
      --muted: #94a3b8;
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
      min-height: 100vh;
      line-height: 1.6;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px;
    }

    /* ---------- HEADER ---------- */

    header {
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 24px;
      margin-bottom: 28px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
    }

    header h1 {
      font-size: 1.8rem;
      background: linear-gradient(135deg, var(--cyan), var(--magenta));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    header p {
      color: var(--muted);
      font-size: 0.9rem;
      margin-top: 4px;
    }

    .plan-badge {
      background: linear-gradient(135deg, var(--cyan), var(--magenta));
      color: #fff;
      padding: 8px 16px;
      border-radius: 10px;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      white-space: nowrap;
    }

    /* ---------- GRID / CARDS ---------- */

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
      margin-bottom: 24px;
    }

    .card {
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 24px;
    }

    .card h2 {
      font-size: 1.1rem;
      margin-bottom: 16px;
      color: var(--cyan);
    }

    /* ---------- CODE BOX ---------- */

    .code-box {
      position: relative;
      background: #000;
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 14px;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 0.8rem;
      word-break: break-all;
    }

    .copy-btn {
      position: absolute;
      top: 8px;
      right: 8px;
      background: linear-gradient(135deg, var(--cyan), var(--magenta));
      color: #fff;
      border: none;
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 0.7rem;
      font-weight: 600;
      cursor: pointer;
    }

    /* ---------- STATS ---------- */

    .stat {
      font-size: 2.4rem;
      font-weight: 800;
      background: linear-gradient(135deg, var(--cyan), var(--magenta));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .stat-label {
      font-size: 0.85rem;
      color: var(--muted);
    }

    /* ---------- FORM ---------- */

    .form-group {
      margin-bottom: 16px;
    }

    label {
      display: block;
      margin-bottom: 6px;
      font-size: 0.85rem;
      color: var(--muted);
    }

    input,
    textarea {
      width: 100%;
      padding: 10px;
      background: #000;
      border: 1px solid var(--border);
      border-radius: 10px;
      color: var(--text);
      font-size: 0.9rem;
    }

    input:focus,
    textarea:focus {
      outline: none;
      border-color: var(--cyan);
    }

    .btn {
      margin-top: 10px;
      background: linear-gradient(135deg, var(--cyan), var(--magenta));
      color: #fff;
      border: none;
      padding: 12px 26px;
      border-radius: 10px;
      font-weight: 700;
      cursor: pointer;
    }

    /* ---------- TOAST ---------- */

    .toast {
      display: none;
      margin-bottom: 20px;
      background: linear-gradient(135deg, #00f5ff, #00ff88);
      color: #fff;
      padding: 12px 16px;
      border-radius: 12px;
      font-size: 0.9rem;
      font-weight: 600;
    }
  </style>
</head>

<body>

<div class="container">

  <header>
    <div>
      <h1>Dashboard</h1>
      <p>${escapeHtml(customer.company_name)}</p>
    </div>
    <div class="plan-badge">${escapeHtml(customer.plan_type)} Plan</div>
  </header>

  <div id="toast" class="toast">✅ Settings saved successfully</div>

  <section class="grid">
    <article class="card">
      <h2>🔑 API Key</h2>
      <div class="code-box">
        ${escapeHtml(customer.api_key)}
        <button class="copy-btn" onclick="copyText('${escapeHtml(customer.api_key)}')">Copy</button>
      </div>
    </article>

    <article class="card">
      <h2>📊 Usage</h2>
      <div class="stat">${escapeHtml(String(customer.rate_limit_per_day))}</div>
      <div class="stat-label">Messages per day</div>
    </article>
  </section>

  <section class="card" style="margin-bottom:24px;">
    <h2>📝 Embed Code</h2>
    <p style="color:var(--muted);font-size:0.85rem;margin-bottom:12px;">
      Paste this before the closing &lt;/body&gt; tag:
    </p>
    <div class="code-box">
      ${embedCode.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
      <button class="copy-btn" onclick="copyText(\`${embedCode}\`)">Copy</button>
    </div>
  </section>

  <section class="card">
    <h2>🎨 Widget Customization</h2>

    <form id="config-form">
      <div class="form-group">
        <label>Bot Name</label>
        <input name="bot_name" value="${escapeHtml(widgetConfig.bot_name)}" />
      </div>

      <div class="form-group">
        <label>Bot Avatar URL</label>
        <input type="url" name="bot_avatar_url" value="${escapeHtml(widgetConfig.bot_avatar_url || '')}" />
      </div>

      <div class="form-group">
        <label>Primary Color</label>
        <input type="color" name="primary_color" value="${escapeHtml(widgetConfig.primary_color)}" />
      </div>

      <div class="form-group">
        <label>Greeting Message</label>
        <input name="greeting_message" value="${escapeHtml(widgetConfig.greeting_message)}" />
      </div>

      <div class="form-group">
        <label>System Prompt</label>
        <textarea rows="4" name="system_prompt">${escapeHtml(widgetConfig.system_prompt)}</textarea>
      </div>

      <button class="btn" type="submit">Save Changes</button>
    </form>
  </section>
</div>

<script>
  function copyText(text) {
    navigator.clipboard.writeText(text).then(() => {
      const toast = document.getElementById('toast');
      toast.textContent = '📋 Copied to clipboard';
      toast.style.display = 'block';
      setTimeout(() => toast.style.display = 'none', 2000);
    });
  }

  document.getElementById('config-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));

    const res = await fetch('/api/customer/config', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': '${escapeHtml(customer.api_key)}'
      },
      body: JSON.stringify(data)
    });

    if (res.ok) {
      const toast = document.getElementById('toast');
      toast.textContent = '✅ Settings saved successfully';
      toast.style.display = 'block';
      setTimeout(() => toast.style.display = 'none', 3000);
    } else {
      alert('Failed to save settings');
    }
  });
</script>

</body>
</html>`;
}
