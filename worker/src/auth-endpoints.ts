/**
 * Authentication API Endpoints
 * Handles password authentication, 2FA, password reset, and session management
 */

import {
	hashPassword,
	verifyPassword,
	validatePasswordStrength,
	generateTOTPSecret,
	verifyTOTPCode,
	generateTOTPUri,
	generateBackupCodes,
	hashBackupCodes,
	verifyBackupCode,
	generateResetToken,
	checkLoginAttempts,
	calculateLockTime,
} from './auth';
import {
	createSession,
	getSession,
	invalidateSession,
	invalidateAllCustomerSessions,
	getSessionIdFromRequest,
	createSessionCookie,
	createSessionDeletionCookie,
} from './session';
import { logSecurityEvent, SecurityEventType } from './security-audit';
import { AppError, ErrorCode, AuthenticationError, withDatabase } from './errors';

// ==================== Password Setup ====================

export interface SetPasswordRequest {
	email: string;
	password: string;
}

export interface SetPasswordResponse {
	success: boolean;
	message: string;
}

/**
 * Set password for a user account (first-time setup or after account creation)
 */
export async function handleSetPassword(
	db: D1Database,
	request: SetPasswordRequest,
	ipAddress: string | null,
	userAgent: string | null
): Promise<SetPasswordResponse> {
	// Validate password strength
	const validation = validatePasswordStrength(request.password);
	if (!validation.valid) {
		throw new AppError(
			ErrorCode.INVALID_REQUEST,
			`Password requirements not met: ${validation.errors.join(', ')}`,
			400
		);
	}

	// Get customer by email
	const customer = await withDatabase(
		async () =>
			db.prepare('SELECT customer_id, password_hash FROM customers WHERE email = ?')
				.bind(request.email)
				.first<{ customer_id: string; password_hash: string | null }>(),
		'getCustomerForPasswordSet'
	);

	if (!customer) {
		throw new AuthenticationError(ErrorCode.INVALID_API_KEY, 'Account not found');
	}

	// Check if password already exists
	if (customer.password_hash) {
		throw new AppError(ErrorCode.INVALID_REQUEST, 'Password already set. Use password change endpoint.', 400);
	}

	// Hash the password
	const { hash, salt } = await hashPassword(request.password);

	// Update customer record
	await withDatabase(
		async () =>
			db.prepare('UPDATE customers SET password_hash = ?, password_salt = ?, updated_at = ? WHERE customer_id = ?')
				.bind(hash, salt, Math.floor(Date.now() / 1000), customer.customer_id)
				.run(),
		'setPassword'
	);

	// Log security event
	await logSecurityEvent(db, {
		customer_id: customer.customer_id,
		event_type: 'password_created',
		ip_address: ipAddress || undefined,
		user_agent: userAgent || undefined,
	});

	return {
		success: true,
		message: 'Password set successfully',
	};
}

// ==================== Login with Password ====================

export interface LoginRequest {
	email: string;
	password: string;
	totp_code?: string;
	backup_code?: string;
}

export interface LoginResponse {
	success: boolean;
	session_id?: string;
	requires_2fa?: boolean;
	temp_token?: string; // Temporary token for 2FA verification
	message: string;
}

/**
 * Handle login with password (and optional 2FA)
 */
