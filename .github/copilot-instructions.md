# Copilot instructions for Insertabot (Mistyk Media)

Short, actionable guidance so an AI coding agent becomes productive quickly in this repo.

## Big picture
- **Production domain**: `https://insertabot.io` (API at `https://api.insertabot.io`, CDN at `https://cdn.insertabot.io`)
- **Legacy domain**: `https://insertabot.mistyk.media` (being phased out)
- Two primary components:
  - `worker/` — Cloudflare Workers TypeScript API (multi-tenant, D1 DB, Vectorize, KV, AI binding).
  - `widget/` — Embeddable client (vanilla JS); simple script tag integration and demo (`widget/demo.html`).
  - `wordpress-plugin/insertabot/` — WordPress admin + secure API key storage for self-hosted customers.
- Typical request flow: widget -> Worker API (X-API-Key or Bearer) -> validate tenant in D1 -> rate-limit via KV -> optional RAG (Vectorize) and Tavily web search -> call `env.AI.run(...)` -> return streaming or non-streaming response.

## Key files to read first
- `worker/src/index.ts` — main router and chat handler (shows CORS, rate limiting, RAG, and AI calls).
- `worker/src/validation.ts` — Zod schemas and `validateTenant` / `validateApiKey` behavior (use these for input rules).
- `worker/src/rag.ts` — Vectorize usage and embedding lifecycle.
- `worker/src/stripe.ts` — Stripe webhook handling and customer updates.
- `schema.sql` — D1 schema (customers, widget_configs, embeddings, analytics): use for DB changes and migrations.
- `scripts/test-api.js` — canonical examples of how to call endpoints (health, widget config, chat streaming).
- `wordpress-plugin/includes/class-security.php` & tests — how API keys are encrypted and logged (important for security rules).

## Developer workflows & commands (explicit)
- Local dev (quick):
  - Root: `npm install` then `npm run dev` (starts `dev-server.js` at :8787)
  - Worker: `cd worker && npm install && npm run dev` (runs `wrangler dev`)
- Deploy:
  - `cd worker && wrangler deploy` (production via `worker/wrangler.toml`)
  - Use `wrangler tail` to stream logs in prod
- Database & infra:
  - Create D1: `wrangler d1 create insertabot-production`
  - Migrate: `wrangler d1 execute insertabot-production --file=../schema.sql`
  - Create KV namespace: `wrangler kv:namespace create RATE_LIMITER`
  - Create Vectorize index: `wrangler vectorize create insertabot-embeddings --dimensions=768 --metric=cosine`
- Secrets: set via `wrangler secret put STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` / `TAVILY_API_KEY`.
- Tests: API smoke tests: `node scripts/test-api.js http://localhost:8787 ib_sk_demo_...` (script includes streaming example). WordPress tests live under `wordpress-plugin/insertabot/tests` (use your normal PHPUnit workflow there).

## Conventions & important patterns (do not change lightly)
- API key format: must start with `ib_sk_` (validated in `validation.ts` and `class-security.php`): regex example `^ib_sk_[a-zA-Z0-9_]+$`.
- Never log full API keys: use `sanitizeForLog()` (worker) or `Insertabot_Security::hash_api_key_for_log()` (WP) when logging keys.
- Rate limiting keys: `ratelimit:<customerId>:hour:<hourIndex>` and `ratelimit:<customerId>:day:<dayIndex>` (see `checkRateLimit` in `worker/src/index.ts`).
- RAG/embeddings: embeddings stored with `embedding_id` (see `schema.sql`); Vectorize index is `insertabot-embeddings` by convention.
- AI binding: Cloudflare Workers AI used via `env.AI.run(...)` (model example: `@cf/meta/llama-3.1-8b-instruct`).
- Validation/size limits: request bodies limited to 10MB (`MAX_REQUEST_SIZE`), chat messages limited to 10k chars and max 50 messages (see `validation.ts`).
- Security & privacy: WP plugin anonymizes IPs and encrypts API keys using WordPress salts — follow existing patterns for compliance.

