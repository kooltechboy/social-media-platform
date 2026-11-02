# TUKUBI Phase 1: Authentication & Onboarding Architecture Specification

**Document Version:** 1.0.0  
**Status:** Approved  
**Author:** Tukubi Engineering Pair  
**System:** TUKUBI — The Caribbean Connected  

---

## 1. Executive Summary & Problem Statement

Tukubi's Authentication and Onboarding subsystem is the critical digital gateway through which Caribbean diaspora citizens, artists, businesses, and creators enter the platform. Reverse engineering the current implementation (`apps/web/src/app/login`, `apps/web/src/app/signup`, `apps/web/src/lib/auth/actions.ts`, `apps/web/src/lib/auth/signup-session.ts`) revealed four architectural vulnerabilities and UX bottlenecks:

1. **Session Desync Race Condition:** Registration was executed server-side via `completeFullRegistrationAction`, but session cookie establishment was deferred to a client-side `signInWithPassword` call in `SignupCompletePage`. If email confirmation was required or network dropped, state desynchronization occurred.
2. **Volatile Draft State & In-Memory Password Leakage:** Multi-step signup used a hybrid of `localStorage` and an in-memory variable (`transientPassword`). Hard page refreshes or route changes caused `transientPassword` to be lost, unexpectedly ejecting users back to Step 1.
3. **Handle Collision Edge Case:** The `@username` check was debounced in the browser, but lacked transactional reservation during registration submission, creating potential race conditions.
4. **Mobile Performance Bottleneck:** Overuse of nested `backdrop-blur-2xl` CSS filters caused GPU frame drops on budget mobile devices.

This specification defines the "Far Superior" clean-room architecture that retains 100% functional parity while delivering Fortune-100 security, instant session hydration, WCAG 2.2 AA accessibility, and Caribbean Futurism aesthetic polish.

---

## 2. Target Architecture & Core Invariants

### 2.1 Invariant Rules
- **No Password in Client Storage:** Raw user passwords must never be stored in `localStorage` or exposed in client bundles.
- **Server-Owned Session Propagation:** Sessions are established directly in Server Action response headers using `@supabase/ssr` cookies. The browser is authenticated upon completion without needing a second client-side round-trip.
- **Privacy of Caribbean Identity:** Origin island and diaspora flags are strictly optional and default to private visibility in `profile_identity`. Users maintain absolute control.
- **WCAG 2.2 AA Compliance:** Contrast ratio >= 4.5:1 for normal text, explicit focus rings (`#00C2A8`), keyboard trapping in modals, and `aria-live="polite"` feedback for dynamic validations.

---

## 3. Component & State Architecture

### 3.1 Flow Breakdown
1. **`/login` — Master Gateway & Authentication:**
   - Dual-mode: Password login and Magic Link with automatic fallback.
   - Live form validation with clear inline field errors.
   - Safe redirect sanitization ensuring off-domain open redirect attacks are strictly rejected.
2. **`/signup` (Funnel Steps 1-5):**
   - **Step 1: `/signup` (Intent):** Selection of 7 core platform personas (Personal, Creator, Business, Organization, Media, Community, Seller).
   - **Step 2: `/signup/caribbean` (Identity & Roots):** Selection of Caribbean nation/territory, diaspora residence, and privacy toggles.
   - **Step 3: `/signup/account` (Identity Credentials):** First/Last name, live verified `@username` with culturally tuned smart suggestions, email/phone, password with zxcvbn strength scoring, COPPA age verification (13+), and statutory consent records.
   - **Step 4: `/signup/interests` (Cultural Vibes):** Interactive selection of cultural badges (Carnival, Soca, Dancehall, Tech, Literature, Cuisine, Reggae).
   - **Step 5: `/signup/complete` (Minting & Session Hydration):** Executes atomic account creation, mints the cryptographic Tukubi Cultural Passport, establishes session cookies, and transitions smoothly into the platform feed or creator onboarding.

---

## 4. Security & Compliance Specifications

- **Rate Limiting:** Protect `/api/auth/check-username` and auth actions with client IP throttling.
- **Input Sanitization:** Usernames normalized to lowercase alphanumeric, dots, and underscores (`^[a-z0-9_.]{3,30}$`).
- **Statutory Consent Audit Trail:** Records explicit consent for Terms of Service, Privacy Notice, Community Standards, and optional Marketing Communications into `legal_consent_records` compliant with GDPR Art. 7 and Dominican Republic Laws 126-02 / 172-13.

---

## 5. Verification & Testing Strategy

- **Unit Tests:**
  - Password strength and entropy calculations.
  - Username formatting and reserved word validation.
  - Redirect sanitization security invariants.
- **Integration Tests:**
  - `completeFullRegistrationAction` and `signInAction` state transitions.
  - Profile and identity database record upserts.
- **End-to-End Tests:**
  - Playwright test exercising complete signup flow and login gateway.
