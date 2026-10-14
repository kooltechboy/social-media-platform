# TUKUBI Shorts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and launch TUKUBI Shorts — a first-class, production-grade short-form video platform and discovery surface for the Caribbean and diaspora, integrated seamlessly across mobile, tablet, and desktop with real data, creator studio, page publishing, and social engagement.

**Architecture:** Native vertical video pipeline utilizing Supabase Storage and Postgres `public.videos` table, expanded with Page-role publishing (`public.businesses`), category taxonomies, and moderation states. Responsive Next.js 15 App Router (`/shorts` with `/reels` alias) featuring GPU-safe intersection-observed playback, global audio management, rich social interactions, and cross-device bottom/sidebar navigation.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript 5.5, Tailwind CSS v4, Lucide React, Supabase Postgres & Storage, Vitest, Expo React Native.

**Spec:** USER_REQUEST

## Global Constraints
- NASA-grade software architecture standards and Fortune-100 security practices.
- Zero occurrences of prohibited payment provider references across any file (CI gate invariant).
- Double-entry ledger invariant: no mutable balance increments.
- Zero mock data in production surfaces; truthful counts and empty states.
- WCAG 2.2 AA compliance: minimum 44x44px touch targets, accessible ARIA roles, contrast.
- 100% backward compatibility with existing tests, `/reels` route, external video embeds, and post composer.

---

### Task 1: Database Migration for TUKUBI Shorts (`00110_tukubi_shorts_video_infrastructure.sql`)

**Files:**
- Create: `supabase/migrations/00110_tukubi_shorts_video_infrastructure.sql`
- Test: `tests/migration-00110-shorts.test.ts`

**Interfaces:**
- Produces:
  - `videos.video_kind` check constraint updated to `('reel', 'short', 'long_form', 'podcast_video')`
  - `videos.page_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE`
  - `videos.category VARCHAR(40)`
  - `videos.moderation_status VARCHAR(20) DEFAULT 'approved'`
  - RLS policies for video creation by Page and Profile

- [ ] **Step 1: Write the failing test for migration 00110**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Write migration 00110 SQL**
- [ ] **Step 4: Run test to verify it passes**

---

### Task 2: Server Actions & Backend Services (`short-actions.ts`)

**Files:**
- Create: `apps/web/src/lib/media/short-actions.ts`
- Test: `tests/unit/short-actions.test.ts`

**Interfaces:**
- Consumes: `createSupabaseServerClient`, `getCurrentUser`, `isBannedTesterAccount`, `is_page_member`
- Produces:
  - `publishShortAction(formData: FormData): Promise<ShortActionResult>`
  - `toggleShortLikeAction(shortId: string): Promise<ShortActionResult>`
  - `postShortCommentAction(shortId: string, content: string): Promise<ShortActionResult>`
  - `fetchShortCommentsAction(shortId: string): Promise<{ comments: any[] }>`
  - `recordShortViewAction(shortId: string, watchedSeconds?: number): Promise<ShortActionResult>`
  - `recordShortShareAction(shortId: string, shareType?: string): Promise<ShortActionResult>`
  - `saveShortAction(shortId: string): Promise<ShortActionResult>`
  - `unsaveShortAction(shortId: string): Promise<ShortActionResult>`
  - `reportShortAction(shortId: string, reason: string, details?: string): Promise<ShortActionResult>`
  - `deleteShortAction(shortId: string): Promise<ShortActionResult>`

- [ ] **Step 1: Write unit tests for short-actions**
- [ ] **Step 2: Implement short-actions with Page identity and validation**
- [ ] **Step 3: Run unit tests and confirm pass**

---

### Task 3: Cross-Device Navigation Integration (Desktop, Mobile, Tablet)

**Files:**
- Modify: `apps/web/src/components/app-sidebar.tsx`
- Modify: `apps/web/src/components/mobile-nav.tsx`
- Modify: `apps/web/src/components/app-shell.tsx`
- Modify: `apps/mobile/src/components/BottomNav.tsx`
- Test: `tests/unit/shorts-navigation.test.ts`

**Interfaces:**
- Consumes: Lucide icons, routing hooks
- Produces:
  - Desktop sidebar Shorts entry (`/shorts`)
  - Mobile bottom navigation Shorts tab
  - AppShell container formatting for Shorts without nested scroll or outer padding

- [ ] **Step 1: Write navigation tests**
- [ ] **Step 2: Update AppSidebar, MobileNav, and AppShell**
- [ ] **Step 3: Update React Native BottomNav**
- [ ] **Step 4: Run navigation tests and verify pass**

---

### Task 4: TUKUBI Shorts Viewing Experience & Feed Viewer

**Files:**
- Create: `apps/web/src/components/shorts/shorts-feed-viewer.tsx`
- Create: `apps/web/src/components/shorts/short-card.tsx`
- Create: `apps/web/src/components/shorts/short-report-modal.tsx`
- Create: `apps/web/src/app/shorts/page.tsx`
- Create: `apps/web/src/app/shorts/loading.tsx`
- Modify: `apps/web/src/app/reels/page.tsx` (alias to unified Shorts engine)
- Test: `tests/unit/shorts-feed-viewer.test.ts`

**Interfaces:**
- Produces: Full interactive vertical Shorts feed with audio management, keyboard navigation, desktop portrait formatting, comments drawer, share modal, subtitles, and report flow.

- [ ] **Step 1: Write tests for Shorts viewer and card**
- [ ] **Step 2: Implement ShortCard, ReportModal, and ShortsFeedViewer**
- [ ] **Step 3: Implement `/shorts/page.tsx` with feed tabs (For You, Following, Trending, Caribbean, Categories)**
- [ ] **Step 4: Update `/reels/page.tsx` to maintain 100% backward compatibility**
- [ ] **Step 5: Run tests and verify pass**

---

### Task 5: Creation, Publishing & Creator Studio Integration

**Files:**
- Create: `apps/web/src/components/shorts/create-short-modal.tsx`
- Modify: `apps/web/src/app/creator-studio/videos/page.tsx`
- Modify: `apps/web/src/components/create-hub-client.tsx`
- Test: `tests/unit/shorts-publishing.test.ts`

**Interfaces:**
- Produces:
  - Video upload with preview and 9:16 Camera Studio handoff
  - Page & Profile identity selection
  - Caribbean Sounds tagging
  - Creator Studio video management filter for Shorts

- [ ] **Step 1: Write publishing tests**
- [ ] **Step 2: Implement CreateShortModal**
- [ ] **Step 3: Update Creator Studio Videos and Create Hub**
- [ ] **Step 4: Run tests and verify pass**

---

### Task 6: Final Verification, Typecheck, and Certification

**Files:**
- Run full Vitest suite (`pnpm test:unit`)
- Run Typecheck (`pnpm typecheck`)
- Run CI Prohibited References Gate (`pnpm check:prohibited`)
- Produce comprehensive final report

- [ ] **Step 1: Execute all test suites**
- [ ] **Step 2: Run typecheck across all 31 workspace packages**
- [ ] **Step 3: Verify prohibited payment provider zero-tolerance gate**
- [ ] **Step 4: Deliver final implementation certification report**
