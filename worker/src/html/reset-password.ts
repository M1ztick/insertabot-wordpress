/**
 * Password Reset Page HTML
 */

export function getResetPasswordHTML(): string {
	return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Password - Insertabot</title>
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
        .reset-container {
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
        .reset-container::before {
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
        .info {
            background: rgba(0, 245, 255, 0.1);
            border: 1px solid rgba(0, 245, 255, 0.3);
            color: #00f5ff;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 16px;
            font-size: 13px;
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
        .password-requirements {
            font-size: 12px;
            color: #64748b;
            margin-top: 8px;
            line-height: 1.6;
        }
        .password-requirements ul {
            margin-top: 4px;
            margin-left: 20px;
        }
        #reset-form-container, #request-form-container {
            display: none;
        }
    </style>
</head>
<body>
    <div class="reset-container">
        <h1>Reset Password</h1>
        <p class="subtitle" id="page-subtitle">Enter your email to receive a password reset link</p>

        <div id="error-msg" class="error"></div>
        <div id="success-msg" class="success"></div>

        <!-- Request Reset Token Form -->
        <div id="request-form-container">
            <form id="request-form">
                <div class="form-group">
                    <label>Email Address</label>
                    <input type="email" name="email" id="request-email" required placeholder="you@company.com" autofocus />
                </div>
                <button type="submit" class="btn" id="request-btn">Send Reset Link</button>
            </form>

            <div class="back-link">
                <a href="/login">← Back to login</a>
            </div>
        </div>

        <!-- Reset Password Form (with token) -->
        <div id="reset-form-container">
            <div class="info" id="dev-info" style="display: none;">
                <strong>Development Mode:</strong> Your reset token is: <code id="token-display" style="color: #fff;"></code>
            </div>

            <form id="reset-form">
                <input type="hidden" name="token" id="reset-token" />
                <div class="form-group">
                    <label>New Password</label>
                    <input type="password" name="new_password" id="new-password" required placeholder="Enter new password" />
                    <div class="password-requirements">
                        Password must contain:
                        <ul>
                            <li>At least 8 characters</li>
                            <li>One uppercase letter</li>
                            <li>One lowercase letter</li>
                            <li>One number</li>
                            <li>One special character</li>
                        </ul>
                    </div>
                </div>
                <div class="form-group">
                    <label>Confirm Password</label>
                    <input type="password" name="confirm_password" id="confirm-password" required placeholder="Confirm new password" />
                </div>
                <button type="submit" class="btn" id="reset-btn">Reset Password</button>
            </form>

            <div class="back-link">
                <a href="/login">← Back to login</a>
            </div>
        </div>
    </div>

    <script>
        // Check if we have a token in URL (for reset) or show request form
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');

        if (token) {
            // Show reset form
            document.getElementById('reset-form-container').style.display = 'block';
            document.getElementById('request-form-container').style.display = 'none';
            document.getElementById('page-subtitle').textContent = 'Enter your new password';
            document.getElementById('reset-token').value = token;
        } else {
            // Show request form
            document.getElementById('reset-form-container').style.display = 'none';
            document.getElementById('request-form-container').style.display = 'block';
        }

        // Handle password reset request
        document.getElementById('request-form').addEventListener('submit', async (e) => {
            e.preventDefault();

            const btn = document.getElementById('request-btn');
            const errorMsg = document.getElementById('error-msg');
            const successMsg = document.getElementById('success-msg');

            btn.disabled = true;
            btn.textContent = 'Sending...';
            errorMsg.style.display = 'none';
            successMsg.style.display = 'none';

            const formData = new FormData(e.target);
            const data = {
                email: formData.get('email')
            };

            try {
                const response = await fetch('/api/auth/password-reset-request', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    successMsg.textContent = result.message || 'If an account exists with this email, a password reset link has been sent.';
                    successMsg.style.display = 'block';

                    // In development, show the token
                    if (result.reset_token) {
                        document.getElementById('dev-info').style.display = 'block';
                        document.getElementById('token-display').textContent = result.reset_token;

                        // Auto-switch to reset form after 2 seconds
                        setTimeout(() => {
                            window.location.href = '/reset-password?token=' + result.reset_token;
                        }, 2000);
                    } else {
                        // In production, just show success message
                        document.getElementById('request-form').reset();
                    }

                    btn.textContent = 'Send Reset Link';
                } else {
                    errorMsg.textContent = result.message || 'Failed to send reset link';
                    errorMsg.style.display = 'block';
                    btn.disabled = false;
                    btn.textContent = 'Send Reset Link';
                }
            } catch (error) {
                errorMsg.textContent = 'Network error. Please try again.';
                errorMsg.style.display = 'block';
                btn.disabled = false;
                btn.textContent = 'Send Reset Link';
            }
        });

        // Handle password reset (with token)
        document.getElementById('reset-form').addEventListener('submit', async (e) => {
            e.preventDefault();

            const btn = document.getElementById('reset-btn');
            const errorMsg = document.getElementById('error-msg');
            const successMsg = document.getElementById('success-msg');

            btn.disabled = true;
            btn.textContent = 'Resetting...';
            errorMsg.style.display = 'none';
            successMsg.style.display = 'none';

            const formData = new FormData(e.target);
            const newPassword = formData.get('new_password');
            const confirmPassword = formData.get('confirm_password');

            // Validate passwords match
            if (newPassword !== confirmPassword) {
                errorMsg.textContent = 'Passwords do not match';
                errorMsg.style.display = 'block';
                btn.disabled = false;
                btn.textContent = 'Reset Password';
                return;
            }

            const data = {
                token: formData.get('token'),
                new_password: newPassword
            };

            try {
                const response = await fetch('/api/auth/password-reset', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    successMsg.textContent = result.message || 'Password reset successfully! Redirecting to login...';
                    successMsg.style.display = 'block';

                    setTimeout(() => {
                        window.location.href = '/login';
                    }, 2000);
                } else {
                    errorMsg.textContent = result.message || 'Failed to reset password';
                    errorMsg.style.display = 'block';
                    btn.disabled = false;
                    btn.textContent = 'Reset Password';
                }
            } catch (error) {
                errorMsg.textContent = 'Network error. Please try again.';
                errorMsg.style.display = 'block';
                btn.disabled = false;
                btn.textContent = 'Reset Password';
            }
        });
    </script>
</body>
</html>`;
}
