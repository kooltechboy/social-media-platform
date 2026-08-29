# Product Requirements — ANTILIA

> **North Star:** The digital home of the Caribbean and its global diaspora.
> **ANTILIA** = Where people discover, socialize, create, sell, and buy.
> **SpotPay** = How people move and spend money (financial-services platform, digital wallet, send/receive, cross-border transfers, Calypso Card, cards with Apple Pay & Google Pay).
> Visual Brand Identity: **ANTILIA (Social • Culture • Commerce) — Powered by SpotPay (Money • Payments • Wallet)**.

---

## 1. Problem Statement

Caribbean people and the diaspora (est. 40M+ globally incl. 10M+ in the US, Canada, UK, Europe) are spread across generic global platforms that:
- have no model of Caribbean identity, culture, or diaspora relationships;
- bury Caribbean content under global engagement algorithms;
- fragment discovery of Caribbean businesses, events, creators, and music;
- impose high cross-border friction on commerce and payments.

---

## 2. Strategic Ecosystem Architecture: ANTILIA × SpotPay

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

### Three Distinct, Synergistic Businesses:
1. **Business #1 — ANTILIA (Social & Commerce Platform):**
   - Monetization: Subscriptions (Business Free $0, Seller Pro $14.99/mo, Business+ $39.99/mo, Enterprise), Advertising, Featured Listings, Creator AI Tools.
   - Proposition: *"ANTILIA doesn't take a percentage of your product sales on eligible Seller plans."*
2. **Business #2 — SpotPay (Financial Infrastructure):**
   - Financial services platform (not a bank) providing digital wallet, send/receive, international transfers, Calypso Card, and card economics with Apple Pay/Google Pay.
   - Revenue: Payment processing, card interchange, FX, cross-border transfers, merchant/payout services.
3. **Business #3 — The ANTILIA × SpotPay Network:**
   - Closed-loop economic network: ANTILIA acquires users/merchants; SpotPay powers frictionless, instant within-ecosystem money movement (peer transfers, creator tips, shopping, event tickets, withdrawals).

---

## 3. Product Pillars

1. **Identity & Caribbean Graph** — profiles with country/island/parish/diaspora connections; privacy-controlled by default.
2. **Social & Moments** — posts, photos, video reels, comments, reactions, multi-mode feed, search, notifications.
3. **Communities** — public/private diaspora groups with community moderation.
4. **Messaging** — end-to-end encrypted DMs and group chats.
5. **Creator OS** — reels, podcasts, live streaming, creator subscriptions, tipping, and instant SpotPay wallet liquidity.
6. **Business OS & Digital Storefronts** — verified merchant profiles, catalog ordering, bookings, reviews, and AI Business Concierge.
7. **SpotPay Unified Checkout** — multimodal checkout with `🟣 Pay with SpotPay` as the preferred/fastest rail alongside Apple Pay, Google Pay, PayPal, and Cards.
8. **CaribAI** — Grounded "Ask This Business" AI assistant, dialect translation (Patois/Creole/Spanish/Kreyòl), and content planning.

---

## 4. Checkout Experience & Payment Method Abstraction

At ANTILIA checkout, users experience frictionless payment choice:

```
Choose how you want to pay

🟣 Pay with SpotPay                       [ FASTEST • RECOMMENDED ]
   Pay instantly from your SpotPay balance ($850.00). Zero FX markups.
   Funds stay liquid to send to friends, tip creators, or buy next!

Or choose another supported payment method:
 Apple Pay            G Pay Google Pay
💳 Card (Visa/MC)      P PayPal
```

- **Runtime Capability Discovery:** Payment methods are resolved at runtime via `psp_capabilities` rather than hardcoding regional banking integrations.
- **Transparent Processing Costs:** ANTILIA charges zero percentage commission on Seller Pro; payment processing pass-through fees (e.g. 2.9% + 30¢ on card rails) are transparently disclosed.

---

## 5. Creator & Merchant Liquidity Lifecycle

```
Creator/Merchant Earns:
      │
      ▼
$1,000 in SpotPay Account
      │
      ├── Send $100 to Family in Jamaica (Instant P2P)
      ├── Tip $25 to a Collaborating Creator
      ├── Buy $200 of Artisanal Caribbean Goods from a Dominican Merchant
      ├── Pay $50 Utility / Mobile Bill
      └── Withdraw $625 to Bank Account / Spend via Calypso Card
```

---

## 6. Onboarding & Account Linking

- **Connect SpotPay Step:** Optional, high-value connection flow:
  *"Connect your SpotPay wallet to unlock faster payments, creator tips, marketplace purchases and instant cross-border transfers. [Connect] [Skip for now]"*
- **No Merchant Friction:** Merchants are never forced to use a single wallet; ANTILIA enables them to accept whatever payment methods their customers prefer.

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
- Monetization Engine: `supabase/migrations/00028_monetization_seller_plans_affiliates.sql`
- SpotPay Architecture: `PAYMENT-ARCHITECTURE.md`
- System Architecture: `ARCHITECTURE.md`
- Implementation Roadmap: `docs/IMPLEMENTATION-ROADMAP.md`
