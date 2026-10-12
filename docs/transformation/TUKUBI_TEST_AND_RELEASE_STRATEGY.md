# TUKUBI Test & Release Strategy (`TUKUBI_TEST_AND_RELEASE_STRATEGY.md`)

**Program:** `TUKUBI-RTP-001` (Phase 1 QA Forensic Baseline & Phase 5/6 Release Gate Specification)  
**Date:** 2026-10-12  
**Scope:** `vitest.config.ts`, `playwright.config.ts`, `tests/` (209 test files), `packages/`

---

## 1. Forensic QA Baseline Findings

1. **Zero Skipped Tests Across 209 Files:** All 209 tracked `.test.ts` and `.spec.ts` files have `0` `.skip()` or `.todo()` calls.
2. **Finding QA-01 (`fs.readFileSync` Source-Regex Tests):** Approximately 49 files in `tests/unit/` (such as `phase1..24-*-certification.test.ts`) verify source-code substrings via `fs.readFileSync()` rather than executing runtime behavior. While useful as static structural lint checks, they failed to catch runtime CSP blocking, iframe watchdog timeouts, and draft state race conditions.
3. **Finding QA-02 (`PLAYWRIGHT_TEST=1` Synthetic Cookie Bypass):** `tests/e2e/global.setup.ts` sets a synthetic `tukubi_user_session` cookie. Because no Supabase JWT is present under synthetic auth, PostgreSQL queries execute as `anon` and several E2E specs used `expect(hasContent || hasEmptyState).toBeTruthy()`.
4. **Finding QA-03 (Companion App Coverage):** Playwright only exercises `apps/web`, which allowed static mock arrays and a port `3002` collision in `apps/creator-studio` and `apps/business-studio` to go undetected.

---

## 2. Four-Tier Verification Architecture for `TUKUBI-RTP-001`

### Tier 1 — Static & Governance Gates
- `pnpm typecheck` across all workspaces (`0` TypeScript errors required).
- `pnpm check:prohibited` (`0` prohibited references or raw secrets).
- CSP header and `ALLOWED_EMBED_ORIGINS` parity assertions.

### Tier 2 — Behavioral Unit & State-Machine Tests (Vitest)
- **Publishing & Draft Lifecycle Unit Suite (`tests/unit/publishing-draft-lifecycle.test.ts`):**
  - Verifies `hasMeaningfulDraftContent` ignores un-uploaded local media (`uploadedUrl: undefined`) and restores valid uploaded media, text, polls, events, fundraisers, and tagged products.
  - Verifies `clearComposerDraft()` broadcasts `tukubi:composer-draft-cleared` and notifies `subscribeToDraftChanges` listeners so composer state resets without re-saving.
  - Verifies `validateComposer` and `createPostAction` accept link-preview posts, media-only posts, and rich-attachment posts when body text is empty.
- **Design System & WCAG Contrast Unit Suite:**
  - Verifies `@caribbean/design-system` exports `oceanDepth: '#0B1F33'`, `islandVibes`, and `islandDaylight` token sets, and verifies contrast ratios meet WCAG 2.2 AA (`>= 4.5:1`).

### Tier 3 — Database Migration & RLS Verification
- Every schema/RLS repair is versioned in `supabase/migrations/` (`00109+`) with idempotent `IF NOT EXISTS` / `DROP POLICY IF EXISTS` guards, explicit `SET search_path = public` on `SECURITY DEFINER` functions, and explicit rollback SQL.

### Tier 4 — End-to-End Verification & Release Certification
- Full execution of `pnpm typecheck` and `pnpm test:unit` (all 200+ test suites passing) documented with exact command outputs in `docs/transformation/TUKUBI_RELEASE_READINESS_REPORT.md`.
