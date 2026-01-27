
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

  ${escapeHtml(String(customer.email_verified)) === '0' ? `
  <div style="background: linear-gradient(135deg, #ffa500, #ff6b35); color: #fff; padding: 16px; border-radius: 12px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; gap: 16px;">
    <div>
      <strong>⚠️ Email not verified</strong>
      <p style="margin: 4px 0 0; font-size: 0.85rem; opacity: 0.9;">Please check your inbox and verify your email address.</p>
    </div>
    <button onclick="resendVerificationEmail()" style="background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.4); color: #fff; padding: 8px 16px; border-radius: 8px; cursor: pointer; white-space: nowrap; font-weight: 600;">Resend Email</button>
  </div>
  ` : ''}

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

  <section class="card">
    <h2>🔒 Security Settings</h2>

    <div style="margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid var(--border);">
      <h3 style="font-size: 0.95rem; margin-bottom: 8px; color: var(--text);">Two-Factor Authentication (2FA)</h3>
      <p style="color: var(--muted); font-size: 0.85rem; margin-bottom: 12px;">
        Add an extra layer of security to your account by requiring a time-based code in addition to your password.
      </p>

      <div id="2fa-status">
        ${escapeHtml(String(customer.totp_enabled)) === '1' ? `
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
            <span style="color: #00ff88; font-weight: 600;">✓ 2FA Enabled</span>
          </div>
          <button class="btn" onclick="disable2FA()" style="background: linear-gradient(135deg, #ff0055, #ff00ff); max-width: 200px;">Disable 2FA</button>
        ` : `
          <button class="btn" onclick="enable2FA()" style="max-width: 200px;">Enable 2FA</button>
        `}
      </div>

      <!-- 2FA Setup Modal -->
      <div id="2fa-setup-modal" style="display: none; margin-top: 20px; padding: 20px; background: #000; border: 1px solid var(--border); border-radius: 12px;">
        <h4 style="margin-bottom: 12px; color: var(--cyan);">Set Up 2FA</h4>
        <p style="color: var(--muted); font-size: 0.85rem; margin-bottom: 16px;">
          Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.):
        </p>
        <div id="qr-code" style="text-align: center; margin: 20px 0; padding: 20px; background: #fff; border-radius: 8px;"></div>
        <p style="color: var(--muted); font-size: 0.75rem; margin-bottom: 16px; text-align: center;">
          Or enter this secret manually: <br>
          <code id="2fa-secret" style="background: var(--panel); padding: 4px 8px; border-radius: 4px; color: var(--cyan);"></code>
        </p>

        <div style="margin-bottom: 16px;">
          <label style="display: block; margin-bottom: 6px; font-size: 0.85rem; color: var(--muted);">Enter the 6-digit code from your app to verify:</label>
          <input type="text" id="verify-2fa-code" maxlength="6" pattern="[0-9]{6}" placeholder="000000" style="width: 100%; padding: 10px; background: #000; border: 1px solid var(--border); border-radius: 10px; color: var(--text); font-size: 1.2rem; text-align: center; letter-spacing: 0.3em;" />
        </div>

        <div id="backup-codes-section" style="display: none; margin: 16px 0; padding: 16px; background: rgba(0, 245, 255, 0.05); border: 1px solid var(--border); border-radius: 8px;">
          <h4 style="margin-bottom: 8px; color: var(--cyan);">⚠️ Save Your Backup Codes</h4>
          <p style="color: var(--muted); font-size: 0.8rem; margin-bottom: 12px;">
            Store these codes in a safe place. Each can be used once if you lose access to your authenticator app.
          </p>
          <div id="backup-codes-list" style="font-family: monospace; font-size: 0.85rem; color: var(--text);"></div>
          <button onclick="downloadBackupCodes()" class="btn" style="margin-top: 12px; max-width: 200px;">Download Codes</button>
        </div>

        <div style="display: flex; gap: 12px;">
          <button class="btn" onclick="verify2FASetup()" id="verify-2fa-btn">Verify & Enable</button>
          <button onclick="cancel2FASetup()" style="background: transparent; border: 1px solid var(--border); color: var(--text); padding: 12px 26px; border-radius: 10px; cursor: pointer; font-weight: 700;">Cancel</button>
        </div>
      </div>

      <!-- 2FA Disable Confirmation -->
      <div id="2fa-disable-modal" style="display: none; margin-top: 20px; padding: 20px; background: rgba(255, 0, 85, 0.05); border: 1px solid rgba(255, 0, 85, 0.3); border-radius: 12px;">
        <h4 style="margin-bottom: 12px; color: #ff0055;">Disable 2FA</h4>
        <p style="color: var(--muted); font-size: 0.85rem; margin-bottom: 16px;">
          Enter your password to confirm disabling two-factor authentication:
        </p>
        <input type="password" id="disable-2fa-password" placeholder="Your password" style="width: 100%; padding: 10px; background: #000; border: 1px solid var(--border); border-radius: 10px; color: var(--text); margin-bottom: 16px;" />
        <div style="display: flex; gap: 12px;">
          <button class="btn" onclick="confirmDisable2FA()" style="background: linear-gradient(135deg, #ff0055, #ff00ff);">Confirm Disable</button>
          <button onclick="cancelDisable2FA()" style="background: transparent; border: 1px solid var(--border); color: var(--text); padding: 12px 26px; border-radius: 10px; cursor: pointer; font-weight: 700;">Cancel</button>
        </div>
      </div>
    </div>
  </section>
