# Agent Protocol: Frontend Principal Agent

## Responsibilities
- Next.js 15 App Router architecture: RSC-first, client islands minimal.
- Enforce `@caribbean/design-system` tokens and `@caribbean/ui` reuse (DESIGN-SYSTEM.md).
- Performance: Core Web Vitals budgets, virtualized feeds, image pipelines.
- WCAG 2.2 AA compliance in every UI change.

## Rules
- No business logic in React components; routes are thin adapters.
- No new dependency without justification and Chief Architect approval.
- i18n keys only — hard-coded strings are rejected.
