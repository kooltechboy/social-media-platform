import { describe, it, expect } from 'vitest';
import {
  UNIVERSAL_CATEGORY_GROUPS,
  ALL_UNIVERSAL_CATEGORIES,
  findCategoryBySlug,
  searchCategories,
  type PageCategoryGroupKey,
} from '../../apps/web/src/lib/pages/categories';
import {
  validateBusinessProfile,
  aggregateReviews,
  validateBookingWindow,
  canRsvp,
  formatPrice,
  type BusinessProfileInput,
  type ReviewAggregation,
} from '../../packages/business/src/index';

describe('Phase 17 — Pages 2.0 & Identity Management Certification', () => {
  // ===========================================================================
  // 1. Universal Page Categories & Taxonomies
  // ===========================================================================
  describe('1. Universal Page Taxonomy & Categories', () => {
    it('registers the 12 canonical category groups without omission', () => {
      const canonicalGroups: PageCategoryGroupKey[] = [
        'creator', 'business', 'media', 'community', 'education',
        'institution', 'sports', 'faith', 'events', 'travel',
        'technology', 'other',
      ];

      expect(UNIVERSAL_CATEGORY_GROUPS).toHaveLength(12);
      const registeredKeys = UNIVERSAL_CATEGORY_GROUPS.map((g) => g.key);
      canonicalGroups.forEach((group) => {
        expect(registeredKeys).toContain(group);
      });
    });

    it('enforces collision-free slugs and unique IDs across all categories', () => {
      const slugs = ALL_UNIVERSAL_CATEGORIES.map((c) => c.slug);
      const ids = ALL_UNIVERSAL_CATEGORIES.map((c) => c.id);

      expect(new Set(slugs).size).toBe(slugs.length);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('searches and resolves categories by query keyword', () => {
      const musicResults = searchCategories('music');
      expect(musicResults.length).toBeGreaterThan(0);
      expect(musicResults.some((c) => c.slug === 'musician')).toBe(true);

      const resolved = findCategoryBySlug('musician');
      expect(resolved).toBeDefined();
      expect(resolved?.name).toBe('Musician & DJ');
      expect(resolved?.groupKey).toBe('creator');
    });
  });

  // ===========================================================================
  // 2. Business Profile Creation & ISO Compliance
  // ===========================================================================
  describe('2. Business Profile Creation & Invariants', () => {
    const validProfile: BusinessProfileInput = {
      ownerId: 'usr_founder_tt',
      name: 'Maracas Bay Bake & Shark Emporium',
      category: 'restaurant',
      countryIso: 'TTO',
      phone: '+1 868 555 0199',
      website: 'https://maracasbakeandshark.tt',
    };

    it('validates a compliant Caribbean business profile', () => {
      const res = validateBusinessProfile(validProfile);
      expect(res.valid).toBe(true);
      expect(res.errors.length).toBe(0);
    });

    it('strictly enforces 3-letter ISO country code and HTTPS website format', () => {
      const invalidIso = validateBusinessProfile({ ...validProfile, countryIso: 'TT' });
      expect(invalidIso.valid).toBe(false);
      expect(invalidIso.errors).toContain('Country must be an ISO code');

      const insecureUrl = validateBusinessProfile({ ...validProfile, website: 'ftp://insecure.site' });
      expect(insecureUrl.valid).toBe(false);
      expect(insecureUrl.errors).toContain('Website must be a valid URL');
    });

    it('enforces maximum business name length of 120 characters', () => {
      const tooLong = validateBusinessProfile({ ...validProfile, name: 'B'.repeat(125) });
      expect(tooLong.valid).toBe(false);
      expect(tooLong.errors[0]).toContain('exceeds 120 characters');
    });
  });

  // ===========================================================================
  // 3. Review Mathematics & Rating Aggregation
  // ===========================================================================
  describe('3. Review Aggregation Mathematics', () => {
    it('aggregates star ratings and computes exact 1-decimal average and distribution', () => {
      const ratings = [5, 5, 4, 3, 5, 2, 5, 4];
      const agg = aggregateReviews(ratings);

      expect(agg.total).toBe(8);
      // sum = 33 / 8 = 4.125 -> rounded to 4.1
      expect(agg.average).toBe(4.1);
      expect(agg.distribution[5]).toBe(4);
      expect(agg.distribution[4]).toBe(2);
      expect(agg.distribution[3]).toBe(1);
      expect(agg.distribution[2]).toBe(1);
      expect(agg.distribution[1]).toBe(0);
    });

    it('rejects ratings outside the 1 to 5 integer boundary', () => {
      expect(() => aggregateReviews([0, 5])).toThrow('Ratings must be integers between 1 and 5');
      expect(() => aggregateReviews([6, 5])).toThrow('Ratings must be integers between 1 and 5');
      expect(() => aggregateReviews([4.5, 5])).toThrow('Ratings must be integers between 1 and 5');
    });
  });

  // ===========================================================================
  // 4. Booking Windows & Event Capacity Safeguards
  // ===========================================================================
  describe('4. Booking Windows & RSVP Capacity', () => {
    it('enforces startUtc in the future and endUtc strictly after startUtc', () => {
      const now = new Date('2026-09-01T12:00:00Z');
      const validWindow = {
        startUtc: new Date('2026-09-05T14:00:00Z'),
        endUtc: new Date('2026-09-05T16:00:00Z'),
      };

      expect(validateBookingWindow(validWindow, now).valid).toBe(true);

      const pastWindow = {
        startUtc: new Date('2026-08-30T10:00:00Z'),
        endUtc: new Date('2026-08-30T12:00:00Z'),
      };
      expect(validateBookingWindow(pastWindow, now).valid).toBe(false);

      const invertedWindow = {
        startUtc: new Date('2026-09-05T16:00:00Z'),
        endUtc: new Date('2026-09-05T14:00:00Z'),
      };
      expect(validateBookingWindow(invertedWindow, now).valid).toBe(false);
    });

    it('determines RSVP capability based on capacity limit and current attendees', () => {
      // Unbounded capacity allows RSVP
      expect(canRsvp({ capacity: null, attendeeCount: 9999 })).toBe(true);

      // Available spots
      expect(canRsvp({ capacity: 100, attendeeCount: 99 })).toBe(true);

      // At capacity: RSVP closed
      expect(canRsvp({ capacity: 100, attendeeCount: 100 })).toBe(false);
    });

    it('formats multi-currency monetary prices correctly', () => {
      expect(formatPrice(5000, 'USD')).toContain('50.00');
    });
  });
});
