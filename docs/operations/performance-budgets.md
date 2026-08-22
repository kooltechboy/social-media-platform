# Performance Budgets — CARIBBEAN ONE

Enforced in review (Performance Agent) and validated in CI/load tests where measurable. Regression beyond threshold blocks release unless explicitly waived with rationale.

## Web (Core Web Vitals — mobile, mid-range Android, 3G-class)
| Metric | Budget |
| :--- | :--- |
| LCP | ≤ 2.5 s |
| INP | ≤ 200 ms |
| CLS | ≤ 0.1 |
| Initial JS (route) | ≤ 200 KB gzipped |
| Feed TTI | ≤ 3 s |

## Mobile app
| Metric | Budget |
| :--- | :--- |
| Cold start (mid-range Android) | ≤ 3 s |
| List scroll jank | ≥ 55 fps sustained |
| Feed page memory | Unbounded lists forbidden (FlashList/FlatList virtualization mandatory) |

## API
| Endpoint class | p95 | p99 |
| :--- | :--- | :--- |
| Feed read (cached candidates) | ≤ 400 ms | ≤ 800 ms |
| Feed read (cold) | ≤ 800 ms | ≤ 1.5 s |
| Profile read | ≤ 300 ms | ≤ 600 ms |
| Post create (sync part) | ≤ 500 ms | ≤ 1 s |
| Message send | ≤ 300 ms | ≤ 700 ms |

## Database
| Signal | Budget |
| :--- | :--- |
| Feed query (index-backed) | ≤ 25 ms typical |
| RLS policy overhead | ≤ 10% of query time |
| Cache hit rate (Redis, feed candidates) | ≥ 90% steady state |

## Financial paths (correctness over latency)
Ledger writes are transactionally safe first; the budget is p99 ≤ 2 s for intent creation including idempotency check. Reconciliation jobs are async and not latency-budgeted.

## Measurement
- k6 profiles: `tests/performance/k6-feed.js` (thresholds encoded).
- Load evidence accumulates in `docs/operations/extraction-evidence.md` and gates service extraction decisions (ADR-003).
