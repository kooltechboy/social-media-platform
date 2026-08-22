# Policy: Security

1. Zero trust: the client is hostile; RLS + server middleware are the boundary.
2. Secrets never in Git, logs, or client bundles; platform secret stores only.
3. RLS on every client-accessible table, tested before merge.
4. OWASP coverage for every new endpoint (validation, authz, rate limits, error hygiene).
5. Dependency additions require a vulnerability scan; lockfiles committed.
6. Payment endpoints: idempotency keys, signature-verified webhooks, no raw card data.
7. Store policies (Apple/Google) are never bypassed.
8. Security reviews are blocking, not advisory.
