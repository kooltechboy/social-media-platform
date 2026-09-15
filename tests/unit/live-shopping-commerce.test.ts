import { describe, it, expect } from 'vitest';
import {
  validateLiveProductPin,
  calculateLiveDiscountPrice,
} from '../../packages/live/src/index';

describe('Live Shopping Commerce Engine (Phase 13)', () => {
  describe('validateLiveProductPin', () => {
    it('accepts valid livestream and product IDs with zero discount', () => {
      const res = validateLiveProductPin('stream-123', 'prod-456', 0);
      expect(res.valid).toBe(true);
      expect(res.errors).toHaveLength(0);
    });

    it('accepts valid flash discount up to 90% (9000 bps)', () => {
      const res = validateLiveProductPin('stream-123', 'prod-456', 2500); // 25%
      expect(res.valid).toBe(true);
    });

    it('rejects missing IDs and negative or excessive discounts', () => {
      const res = validateLiveProductPin('', '', 9500);
      expect(res.valid).toBe(false);
      expect(res.errors).toContain('Valid livestream ID is required');
      expect(res.errors).toContain('Valid product ID is required');
      expect(res.errors).toContain('Flash discount must be between 0% (0 bps) and 90% (9000 bps)');
    });
  });

  describe('calculateLiveDiscountPrice', () => {
    it('returns original price when discount is 0 bps', () => {
      const res = calculateLiveDiscountPrice(5000, 0); // $50.00
      expect(res.discountedMinor).toBe(5000);
      expect(res.savingsMinor).toBe(0);
    });

    it('calculates 20% live flash drop accurately', () => {
      const res = calculateLiveDiscountPrice(10000, 2000); // $100.00 with 20% off
      expect(res.discountedMinor).toBe(8000); // $80.00
      expect(res.savingsMinor).toBe(2000);
    });

    it('clamps excessive discount to maximum 90%', () => {
      const res = calculateLiveDiscountPrice(10000, 9900);
      expect(res.discountedMinor).toBe(1000); // $10.00 remaining
      expect(res.savingsMinor).toBe(9000);
    });

    it('throws error for non-positive or non-integer minor unit prices', () => {
      expect(() => calculateLiveDiscountPrice(0, 500)).toThrow();
      expect(() => calculateLiveDiscountPrice(-100, 500)).toThrow();
      expect(() => calculateLiveDiscountPrice(45.5, 500)).toThrow();
    });
  });
});
