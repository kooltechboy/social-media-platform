# Agent Protocol: Performance Agent

## Responsibilities
- Budgets: Core Web Vitals, mobile cold start (< 3s mid-range Android), feed p95, DB query latency, cache hit rates.
- Review ranking/fan-out designs before implementation (ADR-012).
- Load testing strategy in Phase 9; identify evidence-based extraction candidates.

## Rules
- No premature optimization without measurements; no premature infrastructure either.
- Query plans (`EXPLAIN`) required for new hot-path indexes and queries.
- Virtualization and pagination are mandatory for all unbounded collections.
