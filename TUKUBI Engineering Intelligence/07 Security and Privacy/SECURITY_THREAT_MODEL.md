---
title: "SECURITY_THREAT_MODEL — AppSec, RLS Audit, Payment Integrity & Remediations"
type: security-threat-model
status: verified
owner: AppSec & Compliance Lead
created: 2026-10-28
updated: 2026-10-28
tags:
  - tukubi
  - security
  - threat-model
  - rls
  - owasp
  - paypal
related:
  - "[[TUKUBI Engineering Intelligence]]"
  - "[[06 Database and APIs/DATA_MODEL]]"
---

# SECURITY_THREAT_MODEL — TUKUBI

## 1. Threat Modeling Scope & Trust Boundaries

1. **Untrusted Browser / Mobile Client Boundary:**
   - Client state, URL query parameters, form inputs, and PostgREST direct RPC calls using the `anon` or `authenticated` JWT key are treated as untrusted.
2. **Next.js Edge Middleware & Server Actions Boundary:**
   - Enforces authentication (`supabase.auth.getUser()`), CSRF origin validation, sliding-window rate limits, and Admin `AAL2` MFA.
3. **Database RLS & `SECURITY DEFINER` RPC Boundary:**
   - Every table in `public` must have `ROW LEVEL SECURITY` enabled.
   - Every `SECURITY DEFINER` function must set `search_path = public, pg_temp`, validate `auth.uid()`, and restrict `EXECUTE` grants.
4. **Payment Provider & Webhook Boundary:**
   - Client redirects (`/api/payments/paypal/capture`) and asynchronous webhooks (`/api/payments/webhooks/paypal`) must never trust client-supplied amounts, order IDs, or statuses without server-to-server verification and idempotent double-entry settlement.

---

## 2. Forensic Security Findings & Remediations Executed

| ID | Severity | Vulnerability Observed | Affected Files / Objects | Remediation Implemented & Verified |
|---|---|---|---|---|
| **SEC-01** | **P0 Critical** | `record_ad_impression_and_spend` was `SECURITY DEFINER` granted to `anon`/`authenticated` and trusted caller-supplied `p_cost_minor`, allowing budget drain or negative spend (`funded_amount_minor` inflation). | `00114_tukubi_ads_production_hardening.sql`, `/api/ads/impression` | Restricted `EXECUTE` to `service_role` in `00115_security_ads_and_rpc_hardening.sql`; server computes CPM from `ad_sets.bid_amount_minor`, checks `moderation_status = 'approved'`, deduplicates per viewer/5m, blocks self-impressions, and writes double-entry `ledger_entries`. |
| **SEC-02** | **P0 Critical** | `get_user_messaging_friends(viewer_id UUID)` was `SECURITY DEFINER` without checking `viewer_id = auth.uid()`, allowing IDOR enumeration of any user's accepted friends list. | `00109_messages_production_upgrade.sql` | Recreated in `00115` with `SET search_path = public, pg_temp`, `REVOKE ALL FROM PUBLIC, anon`, and strict `IF viewer_id IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'Access denied'`. |
| **SEC-03** | **P0 Critical** | Advertiser UPDATE policies on `campaigns` and `ads` allowed self-approving `moderation_status = 'approved'` or inflating `funded_amount_minor` via direct PostgREST `UPDATE`; `is_staff_or_ad_moderator` allowed staff enumeration. | `00112`, `00114` | Added `BEFORE UPDATE` trigger `enforce_campaign_and_ad_security` in `00115` blocking non-staff modifications to `moderation_status`, `funded_amount_minor`, `spent_amount_minor`, and `payment_status`; hardened `is_staff_or_ad_moderator` with IDOR check and explicit `WITH CHECK` on staff policies. |
| **SEC-04** | **P1 High** | `is_page_member` and `can_manage_page` allowed probing arbitrary users' Page memberships and ignored `businesses.owner_id`. | `00108_page_publishing_rls_and_feed_distribution.sql` | Hardened in `00115` to require `check_user_id = auth.uid()` (unless staff/service_role) and check both `page_roles` and `businesses.owner_id`. |
| **DB-01** | **P1 High** | Duplicate `00108` migrations overwrote `public.posts` SELECT/UPDATE/DELETE RLS policies, breaking Page-role post management. | `00108_page_publishing_rls...`, `00108_phase2_security...` | Unified `posts_select_policy`, `posts_insert_policy`, `posts_update_policy`, and `posts_delete_policy` in `00115`. |
| **DB-03** | **P1 High** | Partition tables `feed_activity_timeline_2026_03`, `_2026_04`, and `_default` lacked `ENABLE ROW LEVEL SECURITY`. | `00090_hyperscale_partitioning_and_hot_counters.sql` | Enabled RLS and added strict `user_id = auth.uid()` policies on all partitions in `00115`. |
| **DB-05** | **P1 High** | `public.videos` allowed creators to mutate `view_count`, `likes_count`, and `moderation_status` directly. | `00004`, `00110` | Added `enforce_video_immutable_fields` trigger and `increment_video_counter` RPC in `00115`. |
| **P0-1 / P0-9** | **P0 Critical** | Unapproved campaigns (`moderation_status = 'pending_review'` or `'rejected'`) could be resumed by advertisers and served in the home feed. | `apps/web/src/lib/advertising/actions.ts`, `load-feed.ts`, `campaign-row.tsx` | Blocked activation unless `moderation_status === 'approved'` in `updateCampaignStatusAction`, `campaign-row.tsx`, DB trigger, and `load-feed.ts`. |
| **P0-3 / P0-5 / P0-6** | **P0 Critical** | PayPal campaign checkout wrote mismatched `payment_intents` columns; capture route did not verify `token === provider_transaction_id` or captured amount, nor did it increment `funded_amount_minor`; webhook handler settled on `CHECKOUT.ORDER.APPROVED` before capture. | `advertising/actions.ts`, `paypal/capture/route.ts`, `webhooks/[provider]/route.ts`, `paypal.ts` | Aligned `payment_intents` schema, added `custom_id` to PayPal orders, enforced order token + amount + currency verification, unified `settle_intent_${intent.id}` idempotency key across capture and webhook, and restricted webhook settlement to `PAYMENT.CAPTURE.COMPLETED`. |
| **APP-01** | **P1 High** | Unsanitized `options.query` in `fetchUniversalPagesDirectoryAction` interpolated into PostgREST `.or()`. | `apps/web/src/lib/pages/actions.ts` | Stripped PostgREST filter metacharacters (`[,().%*\\]`) before `.or()` interpolation. |
| **APP-02** | **P1 High** | Newly created Pages received `is_verified: true` automatically in `createUniversalPageAction`. | `apps/web/src/lib/pages/actions.ts` | Changed default to `is_verified: false`. |
| **APP-03** | **P2 Medium** | `createFullCampaignAction` and `updateCampaignAdAction` accepted unvalidated `destination_url` schemes (e.g., `javascript:`). | `apps/web/src/lib/advertising/actions.ts` | Validated `new URL(url).protocol` is strictly `'http:'` or `'https:'`. |
