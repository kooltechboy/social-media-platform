# 03 — FRONTEND AUDIT (`apps/web`)

**Domain:** Web Application, React 19 / Next.js 15 App Router, Server Components & Client Hydration  
**Auditor:** Principal Frontend Engineer & Web Architect  
**Status:** Needs Improvement (Score: 74/100)

---

## 1. Executive Summary & Forensic Findings

The frontend web application (`apps/web`) is structured using the Next.js 15 App Router with React Server Components (RSC), Tailwind CSS, and Lucide React icons. The page compositions for the feed, creator studio, communities, podcasts, and marketplace are visually modern and culturally authentic.

However, a strict compile-time forensic audit (`pnpm typecheck`) surfaced **several critical build-breaking defects**:

### P0 Compile Errors Identified in Source Files

1. **Incorrect `revalidatePath` Module Imports:**
   - Files: `apps/web/src/lib/events/actions.ts:3`, `apps/web/src/lib/messaging/actions.ts:3`, `apps/web/src/lib/social/actions.ts:3`
   - *Error:* `Module '"next/navigation.js"' has no exported member 'revalidatePath'.`
   - *Root Cause:* In Next.js App Router, `revalidatePath` must be imported from `'next/cache'`, not `'next/navigation'`.

2. **Creator Studio Type Parameter Mismatch:**
   - File: `apps/web/src/app/creator-studio/page.tsx:110, 129, 185, 215, 223`
   - *Error:* `applyFees` argument type mismatch, `isFraudReview` non-existent on `PayoutContext`, `payoutEligibility.reason` instead of `.reasons`.
   - *Root Cause:* Page passed object with wrong property names (`grossAmountMinor`, `thresholdMinor`, `isFraudReview`) instead of complying with `@caribbean/creator` interface signatures (`grossMinor`, `payoutThresholdMinor`, `fraudHold`).

3. **Marketplace Action Property Names:**
   - File: `apps/web/src/lib/marketplace/actions.ts:51-53`
   - *Error:* Property `subtotal`, `platformFee`, `total` does not exist on type `OrderTotals`.
   - *Root Cause:* `@caribbean/marketplace` specifies `subtotalMinor`, `platformFeeMinor`, `totalMinor`.

4. **Community Policy Method Invocations:**
   - File: `apps/web/src/lib/communities/actions.ts:47, 54, 151`
   - *Error:* `CommunityPolicy.slugify` called statically, constructor called with invalid parameters.
   - *Root Cause:* `CommunityPolicy` instance vs static method mismatch.

5. **PostgREST Query Post-Processing:**
   - File: `apps/web/src/lib/podcasts/actions.ts:58`
   - *Error:* `.catch()` called directly on `PostgrestBuilder`.

---

## 2. Route Matrix & Operational Status

| Route | Purpose | Render Type | Auth Required | Status |
| :--- | :--- | :--- | :--- | :--- |
| `/` | Main Timeline & Discovery Feed | RSC + Client widgets | Optional | Functional (needs FeedPost typing fix) |
| `/login` | Email/Password & OAuth Sign-In | Client Component | Public | Functional |
| `/explore` | Ask Caribbean AI & Cultural Search | RSC + Search Bar | Public | Functional |
| `/reels` | Vertical short-form video feed | RSC + Video player | Public | Functional |
| `/communities` | Island & diaspora community hubs | RSC + Server Actions | Public | Action typing fixes needed |
| `/creator-studio`| Creator dashboard, earnings & studio | RSC + Payments wallet | Creator Only | Typecheck fixes needed |
| `/podcasts` | Caribbean audio/video podcast hub | RSC + Audio player | Public | Functional |
| `/live` | Live broadcast & chat stream | RSC + WebRTC/HLS | Public / Auth | Live chat functional |
| `/marketplace` | Diaspora & regional goods commerce | RSC + Cart Actions | Public / Auth | Cart action fixes needed |
| `/events` | Cultural festivals & ticket sales | RSC + RSVP Actions | Public / Auth | Action import fixes needed |
| `/messages` | Direct & group community chat | RSC + Supabase RT | Authenticated | Conversation typing fix needed |
| `/Payments` | Ledger wallet, cards, payout history | RSC + Modal | Authenticated | Functional |
| `/notifications`| User alerts, tips, mentions | RSC + Realtime | Authenticated | Functional |
| `/settings` | Profile, privacy & language preferences| Client / Form Actions | Authenticated | Functional |

---

## 3. Frontend Recommendations & Fix Plan

1. **Immediate P0 Action:** Remediate all import paths (`'next/cache'`) and TypeScript signature alignments across `apps/web/src/lib/*/actions.ts` and `apps/web/src/app/*/page.tsx`.
2. **Component Library Integration:** Replace ad-hoc HTML buttons with `<Button>`, `<Card>`, `<Badge>`, and `<Avatar>` from `@caribbean/ui`.
3. **Empty/Loading Skeletons:** Ensure every dynamic route has corresponding `loading.tsx` skeletons and robust `error.tsx` error boundaries.
