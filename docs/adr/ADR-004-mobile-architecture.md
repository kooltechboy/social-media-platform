# ADR-004 — Expo React Native Universal Mobile App

**Status:** Accepted
**Context:** Caribbean audience is mobile-first; iOS + Android required; one team must maintain web and mobile. Mobile must use native capabilities (camera, mic, biometrics, Apple/Google Pay, push, deep links) — not a responsive website.
**Decision:** React Native + Expo (universal app in `apps/mobile`), TypeScript, NativeWind sharing design tokens with `@caribbean/design-system`. EAS builds/OTA (non-financial surfaces only). Performance budget targets mid-range Android.
**Consequences:** Code/token sharing with web; store compliance (IAP/Play Billing routing) enforced server-side via the Payment Policy Engine. Native modules require review when Expo SDK lacks coverage.
