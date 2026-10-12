# TUKUBI Universal Rich Media Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a world-class, provider-neutral Universal Rich Media Engine for TUKUBI that transforms any external URL into a safe, reliable, and visually rich representation, eliminates broken iframe states via a controlled player state machine with fallback handling, ensures post creation never fails due to third-party media resolution, and natively supports videos, audios, social posts, direct media, and generic web links.

**Architecture:** Provider adapter architecture with a centralized registry in `@caribbean/media`. Strict canonicalization pipeline, SSRF defense-in-depth, controlled client-side `RichMediaPlayer` state machine with postMessage error listeners and watchdog timers, non-blocking asynchronous post persistence, and full multi-link hydration across feeds.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Tailwind CSS v4, Supabase (PostgreSQL, RLS, Realtime), Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-12-universal-rich-media-engine-design.md`

## Global Constraints
- Post creation must never depend on external media resolution.
- Never display broken iframes, gray boxes, or unhandled errors to users.
- RLS must be enforced on all client-accessible database rows.
- All UI components must use TUKUBI Caribbean Futurism design tokens.
- Strict SSRF controls: block private IPs, loopback, cloud metadata, and dangerous schemes.

---

### Task 1: URL Canonicalization Engine & Provider Canonicalizers

**Files:**
- Modify: `packages/media/src/content-resolver/url-detector.ts`
- Modify: `packages/media/src/content-resolver/providers/youtube-provider.ts`
- Modify: `packages/media/src/content-resolver/resolver-engine.ts`
- Test: `tests/unit/universal-content-resolver.test.ts`

**Interfaces:**
- Consumes: `normalizeUrl(rawUrl: string): string`
- Produces: `canonicalizeUrl(rawUrl: string): { canonicalUrl: string; normalizedUrl: string; provider: ContentProviderName }`

- [ ] **Step 1: Write failing unit test for YouTube canonicalization**
Add test in `tests/unit/universal-content-resolver.test.ts` checking that `https://youtu.be/IIQ3mIGKquc?si=faAZYkCPvSl1iH44` canonicalizes to `https://www.youtube.com/watch?v=IIQ3mIGKquc`.

- [ ] **Step 2: Run Vitest to verify test fails**
Run `npx vitest run tests/unit/universal-content-resolver.test.ts` and confirm failure.

- [ ] **Step 3: Implement canonicalization in `url-detector.ts` and `youtube-provider.ts`**
Update `normalizeUrl` and export `canonicalizeUrl(url: string)` to normalize `youtu.be/ID`, `m.youtube.com`, `youtube.com/shorts/ID` to standard watch URLs while retaining valid timestamp parameters (`t=`) and stripping tracking query parameters (`si`, `feature`, etc.).

- [ ] **Step 4: Re-run Vitest to verify tests pass**
Run `npx vitest run tests/unit/universal-content-resolver.test.ts`.

- [ ] **Step 5: Commit changes**
`git commit -m "feat(media): implement canonical URL resolution and tracking stripping"`

---

### Task 2: Provider Registry Expansion (Dailymotion, Twitch, Loom, Reddit, Threads, LinkedIn)

**Files:**
- Create: `packages/media/src/content-resolver/providers/dailymotion-provider.ts`
- Create: `packages/media/src/content-resolver/providers/twitch-provider.ts`
- Create: `packages/media/src/content-resolver/providers/loom-provider.ts`
- Create: `packages/media/src/content-resolver/providers/reddit-provider.ts`
- Create: `packages/media/src/content-resolver/providers/threads-provider.ts`
- Create: `packages/media/src/content-resolver/providers/linkedin-provider.ts`
- Modify: `packages/media/src/content-resolver/types.ts`
- Modify: `packages/media/src/content-resolver/resolver-engine.ts`
- Modify: `packages/media/src/content-resolver/index.ts`
- Modify: `packages/media/src/index.ts`
- Test: `tests/unit/universal-content-resolver.test.ts`

**Interfaces:**
- Produces: Registered providers in `ContentResolverEngine` with capability flags `canEmbed` and `isPlayable`.

- [ ] **Step 1: Write unit tests for new provider adapters**
Add tests in `tests/unit/universal-content-resolver.test.ts` for Dailymotion, Twitch, Loom, Reddit, Threads, and LinkedIn URLs.

- [ ] **Step 2: Run Vitest to verify tests fail**
Run `npx vitest run tests/unit/universal-content-resolver.test.ts`.

- [ ] **Step 3: Implement new provider classes and register in resolver engine**
Implement adapters extending `BaseContentProvider`, update `ContentProviderName` in `types.ts`, and register them in `resolver-engine.ts`.

- [ ] **Step 4: Re-run Vitest to verify all provider tests pass**
Run `npx vitest run tests/unit/universal-content-resolver.test.ts`.

- [ ] **Step 5: Commit changes**
`git commit -m "feat(media): add Dailymotion, Twitch, Loom, Reddit, Threads, and LinkedIn providers"`

---

### Task 3: Controlled Rich Media Player with State Machine, Watchdog & YouTube Error Trapping

