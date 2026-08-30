# 01_REPOSITORY.md — Complete Repository Forensic Audit

## 1. Monorepo Topography
- **Monorepo Manager:** Turborepo 2.10.9 with pnpm 9.0.0 workspaces.
- **Node Runtime:** Node.js >= 20.0.0 (Node 22 LTS verified).
- **Core Applications (4):**
  1. `apps/web` — Next.js 15.5.23 App Router (Main Consumer Social & Commerce Platform)
  2. `apps/admin` — Next.js 15.5.23 App Router (Internal Platform Operations & Flag Management)
  3. `apps/moderation` — Next.js 15.5.23 App Router (Trust & Safety Moderation Center)
  4. `apps/mobile` — Universal React Native (Expo 52, React 18.3.1, React Native 0.76.5)

- **Domain Packages (23):**
  - Core Foundation: `@caribbean/design-system`, `@caribbean/ui`, `@caribbean/database`, `@caribbean/api`
  - Financial Subsystem: `@caribbean/Payments` (Double-entry ledger & PSP Adapters)
  - Social & Community: `@caribbean/social`, `@caribbean/communities`, `@caribbean/messaging`, `@caribbean/notifications`
  - Media & Entertainment: `@caribbean/media`, `@caribbean/live`, `@caribbean/podcasts`
  - Commerce & Creator: `@caribbean/creator`, `@caribbean/marketplace`, `@caribbean/business`, `@caribbean/advertising`
  - Intelligence & Security: `@caribbean/ai`, `@caribbean/search`, `@caribbean/recommendations`, `@caribbean/trust-safety`, `@caribbean/analytics`, `@caribbean/localization`, `@caribbean/auth`

## 2. Dependency & Configuration Health
- TypeScript `5.9.3` strictly typed across all 27 workspaces.
- PostCSS & Tailwind CSS configurations unified with standard preset.
- Zero cyclic dependencies detected.
- PostgREST joins typed via explicit interfaces.
