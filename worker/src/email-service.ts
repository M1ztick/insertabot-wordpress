/**
 * Email Service using Cloudflare MailChannels
 * Provides email sending functionality for authentication flows
 */

export interface EmailOptions {
	to: string;
	subject: string;
	html: string;
	text?: string;
}

export interface SendEmailResult {
	success: boolean;
	error?: string;
}

/**
 * Send an email using Cloudflare MailChannels API
 * MailChannels is free for Cloudflare Workers
 */
export async function sendEmail(options: EmailOptions): Promise<SendEmailResult> {
	try {
		const response = await fetch('https://api.mailchannels.net/tx/v1/send', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				personalizations: [
					{
						to: [{ email: options.to }],
					},
				],
				from: {
					email: 'support@insertabot.io',
					name: 'Insertabot',
				},
				subject: options.subject,
				content: [
					{
						type: 'text/html',
						value: options.html,
					},
					...(options.text
						? [
								{
									type: 'text/plain',
									value: options.text,
								},
						  ]
						: []),
				],
			}),
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error('MailChannels error:', errorText);
			return {
				success: false,
				error: `Email service error: ${response.status}`,
			};
		}

		return { success: true };
	} catch (error) {
		console.error('Failed to send email:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

/**
 * Send email verification email
 */
export async function sendVerificationEmail(
	email: string,
	verificationToken: string,
	baseUrl: string = 'https://insertabot.io'
): Promise<SendEmailResult> {
	const verificationUrl = `${baseUrl}/verify-email?token=${verificationToken}`;

	const html = generateVerificationEmailHtml(verificationUrl);
	const text = generateVerificationEmailText(verificationUrl);

	return sendEmail({
		to: email,
		subject: 'Verify Your Insertabot Account',
		html,
		text,
	});
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
	email: string,
	resetToken: string,
	baseUrl: string = 'https://insertabot.io'
): Promise<SendEmailResult> {
	const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

	const html = generatePasswordResetEmailHtml(resetUrl);
	const text = generatePasswordResetEmailText(resetUrl);

	return sendEmail({
		to: email,
		subject: 'Reset Your Insertabot Password',
		html,
		text,
	});
}

/**
 * Send welcome email after verification
 */
export async function sendWelcomeEmail(email: string, companyName: string): Promise<SendEmailResult> {
	const html = generateWelcomeEmailHtml(companyName);
	const text = generateWelcomeEmailText(companyName);

	return sendEmail({
		to: email,
		subject: 'Welcome to Insertabot! 🎉',
		html,
		text,
	});
}

// ==================== Email Templates ====================

function generateVerificationEmailHtml(verificationUrl: string): string {
	return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 8px 8px 0 0;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Verify Your Email</h1>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style="padding: 40px;">
                            <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                                Thanks for signing up with Insertabot! We're excited to have you on board.
                            </p>
                            <p style="margin: 0 0 30px; color: #374151; font-size: 16px; line-height: 1.6;">
                                To complete your registration and start building amazing chatbot experiences, please verify your email address by clicking the button below:
                            </p>

                            <!-- CTA Button -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding: 20px 0;">
                                        <a href="${verificationUrl}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(99, 102, 241, 0.25);">
                                            Verify Email Address
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin: 30px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                                If the button doesn't work, copy and paste this link into your browser:
                            </p>
                            <p style="margin: 10px 0 0; color: #6366f1; font-size: 14px; word-break: break-all;">
                                ${verificationUrl}
                            </p>

                            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">

                            <p style="margin: 0; color: #9ca3af; font-size: 12px; line-height: 1.6;">
                                This verification link will expire in 24 hours. If you didn't create an account with Insertabot, you can safely ignore this email.
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; text-align: center;">
                            <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px;">
                                © ${new Date().getFullYear()} Insertabot. All rights reserved.
                            </p>
                            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                                Need help? Contact us at <a href="mailto:support@insertabot.io" style="color: #6366f1; text-decoration: none;">support@insertabot.io</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
	`.trim();
}

function generateVerificationEmailText(verificationUrl: string): string {
	return `
Verify Your Email Address

Thanks for signing up with Insertabot! We're excited to have you on board.

To complete your registration and start building amazing chatbot experiences, please verify your email address by clicking the link below:

${verificationUrl}

This verification link will expire in 24 hours. If you didn't create an account with Insertabot, you can safely ignore this email.

Need help? Contact us at support@insertabot.io

© ${new Date().getFullYear()} Insertabot. All rights reserved.
	`.trim();
}

function generatePasswordResetEmailHtml(resetUrl: string): string {
	return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 8px 8px 0 0;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Reset Your Password</h1>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style="padding: 40px;">
                            <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                                We received a request to reset the password for your Insertabot account.
                            </p>
                            <p style="margin: 0 0 30px; color: #374151; font-size: 16px; line-height: 1.6;">
                                Click the button below to create a new password:
                            </p>

                            <!-- CTA Button -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding: 20px 0;">
                                        <a href="${resetUrl}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(99, 102, 241, 0.25);">
                                            Reset Password
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin: 30px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                                If the button doesn't work, copy and paste this link into your browser:
                            </p>
                            <p style="margin: 10px 0 0; color: #6366f1; font-size: 14px; word-break: break-all;">
                                ${resetUrl}
                            </p>

                            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">

                            <p style="margin: 0; color: #9ca3af; font-size: 12px; line-height: 1.6;">
                                This password reset link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email - your password will not be changed.
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; text-align: center;">
                            <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px;">
                                © ${new Date().getFullYear()} Insertabot. All rights reserved.
                            </p>
                            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                                Need help? Contact us at <a href="mailto:support@insertabot.io" style="color: #6366f1; text-decoration: none;">support@insertabot.io</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
	`.trim();
}

function generatePasswordResetEmailText(resetUrl: string): string {
	return `
Reset Your Password

We received a request to reset the password for your Insertabot account.

Click the link below to create a new password:

${resetUrl}

This password reset link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email - your password will not be changed.

Need help? Contact us at support@insertabot.io

© ${new Date().getFullYear()} Insertabot. All rights reserved.
	`.trim();
}

function generateWelcomeEmailHtml(companyName: string): string {
	return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Insertabot!</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 8px 8px 0 0;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700;">🎉 Welcome to Insertabot!</h1>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style="padding: 40px;">
                            <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                                Hi ${companyName}!
                            </p>
                            <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                                Your email has been verified and your account is now active! You're all set to start building amazing AI-powered chatbot experiences.
                            </p>

                            <h2 style="margin: 30px 0 20px; color: #1f2937; font-size: 20px; font-weight: 600;">🚀 Get Started</h2>

                            <ul style="margin: 0 0 20px; padding-left: 20px; color: #374151; font-size: 16px; line-height: 1.8;">
                                <li><strong>Customize your widget:</strong> Head to your dashboard to personalize colors, greetings, and bot behavior</li>
                                <li><strong>Add knowledge:</strong> Upload documents or paste URLs to teach your bot about your business</li>
                                <li><strong>Install the widget:</strong> Copy the embed code and add it to your website</li>
                                <li><strong>Monitor performance:</strong> Track conversations and analytics in real-time</li>
                            </ul>

                            <!-- CTA Button -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding: 20px 0;">
                                        <a href="https://insertabot.io/dashboard" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(99, 102, 241, 0.25);">
                                            Go to Dashboard
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">

                            <p style="margin: 0 0 10px; color: #374151; font-size: 16px; line-height: 1.6;">
                                <strong>Need Help?</strong>
                            </p>
                            <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                                We're here to help! Reach out anytime at <a href="mailto:support@insertabot.io" style="color: #6366f1; text-decoration: none;">support@insertabot.io</a>
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; text-align: center;">
                            <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px;">
                                © ${new Date().getFullYear()} Insertabot. All rights reserved.
                            </p>
                            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                                Built with ❤️ for amazing customer experiences
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
	`.trim();
}

function generateWelcomeEmailText(companyName: string): string {
	return `
Welcome to Insertabot!

Hi ${companyName}!

Your email has been verified and your account is now active! You're all set to start building amazing AI-powered chatbot experiences.

GET STARTED:
- Customize your widget: Head to your dashboard to personalize colors, greetings, and bot behavior
- Add knowledge: Upload documents or paste URLs to teach your bot about your business
- Install the widget: Copy the embed code and add it to your website
- Monitor performance: Track conversations and analytics in real-time

Visit your dashboard: https://insertabot.io/dashboard

Need Help?
We're here to help! Reach out anytime at support@insertabot.io

© ${new Date().getFullYear()} Insertabot. All rights reserved.
Built with ❤️ for amazing customer experiences
	`.trim();
}
