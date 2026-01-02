/**
 * Signup Page HTML
 */

export function getSignupHTML(): string {
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
    <title>Sign Up - Insertabot</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #0f172a 0%, #1a1f3a 100%);
            color: #e2e8f0;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .signup-container {
            background: rgba(30, 41, 59, 0.8);
            border: 1px solid #334155;
            border-radius: 16px;
            padding: 40px;
            max-width: 480px;
            width: 100%;
        }
        h1 {
            font-size: 32px;
            margin-bottom: 8px;
            background: linear-gradient(135deg, #818cf8, #c084fc);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .subtitle { color: #94a3b8; margin-bottom: 32px; font-size: 14px; }
        .form-group { margin-bottom: 20px; }
        .form-group label { display: block; margin-bottom: 8px; font-size: 14px; color: #cbd5e1; }
        .form-group input {
            width: 100%;
            padding: 12px;
            background: #0f172a;
            border: 1px solid #334155;
            border-radius: 8px;
            color: #e2e8f0;
            font-size: 14px;
        }
        .form-group input:focus {
            outline: none;
            border-color: #6366f1;
        }
        .btn {
            width: 100%;
            background: linear-gradient(135deg, #818cf8, #c084fc);
            color: white;
            border: none;
            padding: 14px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            font-size: 16px;
            margin-top: 8px;
        }
        .btn:hover { opacity: 0.9; }
        .btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .error {
            background: #ef4444;
            color: white;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 16px;
            display: none;
        }
        .features {
            margin-top: 32px;
            padding-top: 24px;
            border-top: 1px solid #334155;
        }
        .feature {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 12px;
            font-size: 14px;
            color: #cbd5e1;
        }
        .back-link {
            text-align: center;
            margin-top: 24px;
        }
        .back-link a {
            color: #818cf8;
            text-decoration: none;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div id="cookie-banner" style="display:none;position:fixed;bottom:0;left:0;right:0;background:#1f2937;color:#fff;padding:20px;z-index:9999999;box-shadow:0 -2px 10px rgba(0,0,0,0.3);"><div style="max-width:800px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap;"><p style="margin:0;font-size:14px;flex:1;min-width:250px;">We use cookies to improve your experience. By clicking "Accept", you consent to our use of cookies.</p><div style="display:flex;gap:10px;"><button onclick="acceptCookies()" style="background:#10b981;color:#fff;border:none;padding:10px 20px;border-radius:6px;cursor:pointer;font-weight:600;">Accept</button><button onclick="declineCookies()" style="background:#6b7280;color:#fff;border:none;padding:10px 20px;border-radius:6px;cursor:pointer;font-weight:600;">Decline</button></div></div></div>
    <script>if(!localStorage.getItem('cookieConsent'))document.getElementById('cookie-banner').style.display='block';function acceptCookies(){localStorage.setItem('cookieConsent','true');document.getElementById('cookie-banner').style.display='none';location.reload();}function declineCookies(){localStorage.setItem('cookieConsent','false');document.getElementById('cookie-banner').style.display='none';}</script>
    <div class="signup-container">
        <h1>Start Free Trial</h1>
        <p class="subtitle">Get 20 free messages per day. No credit card required.</p>

        <div id="error-msg" class="error"></div>

        <form id="signup-form">
            <div class="form-group">
                <label>Email Address</label>
                <input type="email" name="email" required placeholder="you@company.com" />
            </div>
            <div class="form-group">
                <label>Company Name</label>
                <input type="text" name="company_name" required placeholder="Your Company" />
            </div>
            <button type="submit" class="btn" id="submit-btn">Create Free Account</button>
        </form>

        <div class="features">
            <div class="feature">✓ 20 messages per day</div>
            <div class="feature">✓ Full AI capabilities</div>
            <div class="feature">✓ Customizable widget</div>
            <div class="feature">✓ Upgrade anytime</div>
        </div>

        <div class="back-link">
            <a href="/">← Back to home</a>
        </div>
    </div>

    <script>
        document.getElementById('signup-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const btn = document.getElementById('submit-btn');
            const errorMsg = document.getElementById('error-msg');
            
            btn.disabled = true;
            btn.textContent = 'Creating account...';
            errorMsg.style.display = 'none';

            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData);

            try {
                const response = await fetch('/api/customer/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (response.ok) {
                    window.location.href = '/dashboard?key=' + result.api_key;
                } else {
                    errorMsg.textContent = result.error || 'Failed to create account';
                    errorMsg.style.display = 'block';
                    btn.disabled = false;
                    btn.textContent = 'Create Free Account';
                }
            } catch (error) {
                errorMsg.textContent = 'Network error. Please try again.';
                errorMsg.style.display = 'block';
                btn.disabled = false;
                btn.textContent = 'Create Free Account';
            }
        });
    </script>
</body>
</html>`;
}
