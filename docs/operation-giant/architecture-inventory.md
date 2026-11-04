# TUKUBI Architecture Inventory
## Operation Giant: Production Maturity & Competitive Excellence
### Timestamp: November 3, 2026 | Antigravity Engineering Organization

---

## 1. Current Technology Stack

| Layer | Technology | Version | Purpose / Deployment |
|---|---|---|---|
| **Monorepo Engine** | Turborepo | `2.10.9` | Monorepo pipeline, task graph, distributed cache |
| **Package Manager** | pnpm | `9.0.0` | Workspace dependency isolation and linking |
| **Runtime Environment** | Node.js | `>=20.0.0` (Active: `v24.19.0`) | Edge and server execution runtime |
| **Language** | TypeScript | `5.5.0` | Strict static typing across 31 packages |
| **Web Framework** | Next.js (App Router) | `15.5.23` | React Server Components (RSC), SSR, API routes |
| **Frontend UI Runtime** | React / React DOM | `19.0.0` | Declarative UI, Concurrent rendering |
| **Mobile Runtime** | Expo SDK | `52.0.0` | Universal iOS, Android, and mobile web app |
| **Mobile Native UI** | React Native | `0.76.5` (React `18.3.1`) | Native primitives, gesture handling, animations |
| **Styling & Design System** | Tailwind CSS / Midnight Reef | `v3.4 / v4 hybrid` | Island Vibes & Caribbean Futurism tokens |
| **Database & Auth** | Supabase (PostgreSQL) | Remote PostgreSQL 15+ | Relational data, PostGIS, pgvector, Auth, RLS |
| **Database Client** | `@supabase/ssr` / `@supabase/supabase-js` | `0.12.4` / `2.112.3` | Cookie-based session sync, Realtime, RPC |
| **Edge Cache & Rate Limiter** | Upstash Redis REST | HTTP API / In-Memory fallback | Sliding window edge rate limiting, session throttling |
| **Observability** | Sentry & PostHog | `@sentry/nextjs: 10.73.0`, `posthog-js: 1.427.2` | Distributed tracing, error reporting, privacy-first analytics |
| **Media Processing** | Cloudflare Stream / Sharp / HTML5 Canvas | Native & WebAssembly | Live HLS/DASH streaming, image resizing, client canvas |
| **Testing Harness** | Vitest & Playwright | `vitest: 2.1.9`, `@playwright/test: 1.62.1` | Unit, integration, RLS verification, and E2E browser tests |

---

## 2. System Architecture

TUKUBI is architected as a high-density, multi-tenant Caribbean social and creator platform. It operates a clean separation between presentation apps, domain logic packages, and infrastructure.

```
                          ┌──────────────────────────────────────────────┐
                          │         Edge Middleware & Reverse Proxy      │
                          │   (Auth Gateway, Sliding Window Rate Limit)  │
                          └───────────────────────┬──────────────────────┘
                                                  │
                 ┌────────────────────────────────┴────────────────────────────────┐
                 ▼                                                                 ▼
      ┌──────────────────────┐                                          ┌──────────────────────┐
      │   Public Gateway     │                                          │  Authenticated App   │
      │  /login, /signup,    │                                          │  Home Stream, Shorts,│
      │  /about, /help, etc. │                                          │  Messages, Studio    │
      └──────────┬───────────┘                                          └──────────┬───────────┘
                 │                                                                 │
                 └────────────────────────────────┬────────────────────────────────┘
                                                  │
                                                  ▼
     ┌────────────────────────────────────────────────────────────────────────────────────────┐
     │                             Domain Packages (@caribbean/*)                             │
     │  social • media • messaging • payments • database • auth • design-system • ai • etc.   │
     └────────────────────────────────────────────┬───────────────────────────────────────────┘
                                                  │
                    ┌─────────────────────────────┼─────────────────────────────┐
                    ▼                             ▼                             ▼
         ┌─────────────────────┐       ┌─────────────────────┐       ┌─────────────────────┐
         │ Supabase PostgreSQL │       │ Cloudflare Stream & │       │   Upstash Redis &   │
         │ (RLS, PostGIS, RPC) │       │   Storage Buckets   │       │ External Gateways   │
         └─────────────────────┘       └─────────────────────┘       └─────────────────────┘
```

