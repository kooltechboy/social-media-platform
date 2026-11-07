# Sub-Project 3: Realtime Direct Messaging & Group Chat — Implementation Plan

> Spec: `docs/superpowers/specs/2026-11-07-realtime-messaging-group-chat-design.md`
> Branch: `feature/live-core-feed-and-composer` (continuing)

---

## Task 1: Group Chat Server Actions

**File**: `apps/web/src/lib/messaging/actions.ts`

**Add Functions**:
1. `createGroupConversationAction(params: { title: string; memberIds: string[]; category?: ConversationCategory })`
   - Validate auth, title length (1-100 chars), minimum members (at least 1 peer + creator).
   - Enforce MAX_GROUP_MEMBERS (256).
   - Insert into `conversations` with `kind: 'group'`, `title`, `created_by: user.id`.
   - Insert into `conversation_members` with creator (`role: 'admin'`) and peers (`role: 'member'`).
   - Insert initial system message with `message_kind: 'system'`.
   - Revalidate `/messages`.
   - Return `{ conversationId, error: null }`.
2. `addGroupMembersAction(params: { conversationId: string; memberIds: string[] })`
   - Check caller active membership and admin role (or policy).
   - Add new members up to limit.
3. `leaveGroupConversationAction(conversationId: string)`
   - Set `left_at = now()` on caller's membership row.

**Tests**: `tests/unit/group-chat-actions.test.ts`

---

## Task 2: Group Creation UI in NewMessageModal

**File**: `apps/web/src/components/messages/new-message-modal.tsx`
- Add mode toggle: `Direct Message` | `New Group`.
- In `New Group` mode:
  - Text input for Group Title.
  - Multi-select pills/checkboxes for selected members.
  - "Create Group ([count])" button.
  - Call `createGroupConversationAction`.
  - On success, redirect to `/messages?c=${conversationId}` and close modal.

---

## Task 3: Media Attachment Upload in MessageThread

**File**: `apps/web/src/components/message-thread.tsx`
- Add hidden file input with ref `fileInputRef` (`accept="image/*,video/*"`).
- Add Paperclip icon button next to emoji/bot/mic controls.
- When file selected:
  - Upload file to `post-media` Supabase storage bucket (`attachments/${user.id}/${conversationId}/${Date.now()}_filename`).
  - Submit `sendMessageAction` with `message_kind: 'media'`, `media_urls: [publicUrl]`, and body: `[Photo]` or `[Video]`.
- In message bubble renderer:
  - If `msg.message_kind === 'media'` or `msg.metadata?.media_urls?.length`:
    - Render image (`<img ... />`) or video (`<video ... />`) thumbnail with click-to-expand.

---

## Task 4: Unit Test Suite for Messaging & Groups

**File**: `tests/unit/group-chat-actions.test.ts`
- `createGroupConversationAction` blocks unauthenticated users.
- `createGroupConversationAction` requires non-empty title.
- `createGroupConversationAction` enforces member limits.
- `addGroupMembersAction` requires auth.
- `leaveGroupConversationAction` requires auth.

---

## Task 5: Zero-Mock Audit & Monorepo Typecheck

- Run `node scripts/audit-zero-mock.js`.
- Run vitest on all 11 test suites.
- Run `pnpm.cmd typecheck` (31/31 packages).
- Commit all changes.
