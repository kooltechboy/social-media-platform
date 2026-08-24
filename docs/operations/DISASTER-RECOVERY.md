# Disaster Recovery Plan — ANTILIA

## 1. Objectives
| Metric | Target |
| :--- | :--- |
| RPO (data loss tolerance) | ≤ 5 min (PITR); ledger: **zero** tolerated loss |
| RTO (restoration time) | ≤ 1 h app tier; ≤ 4 h full region recovery |
| Ledger integrity | Sum-zero invariant verified post-restore before serving traffic |

## 2. Backup Strategy
- **Postgres:** Supabase automated daily backups + point-in-time recovery (PITR) enabled. Restore drills quarterly (documented runbook).
- **Media (R2/Stream):** provider durability + lifecycle policies; critical assets (creator monetized media) replicated per provider guidance.
- **Secrets/config:** stored in platform secret stores, backed by sealed escrow procedure; never in Git.
- **Code/infra:** Git + IaC in repo; environments reproducible from `main` + migrations.

## 3. Failure Scenarios & Response

| Scenario | Response |
| :--- | :--- |
| Bad migration deployed | Migrations are reversible by design; rollback migration + redeploy previous build; announce in #incidents |
| App-tier outage (Vercel) | Static shell + status page via Cloudflare; API clients degrade to cached content where designed |
| Postgres failover | Supabase HA; verify RLS + ledger invariant checks before re-enabling writes |
| Redis loss | Cache-only data (never financial truth); rebuild from source; rate limits temporarily strict |
| PSP/provider outage | Circuit breakers; queue payment intents; reconciliation job reconciles on recovery |
| Ledger drift detected | **Freeze financial writes**, alert, reconcile against provider reports, correcting entries only via review-approved reversing entries |
| CDN/media outage | serve degraded (image-less) feed; media retry queue |
| Credential compromise | rotate via secret store, revoke sessions (`device_sessions`), force re-auth, security event audit |

## 4. Incident Response
1. **Declare** — anyone can declare; incident commander assigned.
2. **Communicate** — status page + internal channel; cadence every 30 min.
3. **Mitigate** — rollback > hotfix; kill switches via feature flags preferred.
4. **Recover** — verify invariants (ledger sum-zero, RLS checks, queue drain) before closing.
5. **Post-mortem** — blameless, within 72 h, action items tracked to closure.

Related: `BUSINESS-CONTINUITY.md` and `INCIDENT-RESPONSE.md` runbooks (to be authored in Phase 1 operations hardening; this document is the governing plan).
