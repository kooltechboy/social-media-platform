# Phase 2: Profiles, Cultural Identity & Core Feed Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor and elevate Tukubi's User Profile, Cultural Identity, and Core Feed subsystems into a privacy-first, modular, high-performance Caribbean social experience with zero privacy leaks, instant feed tab transitions, and WCAG 2.2 AA compliance.

**Architecture:** Implement strict server-side profile privacy boundary filtering, modularize the 1,165-line profile monolith into clean accessible components (`ProfileHeader`, `CulturalPassportCard`, `ProfileTabNav`), optimize feed mode caching, and add rich Caribbean empty/loading states.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Tailwind CSS v4, Lucide React, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-01-phase-2-profile-feed-design.md`

## Global Constraints
- Strictly enforce Rule 8 of `AGENTS.md`: Caribbean location/cultural identity is optional and private by default. Never expose origin or diaspora location to third parties when visibility is private.
- Preserve 100% functional parity across all 8 feed modes and all 7 profile tabs.
- Zero TypeScript typecheck errors (`pnpm typecheck` must pass).
- WCAG 2.2 AA contrast ratios and focus ring visibility.

---

### Task 1: Profile Privacy Sanitizer & Test Suite (TDD)

**Files:**
- Create: `apps/web/src/lib/profile/privacy-sanitizer.ts`
- Create: `tests/profile-privacy.test.ts`

**Interfaces:**
- Consumes: Raw `profile_identity` DB records and viewer session user ID.
- Produces: `sanitizeProfileIdentity(identity, viewerId, targetProfileId): SanitizedProfileIdentity`.

- [ ] **Step 1: Write failing unit test verifying strict private origin suppression for non-owners**
- [ ] **Step 2: Run test to confirm failure**
- [ ] **Step 3: Implement `sanitizeProfileIdentity` in `apps/web/src/lib/profile/privacy-sanitizer.ts`**
- [ ] **Step 4: Run test and verify 100% pass rate**
- [ ] **Step 5: Typecheck and commit**

---

### Task 2: Profile Empty & Loading State Primitives

**Files:**
- Create: `apps/web/src/components/profile/profile-empty-state.tsx`
- Create: `apps/web/src/components/profile/profile-tab-skeleton.tsx`
- Test: `tests/profile-components.test.ts`

**Interfaces:**
- Consumes: Tab identifier (`posts` | `reels` | `media` | `saved` | `friends` | `recognition`), isOwner boolean, username.
- Produces: Culturally vibrant, accessible empty states with quick action triggers.

- [ ] **Step 1: Write unit tests for empty state rendering conditions and accessibility**
- [ ] **Step 2: Implement `ProfileEmptyState` and `ProfileTabSkeleton` with Caribbean sunrise gradients and WCAG compliant contrast**
- [ ] **Step 3: Run tests and verify rendering**

---

### Task 3: Profile Header & Cultural Identity Component Refactoring

**Files:**
- Create: `apps/web/src/components/profile/profile-identity-card.tsx`
- Modify: `apps/web/src/app/profile/[username]/page.tsx`

**Interfaces:**
- Consumes: Sanitized profile data, relationship state, and count summaries.
- Produces: Modular, accessible profile header with expandable Cultural Passport and privacy-safe origin badges.

- [ ] **Step 1: Extract and modularize `ProfileIdentityCard` with privacy-safe passport rendering**
- [ ] **Step 2: Integrate `sanitizeProfileIdentity` into `apps/web/src/app/profile/[username]/page.tsx`**
- [ ] **Step 3: Integrate `ProfileEmptyState` into empty tabs (Reels, Media, Saved)**
- [ ] **Step 4: Verify profile page renders cleanly with zero errors**

---

### Task 4: Feed Mode Normalizer & Tab Caching Optimization

**Files:**
- Create: `apps/web/src/lib/feed/feed-mode-utils.ts`
- Modify: `apps/web/src/app/page.tsx`
- Modify: `apps/web/src/components/home/home-dashboard.tsx`
- Test: `tests/feed-mode-utils.test.ts`

**Interfaces:**
- Consumes: URL search parameters and tab identifiers.
- Produces: `normalizeFeedMode(raw: string | undefined): FeedMode`, optimized client tab caching.

- [ ] **Step 1: Write unit tests for feed mode slug resolution and alias handling (`for_you`, `for-you`, `foryou`, `caribbean`, etc.)**
- [ ] **Step 2: Implement `normalizeFeedMode` in `apps/web/src/lib/feed/feed-mode-utils.ts`**
- [ ] **Step 3: Integrate into `apps/web/src/app/page.tsx` and `HomeDashboard`**
- [ ] **Step 4: Run tests and verify**

---

### Task 5: Full Verification & Monorepo Quality Gate

**Files:**
- Test: Full Vitest suite and Turbo typecheck.

- [ ] **Step 1: Run Vitest unit tests (`pnpm.cmd test:unit tests/profile-privacy.test.ts tests/feed-mode-utils.test.ts`)**
- [ ] **Step 2: Run monorepo typecheck (`pnpm.cmd typecheck`)**
- [ ] **Step 3: Run CI check (`node scripts/ci/check-prohibited-references.js`)**
- [ ] **Step 4: Update task tracking artifact**
