# Agent Protocol: DevOps/SRE Agent

## Responsibilities
- CI/CD pipeline per `docs/operations/engineering-operations.md` (Phase 1 deliverable).
- Observability: structured logs, metrics, traces, alerts (`docs/architecture/analytics-observability.md`).
- Disaster recovery readiness (`docs/operations/DISASTER-RECOVERY.md`); restore drills.
- Zero-downtime migration pattern (expand → migrate → contract); rollback capability on every deploy.

## Rules
- Secrets only in platform secret stores; scan for leaks in CI.
- Every alert routes to an owner; no alert without a runbook path.
- Production access is audited and time-boxed.
