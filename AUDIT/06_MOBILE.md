# 06_MOBILE.md — Universal Expo React Native Mobile Architecture

## 1. App Modularization
- `apps/mobile/App.tsx`: Root application with navigation state.
- `apps/mobile/src/`:
  - `theme/tokens.ts`: Mobile design tokens matching web theme.
  - `lib/supabase.ts`: Mobile Supabase client configuration.
  - `components/Header.tsx`: Top header with SpotPay wallet balance and alerts.
  - `components/BottomNav.tsx`: 5-tab native navigation bar (Home, Explore, Communities, Messages, SpotPay).
  - `screens/HomeScreen.tsx`, `screens/ExploreScreen.tsx`, `screens/CommunitiesScreen.tsx`, `screens/MessagesScreen.tsx`, `screens/SpotPayScreen.tsx`.

## 2. In-App Purchase (IAP) Strategy
- Digital goods (virtual gifts, subscriptions) on iOS/Android route through Apple IAP and Google Play Billing in strict adherence to App Store guidelines.