</div>

<script>
  // Store backup codes globally for download
  let backupCodesGlobal = [];

  async function resendVerificationEmail() {
    try {
      const response = await fetch('/api/auth/email/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: '${escapeHtml(customer.email)}' })
      });

      const result = await response.json();
      const toast = document.getElementById('toast');
      toast.textContent = response.ok ? '✉️ Verification email sent!' : '❌ ' + result.message;
      toast.style.display = 'block';
      setTimeout(() => toast.style.display = 'none', 3000);
    } catch (err) {
      alert('Failed to send verification email');
    }
  }

  async function enable2FA() {
    try {
      const response = await fetch('/api/auth/2fa/enable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': '${escapeHtml(customer.api_key)}'
        }
      });

      const result = await response.json();

      if (response.ok) {
        // Store backup codes
        backupCodesGlobal = result.backup_codes || [];

        // Display QR code
        document.getElementById('2fa-setup-modal').style.display = 'block';
        document.getElementById('2fa-secret').textContent = result.secret;

        // Generate QR code using simple data URL approach
        const qrContainer = document.getElementById('qr-code');
        qrContainer.innerHTML = \`<img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=\${encodeURIComponent(result.qr_uri)}" alt="2FA QR Code" style="max-width: 200px;" />\`;
      } else {
        alert('Failed to enable 2FA: ' + result.message);
      }
    } catch (err) {
      alert('Error enabling 2FA');
    }
  }

  async function verify2FASetup() {
    const code = document.getElementById('verify-2fa-code').value;

    if (code.length !== 6) {
      alert('Please enter a 6-digit code');
      return;
    }

    try {
      const response = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': '${escapeHtml(customer.api_key)}'
        },
        body: JSON.stringify({ totp_code: code })
      });

      const result = await response.json();

      if (response.ok) {
        // Show backup codes
        const backupSection = document.getElementById('backup-codes-section');
        const backupList = document.getElementById('backup-codes-list');
        backupList.innerHTML = backupCodesGlobal.map(code => \`<div style="margin: 4px 0;">\${code}</div>\`).join('');
        backupSection.style.display = 'block';

        // Disable verify button and show success
        document.getElementById('verify-2fa-btn').disabled = true;
        document.getElementById('verify-2fa-btn').textContent = '✓ 2FA Enabled!';

        const toast = document.getElementById('toast');
        toast.textContent = '✓ 2FA enabled successfully! Save your backup codes.';
        toast.style.display = 'block';

        // Reload page after 3 seconds
        setTimeout(() => location.reload(), 3000);
      } else {
        alert('Invalid code. Please try again.');
      }
    } catch (err) {
      alert('Error verifying 2FA code');
    }
  }

  function downloadBackupCodes() {
    const content = '2FA Backup Codes for Insertabot\\n\\n' + backupCodesGlobal.join('\\n') + '\\n\\nKeep these codes safe! Each can only be used once.';
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'insertabot-2fa-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  }

  function cancel2FASetup() {
    document.getElementById('2fa-setup-modal').style.display = 'none';
    document.getElementById('verify-2fa-code').value = '';
  }

  function disable2FA() {
    document.getElementById('2fa-disable-modal').style.display = 'block';
  }

  function cancelDisable2FA() {
    document.getElementById('2fa-disable-modal').style.display = 'none';
    document.getElementById('disable-2fa-password').value = '';
  }

  async function confirmDisable2FA() {
    const password = document.getElementById('disable-2fa-password').value;

    if (!password) {
      alert('Please enter your password');
      return;
    }

    try {
      const response = await fetch('/api/auth/2fa/disable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': '${escapeHtml(customer.api_key)}'
        },
        body: JSON.stringify({ password })
      });

      const result = await response.json();

      if (response.ok) {
        const toast = document.getElementById('toast');
        toast.textContent = '✓ 2FA disabled successfully';
        toast.style.display = 'block';
        setTimeout(() => location.reload(), 1500);
      } else {
        alert('Failed to disable 2FA: ' + result.message);
      }
    } catch (err) {
      alert('Error disabling 2FA');
    }
  }

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
