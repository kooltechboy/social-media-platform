# TUKUBI Messaging Ecosystem Hardening & Production Certification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Certify the entire TUKUBI messaging ecosystem for live production by delivering a hardened, deadlock-free canonical direct conversation RPC, optimal database RLS and foreign key indexing, seamless Meta-grade Friend/Member-to-Message entry points across Web discovery and friends centers, and an overhaul of the universal mobile chat screen with live sending and realtime updates.

**Architecture:** A multi-layered architecture combining database versioned SQL migrations (RLS subquery caching, full FK indexing, canonical symmetric pair RPC), Next.js 15 App Router server actions with idempotency and monotonic sequence ordering, unified web UI touchpoints, and an authenticated universal mobile client.

**Tech Stack:** PostgreSQL 15, Supabase, Next.js 15 App Router, React 19, Tailwind CSS v4, Expo React Native, Vitest, TypeScript 5.5.

**Spec:** `docs/superpowers/specs/2026-09-04-messaging-ecosystem-certification-design.md`

## Global Constraints
- Every database change must reside in a numbered migration file (`supabase/migrations/00056_messaging_production_hardening_and_indexes.sql`).
- Direct SQL modifications outside migrations are forbidden.
- Zero raw secrets or tokens in client-accessible code.
- All RLS policies must wrap `auth.uid()` in `(SELECT auth.uid())` for subquery caching.
- Zero mock data or non-functional buttons on certified screens.
- All tests must pass with 0 errors, and TypeScript must compile with 0 errors.

---

### Task 1: Database Migration — RLS Subquery Caching, Foreign Key Indexes, and Canonical RPC Hardening

**Files:**
- Create: `supabase/migrations/00056_messaging_production_hardening_and_indexes.sql`
- Test: `tests/unit/messaging-db-hardening.test.ts`

**Interfaces:**
- Produces:
  - Stored Procedure: `public.get_or_create_direct_conversation(target_user_id UUID) RETURNS UUID`
  - Indexes: `idx_conversations_created_by`, `idx_conversations_last_message_id`, `idx_conversation_members_last_read_msg`, `idx_messages_sender_id`, `idx_messages_reply_to_id`, `idx_message_reactions_profile_id`, `idx_message_requests_conversation`
  - RLS Policies: Optimized with `(SELECT auth.uid())` across all 7 messaging tables

- [ ] **Step 1: Write the failing database migration test**
Create `tests/unit/messaging-db-hardening.test.ts` to assert that:
1. Migration `00056_messaging_production_hardening_and_indexes.sql` exists and parses cleanly.
2. Contains all 7 foreign key index definitions.
3. Contains RLS policies with `(SELECT auth.uid())`.
4. Contains hardened `get_or_create_direct_conversation` with bidirectional active status updates and `REVOKE ... FROM PUBLIC, anon`.

- [ ] **Step 2: Run test to verify it fails**
Run: `pnpm vitest run tests/unit/messaging-db-hardening.test.ts`
Expected: FAIL (file does not exist).

- [ ] **Step 3: Implement Migration 00056**
Write `supabase/migrations/00056_messaging_production_hardening_and_indexes.sql` with:
1. All missing foreign key indexes using `CREATE INDEX IF NOT EXISTS`.
2. Updated RLS policies wrapping `auth.uid()` in `(SELECT auth.uid())`.
3. Complete bidirectional reactivation and error handling inside `get_or_create_direct_conversation`.
4. Strict execute grants (`REVOKE ALL ... FROM PUBLIC, anon; GRANT EXECUTE TO authenticated, service_role`).

- [ ] **Step 4: Run test to verify it passes**
Run: `pnpm vitest run tests/unit/messaging-db-hardening.test.ts`
Expected: PASS.

---

### Task 2: Web Discovery & Social Touchpoints — Unified Friend/Member → Message Actions

**Files:**
- Modify: `apps/web/src/components/members/members-directory-client.tsx`
- Modify: `apps/web/src/components/search/social-search-client.tsx`
- Modify: `apps/web/src/components/friends/friends-center-client.tsx`
- Test: `tests/unit/messaging-touchpoints.test.ts`

