# 02 — SYSTEM ARCHITECTURE & MONOREPO AUDIT

**Domain:** Modular Monolith & Domain Boundaries  
**Auditor:** Distinguished Systems Architect & CTO  
**Status:** Substantially Sound (Score: 86/100)

---

## 1. Architectural Philosophy & Topological Review

TUKUBI is engineered as a **Modular Monolith** managed via **Turborepo** and **pnpm workspaces**. This approach isolates domain logic into discrete TypeScript packages while maintaining a unified type system and single deployment boundary.

```mermaid
graph TD
  Web[apps/web (Next.js 15)] --> UI[@caribbean/ui]
  Web --> DS[@caribbean/design-system]
  Web --> Social[@caribbean/social]
  Web --> SpotPay[@caribbean/spotpay]
  Web --> Creator[@caribbean/creator]
  Web --> Live[@caribbean/live]
  Web --> Podcasts[@caribbean/podcasts]
  Web --> Market[@caribbean/marketplace]
  Web --> AI[@caribbean/ai]
  Web --> DB[(Supabase PostgreSQL + RLS)]

  Mobile[apps/mobile (Expo RN)] --> SpotPay
  Mobile --> Social
  Mobile --> DB

  Admin[apps/admin] --> DB
  Mod[apps/moderation] --> DB
```

---

## 2. Monorepo Package Boundaries

The 23 packages in `packages/` maintain strict unidirectional dependencies:
- Core Abstractions (`@caribbean/database`, `@caribbean/design-system`, `@caribbean/localization`) have zero dependencies on other internal packages.
- Domain Packages (`@caribbean/spotpay`, `@caribbean/social`, `@caribbean/creator`, `@caribbean/marketplace`, `@caribbean/communities`) encapsulate domain invariants without importing UI components.
- Presentation Packages (`@caribbean/ui`) provide headless/styled components dependent only on design tokens.

### Architectural Invariant Compliance
- **Rule 1 (Inspect Before Modifying):** Packages avoid code duplication; shared utilities are centralized.
- **Rule 2 (Ledger Safety):** `@caribbean/spotpay` isolates double-entry mechanics from direct database mutations.
- **Rule 3 (Privacy of Identity):** `@caribbean/social` and `@caribbean/database` enforce private-by-default rules on Caribbean origin/location.

---

## 3. Identified Architectural Bottlenecks & Recommendations

1. **Direct PostgREST vs Service Layer:**
   - *Current:* Server actions in `apps/web/src/lib/*/actions.ts` perform direct PostgREST queries using `@supabase/ssr`.
   - *Risk:* Complex business logic (e.g. order fulfillment with ledger debit/credit) can become inconsistent across multiple action files.
   - *Recommendation:* Encapsulate multi-step write operations into Postgres transactional RPC functions or domain service handlers in `packages/api`.

2. **Realtime Scalability:**
   - *Current:* Live chat and messaging rely on Supabase Realtime websocket channels.
   - *Recommendation:* Ensure high-concurrency livestreams (10,000+ viewers) route chat through an external distributed pub/sub layer (Redis Streams / Ably / Cloudflare Calls) to prevent database connection exhaustion.
