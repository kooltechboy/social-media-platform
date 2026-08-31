# TUKUBI Progressive Web App (PWA) Architecture

This document describes the production-grade Progressive Web App (PWA) installation, caching, offline resilience, and telemetry architecture for **TUKUBI** (`https://www.tukubi.com`).

---

## 1. Core Principles & Philosophy
- **Authentic Platform Experience**: TUKUBI delivers a real, native-feeling application experience on supported mobile and desktop platforms without fake buttons, simulations, or broken install loops.
- **Security & Privacy First**: Zero sensitive user data, private chats, or payment transactions are cached in Service Worker storage.
- **Authentication Preservation**: Installing and launching standalone TUKUBI preserves existing user sessions, while unauthenticated users are directed to the canonical login experience.
- **Polite Presentation**: Visitors are never bombarded with instant popups upon load; install banners use polite engagement delays, 7-day dismissal cooldowns, and persistent settings options.

---

## 2. Web App Manifest
- **Source**: `apps/web/src/app/manifest.ts` (Dynamic Next.js 15 metadata route) and `apps/web/public/manifest.json` (Static fallback).
- **Endpoint**: `/manifest.webmanifest` & `/manifest.json`.
- **Identity**:
  - `name`: `TUKUBI`
  - `short_name`: `TUKUBI`
  - `description`: `The Caribbean Connected.`
  - `theme_color`: `#0a0612` (Caribbean Twilight)
  - `background_color`: `#060A13` (Deep Midnight Gateway)
  - `display`: `standalone`
  - `orientation`: `portrait-primary`
  - `start_url`: `/`
  - `scope`: `/`
- **Application Icons**:
  - `icon-192.png` (192×192 standard)
  - `icon-512.png` (512×512 standard)
  - `icon-maskable-192.png` (192×192 adaptive icon with 80% safe circle)
  - `icon-maskable-512.png` (512×512 adaptive icon with 80% safe circle)
  - `apple-touch-icon.png` (180×180 iOS home screen)
  - `icon.svg` & `favicon.svg` (Scalable vector emblems)

---

## 3. Service Worker & Caching Strategy
- **Location**: `apps/web/public/sw.js`
- **Cache Name**: `tukubi-static-v1.0.0`
- **Lifecycle & Update Model**:
  1. **Pre-caching**: Caches `/offline` fallback page, `favicon.svg`, and core branding icons on `install`.
  2. **Old Cache Invalidation**: On `activate`, sweeps and purges all previous `tukubi-*` caches that do not match the current version.
  3. **Client Claiming**: Immediately claims active clients via `self.clients.claim()`.
  4. **Skip Waiting**: Responds to `{ type: 'SKIP_WAITING' }` messages from client runtime.
- **Routing Rules**:
  - **HTML Navigations (`mode: 'navigate'`)**: **Network-First**. Fetches live page from server to ensure fresh authentication and SSR states. If network is unreachable, falls back to the pre-cached `/offline` route.
  - **Static Assets (`/_next/static/`, `/icons/`, images, fonts)**: **Cache-First / Stale-While-Revalidate**. Serves cached assets for instant rendering and updates in background.
  - **Strict Security Bypass (Network-Only)**:
    - Any URL under `/api/*`
    - Any URL under `/auth/*`
    - Any Supabase domain (`supabase.co`)
    - Any payment rails (`/payments/*`, `/stripe`)
    - All non-`GET` mutation requests (`POST`, `PUT`, `DELETE`, `PATCH`).

---

## 4. Platform-Specific Installation Flows

### A. Chromium Desktop & Android (Chrome, Edge, Samsung Internet)
- Listens for browser `beforeinstallprompt` event.
- Prevents default browser banner and exposes programmatic trigger via `promptInstall()`.
- Captures `appinstalled` event to transition application state to `isInstalled: true` and fires telemetry.

### B. iOS & iPadOS (Safari)
- Safari on iOS does not expose `beforeinstallprompt`.
- Environment detection identifies iOS Safari / iPadOS (`detectPwaPlatform()`).
- When the user selects "Install TUKUBI" or "Add to Home Screen", an accessible step-by-step guidance modal (`IosInstallModal`) is displayed showing:
  1. Tap the Safari **Share** icon.
  2. Scroll and select **Add to Home Screen**.
  3. Tap **Add** in the top corner.

### C. Unsupported Browsers (Firefox Desktop, in-app webviews)
- Detects lack of standalone installation support.
- Explains browser support transparently and directs users to supported environments.

---

## 5. User Interface Components

| Component | File Path | Purpose |
| :--- | :--- | :--- |
| `PwaProvider` | `apps/web/src/components/pwa/pwa-provider.tsx` | Global context provider for install state, service worker registration, and modals. |
| `PwaInstallBanner` | `apps/web/src/components/pwa/pwa-install-banner.tsx` | Polite floating banner with 4s engagement delay, Caribbean styling, and 7-day dismissal cooldown. |
| `IosInstallModal` | `apps/web/src/components/pwa/ios-install-modal.tsx` | Accessible step-by-step visual sheet for iOS Safari installation. |
| `SettingsView` | `apps/web/src/components/settings-view.tsx` | Persistent "Install TUKUBI" section under `/settings` with live status detection. |
| `OfflinePage` | `apps/web/src/app/offline/page.tsx` | Branded Caribbean offline screen with reconnection action. |

---

## 6. Telemetry & Analytics Taxonomy
Integrated with `@caribbean/analytics`:

- `pwa_install_prompt_available`: Browser reported that PWA installation criteria are met.
- `pwa_install_prompt_shown`: Floating banner rendered to user.
- `pwa_install_clicked`: User initiated installation action.
- `pwa_install_completed`: PWA installation successfully finished.
- `pwa_install_dismissed`: User selected "Maybe Later".
- `pwa_ios_install_instructions_shown`: iOS guide opened.
- `pwa_already_installed`: User launched app in standalone / installed mode.

---

## 7. Local Testing & Verification

1. **Run PWA automated unit tests**:
   ```bash
   pnpm test:unit tests/unit/pwa.test.ts
   ```
2. **Verify production manifest**:
   Open browser dev tools on `http://localhost:3000` → Application tab → Manifest. Verify name, theme colors, icons, and start_url.
3. **Verify Service Worker**:
   Application tab → Service Workers. Verify `/sw.js` is active and controlling the page.
4. **Test Offline Fallback**:
   Application tab → Service Workers → Toggle "Offline" checkbox → Reload page → Confirm branded `/offline` page appears with "Try Reconnecting" button.
