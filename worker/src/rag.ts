/**
 * RAG (Retrieval-Augmented Generation) Implementation
 * Uses Cloudflare Vectorize for semantic search
 */

import { Env } from './index';

export interface EmbeddingResult {
	id: string;
	content: string;
	score: number;
	metadata?: Record<string, any>;
}

/**
 * Generate embeddings using Cloudflare Workers AI
 */
export async function generateEmbedding(env: Env, text: string): Promise<number[]> {
	try {
		// Use Cloudflare Workers AI to generate embeddings
		// @ts-ignore - AI binding types
		const response = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
			text: [text],
		});

		return response.data[0];
	} catch (error) {
		console.error('Error generating embedding:', error);
		throw new Error('Failed to generate embedding');
	}
}

/**
 * Store document embedding in Vectorize
 */
export async function storeEmbedding(
	env: Env,
	customerId: string,
	documentId: string,
	content: string,
	metadata?: Record<string, any>
): Promise<void> {
	try {
		const embedding = await generateEmbedding(env, content);

		await env.VECTORIZE.upsert([
			{
				id: `${customerId}:${documentId}`,
				values: embedding,
				metadata: {
					customer_id: customerId,
					document_id: documentId,
					content: content.substring(0, 500), // Store preview
					...metadata,
				},
			},
		]);

		console.log(`Stored embedding for document ${documentId}`);
	} catch (error) {
		console.error('Error storing embedding:', error);
		throw new Error('Failed to store embedding');
	}
}

/**
 * Search for relevant documents using semantic search
 */
export async function searchRelevantDocuments(
	env: Env,
	customerId: string,
	query: string,
	topK: number = 3
): Promise<EmbeddingResult[]> {
	try {
		const queryEmbedding = await generateEmbedding(env, query);

		const results = await env.VECTORIZE.query(queryEmbedding, {
			topK,
			filter: { customer_id: customerId },
			returnMetadata: true,
		});

		return results.matches.map((match) => ({
			id: match.id,
			content: typeof match.metadata?.content === 'string' ? match.metadata.content : '',
			score: match.score,
			metadata: match.metadata,
		}));
	} catch (error) {
		console.error('Error searching documents:', error);
		return [];
	}
}

/**
 * Get relevant context from knowledge base for RAG
 */
export async function getRelevantContext(
	env: Env,
	db: D1Database,
	customerId: string,
	query: string
): Promise<string[]> {
	try {
		// Search for relevant embeddings
		const embeddings = await searchRelevantDocuments(env, customerId, query, 3);

		if (embeddings.length === 0) {
			return [];
		}

		// Fetch full content from database
		const documentIds = embeddings.map((e) => e.metadata?.document_id).filter(Boolean);

		if (documentIds.length === 0) {
			return embeddings.map((e) => e.content);
		}

		const placeholders = documentIds.map(() => '?').join(',');
		const query_result = await db
			.prepare(
				`SELECT id, content, title, source_url
				 FROM knowledge_base
				 WHERE customer_id = ? AND id IN (${placeholders})`
			)
			.bind(customerId, ...documentIds)
			.all();

		// Format context entries
		const contextEntries = query_result.results.map((row: any) => {
			const parts: string[] = [];

			if (row.title) {
				parts.push(`Title: ${row.title}`);
			}

			if (row.source_url) {
				parts.push(`Source: ${row.source_url}`);
			}

			parts.push(row.content);

			return parts.join('\n');
		});

		return contextEntries;
	} catch (error) {
		console.error('Error getting relevant context:', error);
		return [];
	}
}

/**
 * Batch upload documents to knowledge base
 */
export async function uploadDocuments(
	env: Env,
	db: D1Database,
	customerId: string,
	documents: Array<{
		title?: string;
		content: string;
		source_type: string;
		source_url?: string;
		metadata?: Record<string, any>;
	}>
): Promise<number> {
	let successCount = 0;

	for (const doc of documents) {
		try {
			// Insert into database
			const result = await db
				.prepare(
					`INSERT INTO knowledge_base
					 (customer_id, content, source_type, source_url, title, metadata, created_at, updated_at)
					 VALUES (?, ?, ?, ?, ?, ?, ?, ?)
					 RETURNING id`
				)
				.bind(
					customerId,
					doc.content,
					doc.source_type,
					doc.source_url || null,
					doc.title || null,
					JSON.stringify(doc.metadata || {}),
					Math.floor(Date.now() / 1000),
					Math.floor(Date.now() / 1000)
				)
				.first<{ id: number }>();

			if (!result) {
				console.error('Failed to insert document');
				continue;
			}

			// Generate and store embedding
			await storeEmbedding(
				env,
				customerId,
				result.id.toString(),
				doc.content,
				{
					title: doc.title,
					source_type: doc.source_type,
					source_url: doc.source_url,
					...doc.metadata,
				}
			);

			// Update database with embedding_id
			await db
				.prepare(
					`UPDATE knowledge_base
					 SET embedding_id = ?
					 WHERE id = ?`
				)
				.bind(`${customerId}:${result.id}`, result.id)
				.run();

			successCount++;
		} catch (error) {
			console.error('Error uploading document:', error);
		}
	}

	return successCount;
}

/**
 * Delete document from knowledge base
 */
export async function deleteDocument(
	env: Env,
	db: D1Database,
	customerId: string,
	documentId: string
): Promise<boolean> {
	try {
		// Delete from Vectorize
		await env.VECTORIZE.deleteByIds([`${customerId}:${documentId}`]);

		// Delete from database
		await db
			.prepare(
				`DELETE FROM knowledge_base
				 WHERE customer_id = ? AND id = ?`
			)
			.bind(customerId, documentId)
			.run();

		return true;
	} catch (error) {
		console.error('Error deleting document:', error);
		return false;
	}
}

/**
 * Scrape website and add to knowledge base
 */
export async function scrapeAndIndex(
	env: Env,
	db: D1Database,
	customerId: string,
	url: string
): Promise<boolean> {
	try {
		// Fetch the webpage
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`Failed to fetch ${url}: ${response.status}`);
		}

		const html = await response.text();

		// Basic HTML to text extraction (you'd want to use a proper HTML parser in production)
		const text = html
			.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
			.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
			.replace(/<[^>]+>/g, ' ')
			.replace(/\s+/g, ' ')
			.trim();

		// Extract title (basic)
		const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
		const title = titleMatch ? titleMatch[1] : url;

		// Upload the document
		const count = await uploadDocuments(env, db, customerId, [
			{
				title,
				content: text.substring(0, 5000), // Limit to 5000 chars
				source_type: 'scraped',
				source_url: url,
			},
		]);

		return count > 0;
	} catch (error) {
		console.error('Error scraping website:', error);
		return false;
	}
}
