# TUKUBI FEED 2.0 — ARCHITECTURE DECISIONS (ADRs)
**Project:** TUKUBI — The Caribbean Connected  
**Standard:** ADR Format (Context, Decision, Consequences, Compliance)  

---

## ADR-FEED-001: Mobile-First Feed Layout & Zone Hierarchy

### Context
Mobile users currently encounter an overloaded initial viewport on `https://www.tukubi.com`. Story rings, expanded creation cards, and an 8-tab horizontally scrollable menu appear before any feed post content is rendered. This leads to high time-to-first-post, visual clutter, and interaction friction on 360-430px viewports.

### Decision
1. Restructure the mobile layout into three distinct, content-focused zones:
   - **Zone 1:** Compact Sticky Header (48-52px height) with drawer navigation on left and clustered actions (Search, Notifications, Messages) on right.
   - **Zone 2:** Primary Feed Tabs directly beneath header featuring the 4 core views: `For You`, `Following`, `Caribbean`, `Communities`.
   - **Zone 3:** 1-Tap Composer pill ("Share something with the Caribbean...") followed immediately by the post stream.
2. Moments/Stories rail is preserved without dominating the initial fold, remaining accessible without pushing Post #1 out of the primary mobile viewport.

### Consequences
- **Positive:** Dramatic reduction in time-to-first-post; intuitive mobile navigation; eliminates horizontal tab scrolling fatigue on mobile.
- **Trade-off:** Secondary feed views (`Friends`, `Pages`, `Creators`, `Official`) are accessed via a clean secondary selector / filter chips rather than cluttering the primary mobile tab bar.

---

## ADR-FEED-002: Bottom Navigation Standardization

### Context
The previous mobile bottom navigation contained `Home`, `Explore`, `Create`, `Messages`, `Profile`. This resulted in duplicate messaging entry points (both in the top header and bottom bar) while omitting `Reels` from primary thumb reach, contradicting Directive Section 6.6 and user expectations.

### Decision
Standardize the mobile bottom navigation to:
1. **Home** (`/`)
2. **Reels** (`/reels`)
3. **Create** (`/create` or central creation trigger)
4. **Explore** (`/explore`)
5. **Profile** (`/profile/[username]` or `/login`)

Keep Messages and Notifications prominently accessible in the compact top header.

### Consequences
- **Positive:** Instant access to Caribbean Reels; dedicated central Create action; clean navigation hierarchy aligned with Instagram/TikTok standards.
- **Preservation:** Desktop left navigation continues to show all links without degradation.

---

## ADR-FEED-003: Mobile Comments Bottom Sheet

### Context
Expanding comments inline inside post cards on mobile causes major usability defects: nested scroll hijacking, loss of feed scroll position, keyboard covering input areas, and cramped layout on narrow screens.

### Decision
Implement a dedicated `MobileCommentsSheet` component for viewports below `md` (768px):
- Rendered in a fixed portal / slide-up modal with backdrop blur.
- Maintains a fixed header displaying comment count and close button.
- Independent scrollable comment list supporting nested reply threads.
- Pinned bottom input container respecting mobile safe areas (`env(safe-area-inset-bottom)`) and virtual keyboard focus.
- Desktop continues using the established inline comments layout.

### Consequences
- **Positive:** Zero scroll position loss in the main feed; seamless keyboard handling; smooth animations.
- **Negative:** Requires maintaining two rendering presentations for comments (sheet on mobile, inline on desktop), sharing common comment action handlers.

---

## ADR-FEED-004: Standardized Social Interaction Bar & Post Card Layout

### Context
Post cards currently feature varying button orders, nested reposting mechanisms, and creator tip buttons that compete with fundamental social gestures on non-monetized content.

### Decision
1. Standardize the interaction bar on both mobile and desktop:
   - **Left Group:**
     - **Like / React:** Heart icon with count and long-press reaction picker.
     - **Comment:** Message bubble icon with count.
     - **Repost:** Repost arrows with count and quick 1-tap or quote option.
     - **Share:** Paper plane / share icon with count and native share sheet / link copying.
   - **Right Group:**
     - **Save / Bookmark:** Bookmark icon pinned to the right edge with active state fill.
2. Relocate Creator Tipping to the author context header or the kebab options menu, preserving primary bar ergonomics for social conversation.
3. Adopt a clean 2-line post header: Line 1: Author Name + "· [time]"; Line 2: Territory context ("Dominican Republic 🌐" or verified badge) + kebab menu on the right.

### Consequences
- **Positive:** Maximum muscle memory alignment with modern social platforms; clear visual hierarchy; uncompromised touch targets (min 44x44px).
