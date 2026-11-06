# TUKUBI FEED 2.0 — BASELINE AUDIT & GAP ANALYSIS
**Project:** TUKUBI — The Caribbean Connected  
**Date:** November 2026  
**Auditor:** Principal Engineering & Product Transformation Team  
**Standard:** Enterprise-Grade Caribbean-First Social Architecture  

---

## 1. Executive Summary

An exhaustive inventory of the production codebase (`apps/web`, `apps/mobile`, `packages/*`, `supabase/migrations`) was conducted to evaluate the current Home Stream, mobile feed experience, desktop responsiveness, media pipeline, and backend data flows against the **TUKUBI Feed 2.0 Master Implementation Directive** and the approved **Proposed Mobile Experience** specification.

The repository is built on Next.js 15 App Router, React 19, Supabase SSR, Tailwind CSS, and Turborepo. The core foundations (TypeScript strict typechecking, double-entry financial ledger safety, RLS policies, 227 passing unit test suites with 2,418 green tests) are strong and stable. However, the mobile feed experience presents significant structural and visual gaps when compared with the modern mobile interaction standard.

---

## 2. Scored Baseline Evaluation Matrix

| Category | Area | Baseline Status | Score (1-10) | Confirmed Issues / Gaps | Opportunities |
|---|---|---|---|---|---|
| **Mobile UX** | **Header & Branding** | Needs Refinement | 6.5 / 10 | Header has hamburger on far right, search and actions separated; height and density can be tightened to match the mobile spec. | Align with proposed header: hamburger drawer on left beside `tukubi` wordmark; search, notification, and messages clustered on right. |
| **Mobile UX** | **Primary Feed Tabs** | Deficient | 5.0 / 10 | 8 horizontal scrolling tabs (`for_you`, `friends`, `following`, `pages`, `creators`, `official`, `caribbean`, `communities`) placed *below* stories and composer, leading to tab overflow, horizontal scrolling fatigue, and delayed content arrival. | Elevate the 4 primary tabs (`For You`, `Following`, `Caribbean`, `Communities`) directly below the compact header. Ensure zero-clip responsive fit. Move secondary tabs (`friends`, `pages`, `creators`, `official`) to contextual filter/overflow options. |
| **Mobile UX** | **First Visible Post** | Deficient | 4.5 / 10 | Mobile users must scroll past large Moments story rings, mobile creation card, and extra spacing before seeing a single post. | Place compact 1-tap composer directly below tabs, followed immediately by Post #1 in the initial viewport fold. |
| **Mobile UX** | **Mobile Composer** | Functional but Heavy | 6.5 / 10 | Multi-row panel with 4 mode buttons takes excessive vertical space when collapsed. | Adopt the streamlined 1-tap composer pill: User avatar + "Share something with the Caribbean..." placeholder + media icon, expanding into full Universal Composer. |
| **Mobile UX** | **Post Card Presentation** | Good but Inconsistent | 7.0 / 10 | Author, handle, time, location, tags are spread across multiple lines with inconsistent badge styling. Tip button takes space in the primary mobile action bar. | Standardize to unified 2-line header: Author + "· [time]" on line 1, territory/island context ("Dominican Republic 🌐") on line 2, kebab menu on right. Clear media radius and typography. |
| **Mobile UX** | **Interaction Bar** | Functional | 7.0 / 10 | Actions are Like, Comment, Share, Bookmark, Tip. Repost is nested inside Share modal. Bookmark is inside the left cluster. | Align with standard social interaction bar: Heart ("Like"), Bubble ("Comment"), Arrows ("Repost"), Plane ("Share") on left; Bookmark ("Save") anchored on far right. Relocate Tip to creator badge or post menu. |
| **Mobile UX** | **Comments** | Poor Mobile Ergonomics | 5.0 / 10 | Comments expand inline inside the post card with `max-h-80 overflow-y-auto`. Causes scroll collision, keyboard overlap, and lost feed scroll context. | Replace mobile inline comments with a native-feeling Comments Bottom Sheet modal with fixed header, thread list, and keyboard-safe input bar. Keep inline comments for desktop. |
| **Mobile UX** | **Bottom Navigation** | Inconsistent with Directive | 6.0 / 10 | Bottom nav has Home, Explore, Create, Messages, Profile. Messages is duplicated in both bottom nav and top header, while Reels is absent from bottom nav. | Refine bottom navigation to: **Home**, **Reels**, **Create** (elevated action), **Explore**, **Profile**. Maintain Messages in top header. |
| **Backend** | **Feed Query & Cursor Pagination** | Strong | 8.5 / 10 | Cursor pagination implemented with `encodeCursor`/`decodeCursor`, Redis caching support, feature flag fallback. | Optimize community and caribbean feed mode queries to avoid duplicate fetches on tab switches. |
| **Backend** | **Supabase RLS & Auth** | Robust | 9.0 / 10 | All tables enforce RLS, server-side session checks, verified tester exclusions, double-entry safety. | Verify zero data leakage for private community content in recommendation and public feeds. |
| **Media** | **Images & Video Playback** | Functional | 7.5 / 10 | `TukubiImage`, `TukubiVideoPlayer`, and `TukubiGallery` exist. | Improve viewport intersection observer pause/play behavior for inline videos; enforce aspect ratios and stable loading skeletons. |
| **Desktop** | **3-Column Architecture** | Solid | 8.0 / 10 | Left sidebar, center feed, right rail. Center column is constrained to 740-760px. | Refine responsive transitions between mobile (<768px), tablet (768px-1024px), and desktop (>1024px) after mobile stabilization. |

