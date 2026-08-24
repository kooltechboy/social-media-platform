# Engineering Operations: CI/CD & Testing Strategy — ANTILIA

## 1. CI/CD Pipeline (Phase 1 deliverable)

```
Pull Request
 ↓ Lint (prettier/eslint) → Type Check (turbo typecheck)
 ↓ Unit Tests (vitest) → Integration Tests
 ↓ Security Scan (dependency audit, SAST) → Build
 ↓ E2E (Playwright, against preview env)
 ↓ Preview Deployment (Vercel)
 ↓ Human Review (CODEOWNERS + agent review per AGENTS.md)
 ↓ Production (merge to main; auto-deploy w/ rollback)
```

- Production deploys must be rollback-capable (Vercel instant rollback + reversible migrations).
- Database migrations deploy **before** app code that depends on them (expand → migrate → contract pattern for zero-downtime changes).
- Financial-domain PRs additionally require SpotPay agent review + ledger test evidence (AGENTS.md review process).

## 2. Testing Strategy

| Layer | Tool | Scope |
| :--- | :--- | :--- |
| Unit | Vitest | domain logic, ledger math (integer minor units, sum-zero), policy engine routing |
| Integration | Vitest + Supabase local | service ↔ DB contracts, event consumers (idempotency) |
| Database/RLS | `packages/database` harness | every table: policy positive/negative cases as anon/authenticated/owner/service roles |
| API | Vitest | contract tests per `packages/api` schemas, authz denials, rate limits |
| E2E (web) | Playwright | register → profile → post → feed → community critical journeys |
| Mobile | Jest/Expo + E2E (Detox/Maestro later) | navigation, uploads, offline states |
| Security | dependency scan, SAST, periodic DAST | OWASP coverage per THREAT-MODEL.md |
| Performance | load tests (Phase 9) | feed p95, chat fan-out, media pipeline |
| Payments | sandbox suites | success, decline, timeout, duplicate, webhook retry, refund, partial refund, chargeback, provider outage, currency mismatch, invalid method, payout failure — **never against production credentials** |

## 3. Definition of Done (testing component)
A feature is not complete until: unit + RLS + integration tests exist and pass in CI; E2E covers the critical path; security-sensitive changes carry a security review note; failure/empty/loading states are tested, not just happy paths.

## 4. Known Gaps (from assessment — resolved 2026-08-20)
- ~~`test:e2e` script declared but Playwright not configured~~ — Playwright + Chromium installed; `tests/e2e/critical-journeys.spec.ts` (7 journeys) green; cross-platform webServer config in `playwright.config.ts`.
- ~~No CI provider configured~~ — GitHub Actions workflow live in `.github/workflows/ci.yml` (lint → typecheck → unit → build → E2E → audit).