---

## 3. Major Application Modules

### Applications (`apps/`)

1. **`caribbean-web` (`apps/web`)**
   - The primary consumer web application and responsive PWA.
   - 41 dynamic and static routes covering Feed, Explore, Shorts, Live, Sounds, Events, Marketplace, Messages, Communities, Pages, Settings, and Profile.
   - Implements authentication-first route protection with automatic login redirection for guests and safe redirect destination preservation (`next` parameter).

2. **`caribbean-mobile` (`apps/mobile`)**
   - Universal Expo React Native mobile application for iOS and Android.
   - 17 screen components wired directly to live Supabase tables with zero mock data.
   - Offline persistence via `@react-native-async-storage/async-storage`, native camera via `expo-image-picker`, audio/video via `expo-av`.

3. **`caribbean-creator-studio` (`apps/creator-studio`)**
   - Professional creator portal for content scheduling, shorts sound remixing, dual-host collaborative livestreams, dialect subtitles, and fan monetization analytics.

4. **`caribbean-business-studio` (`apps/business-studio`)**
   - Commercial hub for Caribbean merchants, artisans, and vendors. Multi-currency price configuration, inventory tracking, shipping carrier webhook management, and customs duty estimation.

5. **`caribbean-admin` (`apps/admin`)**
   - Platform administration console: RBAC management, official account verification, bootstrap routines, and system-wide audit logging.

6. **`caribbean-moderation` (`apps/moderation`)**
   - Trust and safety workbench: moderation queue, report resolution, appeals processing, and automated CaribAI risk scoring reviews.

### Domain Packages (`packages/`)

- `@caribbean/advertising`: Campaign management, audience targeting, verified PayPal prepaid budget processing, and feed ad injection engine.
- `@caribbean/ai`: `CaribAIEngine` leveraging OpenRouter free-tier routing, multilingual dialect translation, and content risk scoring.
- `@caribbean/analytics`: Event tracking taxonomy, PostHog telemetry, and performance metric collection.
- `@caribbean/api`: Typed API client wrappers and response serialization.
- `@caribbean/auth`: Signup session state machines, legal age verification, consent persistence, and account intent management.
- `@caribbean/business`: Enterprise business directories, merchant profiles, and business registration workflows.
- `@caribbean/communities`: Community creation, governance roles (Owner, Admin, Moderator, Member), join requests, and private feeds.
- `@caribbean/creator`: Creator monetization, tip jars, subscription tiers, and audio remix registries.
- `@caribbean/database`: Supabase client factories, cursor pagination encoders/decoders, query builders, and database types.
- `@caribbean/design-system`: Midnight Reef / Island Vibes color tokens, Caribbean typography, spacing, elevations, and animations.
- `@caribbean/jobs`: Background asynchronous job dispatching and scheduled cron handling.
- `@caribbean/live`: Cloudflare Stream ingest orchestration, WebRTC collaborative dual-host broadcasting, and live chat.
- `@caribbean/localization`: Multilingual localization (English, Haitian Kreyòl, Papiamento, Spanish, French, Dutch) and dialect adapters.
- `@caribbean/marketplace`: Sovereign Caribbean commerce, store creation wizards, product tagging, dispute resolution, and order tracking.
- `@caribbean/media`: Universal provider-neutral link resolution (YouTube, Facebook, Instagram, TikTok, X, Spotify), SSRF guard with Node.js DNS pre-resolution, and image optimization.
- `@caribbean/messaging`: Real-time chat, thread management, read receipts, participant presence, link preview resolution, and media attachments.
- `@caribbean/notifications`: In-app notification triggers, push delivery adapters, unread count badge aggregators, and notification settings.
- `@caribbean/payments`: Double-entry ledger architecture, idempotency keys, multi-currency ledger, PayPal REST connector, Stripe Connect payouts, and escrow release engine.
- `@caribbean/podcasts`: Audio/video podcast episode publishing, RSS feed generation, and player controls.
- `@caribbean/recommendations`: Content recommendation heuristics, social graph scoring, and trending topic aggregation.
- `@caribbean/sdk`: External developer SDK for third-party integrations and embeds.
- `@caribbean/search`: Multi-entity universal search (people, posts, events, products, communities, territories, hashtags).
- `@caribbean/social`: Feed ranking, reactions (like, love, respect, celebrate, fire), comments, post editing authorization, and draft management.
- `@caribbean/trust-safety`: Content moderation filters, report pipelines, user blocking, and automated risk scoring.
- `@caribbean/ui`: Accessible React UI component library (buttons, modals, drawers, dropdowns, inputs, skeletons).

