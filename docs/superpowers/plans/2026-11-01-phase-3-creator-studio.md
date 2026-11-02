# Phase 3: Unified Creator Studio & Publishing Lifecycle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor and elevate Tukubi's Creator Studio and Publishing Lifecycle into a resilient, SSRF-immune, high-performance publishing engine with auto-recovering drafts, per-item media progress states, and WCAG 2.2 AA Caribbean Futurism UI.

**Architecture:** Implement strict SSRF IP boundary verification in `@caribbean/media`, add a 1-click `DraftRestoreBanner` for recovered composer drafts in `UniversalComposer`, formalize per-item upload progress states, and ensure zero TypeScript errors.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, `@caribbean/media`, `@caribbean/creator`, Tailwind CSS v4, Lucide React, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-01-phase-3-creator-studio-design.md`

## Global Constraints
- Strictly enforce SSRF protection: Never permit requests to internal/private IP ranges or cloud metadata endpoints.
- Auto-save drafts to local storage without dropping user inputs.
- Zero TypeScript typecheck errors (`pnpm typecheck` must pass).
- Adhere to WCAG 2.2 AA accessibility with contrast ratios >= 4.5:1.

---

### Task 1: SSRF Guard Security Test Suite & Hardening (TDD)

**Files:**
- Modify: `packages/media/src/content-resolver/ssrf-guard.ts`
- Create: `tests/media-ssrf-guard.test.ts`

**Interfaces:**
- Consumes: Raw external URL strings pasted into Universal Composer or link previews.
- Produces: `isSafePublicUrl(url: string): boolean`, `assertSafePublicUrl(url: string): void`.

- [ ] **Step 1: Write failing unit test for internal IP addresses, loopback, and cloud metadata**
- [ ] **Step 2: Run test to confirm failure**
- [ ] **Step 3: Implement and harden `isSafePublicUrl` in `ssrf-guard.ts`**
- [ ] **Step 4: Run test to ensure 100% pass rate**
- [ ] **Step 5: Typecheck and commit**

---

### Task 2: Draft Lifecycle Manager & Recovery Contracts (TDD)

**Files:**
- Modify: `apps/web/src/lib/social/draft-manager.ts`
- Create: `tests/composer-draft-manager.test.ts`

**Interfaces:**
- Consumes: Composer state (content, media summaries, tags, products, polls).
- Produces: `saveComposerDraft`, `getComposerDraft`, `clearComposerDraft`, `hasMeaningfulDraftContent`.

- [ ] **Step 1: Write unit tests verifying meaningful draft detection, recovery, and cleanup**
- [ ] **Step 2: Run test to verify edge cases (empty spaces, expired timestamps)**
- [ ] **Step 3: Enhance `draft-manager.ts` with draft timestamping and expiration handling (7 days)**
- [ ] **Step 4: Run tests and verify**

---

### Task 3: Universal Composer Draft Restoration Banner & Shortcuts

**Files:**
- Create: `apps/web/src/components/composer/draft-restore-banner.tsx`
- Modify: `apps/web/src/components/universal-composer.tsx`

**Interfaces:**
- Consumes: Detected draft state from `getComposerDraft()`.
- Produces: Accessible interactive banner allowing instant draft recovery or clean dismissal, plus `Cmd+Enter` keyboard shortcut.

- [ ] **Step 1: Create `DraftRestoreBanner` component with Caribbean warning/info styling**
- [ ] **Step 2: Integrate banner into `UniversalComposer`**
- [ ] **Step 3: Add `Cmd+Enter` / `Ctrl+Enter` shortcut to trigger submission**
- [ ] **Step 4: Verify composer responsiveness and WCAG focus states**

---

### Task 4: Full Verification & Monorepo Quality Gate

**Files:**
- Test: Full Vitest test suite and Turbo typecheck.

- [ ] **Step 1: Run Vitest unit tests (`pnpm.cmd test:unit tests/media-ssrf-guard.test.ts tests/composer-draft-manager.test.ts`)**
- [ ] **Step 2: Run monorepo typecheck (`pnpm.cmd typecheck`)**
- [ ] **Step 3: Run CI check (`node scripts/ci/check-prohibited-references.js`)**
- [ ] **Step 4: Update task tracking artifact**
