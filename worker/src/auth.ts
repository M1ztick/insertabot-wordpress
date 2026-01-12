/**
 * Authentication & Security Utilities
 * Implements password hashing, 2FA/TOTP, and session management
 */

import { AppError, ErrorCode, AuthenticationError } from './errors';

// ==================== Password Hashing ====================

/**
 * Hash a password using PBKDF2 with Web Crypto API
 * Uses 100,000 iterations for strong security
 */
export async function hashPassword(password: string): Promise<{ hash: string; salt: string }> {
	// Generate random salt
	const salt = crypto.randomUUID();
	const saltBuffer = new TextEncoder().encode(salt);
	const passwordBuffer = new TextEncoder().encode(password);

	// Import password as key material
	const keyMaterial = await crypto.subtle.importKey(
		'raw',
		passwordBuffer,
		{ name: 'PBKDF2' },
		false,
		['deriveBits']
	);

	// Derive key using PBKDF2
	const hashBuffer = await crypto.subtle.deriveBits(
		{
			name: 'PBKDF2',
			salt: saltBuffer,
			iterations: 100000,
			hash: 'SHA-256',
		},
		keyMaterial,
		256 // 256 bits = 32 bytes
	);

	// Convert to hex string
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

	return { hash, salt };
}

/**
 * Verify a password against a stored hash
 */
export async function verifyPassword(
	password: string,
	storedHash: string,
	storedSalt: string
): Promise<boolean> {
	const saltBuffer = new TextEncoder().encode(storedSalt);
	const passwordBuffer = new TextEncoder().encode(password);

	const keyMaterial = await crypto.subtle.importKey(
		'raw',
		passwordBuffer,
		{ name: 'PBKDF2' },
		false,
		['deriveBits']
	);

	const hashBuffer = await crypto.subtle.deriveBits(
		{
			name: 'PBKDF2',
			salt: saltBuffer,
			iterations: 100000,
			hash: 'SHA-256',
		},
		keyMaterial,
		256
	);

	const hashArray = Array.from(new Uint8Array(hashBuffer));
	const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

	return hash === storedHash;
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
	const errors: string[] = [];

	if (password.length < 12) {
		errors.push('Password must be at least 12 characters long');
	}

	if (!/[a-z]/.test(password)) {
		errors.push('Password must contain at least one lowercase letter');
	}

	if (!/[A-Z]/.test(password)) {
		errors.push('Password must contain at least one uppercase letter');
	}

	if (!/[0-9]/.test(password)) {
		errors.push('Password must contain at least one number');
	}

	if (!/[^a-zA-Z0-9]/.test(password)) {
		errors.push('Password must contain at least one special character');
	}

	// Check for common patterns
	const commonPasswords = ['password', '12345678', 'qwerty', 'admin', 'letmein'];
	if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
		errors.push('Password contains common patterns');
	}

	return {
		valid: errors.length === 0,
		errors,
	};
}

// ==================== 2FA / TOTP ====================

/**
 * Generate a random TOTP secret (base32 encoded)
 */
export function generateTOTPSecret(): string {
	const buffer = new Uint8Array(20); // 160 bits
	crypto.getRandomValues(buffer);
	return base32Encode(buffer);
}

/**
 * Base32 encoding for TOTP secrets (RFC 4648)
 */
function base32Encode(buffer: Uint8Array): string {
	const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
	let bits = 0;
	let value = 0;
	let output = '';

	for (let i = 0; i < buffer.length; i++) {
		value = (value << 8) | buffer[i];
		bits += 8;

		while (bits >= 5) {
			output += alphabet[(value >>> (bits - 5)) & 31];
			bits -= 5;
		}
	}

	if (bits > 0) {
		output += alphabet[(value << (5 - bits)) & 31];
	}

	return output;
}

/**
 * Base32 decoding for TOTP secrets
 */
function base32Decode(input: string): Uint8Array {
	const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
	const cleanInput = input.toUpperCase().replace(/=+$/, '');
	const output: number[] = [];
	let bits = 0;
	let value = 0;

	for (let i = 0; i < cleanInput.length; i++) {
		const idx = alphabet.indexOf(cleanInput[i]);
		if (idx === -1) throw new Error('Invalid base32 character');

		value = (value << 5) | idx;
		bits += 5;

		if (bits >= 8) {
			output.push((value >>> (bits - 8)) & 255);
			bits -= 8;
		}
	}

	return new Uint8Array(output);
}

/**
 * Generate TOTP code for a given time
 */
async function generateTOTPCode(secret: string, timeStep: number = 30): Promise<string> {
	const secretBytes = base32Decode(secret);
	const time = Math.floor(Date.now() / 1000 / timeStep);
	const timeBuffer = new ArrayBuffer(8);
	const timeView = new DataView(timeBuffer);
	timeView.setUint32(4, time, false); // Big-endian

	// Import secret as HMAC key
	const key = await crypto.subtle.importKey(
		'raw',
		secretBytes,
		{ name: 'HMAC', hash: 'SHA-1' },
		false,
		['sign']
	);

	// Generate HMAC
	const hmac = await crypto.subtle.sign('HMAC', key, timeBuffer);
	const hmacArray = new Uint8Array(hmac);

	// Dynamic truncation (RFC 6238)
	const offset = hmacArray[hmacArray.length - 1] & 0x0f;
	const code =
		((hmacArray[offset] & 0x7f) << 24) |
		((hmacArray[offset + 1] & 0xff) << 16) |
		((hmacArray[offset + 2] & 0xff) << 8) |
		(hmacArray[offset + 3] & 0xff);

	// Return 6-digit code
	return (code % 1000000).toString().padStart(6, '0');
}

