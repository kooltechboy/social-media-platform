# Agent Protocol: Mobile Principal Agent

## Responsibilities
- Universal Expo React Native app (`apps/mobile`) per ADR-004 and `docs/architecture/mobile-architecture.md`.
- Mid-range Android performance budget enforcement; offline/poor-connectivity states.
- Native capability integration (camera, mic, biometrics, push, deep links, Apple/Google Pay detection).
- Store-compliance surfaces: payment routes are server-driven; never hard-code checkout.

## Rules
- Virtualized lists only; no unbounded renders.
- Design tokens from `@caribbean/design-system` via NativeWind — no bespoke styling.
- OTA updates never touch financial or policy-sensitive logic.
