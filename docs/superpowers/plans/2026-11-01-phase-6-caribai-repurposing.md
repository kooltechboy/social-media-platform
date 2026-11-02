# Phase 6 Implementation Plan: CaribAI Assistant & Media Repurposing Pipeline

**Date:** 2026-11-01  
**Author:** Antigravity Architect (Autonomous Agent)  
**Spec Reference:** `docs/superpowers/specs/2026-11-01-phase-6-caribai-repurposing-design.md`

---

## Task 1: OpenRouter Multi-Model Fallback Chain & Free Model Routing (TDD)
- **Files:**
  - Create: `packages/ai/src/router.ts`
  - Export in: `packages/ai/src/index.ts`
  - Test: `tests/caribai-media-repurposing.test.ts`
- **Details:**
  - Define `OPENROUTER_FREE_MODELS` list.
  - Implement `executeWithModelFallback` with timeout, status retry, and offline deterministic fallback.

## Task 2: Media Repurposing Pipeline Engine (TDD)
- **Files:**
  - Create: `packages/ai/src/repurposing.ts`
  - Export in: `packages/ai/src/index.ts`
  - Test: `tests/caribai-media-repurposing.test.ts`
- **Details:**
  - Implement `repurposeContent` transforming source text into Reel script, 4-card carousel, community prompt, and voice-note script.
  - Apply dialect adaptation for Caribbean nuances.

## Task 3: Universal Composer & Creator Studio Repurposing Handoff
- **Files:**
  - Verify seamless integration with `packages/ai` exports and creator studio components.
  - Test: `tests/caribai-media-repurposing.test.ts`

## Task 4: Full Monorepo Quality Gate & Final Comprehensive Verification
- Run Vitest for Phase 6: `pnpm.cmd test:unit tests/caribai-media-repurposing.test.ts`.
- Run all unit test suites across all phases (Phases 1-6).
- Run full monorepo typecheck: `pnpm.cmd typecheck` (31/31 packages).
- Run CI safety gate: `node scripts/ci/check-prohibited-references.js`.
