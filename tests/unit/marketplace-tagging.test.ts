import { describe, it, expect } from 'vitest';
import { searchMarketplaceProductsAction } from '../../apps/web/src/lib/marketplace/actions';
import { filterProducts, toggleProductTag } from '../../apps/web/src/components/commerce/product-tagging-tray';
import type { TaggedProductSummary } from '@caribbean/marketplace';

describe('Marketplace Product Tagging (Zero-Mock)', () => {
  it('searchMarketplaceProductsAction handles empty or offline gracefully', async () => {
    const result = await searchMarketplaceProductsAction('nonexistent-item-xyz', 5);
    expect(result).toHaveProperty('products');
    expect(Array.isArray(result.products)).toBe(true);
  });

  it('filterProducts correctly filters products by title, territory, and seller', () => {
    const sample: TaggedProductSummary[] = [
      {
        id: 'prod-1',
        title: 'Blue Mountain Coffee',
        priceMinor: 3200,
        currency: 'USD',
        originCountry: 'Jamaica',
        originTerritory: 'Jamaica',
        sellerId: 's1',
        sellerName: 'Kingston Roasters',
        isAvailable: true,
      },
      {
        id: 'prod-2',
        title: 'Nutmeg Spice Set',
        priceMinor: 1500,
        currency: 'USD',
        originCountry: 'Grenada',
        originTerritory: 'Grenada',
        sellerId: 's2',
        sellerName: 'Spice Isle Harvest',
        isAvailable: true,
      },
    ];

    expect(filterProducts(sample, 'Coffee')).toHaveLength(1);
    expect(filterProducts(sample, 'Coffee')[0].id).toBe('prod-1');
    expect(filterProducts(sample, 'Grenada')).toHaveLength(1);
    expect(filterProducts(sample, 'Grenada')[0].id).toBe('prod-2');
    expect(filterProducts(sample, '', 's1')).toHaveLength(1);
    expect(filterProducts(sample, 'nonexistent')).toHaveLength(0);
  });

  it('toggleProductTag prevents tagging unavailable or out-of-stock items', () => {
    const outOfStock: TaggedProductSummary = {
      id: 'p-out',
      title: 'Sold Out Item',
      priceMinor: 1000,
      inventoryCount: 0,
      isAvailable: false,
    };

    const res = toggleProductTag([], outOfStock);
    expect(res.next).toHaveLength(0);
    expect(res.error).toBeDefined();
    expect(res.error).toContain('out of stock');
  });

  it('toggleProductTag enforces maximum tag limits', () => {
    const selected: TaggedProductSummary[] = [
      { id: '1', title: 'P1', priceMinor: 100 },
      { id: '2', title: 'P2', priceMinor: 100 },
    ];
    const newProd: TaggedProductSummary = { id: '3', title: 'P3', priceMinor: 100, isAvailable: true };

    const res = toggleProductTag(selected, newProd, 2);
    expect(res.next).toHaveLength(2);
    expect(res.error).toContain('Maximum 2 products');
  });

  it('toggleProductTag toggles selection on and off', () => {
    const p1: TaggedProductSummary = { id: '1', title: 'P1', priceMinor: 100, isAvailable: true };
    const res1 = toggleProductTag([], p1, 5);
    expect(res1.next).toHaveLength(1);
    expect(res1.next[0].id).toBe('1');

    const res2 = toggleProductTag(res1.next, p1, 5);
    expect(res2.next).toHaveLength(0);
  });
});
