/**
 * Login Page HTML
 */

export function getLoginHTML(): string {
	return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - Insertabot</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #000000;
            color: #e2e8f0;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            position: relative;
        }
        body::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: radial-gradient(circle at 50% 50%, rgba(0, 245, 255, 0.03), transparent 50%);
            pointer-events: none;
        }
        .login-container {
            background: rgba(10, 10, 10, 0.9);
            border: 1px solid rgba(0, 245, 255, 0.3);
            border-radius: 20px;
            padding: 40px;
            max-width: 480px;
            width: 100%;
            box-shadow: 0 0 40px rgba(0, 245, 255, 0.15);
            position: relative;
            z-index: 1;
        }
        .login-container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 2px;
            background: linear-gradient(90deg, transparent, #00f5ff, #ff00ff, #00f5ff, transparent);
            border-radius: 20px 20px 0 0;
        }
        h1 {
            font-size: 36px;
            margin-bottom: 8px;
            background: linear-gradient(135deg, #00f5ff, #ff00ff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        .subtitle { color: #94a3b8; margin-bottom: 32px; font-size: 14px; }
        .form-group { margin-bottom: 20px; }
        .form-group label { display: block; margin-bottom: 8px; font-size: 14px; color: #94a3b8; }
        .form-group input {
            width: 100%;
            padding: 12px;
            background: #000000;
            border: 1px solid rgba(0, 245, 255, 0.2);
            border-radius: 8px;
            color: #e2e8f0;
            font-size: 14px;
            transition: all 0.2s;
        }
        .form-group input:focus {
            outline: none;
            border-color: #00f5ff;
            box-shadow: 0 0 15px rgba(0, 245, 255, 0.2);
        }
        .btn {
            width: 100%;
            background: linear-gradient(135deg, #00f5ff, #ff00ff);
            color: white;
            border: none;
            padding: 14px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            font-size: 16px;
            margin-top: 8px;
            box-shadow: 0 0 20px rgba(0, 245, 255, 0.3);
            transition: all 0.2s;
        }
        .btn:hover {
            box-shadow: 0 0 30px rgba(0, 245, 255, 0.5);
            transform: translateY(-2px);
        }
        .btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
        }
        .error {
            background: linear-gradient(135deg, #ff0055, #ff00ff);
            color: white;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 16px;
            display: none;
            box-shadow: 0 0 15px rgba(255, 0, 85, 0.3);
        }
        .success {
            background: linear-gradient(135deg, #00ff88, #00f5ff);
            color: #000;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 16px;
            display: none;
            box-shadow: 0 0 15px rgba(0, 255, 136, 0.3);
            font-weight: 600;
        }
        .help-text {
            margin-top: 32px;
            padding-top: 24px;
            border-top: 1px solid rgba(0, 245, 255, 0.2);
            color: #94a3b8;
            font-size: 14px;
            line-height: 1.6;
        }
        .back-link {
            text-align: center;
            margin-top: 24px;
        }
        .back-link a {
            color: #00f5ff;
            text-decoration: none;
            font-size: 14px;
            transition: all 0.2s;
        }
        .back-link a:hover {
            text-shadow: 0 0 10px rgba(0, 245, 255, 0.5);
        }
    </style>
</head>
<body>
    <div class="login-container">
        <h1>Access Dashboard</h1>
        <p class="subtitle">Enter your email to access your chatbot dashboard</p>

        <div id="error-msg" class="error"></div>
        <div id="success-msg" class="success"></div>

        <form id="login-form">
            <div class="form-group">
                <label>Email Address</label>
                <input type="email" name="email" required placeholder="you@company.com" autofocus />
            </div>
            <button type="submit" class="btn" id="submit-btn">Access Dashboard</button>
        </form>

        <div class="help-text">
            <strong>Don't have an account?</strong><br>
            <a href="/signup" style="color: #00f5ff;">Sign up for free</a> to get started with Insertabot.
        </div>

        <div class="back-link">
            <a href="/">← Back to home</a>
        </div>
    </div>

    <script>
        document.getElementById('login-form').addEventListener('submit', async (e) => {
            e.preventDefault();

            const btn = document.getElementById('submit-btn');
            const errorMsg = document.getElementById('error-msg');
            const successMsg = document.getElementById('success-msg');

            btn.disabled = true;
            btn.textContent = 'Looking up account...';
            errorMsg.style.display = 'none';
            successMsg.style.display = 'none';

            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData);

            try {
                const response = await fetch('/api/customer/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (response.ok && result.api_key) {
                    successMsg.textContent = 'Account found! Redirecting to dashboard...';
                    successMsg.style.display = 'block';

                    // Redirect to dashboard with API key
                    setTimeout(() => {
                        window.location.href = '/dashboard?key=' + result.api_key;
                    }, 1000);
                } else {
                    errorMsg.textContent = result.message || 'Account not found. Please check your email or sign up.';
                    errorMsg.style.display = 'block';
                    btn.disabled = false;
                    btn.textContent = 'Access Dashboard';
                }
            } catch (error) {
                errorMsg.textContent = 'Network error. Please try again.';
                errorMsg.style.display = 'block';
                btn.disabled = false;
                btn.textContent = 'Access Dashboard';
            }
        });
    </script>
</body>
</html>`;
}
