/**
 * Customer Management Functions
 */

import { generateApiKey } from './utils';

export interface Customer {
	customer_id: string;
	email: string;
	company_name: string;
	api_key: string;
	plan_type: string;
	status: string;
}

export async function createCustomer(
	db: D1Database,
	email: string,
	companyName: string
): Promise<Customer | null> {
	try {
		const customerId = 'cust_' + generateApiKey().slice(6, 22);
		const apiKey = generateApiKey();
		const now = Math.floor(Date.now() / 1000);

		// Free tier: 5 messages/hour, 20 messages/day
		await db.prepare(`
			INSERT INTO customers (customer_id, email, company_name, api_key, plan_type, status, rate_limit_per_hour, rate_limit_per_day, created_at, updated_at)
			VALUES (?, ?, ?, ?, 'free', 'active', 5, 20, ?, ?)
		`).bind(customerId, email, companyName, apiKey, now, now).run();

		await db.prepare(`
			INSERT INTO widget_configs (customer_id, created_at, updated_at)
			VALUES (?, ?, ?)
		`).bind(customerId, now, now).run();

		return {
			customer_id: customerId,
			email,
			company_name: companyName,
			api_key: apiKey,
			plan_type: 'free',
			status: 'active'
		};
	} catch (error) {
		console.error('Error creating customer:', error);
		return null;
	}
}

export async function getCustomerByEmail(db: D1Database, email: string): Promise<Customer | null> {
	return await db.prepare('SELECT * FROM customers WHERE email = ?').bind(email).first<Customer>();
}

export async function updateWidgetConfig(
	db: D1Database,
	customerId: string,
	config: {
		primary_color?: string;
		bot_name?: string;
		bot_avatar_url?: string;
		greeting_message?: string;
		system_prompt?: string;
	}
): Promise<boolean> {
	try {
		const updates: string[] = [];
		const values: any[] = [];

		if (config.primary_color) {
			updates.push('primary_color = ?');
			values.push(config.primary_color);
		}
		if (config.bot_name) {
			updates.push('bot_name = ?');
			values.push(config.bot_name);
		}
		if (config.bot_avatar_url !== undefined) {
			updates.push('bot_avatar_url = ?');
			values.push(config.bot_avatar_url || null);
		}
		if (config.greeting_message) {
			updates.push('greeting_message = ?');
			values.push(config.greeting_message);
		}
		if (config.system_prompt) {
			updates.push('system_prompt = ?');
			values.push(config.system_prompt);
		}

		if (updates.length === 0) return false;

		updates.push('updated_at = ?');
		values.push(Math.floor(Date.now() / 1000));
		values.push(customerId);

		await db.prepare(`
			UPDATE widget_configs SET ${updates.join(', ')} WHERE customer_id = ?
		`).bind(...values).run();

		return true;
	} catch (error) {
		console.error('Error updating widget config:', error);
		return false;
	}
}
