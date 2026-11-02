# Phase 5 Implementation Plan: Messaging, Realtime Presence & Diaspora Communities

**Date:** 2026-11-01  
**Author:** Antigravity Architect (Autonomous Agent)  
**Spec Reference:** `docs/superpowers/specs/2026-11-01-phase-5-messaging-communities-design.md`

---

## Task 1: Community Governance Policy & Role Invariants (TDD)
- **Files:**
  - Modify: `packages/communities/src/index.ts`
  - Test: `tests/messaging-communities-governance.test.ts`
- **Details:**
  - Add `'pin_post'` and `'transfer_ownership'` to `CommunityPermission`.
  - Add `admin` role and update `ROLE_CAPABILITIES` and `ROLE_HIERARCHY`.
  - Add `canTransferOwnership(actor)` method.

## Task 2: Conversational Commerce Card Validators (TDD)
- **Files:**
  - Modify: `packages/messaging/src/index.ts`
  - Test: `tests/messaging-communities-governance.test.ts`
- **Details:**
  - Implement `isValidProductContext` and `isValidOrderContext` runtime guards.

## Task 3: Realtime Typing Indicator Authentic Identity
- **Files:**
  - Modify: `apps/web/src/components/message-thread.tsx`
  - Modify: `apps/web/src/components/messages/messages-center-client.tsx`
- **Details:**
  - Pass `currentUserName` to `MessageThread`.
  - Broadcast sender's actual display name in ephemeral typing channel.

## Task 4: Full Quality Gate & Monorepo Verification
- Run Vitest for Phase 5: `pnpm.cmd test:unit tests/messaging-communities-governance.test.ts`.
- Run all messaging and community suites.
- Run monorepo typecheck: `pnpm.cmd typecheck` (31/31 packages).
- Run CI safety gate: `node scripts/ci/check-prohibited-references.js`.
