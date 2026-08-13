# SpotPay Payment Architecture & Double-Entry Ledger — CARIBBEAN ONE

## Overview
SpotPay serves two critical financial functions within CARIBBEAN ONE:
1. **Native Stored-Value Digital Wallet:** Enables users and creators to hold balances, execute instant peer-to-peer transfers, tip creators, purchase live stream gifts, and buy marketplace products (operating as a native digital payment method like PayPal).
2. **Unified Payment Gateway Orchestration:** Interfaces with external payment service providers (Stripe, PayPal, Apple Pay, Google Pay) to accept credit/debit cards and manage creator payouts.

---

## Financial Ledger Principles

- **Double-Entry Accounting:** Monetary values are never mutated in single table columns (`UPDATE balance SET balance = balance + 10`). Every financial transaction generates paired Debit and Credit ledger entries.
- **Sum Zero Identity:** For every transaction ID $T$, $\sum \text{Debit Amount} = \sum \text{Credit Amount}$.
- **Idempotency Locks:** Every financial API payload includes an `idempotency_key` string to prevent double-charging or duplicate transfers during network retries.

---

## Payment Capability Matrix & Mobile Store Compliance

| Platform | Product Type | Recommended PSP / Method | Compliance Mechanism |
| :--- | :--- | :--- | :--- |
| **Mobile (iOS)** | Digital Subscriptions & Content | Apple In-App Purchase (IAP) | Store Policy Compliance |
| **Mobile (Android)** | Digital Subscriptions & Content | Google Play Billing | Store Policy Compliance |
| **Web & Mobile** | SpotPay Wallet P2P / Tipping | SpotPay Stored Balance | Native Ledger Transfer |
| **Web & Mobile** | Physical Goods & Event Tickets | Stripe / PayPal / SpotPay Wallet | Web Checkout Flow |
