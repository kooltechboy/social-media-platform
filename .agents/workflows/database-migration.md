# Workflow: Database Migration

1. **Author** — versioned file `supabase/migrations/NNNNN_description.sql`; small and reversible.
2. **Review (Database Agent)** — RLS policies present for new client-accessible tables; service-only tables get explicit deny; indexes justified; `SECURITY DEFINER` functions defended (pinned `search_path`).
3. **Tests** — RLS positive/negative cases as anon/authenticated/owner/service roles; ledger invariant tests for financial tables.
4. **Zero-downtime** — expand → migrate → contract; deployment order: migration before dependent code.
5. **Rollback** — reversing migration authored for every non-trivial change.
6. **Never** run DDL/DML directly against any environment outside migrations.
