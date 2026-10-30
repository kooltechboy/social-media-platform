---
title: "ENGINEERING_CHANGELOG — TUKUBI Giant Among Giants Transformation Log"
type: changelog
status: verified
owner: Release Manager
created: 2026-10-28
updated: 2026-10-28
tags:
  - tukubi
  - changelog
  - release
related:
  - "[[TUKUBI Engineering Intelligence]]"
  - "[[00 Dashboard/TECHNICAL_DEBT_REGISTER]]"
---

# ENGINEERING_CHANGELOG — TUKUBI

## [2026-10-28] — TUKUBI: Giant Among Giants Engineering Transformation

### 1. Security, Database & RLS Hardening (`supabase/migrations/`)
- **Added `supabase/migrations/00115_security_ads_and_rpc_hardening.sql`:**
  - Reconciled `public.posts` RLS policies across personal, community, and Page publishing (`DB-01`).
  - Enabled RLS and strict owner policies on `feed_activity_timeline_2026_03`, `feed_activity_timeline_2026_04`, and `feed_activity_timeline_default` (`DB-03`).
  - Enabled RLS on `public.videos`, added `enforce_video_immutable_fields` trigger, created `public.video_saves` and `public.video_shares`, and created `increment_video_counter` RPC (`DB-05`).
  - Created `public.respond_or_leave_livestream_cohost` RPC (`DB-06`).
  - Hardened `public.record_ad_impression_and_spend`: restricted to `service_role`, computed CPM server-side from `ad_sets.bid_amount_minor`, enforced `moderation_status = 'approved'`, deduplicated per viewer/5m, blocked self-impressions, and recorded double-entry `ledger_entries` (`SEC-01`).
  - Hardened `public.get_user_messaging_friends`, `public.is_staff_or_ad_moderator`, `public.is_page_member`, and `public.can_manage_page` with `auth.uid()` IDOR checks and `SET search_path = public, pg_temp` (`SEC-02`, `SEC-03`, `SEC-04`).
  - Added `enforce_campaign_and_ad_security` trigger and atomic `public.fund_campaign_from_intent` RPC (`SEC-03`, `P0-7`).
- **Updated `supabase/migrations/00111_transfer_kool_tech_page_ownership.sql`:**
  - Replaced hard `RAISE EXCEPTION` with safe `RAISE NOTICE ... RETURN;` when production-specific UUIDs are absent in CI/staging databases (`DB-04`).

### 2. Advertising Engine, PayPal Checkout & Double-Entry Ledger
- **`packages/payments/src/adapters/paypal.ts`:** Embedded `custom_id: request.idempotencyKey` in PayPal v2 `purchase_units[0]` (`P0-6`).
- **`packages/payments/src/transaction-service.ts`:** Added balanced double-entry `ledger_entries` creation for platform-direct settlements (`payerId` present, `recipientId = null`) (`P0-7`).
- **`apps/web/src/lib/advertising/actions.ts`:**
  - Enforced `http:` / `https:` URL validation on ad `destination_url` (`APP-03`).
  - Eliminated 2x impression/click double-counting across campaign summary and detail views (`P0-11`).
  - Blocked campaign activation unless `moderation_status === 'approved'` (`P0-1`).
  - Updated `initiateCampaignCheckoutAction` to write canonical `payment_intents` columns (`P0-3`).
- **`apps/web/src/app/api/payments/paypal/capture/route.ts`:** Verified intent ownership, `provider_transaction_id === token`, captured amount/currency, idempotent short-circuit (`status === 'succeeded'`), canonical `settle_intent_${intent.id}` key, and campaign funding increment (`P0-5`).
- **`apps/web/src/app/api/payments/webhooks/[provider]/route.ts`:** Separated `CHECKOUT.ORDER.APPROVED` from `PAYMENT.CAPTURE.COMPLETED`, guarded UUID `.or()` lookup, and added idempotent campaign funding (`P0-6`, `PAY-02`).
- **`apps/web/src/app/ads/campaign-row.tsx`:** Disabled resume button when `campaign.moderationStatus !== 'approved'`.
- **`apps/web/src/app/api/ads/impression/route.ts` & `click/route.ts`:** Switched to service client, removed client-controlled cost parameter, deduplicated clicks per `impression_id`, and logged click events to `ad_events` (`P0-10`, `P1-1`).
- **`apps/web/src/lib/feed/load-feed.ts`:** Added `.eq('ad_sets.campaigns.moderation_status', 'approved')` filter (`P0-9`).

