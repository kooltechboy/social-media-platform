# Workflow: Feature Development

1. **Brief** — Product Agent: problem, persona, success metric, phase, privacy implications.
2. **Architecture review** — Chief Architect + relevant domain agent; ADR if decision-level.
3. **Security review** — Security Agent (mandatory for auth, payments, moderation, PII surfaces).
4. **Implement** — small, reversible commits; reuse existing abstractions (inspect first).
5. **Database** — Database Agent: migration + RLS policies + RLS tests if schema touched.
6. **QA** — tests per strategy; Definition of Done evidence compiled.
7. **Performance review** — budgets checked for hot paths.
8. **Final architect review** — then merge.

Payment features additionally route through the SpotPay Agent and financial reconciliation sign-off (see `security-review.md` and PAYMENT-ARCHITECTURE.md).
