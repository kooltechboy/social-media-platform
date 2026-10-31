# TUKUBI — Architecture Map & System Topology
## Document Reference: TUKUBI-EXCELLENCE-ARCH-001

### 1. High-Level System Architecture

TUKUBI is architected as an enterprise-grade Turborepo monorepo designed for high concurrency, strict type safety, zero data mutation leaks, and multi-surface deployment across Web (Desktop/Mobile/PWA) and Native Mobile (iOS & Android via Universal Expo).

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                               CLIENT APPS (apps/)                               │
│                                                                                 │
│   ┌──────────────┐     ┌──────────────┐    ┌──────────────┐   ┌─────────────┐   │
│   │   apps/web   │     │ apps/mobile  │    │apps/creator- │   │ apps/admin  │   │
│   │Next.js 15 RSC│     │ Universal RN │    │    studio    │   │& moderation │   │
│   │  Tailwind v4 │     │   Expo 52    │    │ Next.js App  │   │ Next.js App │   │
│   └───────┬──────┘     └──────┬───────┘    └──────┬───────┘   └──────┬──────┘   │
└───────────┼───────────────────┼───────────────────┼──────────────────┼──────────┘
            │                   │                   │                  │
┌───────────▼───────────────────▼───────────────────▼──────────────────▼──────────┐
│                             CORE PACKAGES (packages/)                           │
│                                                                                 │
│   ┌─────────────────────┐   ┌─────────────────────┐   ┌─────────────────────┐   │
│   │   @caribbean/ui     │   │@caribbean/design-   │   │ @caribbean/payments │   │
│   │  Accessible Radix   │   │  system (Tokens)    │   │ PayPal v2 / Ledger  │   │
│   └─────────────────────┘   └─────────────────────┘   └─────────────────────┘   │
│   ┌─────────────────────┐   ┌─────────────────────┐   ┌─────────────────────┐   │
│   │ @caribbean/database │   │ @caribbean/media    │   │@caribbean/messaging │   │
│   │ Supabase Typed ORM  │   │ Resolver & Pipeline │   │ Realtime P0 Channels│   │
│   └─────────────────────┘   └─────────────────────┘   └─────────────────────┘   │
│   ┌─────────────────────┐   ┌─────────────────────┐   ┌─────────────────────┐   │
│   │  @caribbean/social  │   │   @caribbean/ai     │   │ @caribbean/search   │   │
│   │  Feeds & Reactions  │   │CaribAI & Translation│   │ Caribbean FTS Index │   │
│   └─────────────────────┘   └─────────────────────┘   └─────────────────────┘   │
└──────────────────────────────────────┬──────────────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼──────────────────────────────────────────┐
│                          BACKEND INFRASTRUCTURE (Supabase)                      │
│                                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │  PostgreSQL 15+ with Row-Level Security (RLS) on 100% of tables         │   │
│   │  - 118 Versioned Migrations (`supabase/migrations/`)                    │   │
│   │  - Double-Entry Ledger Invariant (`trg_ledger_sum_zero`)                │   │
│   │  - Escrow Order RPC (`place_order_with_escrow`)                         │   │
│   │  - FTS Search Indexes & pg_trgm for Caribbean Diaspora discovery        │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│   ┌───────────────────────────┐                 ┌───────────────────────────┐   │
│   │     Supabase Realtime     │                 │     Supabase Storage      │   │
│   │  WebSocket Subscriptions  │                 │  Bucket Policies & Signed │   │
│   │  (Messages, Receipts)     │                 │  Upload URLs              │   │
│   └───────────────────────────┘                 └───────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

### 2. Frontend Architecture & Rendering Strategy

1. **Next.js 15 App Router (`apps/web`):**
   - **React Server Components (RSC):** Default for all read-heavy routes (`/`, `/explore`, `/profile/[username]`, `/communities/[slug]`, `/pages/[slug]`, `/help`) to minimize JavaScript payload and achieve `< 2.5s` LCP.
   - **Client Boundaries (`'use client'`):** Restricted strictly to interactive primitives (Composer, Video Players, Reaction Buttons, Chat Channels, Realtime Providers).
   - **Styling Architecture:** Tailwind CSS v4 paired with `@caribbean/design-system` design tokens (`Midnight Reef`, `Caribbean Futurism`).
   - **State Isolation:** Decoupled Zustand / Context stores per subsystem (`auth-provider`, `notifications-realtime-provider`, `identity-switcher`).

2. **Universal Expo Mobile App (`apps/mobile`):**
   - **Engine:** React Native 0.76.5 + Expo SDK 52.
   - **Navigation:** React Navigation 7 Bottom Tabs with flush-integrated Create Pill and persistent Header.
   - **Safe Areas:** Wrapped in `react-native-safe-area-context` to guarantee zero notch or home-indicator collisions across iOS and Android.

---

### 3. Backend & Data Architecture

1. **Row Level Security (RLS) Policy Model:**
   - Every table has RLS enabled (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`).
   - Tenant isolation and user ownership are strictly verified via `auth.uid() = user_id`.
   - Bidirectional blocking is enforced at the database level (`NOT EXISTS (SELECT 1 FROM blocks ...)`).

2. **Double-Entry Financial Accounting Safety:**
   - No table allows mutable column increments on balances (`balance = balance + amount` is strictly banned and tested).
   - All balance changes are computed from immutable balanced ledger entries (`SUM(amount) = 0` checked by trigger `trg_ledger_sum_zero`).
