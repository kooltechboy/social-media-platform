# TUKUBI — Defect Register & Technical Debt Backlog
## Document Reference: TUKUBI-EXCELLENCE-DEFECT-001

### 1. Severity Classification Schema
- **P0 (Critical):** Application crashes, data corruption, financial leakage, security breach, or blocked core user journeys.
- **P1 (Major):** Broken secondary feature, layout clipping, missing mobile touch target, or degraded responsive experience.
- **P2 (Normal):** Inconsistent design token usage, minor contrast issue, unoptimized asset, or dead link fallback.
- **P3 (Trivial):** Code smell, unused import, cosmetic alignment, or documentation typo.

---

### 2. Defect Backlog & Remediation Status

| Defect ID | Severity | Subsystem | Description & Root Cause | Resolution Strategy | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **DEF-01** | **P0** | **Mobile Nav Parity** | Web mobile navigation had 6 bottom items (`Home`, `Shorts`, `Create`, `Explore`, `Messages`, `Profile`), whereas Universal Expo mobile and industry standards (Instagram/TikTok/Twitter) use a clean 5-destination bottom bar with `Messages` in the persistent top app bar. | Refactor `MobileNav` in `apps/web` and `apps/mobile/App.tsx` to 5 persistent tabs (`Home`, `Discover`, `Create`, `Shots`, `Profile`) and expose `Messages` with unread badge in the top mobile header. | **IN PROGRESS (PHASE 3)** |
| **DEF-02** | **P1** | **Universal Link oEmbed Resilience** | Some external providers (Facebook/Instagram/TikTok) occasionally block oEmbed scraping with rate limits or login walls. | Enhance `universal-link-intelligence` to supply rich deterministic fallbacks with 9:16 aspect ratios and platform-native badges when oEmbed is unreachable. | **VERIFIED PASSING** |
| **DEF-03** | **P1** | **Safe Area Bottom Inset on Mobile** | On notched devices (iPhone X+, modern Android gesture bars), bottom tabs without `pb-safe` or dynamic safe area insets collide with the device home bar. | Ensure `h-safe-b` / `paddingBottom: insets.bottom` is strictly bound to the bottom tab bar. | **VERIFIED** |
| **DEF-04** | **P2** | **Touch Target Compliance (WCAG 2.2 AA)** | Several auxiliary icon buttons in feed cards measured `< 44px` on mobile screens. | Enforce minimum `44px` touch target wrappers across all mobile actionable items. | **RESOLVED & TESTED** |
| **DEF-05** | **P2** | **Profile Header Sticky Stacking** | `profile/[username]/page.tsx` sticky sub-header collided with `AppHeader` due to z-index fighting. | Synchronized `--app-header-h` CSS variable via ResizeObserver to dynamically offset all sub-headers. | **RESOLVED** |
| **DEF-06** | **P3** | **Feed Stacking Prioritization** | Multiple desktop promotional widgets pushed the main post feed below the initial viewport fold. | Streamlined feed layout with sticky sidebars and instant post feed at the top of the center column. | **RESOLVED** |
