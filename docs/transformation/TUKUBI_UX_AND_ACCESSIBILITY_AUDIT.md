# TUKUBI UX, Navigation & Accessibility Audit (`TUKUBI_UX_AND_ACCESSIBILITY_AUDIT.md`)

**Program:** `TUKUBI-RTP-001` (Phase 1 Forensic Audit & Phase 3 Remediation Plan)  
**Date:** 2026-10-12  
**Owner Decision Reference:** `D-02` (*Mobile persistent navigation = Home · Explore · Create · Community · Profile; Messages, Notifications, Search, Settings in persistent header*)  
**Standard:** WCAG 2.2 Level AA

---

## 1. Verified WCAG 2.2 AA Accessibility Defects

| ID | Severity | File Path & Lines | WCAG 2.2 Criterion | Defect Description | Phase 2/3 Fix |
| :--- | :---: | :--- | :--- | :--- | :--- |
| **A11Y-01** | **P0** | `apps/web/src/app/layout.tsx:75-76` | SC 1.4.4 (Resize Text) | `maximumScale: 1, userScalable: false` blocks pinch-to-zoom on mobile browsers. | Set `maximumScale: 5, userScalable: true`. |
| **A11Y-02** | **P0** | `apps/web/src/components/diaspora-ads-manager-modal.tsx:172, 306, 429` | SC 1.4.3 (Contrast Minimum) | `bg-brand-sunriseCoral text-white` yields `2.33:1` contrast (requires `4.5:1`). | Replace `text-white` with `text-brand-twilight` (`#110D17`, `7.48:1`). |
| **A11Y-03** | **P0** | `apps/web/src/components/shoppable-post-widget.tsx:181` | SC 1.4.3 (Contrast Minimum) | `from-brand-sunriseCoral to-brand-goldenHour ... text-white` yields `1.78:1`–`2.33:1`. | Replace `text-white` with `text-brand-twilight font-black` (`7.48:1`–`10.9:1`). |
| **A11Y-04** | **P0** | `apps/web/src/components/creator-tier-modal.tsx:56` | SC 1.4.3 (Contrast Minimum) | `from-brand-caribbeanSea to-brand-sunriseCoral ... text-white` fails contrast on coral gradient end. | Replace `text-white` with `text-brand-twilight`. |
| **A11Y-05** | **P0** | `apps/mobile/src/components/{BottomNav.tsx:89,99, Header.tsx:172,181}` & `screens/{HomeScreen.tsx:921,930,963,969, ExploreScreen.tsx:490,607,616,842, ProfileScreen.tsx:675,681,742,748}` | SC 1.4.3 (Contrast Minimum) | Mobile buttons/badges with `backgroundColor: TOKENS.action` (`#FF7A59`) use `#FFF` / `#FFFFFF` text (`2.33:1`). | Use `TOKENS.actionText` (`#110D17`, `7.48:1`). |
| **A11Y-06** | **P1** | `packages/design-system/src/index.ts:38` & `apps/web/tailwind.config.js:56` | SC 1.4.3 (Contrast Minimum) | `textDim: '#71717A'` yields `2.90:1`–`3.95:1` on dark surfaces. | Upgrade `textDim` to `#A1A1AA` (`5.10:1`–`6.95:1`). |
| **A11Y-07** | **P1** | `apps/web/src/app/globals.css:174-182` | SC 2.3.3 (Animation from Interactions) | Keyframe animations and hover transforms lack `@media (prefers-reduced-motion: reduce)` guards. | Add reduced-motion media query in `globals.css`. |
| **A11Y-08** | **P1** | `apps/web/src/app/profile/[username]/page.tsx:510-604` | SC 4.1.2 (Name, Role, Value) | Profile navigation tab bar lacks `role="tablist"`, `role="tab"`, and `aria-selected`. | Add semantic ARIA tab attributes and fix sticky header offset (`top-[58px]`). |

---

## 2. Navigation Architecture Audit & Alignment Plan (`D-02`)

### 2.1 Mobile Persistent Navigation Alignment
- **Current Web `MobileNav` (`apps/web/src/components/mobile-nav.tsx:488-591`):** Renders *Home · Explore · Create · Messages · Menu*, burying *Communities* and *Profile* inside the drawer and labeling the drawer `aria-label="TUKUBI Ecosystem Menu"`.
- **Current Native `App.tsx` (`apps/mobile/App.tsx:185-202`):** Renders *Home · Explore · CreateAction · Messages · Profile*, hiding `Communities` (`tabBarButton: () => null`).
- **Phase 3 Target (`D-02`):**
  1. Both Web `MobileNav` and Native `App.tsx` render the 5 persistent bottom destinations: **Home (`/`) · Explore (`/explore`) · Create (`/create` / sheet) · Community (`/communities`) · Profile (`/profile/[username]`)**.
  2. **Messages (`/messages`)**, **Notifications (`/notifications`)**, **Search (`/search`)**, and **Settings / More** remain immediately accessible in the persistent top header (`AppHeader` / `Header.tsx`).

### 2.2 Desktop 3-Column Layout & Above-the-Fold Feed Clarity
- **Left Column (`AppSidebar`):** Prioritizes the 5 Core Pillars (*Home, Explore, Create, Communities, Profile*) plus secondary utilities and a clean collapsible *More* section, fixing the `/profile` link to route directly to `/profile/${user.username}` when known.
- **Center Column (`HomeDashboard`):** Prioritizes Moments, the Unified Composer prompt, the Feed Filter Bar, and `<FeedStream />` above the fold so users immediately engage with real posts rather than scrolling past 7 promotional spotlight banners.
- **Right Column (`RightRail`):** Surfaces Trending Caribbean Topics, Upcoming Events, and Suggested Communities.
