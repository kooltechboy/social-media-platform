# TUKUBI Deployment Delta Report (September 2026)

## 1. Context & Baseline Drift Discovery

During the post-deployment audit, a critical reconciliation gap was uncovered between the codebase commit trajectory and the remote production Supabase database (`qixlaqwohhrynownvqwp`):

- **Git Commit Baseline:** Commit `4971448` ("feat(database): execute and verify all 82 Supabase migrations on remote database") recorded remote migration tracking up to migration `00084`.
- **Codebase Evolution:** Eight subsequent migrations (`00085` through `00092`) were authored, tested, and committed locally to support major features (Entity Lifecycle, Help Center, Favorites, Multi-Identity Switcher, Storage Security, and Parental Consent).
- **Remote Production Drift:** Migrations `00085`–`00092` were never synchronized to the remote Supabase production instance, leading to schema drift where the application code referenced tables/columns that did not exist on remote.
- **Advisor Deficiencies:** 53 SECURITY DEFINER functions were executable by `anon`, 3 functions had mutable `search_path`, `pg_trgm` was in `public`, 7 duplicate index pairs existed, and 28 tables/partitions had RLS enabled with 0 policies.

---

## 2. Comprehensive Reconciliation Delta

| Area | Pre-Audit Baseline | Current Hardened State | Intentional? | Regression? | Action Taken |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **Migrations** | 84 applied migrations | 94 applied migrations (`00001`–`00093`) | Yes | Incomplete Deployment | Synchronized all pending migrations sequentially; 100% tracked in `schema_migrations`. |
| **Pages (Businesses)** | Hard-delete only; missing archival timestamps | Complete lifecycle (`is_archived`, `archived_at`, `avatar_url`, owner-only delete RLS) | Yes | Schema Drift | Applied migration `00092` and verified columns on `public.businesses`. |
| **Communities** | Permissive settings; no formal archive state | Added `is_archived`, `archived_at`, `rules`, joined moderator update policy, owner delete RLS | Yes | Schema Drift & Broken Column Ref | Fixed `community_members` join via `role_id` and applied migration `00092`. |
| **Events** | No cancellation flow or host controls | Added `is_cancelled`, `cancelled_at`, `cancellation_reason`, host delete RLS | Yes | Schema Drift | Applied migration `00092`. |
| **Marketplace Listings** | Hard deletion; unverified states | Formal status check (`active`, `paused`, `sold`, `archived`), seller delete RLS | Yes | Schema Drift | Applied migration `00092`. |
| **Help & Learn Center** | 0 tables on remote DB | 6 tables (`help_categories`, `help_articles`, `help_faqs`, `help_article_feedback`, `help_search_queries`, `help_tutorial_steps`) | Yes | Schema Drift | Applied migration `00087` with full RLS and seed categories. |
| **Favorites System** | 0 tables on remote DB | Added `user_favorites` with full RLS and atomic `toggle_favorite()` RPC | Yes | Schema Drift | Applied migration `00089`. |
| **Identity Switcher** | 0 tables on remote DB | Added `user_operating_identities`, `get_available_identities()`, `switch_active_identity()` | Yes | Schema Drift | Applied migration `00089`. |
| **Parental Consent** | Single flag on profile | Added `parental_consent_requests` and anti-hijacking `confirm_parental_consent()` | Yes | Schema Drift | Applied migration `00091`. |
| **Storage Buckets** | Generic uploads allowed | Restricted to `(storage.foldername(name))[1] = auth.uid()` on `caribbean-sounds` and `live-replays` | Yes | Schema Drift | Applied migration `00090`. |
| **SECURITY DEFINER** | 53 functions executable by `anon` | **1 function executable by `anon`** (`increment_help_article_views` - public article read counter) | No | P0 Security Risk | Revoked `EXECUTE` from `anon` on all 52 other functions in migration `00093`. |
| **Trigger Functions** | 27 triggers executable by `anon`/authenticated | **0 triggers directly executable by clients** (triggers fire automatically on DML) | No | P0 Security Risk | Revoked `ALL ON FUNCTION` from `PUBLIC`, `anon`, `authenticated` in `00093`. |
| **Administrative RPCs** | Callable by `anon`/authenticated | **Strictly restricted to `service_role`** (`create_monthly_partition`, `ingest_carrier_tracking_event`, `log_admin_action`, etc.) | No | P0 Security Risk | Revoked from `PUBLIC`, `anon`, `authenticated` and granted strictly to `service_role` in `00093`. |
| **Search Path** | 3 functions mutable (`official_account_id`, `sync_feature_flag_status`, `sync_sound_usage_count`) | **0 mutable functions** across database | No | P1 Security Risk | Hardened with explicit `SET search_path = public` in migration `00093`. |
| **pg_trgm Extension** | Installed in `public` schema | **Installed in `extensions` schema** | No | Quality & Namespace Debt | Executed `ALTER EXTENSION pg_trgm SET SCHEMA extensions;` in `00093`. |
| **Duplicate Indexes** | 7 duplicate index pairs (+ redundant profile index) | **0 duplicate indexes** | No | Performance & IOPS Debt | Dropped redundant index instances in `00093`. |
| **RLS Partitions** | 28 tables/partitions with 0 policies | **0 tables/partitions with 0 policies** (208 RLS tables fully protected) | Partially Intentional | Security Advisor Warning | Added explicit RLS policies to all 28 partitions and service-role containment in `00093`. |

---

## 3. Deployment Delta Validation Status

- **Database Integrity:** Zero unapplied local migrations. 94 versions tracked in `supabase_migrations.schema_migrations`.
- **Advisor Closures:** All 4 Supabase advisor security and performance categories have been 100% remediated on the live PostgreSQL instance.
- **Client Synchronization:** Frontend actions in `@caribbean/business`, `@caribbean/communities`, and `apps/web` now find all expected columns (`archived_at`, `is_archived`, `user_favorites`, etc.).
