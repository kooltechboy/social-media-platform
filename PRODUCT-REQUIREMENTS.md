# Product Requirements — TUKUBI

> **North Star:** The digital home of the Caribbean and its global diaspora.
> **TUKUBI** = Where people discover, socialize, create, sell, and buy.
> Visual Brand Identity: **TUKUBI — Caribbean Digital Ecosystem & Social Commerce**.

---

## 1. Problem Statement

Caribbean people and the diaspora (est. 40M+ globally incl. 10M+ in the US, Canada, UK, Europe) are spread across generic global platforms that:
- have no model of Caribbean identity, culture, or diaspora relationships;
- bury Caribbean content under global engagement algorithms;
- fragment discovery of Caribbean businesses, events, creators, and music;
- impose high cross-border friction on commerce and payments.

---

## 2. Strategic Ecosystem Architecture: TUKUBI Universal Commerce

```
                         TUKUBI
               (Social • Culture • Commerce)
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
        SOCIAL           COMMERCE          CREATORS
          │                 │                 │
          └─────────────────┼─────────────────┘
                            │
                     TUKUBI CHECKOUT
                            │
             ┌──────────────┼──────────────┐
             │              │              │
          PAYPAL        APPLE PAY      GOOGLE PAY
      (Primary Merchant)    │              │
             │              └──────── CARDS
             │                             │
             └────── MULTI-SELLER SPLIT ───┘
                            │
                    PAYMENT LAYER (PSP)
                            │
                     MERCHANT / SELLER
```

### Synergistic Monetization Architecture:
1. **TUKUBI Social & Commerce Platform:**
   - Monetization: Free tiers + configurable subscriptions (Starter $0, Seller Pro $14.99/mo, Business+ $39.99/mo, Enterprise), Advertising, Featured Listings, Creator AI Tools.
   - Versioned commission engine separating Gross Merchandise Value (GMV) from TUKUBI Retained Net Revenue.
2. **Universal Payment & Financial Infrastructure:**
   - Multi-rail payment orchestration with PayPal as primary merchant rail, Stripe / Card processing, and native mobile in-app purchases.
   - Immutable double-entry financial ledger enforcing zero-sum balance conservation ($\sum \text{Debits} + \sum \text{Credits} = 0$).
3. **Multi-Seller Fulfillment Network:**
   - Unified checkout allowing buyers to purchase from multiple Caribbean merchants in a single transaction, automatically splitting orders and payouts per merchant.

---

## 3. Product Pillars

1. **Identity & Caribbean Graph** — profiles with country/island/parish/diaspora connections; privacy-controlled by default.
2. **Social & Moments** — posts, photos, video reels, comments, reactions, multi-mode feed, search, notifications.
3. **Communities** — public/private diaspora groups with community moderation.
4. **Messaging** — end-to-end encrypted DMs and group chats.
5. **Creator OS** — reels, podcasts, live streaming, creator subscriptions, tipping, and instant ledger payouts.
6. **Business OS & Digital Storefronts** — verified merchant profiles, catalog ordering, bookings, reviews, and AI Business Concierge.
7. **TUKUBI Unified Checkout** — multimodal checkout supporting PayPal and eligible debit/credit cards with itemized pricing and regional shipping.
8. **CaribAI** — Grounded "Ask This Business" AI assistant, dialect translation (Patois/Creole/Spanish/Kreyòl), and content planning.

---

## 4. Checkout Experience & Payment Method Abstraction

At TUKUBI checkout, users experience frictionless payment choice:

```
Choose how you want to pay

🅿️ PayPal                               [ RECOMMENDED ]
   Pay securely with your PayPal account or saved payment methods.

Or choose another supported payment method:
 Apple Pay            G Pay Google Pay
💳 Card (Visa/MC)      🏦 Direct Bank Wire
```

- **Runtime Capability Discovery:** Payment methods are resolved at runtime via `psp_capabilities` rather than hardcoding regional banking integrations.
- **Transparent Processing Costs:** Transparent unit economics on every transaction: Gross, Commission, Processing Fee, and Seller Net.

---

## 5. Creator & Merchant Liquidity Lifecycle

```
Creator/Merchant Earns:
      │
      ▼
$1,000 in Merchant Account
      │
      ├── Reinvest in Platform Promotion / Ads
      ├── Tip a Collaborating Creator
      ├── Purchase Raw Materials from Caribbean Suppliers
      └── Withdraw to Local Caribbean Bank Account via PayPal / Card Payout
```

---

## 6. Onboarding & Account Linking

- **Seller Onboarding Flow:** Streamlined merchant onboarding with instant PayPal seller integration and verification.
- **No Merchant Friction:** Merchants accept whatever payment methods their customers prefer with automatic currency conversion and transparent escrow release.

---

## 7. Key Non-Functional Requirements

| Area | Requirement |
| :--- | :--- |
| **Security** | RLS on every table; double-entry ledger invariant ($\sum \text{Debit} = \sum \text{Credit}$); OWASP compliance; secrets isolation. |
| **Store Policy** | Zero bypass of Apple §3.1.1 or Google Play Billing; digital subscriptions on mobile route via IAP/Play Billing. |
| **Privacy** | Cultural and geographic identity private by default; user-controlled visibility. |
| **Performance** | Sub-3s TTI on mobile web; responsive UI across iOS, Android, and Desktop. |
| **Availability** | 99.9% uptime with idempotent transaction processing. |

---

## 8. Detailed References

- Geographic Data Model: `docs/architecture/geographic-data-model.md`
- Monetization Engine: `supabase/migrations/00036_hybrid_monetization_revenue_architecture.sql`
- Payment Architecture: `PAYMENT-ARCHITECTURE.md`
- System Architecture: `ARCHITECTURE.md`
- Implementation Roadmap: `docs/IMPLEMENTATION-ROADMAP.md`
