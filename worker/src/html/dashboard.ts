/**
 * Customer Dashboard HTML
 */

export function getDashboardHTML(customer: any, widgetConfig: any, origin: string): string {
	const embedCode = `<script src="${origin}/widget.js" data-api-key="${customer.api_key}"></script>`;
	
	return `<!DOCTYPE html>
<html lang="en">
<head>
    <!-- Google tag (gtag.js) - Loaded only after user consent -->
    <script>
      window.dataLayer = window.dataLayer || [];
      
      function gtag(){dataLayer.push(arguments);}
      
      function loadGoogleTag() {
        var s = document.createElement('script');
        s.async = true;
        s.src = 'https://www.googletagmanager.com/gtag/js?id=G-PDSX0R0Q3Y';
        document.head.appendChild(s);
        
        gtag('js', new Date());
        gtag('config', 'G-PDSX0R0Q3Y');
      }
      
      // Load if consent already exists
      if (localStorage.getItem('cookieConsent') === 'true') {
        loadGoogleTag();
      }
      
      // Listen for consent being granted
      window.addEventListener('storage', function(e) {
        if (e.key === 'cookieConsent' && e.newValue === 'true') {
          loadGoogleTag();
        }
      });
    </script>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - Insertabot</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #0f172a 0%, #1a1f3a 100%);
            color: #e2e8f0;
            min-height: 100vh;
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header {
            background: rgba(30, 41, 59, 0.5);
            border: 1px solid #334155;
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .header h1 { font-size: 28px; }
        .plan-badge {
            background: linear-gradient(135deg, #818cf8, #c084fc);
            padding: 8px 16px;
            border-radius: 8px;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 12px;
        }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 24px; }
        .card {
            background: rgba(30, 41, 59, 0.8);
            border: 1px solid #334155;
            border-radius: 12px;
            padding: 24px;
        }
        .card h2 { font-size: 18px; margin-bottom: 16px; color: #f1f5f9; }
        .code-box {
            background: #0f172a;
            border: 1px solid #334155;
            border-radius: 8px;
            padding: 12px;
            font-family: 'Courier New', monospace;
            font-size: 13px;
            word-break: break-all;
            position: relative;
        }
        .copy-btn {
            position: absolute;
            top: 8px;
            right: 8px;
            background: #6366f1;
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
        }
        .copy-btn:hover { background: #4f46e5; }
        .form-group { margin-bottom: 16px; }
        .form-group label { display: block; margin-bottom: 8px; font-size: 14px; color: #cbd5e1; }
        .form-group input, .form-group textarea {
            width: 100%;
            padding: 10px;
            background: #0f172a;
            border: 1px solid #334155;
            border-radius: 8px;
            color: #e2e8f0;
            font-size: 14px;
        }
        .form-group input:focus, .form-group textarea:focus {
            outline: none;
            border-color: #6366f1;
        }
        .btn {
            background: linear-gradient(135deg, #818cf8, #c084fc);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            font-size: 14px;
        }
        .btn:hover { opacity: 0.9; }
        .stat { font-size: 32px; font-weight: 700; color: #818cf8; margin-bottom: 8px; }
        .stat-label { font-size: 14px; color: #94a3b8; }
        .success { background: #10b981; color: white; padding: 12px; border-radius: 8px; margin-bottom: 16px; display: none; }
    </style>
</head>
<body>
    <div id="cookie-banner" style="display:none;position:fixed;bottom:0;left:0;right:0;background:#1f2937;color:#fff;padding:20px;z-index:9999999;box-shadow:0 -2px 10px rgba(0,0,0,0.3);"><div style="max-width:1200px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap;"><p style="margin:0;font-size:14px;flex:1;min-width:250px;">We use cookies to improve your experience. By clicking "Accept", you consent to our use of cookies.</p><div style="display:flex;gap:10px;"><button onclick="acceptCookies()" style="background:#10b981;color:#fff;border:none;padding:10px 20px;border-radius:6px;cursor:pointer;font-weight:600;">Accept</button><button onclick="declineCookies()" style="background:#6b7280;color:#fff;border:none;padding:10px 20px;border-radius:6px;cursor:pointer;font-weight:600;">Decline</button></div></div></div>
    <script>if(!localStorage.getItem('cookieConsent'))document.getElementById('cookie-banner').style.display='block';function acceptCookies(){localStorage.setItem('cookieConsent','true');document.getElementById('cookie-banner').style.display='none';location.reload();}function declineCookies(){localStorage.setItem('cookieConsent','false');document.getElementById('cookie-banner').style.display='none';}</script>
    <div class="container">
        <div class="header">
            <div>
                <h1>Dashboard</h1>
                <p style="color: #94a3b8; margin-top: 4px;">${customer.company_name}</p>
            </div>
            <div class="plan-badge">${customer.plan_type} Plan</div>
        </div>

        <div id="success-msg" class="success">Settings saved successfully!</div>

        <div class="grid">
            <div class="card">
                <h2>🔑 API Key</h2>
                <div class="code-box">
                    ${customer.api_key}
                    <button class="copy-btn" onclick="copy('${customer.api_key}')">Copy</button>
                </div>
            </div>

            <div class="card">
                <h2>📊 Usage</h2>
                <div class="stat">${customer.rate_limit_per_day}</div>
                <div class="stat-label">Messages per day</div>
            </div>
        </div>

        <div class="card" style="margin-bottom: 24px;">
            <h2>📝 Embed Code</h2>
            <p style="color: #94a3b8; margin-bottom: 12px; font-size: 14px;">
                Copy and paste this code before the closing &lt;/body&gt; tag on your website:
            </p>
            <div class="code-box">
                ${embedCode.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
                <button class="copy-btn" onclick="copy(\`${embedCode}\`)">Copy</button>
            </div>
        </div>

        <div class="card">
            <h2>🎨 Widget Customization</h2>
            <form id="config-form">
                <div class="form-group">
                    <label>Bot Name</label>
                    <input type="text" name="bot_name" value="${widgetConfig.bot_name}" />
                </div>
                <div class="form-group">
                    <label>Bot Avatar URL (optional)</label>
                    <input type="url" name="bot_avatar_url" value="${widgetConfig.bot_avatar_url || ''}" placeholder="https://example.com/logo.png" />
                </div>
                <div class="form-group">
                    <label>Primary Color</label>
                    <input type="color" name="primary_color" value="${widgetConfig.primary_color}" />
                </div>
                <div class="form-group">
                    <label>Greeting Message</label>
                    <input type="text" name="greeting_message" value="${widgetConfig.greeting_message}" />
                </div>
                <div class="form-group">
                    <label>System Prompt</label>
                    <textarea name="system_prompt" rows="4">${widgetConfig.system_prompt}</textarea>
                </div>
                <button type="submit" class="btn">Save Changes</button>
            </form>
        </div>
    </div>

    <script>
        function copy(text) {
            navigator.clipboard.writeText(text);
            alert('Copied to clipboard!');
        }

        document.getElementById('config-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData);

            const response = await fetch('/api/customer/config', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': '${customer.api_key}'
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                document.getElementById('success-msg').style.display = 'block';
                setTimeout(() => {
                    document.getElementById('success-msg').style.display = 'none';
                }, 3000);
            }
        });
    </script>
</body>
</html>`;
}
