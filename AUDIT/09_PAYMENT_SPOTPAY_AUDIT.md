# 09 — SPOTPAY & FINANCIAL LEDGER AUDIT

**Domain:** Payment Orchestration, Double-Entry Ledger, Idempotency, Store Policy & Currency Handling  
**Auditor:** SpotPay Financial Architect & Payments Systems Engineer  
**Status:** Good / Robust Architecture (Score: 84/100)

---

## 1. SpotPay Invariant Verification

### Rule 3 (Financial Ledger Safety) & Rule 9 (Store Policy Compliance)

1. **Double-Entry Ledger Integrity:**
   - The platform strictly forbids mutable balance column updates (`UPDATE users SET balance = balance + 10`).
   - All balance mutations must generate matched `DEBIT` (negative amount) and `CREDIT` (positive amount) entries in `public.ledger_entries`.
   - `createDoubleEntryPayload()` enforces strictly positive transaction inputs and generates twin idempotent keys (`${idempotencyKey}_debit`, `${idempotencyKey}_credit`).

2. **Integer Minor Units & Money Safety:**
   - All monetary calculations are performed in integer minor units (cents) via the `Money` class in `@caribbean/spotpay`. Floating-point arithmetic is banned across financial paths.

3. **Store Policy Engine (`PaymentPolicyEngine`):**
   - Digital goods (creator subscriptions, live streaming virtual gifts) accessed via iOS/Android are **forced** through Apple In-App Purchase (`apple_iap`) and Google Play Billing (`google_play`).
   - Physical goods, event tickets, and web transactions route through SpotPay Wallet, Stripe Cards, and PayPal.

---

## 2. PSP Adapter Status

- `StripeAdapter` and `PayPalAdapter` are defined with proper TypeScript interfaces (`PSPAdapter`) in `@caribbean/spotpay/src/index.ts`, with clear exception stubs.
- **Remediation Task:** When moving to live payment processing, wire the official `@stripe/stripe-js` / `stripe` and `@paypal/checkout-server-sdk` packages inside these adapters.
