import { describe, it, expect } from 'vitest';
import {
  MAX_TAGGED_PRODUCTS_PER_POST,
  MAX_TAGGED_PRODUCTS_PER_VIDEO,
  ESCROW_STATUS_METADATA,
  EscrowStatus,
  TaggedProductSummary,
  validateProductTags,
  canTransitionEscrow,
  formatProductPrice,
  parseTaggedProductIds,
  isShoppableContent,
} from '../packages/marketplace/src/tagging';
import type {
  StorefrontConfig,
  CreateStorefrontInput,
  UpdateStorefrontInput,
  StorefrontSection,
  ShoppablePostItem,
  ShoppableReelItem,
  OrderEscrowDetails,
} from '../apps/web/src/lib/commerce/types';

describe('Task 2: Marketplace Domain Extensions & Product Tagging Primitives', () => {
  describe('1. Tagging Constants & Limits', () => {
    it('enforces maximum 5 tagged products per feed post', () => {
      expect(MAX_TAGGED_PRODUCTS_PER_POST).toBe(5);
    });

    it('enforces maximum 5 tagged products per video/reel', () => {
      expect(MAX_TAGGED_PRODUCTS_PER_VIDEO).toBe(5);
    });
  });

  describe('2. Escrow Statuses and Metadata', () => {
    it('defines metadata for all 5 escrow statuses', () => {
      const expectedStatuses: EscrowStatus[] = ['held', 'releasing', 'released', 'refunded', 'disputed'];

      for (const status of expectedStatuses) {
        const meta = ESCROW_STATUS_METADATA[status];
        expect(meta).toBeDefined();
        expect(meta.label).toBeTruthy();
        expect(meta.description).toBeTruthy();
        expect(meta.color).toBeTruthy();
      }
    });

    it('has accurate escrow copy and color tokens matching Caribbean trust specifications', () => {
      expect(ESCROW_STATUS_METADATA.held.label).toBe('Held in Escrow');
      expect(ESCROW_STATUS_METADATA.held.color).toBe('amber');
      expect(ESCROW_STATUS_METADATA.held.description).toContain('30-Day Escrow Guarantee');

      expect(ESCROW_STATUS_METADATA.releasing.label).toBe('Releasing');
      expect(ESCROW_STATUS_METADATA.releasing.color).toBe('blue');
      expect(ESCROW_STATUS_METADATA.releasing.description).toContain('Delivery confirmed');

      expect(ESCROW_STATUS_METADATA.released.label).toBe('Settled to Seller');
      expect(ESCROW_STATUS_METADATA.released.color).toBe('emerald');
      expect(ESCROW_STATUS_METADATA.released.description).toContain('settled to merchant wallet');

      expect(ESCROW_STATUS_METADATA.refunded.label).toBe('Refunded to Buyer');
      expect(ESCROW_STATUS_METADATA.refunded.color).toBe('rose');
      expect(ESCROW_STATUS_METADATA.refunded.description).toContain('reversed to buyer payment method');

      expect(ESCROW_STATUS_METADATA.disputed.label).toBe('Under Mediation');
      expect(ESCROW_STATUS_METADATA.disputed.color).toBe('purple');
      expect(ESCROW_STATUS_METADATA.disputed.description).toContain('dispute resolution');
    });
  });

  describe('3. Escrow State Machine Transitions', () => {
    it('allows valid forward and mediation transitions', () => {
      // held -> releasing
      expect(canTransitionEscrow('held', 'releasing')).toBe(true);
      // releasing -> released
      expect(canTransitionEscrow('releasing', 'released')).toBe(true);
      // held -> refunded
      expect(canTransitionEscrow('held', 'refunded')).toBe(true);
      // held -> disputed
      expect(canTransitionEscrow('held', 'disputed')).toBe(true);
      // releasing -> disputed
      expect(canTransitionEscrow('releasing', 'disputed')).toBe(true);
      // disputed -> released
      expect(canTransitionEscrow('disputed', 'released')).toBe(true);
      // disputed -> refunded
      expect(canTransitionEscrow('disputed', 'refunded')).toBe(true);
    });

    it('rejects transitions from terminal states', () => {
      // released is terminal
      expect(canTransitionEscrow('released', 'held')).toBe(false);
      expect(canTransitionEscrow('released', 'releasing')).toBe(false);
      expect(canTransitionEscrow('released', 'refunded')).toBe(false);
      expect(canTransitionEscrow('released', 'disputed')).toBe(false);

      // refunded is terminal
      expect(canTransitionEscrow('refunded', 'held')).toBe(false);
      expect(canTransitionEscrow('refunded', 'releasing')).toBe(false);
      expect(canTransitionEscrow('refunded', 'released')).toBe(false);
      expect(canTransitionEscrow('refunded', 'disputed')).toBe(false);
    });

    it('rejects illegal jumps or self-transitions', () => {
      expect(canTransitionEscrow('held', 'held')).toBe(false);
      expect(canTransitionEscrow('releasing', 'releasing')).toBe(false);
      expect(canTransitionEscrow('releasing', 'held')).toBe(false);
      expect(canTransitionEscrow('disputed', 'held')).toBe(false);
    });
  });

  describe('4. Tagged Product Validation', () => {
    it('validates a valid set of product IDs', () => {
      const valid = ['prod-1', 'prod-2', 'prod-3'];
      const res = validateProductTags(valid);
      expect(res.isValid).toBe(true);
      expect(res.error).toBeUndefined();
    });

    it('validates empty product tags', () => {
      const res = validateProductTags([]);
      expect(res.isValid).toBe(true);
    });

    it('rejects more than 5 product tags', () => {
      const tooMany = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'];
      const res = validateProductTags(tooMany);
      expect(res.isValid).toBe(false);
      expect(res.error).toMatch(/Maximum 5/i);
    });

    it('rejects duplicate product tags', () => {
      const duplicates = ['prod-1', 'prod-2', 'prod-1'];
      const res = validateProductTags(duplicates);
      expect(res.isValid).toBe(false);
      expect(res.error).toMatch(/duplicate/i);
    });

    it('rejects empty or whitespace product IDs', () => {
      const invalid = ['prod-1', '  ', 'prod-3'];
      const res = validateProductTags(invalid);
      expect(res.isValid).toBe(false);
      expect(res.error).toMatch(/invalid/i);
    });
  });

  describe('5. Caribbean Currency & Price Formatting', () => {
    it('formats price in minor units to standard USD currency string', () => {
      expect(formatProductPrice(2500, 'USD')).toBe('$25.00');
      expect(formatProductPrice(1099, 'USD')).toBe('$10.99');
      expect(formatProductPrice(0, 'USD')).toBe('$0.00');
    });

    it('defaults currency to USD if omitted', () => {
      expect(formatProductPrice(4950)).toBe('$49.50');
    });

    it('formats non-USD Caribbean regional currencies', () => {
      const jmd = formatProductPrice(500000, 'JMD');
      expect(jmd).toContain('5,000.00');
    });
  });

  describe('6. Raw Tagged Product IDs Parsing', () => {
    it('parses string arrays and normalizes strings', () => {
      const parsed = parseTaggedProductIds([' prod-1 ', 'prod-2']);
      expect(parsed).toEqual(['prod-1', 'prod-2']);
    });

    it('parses JSON stringified arrays', () => {
      const parsed = parseTaggedProductIds('["prod-10", "prod-20"]');
      expect(parsed).toEqual(['prod-10', 'prod-20']);
    });

    it('parses comma-separated string lists', () => {
      const parsed = parseTaggedProductIds('prod-1, prod-2, prod-3');
      expect(parsed).toEqual(['prod-1', 'prod-2', 'prod-3']);
    });

    it('parses Postgres array format string', () => {
      const parsed = parseTaggedProductIds('{prod-a,prod-b,prod-c}');
      expect(parsed).toEqual(['prod-a', 'prod-b', 'prod-c']);
    });

    it('parses objects containing id fields', () => {
      const parsed = parseTaggedProductIds([{ id: 'p-1' }, { id: 'p-2' }]);
      expect(parsed).toEqual(['p-1', 'p-2']);
    });

    it('safely handles null, undefined, empty, or garbage input', () => {
      expect(parseTaggedProductIds(null)).toEqual([]);
      expect(parseTaggedProductIds(undefined)).toEqual([]);
      expect(parseTaggedProductIds('')).toEqual([]);
      expect(parseTaggedProductIds(12345)).toEqual([]);
      expect(parseTaggedProductIds({})).toEqual([]);
    });

    it('filters duplicates and empty values', () => {
      const parsed = parseTaggedProductIds(['prod-1', '', '  ', 'prod-1', 'prod-2']);
      expect(parsed).toEqual(['prod-1', 'prod-2']);
    });
  });

  describe('7. Shoppable Content Detection', () => {
    it('returns true when valid product tags exist', () => {
      expect(isShoppableContent(['prod-1'])).toBe(true);
      expect(isShoppableContent(['prod-1', 'prod-2'])).toBe(true);
    });

    it('returns false when product tags are empty or missing', () => {
      expect(isShoppableContent([])).toBe(false);
      expect(isShoppableContent(null)).toBe(false);
      expect(isShoppableContent(undefined)).toBe(false);
    });
  });

  describe('8. Web Client & Shared Commerce Type Contracts', () => {
    it('validates shape of StorefrontConfig, Inputs, and Shoppable items', () => {
      const sampleSection: StorefrontSection = {
        id: 'sec-1',
        type: 'hero',
        title: 'Authentic Crafts',
        subtitle: 'From Barbados',
        displayOrder: 1,
        isVisible: true,
      };

      const sampleSummary: TaggedProductSummary = {
        id: 'prod-123',
        title: 'Handmade Bajan Straw Hat',
        priceMinor: 4500,
        currency: 'USD',
        thumbnailUrl: 'https://images.tukubi.caribbean/straw-hat.jpg',
        originCountry: 'BB',
        sellerName: 'Bridgetown Artisans',
        sellerId: 'user-789',
        inventoryCount: 12,
        isAvailable: true,
      };

      const sampleConfig: StorefrontConfig = {
        id: 'sf-1',
        sellerId: 'seller-1',
        sellerType: 'merchant',
        headline: 'Authentic Caribbean Crafts',
        heroImageUrl: 'https://images.tukubi.caribbean/banner.jpg',
        sections: [sampleSection],
        brandColor: '#FF6B4A',
        returnPolicy: '30-day returns on unworn items.',
        shippingPolicy: 'Inter-island ferry & air delivery in 3-5 days.',
        currency: 'USD',
        supportEmail: 'support@bridgetownartisans.bb',
        socialLinks: { instagram: '@bridgetownartisans' },
        isPublished: true,
        createdAt: '2026-09-27T10:00:00Z',
        updatedAt: '2026-09-27T10:00:00Z',
      };

      const samplePost: ShoppablePostItem = {
        id: 'post-1',
        content: 'Check out these handmade artisanal items!',
        authorId: 'author-1',
        taggedProductIds: ['prod-123'],
        taggedProducts: [sampleSummary],
        createdAt: '2026-09-27T12:00:00Z',
      };

      const sampleReel: ShoppableReelItem = {
        id: 'reel-1',
        videoUrl: 'https://cdn.tukubi.caribbean/reels/artisan-demo.mp4',
        creatorId: 'creator-1',
        taggedProductIds: ['prod-123'],
        taggedProducts: [sampleSummary],
        createdAt: '2026-09-27T12:00:00Z',
      };

      const sampleEscrow: OrderEscrowDetails = {
        orderId: 'ord-100',
        buyerId: 'buyer-200',
        sellerId: 'seller-1',
        escrowStatus: 'held',
        totalMinor: 4500,
        currency: 'USD',
        createdAt: '2026-09-27T13:00:00Z',
      };

      expect(sampleConfig.sections[0].type).toBe('hero');
      expect(samplePost.taggedProducts?.[0].title).toBe('Handmade Bajan Straw Hat');
      expect(sampleReel.taggedProductIds).toHaveLength(1);
      expect(sampleEscrow.escrowStatus).toBe('held');
    });
  });
});
