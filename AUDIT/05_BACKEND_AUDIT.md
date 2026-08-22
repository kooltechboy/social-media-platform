# 05 — BACKEND SERVICES & SERVER ACTIONS AUDIT

**Domain:** Server-Side Logic, Next.js Server Actions, Background Event Handling & Idempotency  
**Auditor:** Principal Backend Engineer  
**Status:** Good (Score: 82/100)

---

## 1. Server Actions Inventory & Audit

All write mutations across `apps/web` are executed via Next.js Server Actions (`'use server'`).

| Domain | Action File | Core Operations | Auth Validation | Revalidation Target | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Auth** | `src/lib/auth/actions.ts` | Sign In, Sign Up, Sign Out | Server session cookie | `/login`, `/` | Pass |
| **Social** | `src/lib/social/actions.ts` | Create Post, Like, Follow | `getCurrentUser()` | `/`, `/profile` | Fix import |
| **Communities**| `src/lib/communities/actions.ts` | Join, Leave, Create Community | `getCurrentUser()` | `/communities` | Fix type/policy |
| **Messaging** | `src/lib/messaging/actions.ts` | Send Message, Create Conv. | `getCurrentUser()` | `/messages` | Fix import |
| **Marketplace**| `src/lib/marketplace/actions.ts` | Create Order, Dispute | `getCurrentUser()` | `/marketplace` | Fix props |
| **Events** | `src/lib/events/actions.ts` | Create Event, RSVP | `getCurrentUser()` | `/events` | Fix import |
| **Podcasts** | `src/lib/podcasts/actions.ts` | Create Episode, Follow | `getCurrentUser()` | `/podcasts` | Fix builder |
| **Admin** | `src/lib/admin/actions.ts` | Set Feature Flag, Role Audit | Admin role check | `/admin` | Pass |
| **Moderation** | `src/lib/moderation/actions.ts` | Triage Case, Apply Sanction | Mod role check | `/moderation` | Pass |

---

## 2. Authorization & Middleware Boundary (`middleware.ts`)

- `apps/web/src/middleware.ts` intercepts protected routes (`/creator-studio`, `/spotpay`, `/settings`, `/messages`, `/admin`) and verifies Supabase auth session tokens.
- Unauthenticated requests to protected areas are redirected to `/login?next=...`.
- Client role spoofing is strictly prohibited; database RLS policies enforce tenant boundaries on all reads and writes.

---

## 3. Background Jobs & Webhooks

- Webhook signature verification and replay protection are defined in `@caribbean/spotpay` (`WebhookProcessor`).
- Idempotency keys are enforced for all monetary transactions and order creations.
- Automatic welcome message generation for new profiles is handled via PostgreSQL trigger (`supabase/migrations/00015_realtime_welcome.sql`).
