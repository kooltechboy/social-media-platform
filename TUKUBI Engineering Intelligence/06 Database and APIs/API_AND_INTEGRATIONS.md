---
title: "API_AND_INTEGRATIONS — Server Actions, Route Handlers & External Providers"
type: api-documentation
status: verified
owner: Backend & Integrations Architect
created: 2026-10-28
updated: 2026-10-28
tags:
  - tukubi
  - api
  - integrations
  - paypal
  - openrouter
  - supabase
related:
  - "[[TUKUBI Engineering Intelligence]]"
  - "[[06 Database and APIs/DATA_MODEL]]"
---

# API_AND_INTEGRATIONS — TUKUBI

## 1. HTTP Route Handlers (`apps/web/src/app/api/**` — 36 Routes)

| Endpoint | Methods | Auth Boundary | Purpose & Security Controls |
|---|---|---|---|
| `/api/health` | `GET` | Public | Liveness & readiness probe with build metadata |
| `/api/v1/posts` | `GET`, `POST` | Authenticated (`POST`) | Paginated post feed & Zod-validated post creation with idempotency |
| `/api/v1/posts/[id]/like` | `POST`, `DELETE` | Authenticated | Idempotent post like/unlike toggle |
| `/api/v1/posts/[id]/comments` | `GET`, `POST` | Authenticated (`POST`) | Threaded post comments |
| `/api/v1/link-preview` | `POST` | Authenticated | SSRF-guarded OpenGraph metadata fetcher (blocks private/loopback/link-local IPs) |
| `/api/v1/upload/presign` | `POST` | Authenticated | MIME-validated presigned upload URL generator |
| `/api/ads/impression` | `POST` | Public/Auth | Calls `record_ad_impression_and_spend` via service client; server computes cost & deduplicates per viewer/5m |
| `/api/ads/click` | `POST` | Public/Auth | Deduplicates clicks per `impression_id`, increments CTR metrics, logs `ad_events` |
| `/api/payments/paypal/capture` | `GET` | Authenticated | Verifies PayPal order ownership (`provider_transaction_id === token`), captures via PayPal v2 API, verifies amount/currency, settles double-entry ledger, and funds campaign idempotently |
| `/api/payments/webhooks/[provider]` | `POST` | Cryptographic Signature | Verifies PayPal (`verify-webhook-signature`) and Stripe (`constructEvent`) signatures; deduplicates via `webhook_events`; settles only on `PAYMENT.CAPTURE.COMPLETED` |
| `/api/v1/wallet/tip` | `POST` | Authenticated | Double-entry creator tipping with idempotency key |
| `/api/v1/ai` | `POST` | Authenticated + Rate Limit | CaribAI assistant & dialect translation via OpenRouter `:free` models |
| `/api/v1/help/feedback` | `POST` | Public/Auth | UUID-validated help article helpfulness feedback |
| `/api/v1/help/tickets` | `POST` | Authenticated | Support ticket submission |
| `/api/v1/admin/*` | `GET`, `POST`, `PATCH` | Admin + `AAL2` MFA | Moderation queue, user role management, financial reconciliation, audit logs |

---

## 2. Server Action Modules (`apps/web/src/lib/**` — 27 Modules)

- **Feed & Social:** `lib/feed/load-feed.ts`, `lib/feed/hydrate-posts.ts`, `lib/feed/actions.ts`, `lib/social/actions.ts`, `lib/social/draft-manager.ts`, `lib/social/relationships-actions.ts`
- **Pages & Communities:** `lib/pages/actions.ts`, `lib/communities/actions.ts`
- **Media & Shorts:** `lib/media/short-actions.ts`, `lib/media/reel-actions.ts`, `lib/media/sound-actions.ts`, `lib/media/live-actions.ts`, `lib/media/podcast-actions.ts`
- **Messaging & Notifications:** `lib/messaging/actions.ts`, `lib/notifications/actions.ts`
- **Advertising & Commerce:** `lib/advertising/actions.ts`, `lib/commerce/actions.ts`, `lib/wallet/actions.ts`
- **Settings, AI & Admin:** `lib/settings/settings-actions.ts`, `lib/ai/actions.ts`, `lib/admin/actions.ts`

---

## 3. External Service Integrations

1. **Supabase (`@supabase/ssr`, `@supabase/supabase-js`):**
   - Auth (Email/Password, Google OAuth, TOTP MFA), PostgreSQL with RLS, Storage buckets, and Realtime WebSockets.
2. **PayPal Orders v2 & Webhooks (`packages/payments/src/adapters/paypal.ts`):**
   - Supports Sandbox (`api-m.sandbox.paypal.com`) and Live (`api-m.paypal.com`) environments.
   - Embeds `custom_id = idempotencyKey` on `purchase_units[0]` for deterministic webhook reconciliation.
   - Verifies webhooks via PayPal's `/v1/notifications/verify-webhook-signature` endpoint.
3. **OpenRouter AI (`packages/ai/src/openrouter.ts`):**
   - Strictly routes requests to zero-cost `:free` models (`meta-llama/llama-3.3-70b-instruct:free`, `google/gemma-3-27b-it:free`, `mistralai/mistral-small-3.1-24b-instruct:free`) with automatic fallback and prompt-injection sanitization.
4. **Upstash Redis (`packages/cache` & `apps/web/src/middleware.ts`):**
   - Distributed rate limiting and hot feed caching with graceful in-memory fallback when Redis credentials are omitted in local development.