export async function handleLogin(
	db: D1Database,
	request: LoginRequest,
	ipAddress: string | null,
	userAgent: string | null
): Promise<{ response: LoginResponse; sessionCookie?: string }> {
	// Get customer with authentication fields
	const customer = await withDatabase(
		async () =>
			db.prepare(
				`SELECT customer_id, email, password_hash, password_salt, totp_enabled, totp_secret,
				        backup_codes, failed_login_attempts, account_locked_until
				 FROM customers WHERE email = ? AND status = 'active'`
			)
				.bind(request.email)
				.first<{
					customer_id: string;
					email: string;
					password_hash: string | null;
					password_salt: string | null;
					totp_enabled: number;
					totp_secret: string | null;
					backup_codes: string | null;
					failed_login_attempts: number;
					account_locked_until: number | null;
				}>(),
		'getCustomerForLogin'
	);

	if (!customer) {
		throw new AuthenticationError(ErrorCode.INVALID_API_KEY, 'Invalid email or password');
	}

	// Check if account is locked
	const lockCheck = checkLoginAttempts(customer.failed_login_attempts, customer.account_locked_until);
	if (!lockCheck.allowed) {
		await logSecurityEvent(db, {
			customer_id: customer.customer_id,
			event_type: 'login_locked',
			ip_address: ipAddress || undefined,
			user_agent: userAgent || undefined,
			metadata: { locked_until: lockCheck.lockedUntil?.toISOString() },
		});

		throw new AppError(
			ErrorCode.RATE_LIMIT_EXCEEDED,
			`Account temporarily locked. Try again after ${lockCheck.lockedUntil?.toLocaleString()}`,
			429
		);
	}

	// Check if password is set
	if (!customer.password_hash || !customer.password_salt) {
		throw new AppError(ErrorCode.INVALID_REQUEST, 'Please set a password for your account first', 400);
	}

	// Verify password
	const passwordValid = await verifyPassword(request.password, customer.password_hash, customer.password_salt);

	if (!passwordValid) {
		// Increment failed login attempts
		const newFailedAttempts = customer.failed_login_attempts + 1;
		const lockTime = calculateLockTime(newFailedAttempts);

		await withDatabase(
			async () =>
				db.prepare(
					'UPDATE customers SET failed_login_attempts = ?, account_locked_until = ?, updated_at = ? WHERE customer_id = ?'
				)
					.bind(newFailedAttempts, lockTime || null, Math.floor(Date.now() / 1000), customer.customer_id)
					.run(),
			'incrementFailedAttempts'
		);

		await logSecurityEvent(db, {
			customer_id: customer.customer_id,
			event_type: 'login_failed',
			ip_address: ipAddress || undefined,
			user_agent: userAgent || undefined,
			metadata: { reason: 'invalid_password', attempts: newFailedAttempts },
		});

		throw new AuthenticationError(ErrorCode.INVALID_API_KEY, 'Invalid email or password');
	}

	// Password is correct - check if 2FA is enabled
	if (customer.totp_enabled === 1) {
		let twoFactorValid = false;

		// Check TOTP code
		if (request.totp_code && customer.totp_secret) {
			twoFactorValid = await verifyTOTPCode(customer.totp_secret, request.totp_code);

			if (twoFactorValid) {
				await logSecurityEvent(db, {
					customer_id: customer.customer_id,
					event_type: '2fa_verified',
					ip_address: ipAddress || undefined,
					user_agent: userAgent || undefined,
				});
			}
		}

		// Check backup code
		if (!twoFactorValid && request.backup_code && customer.backup_codes) {
			const backupCodeHashes = JSON.parse(customer.backup_codes);
			twoFactorValid = await verifyBackupCode(request.backup_code, backupCodeHashes);

			if (twoFactorValid) {
				// Remove used backup code
				const buffer = new TextEncoder().encode(request.backup_code);
				const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
				const hashArray = Array.from(new Uint8Array(hashBuffer));
				const usedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

				const remainingCodes = backupCodeHashes.filter((h: string) => h !== usedHash);

				await withDatabase(
					async () =>
						db.prepare('UPDATE customers SET backup_codes = ?, updated_at = ? WHERE customer_id = ?')
							.bind(JSON.stringify(remainingCodes), Math.floor(Date.now() / 1000), customer.customer_id)
							.run(),
					'removeUsedBackupCode'
				);

				await logSecurityEvent(db, {
					customer_id: customer.customer_id,
					event_type: 'backup_code_used',
					ip_address: ipAddress || undefined,
					user_agent: userAgent || undefined,
					metadata: { remaining_codes: remainingCodes.length },
				});
			}
		}

		// If 2FA is enabled but not provided or invalid
		if (!twoFactorValid) {
			if (!request.totp_code && !request.backup_code) {
				// First login step successful, need 2FA
				return {
					response: {
						success: false,
						requires_2fa: true,
						message: 'Please provide your 2FA code',
					},
				};
			} else {
				// 2FA code provided but invalid
				await logSecurityEvent(db, {
					customer_id: customer.customer_id,
					event_type: '2fa_failed',
					ip_address: ipAddress || undefined,
					user_agent: userAgent || undefined,
				});

				throw new AuthenticationError(ErrorCode.INVALID_API_KEY, 'Invalid 2FA code');
			}
		}
	}

	// Login successful - reset failed attempts and create session
	await withDatabase(
		async () =>
			db.prepare(
				'UPDATE customers SET failed_login_attempts = 0, account_locked_until = NULL, last_login_at = ?, updated_at = ? WHERE customer_id = ?'
			)
				.bind(Math.floor(Date.now() / 1000), Math.floor(Date.now() / 1000), customer.customer_id)
				.run(),
		'resetFailedAttempts'
	);

	const session = await createSession(db, customer.customer_id, ipAddress, userAgent, 24);

	await logSecurityEvent(db, {
		customer_id: customer.customer_id,
		event_type: 'login_success',
		ip_address: ipAddress || undefined,
		user_agent: userAgent || undefined,
	});

	await logSecurityEvent(db, {
		customer_id: customer.customer_id,
		event_type: 'session_created',
		ip_address: ipAddress || undefined,
		user_agent: userAgent || undefined,
		metadata: { session_id: session.session_id },
	});

	return {
		response: {
			success: true,
			session_id: session.session_id,
			message: 'Login successful',
		},
		sessionCookie: createSessionCookie(session.session_id, 24, true),
	};
}

