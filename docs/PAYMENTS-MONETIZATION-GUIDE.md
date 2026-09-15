# TUKUBI Payments & Monetization Architecture Guide

> **Official Tagline:** TUKUBI — The Caribbean Connected.  
> **Standard:** NASA-Grade Software Architecture & Fortune-100 Financial Integrity  
> **Status:** Production-Ready (Verified on Supabase Migration 00083)

---

## 1. Executive Summary & Revenue Architecture

TUKUBI operates a dual-engine monetization architecture designed to generate immediate recurring revenue for the platform while fostering a scalable creator economy and cross-island marketplace.

```
                                  TUKUBI TREASURY
                                         ▲
                   ┌─────────────────────┴─────────────────────┐
                   │                                           │
         MODEL A: FIRST-PARTY                       MODEL B: MULTI-SIDED
          PLATFORM REVENUE                           CREATOR & MARKETPLACE
       (100% TUKUBI Retained)                     (Take-Rate Split Settlement)
                   │                                           │
    ┌──────────────┴──────────────┐             ┌──────────────┴──────────────┐
    │  • Creator Pro Plans        │             │  • Fan Subscriptions        │
    │  • Seller Pro Subscriptions │             │  • Creator Direct Tips      │
    │  • Business+ Subscriptions  │             │  • Marketplace Purchases    │
    │  • Platform Ad Boosts       │             │  • Digital Downloads        │
    │  • Official Account Badges  │             │  • Service Bookings         │
    └─────────────────────────────┘             └─────────────────────────────┘
```

---

## 2. Model A vs. Model B Financial Segregation

| Metric / Dimension | Model A: Platform Revenue | Model B: Multi-Sided Marketplace |
| :--- | :--- | :--- |
| **Primary Revenue Driver** | SaaS Subscriptions & Platform Upgrades | Commerce GMV & Fan Support |
| **Gross Value Recognition** | 100% recognized as TUKUBI Gross Revenue | Recognized as Gross Merchandise Value (GMV) |
| **Platform Retained** | 100% of price (minus payment rail processing) | Dynamic Commission Rate (0% to 15% + fixed fee) |
| **Recipient Account** | `platform_revenue` / TUKUBI Treasury | `creator_pending` / `seller_pending` |
| **Ledger Balancing** | Payer Debit ➔ Platform Revenue Credit | Payer Debit ➔ Escrow ➔ Split (Creator + Platform) |
| **Taxonomy (`payment_transactions`)** | `TUKUBI_SUBSCRIPTION`, `SELLER_SUBSCRIPTION`, `BOOST_PURCHASE` | `CREATOR_SUBSCRIPTION`, `MARKETPLACE_PURCHASE`, `CREATOR_TIP` |

---

## 3. Database Schema & Migration Invariants (Migration 00083)

### 3.1 `payment_transactions` (Authoritative Audit Table)
Maintains an immutable record of every payment transaction, its taxonomy, provider reference, model type, gross, platform fee, and net creator amounts.
- **Taxonomy:** `TUKUBI_SUBSCRIPTION`, `CREATOR_SUBSCRIPTION`, `MARKETPLACE_PURCHASE`, `CREATOR_TIP`, `LIVE_STREAM_GIFT`, `BOOST_PURCHASE`, `PAYOUT_DISBURSEMENT`
- **States:** `PENDING`, `AUTHORIZED`, `COMPLETED`, `FAILED`, `CANCELLED`, `REFUNDED`, `PARTIALLY_REFUNDED`, `DISPUTED`
- **Model Type:** `MODEL_A`, `MODEL_B`
- **Security:** Strict Row Level Security (RLS) enabled. Payers and recipients may only view their own transactions; platform admins retain global read access.

### 3.2 `creator_subscription_plans` (Creator Fan Tiers)
Enables Caribbean creators to establish customized monthly subscription tiers with title, description, and price in integer minor units (cents).
- **Foreign Key:** `creator_id` references `creator_accounts(id)`
- **Constraints:** `price_minor >= 100` ($1.00 USD minimum), `currency = 'USD'`, `is_active BOOLEAN`