### 3. Social Workflows: Feed, Pages, Shorts, Messaging, Profiles & Help Center
- **`apps/web/src/lib/feed/hydrate-posts.ts`:** Decoupled `post_media` query from `postsWithLinks` (`DEFECT-01`).
- **`apps/web/src/lib/pages/actions.ts`:** Sanitized `.or()` search query (`APP-01`), set `is_verified: false` on new Pages (`APP-02`), and included full Page attribution columns on Page posts (`DEFECT-05`).
- **`apps/web/src/lib/media/short-actions.ts`, `apps/web/src/app/shorts/page.tsx`, `short-card.tsx`, `shorts-feed-viewer.tsx`:** Enabled Page owners (`businesses.owner_id`) to publish/delete Shorts, wired `video_saves`/`video_shares` and `reports`/`moderation_cases`, loaded existing Short comments from DB, normalized `@handle` and `/pages/[slug]` links, and added `'travel'` to `ALLOWED_CATEGORIES` (`DEFECT-07`–`DEFECT-13`).
- **`apps/web/src/app/messages/page.tsx` & `apps/web/src/components/message-thread.tsx`:** Persisted voice notes as Data URLs, hydrated `edited_at`/`deleted_at`/`deleted_for`/`message_reactions`, and aligned `ai_response` bubbles (`DEFECT-15`–`DEFECT-17`).
- **`apps/web/src/app/profile/[username]/page.tsx`:** Filtered `.is('page_id', null)` on personal profiles and evaluated `viewerRelationship` before privacy barriers (`DEFECT-18`, `DEFECT-19`).
- **`apps/web/src/lib/help/articles-data.ts`, `apps/web/src/app/help/[slug]/page.tsx`, `apps/web/src/app/api/v1/help/feedback/route.ts`:** Fixed `searchArticles` step title search, added 5 guides covering all 12 Help categories, mapped `dbArticle` override, and validated UUID before feedback insert (`DEFECT-20`–`DEFECT-23`).

### 4. Brand Compliance, Accessibility (WCAG 2.2 AA), Themes & Code Cleanliness
- Removed `"Ecosystem"` beside `TUKUBI` across 9 files (`Rule 1a`).
- Fixed 4 mobile screens (`CommunitiesScreen.tsx`, `FinancialCenterScreen.tsx`, `SoundsScreen.tsx`, `ReelsScreen.tsx`) to use `TOKENS.actionText` (`#110D17` on `#FF7A59` = 7.48:1 AAA contrast) (`P2-UX-01`).
- Wired live `Island Vibes` & `Island Daylight` theme selector in `/settings` and `apps/web/src/app/layout.tsx` (`P2-UX-02`).
- Resolved all 12 ESLint React Hook and stale-ref cleanup warnings across `apps/web/src/components/**`.

---

## [2026-10-29] — TUKUBI: Trust, Signup, Privacy & Platform Maturity Transformation

### 1. Legal Compliance, Privacy & Statutory Gating (`supabase/migrations/00116`)
- **Added `supabase/migrations/00116_legal_consent_and_account_lifecycle.sql`:**
  - Created `public.legal_consent_records` table with audit trail columns (`user_id`, `document_type`, `document_version`, `consented`, `consented_at`, `ip_country`, `user_agent`, `jurisdiction`).
  - Enabled RLS on `legal_consent_records` with strict user-only read/write policies and service-role management.
  - Created `public.account_deletion_requests` table with 30-day grace period pipeline (`status: 'scheduled'`, `scheduled_deletion_at: now() + interval '30 days'`).
  - Implemented `public.request_account_deletion` and `public.cancel_account_deletion` stored procedures with `SECURITY DEFINER` and pinned `search_path = public, pg_temp`.
  - Implemented `public.record_legal_consent` RPC with owner validation.

