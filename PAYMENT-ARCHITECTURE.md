# SpotPay Payment Architecture & Double-Entry Ledger — CARIBBEAN ONE

## Overview
SpotPay serves two critical financial functions within CARIBBEAN ONE:
1. **Native Stored-Value Digital Wallet:** Enables users and creators to hold balances, execute instant peer-to-peer transfers, tip creators, purchase live stream gifts, and buy marketplace products (operating as a native digital payment method like PayPal).
2. **Unified Payment Gateway Orchestration:** Interfaces with external payment service providers (Stripe, PayPal, Apple Pay, Google Pay) to accept credit/debit cards and manage creator payouts.

SpotPay is a **payment orchestration and financial-services layer** — not a checkout button.

---

## Financial Ledger Principles

- **Double-Entry Accounting:** Monetary values are never mutated in single table columns (`UPDATE balance SET balance = balance + 10`). Every financial transaction generates paired Debit and Credit ledger entries.
- **Sum Zero Identity:** For every transaction ID $T$, $\sum \text{Debit Amount} = \sum \text{Credit Amount}$.
- **Idempotency Locks:** Every financial API payload includes an `idempotency_key` string to prevent double-charging or duplicate transfers during network retries.
- **Immutable Records:** Ledger entries are append-only. Corrections are reversing entries, never updates.
- **Integer Minor Units:** All amounts stored as integer minor units (cents) + ISO currency code. Floating point is forbidden in money paths.
- **Reconciliation:** Scheduled jobs reconcile ledger state against provider reports; drift triggers alerts, never auto-"fixes".

## Core Entities (existing migration `00004`; expansion in Phase 6)

Existing: `ledger_accounts`, `ledger_entries`, `psp_capabilities`.
Planned: `payment_intents`, `payment_methods` (tokenized only), `payment_attempts`, `idempotency_keys`, `refunds`, `disputes`, `chargebacks`, `payouts`, `payout_schedules`, `commissions`, `fees`, `taxes`, `creator_balances` (derived views over the ledger, never authoritative columns).

---

## Payment Capability Matrix & Mobile Store Compliance

`psp_capabilities` (migration `00004`) is the **single source of truth** for method availability:

```
country + currency + provider + method + transaction_type +
availability + min_amount + max_amount + platform + product_type + status
```

Never assume a payment method is available in every country. Checkout must query the matrix at runtime.

| Platform | Product Type | Recommended PSP / Method | Compliance Mechanism |
| :--- | :--- | :--- | :--- |
| **Mobile (iOS)** | Digital Subscriptions & Content | Apple In-App Purchase (IAP) | Store Policy Compliance |
| **Mobile (Android)** | Digital Subscriptions & Content | Google Play Billing | Store Policy Compliance |
| **Web & Mobile** | SpotPay Wallet P2P / Tipping | SpotPay Stored Balance | Native Ledger Transfer |
| **Web & Mobile** | Physical Goods & Event Tickets | Stripe / PayPal / SpotPay Wallet | Web Checkout Flow |

## Payment Policy Engine (PAYMENT-POLICY-ENGINE)

A formal routing engine determines the permitted checkout route:

```
User Country + User Platform + Product Type (digital/physical) +
Payment Method + Provider Availability (psp_capabilities) +
App Store Rules + Play Store Rules + Local Regulations
  → PERMITTED ROUTE
```

- Store policies (Apple §3.1.1, Google Payments policy) are **never bypassed**. Digital goods on mobile route through IAP / Play Billing; physical goods, services, and event tickets may route through web checkout per current policy.
- The engine is **configurable** (rules are data, not hard-coded branches) so policies can evolve without re-architecture.
- All routing decisions are logged for compliance audit.

## Provider Integration Rules

- **No raw card data.** Tokenized payment methods via PCI-compliant processors only.
- **Webhooks:** signature-verified, replay-protected, idempotently processed; unknown events logged, never dropped.
- **Provider abstraction:** Stripe/PayPal/Apple/Google behind one `PaymentProvider` interface — never call provider SDKs from UI components.
- Research current provider docs and country availability **before** implementing; never invent provider capabilities.

## Creator Payouts

```
Creator → Creator Account (KYC) → Revenue Ledger → Payout Engine
  → Country/Provider Routing → Payout Provider
```

- No single hard-coded payout provider; routing is country/method dependent.
- Payout gates: identity verification, minimum threshold, fraud review, chargeback reserve, payout holds.
- Every payout is a ledger transaction; failure produces reversing entries, never deletions.

## Payment Testing Requirements

Sandbox tests mandatory for: success, decline, timeout, duplicate request (idempotency), webhook retry, refund, partial refund, chargeback, provider outage, currency mismatch, invalid method, payout failure. Never test financial flows against production credentials.
