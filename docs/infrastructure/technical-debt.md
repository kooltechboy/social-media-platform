# TUKUBI Technical Debt Register & Remediation Roadmap

**Status:** Updated Post-Remediation  
**Version:** September 2026 Master Baseline  

---

## 1. Resolved Technical Debt (P0 — Completed in Migration 00093)

| ID | Finding Description | Severity | Remediation Strategy | Resolution Evidence |
| :--- | :--- | :---: | :--- | :--- |
| **DEBT-01** | Database divergence: remote DB stuck at migration 00084 while local repository had 00085–00092. | P0 | Applied migrations 00085 through 00092 to remote PostgreSQL 17 database via authenticated runner. Fixed column reference in 00092. | 94 total migrations tracked in `supabase_migrations.schema_migrations`. |
| **DEBT-02** | 7 duplicate index pairs causing unnecessary write amplification and storage waste. | P0 | Dropped redundant duplicate indexes (`idx_events_starts`, `idx_message_attachments_message`, `idx_message_receipts_message`, `idx_message_requests_conversation`, `idx_post_reactions_unique_user`, `idx_posts_country_created`, `idx_videos_kind`, and redundant `idx_profiles_origin_country`). | 0 duplicate indexes verified via PostgreSQL catalog query. |
| **DEBT-03** | 3 functions had mutable `search_path` (`official_account_id`, `sync_feature_flag_status`, `sync_sound_usage_count`). | P0 | Altered all 3 functions with `SET search_path = public`. | 0 mutable functions remaining in `public` schema. |
| **DEBT-04** | Extension `pg_trgm` installed in `public` schema instead of `extensions`. | P0 | Relocated extension via `ALTER EXTENSION pg_trgm SET SCHEMA extensions;`. | 0 extensions residing in `public`. |
| **DEBT-05** | 53 `SECURITY DEFINER` functions exposed to `anon` and arbitrary execution. | P0 | Revoked `EXECUTE` from `PUBLIC`, `anon`, and `authenticated` on 27 internal triggers. Revoked `EXECUTE` from `anon` on all remaining sensitive RPCs. Restricted 8 administrative RPCs strictly to `service_role`. | Exactly 1 safe public view counter accessible to `anon`. |
| **DEBT-06** | 28 partitions and internal tables had RLS enabled but 0 policies, triggering security advisor warnings. | P0 | Created explicit RLS policies for `reconciliation_reports` (service_role), all monthly partitions of `analytics_events_2026_*`, `chat_messages_p[0-7]`, and `feed_activity_timeline_2026_*`. | 0 tables with RLS enabled and 0 policies (down from 28). |
| **DEBT-07** | Prohibited legacy payment processor references. | P0 | Codebase scanned and verified with zero violations across all 31 monorepo packages. | `pnpm check:prohibited` passes with 0 violations. |

---

## 2. Near-Term Technical Debt (P1 — Scheduled for Q4 2026)

- **DEBT-P1-01: Automated Partition Pre-Provisioning Worker**
  - *Context:* Monthly partitions are currently provisioned up to December 2026.
  - *Action:* Configure a scheduled GitHub Action or Edge Cron running on the 25th of each month calling `public.create_monthly_partition` for month $M+1$.
- **DEBT-P1-02: Cold Storage Data Archival**
  - *Context:* Historical `analytics_events` older than 180 days occupy active database storage.
  - *Action:* Implement automated detach and Parquet export pipeline to AWS S3 Glacier.
- **DEBT-P1-03: Supavisor Connection Pool Tuning**
  - *Context:* Surge events during regional festivals (Trinidad Carnival, Crop Over, Junkanoo) cause connection spikes.
  - *Action:* Tune Supavisor transaction pool mode limits to 500 connections with max client timeout at 3000ms.

---

## 3. Medium-Term Enhancements (P2 — Scheduled for 2027)

- **DEBT-P2-01: Dedicated Read Replica Routing**
  - *Context:* Analytics queries in `apps/admin` compete for CPU with transaction processing.
  - *Action:* Direct read-only analytics dashboards to Supabase Read Replicas in `us-east-1`.
- **DEBT-P2-02: Edge Image Transformation Caching**
  - *Context:* Media carousels and aspect ratio crops are currently generated on-demand.
  - *Action:* Enforce aggressive Cloudflare Edge caching with 30-day immutable cache headers for media thumbnails.

---

## 4. Housekeeping (P3)

- **DEBT-P3-01: Test Environment Migration Squashing**
  - *Context:* 94 individual migration files increase CI local test initialization time.
  - *Action:* Author a squashed baseline (`00001_initial_squashed_baseline.sql`) for local containerized CI while preserving remote production migration history.

---

## 5. Architectural KEEP Register (Inviolable Patterns)

The following core architectural patterns are designated **PERMANENT KEEP** and must never be refactored away:
1. **KEEP: Double-Entry Immutable Financial Ledger:** Zero mutable column increments. Every cent is accounted for via paired debit/credit records.
2. **KEEP: Universal Row-Level Security:** 100% of public tables and partitions must enforce RLS.
3. **KEEP: Hash Partitioned Messaging (`chat_messages_p0..p7`):** Guarantees zero locking contention across high-volume chat threads.
4. **KEEP: Island Vibes Design System Tokens:** The authentic Caribbean Futurism aesthetic (`@caribbean/design-system`) remains the core brand differentiator.
