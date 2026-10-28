---
title: "TESTING_STRATEGY — Quality Gates, Unit/Integration Suites, RLS & Browser Verification"
type: testing-strategy
status: verified
owner: QA & Release Automation Lead
created: 2026-10-28
updated: 2026-10-28
tags:
  - tukubi
  - testing
  - vitest
  - playwright
  - rls
  - quality-gates
related:
  - "[[TUKUBI Engineering Intelligence]]"
  - "[[07 Security and Privacy/SECURITY_THREAT_MODEL]]"
---

# TESTING_STRATEGY — TUKUBI

## 1. Multi-Layer Verification Pyramid

TUKUBI enforces a 5-layer automated verification strategy before any change is certified:

1. **Zero-Tolerance Policy Gate (`pnpm check:prohibited`):**
   - Scans the entire repository (`apps/`, `packages/`, `supabase/`, `docs/`, `TUKUBI Engineering Intelligence/`) to guarantee zero occurrences of prohibited payment references or obsolete brand identifiers in source code.
2. **Monorepo Type Safety (`pnpm typecheck`):**
   - Runs `tsc --noEmit` across all **31 workspace packages and applications** (`6 apps` + `25 packages`).
3. **Static Analysis & React Hook Safety (`pnpm lint`):**
   - Enforces ESLint rules across workspace packages and `apps/web`, with **0 errors and 0 warnings** (all 12 pre-existing `react-hooks/exhaustive-deps` and stale-ref cleanup warnings in `apps/web/src/components/**` were fixed in Phase 6).
4. **Unit, Contract, Security & RLS Regression Suite (`pnpm test:unit`):**
   - Executes **213+ test files** (`2,300+ assertions`) via Vitest (`vitest.config.ts`), covering:
     - Double-entry ledger invariants (`packages/ledger`, `packages/payments`)
     - PayPal order creation, capture verification, and webhook idempotency (`tests/unit/giant-among-giants-hardening.test.ts`, `packages/payments/src/__tests__/`)
     - Ad auction, budget pacing, moderation gating, and server-side CPM calculation (`packages/advertising`, `tests/unit/tukubi-ads-hardening.test.ts`)
     - Database migration & RLS static/contract verification (`tests/rls/`, `tests/security/`, `tests/unit/giant-among-giants-hardening.test.ts`)
     - Social feed hydration, Page publishing, Shorts actions, messaging, and Help Center search (`tests/unit/`)
     - WCAG 2.2 AA contrast ratios across `Island Vibes`, `Island Daylight`, and mobile screens (`tests/unit/giant-among-giants-hardening.test.ts`)
5. **End-to-End Browser Verification (`Playwright` — `playwright.config.ts`):**
   - E2E suites in `tests/e2e/` (`smoke.spec.ts`, `core-journeys.spec.ts`, `accessibility.spec.ts`, `social-feed-interactions.spec.ts`, `payments-wallet.spec.ts`, `admin-moderation.spec.ts`).

---

## 2. Verification Commands & Expected Outputs

| Command | Scope | Pass Criterion |
|---|---|---|
| `pnpm check:prohibited` | Entire repository | `[PASS] Zero prohibited terms or obsolete brand strings found.` |
| `pnpm typecheck` | 31 Turborepo tasks | `31 successful, 31 total` (`0` TypeScript errors) |
| `pnpm lint` | Workspace lint tasks | `5 successful, 5 total` (`0` errors, `0` warnings) |
| `pnpm test:unit` | Vitest unit & contract suites | `100%` passing test files and assertions |
| `node scripts/code-intelligence/generate-codebase-graph.js` | Codebase Knowledge Graph | Generates `TUKUBI Engineering Intelligence/03 Codebase Intelligence/graph.json` |
