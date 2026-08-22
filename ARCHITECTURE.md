# System Architecture — CARIBBEAN ONE

## Overview
CARIBBEAN ONE is engineered as a modular monorepo combining Next.js 15 (Web), Expo React Native (iOS/Android Mobile), Supabase PostgreSQL with RLS, SpotPay Financial Orchestration, Cloudflare R2/Stream, Redis, and CaribAI via OpenRouter.

```
                               ┌────────────────────────────────────────┐
                               │           CARIBBEAN GRAPH              │
                               │  People • Culture • Geography • Commerce│
                               └───────────────────┬────────────────────┘
                                                   │
         ┌───────────────────┬─────────────────────┼─────────────────────┬───────────────────┐
         │                   │                     │                     │                   │
    ┌────┴────┐         ┌────┴────┐           ┌────┴────┐           ┌────┴────┐         ┌────┴────┐
    │ SOCIAL  │         │ CREATOR │           │ SPOTPAY │           │ BUSINESS│         │ CARIBAI │
    │   OS    │         │   OS    │           │ WALLET  │           │   OS    │         │ INTELL. │
    └─────────┘         └─────────┘           └─────────┘           └─────────┘         └─────────┘
```

## Runtime Topology

```
INTERNET → CLOUDFLARE (CDN / WAF / DDoS / Bot) → VERCEL (Next.js web + API routes)
  → Supabase (Postgres + RLS, Auth, Storage, Realtime, Edge Functions)
  → Redis (cache, sessions, rate limits, presence)
  → Cloudflare R2/Stream (media object storage, video, CDN)
  → PSPs (Stripe / PayPal / Apple IAP / Google Play Billing) via SpotPay
  → OpenRouter (CaribAI multi-model routing)
```

## Monorepo Layout (`pnpm` + Turborepo) — Actual vs. Planned

**Existing today:**
* `apps/web`: Next.js 15 App Router web application (home feed, explore, reels, live, podcasts, communities, messages, notifications, profile, moderation, admin, creator-studio, events, marketplace, spotpay).
* `apps/mobile`: Universal Expo React Native application (iOS & Android) — tabbed Home/Explore/Communities/Messages + create.
* `packages/ui`: Shared React components.
* `packages/design-system`: Color, typography, spacing, and animation tokens.
* `packages/auth`: Authentication abstraction.
* `packages/api`: API client layer.
* `packages/database`: Typed table registry, cursor codec, RLS test harness.
* `packages/localization`: Six-locale i18n (en/es/fr/ht/nl/pap).
* `packages/social`: Feed modes, cursor pagination, composer + graph visibility.
* `packages/recommendations`: Caribbean Graph feed ranker.
* `packages/search`: SearchIndex port + Postgres FTS implementation.
* `packages/communities`: Roles, join policies, permissions.
* `packages/trust-safety`: Content risk engine, appeals, report priority.
* `packages/messaging`: Conversation policy, drafts, receipts.
* `packages/media`: Surface limits, processing state machine, signed URLs.
* `packages/creator`: Subscription tiers, revenue waterfall, payout gates.
* `packages/live`: Stream state machine, access policy, gift catalog.
* `packages/podcasts`: Episode validation, RSS builder.
* `packages/spotpay`: Money, capability-matrix Payment Policy Engine, intents, provider registry, webhooks, double-entry ledger.
* `packages/business`: Profiles, reviews, bookings, capacity.
* `packages/marketplace`: Pricing, disputes, order state machine.
* `packages/advertising`: Campaigns, metrics, pacing, privacy-aware targeting.
* `packages/analytics`: Event taxonomy + pipeline.
* `packages/notifications`: Templates + batched fan-out.
* `packages/ai`: OpenRouter abstraction (CaribAI), Ask Caribbean planner.

**Planned (per-phase; see `docs/IMPLEMENTATION-ROADMAP.md`):**
* `apps/business-studio` (Phase 7 production hardening), `apps/marketing` (deferred).

## Domain Architecture
Each domain owns its business rules; see `docs/architecture/domain-architecture.md` for the domain map and extraction boundaries.

## Database & RLS Protocol
* Database: Supabase PostgreSQL.
* Security: Every table enforces Row Level Security (RLS) — verified by tests, not assumption.
* Migrations: Managed via versioned SQL files under `supabase/migrations/`. Direct DDL is forbidden.
* Schema inventory and evolution plan: `docs/architecture/database-architecture.md`.

## Key Architecture Documents
| Topic | Document |
| :--- | :--- |
| Payments & ledger | `PAYMENT-ARCHITECTURE.md` |
| Threat model | `THREAT-MODEL.md` |
| Trust & Safety | `TRUST-SAFETY.md` |
| Design system | `DESIGN-SYSTEM.md` |
| Product requirements | `PRODUCT-REQUIREMENTS.md` |
| Geographic model | `docs/architecture/geographic-data-model.md` |
| Mobile / creator / media | `docs/architecture/mobile-architecture.md`, `docs/architecture/creator-media-architecture.md` |
| AI / search / feed | `docs/architecture/intelligence-architecture.md` |
| API & events | `docs/architecture/api-event-architecture.md` |
| Analytics & observability | `docs/architecture/analytics-observability.md` |
| ADRs | `docs/adr/INDEX.md` |
