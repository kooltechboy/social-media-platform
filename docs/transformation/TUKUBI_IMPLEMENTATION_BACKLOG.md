# TUKUBI Implementation Backlog (`TUKUBI_IMPLEMENTATION_BACKLOG.md`)

**Program:** `TUKUBI-RTP-001`  
**Date:** 2026-10-12  
**Execution Status:** Approved for Immediate Execution (`D-03`, `D-06`)

---

## Phase 2 — P0 Core Reliability, Publishing, Media & Security
- [ ] **P2-01 (`apps/web/next.config.js`):** Add all `ALLOWED_EMBED_ORIGINS` to `TUKUBI_CSP` `frame-src`, add `https://i.ytimg.com` and `https://img.youtube.com` to `img-src` and `images.remotePatterns`, and permit framing on `/embed/:path*`.
- [ ] **P2-02 (`apps/web/src/components/media/rich-media-player.tsx` & `universal-content-card.tsx`):** Add `onLoad` handler to `<iframe ref={iframeRef}>` to clear the 4.5s watchdog timeout, transition `playerState` to `'playing'`, send the YouTube IFrame API `listening` handshake (`{"event":"listening","id":1,"channel":"widget"}`), and add `referrerPolicy="strict-origin-when-cross-origin"`.
- [ ] **P2-03 (`apps/web/src/lib/social/draft-manager.ts`, `universal-composer.tsx`, `create-hub-client.tsx`, `draft-actions.ts`):**
  - Update `hasMeaningfulDraftContent` so `mediaSummary` only counts items with a persisted `uploadedUrl`.
  - Subscribe `UniversalComposer` to `subscribeToDraftChanges` so external `clearComposerDraft()` calls immediately reset in-memory composer state without re-saving.
  - Restore `taggedProductIds` cleanly and allow discarding both local and server (`creator_content_drafts`) drafts in `CreateHubClient`.
- [ ] **P2-04 (`apps/web/src/lib/social/actions.ts`):**
  - Parse `link_previews`, `tagged_product_ids`, and rich attachment fields before `validateComposer` so link-preview/poll/event/product posts without body text succeed.
  - Validate `publishAsIdRaw` against a strict UUID regex before `.or()` interpolation.
  - Persist `tagged_product_ids` and clean up active `creator_content_drafts` upon publication.
- [ ] **P2-05 (`apps/web/src/middleware.ts` & `apps/web/src/lib/supabase/server.ts`):** Gate `PLAYWRIGHT_TEST === '1'` behind `process.env.NODE_ENV !== 'production'`.
- [ ] **P2-06 (`supabase/migrations/00108_phase2_security_rls_and_publishing_lifecycle.sql` & `packages/database/src/index.ts`):**
  - Harden `prevent_banned_tester_posts()` (`SET search_path = public, pg_temp` + `REVOKE`).
  - Fix IDOR in `get_available_identities(p_user_id)` and community role check in `can_publish_as`.
  - Restrict `place_order_with_escrow`, `relief_donations`, and `feed_activity_timeline` writes to authorized server/owner contexts.
  - Add lifecycle columns (`status`, `idempotency_key`, `published_post_id`, `external_media`, `poll_payload`, `tagged_product_ids`, `last_error`) to `public.creator_content_drafts`.
  - Sync `Table` union in `packages/database/src/index.ts`.

## Phase 3 — Brand, Design System, Accessibility & Navigation (`D-01`, `D-02`)
- [ ] **P3-01 (`packages/design-system/src/index.ts`, `apps/web/src/app/globals.css`, `apps/web/tailwind.config.js`, `apps/mobile/src/theme/tokens.ts`):**
  - Add `oceanDepth: '#0B1F33'`, `emberCoral: '#C2410C'`, `deepSea: '#0E7490'`, `islandDaylight` light theme token set, `motion`, and `localeLayout` tokens.
  - Upgrade `islandVibes.textDim` from `#71717A` to `#A1A1AA` (`>= 5.10:1` WCAG AA).
  - Add `--brand-ocean-depth`, `[data-theme="island-daylight"]`, and `@media (prefers-reduced-motion: reduce)` to `globals.css`.
- [ ] **P3-02 (WCAG 2.2 AA Contrast & Viewport Zoom Fixes):**
  - Enable pinch-to-zoom in `apps/web/src/app/layout.tsx`.
  - Replace `text-white` on `#FF7A59` (`bg-brand-sunriseCoral` / `TOKENS.action`) with `#110D17` (`text-brand-twilight` / `TOKENS.canvas`) across Web (`diaspora-ads-manager-modal.tsx`, `shoppable-post-widget.tsx`, `creator-tier-modal.tsx`) and Mobile (`BottomNav.tsx`, `Header.tsx`, `HomeScreen.tsx`, `ExploreScreen.tsx`, `ProfileScreen.tsx`).
- [ ] **P3-03 (Mobile & Desktop Navigation Alignment — `D-02`):**
  - Update `apps/web/src/components/mobile-nav.tsx` and `apps/mobile/App.tsx` persistent bottom bar to *Home · Explore · Create · Community · Profile* (with Messages, Notifications, Search, Settings in header/drawer) and replace `"TUKUBI Ecosystem Menu"` with `"More on TUKUBI"`.
  - Elevate `<FeedStream />` in `apps/web/src/components/home/home-dashboard.tsx` above secondary spotlight grids.

## Phase 4 — Discovery, Creator Hub & Truthful Studio Surfaces
- [ ] **P4-01 (`apps/web/src/components/rails/explore-rail.tsx` & `explore-discovery-client.tsx`):** Align vibe filter query links (`music`, `carnival`, `food`, `business`) and deep-link discovery cards to `/post/${post.id}` and `/marketplace/${prod.id}`.
- [ ] **P4-02 (`apps/web/src/app/profile/[username]/page.tsx`):** Fix sticky header collision (`top-[58px]`), default to `posts` tab, and add `role="tablist"` / `role="tab"` / `aria-selected`.
- [ ] **P4-03 (`apps/web/src/app/creator-hub/page.tsx`, `apps/creator-studio`, `apps/business-studio`):** Replace float ledger math with integer minor-unit `balance_minor`, replace hardcoded `"3 Active ($2.99–$9.99)"` with live tier count, link Creator Academy cards to `/learn`, and replace hardcoded fake rows in standalone studio shells with honest empty states.

## Phase 5 & 6 — Automated Verification & Release Readiness Certification
- [ ] **P5-01 (`tests/unit/publishing-draft-lifecycle.test.ts`):** Add comprehensive behavioral unit tests for draft lifecycle, phantom media prevention, external discard sync, link-only post validation, and design-system tokens.
- [ ] **P6-01:** Run `pnpm typecheck`, `pnpm test:unit`, and `pnpm check:prohibited`, and publish `docs/transformation/TUKUBI_RELEASE_READINESS_REPORT.md`.
