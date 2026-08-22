# Workflow: Security Review

**Trigger:** any change to auth, sessions, RLS policies, payments, webhooks, moderation, PII handling, dependencies with security relevance.

1. Map the change against THREAT-MODEL.md STRIDE categories.
2. Verify: RLS policies tested (positive + negative), input validation, rate limits, secrets handling, webhook signature verification.
3. Financial changes: idempotency coverage, ledger invariant tests, store-policy routing compliance.
4. AI changes: prompt-injection surface, PII-in-prompt audit.
5. Outcome: APPROVED / CHANGES REQUIRED with findings tracked to closure.

Never approve by assumption — evidence (tests, logs) required.
