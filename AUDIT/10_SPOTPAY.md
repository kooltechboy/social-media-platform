# 10_SPOTPAY.md — SpotPay Payment Subsystem & PSP Adapters

## 1. Supported Adapters
- `StripeAdapter`: Card PaymentIntents, direct charge processing, refunds, and HMAC webhook verification.
- `PayPalAdapter`: Order creation, captures, and refund flows.
- `SpotPayWalletAdapter`: Internal double-entry settlement for P2P transfers, tipping, and virtual gifts.

## 2. Double-Entry Invariants
- For every credit entry of amount $X$, there is an exact corresponding debit entry of amount $X$.
- Immutable transaction logs with idempotency keys guarantee zero double-spend.
