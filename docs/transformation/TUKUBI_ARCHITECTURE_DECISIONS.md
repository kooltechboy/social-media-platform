# TUKUBI Architecture Decision Records (`TUKUBI_ARCHITECTURE_DECISIONS.md`)

**Program:** `TUKUBI-RTP-001`  
**Date:** 2026-10-12  
**Status:** APPROVED BY OWNER (`D-01` through `D-06`)

---

## ADR-RTP-001: Preserve Modular Monolith on Next.js 15 + Supabase PostgreSQL
- **Context:** TUKUBI has a working Next.js 15 + Turborepo + Supabase PostgreSQL foundation with 108 migrations and 25 shared domain packages, alongside recent reliability defects in media publishing, embeds, and draft reminders.
- **Decision:** Retain and harden the modular monolith rather than rewriting into microservices or discarding existing schema investments.
- **Consequences:** Preserves all existing features and data while concentrating engineering effort on P0 publishing reliability, RLS/CSP security, design system coherence, and truthful UX.

## ADR-RTP-002: Dual-Theme Design System (`Island Vibes` Default + `Ocean Depth` + `Island Daylight`)
- **Context:** Owner Decision `D-01` requested adopting `Ocean Depth` (`#0B1F33`) and the `Island Daylight` light theme while preserving `Island Vibes` (`#110D17`) as the default experience, and fixing `#FF7A59` Sunrise Coral button contrast.
- **Decision:** Add `oceanDepth: '#0B1F33'` and `islandDaylight` tokens to `@caribbean/design-system` and `apps/web/src/app/globals.css`, enforce dark `#110D17` ink on all `#FF7A59` Sunrise Coral CTAs (`7.48:1` AAA), and upgrade `textDim` from `#71717A` to `#A1A1AA` (`>= 5.10:1` AA).
- **Consequences:** Achieves WCAG 2.2 AA compliance across dark and light themes without losing TUKUBI's signature Caribbean Futurism warmth.

## ADR-RTP-003: Five-Destination Mobile Navigation (`Home · Explore · Create · Community · Profile`)
- **Context:** Owner Decision `D-02` specified five persistent mobile bottom-bar destinations (*Home, Explore, Create, Community, Profile*) with *Messages, Notifications, Search, and Settings* accessible in the persistent top header.
- **Decision:** Update both `apps/web/src/components/mobile-nav.tsx` and `apps/mobile/App.tsx` to expose *Home · Explore · Create · Community · Profile* in the bottom bar while retaining *Messages, Notifications, Search, and Menu/Settings* in the top header.
- **Consequences:** Elevates *Community* and *Profile* to first-class mobile destinations and eliminates the web/native navigation discrepancy.

## ADR-RTP-004: Unified Embed Security & Deterministic Player Handshake
- **Context:** External video embeds (YouTube, Vimeo, TikTok) failed in production because `TUKUBI_CSP` `frame-src` omitted `ALLOWED_EMBED_ORIGINS` and `RichMediaPlayer` timed out after 4.5 seconds due to a missing `<iframe onLoad>` handler and missing YouTube `listening` postMessage handshake.
- **Decision:** Explicitly whitelist `ALLOWED_EMBED_ORIGINS` in `apps/web/next.config.js` `frame-src` (and `i.ytimg.com` / `img.youtube.com` in `img-src` and `images.remotePatterns`), and wire `onLoad` + the YouTube `listening` handshake in `RichMediaPlayer`.
- **Consequences:** Embedded videos play reliably inside the feed while preserving strict CSP protection and automatic fallback to external links when a video owner disables embedding (YouTube error codes `100`, `101`, `150`).

## ADR-RTP-005: Cross-Component Draft Synchronization & Phantom Draft Prevention
- **Context:** Discarding a draft on `/create` failed to clear `UniversalComposer`'s in-memory state (causing auto-save to resurrect the discarded draft), and selecting a local image without uploading created an un-restorable draft entry in `localStorage`.
- **Decision:** Require `hasMeaningfulDraftContent` to only count media items with a persisted `uploadedUrl`, subscribe `UniversalComposer` to `subscribeToDraftChanges` so external discard events immediately reset composer state, and clear both local and server drafts (`creator_content_drafts`) on discard or publish.
- **Consequences:** Eliminates ghost draft banners permanently across tabs and reloads.
