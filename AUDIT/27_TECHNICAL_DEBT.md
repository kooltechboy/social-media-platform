# 27 — TECHNICAL DEBT & CODE QUALITY AUDIT

**Domain:** Code Smells, Dependency Deprecations, Dead Code & Refactoring Targets  
**Auditor:** Principal Software Engineer & QA Director  
**Status:** Actionable Debt Inventory

---

## 1. Identified Technical Debt Items

1. **Deprecated Next.js Action Imports:**
   - Files: `apps/web/src/lib/events/actions.ts`, `messaging/actions.ts`, `social/actions.ts`.
   - `revalidatePath` imported from `'next/navigation'` instead of `'next/cache'`.

2. **Mobile Monolith (`apps/mobile/App.tsx`):**
   - 367 lines in one file containing local mock arrays (`FEED`, `COMMUNITIES`, `CONVERSATIONS`, `EXPLORE_SECTIONS`).
   - Needs modular decomposition into `src/screens/`, `src/components/`, `src/navigation/`, and `src/lib/supabase.ts`.

3. **Vite CJS Build Notice:**
   - Running `vitest` logs: `The CJS build of Vite's Node API is deprecated`.
   - Upgrade or adjust Vitest configuration to ESM mode in root `package.json` / `vite.config.ts`.
