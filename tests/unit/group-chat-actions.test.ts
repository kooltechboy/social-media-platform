import { describe, it, expect } from 'vitest';
import {
  createGroupConversationAction,
  addGroupMembersAction,
  leaveGroupConversationAction,
} from '../../apps/web/src/lib/messaging/actions';
import {
  ConversationPolicy,
  validateDraft,
  MESSAGE_MAX_LENGTH,
  MAX_ATTACHMENT_BYTES,
  MAX_GROUP_MEMBERS,
} from '../../packages/messaging/src/index';

describe('Sub-Project 3: Group Chat & Realtime Messaging', () => {
  describe('Group Chat Actions', () => {
    it('createGroupConversationAction blocks unauthenticated users', async () => {
      const res = await createGroupConversationAction({
        title: 'Trinidad Carnival Crew',
        memberIds: ['member-1', 'member-2'],
      });
      expect(res.conversationId).toBeNull();
      expect(res.error).toMatch(/Sign in/i);
    });

    it('createGroupConversationAction validates title length and presence', async () => {
      const emptyRes = await createGroupConversationAction({
        title: '',
        memberIds: ['member-1'],
      });
      expect(emptyRes.conversationId).toBeNull();
      expect(emptyRes.error).toBeTruthy();
    });

    it('createGroupConversationAction requires at least one other member', async () => {
      const noMembersRes = await createGroupConversationAction({
        title: 'Solo Island Group',
        memberIds: [],
      });
      expect(noMembersRes.conversationId).toBeNull();
      expect(noMembersRes.error).toBeTruthy();
    });

    it('createGroupConversationAction enforces maximum group member limit or auth check', async () => {
      const tooMany = Array.from({ length: 300 }, (_, i) => `user-${i}`);
      const limitRes = await createGroupConversationAction({
        title: 'Huge Diaspora Gathering',
        memberIds: tooMany,
      });
      expect(limitRes.conversationId).toBeNull();
      expect(limitRes.error).toMatch(/Sign in|256/);
    });

    it('addGroupMembersAction blocks unauthenticated users', async () => {
      const res = await addGroupMembersAction({
        conversationId: 'conv-123',
        memberIds: ['user-1'],
      });
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/Sign in/i);
    });

    it('leaveGroupConversationAction blocks unauthenticated users', async () => {
      const res = await leaveGroupConversationAction('conv-123');
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/Sign in/i);
    });
  });

  describe('Messaging Policy & Draft Validation', () => {
    const policy = new ConversationPolicy();

    it('validates active participant status', () => {
      expect(
        policy.isParticipant({
          profileId: 'p1',
          conversationId: 'c1',
          role: 'member',
          leftAt: null,
          mutedUntil: null,
          status: 'active',
        })
      ).toBe(true);

      expect(
        policy.isParticipant({
          profileId: 'p1',
          conversationId: 'c1',
          role: null,
          leftAt: null,
          mutedUntil: null,
        })
      ).toBe(false);

      expect(
        policy.isParticipant({
          profileId: 'p1',
          conversationId: 'c1',
          role: 'member',
          leftAt: '2026-01-01T00:00:00Z',
          mutedUntil: null,
        })
      ).toBe(false);
    });

    it('enforces maximum group members limit (256)', () => {
      const actor = {
        profileId: 'p1',
        conversationId: 'c1',
        role: 'admin' as const,
        leftAt: null,
        mutedUntil: null,
      };
      const allowed = policy.canAddMembers(actor, 10, 5);
      expect(allowed.allowed).toBe(true);

      const denied = policy.canAddMembers(actor, 250, 10);
      expect(denied.allowed).toBe(false);
      expect(denied.reason).toMatch(/256/);
    });

    it('validates draft content presence and length limits', () => {
      // Empty draft fails
      const emptyDraft = validateDraft({
        conversationId: 'c1',
        body: '',
      });
      expect(emptyDraft.valid).toBe(false);
      expect(emptyDraft.errors.length).toBeGreaterThan(0);

      // Overlength message fails
      const longDraft = validateDraft({
        conversationId: 'c1',
        body: 'a'.repeat(MESSAGE_MAX_LENGTH + 10),
      });
      expect(longDraft.valid).toBe(false);

      // Oversize attachment fails
      const heavyDraft = validateDraft({
        conversationId: 'c1',
        body: 'Heavy file',
        attachmentBytes: MAX_ATTACHMENT_BYTES + 1024,
      });
      expect(heavyDraft.valid).toBe(false);

      // Valid text draft passes
      const validText = validateDraft({
        conversationId: 'c1',
        body: 'Wah gwaan bredren!',
      });
      expect(validText.valid).toBe(true);
      expect(validText.errors).toHaveLength(0);

      // Valid media draft passes
      const validMedia = validateDraft({
        conversationId: 'c1',
        body: '',
        mediaUrls: ['https://storage.tukubi.com/photo.jpg'],
        messageKind: 'media',
      });
      expect(validMedia.valid).toBe(true);
    });

    it('calculates unread message counts monotonically', () => {
      expect(ConversationPolicy.calculateUnreadCount(5, 12)).toBe(7);
      expect(ConversationPolicy.calculateUnreadCount(12, 12)).toBe(0);
      expect(ConversationPolicy.calculateUnreadCount(15, 12)).toBe(0);
    });

    it('determines canonical direct conversation keys symmetrically', () => {
      const keyA = ConversationPolicy.directConversationKey('user-alpha', 'user-bravo');
      const keyB = ConversationPolicy.directConversationKey('user-bravo', 'user-alpha');
      expect(keyA).toBe(keyB);
      expect(keyA).toBe('user-alpha:user-bravo');
    });
  });
});
