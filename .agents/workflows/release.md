# Workflow: Release

1. **Scope** — changes since last release; feature flags state documented.
2. **Gates** — CI green (lint, typecheck, unit, integration, security scan, build, E2E on preview).
3. **Migration check** — all migrations applied to staging and verified there first.
4. **Deploy** — production with rollback path confirmed (Vercel rollback + reversing migrations).
5. **Verify** — smoke checks on critical journeys; ledger invariant check for financial releases.
6. **Monitor** — error rate, latency, payment success rate watched for 1 h post-deploy.
7. **Kill switches** — feature flags allow instant disable without redeploy.

Rollback is always preferred over hotfix-under-pressure.
