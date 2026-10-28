---
title: "TECHNICAL_DEBT_REGISTER — Defects Found, Remediated & Residual Risk Register"
type: technical-debt-register
status: verified
owner: Chief Architect & QA Lead
created: 2026-10-28
updated: 2026-10-28
tags:
  - tukubi
  - technical-debt
  - defects
  - remediation
related:
  - "[[TUKUBI Engineering Intelligence]]"
  - "[[07 Security and Privacy/SECURITY_THREAT_MODEL]]"
---

# TECHNICAL_DEBT_REGISTER — TUKUBI

## 1. Remediated P0 / P1 / P2 Defects (Giant Among Giants Transformation)

| ID | Category | Severity | Observed Condition | Remediation Applied | Status |
|---|---|---|---|---|---|
| `SEC-01` / `P0-10` | Security & Ads | `P0` | `record_ad_impression_and_spend` was `SECURITY DEFINER` executable by `anon`/`authenticated` and accepted caller-supplied `p_cost_minor`. | Restricted `EXECUTE` to `service_role`, computed CPM server-side from `ad_sets.bid_amount_minor`, deduplicated per viewer/5m, enforced `moderation_status = 'approved'`, and added double-entry `ledger_entries` in `00115`. | `RESOLVED` |
| `SEC-02` | Security & Messaging | `P0` | `get_user_messaging_friends(viewer_id)` allowed any user to query another user's friends list (IDOR). | Added `viewer_id = auth.uid()` enforcement and `SET search_path = public, pg_temp` in `00115`. | `RESOLVED` |
| `SEC-03` / `P0-1` / `P0-9` | Security & Ads | `P0` | Advertisers could activate `pending_review`/`rejected` campaigns or mutate `funded_amount_minor` via direct UPDATE; unapproved ads could serve in feed. | Added `enforce_campaign_and_ad_security` trigger in `00115`, server check in `updateCampaignStatusAction`, UI lock in `campaign-row.tsx`, and `.eq('ad_sets.campaigns.moderation_status', 'approved')` in `load-feed.ts`. | `RESOLVED` |
| `P0-3` / `P0-5` / `P0-6` / `P0-7` | Payments & Ledger | `P0` | PayPal campaign checkout schema mismatch; capture route did not verify order token/amount or increment `funded_amount_minor`; webhook settled on `ORDER.APPROVED`; platform-direct payments skipped `ledger_entries`. | Aligned `payment_intents` insert, added `custom_id` to `PayPalAdapter`, verified order token & amount in capture route, unified `settle_intent_${intent.id}` idempotency key, settled only on `PAYMENT.CAPTURE.COMPLETED`, and added platform double-entry ledger rows in `TransactionLedgerService` and `fund_campaign_from_intent`. | `RESOLVED` |
| `DB-01` | Database RLS | `P1` | Duplicate `00108` migrations overwrote `public.posts` RLS policies, dropping `can_manage_page` checks. | Created unified `posts_select_policy`, `posts_insert_policy`, `posts_update_policy`, and `posts_delete_policy` in `00115`. | `RESOLVED` |
| `DB-03` | Database RLS | `P1` | `feed_activity_timeline_*` partitions lacked `ENABLE ROW LEVEL SECURITY`. | Enabled RLS and added strict owner-only policies on all partitions in `00115`. | `RESOLVED` |
| `DB-04` | Database Migrations | `P1` | `00111_transfer_kool_tech_page_ownership.sql` raised hard exception when production UUIDs were absent in CI/staging. | Replaced `RAISE EXCEPTION` with safe `RAISE NOTICE ... RETURN;`. | `RESOLVED` |
| `DB-05` / `DEFECT-07` / `DEFECT-08` | Database & Shorts | `P1` | `public.videos` lacked immutable counter protection; `saveShortAction`/`recordShortShareAction` wroteShort UUIDs into `posts` FK tables; `reportShortAction` wrote to legacy table. | Added `enforce_video_immutable_fields` trigger, `video_saves` and `video_shares` tables, `increment_video_counter` RPC in `00115`, and updated `short-actions.ts` to write to `video_saves`, `video_shares`, `reports`, and `moderation_cases`. | `RESOLVED` |
| `DB-06` | Livestreaming | `P1` | `respondOrLeaveCohostAction` called missing RPC `respond_or_leave_livestream_cohost`. | Implemented `respond_or_leave_livestream_cohost` RPC in `00115`. | `RESOLVED` |
| `DEFECT-01` | Feed Hydration | `P1` | `hydrate-posts.ts` only queried `post_media` when `postsWithLinks.length > 0`, dropping aspect ratios/captions on regular photo/video posts. | Decoupled `post_media` query from `postsWithLinks` in `hydrate-posts.ts`. | `RESOLVED` |
| `DEFECT-05` | Universal Pages | `P1` | `fetchPageDetailsAction` omitted `page_id` and `businesses` join on Page posts; `createPagePostAction` omitted `publisher_type: 'page'`. | Updated `apps/web/src/lib/pages/actions.ts` to populate and select full Page attribution metadata. | `RESOLVED` |
| `DEFECT-09` / `DEFECT-10` / `DEFECT-11` / `DEFECT-13` | Shorts | `P1` | Shorts comments drawer did not load DB comments; `@handle` double-prefixed `@@`; `'travel'` category dropped; Page owners without `page_roles` row blocked from publishing Shorts as Page. | Wired `fetchShortCommentsAction` in `shorts-feed-viewer.tsx`, normalized handles & Page links in `shorts/page.tsx` and `short-card.tsx`, added `'travel'` category, and checked `businesses.owner_id` in `short-actions.ts`. | `RESOLVED` |
| `DEFECT-15` / `DEFECT-16` / `DEFECT-17` | Messaging | `P1` | Voice notes saved browser-local `blob:` URLs; `messages/page.tsx` omitted `edited_at`, `deleted_at`, `deleted_for`, and `message_reactions`; AI responses rendered as sender's own bubble. | Encoded voice notes as persistent data URLs, hydrated reactions and edit/delete fields in `messages/page.tsx`, and rendered `ai_response` as assistant bubbles in `message-thread.tsx`. | `RESOLVED` |
| `DEFECT-18` / `DEFECT-19` | Profiles | `P1` | Personal profile feed included Page posts; `is_private` blocked approved followers and ignored `followers` visibility on profile fields. | Added `.is('page_id', null)` filter and evaluated `viewerRelationship` before privacy checks in `profile/[username]/page.tsx`. | `RESOLVED` |
| `DEFECT-20` – `DEFECT-23` | Help Center | `P2` | 5 of 12 Help categories had 0 articles; `searchArticles` had `st.title.toLowerCase` typo; feedback route passed slug into UUID column; DB article override discarded. | Added 5 comprehensive guides across all missing categories, fixed `.toLowerCase()`, validated UUID before insert, and assigned `dbArticle` override. | `RESOLVED` |
| `P2-UX-01` / `P2-UX-02` / `LINT-01` | UI/UX & Accessibility | `P2` | 4 secondary mobile screens used `#FFFFFF` on `#FF7A59` (2.56:1); `/settings` lacked `Island Daylight` selector; 12 ESLint hook/ref warnings in `apps/web`. | Updated all 4 mobile screens to `TOKENS.actionText` (`#110D17`, 7.48:1 AAA), wired `Island Daylight` theme toggle in `/settings` + SSR root layout, and resolved all 12 ESLint warnings. | `RESOLVED` |

---

## 2. Residual Technical Debt & Tracked Items (`P2` / `P3`)

| ID | Area | Description | Priority | Recommended Next Step |
|---|---|---|---|---|
| `TD-01` | Migration Numbering | Historical duplicate numeric prefixes (`00089_*` x3 and `00108_*` x2) remain in `supabase/migrations/` for backwards compatibility with existing environments. Policy semantics are reconciled by `00115`. | `P3` | Keep existing filenames immutable for deployed state history; enforce unique monotonic prefixes in CI for all future migrations (`>= 00116`). |
| `TD-02` | Voice Note Storage | Voice notes currently encode to persistent Data URLs in `messages.metadata.audio_url` so they work without bucket provisioning. | `P2` | Upload large voice notes (`> 60s`) to a dedicated `voice-notes` Supabase Storage bucket with signed URLs while keeping Data URL fallback. |
| `TD-03` | Live Video WebRTC | `webrtc-call-modal.tsx` and `/live` use browser media streams and Supabase Realtime signaling; TURN server credentials are required for symmetric NAT traversal at scale. | `P2` | Configure managed Cloudflare Calls / LiveKit TURN credentials in production environment variables. |
