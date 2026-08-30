# 02_ARCHITECTURE.md — Monorepo Architecture & Subsystems

## 1. Domain Separation & Monorepo Boundaries
- **Apps Layer:**
  - `apps/web`: Next.js 15 App Router, React Server Components (RSC), SSR with `@supabase/ssr`.
  - `apps/admin`: Next.js 15 internal back-office administration console.
  - `apps/moderation`: Next.js 15 human-in-the-loop Trust & Safety portal.
  - `apps/mobile`: Universal Expo React Native mobile app.

- **Packages Layer:**
  - Zero cross-package cyclic dependencies.
  - Clean separation between business domain logic (`@caribbean/*`) and presentation layer (`apps/*`).

## 2. Inviolable Architectural Mandates
1. **RLS on All Tables:** Postgres Row Level Security on 100% of tables exposed via PostgREST.
2. **Payments Double-Entry Ledger:** Balance calculation is derived from paired credit/debit records; direct mutable column increments are strictly prohibited.
3. **Store Policy Compliance:** Digital goods in mobile route via Apple IAP / Google Play Billing; web commerce routes via Payments / Stripe / PayPal.