---

## 3. Confirmed Baseline Findings

### 3.1 Mobile Feed Layout Hierarchy
- **Current hierarchy on mobile:**
  1. Header (Logo, Search link, Notifications, Messages, Menu)
  2. Main wrapper with `px-4 py-6 pb-24`
  3. `MomentsCinemaRail` (60px rings + padding)
  4. Mobile Creation Card (Avatar + button + 4 mode chips)
  5. Feed Tabs (8 horizontally scrollable items)
  6. Feed posts stream
- **Directive & Proposed Spec hierarchy:**
  1. Compact Header (Menu | `tukubi` | Search | Notifications | Messages)
  2. Primary 4 Feed Tabs (`For You` | `Following` | `Caribbean` | `Communities`)
  3. 1-Tap Composer preview pill (Avatar | "Share something with the Caribbean..." | Media icon)
  4. Feed stream starting with Post #1 immediately visible above the fold
  5. Persistent Bottom Navigation (`Home` | `Reels` | `Create` | `Explore` | `Profile`)

### 3.2 Post Card & Interaction Bar Findings
- Post headers currently display author name, handle, time, location, and tags in a somewhat loose wrapping text block.
- Interaction buttons currently lack visual consistency between mobile and desktop:
  - Repost is hidden inside the Share modal rather than being a prominent interaction touchpoint.
  - Tip button occupies primary bar space even on non-creator or non-monetized posts.
  - Bookmark is placed between Share and Tip instead of being pinned to the right edge.
- Mobile comments currently expand within the post card container, causing severe mobile UX jank when the on-screen keyboard appears.

### 3.3 State Management & Tab Caching Findings
- Tab switching in `home-dashboard.tsx` already includes a client-side `tabCache` snapshotting mechanism, which is an excellent foundation.
- However, switching to modes like `caribbean` or `communities` currently triggers full network refetches if uncached, and returns to `/` replace browser history correctly but do not preserve scroll coordinates accurately.

---

## 4. Prioritized Gap Remediation Plan

1. **P0-1:** Refactor Mobile Shell & Navigation (`app-header.tsx`, `mobile-nav.tsx`) to match the Directive:
   - Header: Hamburger menu left-aligned next to brand mark; Search, Notifications, Messages on right.
   - Bottom Nav: Home, Reels, Create (center action), Explore, Profile.
2. **P0-2:** Reorder Home Stream Zone Order on Mobile (`home-dashboard.tsx`):
   - Move Feed Tabs to the top of the feed stream container.
   - Refine tabs to 4 primary tabs: `For You`, `Following`, `Caribbean`, `Communities`, with seamless overflow/secondary filter for `Friends`, `Pages`, `Creators`, `Official`.
   - Compact 1-tap composer pill directly below tabs.
3. **P0-3:** Post Card Standardization (`feed-post.tsx`, `feed-stream.tsx`):
   - Clean 2-line header with territory context ("Dominican Republic 🌐"), verified badges, and kebab menu.
   - Standardized interaction bar: Like, Comment, Repost, Share, Bookmark (pinned right).
4. **P0-4:** Mobile Comments Bottom Sheet (`mobile-comments-sheet.tsx`):
   - Standalone bottom sheet for mobile viewport with focus trapping, reply nesting, and zero page shift.
5. **P0-5:** Video & Media Playback Stability:
   - Single-active-video autoplay coordinator.
   - Stable aspect-ratio media skeletons.
6. **P0-6:** Pagination & Scroll Restoration Verification:
   - Verify deterministic cursor pagination without duplicate post injection.
