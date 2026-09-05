# Design Specification: TUKUBI Messaging Ecosystem Hardening & Production Certification

**Document ID:** SPEC-2026-09-04-MSG-01  
**Status:** PROPOSED (Pending User Review)  
**Target:** Live Production & Public Launch Readiness  
**Authors:** Joint Antigravity Principal Architect, Database Architect, AppSec & Mobile Leads  

---

## 1. Executive Context & Objective

TUKUBI is preparing for active public promotion and onboarding across the Caribbean Basin and global diaspora. The messaging subsystem must operate with zero defects, instant user delight, NASA-grade reliability, and Fortune-100 security.

This specification details the end-to-end architecture to:
1. Guarantee a canonical, atomic, deadlock-free server-side `get_or_create_direct_conversation` procedure.
2. Harden database query performance and Row Level Security (RLS) across all messaging tables with cached auth subqueries and complete foreign key index coverage.
3. Deliver a frictionless Facebook/Meta-standard "Friend/Member → Message" experience across all discovery, search, member directory, and social profile touchpoints on Web.
4. Upgrade the Universal Mobile Client (`apps/mobile`) from an interactive placeholder to a live, end-to-end authenticated messaging thread with real-time delivery and composer handling.
5. Provide automated test verification spanning unit, integration, RLS policy assertions, and TypeScript type-safety.

---

## 2. Architectural Blueprint

```
+-----------------------------------------------------------------------------------+
|                           CLIENT APPLICATION LAYER                                |
|                                                                                   |
|  [ Web Discovery & Social ]             [ Web Messages Hub ]     [ Universal Mobile ] |
|  - Member Directory (Message Btn)       - Multi-tab Inbox        - Live Conversation List |
|  - Social Search (Message Btn)          - Thread & Composer      - Live Chat Thread   |
|  - Friends Center (All tabs)            - Reactions & Voice      - Active Composer    |
|  - Profile Header (Message Btn)         - WebRTC HUD             - Realtime Updates   |
+------------------------------------+-----------------------------+----------------+
                                     |                             |
                                     v                             v
+-----------------------------------------------------------------------------------+
|                        APPLICATION / SERVER ACTIONS LAYER                         |
|                                                                                   |
|  `getOrCreateDirectConversationAction(targetUserId)`                              |
|  `sendMessageAction(formData)` (Idempotency, Rate Limit, Monotonic Seq)           |
|  `markConversationReadAction(convId, upToSequence)`                               |
|  `handleMessageRequestAction(convId, action)`                                     |
+------------------------------------+----------------------------------------------+
                                     |
                                     v
+-----------------------------------------------------------------------------------+
|                     POSTGRESQL DATABASE & RLS ENFORCEMENT LAYER                   |
|                                                                                   |
|  RPC: `public.get_or_create_direct_conversation(target_user_id UUID)`             |
|  Trigger: `trg_messages_before_insert_seq` (Monotonic Sequence Numbering)         |
|  Trigger: `trg_guard_message_update` (Sender-only content editing guard)          |
|  Optimized RLS: `(SELECT auth.uid())` cached lookups across all messaging tables  |
|  Indexes: Complete FK & sequence index coverage for O(1) reads & O(log N) inserts |
+-----------------------------------------------------------------------------------+
```

---

## 3. Database Layer: Migration `00056_messaging_production_hardening_and_indexes.sql`

### 3.1 Missing Foreign Key & Performance Index Coverage
Every relational foreign key and high-frequency filter column across messaging entities will be indexed:
1. `idx_conversations_created_by ON public.conversations(created_by)`
2. `idx_conversations_last_message_id ON public.conversations(last_message_id)`
3. `idx_conversation_members_last_read_msg ON public.conversation_members(last_read_message_id)`
4. `idx_messages_sender_id ON public.messages(sender_id)`
5. `idx_messages_reply_to_id ON public.messages(reply_to_id)`
6. `idx_message_reactions_profile_id ON public.message_reactions(profile_id)`
7. `idx_message_requests_conversation ON public.message_requests(conversation_id)`

### 3.2 High-Performance RLS Policies (Cached `(SELECT auth.uid())`)
Per Supabase production standards, all policies evaluating `auth.uid()` will wrap the lookup in `(SELECT auth.uid())`, allowing PostgreSQL to evaluate the function once per query rather than once per table row:
- `conversations`: `authenticated_members_read_conversations`, `authenticated_users_create_conversations`, `authenticated_admins_update_conversations`.
- `conversation_members`: `authenticated_members_read_memberships`, `authenticated_users_manage_own_membership`, `authenticated_members_update_own_membership`.
- `messages`: `authenticated_members_read_messages`, `authenticated_members_insert_messages`, `authenticated_senders_update_own_messages`, `authenticated_members_soft_delete_messages`, `authenticated_senders_delete_messages`.
- `message_reactions`: `authenticated_members_read_reactions`, `authenticated_members_insert_reactions`, `authenticated_users_delete_own_reactions`.
- `message_receipts`: `authenticated_members_read_receipts`, `authenticated_users_manage_own_receipts`.
- `message_requests`: `authenticated_users_read_message_requests`, `authenticated_users_create_message_requests`, `authenticated_receivers_update_message_requests`.

