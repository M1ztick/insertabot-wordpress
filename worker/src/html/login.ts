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
                <input type="email" name="email" id="email" required placeholder="you@company.com" autofocus />
            </div>
            <div class="form-group">
                <label>Password</label>
                <input type="password" name="password" id="password" required placeholder="Enter your password" />
            </div>
            <div class="form-group" id="2fa-group" style="display: none;">
                <label>2FA Code (6 digits)</label>
                <input type="text" name="totp_code" id="totp_code" placeholder="000000" maxlength="6" pattern="[0-9]{6}" />
                <div style="margin-top: 8px; font-size: 12px; color: #64748b;">
                    Or use a <a href="#" id="use-backup-code" style="color: #00f5ff;">backup code</a>
                </div>
            </div>
            <div class="form-group" id="backup-group" style="display: none;">
                <label>Backup Code</label>
                <input type="text" name="backup_code" id="backup_code" placeholder="Enter backup code" />
                <div style="margin-top: 8px; font-size: 12px; color: #64748b;">
                    Or use your <a href="#" id="use-2fa-code" style="color: #00f5ff;">2FA code</a>
                </div>
            </div>
            <button type="submit" class="btn" id="submit-btn">Log In</button>
        </form>

        <div style="margin-top: 16px; text-align: center;">
            <a href="/reset-password" style="color: #00f5ff; font-size: 14px; text-decoration: none;">Forgot password?</a>
        </div>

        <div class="help-text">
            <strong>Don't have an account?</strong><br>
            <a href="/signup" style="color: #00f5ff;">Sign up for free</a> to get started with Insertabot.
        </div>

        <div class="back-link">
            <a href="/">← Back to home</a>
        </div>
    </div>

    <script>
        // Toggle between 2FA code and backup code
        document.getElementById('use-backup-code')?.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('2fa-group').style.display = 'none';
            document.getElementById('backup-group').style.display = 'block';
            document.getElementById('totp_code').value = '';
            document.getElementById('backup_code').focus();
        });

        document.getElementById('use-2fa-code')?.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('backup-group').style.display = 'none';
            document.getElementById('2fa-group').style.display = 'block';
            document.getElementById('backup_code').value = '';
            document.getElementById('totp_code').focus();
        });

        document.getElementById('login-form').addEventListener('submit', async (e) => {
            e.preventDefault();

            const btn = document.getElementById('submit-btn');
            const errorMsg = document.getElementById('error-msg');
            const successMsg = document.getElementById('success-msg');

            btn.disabled = true;
            btn.textContent = 'Logging in...';
            errorMsg.style.display = 'none';
            successMsg.style.display = 'none';

            const formData = new FormData(e.target);
            const data = {
                email: formData.get('email'),
                password: formData.get('password'),
                totp_code: formData.get('totp_code') || undefined,
                backup_code: formData.get('backup_code') || undefined
            };

            try {
                const response = await fetch('/api/customer/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (result.success && result.session_id) {
                    // Successful login with session
                    successMsg.textContent = 'Login successful! Redirecting...';
                    successMsg.style.display = 'block';

                    setTimeout(() => {
                        window.location.href = '/dashboard';
                    }, 500);
                } else if (result.requires_2fa) {
                    // 2FA required - show 2FA input
                    document.getElementById('2fa-group').style.display = 'block';
                    document.getElementById('totp_code').required = true;
                    document.getElementById('totp_code').focus();
                    errorMsg.textContent = 'Please enter your 2FA code';
                    errorMsg.style.display = 'block';
                    btn.disabled = false;
                    btn.textContent = 'Verify 2FA';
                } else if (response.ok && result.api_key) {
                    // Legacy login (no password set) - fallback
                    successMsg.textContent = 'Login successful! Redirecting...';
                    successMsg.style.display = 'block';

                    setTimeout(() => {
                        window.location.href = '/dashboard?key=' + result.api_key;
                    }, 500);
                } else {
                    // Login failed
                    errorMsg.textContent = result.message || 'Invalid email or password';
                    errorMsg.style.display = 'block';
                    btn.disabled = false;
                    btn.textContent = 'Log In';
                }
            } catch (error) {
                errorMsg.textContent = 'Network error. Please try again.';
                errorMsg.style.display = 'block';
                btn.disabled = false;
                btn.textContent = 'Log In';
            }
        });
    </script>
</body>
</html>`;
}
