import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { TaggedProductSummary } from '@caribbean/marketplace';
import ShoppablePostWidget, {
  ShoppablePostWidgetProps,
  normalizeTaggedProducts,
} from '../apps/web/src/components/commerce/shoppable-post-widget';
import ShoppableReelBadge, {
  ShoppableReelBadgeProps,
  resolveReelProducts,
} from '../apps/web/src/components/commerce/shoppable-reel-badge';

describe('Task 5: Shoppable Post Widget & Shoppable Reel Badge Overlays', () => {
  const rootDir = process.cwd();
  const postWidgetPath = path.join(
    rootDir,
    'apps/web/src/components/commerce/shoppable-post-widget.tsx'
  );
  const reelBadgePath = path.join(
    rootDir,
    'apps/web/src/components/commerce/shoppable-reel-badge.tsx'
  );
  const reelViewerPath = path.join(
    rootDir,
    'apps/web/src/components/reels/reels-feed-viewer.tsx'
  );

  const mockProductA: TaggedProductSummary = {
    id: 'prod-jam-01',
    title: 'Blue Mountain Peaberry Coffee',
    priceMinor: 3200,
    currency: 'USD',
    originTerritory: 'Jamaica',
    originCountry: 'Jamaica',
    sellerId: 'seller-jam-1',
    sellerName: 'Kingston Roasters',
    inventoryCount: 24,
    isAvailable: true,
    thumbnailUrl: 'https://cdn.tukubi.com/products/peaberry.jpg',
  };

  const mockProductB: TaggedProductSummary = {
    id: 'prod-slu-02',
    title: 'St. Lucian Organic Cocoa Sticks',
    priceMinor: 1850,
    currency: 'USD',
    originTerritory: 'Saint Lucia',
    originCountry: 'Saint Lucia',
    sellerId: 'seller-slu-1',
    sellerName: 'Soufrière Artisan Estate',
    inventoryCount: 30,
    isAvailable: true,
    thumbnailUrl: 'https://cdn.tukubi.com/products/cocoa.jpg',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. File Existence & Export Contracts', () => {
    it('verifies required component files exist on disk', () => {
      expect(fs.existsSync(postWidgetPath)).toBe(true);
      expect(fs.existsSync(reelBadgePath)).toBe(true);
      expect(fs.existsSync(reelViewerPath)).toBe(true);
    });

    it('exports functional components and helper contracts', () => {
      expect(ShoppablePostWidget).toBeDefined();
      expect(typeof ShoppablePostWidget).toBe('function');
      expect(typeof normalizeTaggedProducts).toBe('function');

      expect(ShoppableReelBadge).toBeDefined();
      expect(typeof ShoppableReelBadge).toBe('function');
      expect(typeof resolveReelProducts).toBe('function');
    });
  });

  describe('2. ShoppablePostWidget Specifications', () => {
    it('normalizes single product and multi-product arrays uniformly', () => {
      const single = normalizeTaggedProducts(mockProductA);
      expect(single).toHaveLength(1);
      expect(single[0].id).toBe('prod-jam-01');

      const array = normalizeTaggedProducts([mockProductA, mockProductB]);
      expect(array).toHaveLength(2);
      expect(array[1].id).toBe('prod-slu-02');

      const empty = normalizeTaggedProducts(undefined);
      expect(empty).toHaveLength(0);
    });

    it('renders null or fallback when no products are tagged', () => {
      const vdom = ShoppablePostWidget({ products: [] });
      expect(vdom).toBeNull();
    });

    it('displays single product with thumbnail, seller, origin, formatted price, Buy Now, and Add to Cart', () => {
      const vdom = ShoppablePostWidget({
        products: [mockProductA],
      });
      expect(vdom).not.toBeNull();
      const serialized = JSON.stringify(vdom);
      expect(serialized).toContain('Blue Mountain Peaberry Coffee');
      expect(serialized).toContain('Kingston Roasters');
      expect(serialized).toContain('Jamaica');
      expect(serialized).toContain('$32.00');
      expect(serialized).toContain('Buy Now');
      expect(serialized).toContain('Add to Cart');
    });

    it('displays responsive multi-product carousel / cards when multiple products are tagged', () => {
      const vdom = ShoppablePostWidget({
        products: [mockProductA, mockProductB],
      });
      expect(vdom).not.toBeNull();
      const serialized = JSON.stringify(vdom);
      expect(serialized).toContain('Blue Mountain Peaberry Coffee');
      expect(serialized).toContain('St. Lucian Organic Cocoa Sticks');
      expect(serialized).toContain('Saint Lucia');
      expect(serialized).toContain('$18.50');
      expect(serialized).toMatch(/Tagged Goods|Featured Goods|Shoppable Products/i);
    });

    it('source file implements 1-click instant checkout modal with quantity selector, shipping address, and TUKUBI 30-Day Escrow notice', () => {
      const source = fs.readFileSync(postWidgetPath, 'utf8');
      expect(source).toMatch(/Instant.*Checkout|Tukubi Instant Checkout/i);
      expect(source).toMatch(/shippingAddress|Shipping Address|Delivery Address/i);
      expect(source).toMatch(/30-Day Escrow|Escrow Guarantee|TUKUBI.*Escrow/i);
      expect(source).toMatch(/quantity/i);
    });

    it('implements WCAG 2.2 AA accessibility with touch targets and ARIA landmarks', () => {
      const source = fs.readFileSync(postWidgetPath, 'utf8');
      expect(source).toMatch(/role=["'](?:region|group)["']/);
      expect(source).toMatch(/min-h-\[44px\]|h-11|min-w-\[44px\]|w-11|p-3/);
      expect(source).toMatch(/aria-label=/);
    });

    it('incorporates Caribbean Futurism brand palette tokens', () => {
      const source = fs.readFileSync(postWidgetPath, 'utf8');
      expect(source).toContain('brand-dusk');
      expect(source).toContain('brand-sunriseCoral');
      expect(source).toContain('brand-goldenHour');
    });
  });

  describe('3. ShoppableReelBadge Specifications', () => {
    it('resolves products from productIds or products array', () => {
      const fromProducts = resolveReelProducts({ products: [mockProductA] });
      expect(fromProducts).toHaveLength(1);
      expect(fromProducts[0].id).toBe('prod-jam-01');

      const fromIds = resolveReelProducts({ productIds: ['prod-jam-01', 'prod-slu-02'] });
      expect(fromIds.length).toBeGreaterThanOrEqual(1);
      expect(fromIds.some(p => p.id === 'prod-jam-01')).toBe(true);

      const empty = resolveReelProducts({});
      expect(empty).toHaveLength(0);
    });

    it('renders null when there are no tagged products or ids', () => {
      const vdom = ShoppableReelBadge({ products: [] });
      expect(vdom).toBeNull();
    });

    it('displays floating pill with count and lowest item price', () => {
      const vdom = ShoppableReelBadge({
        products: [mockProductA, mockProductB],
      });
      expect(vdom).not.toBeNull();
      const serialized = JSON.stringify(vdom);
      expect(serialized).toMatch(/Featured Goods \(2\)/);
      expect(serialized).toMatch(/From \$18\.50/);
    });

    it('source file implements animated bottom sheet drawer with Escape and backdrop dismissal', () => {
      const source = fs.readFileSync(reelBadgePath, 'utf8');
      expect(source).toMatch(/Escape/);
      expect(source).toMatch(/backdrop|fixed inset-0/);
      expect(source).toContain('Add to Cart');
      expect(source).toContain('Buy Now');
      expect(source).toMatch(/30-Day Escrow|Escrow Guarantee/i);
    });

    it('enforces WCAG 2.2 AA accessibility and touch targets in reel overlay', () => {
      const source = fs.readFileSync(reelBadgePath, 'utf8');
      expect(source).toMatch(/role=["'](?:dialog|region)["']/);
      expect(source).toMatch(/aria-label=/);
      expect(source).toMatch(/min-h-\[44px\]|h-11|min-w-\[44px\]|w-11|p-3/);
    });
  });

  describe('4. Wire into reels-feed-viewer.tsx', () => {
    it('imports ShoppableReelBadge in reels-feed-viewer.tsx', () => {
      const source = fs.readFileSync(reelViewerPath, 'utf8');
      expect(source).toContain('ShoppableReelBadge');
    });

    it('ReelItem interface includes tagged product fields', () => {
      const source = fs.readFileSync(reelViewerPath, 'utf8');
      expect(source).toMatch(/tagged_product_ids\?:|taggedProductIds\?:|taggedProducts\?:/);
    });

    it('renders ShoppableReelBadge for reels with tagged products', () => {
      const source = fs.readFileSync(reelViewerPath, 'utf8');
      expect(source).toMatch(/<ShoppableReelBadge/);
      expect(source).toMatch(/tagged_product_ids|taggedProducts/);
    });
  });
});
