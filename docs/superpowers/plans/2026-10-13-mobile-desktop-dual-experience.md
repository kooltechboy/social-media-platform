# Mobile-Desktop Dual-Experience Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform TUKUBI into a dedicated mobile-first social application on phones and an expansive 3-column social workspace on desktop without losing any platform capability.

**Architecture:** Maintain a single shared data layer and design system while bifurcating the presentation: mobile uses a persistent 5-tab bottom bar (`Home`, `Explore`, `Create`, `Messages`, `Profile`) and an unblocked breathing feed with interleaved discovery, while desktop uses natural window scrolling with dual-sticky rails (left nav 240–260px, center workspace 680–840px, right contextual rail 300–340px) and specialized task-mode workspaces for messaging and creation.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript 5, Tailwind CSS, Lucide React, Supabase Auth/Database/Realtime, `@caribbean/ui`, `@caribbean/design-system`.

**Spec:** `docs/superpowers/specs/2026-10-13-mobile-desktop-dual-experience-design.md`

## Global Constraints

- Zero functionality loss: every feature (Communities, Live, Reels, Marketplace, Events, Creator Studio, Wallet, Relief, Identity Switching) must remain fully accessible.
- Caribbean Futurism aesthetic: vibrant sunset corals, twilight purples, golden hour oranges, and tropical sea blues.
- Touch targets must be 44-48px minimum on mobile devices.
- Natural window scrolling on desktop: no nested overflow traps on parent containers.
- Message alignment must derive strictly from authenticated `currentUserId === message.sender_id`.

---

### Task 1: Rebuild Mobile 5-Tab Navigation (`mobile-nav.tsx`)

**Files:**
- Modify: `apps/web/src/components/mobile-nav.tsx`
- Test: Manual browser check & existing mobile navigation tests in `tests/`

**Interfaces:**
- Consumes: `useAuth()`, `useUnreadMessagesCount()`, `useUnreadNotificationsCount()`, `usePathname()`.
- Produces: 5-tab persistent bottom bar: Home (`/`), Explore (`/explore`), Create (Action Sheet), Messages (`/messages`), Profile/Menu (Drawer with Communities, Wallet, Creator Studio, Settings).

- [ ] **Step 1: Inspect and update the `MOBILE_TABS` configuration**
Update `MOBILE_TABS` array in `apps/web/src/components/mobile-nav.tsx` to set the 5 destinations:
1. `Home` (`/`)
2. `Explore` (`/explore`)
3. `Create` (`/create` with action trigger)
4. `Messages` (`/messages` with realtime unread badge)
5. `Profile` (`/profile` / Ecosystem menu trigger with notification dot)

- [ ] **Step 2: Update the bottom navigation JSX**
Ensure Tab 4 renders the `Messages` tab linking to `/messages` with `<MessageSquare className="w-5 h-5" />` and active unread badge.
Ensure Tab 5 renders `Profile` with user avatar or `<User className="w-5 h-5" />` and notification badge.
Verify Communities link is prominently placed inside the Ecosystem Drawer and inside Explore.

- [ ] **Step 3: Verify touch targets and safe area insets**
Add `min-w-[48px] min-h-[48px]` and `pb-[env(safe-area-inset-bottom,0.5rem)]` to ensure thumb friendliness on modern notched mobile devices.

- [ ] **Step 4: Verify TypeScript compilation**
Run `pnpm --filter @caribbean/web typecheck` to confirm zero errors.

---

### Task 2: Application Shell & Sticky Workspace Architecture (`app-shell.tsx`, `right-rail.tsx`, `globals.css`)

**Files:**
- Modify: `apps/web/src/components/app-shell.tsx`
- Modify: `apps/web/src/components/right-rail.tsx`
- Modify: `apps/web/src/app/globals.css`

**Interfaces:**
- Consumes: `usePathname()`, `useSidebar()`.
- Produces: Window-scrolling 3-column desktop shell with persistent sticky sidebars and task-mode suppression for `/messages`.

- [ ] **Step 1: Configure route-aware workspace mode in `app-shell.tsx`**
Detect task-mode routes where the global right rail must be suppressed (e.g. `/messages`, `/create`, `/map`).
When on `/messages`, collapse the left sidebar to compact mode (`w-[72px]`) or provide full width to the center workspace so the 3-pane messaging experience has 100% of the canvas.

