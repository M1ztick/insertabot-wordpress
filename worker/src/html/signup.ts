/**
 * Signup Page HTML
 */

export function getSignupHTML(): string {
	return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sign Up - Insertabot</title>
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
        .signup-container {
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
        .signup-container::before {
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
        .features {
            margin-top: 32px;
            padding-top: 24px;
            border-top: 1px solid rgba(0, 245, 255, 0.2);
        }
        .feature {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 12px;
            font-size: 14px;
            color: #94a3b8;
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
        .password-strength {
            margin-top: 8px;
            font-size: 12px;
            color: #94a3b8;
        }
        .strength-bar {
            height: 4px;
            background: rgba(0, 245, 255, 0.1);
            border-radius: 2px;
            margin-top: 4px;
            overflow: hidden;
        }
        .strength-fill {
            height: 100%;
            width: 0%;
            transition: all 0.3s;
            border-radius: 2px;
        }
        .strength-weak { width: 33%; background: #ff0055; }
        .strength-medium { width: 66%; background: #ffa500; }
        .strength-strong { width: 100%; background: #00ff88; }
        .password-requirements {
            margin-top: 8px;
            font-size: 11px;
            color: #64748b;
        }
        .requirement {
            margin: 2px 0;
        }
        .requirement.met {
            color: #00ff88;
        }
    </style>
</head>
<body>
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
            <div class="form-group">
                <label>Password</label>
                <input type="password" name="password" id="password" required placeholder="Create a secure password" />
                <div class="password-strength">
                    <div class="strength-bar">
                        <div class="strength-fill" id="strength-fill"></div>
                    </div>
                    <span id="strength-text">Password strength</span>
                </div>
                <div class="password-requirements">
                    <div class="requirement" id="req-length">• At least 12 characters</div>
                    <div class="requirement" id="req-upper">• One uppercase letter</div>
                    <div class="requirement" id="req-lower">• One lowercase letter</div>
                    <div class="requirement" id="req-number">• One number</div>
                    <div class="requirement" id="req-special">• One special character</div>
                </div>
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
        // Password strength checker
        const passwordInput = document.getElementById('password');
        const strengthFill = document.getElementById('strength-fill');
        const strengthText = document.getElementById('strength-text');

        passwordInput.addEventListener('input', (e) => {
            const password = e.target.value;
            const checks = {
                length: password.length >= 12,
                upper: /[A-Z]/.test(password),
                lower: /[a-z]/.test(password),
                number: /[0-9]/.test(password),
                special: /[^a-zA-Z0-9]/.test(password)
            };

            // Update requirement indicators
            document.getElementById('req-length').classList.toggle('met', checks.length);
            document.getElementById('req-upper').classList.toggle('met', checks.upper);
            document.getElementById('req-lower').classList.toggle('met', checks.lower);
            document.getElementById('req-number').classList.toggle('met', checks.number);
            document.getElementById('req-special').classList.toggle('met', checks.special);

            // Calculate strength
            const metCount = Object.values(checks).filter(v => v).length;
            strengthFill.className = 'strength-fill';

            if (metCount <= 2) {
                strengthFill.classList.add('strength-weak');
                strengthText.textContent = 'Weak password';
            } else if (metCount <= 4) {
                strengthFill.classList.add('strength-medium');
                strengthText.textContent = 'Medium password';
            } else {
                strengthFill.classList.add('strength-strong');
                strengthText.textContent = 'Strong password';
            }
        });

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
                // Create account
                const response = await fetch('/api/customer/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (response.ok) {
                    // Set password for the account
                    const setPasswordResponse = await fetch('/api/auth/set-password', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            email: data.email,
                            password: data.password
                        })
                    });

                    if (setPasswordResponse.ok) {
                        // Auto-login after signup
                        const loginResponse = await fetch('/api/customer/login', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                email: data.email,
                                password: data.password
                            })
                        });

                        const loginResult = await loginResponse.json();
                        if (loginResult.success && loginResult.session_id) {
                            window.location.href = '/dashboard';
                        } else {
                            // Fallback to API key access
                            window.location.href = '/dashboard?key=' + result.api_key;
                        }
                    } else {
                        // If password set fails, still redirect but show message
                        window.location.href = '/dashboard?key=' + result.api_key;
                    }
                } else {
                    errorMsg.textContent = result.error || result.message || 'Failed to create account';
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
