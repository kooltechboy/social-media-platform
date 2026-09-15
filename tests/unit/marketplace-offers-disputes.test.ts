import { describe, it, expect } from 'vitest';
import {
  PRODUCT_CONDITION_METADATA,
  transitionOffer,
  isOfferActive,
  DISPUTE_REASON_METADATA,
  CANONICAL_CARIBBEAN_CATEGORIES,
  parseNaturalLanguageSearch,
  calculateAffiliateCommission,
  type OfferStatus,
  type ProductCondition,
} from '../../packages/marketplace/src/index';

describe('TUKUBI Enterprise Marketplace Domain Engine', () => {
  describe('Product Condition Taxonomy', () => {
    it('provides metadata for all 7 standard conditions', () => {
      const conditions: ProductCondition[] = [
        'new',
        'used_like_new',
        'used_good',
        'used_fair',
        'refurbished',
        'handmade',
        'custom',
      ];
      for (const cond of conditions) {
        expect(PRODUCT_CONDITION_METADATA[cond]).toBeDefined();
        expect(PRODUCT_CONDITION_METADATA[cond].label).toBeTypeOf('string');
        expect(PRODUCT_CONDITION_METADATA[cond].badgeClass).toContain('border-');
      }
    });
  });

  describe('Offers Negotiation State Machine', () => {
    it('permits valid offer status transitions', () => {
      expect(transitionOffer('pending', 'countered')).toBe('countered');
      expect(transitionOffer('countered', 'accepted')).toBe('accepted');
      expect(transitionOffer('pending', 'rejected')).toBe('rejected');
      expect(transitionOffer('pending', 'cancelled')).toBe('cancelled');
      expect(transitionOffer('pending', 'expired')).toBe('expired');
    });

    it('rejects illegal status transitions from terminal states', () => {
      expect(() => transitionOffer('accepted', 'pending')).toThrow('Invalid offer transition');
      expect(() => transitionOffer('rejected', 'countered')).toThrow('Invalid offer transition');
      expect(() => transitionOffer('cancelled', 'accepted')).toThrow('Invalid offer transition');
    });

    it('determines offer active status based on status and expiration', () => {
      const future = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 hours in future
      const past = new Date(Date.now() - 1000 * 60); // 1 minute in past

      expect(isOfferActive({ status: 'pending', expiresAt: future })).toBe(true);
      expect(isOfferActive({ status: 'countered', expiresAt: future })).toBe(true);
      expect(isOfferActive({ status: 'pending', expiresAt: past })).toBe(false);
      expect(isOfferActive({ status: 'accepted', expiresAt: future })).toBe(false);
      expect(isOfferActive({ status: 'rejected', expiresAt: future })).toBe(false);
    });
  });

  describe('Buyer Protection & Dispute Reasons', () => {
    it('defines authoritative dispute reasons and descriptions', () => {
      expect(DISPUTE_REASON_METADATA.not_received.label).toBe('Item Not Received');
      expect(DISPUTE_REASON_METADATA.damaged.label).toBe('Damaged in Transit');
      expect(DISPUTE_REASON_METADATA.counterfeit.label).toBe('Suspected Counterfeit');
      expect(DISPUTE_REASON_METADATA.materially_different.label).toBe('Materially Different');
      expect(DISPUTE_REASON_METADATA.fraud.label).toBe('Seller Fraud or Scam');
    });
  });

  describe('Canonical Caribbean Categories', () => {
    it('contains all 10 distinct cultural and commerce categories', () => {
      expect(CANONICAL_CARIBBEAN_CATEGORIES.length).toBe(10);
      const slugs = CANONICAL_CARIBBEAN_CATEGORIES.map((c) => c.slug);
      expect(slugs).toContain('food-spices');
      expect(slugs).toContain('carnival-mas');
      expect(slugs).toContain('art-decor');
      expect(slugs).toContain('fashion-apparel');
      expect(slugs).toContain('beauty-wellness');
      expect(slugs).toContain('digital-sounds');
      expect(slugs).toContain('services-bookings');
      expect(slugs).toContain('electronics-tech');
      expect(slugs).toContain('vehicles-transport');
      expect(slugs).toContain('real-estate-rentals');
    });
  });

  describe('AI Natural Language Shopping Query Parser', () => {
    it('extracts price caps, category, and island from natural language query', () => {
      const parsed = parseNaturalLanguageSearch('Find me a used iPhone under $300 in Kingston');
      expect(parsed.maxPriceMinor).toBe(30000);
      expect(parsed.countryIso).toBe('JAM');
      expect(parsed.condition).toContain('used_like_new');
      expect(parsed.categorySlug).toBe('electronics-tech');
    });

    it('extracts handmade and Dominican Republic filters', () => {
      const parsed = parseNaturalLanguageSearch('Find handmade coffee gifts under $50 in Santiago');
      expect(parsed.maxPriceMinor).toBe(5000);
      expect(parsed.countryIso).toBe('DOM');
      expect(parsed.condition).toContain('handmade');
      expect(parsed.categorySlug).toBe('food-spices');
    });

    it('extracts pickup preferences', () => {
      const parsed = parseNaturalLanguageSearch('laptops for pickup in Trinidad');
      expect(parsed.pickupOnly).toBe(true);
      expect(parsed.countryIso).toBe('TTO');
      expect(parsed.categorySlug).toBe('electronics-tech');
    });
  });

  describe('Affiliate Commission Calculation', () => {
    it('computes expected minor commission amounts', () => {
      // 500 bps = 5% on $100.00 (10000 minor) = 500 minor ($5.00)
      expect(calculateAffiliateCommission(10000, 500)).toBe(500);

      // 1000 bps = 10% on $45.00 (4500 minor) = 450 minor ($4.50)
      expect(calculateAffiliateCommission(4500, 1000)).toBe(450);

      // 0 subtotal or 0 bps returns 0
      expect(calculateAffiliateCommission(0, 500)).toBe(0);
      expect(calculateAffiliateCommission(10000, 0)).toBe(0);
    });

    it('clamps commission to maximum 50% (5000 bps)', () => {
      expect(calculateAffiliateCommission(10000, 8000)).toBe(5000);
    });
  });
});