### 3.3 Hardened `get_or_create_direct_conversation`
The stored procedure will:
1. Validate authentication (`auth.uid() IS NOT NULL`).
2. Validate non-self target user (`current_uid != target_user_id`).
3. Validate target user exists in `public.profiles`.
4. Validate neither party has blocked the other in `public.blocks`.
5. Compute canonical lexicographic key (`min(uidA, uidB):max(uidA, uidB)`).
6. Perform lookup on existing `canonical_pair`.
7. If found:
   - Reactivate memberships for **both** caller and target (clearing `left_at`, setting status to `'active'`).
   - Return existing conversation ID.
8. If not found:
   - Insert new direct conversation with `canonical_pair` under a `unique_violation` exception block for concurrency safety.
   - Insert / upsert membership rows for both users with role `'member'` and status `'active'`.
   - Return newly created conversation ID.
9. Permissions:
   - `REVOKE ALL ON FUNCTION public.get_or_create_direct_conversation(UUID) FROM PUBLIC;`
   - `REVOKE ALL ON FUNCTION public.get_or_create_direct_conversation(UUID) FROM anon;`
   - `GRANT EXECUTE ON FUNCTION public.get_or_create_direct_conversation(UUID) TO authenticated;`
   - `GRANT EXECUTE ON FUNCTION public.get_or_create_direct_conversation(UUID) TO service_role;`

---

## 4. Web Application Layer: Unified Friend/Member → Message Experience

### 4.1 Touchpoint Audit & Enhancements
1. **Members Directory (`apps/web/src/components/members/members-directory-client.tsx`)**:
   - For all member cards, add a direct "Message" button alongside "Add Friend" / "Friends" and "Follow".
   - Links seamlessly to `/messages?u=${encodeURIComponent(member.username)}` or invokes `getOrCreateDirectConversationAction(member.id)`.
2. **Social Search (`apps/web/src/components/search/social-search-client.tsx`)**:
   - In member and creator search results cards, add a dedicated "Message" action button.
3. **Friends Center (`apps/web/src/components/friends/friends-center-client.tsx`)**:
   - Extend "Message" action across **all tabs**:
     - Friends Tab: Existing direct message button preserved and styled.
     - PYMK Tab (People You May Know): Add Message button next to "Add Friend".
     - Following Tab: Add Message button next to "Unfollow".
     - Followers Tab: Add Message button next to "Follow Back".
     - Requests Tab: Upon accepting an incoming friend request, provide an instant "Send Message" action.
4. **Online Friends Widget (`apps/web/src/components/online-friends-widget.tsx`)**:
   - Retain one-click direct chat routing with verified presence badges.

---

## 5. Mobile Application Layer: Universal React Native Messaging (`apps/mobile`)

### 5.1 `MessagesScreen.tsx` Complete Overhaul
- **Dual Mode UI**:
  - Mode 1: **Conversations Feed** (default) showing conversation avatar, display name, last message preview, timestamp, and unread sequence badge.
  - Mode 2: **Active Thread View** when a conversation is selected (or when navigating back via Back button).
- **Thread Capabilities**:
  - Live message list with bubble styling (sent by current user vs received).
  - Timestamp and sender name rendering.
  - Active text composer bar with Send button that performs live `supabase.from('messages').insert(...)` with `client_message_id` and monotonic sequence trigger handling.
  - Optimistic message insertion with immediate UI feedback.
  - Realtime subscription via `supabase.channel('conversation:' + convId + ':messages')` for incoming messages.
  - Mark conversation read via `supabase.rpc('mark_conversation_read', { conv_id: selectedId })`.

---

## 6. Testing & Quality Assurance Plan

1. **Unit & Logic Tests (`tests/unit/messaging-production-certification.test.ts`)**:
   - Test canonical pair generation symmetry and edge cases.
   - Test draft validation, client message ID generation, unread calculations.
   - Test rate limiter and block enforcement logic.
2. **Database Migration Tests (`tests/unit/messaging-db-hardening.test.ts`)**:
   - Verify all 7 foreign key indexes are created in migration SQL.
   - Verify all RLS policies contain `(SELECT auth.uid())`.
   - Verify `REVOKE ... FROM PUBLIC, anon` is present for RPC functions.
3. **TypeScript & Monorepo Build**:
   - `pnpm vitest run` with 100% test passing.
   - Monorepo typecheck validation (`pnpm typecheck`).