/**
 * Verify a TOTP code with time window tolerance
 */
export async function verifyTOTPCode(
	secret: string,
	code: string,
	windowSize: number = 1
): Promise<boolean> {
	if (!secret || !code) return false;
	if (code.length !== 6 || !/^\d{6}$/.test(code)) return false;

	try {
		// Check current time and adjacent time windows
		for (let i = -windowSize; i <= windowSize; i++) {
			const timeStep = 30;
			const time = Math.floor(Date.now() / 1000 / timeStep) + i;
			const secretBytes = base32Decode(secret);

			const timeBuffer = new ArrayBuffer(8);
			const timeView = new DataView(timeBuffer);
			timeView.setUint32(4, time, false);

			const key = await crypto.subtle.importKey(
				'raw',
				secretBytes,
				{ name: 'HMAC', hash: 'SHA-1' },
				false,
				['sign']
			);

			const hmac = await crypto.subtle.sign('HMAC', key, timeBuffer);
			const hmacArray = new Uint8Array(hmac);

			const offset = hmacArray[hmacArray.length - 1] & 0x0f;
			const codeInt =
				((hmacArray[offset] & 0x7f) << 24) |
				((hmacArray[offset + 1] & 0xff) << 16) |
				((hmacArray[offset + 2] & 0xff) << 8) |
				(hmacArray[offset + 3] & 0xff);

			const generatedCode = (codeInt % 1000000).toString().padStart(6, '0');

			if (generatedCode === code) {
				return true;
			}
		}

		return false;
	} catch (error) {
		console.error('TOTP verification error:', error);
		return false;
	}
}

/**
 * Generate a TOTP provisioning URI for QR code generation
 */
export function generateTOTPUri(secret: string, email: string, issuer: string = 'Insertabot'): string {
	const encodedIssuer = encodeURIComponent(issuer);
	const encodedEmail = encodeURIComponent(email);
	return `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
}

// ==================== Backup Codes ====================

/**
 * Generate backup codes for account recovery
 */
export async function generateBackupCodes(count: number = 8): Promise<string[]> {
	const codes: string[] = [];

	for (let i = 0; i < count; i++) {
		const buffer = new Uint8Array(4);
		crypto.getRandomValues(buffer);

		// Generate 8-character alphanumeric code
		const code = Array.from(buffer)
			.map(byte => byte.toString(16).padStart(2, '0'))
			.join('')
			.toUpperCase()
			.substring(0, 8);

		codes.push(code);
	}

	return codes;
}

/**
 * Hash backup codes for storage
 */
export async function hashBackupCodes(codes: string[]): Promise<string[]> {
	const hashed: string[] = [];

	for (const code of codes) {
		const buffer = new TextEncoder().encode(code);
		const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
		const hashArray = Array.from(new Uint8Array(hashBuffer));
		const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
		hashed.push(hash);
	}

	return hashed;
}

/**
 * Verify a backup code against stored hashes
 */
export async function verifyBackupCode(code: string, storedHashes: string[]): Promise<boolean> {
	const buffer = new TextEncoder().encode(code);
	const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

	return storedHashes.includes(hash);
}

// ==================== Session Management ====================

/**
 * Generate a secure session ID
 */
export function generateSessionId(): string {
	return crypto.randomUUID() + '-' + Date.now().toString(36);
}

/**
 * Generate a password reset token
 */
export function generateResetToken(): string {
	const buffer = new Uint8Array(32);
	crypto.getRandomValues(buffer);
	return Array.from(buffer)
		.map(b => b.toString(16).padStart(2, '0'))
		.join('');
}

// ==================== Rate Limiting for Login Attempts ====================

export interface LoginAttemptResult {
	allowed: boolean;
	attemptsRemaining?: number;
	lockedUntil?: Date;
}

/**
 * Check if login attempt is allowed based on failed attempts
 */
export function checkLoginAttempts(
	failedAttempts: number,
	accountLockedUntil: number | null
): LoginAttemptResult {
	const now = Date.now() / 1000;

	// Check if account is currently locked
	if (accountLockedUntil && accountLockedUntil > now) {
		return {
			allowed: false,
			lockedUntil: new Date(accountLockedUntil * 1000),
		};
	}

	// Lock account after 5 failed attempts
	const maxAttempts = 5;
	if (failedAttempts >= maxAttempts) {
		return {
			allowed: false,
			lockedUntil: new Date((now + 900) * 1000), // Lock for 15 minutes
		};
	}

	return {
		allowed: true,
		attemptsRemaining: maxAttempts - failedAttempts,
	};
}

/**
 * Calculate new lock time after failed login
 */
export function calculateLockTime(failedAttempts: number): number {
	const now = Math.floor(Date.now() / 1000);

	if (failedAttempts >= 5) {
		// Lock for 15 minutes after 5 failed attempts
		return now + 900;
	}

	return 0;
}
