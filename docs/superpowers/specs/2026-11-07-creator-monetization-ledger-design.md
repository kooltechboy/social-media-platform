# Sub-Project 5: Creator Monetization & Double-Entry Ledger — Design Specification

**Author:** Antigravity Engineering Agent  
**Date:** 2026-11-07  
**Branch:** `feature/live-core-feed-and-composer`  
**Status:** Approved for Implementation

---

## 1. Overview & Business Objectives

Sub-Project 5 implements the **Creator Monetization & Double-Entry Financial Ledger** engine for TUKUBI (*The Caribbean Connected*). It mirrors the core economic architectures of Patreon, YouTube Partner Program, and Substack, optimized specifically for the Caribbean diaspora and multi-territory currency clearance.

Every dollar entering or leaving the creator ecosystem must adhere strictly to **NASA-grade software architecture standards** and **Mandate 3 (Double-Entry Financial Ledger Safety)**:
- **No mutable balance column increments** (`balance = balance + X` is strictly forbidden).
- Every monetary transaction is executed via paired double-entry credit/debit records with unique idempotency keys.
- Net creator earnings are calculated dynamically on-demand from verified immutable ledger entries: `sumLedgerMinorUnits(entries)`.
- 100% live data with zero mock or synthetic fallback values.

---

## 2. Architectural Pillars

### 2.1 Double-Entry Ledger Invariants
The financial system operates on three primary ledger account types:
1. `creator_pending`: Pending creator earnings accumulated from tips, subscriptions, and digital sales.
2. `platform_revenue`: Tukubi platform service and infrastructure revenue fees.
3. `Payments_wallet` / `stripe_escrow` / `paypal_escrow`: Clearing and incoming transaction escrow.

**The Golden Zero-Sum Invariant:**
```
Total Debits + Total Credits = 0
For any transaction: Gross Amount (Debit) = Net Creator Earnings (Credit) + Platform Fee (Credit)
```

### 2.2 Creator Membership Tiers (Patreon Core)
Creators create custom recurring subscription plans stored in `creator_subscription_plans`:
- `name`: e.g. "VIP Island Insider", "Dub Club Patron"
- `price_minor`: Price in cents (minimum $0.99 / 99 minor units)
- `billing_interval`: `'monthly'` | `'annual'`
- `benefits`: JSON array of unlocked perks
- `is_active`: boolean switch

### 2.3 Direct Fan Tipping (YouTube SuperThanks / OnlyFans Core)
Fans send instant tips to creators on posts, reels, or profile surfaces:
- Minimum tip: $1.00 (100 minor units).
- Preset chips: $2.00, $5.00, $10.00, $25.00, $50.00 or custom amount.
- Optional encouragement note (up to 280 characters).
- Optional anonymous tipping toggle.
- Recorded immutably in `payment_transactions` (`transaction_type: 'CREATOR_TIP'`).
- Paired double-entry ledger entries generated immediately.

### 2.4 Verified Creator Payouts
Creators withdraw accumulated ledger balances once they satisfy:
1. Identity verification (`kyc_status === 'verified'`).
2. Minimum withdrawal threshold (default $50.00 / 5,000 minor units).
3. Payout queued in `payouts` with atomic idempotency key.

---

## 3. Data Integrity & Security Gates

1. **Self-Tipping & Self-Subscription Block**: Users cannot tip themselves or subscribe to their own creator plans.
2. **KYC Gate on Disbursements**: Unverified accounts cannot initiate payouts.
3. **Idempotency Guarantee**: Every tip, subscription, and payout carries a unique deterministic idempotency key (`idempotency_key UNIQUE`), preventing double-charges under high latency or network retry scenarios.
4. **Row Level Security (RLS)**: Enforced across `payment_transactions`, `subscriptions`, `ledger_accounts`, and `ledger_entries`.

---

## 4. Surfaces & Component Upgrades

1. **`CreatorTipModal` (`apps/web/src/components/creator-tip-modal.tsx`)**:
   - Replaced placeholder certification text with live, interactive tip drawer.
   - Preset chips + custom input + message field + anonymous toggle.
   - Live pending state with `useTransition` and verified ledger confirmation screen.
2. **`CreatorTierModal` (`apps/web/src/components/creator-tier-modal.tsx`)**:
   - Removed fake `setTimeout` simulation.
   - Integrated directly with `createCreatorPlanAction`.
3. **`feed-post.tsx` & `feed-stream.tsx`**:
   - Passed `authorId` to `onTipCreator` so `CreatorTipModal` receives the verified `creatorId`.
