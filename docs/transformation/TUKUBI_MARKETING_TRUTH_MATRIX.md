# TUKUBI Marketing & UI Truth Matrix (`TUKUBI_MARKETING_TRUTH_MATRIX.md`)

**Program:** `TUKUBI-RTP-001` (Phase 1 — Forensic Audit & Baseline Verification)  
**Date:** 2026-10-12  
**Mandates:** `AGENTS.md` Mandate 7 & Mandate 10 — Zero fake social proof, zero hardcoded financial/engagement metrics presented as live data, and zero dead buttons on user-facing surfaces.

---

## 1. Public & In-App Copy vs. Code Reality Audit

| Surface / File Path | Displayed Copy / Metric / Control | Current Code Behavior | Truth Verdict | Required Remediation |
| :--- | :--- | :--- | :--- | :--- |
| **`apps/web/src/components/public-front-door.tsx`** | Public landing page showcasing Caribbean territories, diaspora hubs, cultural pillars, and live public posts/communities/events passed from `apps/web/src/app/page.tsx`. | Queries real `posts`, `communities`, and `events` tables from Supabase SSR with honest empty-state handling. | **TRUTHFUL ✅** | Preserve; ensure CTA buttons meet WCAG 2.2 AA contrast. |
| **`apps/web/src/app/creator-hub/page.tsx` (`line 155`)** | Displays "Available for Payout" balance in USD. | Computes `Math.round(Number(ledgerAccount?.balance || 0) * 100)` using floating-point multiplication instead of integer minor units (`balance_minor`). | **VIOLATES MINOR-UNIT RULE ❌** | Use `ledgerAccount?.balance_minor` directly (with safe integer fallback) and format via `formatMinorCurrency`. |
| **`apps/web/src/app/creator-hub/page.tsx` (`line 369`)** | Displays `"3 Active ($2.99–$9.99)"` next to Fan Tiers in Creator Hub even when a creator has 0 tiers configured. | Hardcoded string literal `"3 Active ($2.99–$9.99)"`. | **MISLEADING HARDCODED METRIC ❌** | Query actual tier count from `creator_subscription_tiers` (or show honest `"Manage Tiers"` / `"0 Active"`). |
| **`apps/web/src/app/creator-hub/page.tsx` (`lines 537–569`)** | 4 "Creator Academy & Resources" cards (*Caribbean IP & Copyright*, *Monetizing the Global Diaspora*, *Low-Bandwidth Production*, *Pitching Island Brands*) with interactive hover borders. | Rendered as plain `<div>` elements with no `<Link>` or click action. | **DEAD INTERACTIVE CARDS ❌** | Wrap cards in `<Link href="/learn">` (or `/help`) so clicking opens actual educational resources. |
| **`apps/web/src/components/create-hub-client.tsx` (`lines 159–185`)** | Creation Suite quick-launch cards: `Promote / Ad` (`line 159`) and `Job Listing` (`line 168`). | `ad` links to `/creator-studio` instead of `/ads/new`; `job` links to `/marketplace` browse page. | **MISROUTED CTAs ❌** | Point `ad` to `/ads/new` and `job` to `/marketplace/seller-center/create`. |
| **`apps/web/src/components/explore-discovery-client.tsx` (`lines 645, 740, 867`)** | Discovery cards for Trending Posts (`"View in Feed →"`), Events, and Marketplace Products. | Link to generic index routes (`/`, `/events`, `/marketplace`) instead of the specific item. | **GENERIC FALLBACK LINKS ❌** | Link post cards to `/post/${post.id}` and product cards to `/marketplace/${prod.id}`. |
| **`apps/creator-studio/src/app/schedule/page.tsx` & `vault/page.tsx`** | Standalone port-3002 app displays 3 scheduled broadcasts (`sch_1..3`) and 3 HLS video assets (`ast_01..03`) with `+ Schedule Event` / `+ Ingest New Media Asset` buttons. | Hardcoded static arrays with `DB=False` and buttons without handlers. | **FAKE DATA IN COMPANION SHELL ❌** | Replace hardcoded fake arrays in `apps/creator-studio` with honest empty states and links to `/creator-studio` in `apps/web`. |
| **`apps/business-studio/src/app/campaigns/page.tsx` & `team/page.tsx`** | Standalone port-3003 app displays 3 ad campaigns (`CMP-301..302`) and 3 staff members (`@bluemountain.store`) with dead action buttons. | Hardcoded static arrays with `DB=False` and buttons without handlers. | **FAKE DATA IN COMPANION SHELL ❌** | Replace hardcoded fake arrays in `apps/business-studio` with honest empty states and links to `/merchant` & `/ads` in `apps/web`. |
