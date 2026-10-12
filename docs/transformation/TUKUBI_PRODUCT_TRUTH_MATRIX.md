# TUKUBI Product & Marketing Truth Matrices

**Program:** `TUKUBI-RTP-001` (Phase 1 — Forensic Audit & Baseline Verification)  
**Date:** 2026-10-12  
**Mandates:** `AGENTS.md` Mandate 7 (*Never claim something works without testing it*) & Mandate 10 (*Documentation Honesty*)

---

## 1. Six-Application Product Truth Matrix

| Application | Workspace Name | Dev Port | Route / Screen Count | Database Wiring | Auth / RBAC Enforcement | Verified Readiness | Truth Notes & Required Actions |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`apps/web`** | `caribbean-web` | `3000` (E2E `3100`) | 115 `page.tsx`, 38 `route.ts` | Live Supabase SSR + RPCs across 96 pages (13 redirects, 6 static info pages) | Middleware + Server Component session checks + PostgreSQL RLS | **PRODUCTION CORE (REQUIRES P0 PUBLISHING/EMBED/CONTRAST FIXES)** | Primary user, creator, business, admin, and moderation application. |
| **`apps/mobile`** | `caribbean-mobile` | Expo (`8081`) | 17 screens + `App.tsx` | 14 screens query Supabase; `ExploreScreen` & `SoundsScreen` use curated client arrays | Session gate in `App.tsx`; Payment Policy Engine guard for IAP/Play Billing | **BETA / PARTIAL** | Update persistent bottom tabs to *Home · Explore · Create · Community · Profile* (`D-02`), fix `#FF7A59` contrast, and fix `price_minor`/`display_name` column references. |
| **`apps/admin`** | `caribbean-admin` | `3001` | 14 `page.tsx`, 1 `route.ts` | Supabase SSR (`profiles`, `reports`, `feature_flags`, `ledger_entries`) | Middleware role gate (`admin`, `superadmin`) | **FUNCTIONAL COMPANION APP** | Overlaps with `apps/web/src/app/admin/*`; preserve both while treating `apps/web` as primary. |
| **`apps/moderation`** | `caribbean-moderation` | `3004` *(fixed from `3002`)* | 5 `page.tsx`, 2 `route.ts` | Supabase SSR (`moderation_cases`, `reports`, `appeals`) | Middleware role gate (`moderator`, `admin`, `superadmin`) | **FUNCTIONAL COMPANION APP** | Port collision with `apps/creator-studio` (`3002`) resolved by assigning `3004`. |
| **`apps/creator-studio`** | `caribbean-creator-studio` | `3002` | 5 `page.tsx`, 0 `route.ts` | **None (`DB=False` on all 5 pages)** | None in standalone app | **STATIC / PROTOTYPE SHELL** | Contains hardcoded demo schedules (`sch_1..3`) and HLS vault URLs (`ast_01..03`). Real DB-backed Creator Studio lives in `apps/web/src/app/creator-studio/*` and `/creator-hub`. Must be truthfully labeled or wired to honest empty states. |
| **`apps/business-studio`** | `caribbean-business-studio` | `3003` | 4 `page.tsx`, 0 `route.ts` | **None (`DB=False` on all 4 pages)** | None in standalone app | **STATIC / PROTOTYPE SHELL** | Contains hardcoded demo ad campaigns (`CMP-301..302`) and team emails (`@bluemountain.store`). Real DB-backed Merchant Center lives in `apps/web/src/app/merchant` and `/marketplace/seller-center`. Must remove fake rows and show honest empty states or link to canonical web routes. |

---

## 2. Pillar-by-Pillar Capability Truth Matrix

| Pillar | Capability | UI Exists? | Backend / DB Exists? | End-to-End Verified? | Truth Classification | Remediation in `TUKUBI-RTP-001` |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| **Pillar 1: People & Community** | Signup, Login, OAuth, Magic Link, Caribbean Identity Onboarding | Yes | Yes (`profiles`, `profile_identity`, `00108`) | Yes | **LIVE** | Preserve; enforce Rule 8 privacy defaults. |
| **Pillar 1: People & Community** | Home Feed, Reactions, Comments, Polls, Saved Posts | Yes | Yes (`posts`, `post_reactions`, `comments`, `polls`) | Yes | **LIVE (UX UPGRADE)** | De-clutter `HomeDashboard` so feed is visible higher on screen. |
| **Pillar 1: People & Community** | Communities & Pages 2.0 (Operating Identity Switcher) | Yes | Yes (`communities`, `businesses`, `page_roles`) | Yes | **LIVE** | Align mobile bottom nav to surface `Community` directly (`D-02`). |
| **Pillar 1: People & Community** | Direct & Group Messaging + Notifications | Yes | Yes (`conversations`, `messages`, `notifications`) | Yes | **LIVE** | Keep accessible in persistent top header on mobile and desktop. |
| **Pillar 2: Caribbean Discovery** | Explore by Territory, Diaspora Hub, Vibe & Interactive Map | Yes | Yes (`countries`, `diaspora_hubs`, `trending_signals`) | Partial | **LIVE (LINK FIX NEEDED)** | Fix `ExploreRail` vibe query params and deep-link discovery cards to item detail pages. |
| **Pillar 3: Media & Creators** | Text, Photo, Video, Audio & External Link/YouTube Publishing | Yes | Yes (`posts`, `post_media`, `post_external_media`, `00107`) | **Defective (P0)** | **P0 REPAIR REQUIRED** | Fix CSP `frame-src`/`img-src`, fix `RichMediaPlayer` `onLoad` + YouTube handshake, and fix `validateComposer` for link-only posts. |
| **Pillar 3: Media & Creators** | Composer Draft Auto-Save & Abandoned Draft Reminder Banner | Yes | LocalStorage + `creator_content_drafts` | **Defective (P0)** | **P0 REPAIR REQUIRED** | Wire `subscribeToDraftChanges` in `UniversalComposer`, ignore un-uploaded local blobs in `hasMeaningfulDraftContent`, and clear server drafts on discard/publish. |
| **Pillar 3: Media & Creators** | Creator Hub, Fan Subscriptions, Tips, Podcasts & Live | Yes | Yes (`creator_accounts`, `fan_subscriptions`, `podcasts`, `livestreams`) | Partial | **LIVE (FIX MOCK STAT)** | Replace hardcoded `"3 Active ($2.99–$9.99)"` and float balance math in `creator-hub/page.tsx` with live integer minor-unit queries. |
| **Pillar 4: Commerce & Opportunity** | Marketplace, Shoppable Posts, Escrow Orders, Events & Relief | Yes | Yes (`products`, `orders`, `place_order_with_escrow`, `events`, `relief_campaigns`) | Yes | **LIVE** | Fix `#FF7A59` button contrast on `ShoppablePostWidget`. |
| **Pillar 4: Commerce & Opportunity** | Financial Center & Double-Entry Ledger | Yes | Yes (`ledger_accounts`, `ledger_entries`, `trg_ledger_sum_zero`) | Yes | **LIVE** | Apply Ocean Depth (`#0B1F33`) trust surface tokens. |
| **Pillar 5: Intelligence & Connection** | CaribAI Assistant & EN/ES/FR/HT Translation | Yes | Yes (`@caribbean/ai`, `/api/translate`, OpenRouter) | Yes | **LIVE** | Preserve deterministic fallback when external AI provider is unavailable. |
