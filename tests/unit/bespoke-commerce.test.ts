import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  SELLER_TYPE_REGISTRY,
  DEFAULT_STOREFRONT_SECTIONS,
  validateVariantSelection,
  groupCartBySeller,
  computeMultiSellerOrderTotals,
  computeB2BPrice,
  transitionOrder,
  type ProductVariant,
  type CartLine,
  type B2BTier,
} from '../../packages/marketplace/src/index';

describe('TUKUBI Bespoke Commerce & Storefront Architecture', () => {
  describe('Seller Type Taxonomy & Capabilities', () => {
    it('defines all 8 canonical seller types in the registry', () => {
      const types = Object.keys(SELLER_TYPE_REGISTRY);
      expect(types).toContain('merchant');
      expect(types).toContain('business');
      expect(types).toContain('creator');
      expect(types).toContain('artist');
      expect(types).toContain('restaurant');
      expect(types).toContain('service_provider');
      expect(types).toContain('cultural');
      expect(types).toContain('marketplace_seller');
    });

    it('enforces expected physical, digital, and service capability flags', () => {
      expect(SELLER_TYPE_REGISTRY.service_provider.supportsServices).toBe(true);
      expect(SELLER_TYPE_REGISTRY.service_provider.supportsPhysical).toBe(false);

      expect(SELLER_TYPE_REGISTRY.merchant.supportsPhysical).toBe(true);
      expect(SELLER_TYPE_REGISTRY.merchant.supportsServices).toBe(false);

      expect(SELLER_TYPE_REGISTRY.creator.supportsServices).toBe(true);
      expect(SELLER_TYPE_REGISTRY.creator.supportsDigital).toBe(true);
    });
  });

  describe('Product Variants & Inventory Validation', () => {
    const sampleVariant: ProductVariant = {
      id: 'var-1',
      productId: 'prod-1',
      sku: 'TKB-COFFEE-DARK-16OZ',
      title: 'Dark Roast / 16oz',
      options: { roast: 'Dark', size: '16oz' },
      priceMinor: 2800,
      inventoryCount: 5,
      isActive: true,
    };

    it('approves selection within available inventory', () => {
      const res = validateVariantSelection(sampleVariant, 2);
      expect(res.valid).toBe(true);
      expect(res.error).toBeUndefined();
    });

    it('rejects selection exceeding available stock', () => {
      const res = validateVariantSelection(sampleVariant, 6);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('exceeds available stock');
    });

    it('rejects out of stock variant', () => {
      const outOfStockVariant = { ...sampleVariant, inventoryCount: 0 };
      const res = validateVariantSelection(outOfStockVariant, 1);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('out of stock');
    });

    it('rejects inactive variant', () => {
      const inactiveVariant = { ...sampleVariant, isActive: false };
      const res = validateVariantSelection(inactiveVariant, 1);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('inactive');
    });
  });

  describe('Modular Storefront Section Builder', () => {
    it('provides canonical modular section blocks in default configuration', () => {
      expect(DEFAULT_STOREFRONT_SECTIONS.length).toBeGreaterThanOrEqual(6);

      const sectionTypes = DEFAULT_STOREFRONT_SECTIONS.map((s) => s.type);
      expect(sectionTypes).toContain('hero');
      expect(sectionTypes).toContain('featured_collection');
      expect(sectionTypes).toContain('product_grid');
      expect(sectionTypes).toContain('services_showcase');
      expect(sectionTypes).toContain('seller_story');
      expect(sectionTypes).toContain('customer_reviews');
    });

    it('has ordered sequence and visible defaults', () => {
      for (const section of DEFAULT_STOREFRONT_SECTIONS) {
        expect(section.displayOrder).toBeGreaterThan(0);
        expect(section.isVisible).toBe(true);
        expect(section.id).toBeDefined();
      }
    });
  });

  describe('Multi-Seller Cart Grouping & Calculations', () => {
    const lines: CartLine[] = [
      {
        productId: 'prod-coffee-1',
        sellerId: 'seller-blue-mountain',
        sellerName: 'Blue Mountain Coffee Co',
        productTitle: 'Estate Roast',
        productKind: 'physical',
        unitPriceMinor: 2500,
        quantity: 2,
      },
      {
        productId: 'prod-spices-1',
        sellerId: 'seller-blue-mountain',
        sellerName: 'Blue Mountain Coffee Co',
        productTitle: 'Allspice Berry Extract',
        productKind: 'physical',
        unitPriceMinor: 1500,
        quantity: 1,
      },
      {
        productId: 'prod-craft-1',
        sellerId: 'seller-island-art',
        sellerName: 'Caribbean Island Art',
        productTitle: 'Carved Wood Mask',
        productKind: 'physical',
        unitPriceMinor: 8000,
        quantity: 1,
      },
    ];

    it('groups multi-vendor cart lines by sellerId', () => {
      const grouped = groupCartBySeller(lines);
      expect(grouped.size).toBe(2);

      const seller1Lines = grouped.get('seller-blue-mountain');
      expect(seller1Lines?.length).toBe(2);

      const seller2Lines = grouped.get('seller-island-art');
      expect(seller2Lines?.length).toBe(1);
    });

    it('computes grand totals and discrete seller breakdowns without loss', () => {
      const { grandTotal, sellerBreakdown } = computeMultiSellerOrderTotals(lines, {
        commissionBps: 0,
        processingFeeBps: 290,
        processingFixedMinor: 30,
      });

      // Seller 1: (2500 * 2) + (1500 * 1) = 5000 + 1500 = 6500
      expect(sellerBreakdown['seller-blue-mountain'].totals.subtotalMinor).toBe(6500);

      // Seller 2: 8000 * 1 = 8000
      expect(sellerBreakdown['seller-island-art'].totals.subtotalMinor).toBe(8000);

      // Grand Subtotal: 6500 + 8000 = 14500
      expect(grandTotal.subtotalMinor).toBe(14500);
      expect(grandTotal.totalMinor).toBeGreaterThan(14500);
    });
  });

  describe('B2B Wholesale & Bulk Pricing Tier Architecture', () => {
    const tiers: B2BTier[] = [
      { minimumUnits: 10, discountBps: 1000 }, // 10% off for 10+
      { minimumUnits: 50, discountBps: 2000 }, // 20% off for 50+
    ];

    it('keeps retail price when quantity is below first threshold', () => {
      const { effectivePriceMinor, discountAppliedBps } = computeB2BPrice(2000, 5, tiers);
      expect(effectivePriceMinor).toBe(2000);
      expect(discountAppliedBps).toBe(0);
    });

    it('applies tier 1 discount when quantity meets minimumUnits', () => {
      const { effectivePriceMinor, discountAppliedBps } = computeB2BPrice(2000, 15, tiers);
      // 10% off 2000 = 1800
      expect(effectivePriceMinor).toBe(1800);
      expect(discountAppliedBps).toBe(1000);
    });

    it('applies tier 2 discount for higher volume', () => {
      const { effectivePriceMinor, discountAppliedBps } = computeB2BPrice(2000, 75, tiers);
      // 20% off 2000 = 1600
      expect(effectivePriceMinor).toBe(1600);
      expect(discountAppliedBps).toBe(2000);
    });
  });

  describe('Fulfillment State Machine Transitions', () => {
    it('allows valid forward lifecycle transitions', () => {
      expect(transitionOrder('pending_payment', 'paid')).toBe('paid');
      expect(transitionOrder('paid', 'processing')).toBe('processing');
      expect(transitionOrder('processing', 'fulfilling')).toBe('fulfilling');
      expect(transitionOrder('fulfilling', 'shipped')).toBe('shipped');
      expect(transitionOrder('shipped', 'fulfilled')).toBe('fulfilled');
    });

    it('throws error for invalid backwards transitions', () => {
      expect(() => transitionOrder('fulfilled', 'pending_payment')).toThrow('Invalid order transition');
      expect(() => transitionOrder('shipped', 'processing')).toThrow('Invalid order transition');
    });
  });

  describe('Migration 00039 Schema Verification', () => {
    it('verifies migration 00039 exists and defines all required commerce tables', () => {
      const migrationPath = path.resolve(
        __dirname,
        '../../supabase/migrations/00039_bespoke_commerce_engine.sql'
      );
      expect(fs.existsSync(migrationPath)).toBe(true);

      const sql = fs.readFileSync(migrationPath, 'utf8');
      expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.product_variants');
      expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.storefront_configs');
      expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.product_reviews');
      expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.product_tags');
      expect(sql).toContain('ENABLE ROW LEVEL SECURITY');
    });
  });
});
