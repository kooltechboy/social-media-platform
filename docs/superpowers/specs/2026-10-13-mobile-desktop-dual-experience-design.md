# TUKUBI Dual-Viewport Experience (Mobile Application First & Desktop Social Workspace) Design Specification

- **Date:** 2026-10-13
- **Status:** Approved
- **Scope:** Architectural & UX Transformation across Mobile and Desktop for Web App (`apps/web`)

---

## 1. Executive Summary & Vision

TUKUBI is the Caribbean Digital Ecosystem connecting the islands and global diaspora. Rather than treating responsive design as a single desktop layout shrunk or stretched across screens, the platform is structured around two distinct ergonomic modalities sharing a unified data and design system:
1. **Mobile Experience (Application First):** Designed for effortless, thumb-driven daily usage. Immediate access to the primary feed, 1-tap post creation, dedicated 5-tab persistent bottom navigation (`Home`, `Explore`, `Create`, `Messages`, `Profile`), zero layout traps, and native app ergonomics.
2. **Desktop Experience (Social Workspace):** Designed for space and productivity. A true 3-column architecture featuring persistent sticky sidebars, natural window-level scrolling without nested container traps, route-aware right contextual rail, and purpose-built workspaces for messaging, creator studio, and marketplace.
3. **Inviolable Mandate:** **Zero functionality loss.** Every single existing feature (communities, live streaming, reels, marketplace, events, creator studio, podcasts, financial center, relief campaigns, moderation, and identity switching) remains fully accessible and prioritized in both form factors.

---

## 2. Core Architecture & Layout System

### 2.1 Desktop 3-Column Shell Architecture
- **Left Navigation Rail (240–260px, sticky):** Persistent navigation bar. Height matches `calc(100dvh - var(--header-height))`. Pinned to the viewport top without forcing users to scroll the sidebar to see primary platform links. Collapses to 72px compact icon rail when collapsed or in task-focused workstation routes.
- **Center Main Workspace (680–840px fluid, max 900px for feed):** Naturally scrolls with the browser window (`document.body`). Ancestor containers (`html`, `body`, root wrapper) must not have `overflow-y: hidden` or nested full-height scrollbars that hijack mouse-wheel and trackpad momentum.
- **Right Contextual Rail (300–340px, sticky):** Persistent contextual information adapting dynamically to the current route:
  - *Home (`/`):* Online friends (presence), trending Caribbean tags, upcoming events/fetes, and diaspora highlights.
  - *Messages (`/messages`):* Suppressed automatically to allow the 3-pane messaging workstation full breathing room.
  - *Creator Studio (`/creator-studio`):* Publishing stats, tier earnings, and audience metrics.
  - *Marketplace (`/marketplace`):* Saved items, currency switchers, and cart.

### 2.2 Mobile Ergonomics & Viewport System
- **Safe Area & Viewport Metrics:** Layout adheres to dynamic viewport units (`100dvh`) and safe area insets (`padding-bottom: max(1rem, env(safe-area-inset-bottom))`).
- **Touch Targets:** Minimum 44x44 CSS pixels on interactive controls.
- **Persistent 5-Tab Bottom Bar (`BottomNav`):**
  - **Tab 1: Home (`/`)** — Unified Caribbean feed.
  - **Tab 2: Explore (`/explore`)** — Islands, creators, communities/groups, trending tags, events.
  - **Tab 3: Create (`/create`)** — Floating center action button opening the creation sheet.
  - **Tab 4: Messages (`/messages`)** — Direct conversations, unread badge counter, and presence.
  - **Tab 5: Profile (`/profile/[username]` or Ecosystem Drawer)** — Authenticated user profile, identity switcher, and slide-over menu for secondary hubs (Wallet, Creator Studio, Settings, Relief).

---

## 3. High-Impact Feature Experiences

### 3.1 Mobile Home Feed Flow
To eliminate the 2.5-screen vertical barrier currently preceding the feed:
1. **Header (52px):** TUKUBI wordmark + Island selector, Search button, Notifications button (with unread badge), and operating avatar.
2. **Moments Cinema Strip (Stories):** Horizontal carousel of 24-hour Caribbean stories with vibrant sunset gradient border rings.
3. **1-Tap Composer Trigger:** Quick action bar prompting the user (*"What’s happening across your Caribbean world?"*).
4. **Sticky Feed Mode Switcher:** Tabbed selector for `For You`, `Following`, and `Friends`.
5. **Post Stream:** Posts render immediately under the switcher.
6. **Interleaved Discovery Cards:** Reels previews, top marketplace products, and cultural fete highlights are injected between posts (e.g. after post 4 and post 8) rather than forming a roadblock at the top of the screen.

### 3.2 The Adaptive Composer Experience
- Mobile opens as a modal bottom sheet (max-height 92dvh).
- Step-wise adaptive controls based on chosen post mode (Text, Photo, Reel, Event, Product, Poll).
- **Draft Reliability:** Instant local autosave to `IndexedDB` with debounced server backup. Drafts are automatically restored upon reopening and destroyed only upon verified database creation.
- **Publishing Feedback:** Displays clear state machine stages (`Compressing media` -> `Uploading` -> `Broadcasting` -> `Published`).

### 3.3 Messaging Workspace (Mobile Stack vs Desktop 3-Pane)
- **Authorship Verification:**
  ```typescript
  const isMine = Boolean(currentUserId && msg.sender_id === currentUserId);
  ```
  Messages sent by the authenticated user are strictly aligned right with Caribbean Sea/Sunset teal bubbles and status ticks; received messages are strictly aligned left with neutral card backgrounds.
- **Desktop 3-Pane Workstation:**
  - Pane 1: Searchable conversation list + friend presence (300–340px).
  - Pane 2: Active chat thread with voice notes, file attachments, and end-to-end encryption badge (Flex 1).
  - Pane 3: Conversation details, shared media, and privacy controls (300px, collapsible).
- **Mobile Stack:** Seamless transition from Conversation List to full-screen Thread with an instant Back navigation button.

---

## 4. Zero-Loss Feature Matrix

All platform capabilities retain their designated home:
- **Communities:** Prominent tab in Explore + quick link in Profile Drawer + left rail on desktop.
- **Reels:** Horizontal preview in Moments / feed + full-screen vertical viewer at `/reels`.
- **Marketplace:** Interleaved feed discovery + top Explore tag + left rail on desktop.
- **Events & Fetes:** Interleaved feed discovery + right rail on desktop + `/events`.
- **Live Streams:** Pinned live badge in Moments strip + dedicated discovery player.
- **Creator Studio & Ads:** Profile drawer on mobile + left navigation rail on desktop.
- **Wallet & Caribbean Financial Center:** Profile drawer on mobile + left navigation rail on desktop with double-entry ledger protection.
- **Relief Campaigns:** Emergency banner alert on Home + `/relief` hub.

---

## 5. Testing & Verification Plan

1. **Typecheck & Lints:** Zero TypeScript errors across `@caribbean/ui`, `@caribbean/social`, and `apps/web`.
2. **Responsive Verification:**
   - Mobile: 375px (iPhone SE), 390px (iPhone 14/15), 430px (iPhone Pro Max).
   - Tablet: 768px (iPad portrait), 1024px (iPad landscape).
   - Desktop: 1280px (MacBook), 1440px (Desktop), 1920px (Widescreen).
3. **Workflow Tests:**
   - Feed rendering and tab switching (`For You`, `Following`, `Friends`).
   - Bottom navigation 5-tab switching (Home, Explore, Create, Messages, Profile).
   - Messaging thread rendering, message sending, and alignment.
   - Sticky sidebar scrolling without nested traps.