**Interfaces:**
- Consumes: `getOrCreateDirectConversationAction` from `apps/web/src/lib/messaging/actions.ts`
- Produces: Direct "Message" buttons on member cards linking to `/messages?u=${username}` across all directory, search, and friend tabs.

- [ ] **Step 1: Write failing touchpoints test**
Create `tests/unit/messaging-touchpoints.test.ts` verifying that:
1. `members-directory-client.tsx` renders Message action button for members.
2. `social-search-client.tsx` renders Message action button for search results.
3. `friends-center-client.tsx` renders Message action button across all tabs (Friends, PYMK, Following, Followers).

- [ ] **Step 2: Run test to verify it fails**
Run: `pnpm vitest run tests/unit/messaging-touchpoints.test.ts`
Expected: FAIL.

- [ ] **Step 3: Update Web Components**
1. In `apps/web/src/components/members/members-directory-client.tsx`: Add a responsive, branded "Message" button alongside Friend/Follow buttons.
2. In `apps/web/src/components/search/social-search-client.tsx`: Add "Message" button to people and creator cards.
3. In `apps/web/src/components/friends/friends-center-client.tsx`: Add "Message" button across PYMK, Following, Followers, and Requests tabs.

- [ ] **Step 4: Run test to verify it passes**
Run: `pnpm vitest run tests/unit/messaging-touchpoints.test.ts`
Expected: PASS.

---

### Task 3: Universal Mobile Messaging Screen Overhaul (`apps/mobile`)

**Files:**
- Modify: `apps/mobile/src/screens/MessagesScreen.tsx`
- Test: `tests/unit/mobile-messaging-screen.test.ts`

**Interfaces:**
- Consumes: Supabase client `supabase` from `apps/mobile/src/lib/supabase.ts`
- Produces:
  - Dual-mode screen: Conversation list vs Active thread view.
  - Live message rendering with bubble styling.
  - Active text composer that performs real database insert with `client_message_id`.
  - Realtime subscription on `conversation:{id}:messages`.
  - Background read status synchronization via `mark_conversation_read`.

- [ ] **Step 1: Write failing test for mobile messaging screen**
Create `tests/unit/mobile-messaging-screen.test.ts` verifying:
1. Active thread selection logic.
2. Monotonic sequence and unread calculation.
3. Send message payload structure with client message ID.

- [ ] **Step 2: Run test to verify it fails**
Run: `pnpm vitest run tests/unit/mobile-messaging-screen.test.ts`
Expected: FAIL.

- [ ] **Step 3: Overhaul `MessagesScreen.tsx`**
Implement the live dual-mode screen in `apps/mobile/src/screens/MessagesScreen.tsx`:
1. Conversation list with avatars, names, unread badges, timestamps.
2. Active thread view with Back button, message bubbles (sent vs received), timestamps.
3. Real database message insertion with monotonic sequence trigger compatibility.
4. Optimistic UI update and real-time subscription.
5. Empty and loading states matching Caribbean Futurism design tokens.

- [ ] **Step 4: Run test to verify it passes**
Run: `pnpm vitest run tests/unit/mobile-messaging-screen.test.ts`
Expected: PASS.

---

### Task 4: Master Production Certification & Regression Verification

**Files:**
- Create: `tests/unit/messaging-production-certification.test.ts`
- Audit Doc Update: `AUDIT/27_MESSAGING_V2_PRODUCTION_CERTIFICATION.md`

- [ ] **Step 1: Write master certification test suite**
Create `tests/unit/messaging-production-certification.test.ts` validating:
1. End-to-end conversation creation invariants (symmetry, block checks, self-exclusion).
2. Idempotency key generation and deduplication.
3. RLS policy structure and search path security.
4. Foreign key index presence.
5. Touchpoint link integrity.

- [ ] **Step 2: Run all test suites**
Run: `pnpm vitest run`
Expected: 100% test files PASS.

- [ ] **Step 3: Run monorepo typecheck**
Run: `pnpm typecheck` or workspace `tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 4: Update Audit Certification Documentation**
Update `AUDIT/27_MESSAGING_V2_PRODUCTION_CERTIFICATION.md` with final verification evidence and sign-off.
