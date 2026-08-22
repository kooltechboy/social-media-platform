# ADR-009 — Immutable Double-Entry Ledger for All Money Movement

**Status:** Accepted
**Context:** Mutable balance columns are an accounting and security failure mode (lost history, race conditions, unauditable drift).
**Decision:** All balances derive from append-only paired debit/credit `ledger_entries` with DB-enforced sum-zero per transaction, idempotency keys on every financial API, integer minor units, and scheduled provider reconciliation. Refunds/failures are reversing entries.
**Consequences:** Auditable by construction; drift detectable and alertable. Slightly higher write amplification — acceptable. Financial writes freeze on invariant violation (see DISASTER-RECOVERY.md).
