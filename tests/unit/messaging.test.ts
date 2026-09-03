import { describe, it, expect } from 'vitest';
import {
  ConversationPolicy,
  validateDraft,
  applyReadReceipt,
  generateClientMessageId,
  MESSAGE_MAX_LENGTH,
  MAX_GROUP_MEMBERS,
  MAX_EDIT_TIME_WINDOW_MINUTES,
} from '../../packages/messaging/src/index';

describe('Conversation policy & Permissions', () => {
  const policy = new ConversationPolicy();
  const activeMember = {
    profileId: 'usr_1',
    conversationId: 'conv_1',
    role: 'member' as const,
    leftAt: null,
    mutedUntil: null,
    status: 'active' as const,
  };

  it('recognizes active participants only', () => {
    expect(policy.isParticipant(activeMember)).toBe(true);
    expect(policy.isParticipant({ ...activeMember, leftAt: '2026-01-01T00:00:00Z' })).toBe(false);
    expect(policy.isParticipant({ ...activeMember, role: null })).toBe(false);
    expect(policy.isParticipant({ ...activeMember, status: 'blocked' })).toBe(false);
  });

  it('permits member sends within message limits', () => {
    const result = policy.canSend(activeMember, {
      senderId: 'usr_1', conversationId: 'conv_1', body: 'Wah gwaan?', attachmentBytes: 0,
    });
    expect(result.valid).toBe(true);
  });

  it('blocks departed members from sending', () => {
    const result = policy.canSend({ ...activeMember, leftAt: '2026-01-01T00:00:00Z' }, {
      senderId: 'usr_1', conversationId: 'conv_1', body: 'hello', attachmentBytes: 0,
    });
    expect(result.valid).toBe(false);
  });

  it('blocks sending if user block is active', () => {
    const result = policy.canSend(activeMember, {
      senderId: 'usr_1', conversationId: 'conv_1', body: 'hello', attachmentBytes: 0,
    }, true);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('block settings');
  });

  it('caps group membership at 256', () => {
    expect(policy.canAddMembers(activeMember, MAX_GROUP_MEMBERS - 1, 1).allowed).toBe(true);
    expect(policy.canAddMembers(activeMember, MAX_GROUP_MEMBERS, 1).allowed).toBe(false);
  });

  it('lets senders and admins delete, members not', () => {
    const admin = { ...activeMember, role: 'admin' as const };
    expect(policy.canDeleteMessage(activeMember, 'usr_1')).toBe(true);
    expect(policy.canDeleteMessage(admin, 'usr_2')).toBe(true);
    expect(policy.canDeleteMessage(activeMember, 'usr_2')).toBe(false);
  });

  it('enforces editing window and ownership', () => {
    const recentTime = new Date(Date.now() - 5 * 60 * 1000).toISOString(); // 5 min ago
    const oldTime = new Date(Date.now() - 30 * 60 * 1000).toISOString(); // 30 min ago

    expect(policy.canEditMessage(activeMember, 'usr_1', recentTime).allowed).toBe(true);
    expect(policy.canEditMessage(activeMember, 'usr_2', recentTime).allowed).toBe(false);
    expect(policy.canEditMessage(activeMember, 'usr_1', oldTime).allowed).toBe(false);
  });

  it('derives a symmetric direct-conversation key', () => {
    expect(policy.directConversationKey('user_b', 'user_a')).toBe(policy.directConversationKey('user_a', 'user_b'));
    expect(policy.directConversationKey('uuid-2', 'uuid-1')).toBe('uuid-1:uuid-2');
  });

  it('calculates unread count based on monotonic sequences', () => {
    expect(policy.calculateUnreadCount(10, 15)).toBe(5);
    expect(policy.calculateUnreadCount(20, 20)).toBe(0);
    expect(policy.calculateUnreadCount(25, 20)).toBe(0);
  });
});

describe('Message drafts & Voice notes', () => {
  it('requires text or voice/attachment', () => {
    expect(validateDraft({ senderId: 'u', conversationId: 'c', body: '   ', attachmentBytes: 0 }).valid).toBe(false);
    expect(validateDraft({ senderId: 'u', conversationId: 'c', body: '', attachmentBytes: 1024 }).valid).toBe(true);
    expect(validateDraft({ senderId: 'u', conversationId: 'c', body: '', audioUrl: 'blob:http://localhost/voice' }).valid).toBe(true);
  });

  it('enforces maximum character length', () => {
    expect(
      validateDraft({ senderId: 'u', conversationId: 'c', body: 'x'.repeat(MESSAGE_MAX_LENGTH + 1), attachmentBytes: 0 }).valid,
    ).toBe(false);
  });

  it('generates unique client message IDs for idempotency', () => {
    const id1 = generateClientMessageId();
    const id2 = generateClientMessageId();
    expect(id1).not.toBe(id2);
    expect(id1).toMatch(/^msg_\d+_/);
  });
});

describe('Read receipts', () => {
  it('applies read receipts idempotently', () => {
    const receipt = { messageId: 'm_1', profileId: 'usr_1', deliveredAt: null, readAt: null };
    const first = applyReadReceipt(receipt, '2026-08-20T10:00:00Z');
    expect(first.deliveredAt).toBe('2026-08-20T10:00:00Z');
    const second = applyReadReceipt(first, '2026-08-20T11:00:00Z');
    expect(second.readAt).toBe('2026-08-20T10:00:00Z');
  });
});
