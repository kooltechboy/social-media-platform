# 03_FRONTEND.md — Frontend Systems & Web Performance Audit

## 1. Frontend Architecture
- **Framework:** Next.js 15.5.23 App Router with React 19.
- **Styling Engine:** Tailwind CSS with unified PostCSS configurations in `apps/web/postcss.config.js`, `apps/admin/postcss.config.js`, and `apps/moderation/postcss.config.js`.
- **Hydration Safety:** `suppressHydrationWarning` on `<html>` and `<body>` to neutralize browser extension DOM mutations.

## 2. Layout & Shell Systems
- **3-Column Editorial Layout:**
  - Left: Global navigation and Creator Studio triggers.
  - Center: Feed, Moments stories cinema rail, Video Reels, Live broadcasts, Podcasts, Marketplace.
  - Right: Caribbean Now Live Island Tickers, Trending Diaspora topics, SpotPay quick send.