// ==================== Logout ====================

export async function handleLogout(
	db: D1Database,
	sessionId: string,
	ipAddress: string | null
): Promise<{ success: boolean; cookie: string }> {
	const session = await getSession(db, sessionId);

	if (session) {
		await invalidateSession(db, sessionId);

		await logSecurityEvent(db, {
			customer_id: session.customer_id,
			event_type: 'session_invalidated',
			ip_address: ipAddress || undefined,
			metadata: { reason: 'logout' },
		});
	}

	return {
		success: true,
		cookie: createSessionDeletionCookie(),
	};
}

// ==================== Change Password ====================

export interface ChangePasswordRequest {
	current_password: string;
	new_password: string;
}

export async function handleChangePassword(
	db: D1Database,
	customerId: string,
	request: ChangePasswordRequest,
	ipAddress: string | null,
	userAgent: string | null
): Promise<{ success: boolean; message: string }> {
	// Validate new password strength
	const validation = validatePasswordStrength(request.new_password);
	if (!validation.valid) {
		throw new AppError(
			ErrorCode.INVALID_REQUEST,
			`Password requirements not met: ${validation.errors.join(', ')}`,
			400
		);
	}

	// Get current password hash
	const customer = await withDatabase(
		async () =>
			db.prepare('SELECT password_hash, password_salt FROM customers WHERE customer_id = ?')
				.bind(customerId)
				.first<{ password_hash: string; password_salt: string }>(),
		'getPasswordForChange'
	);

	if (!customer) {
		throw new AuthenticationError(ErrorCode.INVALID_API_KEY, 'Customer not found');
	}

	// Verify current password
	const currentPasswordValid = await verifyPassword(
		request.current_password,
		customer.password_hash,
		customer.password_salt
	);

	if (!currentPasswordValid) {
		await logSecurityEvent(db, {
			customer_id: customerId,
			event_type: 'password_changed',
			ip_address: ipAddress || undefined,
			user_agent: userAgent || undefined,
			metadata: { success: false, reason: 'invalid_current_password' },
		});

		throw new AuthenticationError(ErrorCode.INVALID_API_KEY, 'Current password is incorrect');
	}

	// Hash new password
	const { hash, salt } = await hashPassword(request.new_password);

	// Update password
	await withDatabase(
		async () =>
			db.prepare('UPDATE customers SET password_hash = ?, password_salt = ?, updated_at = ? WHERE customer_id = ?')
				.bind(hash, salt, Math.floor(Date.now() / 1000), customerId)
				.run(),
		'changePassword'
	);

	// Invalidate all sessions (force re-login)
	await invalidateAllCustomerSessions(db, customerId);

	await logSecurityEvent(db, {
		customer_id: customerId,
		event_type: 'password_changed',
		ip_address: ipAddress || undefined,
		user_agent: userAgent || undefined,
		metadata: { success: true },
	});

	return {
		success: true,
		message: 'Password changed successfully. Please log in again.',
	};
}