---

## 4. External Dependencies

| Dependency | Purpose | Integration Method | Security Boundary |
|---|---|---|---|
| **Supabase** | Primary Relational DB, Auth, Storage, Realtime | REST, WebSockets, Postgres Protocol | RLS on 100% of tables, service role protected |
| **PayPal REST API** | Ad campaigns, buyer checkout, subscriptions | Server-to-server REST, Webhooks | Webhook signature verification, Idempotency keys |
| **Stripe Connect** | Creator payouts and onboarding | Server-to-server API, Webhooks | Webhook signature verification, sandbox isolation |
| **Cloudflare Stream** | Live video ingest and HLS playback | REST API, WebRTC | API tokens stored exclusively in server environment |
| **OpenRouter** | CaribAI text processing and moderation | HTTP REST API | Server-side API key, free model fallback routing |
| **Upstash Redis** | Sliding-window edge rate limiting | Edge REST API | Edge token, graceful in-memory fallback |
| **Sentry** | Crash reporting and error tracking | SDK Client/Server hooks | Scrubbed PII, masked tokens |
| **PostHog** | Product analytics and funnel metrics | Client SDK | Anonymous session identifiers |

---

## 5. Database Architecture

- **Total Versioned Migrations:** 117 SQL migrations (`supabase/migrations/00001_...` through `supabase/migrations/00117_...`).
- **Row-Level Security (RLS):** Enabled and enforced on 100% of user-accessible tables.
- **Key Schemas & Entities:**
  - `profiles`: Core identity, handle, avatar, bio, origin territory ISO, verification status, and privacy settings.
  - `posts`: Central content stream, post kind (text, media, reel, poll, event, product), cultural tags, visibility.
  - `post_reactions`: Multi-type reactions with atomic counter triggers.
  - `comments`: Nested commenting hierarchy with author moderation permissions.
  - `conversations` & `messages`: End-to-end messaging, thread participant tracking, sender read status synchronization.
  - `pages` & `page_members`: Sovereign page profiles with role-based administration (Owner, Admin, Editor, Contributor).
  - `communities` & `community_members`: Community governance, membership approvals, and private discussions.
  - `videos`: Shorts and long-form video registry with view counts and sound audio stem links.
  - `sounds`: Audio stem library for shorts remixing with creator attribution.
  - `events` & `event_attendees`: Caribbean cultural calendar, RSVPs, organizer permissions, and relief coordination.
  - `cultural_observances`: Verified national holidays and cultural festivals across 30+ Caribbean territories (Migration 00117).
  - `products` & `orders`: Marketplace catalog, inventory, order lifecycle, escrow state machine.
  - `wallets`, `ledger_entries`, `ledger_transactions`: Double-entry accounting ledger with debit/credit balance invariance.
  - `ad_campaigns` & `ad_impressions`: TUKUBI Ads manager, prepaid budget tracking, and real-time impression delivery.
  - `moderation_reports` & `moderation_actions`: Trust and safety audit trails with immutable action logs.

---

## 6. Deployment Architecture

