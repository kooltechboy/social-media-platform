import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import ProductTaggingTray, {
  ProductTaggingTrayProps,
  DEFAULT_CARIBBEAN_PRODUCTS,
  filterProducts,
  toggleProductTag,
} from '../apps/web/src/components/commerce/product-tagging-tray';
import type { TaggedProductSummary } from '@caribbean/marketplace';

describe('Task 3: Product Tagging Tray UI Component', () => {
  const componentPath = path.join(
    process.cwd(),
    'apps/web/src/components/commerce/product-tagging-tray.tsx'
  );

  const mockProducts: TaggedProductSummary[] = [
    {
      id: 'prod-jam-01',
      title: 'Blue Mountain Peaberry Coffee',
      priceMinor: 3200,
      currency: 'USD',
      originTerritory: 'Jamaica',
      sellerId: 'seller-jam-1',
      sellerName: 'Kingston Roasters',
      inventoryCount: 15,
      isAvailable: true,
      thumbnailUrl: 'https://cdn.tukubi.com/products/coffee.jpg',
    },
    {
      id: 'prod-slu-02',
      title: 'St. Lucian Organic Cocoa Sticks',
      priceMinor: 1850,
      currency: 'USD',
      originTerritory: 'Saint Lucia',
      sellerId: 'seller-slu-1',
      sellerName: 'Soufrière Estate',
      inventoryCount: 22,
      isAvailable: true,
      thumbnailUrl: 'https://cdn.tukubi.com/products/cocoa.jpg',
    },
    {
      id: 'prod-tto-03',
      title: 'Trinidad Moruga Scorpion Sauce',
      priceMinor: 1400,
      currency: 'USD',
      originTerritory: 'Trinidad & Tobago',
      sellerId: 'seller-tto-1',
      sellerName: 'Maracas Flavors',
      inventoryCount: 8,
      isAvailable: true,
      thumbnailUrl: 'https://cdn.tukubi.com/products/sauce.jpg',
    },
    {
      id: 'prod-brb-04',
      title: 'Barbados Vintage Rum Cake',
      priceMinor: 2400,
      currency: 'USD',
      originTerritory: 'Barbados',
      sellerId: 'seller-brb-1',
      sellerName: 'Bridgetown Bakeries',
      inventoryCount: 0, // OUT OF STOCK
      isAvailable: false,
      thumbnailUrl: 'https://cdn.tukubi.com/products/cake.jpg',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Component Architecture & Export Contracts', () => {
    it('is a defined functional component with required exports', () => {
      expect(ProductTaggingTray).toBeDefined();
      expect(typeof ProductTaggingTray).toBe('function');
      expect(DEFAULT_CARIBBEAN_PRODUCTS).toBeDefined();
      expect(Array.isArray(DEFAULT_CARIBBEAN_PRODUCTS)).toBe(true);
      expect(DEFAULT_CARIBBEAN_PRODUCTS.length).toBeGreaterThan(0);
      expect(typeof filterProducts).toBe('function');
      expect(typeof toggleProductTag).toBe('function');
    });

    it('component source file exists on disk and is not empty', () => {
      expect(fs.existsSync(componentPath)).toBe(true);
      const source = fs.readFileSync(componentPath, 'utf8');
      expect(source.length).toBeGreaterThan(100);
    });
  });

  describe('2. WCAG 2.2 AA Accessibility & ARIA Specifications', () => {
    it('enforces ARIA landmarks, roles, and live region announcements', () => {
      const source = fs.readFileSync(componentPath, 'utf8');
      expect(source).toContain('role="region"');
      expect(source).toContain('aria-label="Product Tagging Tray"');
      expect(source).toContain('aria-live="polite"');
    });

    it('provides accessible remove labels for tagged chips', () => {
      const source = fs.readFileSync(componentPath, 'utf8');
      expect(source).toMatch(/aria-label=\{?`?Remove\s+/i);
    });

    it('enforces minimum 44x44px touch targets on interactive controls', () => {
      const source = fs.readFileSync(componentPath, 'utf8');
      expect(source).toMatch(/min-h-\[44px\]|h-11|min-w-\[44px\]|w-11|p-3/);
    });

    it('handles Escape keyboard event to dismiss tray', () => {
      const source = fs.readFileSync(componentPath, 'utf8');
      expect(source).toMatch(/key === 'Escape'|e\.key === 'Escape'/);
    });
  });

  describe('3. Caribbean Futurism Theme Token Compliance', () => {
    it('incorporates authentic TUKUBI brand palette tokens', () => {
      const source = fs.readFileSync(componentPath, 'utf8');
      expect(source).toContain('brand-dusk');
      expect(source).toContain('brand-sunriseCoral');
      expect(source).toContain('brand-caribbeanSea');
      expect(source).toContain('brand-sandstone');
    });
  });

  describe('4. Tag Management Logic & Limit Constraints', () => {
    it('adds an unselected product to the selected list if under max limit', () => {
      const result = toggleProductTag([], mockProducts[0], 5);
      expect(result.next).toHaveLength(1);
      expect(result.next[0].id).toBe('prod-jam-01');
      expect(result.error).toBeUndefined();
    });

    it('removes an already selected product when toggled', () => {
      const initial = [mockProducts[0], mockProducts[1]];
      const result = toggleProductTag(initial, mockProducts[0], 5);
      expect(result.next).toHaveLength(1);
      expect(result.next[0].id).toBe('prod-slu-02');
      expect(result.error).toBeUndefined();
    });

    it('prevents adding beyond maxTags (default 5) and returns limit warning', () => {
      const fullList: TaggedProductSummary[] = [
        { id: 'p1', title: 'P1', priceMinor: 100 },
        { id: 'p2', title: 'P2', priceMinor: 200 },
        { id: 'p3', title: 'P3', priceMinor: 300 },
        { id: 'p4', title: 'P4', priceMinor: 400 },
        { id: 'p5', title: 'P5', priceMinor: 500 },
      ];
      const result = toggleProductTag(fullList, mockProducts[0], 5);
      expect(result.next).toHaveLength(5);
      expect(result.error).toMatch(/maximum 5 products/i);
    });

    it('disallows tagging an out-of-stock or unavailable product', () => {
      const outOfStock = mockProducts[3]; // inventoryCount: 0, isAvailable: false
      const result = toggleProductTag([], outOfStock, 5);
      expect(result.next).toHaveLength(0);
      expect(result.error).toMatch(/out of stock|unavailable/i);
    });
  });

  describe('5. Search & Filtering Primitives', () => {
    it('filters products by title case-insensitively', () => {
      const results = filterProducts(mockProducts, 'peaberry');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('prod-jam-01');
    });

    it('filters products by origin territory', () => {
      const results = filterProducts(mockProducts, 'Saint Lucia');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('prod-slu-02');
    });

    it('filters products by sellerId if specified', () => {
      const results = filterProducts(mockProducts, '', 'seller-tto-1');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('prod-tto-03');
    });

    it('returns all matching products when query is empty', () => {
      const results = filterProducts(mockProducts, '');
      expect(results).toHaveLength(mockProducts.length);
    });
  });

  describe('6. VDOM Structure & Integration Verification', () => {
    it('renders selected tags chips, counter, and clear all button', () => {
      const onTagsChange = vi.fn();
      const vdom = ProductTaggingTray({
        selectedProducts: [mockProducts[0], mockProducts[1]],
        onTagsChange,
        maxTags: 5,
      });

      expect(vdom).not.toBeNull();
      const serialized = JSON.stringify(vdom);
      expect(serialized).toContain('Tagged: 2/5');
      expect(serialized).toContain('Blue Mountain Peaberry Coffee');
      expect(serialized).toContain('St. Lucian Organic Cocoa Sticks');
      expect(serialized).toContain('Clear All');
    });

    it('renders out-of-stock indicator and disables selection button', () => {
      const onTagsChange = vi.fn();
      const vdom = ProductTaggingTray({
        selectedProducts: [],
        onTagsChange,
        onSearch: async () => mockProducts,
      });

      const serialized = JSON.stringify(vdom);
      expect(serialized).toContain('Sold Out');
      expect(serialized).toContain('Barbados Vintage Rum Cake');
    });

    it('renders Caribbean territory badges for items', () => {
      const onTagsChange = vi.fn();
      const vdom = ProductTaggingTray({
        selectedProducts: [],
        onTagsChange,
      });

      const serialized = JSON.stringify(vdom);
      expect(serialized).toContain('Jamaica');
    });

    it('renders search input with clear button and accessible placeholder', () => {
      const onTagsChange = vi.fn();
      const vdom = ProductTaggingTray({
        selectedProducts: [],
        onTagsChange,
      });

      const serialized = JSON.stringify(vdom);
      expect(serialized).toContain('Search Caribbean products');
      expect(serialized).toContain('aria-label');
    });
  });
});
