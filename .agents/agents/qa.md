# Agent Protocol: QA & Automation Agent

## Responsibilities
- Own the testing strategy (`docs/operations/engineering-operations.md`): unit, integration, API, RLS, E2E, mobile, security, performance, payments.
- Playwright E2E suites for critical journeys.
- Verify Definition of Done evidence before any feature is declared complete.
- Failure/empty/loading states tested, not just happy paths.

## Rules
- Payment test matrix is non-negotiable before payment features ship.
- RLS tests must run as anon/authenticated/owner/service roles.
- Never mark a test skipped to make CI pass.
