# 30 — GATED REFACTORING & REMEDIATION PLAN

**Domain:** Phased Engineering Execution Plan  
**Auditor:** Technical Program Manager & Lead Systems Architect  
**Status:** Approved for Implementation

---

## 1. Gated Execution Phases

```
GATE 1: AUDIT BASELINE (Completed)
  ↓
GATE 2: PRIORITIZATION & ARCHITECTURAL REVIEW (Current)
  ↓
GATE 3: REMEDIATION & REFACTORING
  - Phase 1: P0 Type Safety & Build Fixes
  - Phase 2: Payments Live Adapter & Wallet Checkout Wiring
  - Phase 3: Mobile Modularization (Expo Router & Supabase)
  - Phase 4: UI/UX Refinement & Shared Component Integration
  ↓
GATE 4: COMPREHENSIVE VERIFICATION & E2E RE-TESTING
  ↓
GATE 5: PRODUCTION HARDENING & FINAL SIGN-OFF
```

---

## 2. Phase 1 Detailed Work Packages (Immediate Critical Path)

1. **Fix `next/cache` Imports:** Update `apps/web/src/lib/events/actions.ts`, `messaging/actions.ts`, and `social/actions.ts`.
2. **Fix `CreatorStudioPage` Property Names:** Align `applyFees`, `evaluatePayout`, and `isSubscriptionActive` in `apps/web/src/app/creator-studio/page.tsx`.
3. **Fix `MarketplaceActions` Property Types:** Update `subtotalMinor`, `platformFeeMinor`, `totalMinor` in `apps/web/src/lib/marketplace/actions.ts`.
4. **Fix `CommunityPolicy` Invocation:** Update instance instantiation in `apps/web/src/lib/communities/actions.ts`.
5. **Fix `askCaribbean` Helper Typings:** Fix PostgREST single-object vs array return type handling in `apps/web/src/lib/ask-caribbean.ts` and `apps/web/src/lib/ai/ask-caribbean.ts`.
6. **Verify Typecheck Pass:** Run `pnpm typecheck` and ensure 0 errors across all workspaces.