// ==================== 2FA Enrollment ====================

export interface Enable2FAResponse {
	success: boolean;
	secret: string;
	qr_uri: string;
	backup_codes: string[];
}

export async function handleEnable2FA(
	db: D1Database,
	customerId: string,
	email: string,
	ipAddress: string | null,
	userAgent: string | null
): Promise<Enable2FAResponse> {
	// Generate TOTP secret
	const secret = generateTOTPSecret();
	const qrUri = generateTOTPUri(secret, email, 'Insertabot');

	// Generate backup codes
	const backupCodes = await generateBackupCodes(8);
	const hashedBackupCodes = await hashBackupCodes(backupCodes);

	// Store secret and backup codes (but don't enable yet - wait for verification)
	await withDatabase(
		async () =>
			db.prepare('UPDATE customers SET totp_secret = ?, backup_codes = ?, updated_at = ? WHERE customer_id = ?')
				.bind(secret, JSON.stringify(hashedBackupCodes), Math.floor(Date.now() / 1000), customerId)
				.run(),
		'store2FASecret'
	);

	return {
		success: true,
		secret,
		qr_uri: qrUri,
		backup_codes: backupCodes,
	};
}

export interface Verify2FARequest {
	totp_code: string;
}

export async function handleVerify2FA(
	db: D1Database,
	customerId: string,
	request: Verify2FARequest,
	ipAddress: string | null,
	userAgent: string | null
): Promise<{ success: boolean; message: string }> {
	// Get TOTP secret
	const customer = await withDatabase(
		async () =>
			db.prepare('SELECT totp_secret, totp_enabled FROM customers WHERE customer_id = ?')
				.bind(customerId)
				.first<{ totp_secret: string | null; totp_enabled: number }>(),
		'get2FASecret'
	);

	if (!customer || !customer.totp_secret) {
		throw new AppError(ErrorCode.INVALID_REQUEST, '2FA not initialized', 400);
	}

	// Verify the code
	const valid = await verifyTOTPCode(customer.totp_secret, request.totp_code);

	if (!valid) {
		await logSecurityEvent(db, {
			customer_id: customerId,
			event_type: '2fa_failed',
			ip_address: ipAddress || undefined,
			user_agent: userAgent || undefined,
			metadata: { context: 'enrollment_verification' },
		});

		throw new AuthenticationError(ErrorCode.INVALID_API_KEY, 'Invalid 2FA code');
	}

	// Enable 2FA
	await withDatabase(
		async () =>
			db.prepare('UPDATE customers SET totp_enabled = 1, updated_at = ? WHERE customer_id = ?')
				.bind(Math.floor(Date.now() / 1000), customerId)
				.run(),
		'enable2FA'
	);

	await logSecurityEvent(db, {
		customer_id: customerId,
		event_type: '2fa_enabled',
		ip_address: ipAddress || undefined,
		user_agent: userAgent || undefined,
	});

	return {
		success: true,
		message: '2FA enabled successfully',
	};
}

export async function handleDisable2FA(
	db: D1Database,
	customerId: string,
	password: string,
	ipAddress: string | null,
	userAgent: string | null
): Promise<{ success: boolean; message: string }> {
	// Verify password before disabling 2FA
	const customer = await withDatabase(
		async () =>
			db.prepare('SELECT password_hash, password_salt FROM customers WHERE customer_id = ?')
				.bind(customerId)
				.first<{ password_hash: string; password_salt: string }>(),
		'getPasswordForDisable2FA'
	);

	if (!customer) {
		throw new AuthenticationError(ErrorCode.INVALID_API_KEY, 'Customer not found');
	}

	const passwordValid = await verifyPassword(password, customer.password_hash, customer.password_salt);

	if (!passwordValid) {
		throw new AuthenticationError(ErrorCode.INVALID_API_KEY, 'Invalid password');
	}

	// Disable 2FA
	await withDatabase(
		async () =>
			db.prepare('UPDATE customers SET totp_enabled = 0, totp_secret = NULL, backup_codes = NULL, updated_at = ? WHERE customer_id = ?')
				.bind(Math.floor(Date.now() / 1000), customerId)
				.run(),
		'disable2FA'
	);

	await logSecurityEvent(db, {
		customer_id: customerId,
		event_type: '2fa_disabled',
		ip_address: ipAddress || undefined,
		user_agent: userAgent || undefined,
	});

	return {
		success: true,
		message: '2FA disabled successfully',
	};
}

