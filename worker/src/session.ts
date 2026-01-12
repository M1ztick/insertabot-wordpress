/**
 * Session Management
 * Handles secure session creation, validation, and cleanup
 */

import { generateSessionId } from './auth';
import { withDatabase } from './errors';

export interface Session {
	session_id: string;
	customer_id: string;
	created_at: number;
	expires_at: number;
	last_accessed_at: number;
	ip_address: string | null;
	user_agent: string | null;
	is_valid: number;
}

/**
 * Create a new session for a customer
 */
export async function createSession(
	db: D1Database,
	customerId: string,
	ipAddress: string | null,
	userAgent: string | null,
	expiryHours: number = 24
): Promise<Session> {
	return withDatabase(async () => {
		const sessionId = generateSessionId();
		const now = Math.floor(Date.now() / 1000);
		const expiresAt = now + expiryHours * 3600;

		await db
			.prepare(
				`INSERT INTO sessions (session_id, customer_id, created_at, expires_at, last_accessed_at, ip_address, user_agent, is_valid)
				 VALUES (?, ?, ?, ?, ?, ?, ?, 1)`
			)
			.bind(sessionId, customerId, now, expiresAt, now, ipAddress, userAgent)
			.run();

		return {
			session_id: sessionId,
			customer_id: customerId,
			created_at: now,
			expires_at: expiresAt,
			last_accessed_at: now,
			ip_address: ipAddress,
			user_agent: userAgent,
			is_valid: 1,
		};
	}, 'createSession');
}

/**
 * Validate and retrieve a session
 */
export async function getSession(db: D1Database, sessionId: string): Promise<Session | null> {
	return withDatabase(async () => {
		const session = await db
			.prepare(
				`SELECT * FROM sessions
				 WHERE session_id = ? AND is_valid = 1`
			)
			.bind(sessionId)
			.first<Session>();

		if (!session) {
			return null;
		}

		const now = Math.floor(Date.now() / 1000);

		// Check if session has expired
		if (session.expires_at < now) {
			await invalidateSession(db, sessionId);
			return null;
		}

		// Update last accessed time
		await db
			.prepare(`UPDATE sessions SET last_accessed_at = ? WHERE session_id = ?`)
			.bind(now, sessionId)
			.run();

		return session;
	}, 'getSession');
}

/**
 * Invalidate a session (logout)
 */
export async function invalidateSession(db: D1Database, sessionId: string): Promise<void> {
	return withDatabase(async () => {
		await db
			.prepare(`UPDATE sessions SET is_valid = 0 WHERE session_id = ?`)
			.bind(sessionId)
			.run();
	}, 'invalidateSession');
}

/**
 * Invalidate all sessions for a customer (useful for password changes)
 */
export async function invalidateAllCustomerSessions(
	db: D1Database,
	customerId: string
): Promise<void> {
	return withDatabase(async () => {
		await db
			.prepare(`UPDATE sessions SET is_valid = 0 WHERE customer_id = ?`)
			.bind(customerId)
			.run();
	}, 'invalidateAllCustomerSessions');
}

/**
 * Clean up expired sessions (should be run periodically)
 */
export async function cleanupExpiredSessions(db: D1Database): Promise<number> {
	return withDatabase(async () => {
		const now = Math.floor(Date.now() / 1000);
		const result = await db
			.prepare(`DELETE FROM sessions WHERE expires_at < ? OR is_valid = 0`)
			.bind(now)
			.run();

		return result.meta.changes || 0;
	}, 'cleanupExpiredSessions');
}

/**
 * Get all active sessions for a customer
 */
export async function getCustomerSessions(db: D1Database, customerId: string): Promise<Session[]> {
	return withDatabase(async () => {
		const now = Math.floor(Date.now() / 1000);
		const result = await db
			.prepare(
				`SELECT * FROM sessions
				 WHERE customer_id = ? AND is_valid = 1 AND expires_at > ?
				 ORDER BY last_accessed_at DESC`
			)
			.bind(customerId, now)
			.all<Session>();

		return result.results || [];
	}, 'getCustomerSessions');
}

/**
 * Extract session ID from request cookies or headers
 */
export function getSessionIdFromRequest(request: Request): string | null {
	// Check Authorization header first
	const authHeader = request.headers.get('Authorization');
	if (authHeader?.startsWith('Session ')) {
		return authHeader.slice(8);
	}

	// Check cookies
	const cookieHeader = request.headers.get('Cookie');
	if (!cookieHeader) return null;

	const cookies = cookieHeader.split(';').map(c => c.trim());
	for (const cookie of cookies) {
		const [name, value] = cookie.split('=');
		if (name === 'session_id') {
			return value;
		}
	}

	return null;
}

/**
 * Create session cookie header value
 */
export function createSessionCookie(
	sessionId: string,
	expiryHours: number = 24,
	secure: boolean = true
): string {
	const maxAge = expiryHours * 3600;
	const secureFlag = secure ? 'Secure; ' : '';

	return `session_id=${sessionId}; HttpOnly; ${secureFlag}SameSite=Strict; Max-Age=${maxAge}; Path=/`;
}

/**
 * Create session deletion cookie (for logout)
 */
export function createSessionDeletionCookie(): string {
	return 'session_id=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/';
}