- [ ] **Step 2: Ensure natural window-level scrolling in `globals.css` and layout**
Verify that `html`, `body`, and `<main>` do not have `overflow-y: hidden` or nested full-height height constraints that block natural page scrolling.
Confirm `.shell-left-rail` and `.shell-right-rail` have:
```css
position: sticky;
top: calc(var(--top-header-height, 64px) + 0.5rem);
height: calc(100dvh - var(--top-header-height, 64px) - 1rem);
overflow-y: auto;
```

- [ ] **Step 3: Verify right rail ergonomics in `right-rail.tsx`**
Ensure right rail provides a clean, sticky container with custom scrollbars hidden by default and sensible content density that fits standard displays without requiring internal scrolling for primary cards.

---

### Task 3: Mobile Home Feed Streamlining & Interleaved Discovery (`home-dashboard.tsx`)

**Files:**
- Modify: `apps/web/src/components/home/home-dashboard.tsx`

**Interfaces:**
- Consumes: `HomeDashboardProps` (user, initialPosts, liveStories, topReels, marketProducts, culturalEvents).
- Produces: Streamlined mobile home layout where feed posts start immediately below Moments and 1-tap composer, with Reels and Marketplace interleaved into the feed.

- [ ] **Step 1: Restructure Mobile vs Desktop Layout Blocks in `home-dashboard.tsx`**
On mobile screens (`sm:hidden` / `md:hidden`):
1. Moments Cinema Rail (Stories)
2. Compact 1-Tap Composer Trigger
3. Sticky Feed Mode Tabs (`For You` | `Following` | `Friends`)
4. Post Feed begins immediately!
On desktop screens (`hidden md:block`):
Keep the spacious Horizon Welcome Card, Creator quick actions grid, and full composer.

- [ ] **Step 2: Interleave Discovery Units into the Feed Stream**
Move the large standalone blocks of Top Reels and Marketplace/Events into responsive discovery cards that appear interleaved within the feed or in the contextual right rail on desktop, eliminating the 2.5-screen vertical barrier on mobile.

- [ ] **Step 3: Test feed switching and composer toggle**
Ensure tab switching (`For You`, `Following`, `Friends`) and inline composer toggling work smoothly across mobile and desktop.

---

### Task 4: Messaging Workspace Ergonomics & Authorship Defense (`messages-center-client.tsx`, `message-thread.tsx`)

**Files:**
- Modify: `apps/web/src/components/messages/messages-center-client.tsx`
- Modify: `apps/web/src/components/message-thread.tsx`

**Interfaces:**
- Consumes: `conversations`, `threadMessages`, `currentUserId`.
- Produces: 3-pane messaging workstation on desktop and seamless full-screen thread stack on mobile with verified sender alignment.

- [ ] **Step 1: Enforce Strict Authorship Derivation in `message-thread.tsx`**
Verify bubble alignment:
```typescript
const isMine = Boolean(currentUserId && msg.sender_id === currentUserId);
```
Ensure sent messages render right-aligned in Caribbean Sea/Sunrise Coral gradients with status ticks (`sending`, `sent`, `delivered`), and received messages render left-aligned in neutral dark cards with peer avatars.

- [ ] **Step 2: Optimize 3-Pane Messaging on Desktop**
Ensure `messages-center-client.tsx` expands gracefully across the full desktop workspace:
- Left pane (Conversations): 320px
- Center pane (Thread): flex-1 (min-w: 480px)
- Right pane (Details): 300px collapsible panel
Ensure mobile transitions cleanly from list to thread without horizontal scroll jumps.

---

### Task 5: Zero-Regression Certification & Build Verification

**Files:**
- Test: Monorepo typechecking and build

- [ ] **Step 1: Monorepo typecheck**
Run: `pnpm --filter @caribbean/web typecheck`
Expected: Zero TypeScript errors.

- [ ] **Step 2: Test suite verification**
Run: `pnpm test` or `npx vitest run`
Expected: All unit and component tests pass.

- [ ] **Step 3: Commit and summarize changes**
Commit changes with clean, descriptive git commit messages.