### 3.3 `subscriptions` & `commercial_subscriptions`
- `subscriptions`: Manages fan-to-creator patronages, linked to `creator_subscription_plans`.
- `commercial_subscriptions`: Manages first-party platform subscriptions (Creator Pro, Seller Pro, Business+) linked to `monetization_tier_configs`.

### 3.4 `ensure_ledger_account` PostgreSQL RPC
Ensures idempotent provisioning of user and system accounts in `public.ledger_accounts` avoiding foreign-key mismatches when posting double-entry journal entries.

---

## 4. Double-Entry Ledger Mathematical Invariant

TUKUBI enforces strict mathematical double-entry bookkeeping across all financial interactions.

$$\sum \text{Debit Entries} + \sum \text{Credit Entries} = 0$$

### Ledger Rules:
1. **Integer Minor Units:** All monetary amounts are recorded in integers (cents). Floating-point amounts are strictly rejected by `LedgerOrchestrator` and database constraints.
2. **Zero Mutable Increments:** Direct column mutations such as `UPDATE wallets SET balance = balance + 10` are strictly prohibited. Wallet balances are computed as the dynamic sum of historical ledger entries or updated via immutable journal lines.
3. **Idempotency:** Every transaction requires a unique, server-generated idempotency key. Duplicate submissions return the cached settled record without re-executing ledger lines.

---

## 5. PayPal Provider Adapter & Webhook Architecture

TUKUBI implements a provider-agnostic abstraction (`PSPAdapter`) with PayPal as the initial global rail.

### 5.1 Configuration
```env
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_WEBHOOK_ID=your_paypal_webhook_id
PAYPAL_ENVIRONMENT=sandbox # or 'live'
NEXT_PUBLIC_APP_URL=https://tukubi.caribbean
```

### 5.2 Server Endpoints
- `POST /api/payments/checkout`: Authoritative checkout session initializer. Looks up price in DB, routes platform policy, creates PayPal order, and returns approval URL.
- `POST /api/payments/paypal/capture`: Captures approved order from PayPal, verifies amount, records transaction in `payment_transactions`, executes double-entry split in `ledger_entries`, and writes `commission_snapshots`.
- `POST /api/payments/subscriptions`: Initiates recurring PayPal billing agreements for Model A platform tiers or Model B creator tiers.
- `DELETE /api/payments/subscriptions`: Cancels active subscription agreements via PayPal API and flags DB records.
- `POST /api/payments/webhooks/paypal`: Handles asynchronous events (`PAYMENT.CAPTURE.COMPLETED`, `BILLING.SUBSCRIPTION.ACTIVATED`, `BILLING.SUBSCRIPTION.CANCELLED`, `PAYMENT.CAPTURE.REFUNDED`) with case-insensitive HMAC signature verification and deduplication in `payment_webhooks`.

---

## 6. Zero-Trust Security & Anti-Tampering Rules

1. **Client Price Tampering:** The client never specifies prices, discounts, or platform fees. The API resolves prices exclusively from `monetization_tier_configs`, `creator_subscription_plans`, or `products`.
2. **Commission Rate Protection:** Commission rates are evaluated server-side using the versioned `CommissionEngine` with immutable snapshots stored in `commission_snapshots`.
3. **No Synthetic / Fake Data:** Empty states render authentic `$0.00` balances and zero transactions. Success screens are only presented upon verified server capture.
4. **Store Policy Compliance:** Apple App Store and Google Play rules for digital goods on mobile devices route through native In-App Purchases (via `PaymentPolicyEngine`), while web checkout routes to PayPal/PSP rails.

---

## 7. Extending Payment Providers (Stripe, CX Pay, WiPay)

To introduce local Caribbean PSPs (such as WiPay in Trinidad & Tobago/Jamaica or CX Pay in Curacao/Aruba):
1. Implement the `PSPAdapter` interface (`packages/payments/src/adapters/types.ts`).
2. Register the adapter in `ProviderRegistry` (`packages/payments/src/provider-registry.ts`).
3. Configure regional routing rules in `packages/payments/src/capability-registry.ts`.
4. Add webhook dispatching in `apps/web/src/app/api/payments/webhooks/[provider]/route.ts`.
