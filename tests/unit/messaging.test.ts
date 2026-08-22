import { describe, it, expect } from 'vitest';
import {
  ConversationPolicy,
  validateDraft,
  applyReadReceipt,
  MESSAGE_MAX_LENGTH,
  MAX_GROUP_MEMBERS,
} from '../../packages/messaging/src/index';

describe('Conversation policy', () => {
  const policy = new ConversationPolicy();
  const activeMember = {
    profileId: 'usr_1',
    conversationId: 'conv_1',
    role: 'member' as const,
    leftAt: null,
    mutedUntil: null,
  };

  it('recognizes active participants only', () => {
    expect(policy.isParticipant(activeMember)).toBe(true);
    expect(policy.isParticipant({ ...activeMember, leftAt: '2026-01-01T00:00:00Z' })).toBe(false);
    expect(policy.isParticipant({ ...activeMember, role: null })).toBe(false);
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

  it('caps group membership', () => {
    expect(policy.canAddMembers(activeMember, MAX_GROUP_MEMBERS - 1, 1).allowed).toBe(true);
    expect(policy.canAddMembers(activeMember, MAX_GROUP_MEMBERS, 1).allowed).toBe(false);
  });

  it('lets senders and admins delete, members not', () => {
    const admin = { ...activeMember, role: 'admin' as const };
    expect(policy.canDeleteMessage(activeMember, 'usr_1')).toBe(true);
    expect(policy.canDeleteMessage(admin, 'usr_2')).toBe(true);
    expect(policy.canDeleteMessage(activeMember, 'usr_2')).toBe(false);
  });

  it('derives a symmetric direct-conversation key', () => {
    expect(policy.directConversationKey('b', 'a')).toBe(policy.directConversationKey('a', 'b'));
  });
});

describe('Message drafts', () => {
  it('requires content or attachment and enforces limits', () => {
    expect(validateDraft({ senderId: 'u', conversationId: 'c', body: '   ', attachmentBytes: 0 }).valid).toBe(false);
    expect(validateDraft({ senderId: 'u', conversationId: 'c', body: '', attachmentBytes: 1024 }).valid).toBe(true);
    expect(
      validateDraft({ senderId: 'u', conversationId: 'c', body: 'x'.repeat(MESSAGE_MAX_LENGTH + 1), attachmentBytes: 0 }).valid,
    ).toBe(false);
    expect(
      validateDraft({ senderId: 'u', conversationId: 'c', body: 'hi', attachmentBytes: 30 * 1024 * 1024 }).errors[0],
    ).toContain('MB');
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
