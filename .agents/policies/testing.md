# Policy: Testing

1. Every feature ships with tests; Definition of Done requires them passing in CI.
2. RLS tests are mandatory for schema changes — positive and negative cases across roles.
3. Financial code requires the full payment test matrix (see engineering-operations.md) in sandbox.
4. Never skip or delete a test to pass CI; fix the code or prove the test wrong.
5. Test behavior, not implementation details.
6. E2E suites cover critical journeys only; keep them fast and reliable.
