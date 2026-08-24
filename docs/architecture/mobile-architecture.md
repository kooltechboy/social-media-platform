# Mobile Architecture — ANTILIA

## 1. Positioning
Mobile is a **first-class product**, not a responsive website. The Caribbean audience is overwhelmingly mobile; the app must excel on **mid-range Android devices** on intermittent connectivity.

## 2. Stack
- React Native + Expo (universal iOS/Android), TypeScript, NativeWind (Tailwind tokens shared with `@caribbean/design-system`).
- Deep links / universal links / Android App Links from day one.
- Expo EAS for builds, OTA updates (non-financial, policy-compliant surfaces only), and push notifications.

## 3. Navigation & UX
Primary: **Home, Explore, Create (+), Communities, Messages.** Secondary surfaces discoverable without crowding the bar. Dark/light themes, dynamic type, reduced motion, offline/poor-connectivity as designed states (cache + retry + optimistic UI).

## 4. Native Capabilities (permissioned, least-privilege)
Camera & microphone (capture, live), media library (upload w/ background upload), biometric auth (secure storage for session material), push notifications, Apple Pay / Google Pay (capability-detected at runtime via SpotPay matrix — never assumed available).

## 5. Performance Rules
- Virtualized lists only (FlatList/FlashList); never render unbounded feeds.
- Image pipeline: CDN-resized variants, placeholders, responsive loading.
- Cold start budget: < 3s on mid-range Android; JS bundle kept lean; heavy features behind feature flags.
- Background uploads for media; resumable where supported.

## 6. Payments on Mobile (Store Compliance)
Digital goods/subscriptions on iOS → Apple IAP; on Android → Google Play Billing. Physical goods, services, event tickets → web-checkout routes per the Payment Policy Engine (`PAYMENT-ARCHITECTURE.md`). Route decisions are server-driven — the app never hard-codes checkout behavior.

## 7. Monorepo Integration
`apps/mobile` consumes `@caribbean/ui` (RN-compatible subset), `@caribbean/design-system`, `@caribbean/auth`, `@caribbean/api`, `@caribbean/spotpay` (client-safe types only — ledger logic never ships to clients).
