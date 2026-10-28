---
title: "IMPLEMENTATION_ROADMAP — Prioritized P0, P1, P2 & P3 Engineering Roadmap"
type: roadmap
status: verified
owner: Chief Architect & Product Lead
created: 2026-10-28
updated: 2026-10-28
tags:
  - tukubi
  - roadmap
  - execution
related:
  - "[[TUKUBI Engineering Intelligence]]"
  - "[[00 Dashboard/PRODUCT_MATURITY_SCORECARD]]"
---

# IMPLEMENTATION_ROADMAP — TUKUBI

## Phase 1: P0 Security, Data Integrity & Payment Hardening (`COMPLETED`)
- [x] **Database & RPC Security (`00115_security_ads_and_rpc_hardening.sql`):**
  - Lock down `record_ad_impression_and_spend` to `service_role` with server-computed CPM, moderation checks, viewer deduplication, and double-entry ledger entries.
  - Lock down `get_user_messaging_friends`, `is_staff_or_ad_moderator`, `is_page_member`, and `can_manage_page` with `auth.uid()` IDOR checks and `SET search_path = public, pg_temp`.
  - Add `enforce_campaign_and_ad_security` trigger preventing non-staff tampering with `moderation_status` or `funded_amount_minor`.
- [x] **PayPal & Double-Entry Ledger Reconciliation:**
  - Align `initiateCampaignCheckoutAction` with canonical `payment_intents` columns.
  - Verify PayPal order ownership (`provider_transaction_id === token`), amount, and currency in `/api/payments/paypal/capture`.
  - Ensure webhook handler (`/api/payments/webhooks/paypal`) only settles on `PAYMENT.CAPTURE.COMPLETED` using unified `settle_intent_${intent.id}` idempotency key.
  - Record balanced debit/credit `ledger_entries` for platform-direct payments in `TransactionLedgerService` and `fund_campaign_from_intent`.

## Phase 2: P1 Core Social, Feed, Pages, Shorts & Messaging Fixes (`COMPLETED`)
- [x] **Feed & Pages:**
  - Fix `hydrate-posts.ts` `post_media` query so all photo/video posts receive aspect ratios and captions (`DEFECT-01`).
  - Include Page attribution fields in `fetchPageDetailsAction` and `createPagePostAction` (`DEFECT-05`).
  - Disable automatic `is_verified: true` on new Page creation (`APP-02`) and sanitize `.or()` search filter (`APP-01`).
- [x] **Shorts & Media:**
  - Create `video_saves` and `video_shares` tables (`00115`) and update `short-actions.ts` (`DEFECT-07`).
  - Route Short reports to canonical `reports` and `moderation_cases` tables (`DEFECT-08`).
  - Hydrate existing Short comments from DB when opening the comments drawer (`DEFECT-09`).
  - Fix `@handle` formatting, Page profile links, `'travel'` category filter, and Page owner Shorts publishing (`DEFECT-10`–`DEFECT-13`).
- [x] **Messaging & Profiles:**
  - Persist voice notes as Data URLs, hydrate `edited_at`/`deleted_at`/`deleted_for`/`message_reactions` on `/messages` load, and align AI assistant bubbles (`DEFECT-15`–`DEFECT-17`).
  - Filter Page posts out of personal profile feeds and evaluate follower relationships before profile privacy barriers (`DEFECT-18`, `DEFECT-19`).

## Phase 3: P2 UI/UX, Accessibility, Help Center & Lint Cleanliness (`COMPLETED`)
- [x] **WCAG 2.2 AA & Theme Switching:**
  - Fix `#FF7A59` button text contrast to `#110D17` (7.48:1 AAA) across `CommunitiesScreen.tsx`, `FinancialCenterScreen.tsx`, `SoundsScreen.tsx`, and `ReelsScreen.tsx` (`P2-UX-01`).
  - Wire interactive `Island Vibes` & `Island Daylight` theme selector in `/settings` and root SSR layout (`P2-UX-02`).
  - Eliminate all 12 React Hook/stale-ref ESLint warnings in `apps/web/src/components/**`.
- [x] **Help & Learn Center & Brand Governance:**
  - Populate all 12 Help categories with comprehensive guides, fix `searchArticles` step search, and validate feedback UUIDs (`DEFECT-20`–`DEFECT-23`).
  - Remove all `"Ecosystem"` replacement identity strings beside `TUKUBI`.

## Phase 4: P3 Incremental Scale & Future Enhancements (`PLANNED — POST-APPROVAL`)
- [ ] **Production Deployment & Migration Execution:** Apply `00115_security_ads_and_rpc_hardening.sql` to staging and production Supabase clusters (requires explicit owner approval).
- [ ] **Managed WebRTC TURN & Live HLS Transcoding:** Connect Cloudflare Stream / LiveKit TURN credentials for large-audience livestreams.
- [ ] **Automated Partition Maintenance (`pg_cron`):** Schedule monthly partition creation for `feed_activity_timeline_YYYY_MM` with automatic RLS inheritance.
