import { describe, it, expect } from 'vitest';
import {
  ConversationPolicy,
  validateDraft,
  validateContextCardPayload,
  generateClientMessageId,
  MESSAGE_MAX_LENGTH,
  type MessageDraft,
  type MessageMetadata,
  type MessageKind,
} from '../../packages/messaging/src/index';

function resolveSelectedId(
  targetConversationId: string | null,
  paramC: string | undefined,
  conversationIds: string[],
  firstConversationId: string | null,
): string | null {
  return targetConversationId
    || (paramC && conversationIds.includes(paramC) ? paramC : null)
    || firstConversationId;
}

describe('TUKUBI Messaging P0 Recertification', () => {
  describe('selectedId resolution logic', () => {
    it('When RPC succeeds with ?u= param -> selectedId = returned conversation ID', () => {
      const result = resolveSelectedId('conv-rpc-123', undefined, ['conv-1', 'conv-2'], 'conv-1');
      expect(result).toBe('conv-rpc-123');
    });

    it('When RPC fails with ?u= param -> selectedId should fall through to first conversation (NOT null)', () => {
      const result = resolveSelectedId(null, undefined, ['conv-1', 'conv-2'], 'conv-1');
      expect(result).toBe('conv-1');
    });

    it('When ?c= param matches a known conversation -> selectedId = that ID', () => {
      const result = resolveSelectedId(null, 'conv-2', ['conv-1', 'conv-2'], 'conv-1');
      expect(result).toBe('conv-2');
    });

    it('When ?c= param doesnt match any conversation -> selectedId = first conversation', () => {
      const result = resolveSelectedId(null, 'conv-unknown', ['conv-1', 'conv-2'], 'conv-1');
      expect(result).toBe('conv-1');
    });

    it('When no params -> selectedId = first conversation', () => {
      const result = resolveSelectedId(null, undefined, ['conv-1', 'conv-2'], 'conv-1');
      expect(result).toBe('conv-1');
    });

    it('When no conversations exist -> selectedId = null', () => {
      const result = resolveSelectedId(null, undefined, [], null);
      expect(result).toBeNull();
    });
  });

  describe('Canonical pair key symmetry', () => {
    it('key(A, B) === key(B, A) for any A, B', () => {
      const userA = 'user_123';
      const userB = 'user_456';
      
      const key1 = ConversationPolicy.directConversationKey(userA, userB);
      const key2 = ConversationPolicy.directConversationKey(userB, userA);
      
      expect(key1).toBe(key2);
    });

    it('Format is min:max (lexicographic)', () => {
      const userA = 'aaa';
      const userB = 'bbb';
      
      const key = ConversationPolicy.directConversationKey(userB, userA); // intentionally flipped
      expect(key).toBe('aaa:bbb');
    });

    it('Works with real UUID-like strings', () => {
      const userA = '550e8400-e29b-41d4-a716-446655440000';
      const userB = '123e4567-e89b-12d3-a456-426614174000';
      
      const key = ConversationPolicy.directConversationKey(userA, userB);
      expect(key).toBe('123e4567-e89b-12d3-a456-426614174000:550e8400-e29b-41d4-a716-446655440000');
    });
  });

  describe('Context card validation', () => {
    it('Product card with valid data -> true', () => {
      const metadata: MessageMetadata = {
        product: {
          productId: 'prod_123',
          title: 'Cool Shirt',
          priceMinor: 1999,
          currency: 'USD',
          listingUrl: 'https://tukubi.com/products/prod_123',
        },
      };
      expect(validateContextCardPayload('product', metadata)).toBe(true);
    });

    it('Product card missing required fields -> false', () => {
      const metadata: MessageMetadata = {
        product: {
          productId: 'prod_123',
          // missing title and listingUrl
        } as any,
      };
      expect(validateContextCardPayload('product', metadata)).toBe(false);
    });

    it('Order card with valid data -> true', () => {
      const metadata: MessageMetadata = {
        order: {
          orderId: 'ord_123',
          orderNumber: 'TK-1001',
          totalMinor: 4500,
          currency: 'USD',
          status: 'shipped',
          orderUrl: 'https://tukubi.com/orders/ord_123',
        },
      };
      expect(validateContextCardPayload('order', metadata)).toBe(true);
    });

    it('Event card with valid data -> true', () => {
      const metadata: MessageMetadata = {
        event: {
          eventId: 'evt_123',
          title: 'Reggae Sunsplash',
          startDate: '2026-08-01',
          eventUrl: 'https://tukubi.com/events/evt_123',
        },
      };
      expect(validateContextCardPayload('event', metadata)).toBe(true);
    });

    it('Text kind with no metadata -> true (text doesnt need card)', () => {
      const metadata: MessageMetadata = {};
      expect(validateContextCardPayload('text', metadata)).toBe(true);
      expect(validateContextCardPayload('text', undefined)).toBe(false);
    });
  });

  describe('Draft validation', () => {
    it('Valid text message -> valid', () => {
      const draft: MessageDraft = {
        conversationId: 'conv_123',
        messageKind: 'text',
        body: 'Hello, world!',
      };
      expect(validateDraft(draft).valid).toBe(true);
    });

    it('Empty message with no media -> invalid', () => {
      const draft: MessageDraft = {
        conversationId: 'conv_123',
        messageKind: 'text',
        body: '',
      };
      expect(validateDraft(draft).valid).toBe(false);
    });

    it('Message exceeding MAX_LENGTH -> invalid', () => {
      const draft: MessageDraft = {
        conversationId: 'conv_123',
        messageKind: 'text',
        body: 'a'.repeat(MESSAGE_MAX_LENGTH + 1),
      };
      expect(validateDraft(draft).valid).toBe(false);
    });

    it('Voice message with audio_url -> valid', () => {
      const draft: MessageDraft = {
        conversationId: 'conv_123',
        messageKind: 'voice',
        body: '',
        audioUrl: 'https://example.com/audio.mp3',
      };
      expect(validateDraft(draft).valid).toBe(true);
    });
  });

  describe('Unread count calculation', () => {
    it('Normal case: latestSeq=10, readSeq=7 -> 3', () => {
      expect(ConversationPolicy.calculateUnreadCount(7, 10)).toBe(3);
    });

    it('No unreads: latestSeq=5, readSeq=5 -> 0', () => {
      expect(ConversationPolicy.calculateUnreadCount(5, 5)).toBe(0);
    });

    it('Never read: latestSeq=10, readSeq=0 -> 10', () => {
      expect(ConversationPolicy.calculateUnreadCount(0, 10)).toBe(10);
    });

    it('Edge case: readSeq > latestSeq -> 0 (never negative)', () => {
      expect(ConversationPolicy.calculateUnreadCount(15, 10)).toBe(0);
    });
  });

  describe('Client message ID generation', () => {
    it('Returns string starting with msg_', () => {
      const id = generateClientMessageId();
      expect(id.startsWith('msg_')).toBe(true);
    });

    it('Each call generates unique ID', () => {
      const id1 = generateClientMessageId();
      const id2 = generateClientMessageId();
      expect(id1).not.toBe(id2);
    });

    it('Contains timestamp component', () => {
      const id = generateClientMessageId();
      const parts = id.split('_');
      expect(parts.length).toBeGreaterThan(1);
      const timestamp = parseInt(parts[1], 10);
      expect(isNaN(timestamp)).toBe(false);
    });
  });
});
