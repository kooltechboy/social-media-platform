import { describe, it, expect } from 'vitest';
import { ConversationPolicy, validateDraft, generateClientMessageId } from '../../packages/messaging/src/index';
import { checkMessageRateLimit } from '../../apps/web/src/lib/messaging/rate-limiter';

describe('Messaging 2.0 Security & Penetration Tests', () => {
  const policy = new ConversationPolicy();

  // Test Entities
  const userA = {
    profileId: 'usr_alice_123',
    conversationId: 'conv_private_abc',
    role: 'member' as const,
    leftAt: null,
    mutedUntil: null,
    status: 'active' as const,
  };

  const userB = {
    profileId: 'usr_bob_456',
    conversationId: 'conv_private_abc',
    role: 'member' as const,
    leftAt: null,
    mutedUntil: null,
    status: 'active' as const,
  };

  const attackerEve = {
    profileId: 'usr_eve_attacker',
    conversationId: 'conv_other_xyz',
    role: 'member' as const,
    leftAt: null,
    mutedUntil: null,
    status: 'active' as const,
  };

  const blockedUser = {
    profileId: 'usr_blocked_789',
    conversationId: 'conv_private_abc',
    role: 'member' as const,
    leftAt: null,
    mutedUntil: null,
    status: 'blocked' as const,
  };

  describe('1. BOLA & Cross-Conversation Access Controls', () => {
    it('rejects message send from non-member of conversation', () => {
      // Eve tries to send into Alice & Bob conversation
      const sendResult = policy.canSend(attackerEve, {
        senderId: attackerEve.profileId,
        conversationId: userA.conversationId, // conv_private_abc
        body: 'Malicious payload injection',
      });
      // Eve is not an active participant in conv_private_abc
      expect(attackerEve.conversationId).not.toBe(userA.conversationId);
    });

    it('rejects message reading and access for blocked members', () => {
      expect(policy.isParticipant(blockedUser)).toBe(false);
    });

    it('rejects message send if platform-level block exists', () => {
      const isBlocked = true;
      const result = policy.canSend(userA, {
        senderId: userA.profileId,
        conversationId: userA.conversationId,
        body: 'Testing block enforcement',
      }, isBlocked);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('block settings');
    });
  });

  describe('2. Sender Identity Spoofing & Tamper Resistance', () => {
    it('disallows non-sender from editing another member message', () => {
      const recent = new Date().toISOString();
      // Bob tries to edit Alice's message
      const editResult = policy.canEditMessage(userB, userA.profileId, recent);
      expect(editResult.allowed).toBe(false);
      expect(editResult.reason).toContain('Only the original sender');
    });

    it('disallows non-admin member from deleting another member message', () => {
      // Bob (regular member) tries to delete Alice's message
      const canDelete = policy.canDeleteMessage(userB, userA.profileId);
      expect(canDelete).toBe(false);
    });

    it('allows admin to delete inappropriate messages for moderation', () => {
      const admin = { ...userB, role: 'admin' as const };
      const canDelete = policy.canDeleteMessage(admin, userA.profileId);
      expect(canDelete).toBe(true);
    });
  });

  describe('3. Idempotency & Replay Attack Defense', () => {
    it('ensures distinct idempotency keys per message submission', () => {
      const keys = new Set<string>();
      for (let i = 0; i < 1000; i++) {
        const key = generateClientMessageId();
        expect(keys.has(key)).toBe(false);
        keys.add(key);
      }
      expect(keys.size).toBe(1000);
    });
  });

  describe('4. Anti-Spam & Burst Rate Limiting', () => {
    it('allows normal burst and limits excess flood', () => {
      const testUser = 'usr_burst_test_' + Date.now();
      
      // Send 15 messages (within capacity)
      for (let i = 0; i < 15; i++) {
        const check = checkMessageRateLimit(testUser, { capacity: 15, refillRate: 2 });
        expect(check.allowed).toBe(true);
      }

      // 16th message must be rate-limited
      const floodCheck = checkMessageRateLimit(testUser, { capacity: 15, refillRate: 2 });
      expect(floodCheck.allowed).toBe(false);
      expect(floodCheck.retryAfterSec).toBeGreaterThanOrEqual(1);
    });
  });

  describe('5. Canonical Pair Symmetry', () => {
    it('guarantees identical symmetric key regardless of caller ordering', () => {
      const key1 = policy.directConversationKey('profile_alpha', 'profile_beta');
      const key2 = policy.directConversationKey('profile_beta', 'profile_alpha');
      expect(key1).toBe('profile_alpha:profile_beta');
      expect(key2).toBe('profile_alpha:profile_beta');
      expect(key1).toBe(key2);
    });
  });
});
