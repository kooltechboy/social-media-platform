# System Architecture — TUKUBI

## 1. Overview & Ecosystem Topology

TUKUBI is engineered as a modular monorepo combining Next.js 15 (Web), Expo React Native (iOS/Android Mobile), Supabase PostgreSQL with RLS, SpotPay Financial Orchestration, Cloudflare R2/Stream, Redis, and Tukubi AI via OpenRouter.

```
                         TUKUBI
              (Social • Culture • Commerce)
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
        SOCIAL           COMMERCE          CREATORS
    (Discovery/Feed)   (Marketplace/Store)  (Tipping/Audio)
          │                 │                 │
          └─────────────────┼─────────────────┘
                            │
                     TUKUBI CHECKOUT
                            │
             ┌──────────────┼──────────────┐
             │              │              │
       🟣 SPOTPAY       APPLE PAY      GOOGLE PAY
     (Fastest/Rec.)         │              │
             │              ├──────── PAYPAL
             │              │              │
             └──── CREDIT / DEBIT (Stripe) ┘
                            │
                    PAYMENT LAYER (PSP)
                            │
                     MERCHANT / SELLER
```

### The Separation of Roles:
- **TUKUBI**: The destination where Caribbean people and the diaspora discover, socialize, create, sell, and buy.
- **SpotPay**: The financial-services platform providing digital wallets, money movement, cross-border transfers, Calypso Card, and card economics.
- **Brand Tagline:** *TUKUBI: Social • Culture • Commerce — Powered by SpotPay: Money • Payments • Wallet*.

---

## 2. Runtime Topology

```
INTERNET → CLOUDFLARE (CDN / WAF / DDoS / Bot) → VERCEL (Next.js web + API routes)
  → Supabase (Postgres + RLS, Auth, Storage, Realtime, Edge Functions)
  → Redis (cache, sessions, rate limits, presence)
  → Cloudflare R2/Stream (media object storage, video, CDN)
  → PSPs (Stripe / PayPal / Apple IAP / Google Play Billing / SpotPay Wallet)
  → OpenRouter (CaribAI multi-model routing)
```

---

## 3. Monorepo Layout (`pnpm` + Turborepo)

**Applications:**
* `apps/web`: Next.js 15 App Router web application (home feed, explore, reels, live, podcasts, communities, messages, notifications, profile, moderation, admin, creator-studio, events, marketplace, spotpay).
* `apps/mobile`: Universal Expo React Native application (iOS & Android).
* `apps/admin`: Superadmin and financial operations management.
* `apps/moderation`: Trust & Safety moderation console.

**Domain Packages:**
* `packages/ui`: Shared UI components.
* `packages/design-system`: Caribbean Futurism design tokens.
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
* `packages/creator`: Subscription tiers, fee waterfall, affiliate referrals.
* `packages/live`: Stream state machine, access policy, gift catalog.
* `packages/podcasts`: Episode validation, RSS builder.
* `packages/spotpay`: Money minor units, MonetizationEngine, SELLER_PLANS, double-entry ledger, capability matrix.
* `packages/business`: Profiles, reviews, bookings, capacity, seller tier upgrades.
* `packages/marketplace`: Pricing, disputes, order state machine, affiliate splits.
* `packages/advertising`: Campaigns, metrics, pacing, privacy-aware targeting.
* `packages/analytics`: Event taxonomy + pipeline.
* `packages/notifications`: Templates + batched fan-out.
* `packages/ai`: CaribAIEngine, BusinessAIAssistant (grounding engine), Creator AI assist.

---

## 4. Key Architecture Documents

| Topic | Document |
| :--- | :--- |
| Payments & Ledger | `PAYMENT-ARCHITECTURE.md` |
| Product Requirements | `PRODUCT-REQUIREMENTS.md` |
| Threat Model | `THREAT-MODEL.md` |
| Trust & Safety | `TRUST-SAFETY.md` |
| Design System | `DESIGN-SYSTEM.md` |
| Geographic Model | `docs/architecture/geographic-data-model.md` |
| Mobile & Creator Media | `docs/architecture/mobile-architecture.md` |
| AI & Intelligence | `docs/architecture/intelligence-architecture.md` |
| Implementation Roadmap | `docs/IMPLEMENTATION-ROADMAP.md` |
