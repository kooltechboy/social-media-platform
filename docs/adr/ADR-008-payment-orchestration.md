# ADR-008 — Unified Payment Orchestration Layer

**Status:** Superseded by [ADR-010](ADR-010-financial-center.md)
**Context:** Tips, gifts, subscriptions, tickets, marketplace, ads, and payouts span 20+ jurisdictions with fragmented payment availability plus Apple/Google store-policy constraints on digital goods.
**Decision:** Provider-neutral payment orchestration layer: PSP gateway abstraction (PayPal, Stripe, Apple IAP, Google Play Billing). Runtime capability matrix (`psp_capabilities`) and a configurable Payment Policy Engine decide routes. No raw card data — tokenized methods only.
**Consequences:** All commerce surfaces share one compliant, testable financial path. Store policies are never bypassed. Adding a PSP is configuration + adapter, not surgery. See `PAYMENT-ARCHITECTURE.md`.
