/**
 * Email Verification HTML Page
 */

export function getVerifyEmailHTML(): string {
	return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Email - Insertabot</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            padding: 40px;
            max-width: 500px;
            width: 100%;
            text-align: center;
        }
        .logo {
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, #6366f1, #8b5cf6);
            border-radius: 12px;
            margin: 0 auto 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            color: white;
            font-weight: bold;
        }
        h1 {
            font-size: 28px;
            color: #1f2937;
            margin-bottom: 16px;
            font-weight: 700;
        }
        .message {
            color: #6b7280;
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 32px;
        }
        .status {
            padding: 16px;
            border-radius: 8px;
            margin-bottom: 24px;
            font-weight: 500;
        }
        .status.success {
            background: #d1fae5;
            color: #065f46;
            border: 1px solid #a7f3d0;
        }
        .status.error {
            background: #fee2e2;
            color: #991b1b;
            border: 1px solid #fca5a5;
        }
        .status.loading {
            background: #dbeafe;
            color: #1e40af;
            border: 1px solid #93c5fd;
        }
        .btn {
            background: linear-gradient(135deg, #6366f1, #8b5cf6);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            transition: transform 0.2s;
        }
        .btn:hover {
            transform: translateY(-2px);
        }
        .spinner {
            border: 3px solid #f3f4f6;
            border-top: 3px solid #6366f1;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            animation: spin 1s linear infinite;
            margin: 0 auto 16px;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">IB</div>
        <h1>Email Verification</h1>
        
        <div id="loading-state" class="status loading">
            <div class="spinner"></div>
            Verifying your email address...
        </div>
        
        <div id="success-state" class="status success" style="display: none;">
            ✅ Email verified successfully! Your account is now active.
        </div>
        
        <div id="error-state" class="status error" style="display: none;">
            ❌ <span id="error-message">Verification failed</span>
        </div>
        
        <div class="message">
            <p id="status-message">Please wait while we verify your email address...</p>
        </div>
        
        <div id="action-buttons" style="display: none;">
            <a href="/login" class="btn">Continue to Login</a>
        </div>
    </div>

    <script>
        async function verifyEmail() {
            const urlParams = new URLSearchParams(window.location.search);
            const token = urlParams.get('token');
            
            if (!token) {
                showError('No verification token provided');
                return;
            }
            
            try {
                const response = await fetch('/api/auth/verify-email', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ token })
                });
                
                const result = await response.json();
                
                if (response.ok && result.success) {
                    showSuccess(result.message);
                } else {
                    showError(result.message || 'Verification failed');
                }
            } catch (error) {
                showError('Network error. Please try again.');
            }
        }
        
        function showSuccess(message) {
            document.getElementById('loading-state').style.display = 'none';
            document.getElementById('success-state').style.display = 'block';
            document.getElementById('status-message').textContent = message;
            document.getElementById('action-buttons').style.display = 'block';
        }
        
        function showError(message) {
            document.getElementById('loading-state').style.display = 'none';
            document.getElementById('error-state').style.display = 'block';
            document.getElementById('error-message').textContent = message;
            document.getElementById('status-message').innerHTML = 
                'You can <a href="/api/auth/resend-verification" style="color: #6366f1;">request a new verification email</a> or contact support if you continue having issues.';
        }
        
        // Start verification when page loads
        verifyEmail();
    </script>
</body>
</html>`;
}