## WordPress plugin integration — connecting the SaaS
- Preferred integration pattern: use the client-side `widget/` embed when possible (no server-side proxy). For self-hosted WordPress sites the admin stores a tenant API key via `Insertabot_Admin_Settings` which calls `Insertabot_Security::store_api_key()`; the UI never persists plaintext keys and displays only masked values.
- Short-lived widget token: the plugin exposes `GET /wp-json/insertabot/v1/widget-token` (`wordpress-plugin/includes/rest.php`) which returns a signed, short-lived token (60s). Use this token for widget bridges so the API key is never exposed to browsers.
- Server-side calls: when necessary (pre-moderation, scheduled jobs, or custom integrations), call Insertabot endpoints with `wp_remote_post`/`wp_remote_get` and set the `X-API-Key` header to `Insertabot_Security::get_api_key()`. Handle 429 responses, retries/backoff, and avoid logging the full key (use `Insertabot_Security::hash_api_key_for_log()`).

  Example (PHP):

  ```php
  $api_key = Insertabot_Security::get_api_key();
  $resp = wp_remote_post($api_base . '/v1/chat/completions', [
    'headers' => [
      'Content-Type' => 'application/json',
      'X-API-Key' => $api_key,
    ],
    'body' => wp_json_encode([ 'messages' => $messages ]),
    'timeout' => 15,
  ]);
  ```

- Settings & sanitization: add/modify admin-facing settings in `wordpress-plugin/includes/admin-settings.php` and reuse `Insertabot_Security::sanitize_widget_config()` where applicable. Use `Insertabot_Security::validate_api_key()` to validate keys and store them via `store_api_key()`.
- REST/AJAX endpoints: protect with capability checks and nonces (`verify_nonce`) and avoid exposing sensitive data. Use the `insertabot_widget_token_endpoint` pattern for client-safe tokens.
- Tests: add automated PHPUnit tests in `wordpress-plugin/insertabot/tests` to cover the admin sanitizers, `insertabot_widget_token_endpoint`, and the security helper methods. Mock `wp_remote_*` calls when testing server-side integrations.
- Privacy: follow existing GDPR-friendly patterns (IP anonymization with `get_client_ip()`, encrypted storage using WP salts, limited logging). Any new telemetry must respect `analytics_enabled` flags in `schema.sql` and the plugin settings.

## What to change when you add features
- Add new Cloudflare bindings to `worker/wrangler.toml` (D1, KV, Vectorize, Analytics) and document them in `docs/`.
- Update `schema.sql` alongside any DB changes and add a `wrangler d1 execute` migration step.
- Add or update `scripts/test-api.js` with any new endpoints to keep a fast smoke-test available.
- If adding secrets, add examples to `worker/.dev.vars.example` and document activation steps in `docs/ACTIVATION-CHECKLIST.md`.

## What to change when you add features
- Add new Cloudflare bindings to `worker/wrangler.toml` (D1, KV, Vectorize, Analytics) and document them in `docs/`.
- Update `schema.sql` alongside any DB changes and add a `wrangler d1 execute` migration step.
- Add or update `scripts/test-api.js` with any new endpoints to keep a fast smoke-test available.
- If adding secrets, add examples to `worker/.dev.vars.example` and document activation steps in `docs/ACTIVATION-CHECKLIST.md`.

## Code-review hints for Copilot agents
- Keep changes focused and small; prefer a single logical change per PR (update schema + migration in same PR when adding DB columns).
- When modifying request shapes, update `worker/src/validation.ts` Zod schemas and the corresponding tests or `scripts/test-api.js` calls.
- Run local dev server (`npm run dev`) and smoke tests (`node scripts/test-api.js`) before opening PR.
- Avoid introducing plaintext secrets; prefer `wrangler secret put` and `.dev.vars.example` for local env guidance.

---
If anything here is unclear or you want more specific examples (e.g., a checklist for adding a new endpoint or a template for database migrations), tell me what you'd like and I will refine this file.✅
