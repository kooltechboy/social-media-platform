import { describe, it, expect } from 'vitest';
import {
  CartLine,
  computeLineTotal,
  computeOrderTotals,
  groupCartBySeller,
  computeMultiSellerOrderTotals,
  validateVariantSelection,
  ProductVariant,
  computeB2BPrice,
  B2BTier,
  transitionOrder,
  FulfillmentState,
  disputeWindowOpen,
  transitionOffer,
  isOfferActive,
  OfferStatus,
  digitalGoodsRequireMobileStoreRouting,
  SELLER_TYPE_REGISTRY,
} from '../../packages/marketplace/src/index';

describe('Phase 14 — Social Commerce, Cart & Escrow Orders Certification', () => {
  // ===========================================================================
  // 1. Cart Mathematics & Multi-Seller Settlement
  // ===========================================================================
  describe('1. Cart Line Arithmetic & Multi-Seller Split Calculations', () => {
    const line1: CartLine = {
      productId: 'prod_rum_cake',
      sellerId: 'seller_jamaica',
      unitPriceMinor: 2500, // $25.00
      quantity: 2,
      productKind: 'physical',
      productTitle: 'Tortuga Caribbean Rum Cake',
    };

    const line2: CartLine = {
      productId: 'prod_handmade_batik',
      sellerId: 'seller_barbados',
      unitPriceMinor: 8000, // $80.00
      quantity: 1,
      productKind: 'physical',
      productTitle: 'Handmade Island Batik Scarf',
    };

    it('computes individual line totals in exact minor units', () => {
      expect(computeLineTotal(line1)).toBe(5000); // $50.00
      expect(computeLineTotal(line2)).toBe(8000); // $80.00
    });

    it('rejects invalid or non-integer unit prices and quantities', () => {
      expect(() => computeLineTotal({ ...line1, unitPriceMinor: -100 })).toThrow(
        'Unit price must be positive integer minor units'
      );
      expect(() => computeLineTotal({ ...line1, unitPriceMinor: 19.99 as any })).toThrow(
        'Unit price must be positive integer minor units'
      );
      expect(() => computeLineTotal({ ...line1, quantity: 0 })).toThrow('Quantity must be between');
      expect(() => computeLineTotal({ ...line1, quantity: 25 })).toThrow('Quantity must be between');
    });

    it('groups multi-vendor cart lines by seller and calculates isolated subtotals', () => {
      const cart = [line1, line2];
      const grouped = groupCartBySeller(cart);

      expect(grouped.size).toBe(2);
      expect(grouped.get('seller_jamaica')?.length).toBe(1);
      expect(grouped.get('seller_barbados')?.length).toBe(1);

      const multiTotals = computeMultiSellerOrderTotals(cart, { commissionBps: 800 });
      expect(multiTotals.grandTotal.subtotalMinor).toBe(13000); // $130.00
      expect(multiTotals.sellerBreakdown['seller_jamaica'].totals.subtotalMinor).toBe(5000);
      expect(multiTotals.sellerBreakdown['seller_barbados'].totals.subtotalMinor).toBe(8000);
    });
  });

  // ===========================================================================
  // 2. Inventory & Wholesale B2B Volume Pricing
  // ===========================================================================
  describe('2. Inventory Bounds & Wholesale Tiered Pricing', () => {
    const variant: ProductVariant = {
      id: 'var_1',
      productId: 'prod_hot_sauce',
      sku: 'HS-SCOTCH-BONNET',
      title: 'Scotch Bonnet Hot Sauce 5oz',
      options: { flavor: 'Original Fire' },
      priceMinor: 1200,
      inventoryCount: 15,
      isActive: true,
    };

    it('validates variant stock availability and rejects overselling', () => {
      expect(validateVariantSelection(variant, 5).valid).toBe(true);
      expect(validateVariantSelection(variant, 15).valid).toBe(true);

      const oversell = validateVariantSelection(variant, 16);
      expect(oversell.valid).toBe(false);
      expect(oversell.error).toContain('exceeds available stock');

      const inactive = validateVariantSelection({ ...variant, isActive: false }, 1);
      expect(inactive.valid).toBe(false);
      expect(inactive.error).toContain('inactive');
    });

    it('applies wholesale tiered volume discounts accurately', () => {
      const wholesaleTiers: B2BTier[] = [
        { minimumUnits: 10, discountBps: 1000 }, // 10% off for 10+
        { minimumUnits: 50, discountBps: 2500 }, // 25% off for 50+
      ];

      // Single item: no discount
      const single = computeB2BPrice(1000, 1, wholesaleTiers);
      expect(single.effectivePriceMinor).toBe(1000);
      expect(single.discountAppliedBps).toBe(0);

      // 10 items: 10% off ($10.00 -> $9.00)
      const tier1 = computeB2BPrice(1000, 12, wholesaleTiers);
      expect(tier1.effectivePriceMinor).toBe(900);
      expect(tier1.discountAppliedBps).toBe(1000);

      // 50 items: 25% off ($10.00 -> $7.50)
      const tier2 = computeB2BPrice(1000, 60, wholesaleTiers);
      expect(tier2.effectivePriceMinor).toBe(750);
      expect(tier2.discountAppliedBps).toBe(2500);
    });
  });

  // ===========================================================================
  // 3. Order Lifecycle, Fulfillment & Escrow Protection
  // ===========================================================================
  describe('3. Order Fulfillment & Escrow Lifecycle', () => {
    it('executes valid fulfillment lifecycle transitions', () => {
      let state: FulfillmentState = 'pending_payment';
      state = transitionOrder(state, 'paid');
      expect(state).toBe('paid');

      state = transitionOrder(state, 'processing');
      expect(state).toBe('processing');

      state = transitionOrder(state, 'shipped');
      expect(state).toBe('shipped');

      state = transitionOrder(state, 'fulfilled');
      expect(state).toBe('fulfilled');

      state = transitionOrder(state, 'refunded');
      expect(state).toBe('refunded');
    });

    it('strictly forbids invalid backwards fulfillment transitions', () => {
      expect(() => transitionOrder('fulfilled', 'processing')).toThrow('Invalid order transition');
      expect(() => transitionOrder('shipped', 'pending_payment')).toThrow('Invalid order transition');
      expect(() => transitionOrder('refunded', 'paid')).toThrow('Invalid order transition');
    });

    it('enforces 30-day buyer escrow dispute window after delivery', () => {
      const deliveredTime = new Date('2026-09-01T12:00:00Z');

      // 10 days after delivery: open
      expect(
        disputeWindowOpen({
          deliveredAt: deliveredTime.toISOString(),
          now: new Date('2026-09-11T12:00:00Z'),
        })
      ).toBe(true);

      // 30 days exactly: open
      expect(
        disputeWindowOpen({
          deliveredAt: deliveredTime.toISOString(),
          now: new Date('2026-10-01T12:00:00Z'),
        })
      ).toBe(true);

      // 31 days after delivery: expired
      expect(
        disputeWindowOpen({
          deliveredAt: deliveredTime.toISOString(),
          now: new Date('2026-10-02T12:00:00Z'),
        })
      ).toBe(false);
    });
  });

  // ===========================================================================
  // 4. Offers & Counter-Offers State Machine
  // ===========================================================================
  describe('4. Offers State Machine & Active Expiry', () => {
    it('transitions offer through negotiation states to acceptance', () => {
      let status: OfferStatus = 'pending';
      status = transitionOffer(status, 'countered');
      expect(status).toBe('countered');

      status = transitionOffer(status, 'accepted');
      expect(status).toBe('accepted');

      // Terminal state cannot transition
      expect(() => transitionOffer(status, 'countered')).toThrow('Invalid offer transition');
    });

    it('evaluates whether an offer is active based on state and expiry timestamp', () => {
      const future = new Date(Date.now() + 1000 * 60 * 60);
      const past = new Date(Date.now() - 1000 * 60 * 60);

      expect(isOfferActive({ status: 'pending', expiresAt: future })).toBe(true);
      expect(isOfferActive({ status: 'countered', expiresAt: future })).toBe(true);

      // Expired in past
      expect(isOfferActive({ status: 'pending', expiresAt: past })).toBe(false);

      // Already accepted is not active for negotiations
      expect(isOfferActive({ status: 'accepted', expiresAt: future })).toBe(false);
    });
  });

  // ===========================================================================
  // 5. Store Policy Compliance (Rule 9)
  // ===========================================================================
  describe('5. Mobile Store Policy Compliance (Rule 9)', () => {
    it('requires digital goods on iOS/Android to route via native in-app purchases', () => {
      const digitalCart: CartLine[] = [
        {
          productId: 'digital_album_1',
          sellerId: 'artist_jamaica',
          unitPriceMinor: 999,
          quantity: 1,
          productKind: 'digital',
        },
      ];

      const physicalCart: CartLine[] = [
        {
          productId: 'vinyl_record_1',
          sellerId: 'artist_jamaica',
          unitPriceMinor: 2999,
          quantity: 1,
          productKind: 'physical',
        },
      ];

      // Digital on iOS or Android MUST route to IAP
      expect(digitalGoodsRequireMobileStoreRouting(digitalCart, 'ios')).toBe(true);
      expect(digitalGoodsRequireMobileStoreRouting(digitalCart, 'android')).toBe(true);

      // Digital on Web does NOT require mobile store routing
      expect(digitalGoodsRequireMobileStoreRouting(digitalCart, 'web')).toBe(false);

      // Physical goods on mobile never route to IAP
      expect(digitalGoodsRequireMobileStoreRouting(physicalCart, 'ios')).toBe(false);
      expect(digitalGoodsRequireMobileStoreRouting(physicalCart, 'android')).toBe(false);
    });

    it('verifies all 8 seller types are registered with support flags', () => {
      const types = Object.keys(SELLER_TYPE_REGISTRY);
      expect(types.length).toBe(8);
      expect(types).toContain('merchant');
      expect(types).toContain('cultural');
      expect(types).toContain('restaurant');
    });
  });
});
