/**
 * Security Audit Logging
 * Tracks security-related events for compliance and incident response
 */

import { withDatabase } from './errors';

export type SecurityEventType =
	| 'login_success'
	| 'login_failed'
	| 'login_locked'
	| 'password_created'
	| 'password_changed'
	| 'password_reset_requested'
	| 'password_reset_completed'
	| '2fa_enabled'
	| '2fa_disabled'
	| '2fa_verified'
	| '2fa_failed'
	| 'backup_code_used'
	| 'session_created'
	| 'session_invalidated'
	| 'account_created'
	| 'account_locked'
	| 'account_unlocked';

export interface SecurityAuditEvent {
	customer_id: string;
	event_type: SecurityEventType;
	ip_address?: string;
	user_agent?: string;
	metadata?: Record<string, any>;
}

/**
 * Log a security event to the audit log
 */
export async function logSecurityEvent(
	db: D1Database,
	event: SecurityAuditEvent
): Promise<void> {
	return withDatabase(async () => {
		const timestamp = Math.floor(Date.now() / 1000);
		const metadata = event.metadata ? JSON.stringify(event.metadata) : null;

		await db
			.prepare(
				`INSERT INTO security_audit_log (customer_id, event_type, timestamp, ip_address, user_agent, metadata)
				 VALUES (?, ?, ?, ?, ?, ?)`
			)
			.bind(
				event.customer_id,
				event.event_type,
				timestamp,
				event.ip_address || null,
				event.user_agent || null,
				metadata
			)
			.run();
	}, 'logSecurityEvent');
}

/**
 * Get recent security events for a customer
 */
export async function getSecurityEvents(
	db: D1Database,
	customerId: string,
	limit: number = 50
): Promise<Array<{
	event_type: SecurityEventType;
	timestamp: number;
	ip_address: string | null;
	user_agent: string | null;
	metadata: string | null;
}>> {
	return withDatabase(async () => {
		const result = await db
			.prepare(
				`SELECT event_type, timestamp, ip_address, user_agent, metadata
				 FROM security_audit_log
				 WHERE customer_id = ?
				 ORDER BY timestamp DESC
				 LIMIT ?`
			)
			.bind(customerId, limit)
			.all();

		return result.results || [];
	}, 'getSecurityEvents');
}

/**
 * Get failed login attempts in the last hour
 */
export async function getRecentFailedLogins(
	db: D1Database,
	customerId: string
): Promise<number> {
	return withDatabase(async () => {
		const oneHourAgo = Math.floor(Date.now() / 1000) - 3600;

		const result = await db
			.prepare(
				`SELECT COUNT(*) as count
				 FROM security_audit_log
				 WHERE customer_id = ? AND event_type = 'login_failed' AND timestamp > ?`
			)
			.bind(customerId, oneHourAgo)
			.first<{ count: number }>();

		return result?.count || 0;
	}, 'getRecentFailedLogins');
}

/**
 * Clean up old audit logs (keep last 90 days)
 */
export async function cleanupOldAuditLogs(db: D1Database, daysToKeep: number = 90): Promise<number> {
	return withDatabase(async () => {
		const cutoffTime = Math.floor(Date.now() / 1000) - daysToKeep * 86400;

		const result = await db
			.prepare(`DELETE FROM security_audit_log WHERE timestamp < ?`)
			.bind(cutoffTime)
			.run();

		return result.meta.changes || 0;
	}, 'cleanupOldAuditLogs');
}
