/**
 * Stripe Integration Helper
 * Handles checkout, webhooks, and subscription management
 */

import { withRetry, ExternalServiceError, withTimeout } from './errors';

export interface StripeEnv {
	STRIPE_SECRET_KEY: string;
	STRIPE_PUBLISHABLE_KEY: string;
	STRIPE_WEBHOOK_SECRET: string;
}

/**
 * Create a checkout session for upgrading to Pro plan
 */
export async function createCheckoutSession(
	stripeSecretKey: string,
	customerId: string,
	email: string,
	priceId: string,
	baseUrl: string
): Promise<{ sessionId: string; url: string } | null> {
	try {
		const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${stripeSecretKey}`,
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: new URLSearchParams({
				'payment_method_types[]': 'card',
				'line_items[0][price]': priceId,
				'line_items[0][quantity]': '1',
				'mode': 'subscription',
				'customer_email': email,
				'client_reference_id': customerId,
				'success_url': `${baseUrl}?session_id={CHECKOUT_SESSION_ID}`,
				'cancel_url': `${baseUrl}`,
				'billing_address_collection': 'auto',
			}).toString(),
		});

		if (!response.ok) {
			console.error('Stripe API error:', await response.text());
			return null;
		}

		const session = (await response.json()) as any;
		return {
			sessionId: session.id,
			url: session.url,
		};
	} catch (error) {
		console.error('Error creating checkout session:', error);
		return null;
	}
}

/**
 * Verify Stripe webhook signature
 * Uses HMAC-SHA256 to verify the request came from Stripe
 */
export async function verifyWebhookSignature(
	body: string,
	signature: string,
	webhookSecret: string
): Promise<boolean> {
	try {
		// Stripe webhook signature format: t=timestamp,v1=hash
		const parts = signature.split(',');
		const timestamp = parts[0].split('=')[1];
		const hash = parts[1].split('=')[1];

		// Reconstruct signed content
		const signedContent = `${timestamp}.${body}`;

		// Create HMAC-SHA256 hash
		const encoder = new TextEncoder();
		const key = await crypto.subtle.importKey(
			'raw',
			encoder.encode(webhookSecret),
			{ name: 'HMAC', hash: 'SHA-256' },
			false,
			['sign']
		);

		const signature_bytes = await crypto.subtle.sign(
			'HMAC',
			key,
			encoder.encode(signedContent)
		);

		// Convert to hex string
		const hashArray = Array.from(new Uint8Array(signature_bytes));
		const computed = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

		return computed === hash;
	} catch (error) {
		console.error('Error verifying webhook signature:', error);
		return false;
	}
}

/**
 * Process Stripe webhook events
 */
export async function processWebhookEvent(
	event: any,
	db: D1Database
): Promise<boolean> {
	try {
		const type = event.type;
		const data = event.data.object;

		switch (type) {
			case 'customer.subscription.created':
			case 'customer.subscription.updated':
				return await handleSubscriptionUpdate(db, data);

			case 'customer.subscription.deleted':
				return await handleSubscriptionCancelled(db, data);

			case 'payment_intent.succeeded':
				console.log(`Payment succeeded for customer ${data.customer}`);
				return true;

			case 'payment_intent.payment_failed':
				console.error(`Payment failed for customer ${data.customer}`);
				return true;

			default:
				console.log(`Unhandled event type: ${type}`);
				return true;
		}
	} catch (error) {
		console.error('Error processing webhook event:', error);
		return false;
	}
}

/**
 * Handle subscription creation/update
 */
async function handleSubscriptionUpdate(db: D1Database, subscription: any): Promise<boolean> {
	try {
		const customerId = subscription.metadata?.customer_id || subscription.client_reference_id;
		const stripeCustomerId = subscription.customer;
		const status = subscription.status; // active, past_due, unpaid, etc.

		if (!customerId) {
			console.error('No customer_id in subscription metadata');
			return false;
		}

		// Update customer subscription status
		const result = await db
			.prepare(
				`UPDATE customers
				 SET stripe_customer_id = ?,
					 subscription_id = ?,
					 subscription_status = ?,
					 plan_type = ?,
					 updated_at = ?
				 WHERE customer_id = ?`
			)
			.bind(
				stripeCustomerId,
				subscription.id,
				status,
				status === 'active' ? 'pro' : 'free',
				Math.floor(Date.now() / 1000),
				customerId
			)
			.run();

		console.log(`Updated subscription for customer ${customerId}:`, result);
		return true;
	} catch (error) {
		console.error('Error updating subscription:', error);
		return false;
	}
}

/**
 * Handle subscription cancellation
 */
async function handleSubscriptionCancelled(db: D1Database, subscription: any): Promise<boolean> {
	try {
		const customerId = subscription.metadata?.customer_id || subscription.client_reference_id;

		if (!customerId) {
			console.error('No customer_id in subscription metadata');
			return false;
		}

		// Revert to free plan
		const result = await db
			.prepare(
				`UPDATE customers
				 SET subscription_id = NULL,
					 subscription_status = 'cancelled',
					 plan_type = 'free',
					 updated_at = ?
				 WHERE customer_id = ?`
			)
			.bind(Math.floor(Date.now() / 1000), customerId)
			.run();

		console.log(`Cancelled subscription for customer ${customerId}:`, result);
		return true;
	} catch (error) {
		console.error('Error cancelling subscription:', error);
		return false;
	}
}

/**
 * Get subscription status for a customer
 */
export async function getSubscriptionStatus(
	db: D1Database,
	customerId: string
): Promise<{ status: string; plan: string } | null> {
	try {
		const result = await db
			.prepare(`SELECT subscription_status, plan_type FROM customers WHERE customer_id = ?`)
			.bind(customerId)
			.first<{ subscription_status: string; plan_type: string }>();

		if (!result) {
			return null;
		}

		return {
			status: result.subscription_status || 'none',
			plan: result.plan_type || 'free',
		};
	} catch (error) {
		console.error('Error getting subscription status:', error);
		return null;
	}
}
