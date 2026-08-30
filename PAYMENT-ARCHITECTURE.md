# TUKUBI Financial Center & Payment Infrastructure Architecture

## 1. Architectural Philosophy & Principles

TUKUBI operates a **provider-neutral financial orchestration layer** engineered to NASA-grade reliability and Fortune-100 security standards.

The architecture decouples the social, creator, event, and marketplace experience from underlying payment processors, ensuring that Caribbean-first rails (CX Pay, WiPay), international cards (Stripe), global diaspora wallets (PayPal), and mobile app store in-app purchases (Apple IAP, Google Play Billing) are handled via a unified adapter pattern.

```
                    TUKUBI COMMERCE SURFACE
         (Marketplace, Creator Studio, Events, Ads)
                            │
                            ▼
               PAYMENT POLICY ROUTING ENGINE
         (Store Compliance • Geo Rules • Capability Check)
                            │
                            ▼
              UNIVERSAL PAYMENT ORCHESTRATOR
         (Idempotency • State Machine • Ledger Dispatch)
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
          ▼                 ▼                 ▼
   PSP ADAPTERS      DOUBLE-ENTRY      AUDIT & WEBHOOKS
  • Stripe (Cards)      LEDGER         • Signature Check
  • PayPal (Global)  • Sum = 0 Invariant • Deduplication
  • CX Pay (Carib)   • Immutability    • Event Logging
  • WiPay (Carib)    • Integer Cents
  • Apple/Google Pay
```

### Core Invariants:
1. **Integer Minor Units:** All monetary values are strictly represented as integers in minor currency units (e.g., cents for USD, JMD, TTD). Floating-point math is banned across all financial pathways.
2. **Double-Entry Ledger Integrity:** Every transaction generates balanced `DEBIT` (negative) and `CREDIT` (positive) entry pairs (`Total Debit + Total Credit = 0`). The database kernel rejects unbalanced insertions via trigger.
3. **Cryptographic Idempotency:** Every mutation requires a unique idempotency key (`idempotency_key`), preventing duplicate transactions or charge replay.
4. **Zero Raw Card Data (PCI-DSS):** PANs and CVVs are tokenized directly at the provider vault level. TUKUBI servers never receive or store unencrypted payment credentials.
5. **Mobile Store Compliance (§3.1.1):** Digital subscriptions, virtual gifts, and in-app tips on iOS/Android route strictly through Apple IAP or Google Play Billing.

---

## 2. Provider Capability Model

Each payment processor declares verified capabilities in the `payment_providers` registry:

| Provider | Capabilities | Supported Currencies | Status |
| :--- | :--- | :--- | :--- |
| **Stripe** | `payment`, `checkout`, `authorization`, `capture`, `refund`, `subscription`, `3ds`, `apple_pay`, `google_pay` | USD, CAD, GBP, EUR | Active (Configured) |
| **PayPal** | `payment`, `checkout`, `refund`, `subscription`, `payout`, `dispute_management` | USD, CAD, GBP, EUR, DOP, JMD, TTD | Active (Configured) |
| **CX Pay** | `payment`, `checkout`, `tokenization`, `refund`, `3ds` | USD, DOP, JMD, TTD, BBD, BSD, ANG, AWG, XCD | Caribbean Gateway Candidate |
| **WiPay** | `payment`, `checkout`, `refund`, `withdrawal`, `bank_settlement` | USD, TTD, JMD, BBD, GYD | Caribbean Processor Candidate |
| **Apple Pay / Google Pay** | `payment`, `checkout`, `tokenization` | Multi-currency (via underlying PSP) | Active |

---

## 3. Database Schema

The database schema is partitioned across versioned migrations in `supabase/migrations/`:

- `00004_ledger_accounts.sql`: Base ledger accounts, entries, and zero-sum balance triggers.
- `00011_payments_engine.sql`: Payment methods, payment intents, refunds, disputes, payouts.
- `00012_commerce_orders.sql`: Orders, products, event tickets, escrow helpers.
- `00028_monetization_engine.sql`: Seller plans, business subscriptions, monetization rules.
- `00031_financial_center_schema.sql`: Provider registry, user connected accounts state machine, webhook audit trail, immutable payment audit logs, transfer records.

### Row Level Security (RLS) Boundaries:
- `payment_methods`: Owner-scoped CRUD (`auth.uid() = owner_id`).
- `payment_connections`: User-scoped CRUD (`auth.uid() = user_id`).
- `transfer_records`: Participant-scoped read (`auth.uid() = sender_id OR auth.uid() = recipient_id`).
- `ledger_entries`, `payment_webhooks`, `payment_audit_logs`: **Service-role only** (`USING (false) WITH CHECK (false)`).

---

## 4. Monetization & Creator Fee Model

TUKUBI operates a transparent, tiered monetization model:

### Business Seller Plans:
- **Business Free ($0/mo):** 5 listings, 0% platform sales commission.
- **Seller Pro ($14.99/mo):** Unlimited listings, digital storefront, AI tools, 0% platform sales commission.
- **Business+ ($39.99/mo):** Advanced CRM, 5 staff seats, AI marketing, priority discovery, 0% platform sales commission.

### Creator Tiers:
- **Creator Starter ($0/mo):** 10% platform fee on fan tips & live gifts.
- **Creator Plus ($9.99/mo):** 5% reduced platform fee on fan patronage, HD live streaming.
- **Creator Pro ($24.99/mo):** 0% platform fee on fan tips & memberships, dedicated partner manager.

---

## 5. Webhook Processing & Replay Protection

Webhooks are routed to `/api/payments/webhooks/[provider]` and processed through `WebhookProcessor`:
1. Cryptographic HMAC / RSA signature verification.
2. Deduplication check via `provider_id:event_id` unique constraint in `payment_webhooks`.
3. Idempotent state transition execution.
4. HTTP 200 acknowledgment with immutable audit log recording.
