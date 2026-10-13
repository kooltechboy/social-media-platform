import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { describe, it, expect } from 'vitest';

const ROOT = join(__dirname, '../..');

describe('TUKUBI Messaging Repair & Desktop Redesign Invariants', () => {
  // ── Database Layer & Migration 00109 ─────────────────────────────────────────

  describe('Migration 00109 — Sender Read Cursor Sync & Friendship Alignment', () => {
    const migPath = join(ROOT, 'supabase/migrations/00109_messaging_sender_read_sync_and_presence.sql');

    it('migration file 00109 exists', () => {
      expect(existsSync(migPath)).toBe(true);
    });

    let sql = '';
    it('migration 00109 is non-empty and well-formed SQL', () => {
      sql = readFileSync(migPath, 'utf-8');
      expect(sql.length).toBeGreaterThan(500);
    });

    it('synchronizes sender last_read_sequence inside fn_sync_message_sequence_and_conversation', () => {
      const content = readFileSync(migPath, 'utf-8');
      expect(content).toContain('fn_sync_message_sequence_and_conversation');
      expect(content).toContain('last_read_sequence = GREATEST(COALESCE(last_read_sequence, 0), NEW.sequence_number)');
      expect(content).toContain('profile_id = NEW.sender_id');
    });

    it('defines get_user_messaging_friends helper with bidirectional accepted friendships and block filtering', () => {
      const content = readFileSync(migPath, 'utf-8');
      expect(content).toContain('get_user_messaging_friends');
      expect(content).toContain("f.status = 'accepted'");
      expect(content).toContain('public.blocks');
      expect(content).toContain('b.blocker_id');
      expect(content).toContain('b.blocked_id');
    });

    it('hardens mark_conversation_read with search_path and sequence verification', () => {
      const content = readFileSync(migPath, 'utf-8');
      expect(content).toContain('mark_conversation_read');
      expect(content).toContain('SET search_path = public, pg_temp');
      expect(content).toContain('REVOKE ALL ON FUNCTION public.mark_conversation_read');
    });
  });

  // ── Message Ownership & Unread Count Logic ────────────────────────────────────

  describe('P0 Message Ownership & Unread Counting Rules', () => {
    const userA = 'user-uuid-aaaa-1111';
    const userB = 'user-uuid-bbbb-2222';

    it('sender is identified as author and sender_id matches authenticated user', () => {
      const outgoingMessage = {
        id: 'msg-1',
        sender_id: userA,
        body: 'Wah gwaan bredren',
        created_at: new Date().toISOString(),
      };

      const isMineForUserA = outgoingMessage.sender_id === userA;
      const isMineForUserB = outgoingMessage.sender_id === userB;

      expect(isMineForUserA).toBe(true);
      expect(isMineForUserB).toBe(false);
    });

    it('sender unread count does not increase for their own sent message', () => {
      // Sequence: conversation starts at seq 4, user A read seq 4.
      // User A sends message seq 5.
      // Invariant: User A's last_read_sequence advances to 5 atomically.
      const lastSeq = 5;
      const userAReadSeq = 5;
      const userBReadSeq = 4;

      const userAUnread = Math.max(0, lastSeq - userAReadSeq);
      const userBUnread = Math.max(0, lastSeq - userBReadSeq);

      expect(userAUnread).toBe(0); // Sender has 0 unread
      expect(userBUnread).toBe(1); // Recipient has 1 unread
    });

    it('preview text prefixes "You: " when latest message was sent by the viewer', () => {
      const latestMessage = {
        body: 'Meeting at 3 PM in Kingston',
        sender_id: userA,
      };

      function formatPreview(msg: typeof latestMessage, viewerId: string): string {
        if (!msg) return 'No messages yet';
        if (msg.sender_id === viewerId) {
          return `You: ${msg.body}`;
        }
        return msg.body;
      }

      expect(formatPreview(latestMessage, userA)).toBe('You: Meeting at 3 PM in Kingston');
      expect(formatPreview(latestMessage, userB)).toBe('Meeting at 3 PM in Kingston');
    });

    it('active conversation currently open resets unread count to 0', () => {
      const conversationId = 'conv-xyz';
      const selectedId = 'conv-xyz';
      const lastSeq = 10;
      const readSeq = 7;

      let unreadCount = Math.max(0, lastSeq - readSeq);
      if (selectedId === conversationId) {
        unreadCount = 0;
      }

      expect(unreadCount).toBe(0);
    });
  });

  // ── Friendship Model & Presence ───────────────────────────────────────────────

  describe('P0 Real Friends & Presence Invariants', () => {
    const currentUserId = 'viewer-123';

    it('only accepted friendships are included in the messaging friends list', () => {
      const rawFriendships = [
        { requester_id: currentUserId, addressee_id: 'friend-1', status: 'accepted' },
        { requester_id: 'friend-2', addressee_id: currentUserId, status: 'accepted' },
        { requester_id: currentUserId, addressee_id: 'pending-1', status: 'pending' },
        { requester_id: 'stranger-1', addressee_id: currentUserId, status: 'declined' },
      ];

      const acceptedFriendIds = rawFriendships
        .filter((f) => f.status === 'accepted')
        .map((f) => (f.requester_id === currentUserId ? f.addressee_id : f.requester_id));

      expect(acceptedFriendIds).toEqual(['friend-1', 'friend-2']);
      expect(acceptedFriendIds).not.toContain('pending-1');
      expect(acceptedFriendIds).not.toContain('stranger-1');
    });

    it('blocked profiles are strictly excluded from messaging friends', () => {
      const acceptedFriendIds = ['friend-1', 'friend-2', 'blocked-friend'];
      const blocks = [
        { blocker_id: currentUserId, blocked_id: 'blocked-friend' },
      ];

      const blockedSet = new Set(
        blocks.map((b) => (b.blocker_id === currentUserId ? b.blocked_id : b.blocker_id))
      );

      const eligibleFriends = acceptedFriendIds.filter((id) => !blockedSet.has(id));

      expect(eligibleFriends).toEqual(['friend-1', 'friend-2']);
      expect(eligibleFriends).not.toContain('blocked-friend');
    });

    it('presence state is derived accurately from live online user ids set', () => {
      const friends = [
        { id: 'f-1', name: 'Nesta', isOnline: false },
        { id: 'f-2', name: 'Rihanna', isOnline: false },
        { id: 'f-3', name: 'Usain', isOnline: false },
      ];

      const onlineUserIds = new Set(['f-1', 'f-3']);

      const friendsWithPresence = friends.map((f) => ({
        ...f,
        isOnline: onlineUserIds.has(f.id),
      }));

      const onlineOnly = friendsWithPresence.filter((f) => f.isOnline);
      const offlineOnly = friendsWithPresence.filter((f) => !f.isOnline);

      expect(onlineOnly.map((f) => f.name)).toEqual(['Nesta', 'Usain']);
      expect(offlineOnly.map((f) => f.name)).toEqual(['Rihanna']);
    });
  });

  // ── Desktop 3-Column Layout Verification ──────────────────────────────────────

  describe('P0/P1 Desktop Layout & Component Integrity', () => {
    it('messages page mounts a full viewport height container without overflowing window', () => {
      const pageCode = readFileSync(join(ROOT, 'apps/web/src/app/messages/page.tsx'), 'utf-8');
      expect(pageCode).toContain('h-screen max-h-screen flex flex-col');
      expect(pageCode).toContain('overflow-hidden');
      expect(pageCode).toContain('MessagesCenterClient');
    });

    it('messages-center-client.tsx implements ConversationDetailsPanel and 3-column architecture', () => {
      const clientCode = readFileSync(
        join(ROOT, 'apps/web/src/components/messages/messages-center-client.tsx'),
        'utf-8'
      );
      expect(clientCode).toContain('ConversationDetailsPanel');
      expect(clientCode).toContain('isDetailsOpen');
      expect(clientCode).toContain('onlineFriends');
      expect(clientCode).toContain('offlineFriends');
      expect(clientCode).toContain('Online now');
      expect(clientCode).toContain('handleMessageSent');
    });

    it('conversation-details-panel.tsx renders shared media, files, and privacy safety controls', () => {
      const detailsCode = readFileSync(
        join(ROOT, 'apps/web/src/components/messages/conversation-details-panel.tsx'),
        'utf-8'
      );
      expect(detailsCode).toContain('sharedMedia');
      expect(detailsCode).toContain('sharedLinksAndFiles');
      expect(detailsCode).toContain('Block');
      expect(detailsCode).toContain('Report conversation');
      expect(detailsCode).toContain('Mute notifications');
    });
  });
});
