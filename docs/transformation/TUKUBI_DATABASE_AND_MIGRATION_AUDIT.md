# TUKUBI Database & Migration Audit (`TUKUBI_DATABASE_AND_MIGRATION_AUDIT.md`)

**Program:** `TUKUBI-RTP-001` (Phase 1 Forensic Audit & Phase 2 Additive Migration Specification)  
**Date:** 2026-10-12  
**Mandates:** `AGENTS.md` Mandate 2 (*Database Integrity & RLS*) & Mandate 3 (*Double-Entry Financial Ledger Safety*)  
**Scope:** `supabase/migrations/` (108 migration files `00001`–`00107`, including dual `00089`), `packages/database/src/index.ts`

---

## 1. Migration & Schema Forensic Summary

1. **Migration Inventory:** 108 versioned SQL migration files exist in `supabase/migrations/`.
2. **Duplicate Version Prefix (`00089`):** `00089_favorites_and_identity_switcher.sql` and `00089_post_media_url_and_type_compatibility.sql` share prefix `00089`. Both are preserved in place for backward compatibility with existing migration history tables (`supabase_migrations.schema_migrations`), and all new migrations use strictly monotonic prefixes starting at `00108`.
3. **RLS Base Table Coverage:** Every base table in `public` has `ENABLE ROW LEVEL SECURITY`. However, post-`00093` migrations introduced specific policy and `SECURITY DEFINER` regressions documented below.

---

## 2. Ranked Database & RLS Defects (`P0` / `P1` / `P2`)

| ID | Severity | File & Line Reference | Defect Description | Additive Remediation (`00108`) |
| :--- | :---: | :--- | :--- | :--- |
| **DB-P0-01** | **P0** | `00102_social_commerce_and_product_tagging.sql:123-320` | `public.place_order_with_escrow` is `SECURITY DEFINER` and granted to `authenticated`, accepting client-supplied prices and creating `'paid'` orders without verifying `products.price_minor` or payment settlement. | Revoke `EXECUTE` from `PUBLIC`, `anon`, and `authenticated` (`GRANT EXECUTE ... TO service_role`) and enforce server-side price computation from `public.products.price_minor` inside the function. |
| **DB-P0-02** | **P0** | `00103_events_and_community_relief.sql:176-232, 349-365` | `public.relief_donations` grants `INSERT` to `anon` and `authenticated` (`WITH CHECK (donor_id IS NULL OR donor_id = auth.uid())`), triggering `handle_relief_donation_insert()` which increments `relief_campaigns.raised_minor` without verifying payment settlement. | Revoke `INSERT` on `public.relief_donations` from `anon` and `authenticated`; restrict inserts to `service_role` (verified server-side payment flow). |
| **DB-P0-03** | **P0** | `00057_creator_platform_hardening.sql:60-71` & `actions.ts:80-730` | `public.creator_content_drafts` lacks lifecycle columns (`status`, `idempotency_key`, `published_post_id`), and `createPostAction` never marks drafts as published or discarded—leaving stale server draft reminders on `/create`. | Add `status`, `idempotency_key`, `published_post_id`, `external_media`, `poll_payload`, `tagged_product_ids`, and `last_error` columns to `public.creator_content_drafts`. |
| **DB-P1-01** | **P1** | `00106_block_tester_accounts_posting.sql:31-57` | `public.prevent_banned_tester_posts()` is `SECURITY DEFINER` without `SET search_path = public, pg_temp` and without `REVOKE ALL ... FROM PUBLIC, anon, authenticated`. | Set `search_path = public, pg_temp` and revoke `EXECUTE` from `PUBLIC, anon, authenticated` on all post-`00093` trigger functions. |
| **DB-P1-02** | **P1** | `00097_publisher_identity_and_content_distribution.sql:299-444` | `public.get_available_identities(p_user_id UUID)` (`SECURITY DEFINER`) never checks `p_user_id = auth.uid()`, allowing an authenticated user to enumerate another user's pages, business roles, and official account operator assignments (IDOR). | Enforce `IF auth.role() <> 'service_role' AND p_user_id IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'Access denied'; END IF;` inside `get_available_identities`. |
| **DB-P1-03** | **P1** | `00097_publisher_identity_and_content_distribution.sql:201-211` | `public.can_publish_as('community', ...)` only checks `membership_status = 'active'` without requiring `role IN ('admin', 'moderator')` or `creator_id = p_user_id`. | Update `can_publish_as` so publishing as a `'community'` identity requires `cm.role IN ('admin', 'moderator')` or `c.creator_id = p_user_id`. |
| **DB-P1-04** | **P1** | `00076_table_partitioning.sql:128-129` & `00093:357-358` | `feed_activity_timeline` and its monthly partitions allow `INSERT WITH CHECK (true)` to `authenticated`/`PUBLIC`. | Restrict `feed_activity_timeline` and partition `INSERT` policies to `service_role` (or `user_id = auth.uid()`). |
| **DB-P1-05** | **P1** | `00107:87-90`, `00085:157-158`, `00028:139` | `post_external_media`, `sound_licenses`, and `affiliate_referrals` use `FOR SELECT USING (true)`. | Scope `post_external_media` `SELECT` policy to visible parent posts; scope `sound_licenses` and `affiliate_referrals` to owner/admin/`service_role`. |
| **DB-P2-01** | **P2** | `packages/database/src/index.ts:3-32` | `Table` union type in `@caribbean/database` omits 15 tables added in migrations `00094`–`00107`. | Add all 15 missing table names to `packages/database/src/index.ts`. |
