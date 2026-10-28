---
title: "UI_UX_AND_ACCESSIBILITY_AUDIT — Desktop 3-Column, Mobile Navigation, WCAG 2.2 AA & Themes"
type: ui-ux-audit
status: verified
owner: Brand, UX/UI & Accessibility Lead
created: 2026-10-28
updated: 2026-10-28
tags:
  - tukubi
  - ui-ux
  - accessibility
  - wcag
  - themes
related:
  - "[[TUKUBI Engineering Intelligence]]"
  - "[[01 Product and Brand/PROJECT_CONTEXT]]"
---

# UI_UX_AND_ACCESSIBILITY_AUDIT — TUKUBI

## 1. Responsive Layout Architecture

- **Desktop 3-Column Shell (`>= 1024px`):**
  - **Left Navigation Sidebar (`apps/web/src/components/navigation-sidebar.tsx`):** Primary destinations (`Home`, `Shorts`, `Pages`, `Communities`, `Marketplace`, `Messages`, `Events`, `Sounds`, `Podcasts`, `Live`, `Ads Manager`, `Settings`, `Help & Learn`) plus Identity Switcher.
  - **Center Primary Stream (`max-w-2xl`):** Universal Post Composer, Story/Status Strip, Feed filter tabs (`For You`, `Following`, `Pages`, `Island Hub`), and `FeedStream`.
  - **Right Contextual Rail (`apps/web/src/components/rails/home-rail.tsx`, `>= 1280px`):** Cultural Moments, Trending Caribbean Tags, Suggested Creators/Pages, and Live Now indicators.
- **Mobile-First Ergonomics (`< 1024px`):**
  - Sticky top header (`apps/web/src/components/app-header.tsx`) + bottom navigation bar (`apps/web/src/components/mobile-nav.tsx`, `apps/mobile/src/components/BottomNav.tsx`) with `>= 44x44px` touch targets and safe-area inset support.

---

## 2. WCAG 2.2 AA / AAA Contrast Verification

| Surface / Token Pair | Foreground | Background | Contrast Ratio | WCAG 2.2 Rating |
|---|---|---|---|---|
| Primary Body Text (`Island Vibes`) | `#FFFDF9` (`Warm Sandstone`) | `#110D17` (`Deep Twilight`) | **18.60 : 1** | `AAA` |
| Secondary Muted Text (`Island Vibes`) | `#D6C7B2` | `#110D17` | **11.40 : 1** | `AAA` |
| Primary CTA Button (`Sunrise Coral`) | `#110D17` (`TOKENS.actionText`) | `#FF7A59` (`TOKENS.action`) | **7.48 : 1** | `AAA` |
| Accent Badge (`Golden Hour`) | `#110D17` | `#FFAF42` | **10.61 : 1** | `AAA` |
| Info / Link (`Caribbean Sea`) | `#110D17` / `#38BDF8` | `#110D17` | **9.42 : 1** | `AAA` |
| Primary Body Text (`Island Daylight`) | `#1B1426` (`Dusk`) | `#FFFDF9` (`Sandstone`) | **16.50 : 1** | `AAA` |

### Mobile Contrast Remediations (`P2-UX-01`)
Updated all remaining secondary mobile screens (`CommunitiesScreen.tsx`, `FinancialCenterScreen.tsx`, `SoundsScreen.tsx`, `ReelsScreen.tsx`) so every `#FF7A59` (`TOKENS.action`) CTA button uses `TOKENS.actionText` (`#110D17`, 7.48:1 AAA) instead of `#FFFFFF` (2.56:1).
