# Phase 4 Design Specification: Multi-Currency Financial Ledger & Social Commerce

**Date:** 2026-11-01  
**Author:** Antigravity Architect (Autonomous Agent)  
**Governance:** TUKUBI Engineering Governance (`AGENTS.md`), Double-Entry Ledger Safety (Rule 3), Store Policy Compliance (Rule 9).

---

## 1. Problem Statement & Architecture Goals
In the TUKUBI ecosystem, creators receive tips and fan subscriptions, while merchants across 20+ Caribbean island nations and the global diaspora sell physical and handcrafted goods through social feeds and Reels.
Every transaction must satisfy Fortune-100 financial auditing rules:
1. **Double-Entry Conservation:** No monetary balance may ever mutate directly (`balance = balance + X`). Every movement of money must be a balanced set of debit/credit entries summing to exactly zero ($\sum \text{debits} + \sum \text{credits} = 0$).
2. **Multi-Currency Safety:** All Caribbean currencies (`USD`, `JMD`, `TTD`, `XCD`, `BBD`, `BSD`, `GYD`, `SRD`, `HTG`, `DOP`, `ANG`, `AWG`, `KYD`, `BZD`, `EUR`, `GBP`, `CAD`) operate strictly in integer minor units. Floating-point arithmetic in money paths is forbidden. Reversals must preserve the transaction's currency (fixing the hardcoded `"USD"` bug in `createReversalPayload`).
3. **Multi-Split Refund Invariance:** When refunds occur, reversing entries must proportionately reverse buyer debit, seller net, platform commission, and tax, maintaining sum-zero balance.
4. **Store Policy Separation:** Apple IAP / Google Play Billing for in-app mobile digital items; multimodal web rails for physical goods, tickets, and cross-border commerce.
5. **30-Day Escrow Lifecycle:** Social commerce purchases hold funds in escrow until delivery confirmation, transitioning through legal state machine states (`held` -> `releasing` -> `released`).

---

## 2. Core Subsystems & Components

### 2.1 Caribbean Currency Registry (`packages/payments/src/currencies.ts`)
- Defines `CARIBBEAN_CURRENCIES` dictionary and `CaribbeanCurrencyCode` union.
- Maps currency code to symbol, name, standard minor unit exponent (2 for all Caribbean territories), and territory associations.
- Exports `formatCaribbeanMoney(amountMinor, currency, locale)` for culturally authentic currency formatting.

### 2.2 Reversal & Multi-Split Refund Engine (`packages/payments/src/ledger.ts`)
- Updates `createReversalPayload` to accept `currency: string` rather than hardcoding `"USD"`.
- Adds `createMultiSplitRefundPayload` with proportional breakdown:
  $$\text{Buyer Credit} = \text{refundGrossMinor}$$
  $$\text{Seller Debit} = \text{sellerRefundShareMinor}$$
  $$\text{Platform Commission Debit} = \text{platformRefundShareMinor}$$
  $$\text{Processing / Tax Debit} = \text{taxRefundShareMinor}$$
  $$\text{Sum} = 0$$

### 2.3 Financial Reconciliation Multi-Currency Audit
- Audits and verifies `FinancialReconciliationEngine` across multi-currency transaction sets.
- Detects variance, gateway discrepancies, and unrecorded refunds.

---

## 3. Verification & Safety Verification
- Unit test suite: `tests/multi-currency-financial-ledger.test.ts`.
- Full monorepo typecheck: 31/31 packages clean.
- CI gate: 0 prohibited references.
