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

## Monorepo Layout (`pnpm` + Turborepo)
* `apps/web`: Next.js 15 App Router web application.
* `apps/mobile`: Universal Expo React Native application (iOS & Android).
* `apps/admin`: Back-office enterprise administration console.
* `apps/moderation`: Trust & Safety moderation queue console.
* `packages/ui`: Shared React components.
* `packages/design-system`: Color, typography, spacing, and animation tokens.
* `packages/database`: Supabase client, migrations, typed SQL schema.
* `packages/spotpay`: Double-entry ledger, SpotPay wallet, Stripe/PayPal payment routing.
* `packages/ai`: OpenRouter LLM multi-model provider abstraction & translation engine.
* `packages/trust-safety`: Content classification risk engine.

## Database & RLS Protocol
* Database: Supabase PostgreSQL.
* Security: Every table enforces Row Level Security (RLS).
* Migrations: Managed via versioned SQL files under `supabase/migrations/`.
