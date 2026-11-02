# Phase 4 Implementation Plan: Multi-Currency Financial Ledger & Social Commerce

**Date:** 2026-11-01  
**Author:** Antigravity Architect (Autonomous Agent)  
**Spec Reference:** `docs/superpowers/specs/2026-11-01-phase-4-financial-ledger-design.md`

---

## Task 1: Caribbean Regional Currency Registry (TDD)
- **Files:**
  - Create: `packages/payments/src/currencies.ts`
  - Export in: `packages/payments/src/index.ts`
  - Test: `tests/multi-currency-financial-ledger.test.ts`
- **Details:**
  - Map ISO 4217 codes for Caribbean territories (`USD`, `JMD`, `TTD`, `XCD`, `BBD`, `BSD`, `GYD`, `SRD`, `HTG`, `DOP`, `ANG`, `AWG`, `KYD`, `BZD`, `EUR`, `GBP`, `CAD`).
  - Strict exponent enforcement (2 minor units).
  - Authentic cultural formatting (`formatCaribbeanMoney`).

## Task 2: Multi-Split Refund Reversal Generator & Currency Reversal Fix (TDD)
- **Files:**
  - Modify: `packages/payments/src/ledger.ts`
  - Test: `tests/multi-currency-financial-ledger.test.ts`
- **Details:**
  - Fix `createReversalPayload` to accept `currency: string = 'USD'` rather than hardcoding `'USD'`.
  - Add `createMultiSplitRefundPayload` with proportional credit/debit calculation for partial and full refunds.
  - Verify sum of debit entries + sum of credit entries = 0.

## Task 3: Social Commerce Escrow & Store Policy Compliance Verification
- **Files:**
  - Verify: `packages/marketplace/src/tagging.ts` & `packages/payments/src/policy-engine.ts`
  - Test: `tests/multi-currency-financial-ledger.test.ts`
- **Details:**
  - Verify escrow transition checks (`held` -> `releasing` -> `released`, blocked `released` -> `held`).
  - Verify mobile digital goods route strictly via Apple IAP / Google Play, rejecting direct web PSP charges on mobile devices.

## Task 4: Full Quality Gate & Monorepo Verification
- Run Vitest for Phase 4 suite: `pnpm.cmd test:unit tests/multi-currency-financial-ledger.test.ts`.
- Run full unit test suite.
- Run monorepo typecheck: `pnpm.cmd typecheck` (31/31 packages).
- Run CI safety gate: `node scripts/ci/check-prohibited-references.js`.