**Files:**
- Create: `apps/web/src/components/media/rich-media-player.tsx`
- Modify: `apps/web/src/components/media/universal-content-card.tsx`
- Modify: `apps/web/src/components/media/multi-link-container.tsx`
- Test: `tests/unit/rich-media-player.test.tsx`

**Interfaces:**
- Produces: `<RichMediaPlayer metadata={metadata} onPlaybackError={...} />`
- State: `idle` | `loading` | `playing` | `paused` | `error` | `fallback`

- [ ] **Step 1: Write test for Player state machine and fallback transitions**
Create `tests/unit/rich-media-player.test.ts` verifying states: initial idle, transition to loading on play click, transition to fallback on watchdog timer expiration or YouTube error code (101/150).

- [ ] **Step 2: Run Vitest to verify test fails**
Run `npx vitest run tests/unit/rich-media-player.test.ts`.

- [ ] **Step 3: Implement `RichMediaPlayer` with postMessage listener & watchdog**
Create `RichMediaPlayer` supporting:
- YouTube IFrame API error trapping via `window.addEventListener('message')` (`onError` codes 101, 150, 100, 2, 5).
- 4000ms watchdog timeout for iframe load confirmation.
- Rich fallback UI showing original thumbnail, banner "Playback isn't available inside TUKUBI.", and primary CTA button "Watch on [Provider]".
- Integrate `RichMediaPlayer` into `UniversalContentCard`.

- [ ] **Step 4: Re-run Vitest to verify tests pass**
Run `npx vitest run tests/unit/rich-media-player.test.ts`.

- [ ] **Step 5: Commit changes**
`git commit -m "feat(web): implement RichMediaPlayer state machine with postMessage error trapping and graceful fallback"`

---

### Task 4: Non-Blocking Post Creation Decoupling & Asynchronous Resolution

**Files:**
- Modify: `apps/web/src/lib/social/actions.ts`
- Modify: `apps/web/src/components/universal-composer.tsx`
- Test: `tests/unit/post-composer-reliability.test.ts`

**Interfaces:**
- Guarantees: `createPostAction` returns successfully in $<150$ms even if external URL resolution takes multiple seconds or fails.

- [ ] **Step 1: Write unit test verifying post creation does not block on slow URL resolution**
Add test in `tests/unit/post-composer-reliability.test.ts` asserting non-blocking post publication behavior.

- [ ] **Step 2: Run Vitest to verify test passes/fails**
Run `npx vitest run tests/unit/post-composer-reliability.test.ts`.

- [ ] **Step 3: Refactor `createPostAction` in `actions.ts`**
Remove synchronous `await resolveContentUrl(...)` blocking during post insertion. If `link_preview` is not provided, proceed immediately with post creation and trigger background asynchronous resolution with non-blocking error handling.

- [ ] **Step 4: Re-run Vitest to verify composer reliability suite passes**
Run `npx vitest run tests/unit/post-composer-reliability.test.ts`.

- [ ] **Step 5: Commit changes**
`git commit -m "fix(social): decouple post publication from synchronous external media resolution"`

---

### Task 5: Feed Realtime & Ranking Multi-Link Hydration Repairs

**Files:**
- Modify: `apps/web/src/components/feed-stream.tsx`
- Modify: `apps/web/src/lib/feed/ranking.ts`
- Modify: `apps/web/src/app/page.tsx`
- Test: `tests/unit/ranking.test.ts`

**Interfaces:**
- Guarantees: `link_preview` and `link_previews` are selected and hydrated in both realtime events and ranked queries.

- [ ] **Step 1: Write test verifying `link_previews` array is populated on feed post hydration**
Test that multi-link post rows hydrate all preview cards.

- [ ] **Step 2: Update queries in `feed-stream.tsx`, `ranking.ts`, and `page.tsx`**
Add `link_preview` and `link_previews` to database select queries and construct `livePost` accordingly.

- [ ] **Step 3: Re-run feed tests**
Run `npx vitest run tests/unit/ranking.test.ts`.

- [ ] **Step 4: Commit changes**
`git commit -m "fix(feed): ensure multi-link previews hydrate correctly in realtime stream and ranking queries"`

---

### Task 6: Comprehensive Verification, E2E Browser Testing & Production Build

**Files:**
- Create: `tests/e2e/universal-rich-media-engine.spec.ts`

- [ ] **Step 1: Create Playwright E2E test for Universal Rich Media Engine**
Test pasting `https://youtu.be/IIQ3mIGKquc?si=faAZYkCPvSl1iH44`, verifying thumbnail preview in composer, publishing, verifying post in feed, testing play interaction, and ensuring graceful fallback state transitions smoothly without broken iframes.

- [ ] **Step 2: Run all unit test suites**
Run `npx vitest run tests/unit/universal-content-resolver.test.ts` and `npx vitest run tests/unit/post-composer-reliability.test.ts`.

- [ ] **Step 3: Run TypeScript compiler check**
Run `npx tsc --noEmit` across the repository to verify 0 type errors.

- [ ] **Step 4: Run Next.js production build check**
Verify application builds cleanly without errors.

- [ ] **Step 5: Final commit & engineering report**
`git commit -m "test(e2e): add end-to-end certification for universal rich media engine"`
