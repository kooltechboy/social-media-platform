import { describe, it, expect } from 'vitest';
import {
  ConversationPolicy,
  validateDraft,
  validateContextCardPayload,
  buildBusinessAiSystemPrompt,
  generateClientMessageId,
  type MessageDraft,
  type ProductContextPayload,
  type OrderContextPayload,
  type EventContextPayload,
  type LivestreamContextPayload,
  type StoreContextPayload,
  type CommunityContextPayload,
  type ProfileContextPayload,
} from '../../packages/messaging/src/index';
import { checkMessageRateLimit } from '../../apps/web/src/lib/messaging/rate-limiter';

describe('TUKUBI Connect — Conversational Commerce & Messaging Architecture', () => {
  const policy = new ConversationPolicy();

  const mockUserMember = {
    profileId: 'usr_caribbean_buyer_123',
    conversationId: 'conv_commerce_001',
    role: 'member' as const,
    leftAt: null,
    mutedUntil: null,
    status: 'active' as const,
  };

  describe('1. Rich Context Cards & Commerce Payload Validation', () => {
    it('validates a complete Product Context Card', () => {
      const productPayload: ProductContextPayload = {
        productId: 'prod_shirt_789',
        title: 'Dominican Heritage Coral Shirt',
        priceMinor: 4500, // $45.00
        currency: 'USD',
        sellerId: 'usr_seller_456',
        sellerName: 'Island Threads Santo Domingo',
        imageUrl: 'https://cdn.tukubi.caribbean/products/shirt.png',
        sku: 'DOM-SHIRT-001',
        listingUrl: '/marketplace/prod_shirt_789',
        isAvailable: true,
        inventoryCount: 12,
      };

      const isValid = validateContextCardPayload('product', { product: productPayload });
      expect(isValid).toBe(true);

      const draft: MessageDraft = {
        senderId: mockUserMember.profileId,
        conversationId: mockUserMember.conversationId,
        body: 'Is this available for pickup in Santo Domingo tomorrow?',
        messageKind: 'product',
        metadata: { product: productPayload },
      };

      const validation = validateDraft(draft);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('validates an Order Context Card with fulfillment mode', () => {
      const orderPayload: OrderContextPayload = {
        orderId: 'ord_tkb_10482',
        orderNumber: 'TKB-10482',
        totalMinor: 12000,
        currency: 'USD',
        status: 'processing',
        itemsCount: 2,
        itemsSummary: 'Handmade Dominican Cigar Humidor + Heritage Lighter',
        buyerId: 'usr_caribbean_buyer_123',
        sellerId: 'usr_seller_456',
        fulfillmentType: 'shipping',
        orderUrl: '/account/orders/ord_tkb_10482',
      };

      expect(validateContextCardPayload('order', { order: orderPayload })).toBe(true);
    });

    it('validates an Event Context Card', () => {
      const eventPayload: EventContextPayload = {
        eventId: 'evt_music_fest_2026',
        title: 'Caribbean Music & Heritage Festival',
        startDate: '2026-09-20T18:00:00Z',
        location: 'Santo Domingo Malecón',
        islandCountry: 'Dominican Republic',
        organizerName: 'CaribVibes Live',
        coverUrl: 'https://cdn.tukubi.caribbean/events/musicfest.png',
        ticketPriceMinor: 2500,
        currency: 'USD',
        eventUrl: '/events/evt_music_fest_2026',
      };

      expect(validateContextCardPayload('event', { event: eventPayload })).toBe(true);
    });

    it('validates a Livestream Context Card', () => {
      const livePayload: LivestreamContextPayload = {
        streamId: 'stream_caribbean_biz_live',
        title: 'Caribbean Diaspora Business Talk & Pitch Night',
        hostName: 'Chef & Founder Andre Campbell',
        isLive: true,
        peakViewers: 342,
        streamUrl: '/live/stream_caribbean_biz_live',
      };

      expect(validateContextCardPayload('livestream', { livestream: livePayload })).toBe(true);
    });

    it('validates Store and Community Context Cards', () => {
      const storePayload: StoreContextPayload = {
        storeId: 'store_island_roots',
        storeSlug: 'island-roots',
        name: 'Island Roots Kingston',
        category: 'Artisanal & Coffee',
        rating: 4.9,
        islandCountry: 'Jamaica',
        storeUrl: '/store/island-roots',
      };

      const communityPayload: CommunityContextPayload = {
        communityId: 'comm_diaspora_toronto',
        slug: 'caribbean-toronto',
        name: 'Caribbean Community in Toronto & GTA',
        memberCount: 1420,
        islandCountry: 'Canada / Diaspora',
        communityUrl: '/c/caribbean-toronto',
      };

      expect(validateContextCardPayload('store', { store: storePayload })).toBe(true);
      expect(validateContextCardPayload('community', { community: communityPayload })).toBe(true);
    });
  });

  describe('2. AI Business Agent & Grounded Prompt Architecture', () => {
    it('constructs grounded system prompt with catalog inventory constraints', () => {
      const prompt = buildBusinessAiSystemPrompt({
        businessName: 'Kingston Blue Mountain Coffee Co.',
        category: 'Food & Beverage / Coffee',
        catalogItems: [
          { id: 'prod_1', title: 'Grade 1 Blue Mountain Whole Bean 1lb', priceFormatted: '$39.99 USD', available: true },
          { id: 'prod_2', title: 'Peaberry Reserve Whole Bean 1lb', priceFormatted: '$49.99 USD', available: false },
        ],
        policy: {
          returns: '30-day freshness guarantee on unopened beans.',
          shipping: 'Ships to US, Canada, UK, and Caribbean islands in 2-4 days.',
          pickup: 'Kingston store pickup available 9am-5pm.',
        },
        userQuery: 'Do you have Grade 1 coffee available?',
      });

      expect(prompt).toContain('Kingston Blue Mountain Coffee Co.');
      expect(prompt).toContain('Grade 1 Blue Mountain Whole Bean 1lb ($39.99 USD) [In Stock]');
      expect(prompt).toContain('Peaberry Reserve Whole Bean 1lb ($49.99 USD) [Out of Stock]');
      expect(prompt).toContain('NEVER invent prices, stock numbers, or store policies');
      expect(prompt).toContain('hospitality and cultural respect');
    });
  });

  describe('3. Idempotency & Unique Client Identifier Generation', () => {
    it('generates collision-free client message IDs for offline send queue', () => {
      const generatedIds = new Set<string>();
      for (let i = 0; i < 500; i++) {
        const id = generateClientMessageId();
        expect(generatedIds.has(id)).toBe(false);
        generatedIds.add(id);
      }
      expect(generatedIds.size).toBe(500);
    });
  });

  describe('4. Anti-Spam Rate Limiting & Burst Protection', () => {
    it('protects against automated messaging flood attacks', () => {
      const testUserId = 'usr_spam_tester_' + Date.now();
      
      // Send allowed messages
      for (let i = 0; i < 15; i++) {
        const check = checkMessageRateLimit(testUserId, { capacity: 15, refillRate: 2 });
        expect(check.allowed).toBe(true);
      }

      // Exceeded limit
      const blockedCheck = checkMessageRateLimit(testUserId, { capacity: 15, refillRate: 2 });
      expect(blockedCheck.allowed).toBe(false);
      expect(blockedCheck.retryAfterSec).toBeGreaterThanOrEqual(1);
    });
  });

  describe('5. Unread Monotonic Sequence Calculation', () => {
    it('accurately calculates unread delta with O(1) complexity', () => {
      expect(policy.calculateUnreadCount(40, 52)).toBe(12);
      expect(policy.calculateUnreadCount(52, 52)).toBe(0);
      expect(policy.calculateUnreadCount(60, 52)).toBe(0);
    });
  });
});
