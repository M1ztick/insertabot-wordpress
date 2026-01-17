/**
 * Email Verification Endpoints
 * Handles sending verification emails, verifying tokens, and resending
 */

import { generateEmailVerificationToken } from './auth';
import { sendVerificationEmail, sendWelcomeEmail } from './email-service';
import { logSecurityEvent } from './security-audit';
import { AppError, ErrorCode, withDatabase } from './errors';

// Cloudflare D1 Database type
type D1Database = any;

// ==================== Send Verification Email ====================

export interface SendVerificationEmailRequest {
	email: string;
}

export interface SendVerificationEmailResponse {
	success: boolean;
	message: string;
}

/**
 * Send email verification email to a user
 * Rate limited to prevent abuse (max 1 per 5 minutes)
 */
export async function handleSendVerificationEmail(
	db: D1Database,
	request: SendVerificationEmailRequest,
	ipAddress: string | null
): Promise<SendVerificationEmailResponse> {
	// Get customer by email
	const customer = await withDatabase(
		async () =>
			db
				.prepare(
					`SELECT customer_id, email, email_verified, email_verification_sent_at
					 FROM customers
					 WHERE email = ? AND status = 'active'`
				)
				.bind(request.email)
				.first<{
					customer_id: string;
					email: string;
					email_verified: number;
					email_verification_sent_at: number | null;
				}>(),
		'getCustomerForVerification'
	);

	// Return generic success message to prevent email enumeration
	if (!customer) {
		return {
			success: true,
			message: 'If an account exists with this email, a verification email has been sent.',
		};
	}

	// Check if already verified
	if (customer.email_verified === 1) {
		throw new AppError(ErrorCode.INVALID_REQUEST, 'Email is already verified', 400);
	}

	// Rate limiting: Allow max 1 verification email per 5 minutes
	const now = Math.floor(Date.now() / 1000);
	if (customer.email_verification_sent_at) {
		const timeSinceLastEmail = now - customer.email_verification_sent_at;
		const RATE_LIMIT_SECONDS = 300; // 5 minutes

		if (timeSinceLastEmail < RATE_LIMIT_SECONDS) {
			const waitTime = Math.ceil((RATE_LIMIT_SECONDS - timeSinceLastEmail) / 60);
			throw new AppError(
				ErrorCode.RATE_LIMIT_EXCEEDED,
				`Please wait ${waitTime} minute(s) before requesting another verification email.`,
				429
			);
		}
	}

	// Generate verification token (valid for 24 hours)
	const verificationToken = generateEmailVerificationToken();
	const expiresAt = now + 86400; // 24 hours

	// Update customer with verification token
	await withDatabase(
		async () =>
			db
				.prepare(
					`UPDATE customers
					 SET email_verification_token = ?,
					     email_verification_expires = ?,
					     email_verification_sent_at = ?,
					     updated_at = ?
					 WHERE customer_id = ?`
				)
				.bind(verificationToken, expiresAt, now, now, customer.customer_id)
				.run(),
		'setVerificationToken'
	);

	// Send verification email
	const emailResult = await sendVerificationEmail(customer.email, verificationToken);

	if (!emailResult.success) {
		console.error('Failed to send verification email:', emailResult.error);
		throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to send verification email', 500);
	}

	// Log security event
	await logSecurityEvent(db, {
		customer_id: customer.customer_id,
		event_type: 'verification_email_sent',
		ip_address: ipAddress || undefined,
	});

	return {
		success: true,
		message: 'Verification email sent successfully. Please check your inbox.',
	};
}

// ==================== Verify Email Token ====================

export interface VerifyEmailRequest {
	token: string;
}

export interface VerifyEmailResponse {
	success: boolean;
	message: string;
	customer_id?: string;
}

/**
 * Verify email using verification token
 */
export async function handleVerifyEmail(
	db: D1Database,
	request: VerifyEmailRequest,
	ipAddress: string | null
): Promise<VerifyEmailResponse> {
	// Find customer with valid verification token
	const customer = await withDatabase(
		async () =>
			db
				.prepare(
					`SELECT customer_id, email, company_name, email_verified, email_verification_expires
					 FROM customers
					 WHERE email_verification_token = ?`
				)
				.bind(request.token)
				.first<{
					customer_id: string;
					email: string;
					company_name: string;
					email_verified: number;
					email_verification_expires: number;
				}>(),
		'getCustomerByVerificationToken'
	);

	if (!customer) {
		throw new AppError(ErrorCode.INVALID_REQUEST, 'Invalid or expired verification token', 400);
	}

	// Check if already verified
	if (customer.email_verified === 1) {
		return {
			success: true,
			message: 'Email is already verified',
			customer_id: customer.customer_id,
		};
	}

	// Check if token is expired
	const now = Math.floor(Date.now() / 1000);
	if (customer.email_verification_expires < now) {
		throw new AppError(
			ErrorCode.INVALID_REQUEST,
			'Verification token has expired. Please request a new one.',
			400
		);
	}

	// Mark email as verified and clear verification token
	await withDatabase(
		async () =>
			db
				.prepare(
					`UPDATE customers
					 SET email_verified = 1,
					     email_verification_token = NULL,
					     email_verification_expires = NULL,
					     updated_at = ?
					 WHERE customer_id = ?`
				)
				.bind(now, customer.customer_id)
				.run(),
		'verifyEmail'
	);

	// Log security event
	await logSecurityEvent(db, {
		customer_id: customer.customer_id,
		event_type: 'email_verified',
		ip_address: ipAddress || undefined,
	});

	// Send welcome email (non-blocking, don't wait for result)
	sendWelcomeEmail(customer.email, customer.company_name).catch(err => {
		console.error('Failed to send welcome email:', err);
	});

	return {
		success: true,
		message: 'Email verified successfully! Your account is now active.',
		customer_id: customer.customer_id,
	};
}

// ==================== Resend Verification Email ====================

export interface ResendVerificationEmailRequest {
	email: string;
}

/**
 * Resend verification email (alias for handleSendVerificationEmail)
 * Convenience endpoint with same functionality
 */
export async function handleResendVerificationEmail(
	db: D1Database,
	request: ResendVerificationEmailRequest,
	ipAddress: string | null
): Promise<SendVerificationEmailResponse> {
	return handleSendVerificationEmail(db, { email: request.email }, ipAddress);
}

// ==================== Check Verification Status ====================

export interface CheckVerificationStatusRequest {
	email: string;
}

export interface CheckVerificationStatusResponse {
	verified: boolean;
	email: string;
}

/**
 * Check if an email is verified (useful for frontend)
 */
export async function handleCheckVerificationStatus(
	db: D1Database,
	request: CheckVerificationStatusRequest
): Promise<CheckVerificationStatusResponse> {
	const customer = await withDatabase(
		async () =>
			db
				.prepare('SELECT email, email_verified FROM customers WHERE email = ?')
				.bind(request.email)
				.first<{ email: string; email_verified: number }>(),
		'checkVerificationStatus'
	);

	if (!customer) {
		throw new AppError(ErrorCode.INVALID_REQUEST, 'Account not found', 404);
	}

	return {
		verified: customer.email_verified === 1,
		email: customer.email,
	};
}
