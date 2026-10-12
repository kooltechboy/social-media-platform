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
| **`apps/creator-studio`** | `caribbean-creator-studio` | `3002` | 5 `page.tsx`, 0 `route.ts` | Honest zero-states linking to canonical `apps/web` (`/creator-studio/*`, `/create`) | Session gate via root middleware | **SCAFFOLD WITH CANONICAL ROUTING** | Fabricated schedules and fake asset arrays removed in assurance pass; renders honest zero-states linking to canonical DB-backed Creator Studio in `apps/web`. |
| **`apps/business-studio`** | `caribbean-business-studio` | `3003` | 4 `page.tsx`, 0 `route.ts` | Honest zero-states linking to canonical `apps/web` (`/business-center`, `/marketplace/seller-center`) | Session gate via root middleware | **SCAFFOLD WITH CANONICAL ROUTING** | Fabricated campaigns (`CMP-301..302`) and fake team emails removed in assurance pass; renders honest zero-states linking to canonical DB-backed Business Center in `apps/web`. |

---

## 2. Pillar-by-Pillar Capability Truth Matrix

| Pillar | Capability | UI Exists? | Backend / DB Exists? | End-to-End Verified? | Truth Classification | Remediation in `TUKUBI-RTP-001` |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| **Pillar 1: People & Community** | Signup, Login, OAuth, Magic Link, Caribbean Identity Onboarding | Yes | Yes (`profiles`, `profile_identity`, `00108`) | Yes | **VERIFIED LIVE** | Preserved; Rule 8 privacy defaults enforced. |
| **Pillar 1: People & Community** | Home Feed, Reactions, Comments, Polls, Saved Posts | Yes | Yes (`posts`, `post_reactions`, `comments`, `polls`) | Yes | **VERIFIED LIVE** | Feed persistence verified; 10 Caribbean reaction types tested. |
| **Pillar 1: People & Community** | Communities & Pages 2.0 (Operating Identity Switcher) | Yes | Yes (`communities`, `businesses`, `page_roles`) | Yes | **VERIFIED LIVE** | Mobile bottom nav surfaces `Community` directly (`D-02`); `can_publish_as` role check hardened in `00108`. |
| **Pillar 1: People & Community** | Direct & Group Messaging + Notifications | Yes | Yes (`conversations`, `messages`, `notifications`) | Yes | **VERIFIED LIVE** | Mobile two-panel layout verified; unread badges wired in header & mobile nav. |
| **Pillar 2: Caribbean Discovery** | Explore by Territory, Diaspora Hub, Vibe & Interactive Map | Yes | Yes (`countries`, `diaspora_hubs`, `trending_signals`) | Yes | **VERIFIED LIVE** | Fixed `ExploreRail` vibe query params and deep-linked discovery cards to `/events/${evt.id}` and `/reels?id=${reel.id}`. |
| **Pillar 3: Media & Creators** | Text, Photo, Video, Audio & External Link/YouTube Publishing | Yes | Yes (`posts`, `post_media`, `post_external_media`, `00108`) | Yes | **VERIFIED LIVE** | Fixed CSP `frame-src`/`img-src`, YouTube handshake, and `validateComposer` for link-only/media-only posts. |
| **Pillar 3: Media & Creators** | Composer Draft Auto-Save & Abandoned Draft Reminder Banner | Yes | LocalStorage + `creator_content_drafts` | Yes | **VERIFIED LIVE** | Protected local media on backspace (`isAutoSaveClearingRef`), eliminated phantom drafts, and unified server + local cleanup on publish/discard. |
| **Pillar 3: Media & Creators** | Creator Hub, Fan Subscriptions, Tips, Podcasts & Live | Yes | Yes (`creator_accounts`, `fan_subscriptions`, `podcasts`, `livestreams`) | Yes | **VERIFIED LIVE** | Replaced hardcoded string with live `activeSubs.length`, switched to integer `balance_minor`, and linked Creator Academy to `/learn`. |
| **Pillar 4: Commerce & Opportunity** | Marketplace, Shoppable Posts, Escrow Orders, Events & Relief | Yes | Yes (`products`, `orders`, `place_order_with_escrow`, `events`, `relief_campaigns`) | Yes | **VERIFIED LIVE** | Fixed `#FF7A59` button contrast on `/relief`, `ShoppablePostWidget`, and `DiasporaAdsManagerModal`. |
| **Pillar 4: Commerce & Opportunity** | Financial Center & Double-Entry Ledger | Yes | Yes (`ledger_accounts`, `ledger_entries`, `trg_ledger_sum_zero`) | Yes | **VERIFIED LIVE** | Ocean Depth (`#0B1F33`) tokens applied; `TransactionLedgerService` wired into Stripe webhook. |
| **Pillar 5: Intelligence & Connection** | CaribAI Assistant & EN/ES/FR/HT Translation | Yes | Yes (`@caribbean/ai`, `/api/translate`, OpenRouter) | Yes | **VERIFIED LIVE** | Preserved deterministic fallback when external AI provider is unavailable. |
