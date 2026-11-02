# Phase 5 Design Specification: Messaging, Realtime Presence & Diaspora Communities

**Date:** 2026-11-01  
**Author:** Antigravity Architect (Autonomous Agent)  
**Governance:** TUKUBI Engineering Governance (`AGENTS.md`), Rule 1 (Inspect Before Modifying), Rule 8 (Privacy of Identity).

---

## 1. Problem Statement & Architecture Goals
Messaging and Diaspora Communities are the cultural connective tissue of TUKUBI:
1. **Realtime Peer Presence & Typing Authenticity:**
   - Realtime typing broadcasts must transmit authenticated display names (`userName: currentUserName || peerName`) rather than anonymous hardcoded `'User'` placeholders.
   - Live presence must debounce smoothly without state thrashing.
2. **Community Governance & Hierarchy Invariants:**
   - Role hierarchy: `owner` (rank 4) > `admin` (rank 3) > `moderator` (rank 2) > `member` (rank 1).
   - Permission expansion: `'pin_post'`, `'transfer_ownership'`, `'edit_settings'`, `'manage_roles'`.
   - Owners cannot be removed or demoted by non-owners; only owners can transfer ownership.
3. **Conversational Commerce & Card Verification:**
   - Type-safe validator guards for in-chat contextual cards (`ProductContextPayload`, `OrderContextPayload`, `EventContextPayload`).

---

## 2. Core Subsystems & Components

### 2.1 Community Governance Policy Engine (`packages/communities/src/index.ts`)
- Modernized `CommunityPermission`: adds `'pin_post'`, `'transfer_ownership'`.
- Role capabilities:
  - `owner`: full suite including `'transfer_ownership'`.
  - `admin`: `'post'`, `'moderate'`, `'invite'`, `'edit_settings'`, `'remove_member'`, `'manage_roles'`, `'pin_post'`.
  - `moderator`: `'post'`, `'moderate'`, `'invite'`, `'remove_member'`, `'pin_post'`.
  - `member`: `'post'`.
- Hierarchy safety:
  - `canActOnActor(actor, target)` strictly blocks non-owners from acting on owners.
  - `canTransferOwnership(actor)` returns true only for active `owner`.

### 2.2 Messaging Identity & Realtime Typing (`apps/web/src/components/message-thread.tsx`)
- Accepts `currentUserName` prop and broadcasts authentic member display name in ephemeral typing events.

### 2.3 Conversational Context Guard Primitives (`packages/messaging/src/index.ts`)
- Validation helper functions for contextual commerce cards.

---

## 3. Verification & Safety Verification
- Unit test suite: `tests/messaging-communities-governance.test.ts`.
- Full monorepo typecheck: 31/31 packages clean.
- CI gate: 0 prohibited references.