// ==================== Password Reset ====================

export async function handlePasswordResetRequest(
	db: D1Database,
	email: string,
	ipAddress: string | null
): Promise<{ success: boolean; message: string; reset_token?: string }> {
	const customer = await withDatabase(
		async () =>
			db.prepare('SELECT customer_id FROM customers WHERE email = ?')
				.bind(email)
				.first<{ customer_id: string }>(),
		'getCustomerForReset'
	);

	// Always return success to prevent email enumeration
	if (!customer) {
		return {
			success: true,
			message: 'If an account exists with this email, a password reset link has been sent.',
		};
	}

	// Generate reset token
	const resetToken = generateResetToken();
	const expiresAt = Math.floor(Date.now() / 1000) + 3600; // 1 hour

	await withDatabase(
		async () =>
			db.prepare('UPDATE customers SET password_reset_token = ?, password_reset_expires = ?, updated_at = ? WHERE customer_id = ?')
				.bind(resetToken, expiresAt, Math.floor(Date.now() / 1000), customer.customer_id)
				.run(),
		'setResetToken'
	);

	await logSecurityEvent(db, {
		customer_id: customer.customer_id,
		event_type: 'password_reset_requested',
		ip_address: ipAddress || undefined,
	});

	// In production, send email with reset link
	// For now, return the token for testing
	return {
		success: true,
		message: 'Password reset link sent',
		reset_token: resetToken, // Remove this in production
	};
}

export interface PasswordResetRequest {
	token: string;
	new_password: string;
}

export async function handlePasswordReset(
	db: D1Database,
	request: PasswordResetRequest,
	ipAddress: string | null
): Promise<{ success: boolean; message: string }> {
	// Validate new password
	const validation = validatePasswordStrength(request.new_password);
	if (!validation.valid) {
		throw new AppError(
			ErrorCode.INVALID_REQUEST,
			`Password requirements not met: ${validation.errors.join(', ')}`,
			400
		);
	}

	// Find customer with valid reset token
	const customer = await withDatabase(
		async () =>
			db.prepare('SELECT customer_id, password_reset_expires FROM customers WHERE password_reset_token = ?')
				.bind(request.token)
				.first<{ customer_id: string; password_reset_expires: number }>(),
		'getCustomerByResetToken'
	);

	if (!customer) {
		throw new AppError(ErrorCode.INVALID_REQUEST, 'Invalid or expired reset token', 400);
	}

	// Check if token is expired
	const now = Math.floor(Date.now() / 1000);
	if (customer.password_reset_expires < now) {
		throw new AppError(ErrorCode.INVALID_REQUEST, 'Reset token has expired', 400);
	}

	// Hash new password
	const { hash, salt } = await hashPassword(request.new_password);

	// Update password and clear reset token
	await withDatabase(
		async () =>
			db.prepare(
				'UPDATE customers SET password_hash = ?, password_salt = ?, password_reset_token = NULL, password_reset_expires = NULL, failed_login_attempts = 0, account_locked_until = NULL, updated_at = ? WHERE customer_id = ?'
			)
				.bind(hash, salt, now, customer.customer_id)
				.run(),
		'resetPassword'
	);

	// Invalidate all sessions
	await invalidateAllCustomerSessions(db, customer.customer_id);

	await logSecurityEvent(db, {
		customer_id: customer.customer_id,
		event_type: 'password_reset_completed',
		ip_address: ipAddress || undefined,
	});

	return {
		success: true,
		message: 'Password reset successfully. Please log in with your new password.',
	};
}
