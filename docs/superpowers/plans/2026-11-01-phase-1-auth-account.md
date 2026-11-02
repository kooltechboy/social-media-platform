# Phase 1: Authentication & Onboarding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor and elevate Tukubi's Authentication and Multi-Step Onboarding subsystem into a resilient, high-performance, Fortune-100 secure system with zero session drop-off, seamless SSR cookie hydration, and WCAG 2.2 AA Caribbean Futurism UI.

**Architecture:** Implement server-side cookie propagation for atomic registration and login via `@supabase/ssr`, resilient dual-layer draft storage for multi-step onboarding, GPU-optimized Caribbean glassmorphism, real-time debounced handle reservation, and comprehensive unit/integration test coverage.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Supabase Auth & SSR (`@supabase/ssr`), Tailwind CSS v4, Lucide React, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-01-phase-1-auth-account-design.md`

## Global Constraints
- Preserve 100% of functional requirements and database schema integrity.
- Never store plaintext passwords in `localStorage`.
- Strictly enforce Row Level Security (RLS) and server middleware boundary.
- Zero TypeScript typecheck errors (`pnpm typecheck` must pass).
- Adhere to WCAG 2.2 AA accessibility with contrast ratios >= 4.5:1.

---

### Task 1: Auth Utilities & Validation Test Suite (TDD)

**Files:**
- Create: `tests/auth-validation.test.ts`
- Modify: `apps/web/src/lib/auth/redirect-utils.ts`
- Modify: `apps/web/src/app/api/auth/check-username/route.ts`

**Interfaces:**
- Consumes: URL search parameters and username query strings.
- Produces: `sanitizeRedirectUrl(raw: string | undefined): string`, `isValidUsername(val: string): boolean`.

- [ ] **Step 1: Write failing unit test for username and redirect safety in `tests/auth-validation.test.ts`**
- [ ] **Step 2: Run test to confirm failures**
- [ ] **Step 3: Implement validation functions and edge case handling**
- [ ] **Step 4: Run test to ensure 100% pass rate**
- [ ] **Step 5: Typecheck and commit**

---

### Task 2: Secure Multi-Step Draft State Engine

**Files:**
- Modify: `apps/web/src/lib/auth/signup-session.ts`
- Test: `tests/signup-session.test.ts`

**Interfaces:**
- Consumes: User draft inputs from onboarding steps (intent, origin, credentials, interests).
- Produces: `getSignupSession(): SignupState`, `saveSignupSession(patch): SignupState`, `clearSignupSession(): void`.

- [ ] **Step 1: Write unit test verifying state persistence without password leakage**
- [ ] **Step 2: Run test to verify failure on raw password persistence**
- [ ] **Step 3: Refactor `signup-session.ts` to use safe sessionStorage with auto-clearing sensitive memory caches**
- [ ] **Step 4: Run test and verify state integrity across steps**
- [ ] **Step 5: Typecheck and commit**

---

### Task 3: Atomic Server Actions with Direct SSR Cookie Sync

**Files:**
- Modify: `apps/web/src/lib/auth/actions.ts`
- Modify: `apps/web/src/app/signup/complete/page.tsx`
- Test: `tests/auth-actions.test.ts`

**Interfaces:**
- Consumes: Complete registration payload (credentials, origin, consent, vibes).
- Produces: `completeFullRegistrationAction(payload): Promise<{ success: boolean; error?: string; session?: any }>` with direct SSR cookie emission.

- [ ] **Step 1: Write integration test for registration and sign-in action contracts**
- [ ] **Step 2: Run test to verify existing failure modes (client-side re-login dependency)**
- [ ] **Step 3: Implement direct server-side session emission and auto-signin in `completeFullRegistrationAction`**
- [ ] **Step 4: Refactor `SignupCompletePage` to consume server-minted session without redundant client password calls**
- [ ] **Step 5: Run tests and verify zero session drops**

---

### Task 4: UI Refactoring — GPU-Optimized Caribbean Gateway & Login

**Files:**
- Modify: `apps/web/src/components/gateway/TukubiMasterGateway.tsx`
- Modify: `apps/web/src/components/gateway/SignInForm.tsx`
- Modify: `apps/web/src/components/gateway/CaribbeanAtmosphere.tsx`

**Interfaces:**
- Consumes: `@caribbean/design-system` tokens, `@caribbean/localization`.
- Produces: Accessible, responsive, 60fps login gateway with WCAG 2.2 AA compliant focus states.

- [ ] **Step 1: Profile and optimize `CaribbeanAtmosphere` GPU layers (remove unthrottled canvas overhead, optimize CSS blurs)**
- [ ] **Step 2: Enhance `SignInForm` with inline validation, ARIA live feedback, and smooth state transitions**
- [ ] **Step 3: Verify responsive layout on mobile, tablet, and desktop viewports**
- [ ] **Step 4: Verify keyboard navigation and screen-reader accessibility**

---

### Task 5: UI Refactoring — Multi-Step Signup Funnel & Cultural Passport

**Files:**
- Modify: `apps/web/src/app/signup/page.tsx`
- Modify: `apps/web/src/app/signup/caribbean/page.tsx`
- Modify: `apps/web/src/app/signup/account/page.tsx`
- Modify: `apps/web/src/app/signup/interests/page.tsx`
- Modify: `apps/web/src/components/gateway/TukubiCulturalPassport.tsx`

**Interfaces:**
- Consumes: `SignupState`, Caribbean country data, and cultural taxonomy.
- Produces: Polished 5-step onboarding funnel with interactive Cultural Passport preview.

- [ ] **Step 1: Refactor Step 1 (Intent) with tactile selection cards and clear persona badges**
- [ ] **Step 2: Refactor Step 2 (Caribbean Identity) with search filter, diaspora status, and privacy toggle**
- [ ] **Step 3: Refactor Step 3 (Identity Credentials) with debounced live handle validation, zxcvbn password meter, and COPPA age gating**
- [ ] **Step 4: Refactor Step 4 (Cultural Vibes) with animated multi-select chips**
- [ ] **Step 5: Enhance `TukubiCulturalPassport` with holographic light sweep and crisp micro-typography**

---

### Task 6: Full Verification & Quality Gate

**Files:**
- Test: All unit, integration, and E2E test suites.

- [ ] **Step 1: Run full unit test suite (`pnpm.cmd test:unit`)**
- [ ] **Step 2: Run TypeScript typecheck across monorepo (`pnpm.cmd typecheck`)**
- [ ] **Step 3: Verify no prohibited references or security boundary violations (`pnpm.cmd check:prohibited`)**
- [ ] **Step 4: Update task artifact and summary report**
