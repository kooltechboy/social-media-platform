# Implementation Roadmap — ANTILIA

_Strategy: architect for 100M users, build for 10,000. Each phase exits only through the Definition of Done in `AGENTS.md`._

## Phase 0 — Discovery & Artifacts ✅ (complete)
Repository assessment, gap analysis, PRD, competitive analysis, architecture set, threat model, design system, ADR index, agent organization, skills manifest, roadmap, Definition of Done.

## Phase 1 — Foundation ✅ (delivered 2026-08-20)
- Migrations `00005` (regions/cities/languages/profile identity, private by default) and `00006` (device_sessions, login_events, audit_logs, security_events, feature_flags, analytics_events) — all RLS-enforced.
- `packages/database`: typed table registry, cursor codec, RLS test harness (TS) + `supabase/tests/rls_tests.sql` (SQL assertions).
- `packages/localization`: 6 complete locales (en/es/fr/ht/nl/pap), completeness-tested.
- `packages/analytics`: event taxonomy, validation, pipeline.
- `packages/notifications`: template registry, batched fan-out.
- CI/CD: `.github/workflows/ci.yml` (lint → typecheck → unit → build → E2E → audit).
- **Live verification (2026-08-20):** all 14 migrations applied to the linked Supabase project; `supabase/tests/rls_tests.sql` executed against the live database — 10/10 assertions passed (the suite caught and fixed an RLS infinite-recursion bug, resolved in migration 00014).
- **Remaining for production hardening:** Playwright coverage expansion, auth/session wiring.

## Phase 2 — Social MVP ✅ (delivered 2026-08-20)
- Migration `00007`: friendships, mutes, post enrichment, communities + roles (trigger-seeded), notifications, reports, moderation cases/actions, risk scores — RLS throughout.
- `packages/social`: 7 feed modes, keyset cursor pagination, composer validation (hashtags/mentions), graph visibility resolution.
- `packages/recommendations`: Caribbean Graph ranker with safety gating, satisfaction adjustment.
- `packages/search`: SearchIndex port + Postgres FTS implementation + semantic planner.
- `packages/communities`: role hierarchy, join policies, permission checks.
- `packages/trust-safety`: risk engine (ALLOW/REVIEW/RESTRICT), appeals policy, report prioritization.
- Web: messages, notifications, profile, moderation console, admin console pages; nav wiring. Explore page renders **live** countries + diaspora hubs from the database (ISR, 5 min) with static fallback.
- E2E: Playwright suite (`tests/e2e/critical-journeys.spec.ts`) — 7 critical journeys green against the dev server.
- **Remaining for production:** live feed/profile data wiring, moderation console auth.

## Phase 3 — Messaging ✅ (delivered 2026-08-20)
- Migration `00008`: conversations, members, messages, attachments, receipts — member-scoped RLS.
- `packages/messaging`: conversation policy, draft validation, receipts.
- Web `/messages` UI (list + thread + composer).
- **Remaining for production:** Realtime subscriptions, E2EE design implementation.

## Phase 4 — Creator ✅ (delivered 2026-08-20)
- Migration `00009`: stories (24h TTL + audience RLS), videos (reels/long-form, subscriber-gated), creator_accounts, subscriptions.
- `packages/media`: surface limits, processing state machine, signed URL templates.
- `packages/creator`: tier pricing (299/499/999), fee waterfall, payout gates (KYC/fraud/reserves), subscription helpers.
- **Remaining for production:** transcoding pipeline wiring, Creator Studio analytics charts.

## Phase 5 — Live + Podcast ✅ (delivered 2026-08-20)
- Migration `00010`: livestreams (access levels), live chat, ledger-backed gifts (idempotency), podcasts/episodes/followers.
- `packages/live`: stream state machine, access policy, gift catalog + purchase validation.
- `packages/podcasts`: episode/chapter validation, RSS builder, slugify.
- **Remaining for production:** Cloudflare Stream ingestion wiring, RSS endpoint exposure.

## Phase 6 — SpotPay Production ✅ (delivered 2026-08-20)
- Migration `00011`: idempotency_keys, payment_methods (tokenized), payment_intents, payment_attempts, refunds, disputes, chargebacks, payouts, commissions + ledger sum-zero trigger.
- `packages/spotpay` expanded: `Money` (minor units, Intl), capability-matrix `PaymentPolicyEngine` (store-compliant routing), intent lifecycle with idempotency, provider registry, signature-verified webhook processor, refund accounting.
- **Remaining for production:** real Stripe/PayPal adapters (interface ready), Apple/Google IAP server verification, reconciliation jobs, sandbox test matrix execution.

## Phase 7 — Business + Events + Marketplace ✅ (delivered 2026-08-20)
- Migration `00012`: businesses, locations, reviews, products, orders/items, events, attendees, tickets — RLS throughout.
- `packages/business`: profile validation, review aggregation, booking windows, capacity.
- `packages/marketplace`: minor-unit pricing + commission, dispute windows, order state machine, store-routing detection.
- **Remaining for production:** Business Studio app, checkout UI, ticket QR issuance.

## Phase 8 — AI + Advertising ✅ (delivered 2026-08-20)
- Migration `00013`: advertisers, campaigns, ad sets, ads, impressions, clicks — privacy-aware targeting only.
- `packages/advertising`: campaign validation, metrics (CTR/CPM/CPC/ROAS), daily pacing, targeting key allow-list.
- `packages/ai` expanded: Ask Caribbean planner (entities, locations, locale, time windows), grounded-answer contract.
- **Remaining for production:** OpenRouter live routing, dedicated search engine benchmark + swap, ad delivery service.

## Phase 9 — Scale ✅ (tooling delivered 2026-08-20)
- `tests/performance/k6-feed.js` load profile with encoded thresholds.
- `docs/operations/performance-budgets.md` budgets; `docs/operations/extraction-evidence.md` extraction log.
- **Remaining (evidence-gated):** production load testing, service extraction per ADR-003.

## Launch Gates (business, parallel)
Stage 1 DR + diaspora → Stage 2 JM/TT/BB/BS/HT → Stage 3 US/CA/UK diaspora → Stage 4 global. Creator/business recruitment precedes each stage.
