# ADR 010: Replacement of SpotPay-Centric Architecture with Provider-Neutral TUKUBI Financial Center

## Status
**Accepted & Implemented** (2026-08-29)

## Context
TUKUBI was previously architected with SpotPay as its central financial brand, assuming a proprietary wallet, custom payment rail, and simulated mock connection flows. However:
1. SpotPay does not expose a public developer API, SDK, or partner integration program.
2. Production code contained simulated flows (`setTimeout`), mock hardcoded balances (`$240.50`), and inaccurate compliance claims ("FDIC Insured" text on mobile).
3. Primary Caribbean digital payment providers (CX Pay, WiPay) and global providers (PayPal, Stripe) were not integrated into a unified provider-neutral abstraction layer.

## Decision
1. **Provider-Neutral Abstraction:** Created `@caribbean/payments` with an adapter pattern (`PSPAdapter`), provider capability registry, and connection state machine supporting Stripe, PayPal, CX Pay, WiPay, Cash App Pay, Apple Pay, and Google Pay.
2. **Double-Entry Ledger Preservation:** Preserved and hardened the integer minor unit `Money` class and the zero-sum balanced `LedgerOrchestrator`.
3. **Route Migration:** Routed all financial management to `/financial-center` with backward-compatible redirects from `/spotpay`.
4. **Sanitization:** Eliminated all mock financial balances, simulated connection timers, and false regulatory claims across Web and Mobile.
5. **Monetization Framework:** Implemented tiered merchant and creator monetization models (flat fee monthly subscriptions with configurable platform fees).

## Consequences
- **Positive:** Full regulatory compliance, zero mock data in production paths, pluggable support for Caribbean and global payment providers, accurate auditability.
- **Maintenance:** Adding a new payment processor now requires implementing only a single `PSPAdapter` class and registering capabilities in `payment_providers`.
