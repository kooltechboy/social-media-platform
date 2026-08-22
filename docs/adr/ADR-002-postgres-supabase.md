# ADR-002 — PostgreSQL via Supabase as Primary Datastore

**Status:** Accepted
**Context:** The platform needs a relational social graph, transactional financial ledger, and row-level security as the enforcement boundary — plus managed Auth, Realtime, Storage, and Edge Functions for velocity.
**Decision:** Supabase PostgreSQL is the single transactional source of truth. All schema changes via versioned migrations in `supabase/migrations/`. RLS mandatory on every client-accessible table.
**Consequences:** Strong consistency for the ledger and graph; Realtime simplifies messaging. Vendor coupling mitigated by plain Postgres (portable) and logic kept in SQL/domain layers, not Supabase-client calls scattered in UI.
