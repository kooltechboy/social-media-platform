# Monetization Model — TUKUBI

## 1. Principle
Multiple revenue streams from day one of monetization (Phase 6+); never exclusively advertising. Creators must have a genuine economic reason to build here: transparent fees, multiple streams, Caribbean discovery advantage, direct fan relationships.

## 2. Revenue Streams

| Stream | Mechanism | Phase |
| :--- | :--- | :--- |
| Creator subscriptions | $2.99/$4.99/$9.99 tiers; platform take-rate transparent | 6 |
| Tips & live gifts | SpotPay wallet ledger transactions | 6 |
| Marketplace commissions | % of physical/digital goods | 7+ |
| Event ticketing fees | per-ticket fee at checkout | 7 |
| Business subscriptions | Business/Business Pro plans (research-priced) | 7 |
| Advertising | self-serve campaigns: sponsored posts/video/native/search | 8 |
| Premium creator tools | Creator Pro analytics/production tools | 8+ |
| Podcast monetization | ads + premium podcast tools | 8 |
| Platform subscriptions | Plus tier (research-gated; never paywall core social) | research |
| Verification | only if research demonstrates value; never a vanity badge | research |

Pricing is **not finalized** without market research per segment/country (purchasing power varies widely across the region).

## 3. Revenue Engine

```
revenue_engine/
├── advertising/ ├── subscriptions/ ├── marketplace/ ├── creator/
├── events/      ├── podcasts/      ├── live/        ├── business/
└── payments/    (SpotPay orchestration)
```
Every revenue stream feeds **one centralized financial reporting system** reconciled against the SpotPay ledger (`PAYMENT-ARCHITECTURE.md`).

## 4. Creator Economics

Revenue waterfall per transaction: Gross → Payment processing → Platform commission → Taxes/withholding → Net to creator. Creator dashboard exposes every line. Payouts gated by KYC, thresholds, fraud review, chargeback reserves.

**Caribbean Creator Fund** (later): seeded pool rewarding launch-cohort creators; budget-gated, transparent criteria.

## 5. Advertising Constraints
- Privacy-aware targeting: interest + declared geography + context — **not** surveillance-grade behavioral tracking.
- Metrics: impressions, reach, clicks, conversions, CTR, CPC, CPM, ROAS.
- Ad load capped; user feedback ("show less") honored; no ads in core messaging.

## 6. Business Model Risks
- Payments fragmentation across 20+ jurisdictions → mitigated by `psp_capabilities` matrix + PSP abstraction.
- Store commission drag on mobile digital goods → pricing accounts for IAP economics; physical/events route via web.
- Low ARPU in some markets → diaspora markets (US/CA/UK) carry monetization while home markets build density.
