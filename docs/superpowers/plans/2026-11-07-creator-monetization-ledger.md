# Sub-Project 5: Creator Monetization & Double-Entry Ledger — Implementation Plan

**Author:** Antigravity Engineering Agent  
**Date:** 2026-11-07  
**Branch:** `feature/live-core-feed-and-composer`

---

## Tasks

### Task 1: Server Actions Implementation (`apps/web/src/lib/creator/monetization-actions.ts`)
- [ ] Implement `tipCreatorAction`:
  - Input: `{ creatorId?: string; creatorHandle?: string; amountMinor: number; currency?: string; message?: string; isAnonymous?: boolean; idempotencyKey?: string }`
  - Validates authenticated session
  - Validates amount (>= 100 minor units / $1.00, <= 100,000,000 minor units)
  - Resolves creator ID (if handle provided, lookup `profiles`)
  - Blocks self-tipping (`user.id === creatorId`)
  - Ensures creator's `creator_pending` `ledger_accounts` row exists
  - Calculates fees: platform fee (500 bps = 5%) + net to creator (95%)
  - Inserts into `payment_transactions` (`status: 'COMPLETED'`, `transaction_type: 'CREATOR_TIP'`)
  - Inserts zero-sum paired double-entry records in `ledger_entries`
  - Revalidates creator studio & monetization paths
- [ ] Implement `subscribeToCreatorPlanAction`:
  - Input: `{ planId: string; idempotencyKey?: string }`
  - Validates authenticated session
  - Validates active plan exists
  - Blocks self-subscription (`user.id === plan.creator_id`)
  - Creates or updates `subscriptions` record (`status: 'active'`, 30-day term)
  - Inserts `payment_transactions` (`transaction_type: 'CREATOR_SUBSCRIPTION'`)
  - Inserts double-entry ledger entries
  - Revalidates paths
- [ ] Implement `cancelCreatorSubscriptionAction`:
  - Input: `{ subscriptionId: string }`
  - Validates user is the subscriber
  - Sets subscription `status: 'cancelled'`

### Task 2: Live UI Upgrades
- [ ] Upgrade `apps/web/src/components/creator-tip-modal.tsx`:
  - Interactive preset chips ($2, $5, $10, $25, $50)
  - Custom amount input
  - Encouragement message input
  - Anonymous toggle
  - Live submission via `tipCreatorAction`
  - Success confirmation card with ledger reference and transaction receipt
- [ ] Upgrade `apps/web/src/components/creator-tier-modal.tsx`:
  - Wire to `createCreatorPlanAction` via `useTransition`
  - Remove fake `setTimeout` simulation
  - Display server validation errors and success states
- [ ] Update `feed-post.tsx` and `feed-stream.tsx`:
  - Wire `authorId` into `onTipCreator` callback and `tipTarget` state

### Task 3: Unit Tests (`tests/unit/creator-monetization-ledger.test.ts`)
- [ ] Plan creation & validation tests (auth, minimum price, billing interval)
- [ ] Tipping validation tests (auth, self-tipping block, minimum amount, zero-sum ledger verification)
- [ ] Fan subscription tests (auth, self-subscription block, active plan validation)
- [ ] Payout requests tests (KYC gate, minimum threshold, available balance computation)
- [ ] Double-entry ledger invariant tests (`total debits + total credits = 0`)

### Task 4: Verification & Monorepo Integrity
- [ ] Monorepo TypeScript check (`pnpm.cmd typecheck` -> 31/31 workspaces clean)
- [ ] Zero-mock audit (`node scripts/audit-zero-mock.js` -> exit 0)
- [ ] Vitest test execution (all suites passing)
- [ ] Git commit and progress update
