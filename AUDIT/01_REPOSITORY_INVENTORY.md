# 01 — REPOSITORY INVENTORY & CODEBASE TOPOGRAPHY

**Repository:** `kooltechboy/social-media-platform`  
**Package Manager:** pnpm 9.0.0 (Turborepo 2.0.0)  
**TypeScript Version:** 5.5.0  
**Node.js Engine:** >=20.0.0

---

## 1. Monorepo Structure

```
.
├── apps/
│   ├── admin/             # Internal Administration & Feature Flag Control (Next.js App Router)
│   ├── mobile/            # Universal Mobile App (Expo / React Native)
│   ├── moderation/        # Trust & Safety / Moderation Portal (Next.js App Router)
│   └── web/               # Core Caribbean One Consumer & Creator Web App (Next.js 15 App Router)
├── packages/
│   ├── advertising/       # Ad Sets, Campaigns, Impression & Click Tracking
│   ├── ai/                # CaribAI OpenRouter integration & Ask Caribbean Query Planner
│   ├── analytics/         # Event taxonomy, schema validation & tracking
│   ├── api/               # Unified API contracts, error handlers & middleware
│   ├── auth/              # RBAC policies, permissions & session definitions
│   ├── business/          # Business profiles, verification, operating hours, reviews
│   ├── communities/       # Community policies, membership lifecycle, permissions
│   ├── creator/           # Creator Studio, subscription tiers, fee calculations, payout rules
│   ├── database/          # Database table types, cursor encoders, RLS test harness
│   ├── design-system/     # Design tokens (colors, typography, spacing, radii)
│   ├── live/              # Live streaming state machine, permissions, gift catalog
│   ├── localization/      # Caribbean multi-dialect & language dictionaries
│   ├── marketplace/       # Cart logic, line calculations, dispute windows, order transitions
│   ├── media/             # Media processing, video transcoding specs, audio specs
│   ├── messaging/         # Direct & Group messaging policies, message validation
│   ├── notifications/     # Notification types, channels & formatting
│   ├── podcasts/          # Podcast episode validation, chaptering, RSS 2.0 / iTunes feed generator
│   ├── recommendations/   # Hybrid recommendation engine (social, geographic, cultural)
│   ├── search/            # Full-text & semantic search query builders
│   ├── social/            # Feed query builder, post composer validation, social graph resolution
│   ├── spotpay/           # Financial Orchestrator, Money value object, double-entry ledger engine
│   ├── trust-safety/      # Content risk analysis, moderation cases, sanctions, report rules
│   └── ui/                # Shared React component library (Buttons, Cards, Badges, Avatars)
├── supabase/
│   ├── migrations/        # 16 versioned SQL migrations (schema, tables, views, RLS, functions)
│   ├── seed/              # Official system account seed SQL
│   └── tests/             # RLS verification SQL test suite
├── tests/
│   ├── e2e/               # Playwright critical journey E2E test specs
│   ├── performance/       # K6 load testing scripts
│   └── unit/              # 14 Vitest unit test suites covering domain packages
└── docs/                  # ADRs, Product Requirements, Threat Models, Operations Runbooks
```

---

## 2. Applications Matrix

| Application | Path | Framework | Port / Target | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Web Client** | `apps/web` | Next.js 15 App Router (RSC, Tailwind CSS) | `localhost:3000` | Substantially complete UI; action type fixes needed |
| **Mobile App** | `apps/mobile` | Expo SDK 51 / React Native | iOS / Android | Prototype single-file `App.tsx`; modularization needed |
| **Admin Portal** | `apps/admin` | Next.js App Router | `localhost:3001` | Operational feature flag & payment dashboard |
| **Moderation Portal** | `apps/moderation` | Next.js App Router | `localhost:3002` | Operational case triage & moderation actions |

---

## 3. Database Migrations Inventory (`supabase/migrations/`)

1. `00001_initial_schema.sql` — Base schema, audit logs, feature flags, extensions.
2. `00002_identity_profiles.sql` — Profiles, private-by-default Caribbean identity attributes.
3. `00003_social_graph_posts.sql` — Follows, friendships, blocks, mutes, posts, comments, reactions.
4. `00004_spotpay_ledger.sql` — Immutable double-entry ledger accounts, entries, idempotency keys, PSP capabilities.
5. `00005_geographic_expansion.sql` — Caribbean sovereign nations, territories, diaspora hub cities, languages.
6. `00006_platform_security.sql` — Device sessions, security events, MFA tracking, login history.
7. `00007_social_communities_moderation.sql` — Communities, roles, members, reports, moderation cases, risk scores.
8. `00008_messaging.sql` — Conversations, members, messages, attachments, read receipts.
9. `00009_creator_economy.sql` — Creator accounts, subscription tiers, memberships, tips, payouts.
10. `00010_live_podcasts.sql` — Livestreams, live messages, virtual gifts, podcasts, episodes, RSS metadata.
11. `00011_spotpay_payments.sql` — Payment intents, payment methods, transaction attempts, refunds, disputes.
12. `00012_business_events_marketplace.sql` — Businesses, products, marketplace orders, events, ticket inventory.
13. `00013_advertising.sql` — Advertisers, ad campaigns, ad sets, ads, impression & click logging.
14. `00014_fix_community_rls_recursion.sql` — Resolves circular subquery recursion in community member RLS.
15. `00015_realtime_welcome.sql` — System bot auto-welcome message for onboarded profiles.
16. `00016_profile_counts_notifications_storage.sql` — Profile counters, notifications table, storage buckets & security policies.

---

## 4. Test Suite Inventory

- **Unit Test Suites (Vitest):** 14 files (`tests/unit/`), 118 passing tests covering all domain packages.
- **E2E Test Suites (Playwright):** `tests/e2e/critical-journeys.spec.ts` testing auth, navigation, and feed loading.
- **Database RLS Test Suite:** `supabase/tests/rls_tests.sql` covering anonymous vs authenticated multi-tenant isolation.
- **Performance / Load Suite:** `tests/performance/k6-feed.js` benchmarking feed endpoint throughput.