### 2. Registration UX & Child Safety Standards (Law 136-03, COPPA, GDPR-K)
- **`apps/web/src/app/signup/account/page.tsx`:**
  - Added Date-of-Birth (DOB) field with live age calculation.
  - Under-13 protection: Users under 13 are respectfully blocked from unassisted registration with clear notification of Dominican Republic Law 136-03 parental authorization requirements.
  - Adolescent protection (13–17): Automatic minor safety disclosure and database trigger `trg_calculate_profile_age_tier` activation (`age_tier = '13_to_17'`).
  - Adult mode (18+): Full adult profile activation.
  - Mandatory legal consent: Checkbox explicitly linking Terms of Service (`/terms`), Privacy Policy (`/privacy`), and Community Standards (`/help`).
  - Unbundled optional marketing consent: Dedicated checkbox for cultural highlights and product newsletters.
- **`apps/web/src/lib/auth/signup-session.ts`:**
  - Added `dateOfBirth`, `marketingConsent`, `termsVersion`, and `privacyVersion` fields while maintaining strict credential isolation (passwords never written to browser storage).
- **`apps/web/src/lib/auth/actions.ts`:**
  - Updated `completeFullRegistrationAction` to persist `date_of_birth` on `public.profiles` and record statutory `legal_consent_records` rows upon registration.
- **`apps/web/src/app/signup/complete/page.tsx`:**
  - Wired `dateOfBirth`, `marketingConsent`, and document versions (`2026.1`) into `completeFullRegistrationAction`.

### 3. True Privacy Lifecycle & Account Erasure Pipeline
- **`apps/web/src/lib/settings/settings-actions.ts`:**
  - Enhanced `exportAccountDataAction` to assemble complete GDPR / Law 172-13 data package (profile, cultural identity, notifications, statistics, posts, comments, saved items).
  - Implemented `requestAccountDeletionAction` (scheduled 30-day deletion pipeline).
  - Implemented `cancelAccountDeletionAction` (allows user to cancel scheduled deletion during grace period).
- **`apps/web/src/components/settings-view.tsx`:**
  - Replaced mere deactivation call with true `requestAccountDeletionAction` inside confirmation modal.
  - Added prominent banner for accounts in `pending_deletion` with 1-tap cancellation button.
  - Clear legal disclosure: Anonymized double-entry financial ledger records are retained in accordance with statutory accounting and anti-money laundering requirements.

### 4. Visual Redesign & Experience Alignment (TUKUBI NEXT / Stage C)
- **`apps/web/src/components/app-sidebar.tsx`:**
  - Aligned primary navigation to 11 unified global destinations matching concept mockup Image 2 (`Home`, `Explore`, `Shorts`, `Communities`, `Pages`, `Marketplace`, `Events`, `Creator Studio`, `Messages`, `Notifications`, `Settings`).
  - Added bottom User Profile mini-card with user avatar, display name, verified checkmark, `@username`, and direct profile navigation.
- **`apps/web/src/components/rails/home-rail.tsx`:**
  - Elevated "Trending in the Caribbean" / "Trending Now" to top ranking card with formatted post counts and direct tag explore links.
  - Positioned "Suggested People" as second card with verified badges, island flags, and 1-tap follow actions.
- **`apps/web/src/components/home/home-dashboard.tsx`:**
  - Redesigned central feed horizon composer to match concept mockups Image 1 & 2: User avatar + rounded input pill ("What's on your mind?") + quick action chips (`Photo`, `Video`, `Poll`, `Feeling`).
  - Wired chips to expand `UniversalComposer` in corresponding mode on both mobile and desktop.
  - Preserved quick access shortcuts (`Reel`, `Live`, `Event`, `Market`, `Hub`) with zero feature loss.

### 5. Verification & Testing Evidence
- **`tests/migration-00116.test.ts`:** 6 unit tests verifying migration 00116 tables, constraints, RLS policies, and stored procedures (`PASS`).
- **`tests/unit/signup-session-security.test.ts`:** 3 unit tests verifying credential isolation and statutory metadata persistence (`PASS`).
- **Combined Test Gate:** 129 tests passing across 7 critical test suites (WCAG accessibility, RLS financial audit, universal content resolver, link intelligence, shorts viewer, migration 00116, signup security).
- **TypeScript Gate:** 31 packages and apps typechecked with zero errors (`turbo run typecheck`).
