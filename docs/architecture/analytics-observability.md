# Analytics & Observability Architecture — ANTILIA

## 1. Analytics (Privacy-Aware)

**Event pipeline:** every meaningful action becomes a versioned event → `analytics_events` (partitioned) → dashboards. No cross-site tracking; no surveillance-grade targeting (see advertising constraints in `docs/architecture/monetization-model.md`).

**Product funnels:** registration → profile completion (+Caribbean connection) → first follow/join → first post → D1/D7/D30 retention. North-star launch metrics in `PRODUCT-REQUIREMENTS.md` §6.

**Event taxonomy (initial):** `user_registered`, `profile_completed`, `post_created`, `post_viewed`, `post_liked`, `post_shared`, `comment_created`, `creator_followed`, `community_joined`, `message_sent`, `search_performed`, `report_created`, `video_started`, `video_completed`, `payment_completed`.

**Dashboards:** executives (DAU/WAU/MAU, retention, revenue), product (funnels, feature adoption), engineering (latency, errors, queue depth), creators (reach, engagement, revenue), businesses, Trust & Safety (reports, spam, queue SLA), finance (revenue, payouts, reconciliation).

## 2. Observability

| Signal | Implementation |
| :--- | :--- |
| **Logs** | structured JSON logging with `request_id`, `user_id` (hashed), `route`; no PII/secrets in logs |
| **Metrics** | API latency (p50/p95/p99), DB query latency, Redis hit rate, queue depth, error rate, media processing failures, payment failure rate, payout failures, auth failure spikes |
| **Traces** | request tracing across route → domain service → DB/provider calls |
| **Errors** | error tracking with alert routing; triage ownership per domain |
| **Security monitoring** | `security_events` stream: failed logins, suspicious sessions, RLS denials, rate-limit trips, webhook verification failures |
| **Uptime** | external synthetic checks on core user journeys |

**Alert policies:** page on error-rate, ledger drift, payment webhook verification failure, queue depth > threshold; ticket on p99 regression, cache hit-rate decline.

## 3. Feature Flags
Centralized flags (`feature_flags` table + cached server evaluation): `stories_enabled`, `reels_enabled`, `live_enabled`, `podcasts_enabled`, `spotpay_enabled`, `creator_subscriptions`, `marketplace_enabled`, `ai_search_enabled`, `new_feed_algorithm`. Support gradual rollout %, kill switches, and per-cohort targeting. Flags gate code paths server-side; dead code paths are removed when flags retire.
