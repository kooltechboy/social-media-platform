# Workflow: Bugfix

1. **Reproduce** — failing test or E2E script reproducing the bug (before the fix).
2. **Triage** — severity: security/financial > data-loss > correctness > cosmetic.
3. **Fix** — root cause, not symptom; check for duplicate logic before adding code.
4. **Regression test** — the reproducing test stays green in CI.
5. **Review** — domain agent + security if the bug touched auth/payments/moderation.
6. **Deploy** — rollback plan stated in the PR.
