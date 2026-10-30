# TUKUBI Official Brand Identity Transformation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the newly approved TUKUBI logo concept as the official brand identity across the entire TUKUBI ecosystem (web, mobile, admin, moderation, creator/business studios, packages, design system tokens, and metadata).

**Architecture:** Precision vector SVG reconstruction of the approved stylized "T" symbol, wordmark, and tagline; centralized asset generation for all required web/mobile/PWA formats; centralized token governance in `@caribbean/design-system` and `@caribbean/ui`; comprehensive application-wide migration preserving 100% of existing functional features and backend/database states.

**Tech Stack:** Next.js 15, React 19, TypeScript 5.5, Tailwind CSS, Turborepo, Playwright Chromium / Canvas / SVG rendering, Expo React Native, Supabase.

**Spec:** User Master Prompt for TUKUBI Official Brand Identity Transformation (`media_1793323302123_b3aab962.jpg`).

## Global Constraints
- Source of truth: The approved TUKUBI logo concept from `media_1793323302123_b3aab962.jpg`.
- Brand Name: TUKUBI (all uppercase).
- Official Tagline: "The Caribbean Connected."
- Approved Color Palette:
  - Caribbean Teal: `#00C2A8`
  - Ocean Blue: `#0EA5E9`
  - Violet: `#8B5CF6`
  - Sunset Orange: `#F59E0B`
  - Deep Navy: `#0B1B3B`
  - Sand: `#F8FAFC`
- Never reset production database or remove existing business logic / routes.
- Full vector SVG fidelity (no raster screenshot embeds).
- WCAG 2.2 AA accessibility target.

---

### Task 1: Reconstruct Vector Geometry for Approved Mark
- Build precision SVG paths for the stylized "T" mark, top bar wave, folded ribbon stem with 4-stop gradient, and 3 radiating splash fronds.
- Reconstruct primary horizontal lockup, stacked alternative, monochrome silhouette, white-on-dark, and dark-on-light variants.

### Task 2: Build Master Asset Export Pipeline
- Generate high-res transparent PNGs, mobile app icons (1024x1024, Android adaptive, iOS), web favicons (ICO, SVG, 16/32/48px), PWA icons (192/512px + maskable), and OpenGraph social cards.

### Task 3: Centralize Tokens & Reusable Brand Components
- Update `@caribbean/design-system` tokens and `@caribbean/ui` components (`BrandLogo`, `BrandSymbol`) with vector SVG rendering, light/dark variants, and responsive sizing.

### Task 4: Platform-Wide Asset Distribution
- Replace legacy assets across `apps/web`, `apps/admin`, `apps/moderation`, `apps/mobile`, `apps/creator-studio`, `apps/business-studio`.

### Task 5: UI Surfaces & Metadata Update
- Audit and align all navigation headers, hero sections, footers, login/signup modals, PWA manifest, and OpenGraph metadata.

### Task 6: Verification & Quality Assurance
- Run automated typecheck, lint, unit tests, visual rendering checks across all sizes, and produce brand specification & rollback documentation.
