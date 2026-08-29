# API & Event Architecture — TUKUBI

## 1. API Layer

- **Pattern:** Next.js API route handlers / Supabase Edge Functions as **thin adapters** over domain services. No business logic in route handlers; no provider SDK calls from UI.
- **Contracts:** typed in `packages/api` (zod-validated request/response schemas shared by web + mobile).
- **Versioning:** URL-versioned (`/api/v1/...`); breaking changes require a new version + deprecation window.
- **Auth:** Supabase JWT; claims validated server-side; service-role key never leaves server context.
- **Errors:** consistent envelope (`{ error: { code, message, request_id } }`); no stack traces or internals to clients.
- **Rate limiting:** Redis token-bucket per identity+route at the edge; stricter budgets on auth, creation, and financial endpoints.
- **Idempotency:** all mutating financial endpoints require `Idempotency-Key` (see PAYMENT-ARCHITECTURE.md).

## 2. Event Architecture (ADR companion to domain doc)

Async processing via an event pipeline (Supabase Edge Functions + queue; Redis-backed initially, extractable later):

```
USER_REGISTERED, POST_CREATED, POST_REPORTED, VIDEO_UPLOADED,
LIVE_STARTED, LIVE_ENDED, PODCAST_PUBLISHED, MESSAGE_SENT,
PAYMENT_COMPLETED, PAYMENT_FAILED, REFUND_CREATED, PAYOUT_COMPLETED
```

**Consumers:** notifications, analytics ingestion, search indexing, recommendation signals, moderation pipeline, media processing, financial reconciliation.

**Rules:** events are facts (past tense, immutable); consumers are idempotent (at-least-once delivery); schema versioned (`event_version`); dead-letter queue with alerting.

## 3. Analytics Event Contract

Product events (`user_registered`, `post_created`, `post_viewed`, `post_liked`, `message_sent`, `search_performed`, `report_created`, …) are emitted through one pipeline into `analytics_events` — see `docs/architecture/analytics-observability.md`.

## 4. Webhooks (inbound)
PSP webhooks: signature-verified, replay-protected, idempotent, logged with full audit trail. Unknown event types are logged, never dropped.
