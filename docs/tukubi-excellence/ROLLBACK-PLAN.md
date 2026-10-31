# TUKUBI — Rollback Strategy & Emergency Cutover Plan
## Document Reference: TUKUBI-EXCELLENCE-ROLLBACK-001

### 1. Inviolable Governance Principles
1. **Zero Data Loss:** No database migration shall execute non-reversible column drops or destructive modifications without an automated pre-migration snapshot and companion down-migration.
2. **Git Snapshotting:** Every phase transition and significant architectural change is anchored to a verified commit checkpoint.
3. **Idempotent Migrations:** All SQL scripts in `supabase/migrations/` must be idempotent (`CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`, `DO $$ BEGIN ... END $$`).

---

### 2. Checkpoint Ledger & Recovery Targets

| Target Checkpoint | Git Hash / Branch | State Description | Rollback Command |
| :--- | :--- | :--- | :--- |
| **Pre-Flight Baseline** | `9026013` on `main` | Working tree clean, 2,336 Vitest tests passing, 31 packages typechecking clean | `git checkout main && git reset --hard 9026013` |
| **Supabase Database** | Migration `00116` | 118 migrations applied cleanly | Rollback via down SQL scripts in `supabase/migrations/rollback/` |
| **Vercel Web Deployment** | Current Production Deployment | Production deployment on `tukubi.com` | Instant rollback via Vercel Dashboard / CLI `vercel rollback <deployment-id>` |

---

### 3. Service Disaster Recovery & Triage Matrix

```
[Defect Detected]
       │
       ▼
Is it P0 (Crash, Security Leak, Data Corruption)?
 ├── YES ──► 1. Stop deployment pipeline
 │           2. Revert to latest stable git checkpoint
 │           3. Re-run `check:prohibited` and `turbo run typecheck`
 │           4. Re-run `vitest run`
 │           5. Re-deploy verified build
 └── NO  ──► 1. Isolate defect in test case
             2. Apply minimal targeted hotfix
             3. Verify with regression test suite
```

---

### 4. Financial Ledger Safety & Reconciliation Guardrails
In the event of payment or webhook anomalies:
1. Immediately pause automated payouts in `packages/payments`.
2. Inspect double-entry balance table (`ledger_entries`) vs running cache.
3. Execute reconciliation script `scripts/reconcile-financial-ledger.ts` to detect minor unit discrepancies.
4. Issue manual compensations only through double-entry credit/debit records; NEVER mutate balance columns directly.