- **Web Deployment:** Vercel Edge & Serverless platform configured via root and apps/web environments.
- **Edge Routing:** Next.js Edge Middleware executes on every incoming request:
  - Language and locale detection (`tukubi_locale` cookie).
  - Sliding-window edge rate limiting against client IP (auth, api, or burst tier).
  - Parallelized session verification via `supabase.auth.getUser()`.
  - Unauthenticated access prevention: automatic redirection of guest requests on protected routes to `/login?next=...`.
- **Static Assets:** Hosted via Vercel Global Edge Network with immutable cache headers for hashed bundles.
- **Mobile Deployment:** Expo Application Services (EAS) configured for iOS IPA and Android AAB packaging (`apps/mobile/app.json`).

---

## 7. Known Operational Risks

1. **Stale E2E Test Drift (P1):**
   - Three legacy E2E test files (`home-feed.spec.ts`, `critical-journeys.spec.ts`, `auth-flows.spec.ts`) created in September were written before the authentication-first gateway and route protection hardening. They still expect unauthenticated guest access to member feeds and outdated hero copy.
2. **Sentry Edge Instrumentation Deprecation Warnings (P3):**
   - `@sentry/nextjs` warns about `sentry.server.config.ts` and `sentry.edge.config.ts` requiring migration to Next.js `instrumentation.ts`.
3. **SSRF Guard Webpack Critical Dependency Warning (P3):**
   - `packages/media/src/content-resolver/ssrf-guard.ts` uses dynamic require to access Node.js `dns.promises` without breaking client-side bundlers, emitting a harmless Webpack expression warning during compilation.
4. **Third-Party Payment Webhook Reliability in Staging:**
   - Webhook processing requires live secret keys (`STRIPE_WEBHOOK_SECRET`, `PAYPAL_CLIENT_SECRET`) to verify signatures. In environments without valid secrets, webhooks must reject unauthorized payloads.

---

## 8. Existing Monitoring Capabilities

- **Application Error Tracking:** Sentry integration on client, server, and edge middleware.
- **Performance Tracing:** OpenTelemetry hooks through Sentry SDK.
- **Analytics & Telemetry:** PostHog client event tracking for PWA lifecycle, onboarding funnels, and creation actions.
- **Health Check Endpoint:** Public endpoint `/api/v1/health` providing database connectivity and service status reporting.
- **Audit Logging:** System administrative actions, moderation decisions, and financial ledger transactions recorded in persistent database audit tables (`admin_audit_logs`, `moderation_actions`, `ledger_entries`).

---

## 9. Current Testing Coverage

- **Total Test Files:** 227 test suites.
- **Total Passing Tests:** 2,417 tests passing with 0 failures in Vitest.
- **Coverage Dimensions:**
  - Architecture gates: Legacy payment provider zero-tolerance gate, financial mutable column increment prohibition, secrets shield.
  - Unit & Integration: Social feeds, post editing authorization, comments, reels, sounds, pages, communities, marketplace, escrow settlement, multi-currency ledger, rate limiting, and CaribAI.
  - End-to-End (Playwright in Chromium):
    - `content-pages.spec.ts`: 31/31 passed.
    - `navigation-and-routing.spec.ts`: 13/13 passed.
    - `mobile-production-certification.spec.ts`: 8/8 passed.
    - `universal-rich-media-engine.spec.ts`: 5/5 passed.
    - `composer-posting-reliability.spec.ts`: 7/7 passed.
    - `feed-interactions.spec.ts`: 24/24 passed.
    - `header-and-search.spec.ts`: 11/11 passed.
    - `auth.spec.ts` & `feed-and-posts.spec.ts`: 2/2 passed.

---

## 10. Missing Architectural Documentation

- **Consolidated 72-Hour Change Audit:** Documenting changes between October 31 and November 3, 2026.
- **Skills and Agent Matrix:** Formal mapping of Antigravity specialized agents and capabilities.
- **Performance Baseline & Results:** Quantified Core Web Vitals and feed benchmarks across desktop and mobile.
- **Feature Certification Matrix:** Complete audit of all 13 core pillars with evidence-based status ratings.
