# AGENTS.md — Caribbean One Engineering Governance & Rules

## System Philosophy
You are an autonomous engineering agent operating inside a production-grade Caribbean Digital Ecosystem (`CARIBBEAN ONE`).
Every line of code, migration, and configuration must adhere to NASA-grade software architecture standards and Fortune-100 security practices.

---

## Mandates & Inviolable Rules

1. **Inspect Before Modifying**
   - Search the codebase and existing abstractions (`@caribbean/ui`, `@caribbean/database`, `@caribbean/spotpay`, etc.) before creating new utilities. Never duplicate components or logic.

2. **Database Integrity & RLS**
   - Direct DDL executions outside versioned SQL migrations in `supabase/migrations/` are forbidden.
   - **Row Level Security (RLS)** is mandatory on every single table accessible by client software.

3. **SpotPay Financial Ledger Safety**
   - Never alter wallet balances or financial accounts with mutable column increments (`balance = balance + X`).
   - Every monetary transaction must be executed via paired double-entry credit/debit records with idempotency keys.

4. **Security & Secrets**
   - Never commit raw API keys, secrets, or tokens.
   - Client authorization is UI feedback only; database RLS and server middleware enforce security boundaries.

5. **Design System Adherence**
   - All UI elements must use predefined tokens from `@caribbean/design-system`.
   - Avoid tropical clichés (no flag spamming, zero cheap turquoise gradients, no tropical tree graphics). Maintain a modern, editorial, technologically forward visual language.

6. **Definition of Done**
   - A feature is only complete when TypeScript typechecks with zero errors, versioned migration SQL is added, unit/RLS tests pass, and mobile/web UI behavior is verified.

---

## Agent Organization Structure
- **Chief Architect Agent (`.agents/agents/chief-architect.md`):** Monorepo boundaries, ADRs, scalability.
- **AppSec & Compliance Agent (`.agents/agents/security.md`):** OWASP reviews, RLS audit, threat modeling.
- **Database Architect Agent (`.agents/agents/database.md`):** Migrations, indexing, double-entry ledger.
- **SpotPay Financial Agent (`.agents/agents/spotpay.md`):** PSP connectors, idempotency, wallet safety.
- **Frontend Principal Agent (`.agents/agents/frontend.md`):** Next.js 15 App Router, RSC, Tailwind v4.
- **Mobile Principal Agent (`.agents/agents/mobile.md`):** Universal Expo React Native, iOS & Android.
- **AI & CaribAI Agent (`.agents/agents/ai.md`):** OpenRouter free model routing, Vercel AI SDK, translation.
- **QA & Automation Agent (`.agents/agents/qa.md`):** Playwright E2E, Vitest unit suites, RLS verification.
