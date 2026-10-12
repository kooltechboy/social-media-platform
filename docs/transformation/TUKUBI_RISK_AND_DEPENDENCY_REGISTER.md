# TUKUBI Risk & Dependency Register (`TUKUBI_RISK_AND_DEPENDENCY_REGISTER.md`)

**Program:** `TUKUBI-RTP-001`  
**Date:** 2026-10-12  

---

## 1. Active Risk Register & Mitigation Status

| Risk ID | Category | Severity | Description & Forensic Root Cause | Mitigation & Verification Gate | Status |
| :--- | :--- | :---: | :--- | :--- | :---: |
| **R-01** | Publishing & Drafts | **P0** | Abandoned draft reminders remain visible after discard or publish; selecting local images without uploading creates un-restorable ghost drafts; link-only posts fail `validateComposer`. | 1. Filter `hasMeaningfulDraftContent` so `mediaSummary` requires `uploadedUrl`.<br>2. Subscribe `UniversalComposer` to `subscribeToDraftChanges` so external discard clears composer state.<br>3. Clear `creator_content_drafts` on discard/publish.<br>4. Include `linkPreviews` & attachments in `createPostAction` validation. | **PHASE 2 FIX** |
| **R-02** | Media & External Embeds | **P0** | YouTube and external video embeds fail in feed because `TUKUBI_CSP` `frame-src` omits `ALLOWED_EMBED_ORIGINS` and `RichMediaPlayer` times out after 4.5s without an `<iframe onLoad>` handler or YouTube `listening` handshake. | 1. Whitelist `ALLOWED_EMBED_ORIGINS` in `next.config.js` `frame-src` and `i.ytimg.com`/`img.youtube.com` in `img-src`/`remotePatterns`.<br>2. Add `onLoad` handler + YouTube `listening` postMessage handshake in `RichMediaPlayer`. | **PHASE 2 FIX** |
| **R-03** | Database & Financial Security | **P0** | `place_order_with_escrow` (`00102`) and `relief_donations` (`00103`) allow direct client calls/inserts without payment verification; `get_available_identities` (`00097`) has an IDOR; `prevent_banned_tester_posts` (`00106`) lacks `SET search_path`. | Deliver additive migration `00108_phase2_security_rls_and_publishing_lifecycle.sql` revoking direct client grants, enforcing `auth.uid()`, and locking `search_path`. | **PHASE 2 FIX** |
| **R-04** | Auth Bypass in Production Config | **P1** | `PLAYWRIGHT_TEST === '1'` in `middleware.ts` and `server.ts` trusts unsigned `tukubi_user_session` cookie without checking `NODE_ENV !== 'production'`. | Gate `PLAYWRIGHT_TEST === '1'` behind `process.env.NODE_ENV !== 'production'` and validate `publishAsIdRaw` UUID format in `actions.ts`. | **PHASE 2 FIX** |
| **R-05** | WCAG 2.2 AA Contrast & Zoom | **P1** | `#FF7A59` Sunrise Coral buttons with `#FFFFFF` text yield `2.33:1` contrast; `textDim: '#71717A'` yields `< 4.0:1`; `layout.tsx` blocks pinch-to-zoom (`userScalable: false`). | Enforce `#110D17` dark ink on `#FF7A59` buttons (`7.48:1` AAA), upgrade `textDim` to `#A1A1AA`, and enable pinch-to-zoom in `layout.tsx`. | **PHASE 3 FIX** |
| **R-06** | Navigation Sprawl & Discrepancy | **P1** | Web `MobileNav` and Native `App.tsx` differ on the 5 bottom tabs; `HomeDashboard` buries `<FeedStream />` below 7 stacked spotlight cards. | Align mobile bottom nav to *Home · Explore · Create · Community · Profile* (`D-02`) and elevate `<FeedStream />` in `HomeDashboard`. | **PHASE 3 FIX** |
| **R-07** | Mock Data in Companion Shells | **P2** | Standalone `apps/creator-studio` and `apps/business-studio` contain hardcoded fake rows (`sch_1..3`, `ast_01..03`, `CMP-301..302`) and port `3002` collided with `apps/moderation`. | Port `3004` assigned to `apps/moderation`; replace fake rows in `creator-hub`, `apps/creator-studio`, and `apps/business-studio` with honest data/empty states. | **PHASE 0/4 FIX** |
