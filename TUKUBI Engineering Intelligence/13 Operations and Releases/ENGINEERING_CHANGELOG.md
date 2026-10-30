---
title: "ENGINEERING_CHANGELOG — TUKUBI Giant Among Giants Transformation Log"
type: changelog
status: verified
owner: Release Manager
created: 2026-10-28
updated: 2026-10-30
tags:
  - tukubi
  - changelog
  - release
related:
  - "[[TUKUBI Engineering Intelligence]]"
  - "[[00 Dashboard/TECHNICAL_DEBT_REGISTER]]"
---

# ENGINEERING_CHANGELOG — TUKUBI

## [2026-10-30] — TUKUBI: "Midnight Reef" Mobile App & Mobile Web Refactor

### 1. Universal Native Expo App (`apps/mobile`) — Complete 17-Screen Midnight Reef Upgrade
- Upgraded native design tokens (`apps/mobile/src/theme/tokens.ts`) and `apps/mobile/app.json` from legacy dark-plum Island Vibes (`#110D17` / `#1D1429` / `#FF7A59`) to official **Midnight Reef** (`canvas: '#070D1A'`, `oceanDepth: '#0B1B3B'`, `surface: '#0D1628'`, `raised: '#15213A'`, `teal: '#00C2A8'`, `action: '#0EA5E9'`, `actionText: '#041019'`, `purple: '#8B5CF6'`, `accent: '#F59E0B'`, `textPrimary: '#E8EDF5'`), preserving `LEGACY_ISLAND_VIBES_TOKENS` for historical reference.
- Refactored native navigation shell (`apps/mobile/App.tsx`, `Header.tsx`, `BottomNav.tsx`, `CreateActionSheet.tsx`) with `@expo/vector-icons` (`Ionicons`), official `tukubi-emblem.png` lockup, WCAG `44x44pt` touch targets, and a flush-integrated `44x34` `#00C2A8` `+` creation pill button.
- Refactored all **17 native screens** (`AuthScreen`, `HomeScreen`, `FeedsScreen`, `ExploreScreen`, `ProfileScreen`, `ReelsScreen`, `LiveScreen`, `SoundsScreen`, `PodcastsScreen`, `CreateScreen`, `MessagesScreen`, `CommunitiesScreen`, `MarketplaceScreen`, `SellProductScreen`, `FinancialCenterScreen`, `NotificationsScreen`, `FriendsScreen`) to Midnight Reef:
  - Added `62x62` circular ringed Stories/Moments bar, executive `#0D1628` composer with vector actions, edge-to-edge underline feed tabs, and 2-line editorial post headers in `HomeScreen` and `FeedsScreen`.
  - Enforced optional, private-by-default cultural heritage selectors (`country` defaults to `''` / unspecified) in `AuthScreen`, `CreateScreen`, and `SellProductScreen` (`AGENTS.md` Rule #8).
  - Preserved all §3.1.1 Apple/Google IAP vs. Marketplace rail separation notices in `FinancialCenterScreen` (`AGENTS.md` Rule #9), fullscreen escape controls on `ReelsScreen` and `LiveScreen`, and Supabase Realtime + RPC read-receipt wiring in `MessagesScreen`.

### 2. Mobile Web & PWA (`apps/web` `< md` Responsive Viewport)
- Decluttered mobile top header (`app-header.tsx`, `session-widget.tsx`) by hiding redundant authenticated `SessionWidget` avatar+chevron on `< md` while keeping `44x44px` touch targets for `Search`, `Notifications`, and `Menu`.
- Replaced protruding `-mt-4` neon `Create` circle in `mobile-nav.tsx` with a sleek flush-integrated `w-11 h-8 rounded-xl` `#00C2A8 → #0EA5E9` `+` pill button, upgraded both mobile bottom sheets (`Create on TUKUBI` & `Ecosystem Menu`) to `#0D1628` Midnight Reef, and replaced all 10 raw emojis in the Create Sheet with Lucide vector icon badges.
- Added the signature mobile (`md:hidden`) circular `60x60px` gradient-ringed Stories/Moments rail in `moments-cinema-rail.tsx`, refactored the mobile feed composer and edge-to-edge underline tab strips (`home-dashboard.tsx`, `feed-navigation.tsx`), compacted post author headers to 2 lines and suppressed redundant standalone URL text above rich embed cards (`feed-post.tsx`), and harmonized `pwa-install-banner.tsx`, `ios-install-modal.tsx`, `shorts-feed-viewer.tsx`, `explore-discovery-client.tsx`, and `profile/[username]/page.tsx`.

### 3. Verification Evidence
- **TypeScript Typecheck:** `0` errors across `@caribbean/design-system`, `apps/mobile`, and `apps/web` (`tsc --noEmit`).
- **Mobile, Theme, Messaging, PWA & WCAG Certification Matrix:** **18 / 18 test suites passed (236 / 236 tests)** via Vitest (`vitest run`) + `0` legacy purple/coral hexes across `apps/mobile` outside `tokens.ts` + `0` prohibited references (`check-prohibited-references.js`).
- **Live iPhone Retina (`390x844 @ 3x DPR`) Verification:** Verified `/`, `/explore` (including Midnight Reef PWA install prompt), `Create on TUKUBI` bottom sheet, `/communities`, and `/login` via headless Chromium (Playwright).

---

## [2026-10-30] — TUKUBI: "Midnight Reef" Desktop Platform Refactor & Official Brand Alignment

### 1. Visual Architecture & Surface Token System (`Midnight Reef`)
- Upgraded the web desktop platform (`apps/web`) from legacy loud plum/purple surfaces (`#110D17`, `#1D1429`, `#140C22`) and heavy coral-rainbow rings to the executive **Midnight Reef** surface architecture grounded in `OFFICIAL_BRAND_PALETTE` (`#00C2A8` Caribbean Teal, `#0EA5E9` Ocean Blue, `#8B5CF6` Violet, `#F59E0B` / `#F4AE45` Sunset Orange / Golden Hour, `#0B1B3B` Deep Navy, `#070D1A` Midnight Canvas, `#E8EDF5` Porcelain).
- Added `colors.midnightReef` and `ThemeMode = 'island-vibes' | 'island-daylight' | 'midnight-reef'` to `packages/design-system/src/index.ts` while preserving legacy `colors.islandVibes` and `colors.brand.twilight` mobile parity contracts.
- Configured self-hosted `Inter` (`--font-sans`) and `Plus_Jakarta_Sans` (`--font-display`) in `apps/web/src/app/layout.tsx`, refined `:root` tokens and `.tk-panel` / `.tk-btn-primary` / `.tk-section-label` / `.tk-text-gradient` primitives in `apps/web/src/app/globals.css`, and hardened `apps/web/postcss.config.js` with explicit config resolution.
- Generated and installed the blue-hour editorial Caribbean coastline backdrop (`apps/web/public/backgrounds/caribbean-blue-hour.jpg`) rendered by `apps/web/src/components/caribbean-sunset-background.tsx`.

### 2. Core Desktop Shell, Rails, Feed & Public Front Door
- Refactored `AppHeader`, `AppSidebar`, `AppShell`, `TukubiLogo` (vector `/brand/tukubi-symbol.svg` lockup), `HomeDashboard` (editorial composer + underline feed tabs), `FeedPost`, `UniversalContentCard`, `UserAvatar`, `FollowButton`, `SessionWidget`, `IdentitySwitcher`, `LanguageDropdown`, and all 10 contextual right rails (`home-rail.tsx`, `explore-rail.tsx`, `communities-rail.tsx`, `creator-studio-rail.tsx`, `events-rail.tsx`, `feeds-rail.tsx`, `marketplace-rail.tsx`, `messages-rail.tsx`, `pages-rail.tsx`, `podcasts-rail.tsx`).
- Rebuilt `PublicFrontDoor` (`apps/web/src/components/public-front-door.tsx`) with a two-column executive hero and live 3-column Desktop Workspace Preview window, 6 product architecture pillars, interactive Island & Territory Explorer, and Caribbean Sounds preview, plus harmonized `TukubiMasterGateway`, `SignInForm`, and `GatewayShell`.
- Eliminated residual hardcoded dark-purple hexes across 100+ UI components and routes in `apps/web/src` (verified 0 remaining purple surface hexes outside sovereign flag SVGs).

### 3. Verification Evidence
- **TypeScript Typecheck:** `0` errors across `@caribbean/design-system` and `apps/web` (`tsc --noEmit`).
- **Prohibited References Gate:** Passed (`node scripts/ci/check-prohibited-references.js`).
- **Full Repository Unit & Audit Suite:** **215 / 215 test files passed (2,336 / 2,336 tests)** via Vitest (`vitest run`), including WCAG 2.2 AA accessibility, design-system performance, desktop responsive certification, SEO/JSON-LD, and mobile token parity suites.
- **Live Desktop Browser Verification:** Verified rendered 2x Retina desktop viewports (`1536x960`) across `/`, `/login`, `/explore`, and `/communities` via headless Chromium (Playwright).

---

## [2026-10-30] — TUKUBI: Official Brand Identity Transformation

### 1. Vector Reconstruction & Master Geometry
- Reconstructed the approved stylized "T" mark featuring Caribbean ribbon fold geometry and 3 radiating Caribbean fronds/splashes from the definitive brand board reference (`media_1793323302123_b3aab962.jpg`).
- Achieved **94.66% IoU** vector contour match on the symbol and **97.30% IoU** on the geometric "TUKUBI" wordmark.
- Established canonical multi-stop gradients matching measured reference colors:
  - Caribbean Teal (`#00C2A8`), Ocean Blue (`#0EA5E9`), Violet (`#8B5CF6`), Sunset Orange (`#F59E0B`), Deep Navy (`#0B1B3B`), and Sand (`#F8FAFC`).
- Generated complete suite of master vector SVGs in `packages/design-system/brand/`:
  - `tukubi-symbol.svg`, `tukubi-symbol-white.svg`, `tukubi-symbol-monochrome.svg`
  - `tukubi-logo.svg`, `tukubi-logo-dark.svg`, `tukubi-logo-white.svg`, `tukubi-logo-monochrome.svg`
  - `tukubi-logo-stacked.svg`, `tukubi-logo-stacked-dark.svg`, `tukubi-logo-compact.svg`
  - `tukubi-app-icon.svg`, `tukubi-app-icon-adaptive-foreground.svg`, `tukubi-app-icon-adaptive-background.svg`
  - `favicon.svg`

### 2. High-Resolution Master Package Exports
- Generated raster exports via headless Chromium at 1x, 2x, and 4x:
  - Primary Logo: `tukubi-logo.png` (800x200), `tukubi-logo-dark.png` (800x200), `tukubi-logo-transparent.png` (800x200), `tukubi-footer-dark.png` (800x200), `tukubi-footer-transparent.png` (800x200)
  - Stacked & Compact: `tukubi-logo-stacked.png` (600x600), `tukubi-logo-stacked-dark.png` (600x600), `tukubi-logo-compact.png` (400x120)
  - Standalone Symbols: `tukubi-symbol-1024.png`, `tukubi-symbol-512.png`, `tukubi-symbol-128.png`, `tukubi-emblem.png` (192x192)
  - Mobile App Icons: `tukubi-app-icon-1024.png`, `tukubi-app-icon-512.png`, `tukubi-adaptive-foreground.png`, `tukubi-adaptive-background.png`
  - Web & PWA Icons: `apple-touch-icon.png` (180x180), `icon-192.png`, `icon-512.png`, `icon-maskable-192.png`, `icon-maskable-512.png`
  - Multi-resolution ICO: `favicon.ico` (16, 32, 48 embedded mipmaps) and standalone `favicon-16.png`, `favicon-32.png`, `favicon-48.png`, `favicon.png`
  - OpenGraph Social Card: `tukubi-og-card.png` (1200x630)

### 3. Centralized Brand Design Architecture & Tokens
- **`@caribbean/design-system` (`packages/design-system/src/index.ts`):**
  - Added `OFFICIAL_BRAND_PALETTE` and specific color tokens (`caribbeanTeal`, `oceanBlue`, `violet`, `sunsetOrange`, `deepNavy`, `sand`).
  - Added `BRAND_ASSETS` registry mapping canonical paths.
  - Maintained backward-compatibility for existing test assertions (`twilight: '#110D17'`, `sunriseCoral: '#FF7A59'`).
- **`@caribbean/ui` (`packages/ui/src/index.tsx`):**
  - Added standalone `BrandSymbol` component with SVG rendering and variant switching (`color`, `white`, `monochrome`, `dark`).
  - Upgraded `BrandLogo` with full variant support (`horizontal`, `emblem`, `full`, `footer-dark`, `footer-transparent`, `stacked`, `compact`, `symbol`).
- **`apps/web/src/components/brand/tukubi-logo.tsx`:**
  - Upgraded component with `variant?: 'horizontal' | 'compact' | 'stacked' | 'symbol'`.
  - Maintained exact tagline "The Caribbean Connected." and wordmark "TUKUBI" required by unit test contracts.

### 4. Platform-Wide Distribution & Application Integration
- Mirrored all canonical brand assets across 6 application packages:
  - `apps/web/public/brand/`, `apps/web/public/icons/`, `apps/web/public/favicon.*`
  - `apps/admin/public/brand/`, `apps/admin/public/favicon.*`
  - `apps/moderation/public/brand/`, `apps/moderation/public/favicon.*`
  - `apps/creator-studio/public/brand/`, `apps/creator-studio/src/app/layout.tsx` (Replaced generic letterbox with official symbol)
  - `apps/business-studio/public/brand/`, `apps/business-studio/src/app/layout.tsx` (Replaced generic letterbox with official symbol)
  - `apps/mobile/assets/` (`icon.png`, `adaptive-icon.png`, `favicon.png`, `tukubi-logo.png`, `tukubi-emblem.png`, `tukubi-footer-dark.png`, `splash.png`)
- Regenerated high-res mobile splash screen `apps/mobile/assets/splash.png` (1284x2778) with centered stacked dark logo on twilight background.

### 5. Quality Assurance & Verification Evidence
- **TypeScript Typecheck:** 31 out of 31 monorepo packages passed with 0 errors (`pnpm typecheck`).
- **Prohibited Terms & Reference Check:** Clean 0 occurrences (`node scripts/ci/check-prohibited-references.js`).
- **Unit Test Suite:** 2,335 tests passed across 215 test files (`pnpm test:unit`).
- **Accessibility & Design System Audits:** 100% passing across WCAG 2.2 AA contrast tests and design system performance benchmarks.

---

## [2026-10-28] — TUKUBI: Giant Among Giants Engineering Transformation

### 1. Security, Database & RLS Hardening (`supabase/migrations/`)
- **Added `supabase/migrations/00115_security_ads_and_rpc_hardening.sql`:**
  - Reconciled `public.posts` RLS policies across personal, community, and Page publishing (`DB-01`).
  - Enabled RLS and strict owner policies on `feed_activity_timeline_2026_03`, `feed_activity_timeline_2026_04`, and `feed_activity_timeline_default` (`DB-03`).
  - Enabled RLS on `public.videos`, added `enforce_video_immutable_fields` trigger, created `public.video_saves` and `public.video_shares`, and created `increment_video_counter` RPC (`DB-05`).
  - Created `public.respond_or_leave_livestream_cohost` RPC (`DB-06`).
  - Hardened `public.record_ad_impression_and_spend`: restricted to `service_role`, computed CPM server-side from `ad_sets.bid_amount_minor`, enforced `moderation_status = 'approved'`, deduplicated per viewer/5m, blocked self-impressions, and recorded double-entry `ledger_entries` (`SEC-01`).
  - Hardened `public.get_user_messaging_friends`, `public.is_staff_or_ad_moderator`, `public.is_page_member`, and `public.can_manage_page` with `auth.uid()` IDOR checks and `SET search_path = public, pg_temp` (`SEC-02`, `SEC-03`, `SEC-04`).
  - Added `enforce_campaign_and_ad_security` trigger and atomic `public.fund_campaign_from_intent` RPC (`SEC-03`, `P0-7`).
- **Updated `supabase/migrations/00111_transfer_kool_tech_page_ownership.sql`:**
  - Replaced hard `RAISE EXCEPTION` with safe `RAISE NOTICE ... RETURN;` when production-specific UUIDs are absent in CI/staging databases (`DB-04`).

### 2. Advertising Engine, PayPal Checkout & Double-Entry Ledger
- **`packages/payments/src/adapters/paypal.ts`:** Embedded `custom_id: request.idempotencyKey` in PayPal v2 `purchase_units[0]` (`P0-6`).
- **`packages/payments/src/transaction-service.ts`:** Added balanced double-entry `ledger_entries` creation for platform-direct settlements (`payerId` present, `recipientId = null`) (`P0-7`).
- **`apps/web/src/lib/advertising/actions.ts`:**
  - Enforced `http:` / `https:` URL validation on ad `destination_url` (`APP-03`).
  - Eliminated 2x impression/click double-counting across campaign summary and detail views (`P0-11`).
  - Blocked campaign activation unless `moderation_status === 'approved'` (`P0-1`).
  - Updated `initiateCampaignCheckoutAction` to write canonical `payment_intents` columns (`P0-3`).
- **`apps/web/src/app/api/payments/paypal/capture/route.ts`:** Verified intent ownership, `provider_transaction_id === token`, captured amount/currency, idempotent short-circuit (`status === 'succeeded'`), canonical `settle_intent_${intent.id}` key, and campaign funding increment (`P0-5`).
- **`apps/web/src/app/api/payments/webhooks/[provider]/route.ts`:** Separated `CHECKOUT.ORDER.APPROVED` from `PAYMENT.CAPTURE.COMPLETED`, guarded UUID `.or()` lookup, and added idempotent campaign funding (`P0-6`, `PAY-02`).
- **`apps/web/src/app/ads/campaign-row.tsx`:** Disabled resume button when `campaign.moderationStatus !== 'approved'`.
- **`apps/web/src/app/api/ads/impression/route.ts` & `click/route.ts`:** Switched to service client, removed client-controlled cost parameter, deduplicated clicks per `impression_id`, and logged click events to `ad_events` (`P0-10`, `P1-1`).
- **`apps/web/src/lib/feed/load-feed.ts`:** Added `.eq('ad_sets.campaigns.moderation_status', 'approved')` filter (`P0-9`).

### 3. Social Workflows: Feed, Pages, Shorts, Messaging, Profiles & Help Center
- **`apps/web/src/lib/feed/hydrate-posts.ts`:** Decoupled `post_media` query from `postsWithLinks` (`DEFECT-01`).
- **`apps/web/src/lib/pages/actions.ts`:** Sanitized `.or()` search query (`APP-01`), set `is_verified: false` on new Pages (`APP-02`), and included full Page attribution columns on Page posts (`DEFECT-05`).
- **`apps/web/src/lib/media/short-actions.ts`, `apps/web/src/app/shorts/page.tsx`, `short-card.tsx`, `shorts-feed-viewer.tsx`:** Enabled Page owners (`businesses.owner_id`) to publish/delete Shorts, wired `video_saves`/`video_shares` and `reports`/`moderation_cases`, loaded existing Short comments from DB, normalized `@handle` and `/pages/[slug]` links, and added `'travel'` to `ALLOWED_CATEGORIES` (`DEFECT-07`–`DEFECT-13`).
- **`apps/web/src/app/messages/page.tsx` & `apps/web/src/components/message-thread.tsx`:** Persisted voice notes as Data URLs, hydrated `edited_at`/`deleted_at`/`deleted_for`/`message_reactions`, and aligned `ai_response` bubbles (`DEFECT-15`–`DEFECT-17`).
- **`apps/web/src/app/profile/[username]/page.tsx`:** Filtered `.is('page_id', null)` on personal profiles and evaluated `viewerRelationship` before privacy barriers (`DEFECT-18`, `DEFECT-19`).
- **`apps/web/src/lib/help/articles-data.ts`, `apps/web/src/app/help/[slug]/page.tsx`, `apps/web/src/app/api/v1/help/feedback/route.ts`:** Fixed `searchArticles` step title search, added 5 guides covering all 12 Help categories, mapped `dbArticle` override, and validated UUID before feedback insert (`DEFECT-20`–`DEFECT-23`).

### 4. Brand Compliance, Accessibility (WCAG 2.2 AA), Themes & Code Cleanliness
- Removed `"Ecosystem"` beside `TUKUBI` across 9 files (`Rule 1a`).
- Fixed 4 mobile screens (`CommunitiesScreen.tsx`, `FinancialCenterScreen.tsx`, `SoundsScreen.tsx`, `ReelsScreen.tsx`) to use `TOKENS.actionText` (`#110D17` on `#FF7A59` = 7.48:1 AAA contrast) (`P2-UX-01`).
- Wired live `Island Vibes` & `Island Daylight` theme selector in `/settings` and `apps/web/src/app/layout.tsx` (`P2-UX-02`).
- Resolved all 12 ESLint React Hook and stale-ref cleanup warnings across `apps/web/src/components/**`.

---

## [2026-10-29] — TUKUBI: Trust, Signup, Privacy & Platform Maturity Transformation

### 1. Legal Compliance, Privacy & Statutory Gating (`supabase/migrations/00116`)
- **Added `supabase/migrations/00116_legal_consent_and_account_lifecycle.sql`:**
  - Created `public.legal_consent_records` table with audit trail columns (`user_id`, `document_type`, `document_version`, `consented`, `consented_at`, `ip_country`, `user_agent`, `jurisdiction`).
  - Enabled RLS on `legal_consent_records` with strict user-only read/write policies and service-role management.
  - Created `public.account_deletion_requests` table with 30-day grace period pipeline (`status: 'scheduled'`, `scheduled_deletion_at: now() + interval '30 days'`).
  - Implemented `public.request_account_deletion` and `public.cancel_account_deletion` stored procedures with `SECURITY DEFINER` and pinned `search_path = public, pg_temp`.
  - Implemented `public.record_legal_consent` RPC with owner validation.

### 2. Registration UX & Child Safety Standards (Law 136-03, COPPA, GDPR-K)
- **`apps/web/src/app/signup/account/page.tsx`:**
  - Added Date-of-Birth (DOB) field with live age calculation.
  - Under-13 protection: Users under 13 are respectfully blocked from unassisted registration with clear notification of Dominican Republic Law 136-03 parental authorization requirements.
  - Adolescent protection (13–17): Automatic minor safety disclosure and database trigger `trg_calculate_profile_age_tier` activation (`age_tier = '13_to_17'`).
  - Adult mode (18+): Full adult profile activation.
  - Mandatory legal consent: Checkbox explicitly linking Terms of Service (`/terms`), Privacy Policy (`/privacy`), and Community Standards (`/help`).
  - Unbundled optional marketing consent: Dedicated checkbox for cultural highlights and product newsletters.
- **`apps/web/src/lib/auth/signup-session.ts`:**
  - Added `dateOfBirth`, `marketingConsent`, `termsVersion`, and `privacyVersion` fields while maintaining strict credential isolation (passwords never written to browser storage).
- **`apps/web/src/lib/auth/actions.ts`:**
  - Updated `completeFullRegistrationAction` to persist `date_of_birth` on `public.profiles` and record statutory `legal_consent_records` rows upon registration.
- **`apps/web/src/app/signup/complete/page.tsx`:**
  - Wired `dateOfBirth`, `marketingConsent`, and document versions (`2026.1`) into `completeFullRegistrationAction`.

### 3. True Privacy Lifecycle & Account Erasure Pipeline
- **`apps/web/src/lib/settings/settings-actions.ts`:**
  - Enhanced `exportAccountDataAction` to assemble complete GDPR / Law 172-13 data package (profile, cultural identity, notifications, statistics, posts, comments, saved items).
  - Implemented `requestAccountDeletionAction` (scheduled 30-day deletion pipeline).
  - Implemented `cancelAccountDeletionAction` (allows user to cancel scheduled deletion during grace period).
- **`apps/web/src/components/settings-view.tsx`:**
  - Replaced mere deactivation call with true `requestAccountDeletionAction` inside confirmation modal.
  - Added prominent banner for accounts in `pending_deletion` with 1-tap cancellation button.
  - Clear legal disclosure: Anonymized double-entry financial ledger records are retained in accordance with statutory accounting and anti-money laundering requirements.

### 4. Visual Redesign & Experience Alignment (TUKUBI NEXT / Stage C)
- **`apps/web/src/components/app-sidebar.tsx`:**
  - Aligned primary navigation to 11 unified global destinations matching concept mockup Image 2 (`Home`, `Explore`, `Shorts`, `Communities`, `Pages`, `Marketplace`, `Events`, `Creator Studio`, `Messages`, `Notifications`, `Settings`).
  - Added bottom User Profile mini-card with user avatar, display name, verified checkmark, `@username`, and direct profile navigation.
- **`apps/web/src/components/rails/home-rail.tsx`:**
  - Elevated "Trending in the Caribbean" / "Trending Now" to top ranking card with formatted post counts and direct tag explore links.
  - Positioned "Suggested People" as second card with verified badges, island flags, and 1-tap follow actions.
- **`apps/web/src/components/home/home-dashboard.tsx`:**
  - Redesigned central feed horizon composer to match concept mockups Image 1 & 2: User avatar + rounded input pill ("What's on your mind?") + quick action chips (`Photo`, `Video`, `Poll`, `Feeling`).
  - Wired chips to expand `UniversalComposer` in corresponding mode on both mobile and desktop.
  - Preserved quick access shortcuts (`Reel`, `Live`, `Event`, `Market`, `Hub`) with zero feature loss.

### 5. Verification & Testing Evidence
- **`tests/migration-00116.test.ts`:** 6 unit tests verifying migration 00116 tables, constraints, RLS policies, and stored procedures (`PASS`).
- **`tests/unit/signup-session-security.test.ts`:** 3 unit tests verifying credential isolation and statutory metadata persistence (`PASS`).
- **Combined Test Gate:** 129 tests passing across 7 critical test suites (WCAG accessibility, RLS financial audit, universal content resolver, link intelligence, shorts viewer, migration 00116, signup security).
- **TypeScript Gate:** 31 packages and apps typechecked with zero errors (`turbo run typecheck`).
