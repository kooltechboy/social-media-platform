# SpotPay Payment Architecture & Double-Entry Ledger — ANTILIA

## 1. Product Relationship & Ecosystem Topology

```
                         ANTILIA
               (Social • Culture • Commerce)
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
        SOCIAL           COMMERCE          CREATORS
          │                 │                 │
          └─────────────────┼─────────────────┘
                            │
                     ANTILIA CHECKOUT
                            │
             ┌──────────────┼──────────────┐
             │              │              │
       🟣 SPOTPAY       APPLE PAY      GOOGLE PAY
     (Fastest/Rec.)         │              │
             │              ├──────── PAYPAL
             │              │              │
             └──── CREDIT / DEBIT (Stripe) ┘
                            │
                    PAYMENT LAYER (PSP)
                            │
                     MERCHANT / SELLER
```

### The Clean Separation of Roles:
- **ANTILIA**: Where people discover, socialize, create, sell, and buy.
- **SpotPay**: How people move and spend money (financial-services platform, digital wallet, send/receive, cross-border transfers, Calypso Card, cards with Apple Pay & Google Pay).

### Visual & Ecosystem Identity:
- **ANTILIA**: *Social • Culture • Commerce*
- **Powered by SpotPay**: *Money • Payments • Wallet*

---

## 2. Distinct Business Models

```
┌────────────────────────────────────────────────────────┐
│                   ANTILIA BUSINESS MODEL               │
│ • Seller Subscriptions (Seller Pro $14.99, Business+)  │
│ • Business Subscriptions & Featured Listings           │
│ • Platform Advertising & Premium Creator Tools         │
│ • "ANTILIA doesn't take a percentage of your product   │
│    sales on eligible Seller plans."                    │
└────────────────────────────────────────────────────────┘
                           ▲
                           │ Closed-Loop Acquisition
                           ▼
┌────────────────────────────────────────────────────────┐
│                   SPOTPAY BUSINESS MODEL               │
│ • Financial Infrastructure & Money Movement            │
│ • Payment Processing & Card Interchange Economics      │
│ • FX & Cross-Border Transfers                          │
│ • Merchant & Payout Financial Services                 │
└────────────────────────────────────────────────────────┘
```

1. **Merchant Value Proposition:** Merchants pay ANTILIA a transparent monthly subscription ($14.99/mo on Seller Pro) to operate their full digital storefront. ANTILIA does not take a percentage cut of their product sales.
2. **Transparent Payment Processing:** Transactions remain subject to transparent third-party payment processing pass-through costs (e.g., standard 2.9% + 30¢ on card rails) or 0% on internal SpotPay wallet promotional settlements.
3. **SpotPay-to-SpotPay Velocity:** When a buyer pays via SpotPay to a SpotPay merchant or creator, the money settles instantly inside the SpotPay financial layer, allowing immediate downstream utility (peer transfers, tipping creators, purchasing goods, paying for event tickets, or withdrawing).

---

## 3. Financial Ledger Principles

- **Double-Entry Accounting:** Monetary values are never mutated in single table columns (`UPDATE balance SET balance = balance + 10`). Every financial transaction generates paired Debit and Credit ledger entries.
- **Sum Zero Identity:** For every transaction ID $T$, $\sum \text{Debit Amount} = \sum \text{Credit Amount}$.
- **Idempotency Locks:** Every financial API payload includes an `idempotency_key` string to prevent double-charging or duplicate transfers during network retries.
- **Immutable Records:** Ledger entries are append-only. Corrections are reversing entries, never updates.
- **Integer Minor Units:** All amounts stored as integer minor units (cents) + ISO currency code. Floating point is forbidden in money paths.
- **Reconciliation:** Scheduled jobs reconcile ledger state against provider reports; drift triggers alerts, never auto-"fixes".

---

## 4. Payment Capability Matrix & Mobile Store Compliance

`psp_capabilities` (migration `00004`) and `monetization_rules` (migration `00028`) are the **single source of truth** for method availability:

```
country + currency + provider + method + transaction_type +
availability + min_amount + max_amount + platform + product_type + status
```

**Never assume a payment method is available in every country.** Checkout must query the matrix at runtime. Payment methods are abstracted:
- **🟣 Pay with SpotPay (Recommended):** Stored-value wallet settlement with buyer escrow protection.
- **Apple Pay:** Biometric instant checkout (Dominican Republic, CIBC Caribbean markets, etc.).
- **Google Pay:** Biometric instant checkout across supported Caribbean and diaspora banks.
- **Credit / Debit Cards (Stripe):** Visa, Mastercard, Amex via PCI-compliant tokenization.
- **PayPal:** International diaspora checkout.

| Platform | Product Type | Recommended PSP / Method | Compliance Mechanism |
| :--- | :--- | :--- | :--- |
| **Mobile (iOS)** | Digital Subscriptions & Content | Apple In-App Purchase (IAP) | Store Policy Compliance (§3.1.1) |
| **Mobile (Android)** | Digital Subscriptions & Content | Google Play Billing | Store Policy Compliance |
| **Web & Mobile** | SpotPay Wallet P2P / Tipping | SpotPay Stored Balance | Native Ledger Transfer |
| **Web & Mobile** | Physical Goods & Event Tickets | SpotPay (Rec.) / Cards / Apple Pay / Google Pay / PayPal | Multimodal Web Checkout |

---

## 5. Creator & Merchant Ecosystem Flow

```
Creator/Merchant Earns:
      │
      ▼
$1,000 in SpotPay Account
      │
      ├── Send $100 to Family
      ├── Tip $25 to Collaborating Creator
      ├── Spend $200 with Caribbean Merchant
      ├── Pay $50 Phone / Utility Bill
      └── Withdraw $625 to Bank Account
```

The creator or merchant does not wait for traditional monthly batch delays; funds are immediately liquid within the SpotPay financial ecosystem.
