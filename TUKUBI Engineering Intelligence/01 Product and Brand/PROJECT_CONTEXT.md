---
title: "PROJECT_CONTEXT — TUKUBI Product Identity, Positioning & Governance"
type: product-context
status: verified
owner: Product & Brand Architecture
created: 2026-10-28
updated: 2026-10-28
tags:
  - tukubi
  - brand
  - product-vision
  - caribbean
related:
  - "[[TUKUBI Engineering Intelligence]]"
  - "[[02 Architecture/SYSTEM_ARCHITECTURE]]"
---

# PROJECT_CONTEXT — TUKUBI

## 1. Product Identity & Positioning

- **Product Name:** **TUKUBI**
- **Tagline:** **The Caribbean Connected.**
- **Global Positioning:** **Born in the Caribbean. Built for the World.**
- **Primary Domain:** `https://www.tukubi.com/`
- **Source Repository:** `https://github.com/kooltechboy/social-media-platform`

TUKUBI is a Caribbean-born social, creator, community, commerce, and cultural connection platform engineered for individuals, creators, pages, businesses, and the global Caribbean diaspora.

---

## 2. Binding Brand & Cultural Governance Rules

1. **Primary Brand Identity (`TUKUBI`):**
   - Never append `"Ecosystem"` beside the primary brand name as a replacement identity (e.g., never use `"TUKUBI Ecosystem"` or `"TUKUBI: Caribbean Digital Ecosystem"` as the product title).
   - Verified and remediated across `ARCHITECTURE.md`, `PRODUCT-REQUIREMENTS.md`, `AGENTS.md`, `apps/web/src/app/learn/page.tsx`, `apps/web/src/app/pages/page.tsx`, `apps/web/src/components/mobile-nav.tsx`, `apps/web/src/components/app-header.tsx`, `apps/web/src/app/profile/[username]/page.tsx`, and `apps/web/src/lib/help/articles-data.ts`.
2. **Etymology Honesty:**
   - Never describe `TUKUBI` as an authenticated historical Kalinago term. Zero instances exist in the repository.
3. **Cultural Pluralism & Respect:**
   - Treat Caribbean nations, islands, territories, languages (English, Spanish, French, Dutch, Haitian Creole, Jamaican Patois, Trinidadian/Eastern Caribbean Creoles, Papiamento), and global diaspora hubs (New York, London, Toronto, Miami) individually and respectfully.
   - Cultural identity and location disclosure are optional and user-controlled (`dob_visibility`, `address_visibility`, `relationship_visibility`, `profile_visibility`).
4. **Zero Fake Data & Zero Prohibited Providers:**
   - Never introduce fake user accounts, synthetic follower counts, fabricated engagement, or mock metrics into user-facing surfaces.
   - Enforced via automated CI gate (`pnpm check:prohibited` -> `scripts/security/check-prohibited-terms.js`).

---

## 3. Target Audience & Core Value Proposition

| Segment | Core Needs | TUKUBI Capabilities |
|---|---|---|
| **Individuals & Diaspora** | Stay connected with family, island news, cultural events, and friends across islands and diaspora cities | Unified Home Feed, Island Hub (`/islands`), Cultural Events (`/events`), Direct & Group Messaging (`/messages`), Audio/Video Calls, Voice Notes |
| **Creators & Artists** | Publish vertical video, music/sounds, podcasts, and livestreams; build audience and monetize | TUKUBI Shorts (`/shorts`), Reels (`/reels`), Caribbean Sounds (`/sounds`), Podcasts (`/podcasts`), Live Studio (`/live`), Creator Studio (`/creator-studio`), Tipping & Subscriptions |
| **Communities & Cultural Groups** | Organize local and diaspora groups with structured moderation | Communities (`/communities`), Role-based Community Moderation, Pinned Announcements |
| **Pages, Businesses & Organizers** | Establish an official presence, publish as a Page, sell products/tickets, and run targeted ads | Universal Pages (`/pages`), Identity Switcher (Personal vs. Page), Marketplace (`/marketplace`), TUKUBI Ads Manager (`/ads`) with PayPal checkout |

---

## 4. Aesthetic & Design System (`Caribbean Futurism`)

Defined in `@caribbean/design-system` (`packages/design-system/src/index.ts`) and `apps/web/src/app/globals.css`:

### 4.1 Official Brand Master Palette
Formally measured from the definitive brand board (`media_1793323302123_b3aab962.jpg`):
- **Caribbean Teal:** `#00C2A8` (Primary symbol gradient stop & highlight)
- **Ocean Blue:** `#0EA5E9` (Sky/sea midtone gradient stop)
- **Violet:** `#8B5CF6` (Twilight transition gradient stop)
- **Sunset Orange:** `#F59E0B` (Swoop foot and warm energy gradient stop)
- **Deep Navy:** `#0B1B3B` (Primary brand container & dark contrast anchor)
- **Sand:** `#F8FAFC` (Pure crisp light surface & text token)

### 4.2 Official Brand Mark & Asset System
Canonical assets located in `packages/design-system/brand/` and mirrored across all web, admin, moderation, studio, and mobile applications:
- **Symbol:** Stylized "T" with ribbon swoop fold and 3 radiating Caribbean fronds/splashes (`tukubi-symbol.svg`, `tukubi-symbol-white.svg`, `tukubi-symbol-monochrome.svg`).
- **Horizontal Primary Logo:** Approved symbol + geometric "TUKUBI" wordmark + "The Caribbean Connected" tagline (`tukubi-logo.svg`, `tukubi-logo-dark.svg`, `tukubi-logo-white.svg`, `tukubi-logo-monochrome.svg`).
- **Stacked & Compact Variants:** `tukubi-logo-stacked.svg`, `tukubi-logo-compact.svg`.
- **Mobile Icons & Launcher:** Squircle container on `#0B1B3B` (`tukubi-app-icon.svg`, `tukubi-app-icon-1024.png`, `tukubi-adaptive-foreground.png`, `tukubi-adaptive-background.png`).
- **Web & PWA Icons:** `favicon.ico` (multi-res 16/32/48), `apple-touch-icon.png` (180x180), `icon-192.png`, `icon-512.png`, `icon-maskable-192.png`, `icon-maskable-512.png`.
- **OpenGraph Card:** `tukubi-og-card.png` (1200x630).

### 4.3 Theme Surface Palettes
- **Primary Dark Theme (`Island Vibes`):**
  - Background Primary: `#110D17` (`Deep Twilight`)
  - Background Secondary: `#1B1426` (`Dusk`)
  - Background Elevated: `#251C33` (`Sunset Plum`)
  - Text Primary: `#FFFDF9` (`Warm Sandstone` — 18.6:1 contrast on `#110D17`)
  - Action Primary: `#FF7A59` (`Sunrise Coral` with `#110D17` dark ink text — 7.48:1 AAA contrast)
  - Accent Secondary: `#FFAF42` (`Golden Hour`)
  - Accent Info / Links: `#38BDF8` (`Caribbean Sea`)
- **Daylight Theme (`Island Daylight`):**
  - Background Primary: `#FFFDF9`, Secondary: `#F8F4EC`, Elevated: `#EFE9DD`, Text Primary: `#1B1426` (16.5:1 AAA contrast).
  - User-selectable in `/settings` and persisted via both `profiles.theme_preference` and the `tukubi_theme` SSR cookie.
