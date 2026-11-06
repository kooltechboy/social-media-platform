# TUKUBI FEED 2.0 — COMPONENT INVENTORY
**Project:** TUKUBI — The Caribbean Connected  
**Status:** Active Inventory & Architecture Mapping  

---

## 1. Shell & Navigation Components

| Component | Path | Current Responsibility | Feed 2.0 Modifications |
|---|---|---|---|
| `AppShell` | `apps/web/src/components/app-shell.tsx` | Provides layout boundaries, side rails, header, and bottom navigation. | Adjust mobile main container padding (`px-3 py-3 pb-24`) to maximize feed content area and prevent excessive whitespace. |
| `AppHeader` | `apps/web/src/components/app-header.tsx` | Top application header with logo, search, notifications, messages, language, and user session. | Realign mobile header layout: Hamburger menu on left next to `TukubiLogo`; clustered Search, Notifications, Messages icons on right with touch-friendly 44x44px hit targets. |
| `MobileNav` | `apps/web/src/components/mobile-nav.tsx` | Fixed bottom navigation bar on mobile viewports (<768px). | Standardize tabs to: **Home** (`/`), **Reels** (`/reels`), **Create** (`/create` or action trigger), **Explore** (`/explore`), **Profile** (`/profile/[username]`). Remove duplicate Messages from bottom bar. |
| `TukubiLogo` | `apps/web/src/components/brand/tukubi-logo.tsx` | Renders brand logo across variants (horizontal, symbol, compact, emblem). | Optimize mobile header logo rendering to match clean Caribbean aesthetic. |

---

## 2. Feed Stream & Layout Components

| Component | Path | Current Responsibility | Feed 2.0 Modifications |
|---|---|---|---|
| `HomeDashboard` | `apps/web/src/components/home/home-dashboard.tsx` | Client container for Home page feed, tabs, stories, composer, and right rail. | Reorder mobile view: 1. Feed Tabs (`For You`, `Following`, `Caribbean`, `Communities`); 2. Compact 1-tap composer; 3. FeedStream starting with Post #1. Support secondary filter for `Friends`, `Pages`, `Creators`, `Official`. |
| `FeedStream` | `apps/web/src/components/feed-stream.tsx` | Manages list of posts, pagination cursor, real-time post injection, share toast, report modal, delete confirmation. | Optimize real-time injection (prevent abrupt scroll jumping); integrate mobile comments bottom sheet; maintain scroll position on tab returns. |
| `FeedPost` | `apps/web/src/components/feed/feed-post.tsx` | Renders individual post card: author header, content body, cultural tags, media gallery, embeds, polls, commerce widgets, interaction bar, comments. | Refactor to premium 2-line header: Author + Time on line 1, territory pill ("Dominican Republic 🌐") on line 2. Standardize interaction bar: Like, Comment, Repost, Share, Bookmark (right-pinned). Trigger mobile comments bottom sheet. |
| `MobileCommentsSheet` | `apps/web/src/components/feed/mobile-comments-sheet.tsx` | **NEW**: Bottom sheet for mobile comments interaction. | Provides quick-open bottom sheet with thread view, nested replies, auto-focus input, and keyboard avoidance without disrupting feed scroll. |
| `SponsoredFeedCard` | `apps/web/src/components/feed/sponsored-feed-card.tsx` | Renders sponsored ad posts in the feed stream. | Maintain transparent ad labeling while matching Feed 2.0 card dimensions and corner radii. |

---

## 3. Composer & Publishing Components

| Component | Path | Current Responsibility | Feed 2.0 Modifications |
|---|---|---|---|
| `UniversalComposer` | `apps/web/src/components/universal-composer.tsx` | Full-featured post creation studio (text, media, polls, commerce, events, relief, identity switching). | Retain full capabilities while supporting seamless integration into both mobile 1-tap expandable card and dedicated `/create` screen. |
| `IdentitySwitcher` | `apps/web/src/components/identity-switcher.tsx` | Allows posting as Personal Profile, Managed Page, or Community Context. | Ensure server-side permission validation and clean mobile presentation. |
| `DraftRestoreBanner` | `apps/web/src/components/composer/draft-restore-banner.tsx` | Displays notification when an unsaved draft is recoverable. | Ensure banner clears immediately upon discard or successful publish; eliminate stuck draft prompts. |

---

## 4. Media & Playback Components

| Component | Path | Current Responsibility | Feed 2.0 Modifications |
|---|---|---|---|
| `TukubiGallery` | `apps/web/src/components/media/tukubi-gallery.tsx` | Displays single and multi-image grids with aspect ratio preservation. | Refine corner radii (`rounded-2xl` on mobile) and image loading placeholders for zero Cumulative Layout Shift (CLS). |
| `TukubiVideoPlayer` | `apps/web/src/components/media/tukubi-video-player.tsx` | Inline HTML5 video player with mute/unmute, poster, and fullscreen controls. | Implement active viewport intersection observer to ensure only one video autoplays at a time and off-screen videos pause. |
| `UniversalContentCard` | `apps/web/src/components/media/universal-content-card.tsx` | Link previews and third-party media embeds (YouTube, TikTok, Facebook, IG, X). | Enforce responsive aspect ratio containers and secure SSRF metadata rendering. |
| `MomentsCinemaRail` | `apps/web/src/components/moments/moments-cinema-rail.tsx` | Displays user and discovery stories bar. | On mobile, position seamlessly without pushing the core feed below the viewport fold. |

---

## 5. Desktop Layout Components

| Component | Path | Current Responsibility | Feed 2.0 Modifications |
|---|---|---|---|
| `AppSidebar` | `apps/web/src/components/app-sidebar.tsx` | Left navigation rail with desktop links, identity switcher, and shortcuts. | Verify sticky positioning below `--app-header-h`; ensure no clipped navigation items on short viewports. |
| `RightRail` | `apps/web/src/components/right-rail.tsx` | Right-side sticky rail container on desktop (hidden on mobile/tablet). | Keep sticky below `--app-header-h`; ensure graceful scrolling without dual scrollbars. |
| `HomeRail` | `apps/web/src/components/rails/home-rail.tsx` | Right rail content: suggested people, trending topics, events, marketplace items. | Maintain zero-mock guarantee; display real backend discovery data only. |
