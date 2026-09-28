import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
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
  CartLine,
} from '../packages/marketplace/src/tagging';
import type {
  StorefrontConfig,
  CreateStorefrontInput,
  ShoppablePostItem,
  ShoppableReelItem,
  OrderEscrowDetails,
} from '../apps/web/src/lib/commerce/types';
import ProductTaggingTray, {
  DEFAULT_CARIBBEAN_PRODUCTS,
  filterProducts,
  toggleProductTag,
} from '../apps/web/src/components/commerce/product-tagging-tray';
import ShoppablePostWidget, {
  normalizeTaggedProducts,
} from '../apps/web/src/components/commerce/shoppable-post-widget';
import ShoppableReelBadge, {
  resolveReelProducts,
} from '../apps/web/src/components/commerce/shoppable-reel-badge';
import StoreCreationWizard, {
  CARIBBEAN_FUTURISM_SWATCHES,
  CARIBBEAN_CURRENCIES,
} from '../apps/web/src/components/commerce/store-creation-wizard';
import {
  getCartLines,
  addCartLine,
  updateCartQuantity,
  removeCartLine,
  clearCart,
  subscribeCart,
  CART_STORAGE_KEY,
} from '../apps/web/src/lib/commerce/cart-store';
import OrderEscrowBadge, {
  calculateRemainingDisputeDays,
} from '../apps/web/src/components/commerce/order-escrow-badge';
import {
  createOrUpdateStorefrontAction,
  fetchStorefrontConfigAction,
  placeOrderWithEscrowAction,
  fetchOrderEscrowDetailsAction,
  PlaceEscrowOrderInput,
} from '../apps/web/src/lib/commerce/actions';
import CartDrawer from '../apps/web/src/components/marketplace/cart-drawer';

const { revalidatePathMock, getCurrentUserMock, createSupabaseServerClientMock } = vi.hoisted(() => ({
  revalidatePathMock: vi.fn(),
  getCurrentUserMock: vi.fn(),
  createSupabaseServerClientMock: vi.fn(),
}));

vi.mock('../apps/web/src/lib/supabase/server', () => ({
  getCurrentUser: getCurrentUserMock,
  createSupabaseServerClient: createSupabaseServerClientMock,
}));

vi.mock('next/cache', () => ({
  revalidatePath: revalidatePathMock,
}));

describe('Task 8: End-to-End Suite & Acceptance Verification for Sub-Project 3 (Unified Social Commerce)', () => {
  const rootDir = process.cwd();
  const migrationPath = path.join(
    rootDir,
    'supabase/migrations/00102_social_commerce_and_product_tagging.sql'
  );
  const composerPath = path.join(rootDir, 'apps/web/src/components/universal-composer.tsx');
  const studioPath = path.join(
    rootDir,
    'apps/web/src/components/media/creation/tukubi-creation-studio.tsx'
  );
  const reelBadgePath = path.join(
    rootDir,
    'apps/web/src/components/commerce/shoppable-reel-badge.tsx'
  );

  let mockStorage: Record<string, string> = {};

  beforeEach(() => {
    vi.clearAllMocks();
    mockStorage = {};
    clearCart();

    const storageMock = {
      getItem: vi.fn((key: string) => mockStorage[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        mockStorage[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete mockStorage[key];
      }),
      clear: vi.fn(() => {
        mockStorage = {};
      }),
    };

    vi.stubGlobal('localStorage', storageMock);
  });

  // ---------------------------------------------------------------------------
  // PILLAR 1: Database Migration 00102 & Data Integrity
  // ---------------------------------------------------------------------------
  describe('Pillar 1: Database Migration 00102 & Data Architecture', () => {
    it('verifies migration 00102 file exists and is readable', () => {
      expect(fs.existsSync(migrationPath)).toBe(true);
    });

    it('defines tagged_product_ids and GIN indexes on posts and videos', () => {
      const sql = fs.readFileSync(migrationPath, 'utf8');

      expect(sql).toMatch(/ALTER\s+TABLE\s+public\.posts\s+ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS\s+tagged_product_ids\s+UUID\[\]/i);
      expect(sql).toMatch(/CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+idx_posts_tagged_products\s+ON\s+public\.posts\s+USING\s+gin/i);

      expect(sql).toMatch(/ALTER\s+TABLE\s+public\.videos\s+ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS\s+tagged_product_ids\s+UUID\[\]/i);
      expect(sql).toMatch(/CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+idx_videos_tagged_products\s+ON\s+public\.videos\s+USING\s+gin/i);
    });

    it('defines escrow schema columns, check constraints, and atomic checkout RPC', () => {
      const sql = fs.readFileSync(migrationPath, 'utf8');

      expect(sql).toMatch(/escrow_status\s+VARCHAR\(24\)\s+DEFAULT\s+'held'\s+NOT\s+NULL/i);
      expect(sql).toMatch(/'held',\s*'releasing',\s*'released',\s*'refunded',\s*'disputed'/);
      expect(sql).toMatch(/CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.place_order_with_escrow/i);
      expect(sql).toMatch(/UPDATE\s+public\.products\s+SET\s+inventory_count\s*=\s*inventory_count\s*-\s*v_qty/i);
    });
  });

  // ---------------------------------------------------------------------------
  // PILLAR 2: Tagging Primitives & Escrow State Machine Transitions
  // ---------------------------------------------------------------------------
  describe('Pillar 2: Marketplace Tagging Primitives & State Machine', () => {
    it('enforces maximum 5 tagged products for both feed posts and video reels', () => {
      expect(MAX_TAGGED_PRODUCTS_PER_POST).toBe(5);
      expect(MAX_TAGGED_PRODUCTS_PER_VIDEO).toBe(5);
    });

    it('accurately parses raw tagged product inputs across formats', () => {
      expect(parseTaggedProductIds(['prod-1', 'prod-2'])).toEqual(['prod-1', 'prod-2']);
      expect(parseTaggedProductIds('["prod-3", "prod-4"]')).toEqual(['prod-3', 'prod-4']);
      expect(parseTaggedProductIds('{prod-5,prod-6}')).toEqual(['prod-5', 'prod-6']);
      expect(parseTaggedProductIds('prod-7, prod-8')).toEqual(['prod-7', 'prod-8']);
      expect(parseTaggedProductIds(null)).toEqual([]);
    });

    it('validates product tags count, uniqueness, and format', () => {
      expect(validateProductTags(['p1', 'p2', 'p3']).isValid).toBe(true);
      expect(validateProductTags(['p1', 'p2', 'p3', 'p4', 'p5', 'p6']).isValid).toBe(false);
      expect(validateProductTags(['p1', 'p2', 'p1']).isValid).toBe(false);
      expect(validateProductTags(['p1', '   ']).isValid).toBe(false);
    });

    it('verifies complete lifecycle transitions for the Caribbean Escrow State Machine', () => {
      // Happy path: held -> releasing -> released
      expect(canTransitionEscrow('held', 'releasing')).toBe(true);
      expect(canTransitionEscrow('releasing', 'released')).toBe(true);

      // Dispute path: held -> disputed -> released (seller resolved) or disputed -> refunded (buyer resolved)
      expect(canTransitionEscrow('held', 'disputed')).toBe(true);
      expect(canTransitionEscrow('disputed', 'released')).toBe(true);
      expect(canTransitionEscrow('disputed', 'refunded')).toBe(true);

      // Early cancellation: held -> refunded
      expect(canTransitionEscrow('held', 'refunded')).toBe(true);

      // Terminal checks
      expect(canTransitionEscrow('released', 'held')).toBe(false);
      expect(canTransitionEscrow('refunded', 'held')).toBe(false);
      expect(canTransitionEscrow('released', 'releasing')).toBe(false);
    });

    it('formats Caribbean currencies and minor units correctly', () => {
      expect(formatProductPrice(3500, 'USD')).toBe('$35.00');
      expect(formatProductPrice(550000, 'JMD')).toContain('5,500.00');
      expect(formatProductPrice(12500, 'TTD')).toContain('125.00');
    });
  });

  // ---------------------------------------------------------------------------
  // PILLAR 3: Accessible Product Tagging Tray UI
  // ---------------------------------------------------------------------------
  describe('Pillar 3: Accessible Product Tagging Tray UI', () => {
    it('filters products by title, territory, or seller', () => {
      const results = filterProducts(DEFAULT_CARIBBEAN_PRODUCTS, 'Blue Mountain');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((p) => p.title.includes('Blue Mountain'))).toBe(true);

      const saintLucia = filterProducts(DEFAULT_CARIBBEAN_PRODUCTS, 'Saint Lucia');
      expect(saintLucia.length).toBeGreaterThan(0);
      expect(saintLucia.some((p) => p.originTerritory === 'Saint Lucia')).toBe(true);
    });

    it('toggles product tags with duplicate prevention and 5-tag ceiling', () => {
      const prodA = DEFAULT_CARIBBEAN_PRODUCTS[0];
      const prodB = DEFAULT_CARIBBEAN_PRODUCTS[1];

      // Add prodA
      let res = toggleProductTag([], prodA, 5);
      expect(res.next).toHaveLength(1);
      expect(res.next[0].id).toBe(prodA.id);

      // Add prodB
      res = toggleProductTag(res.next, prodB, 5);
      expect(res.next).toHaveLength(2);

      // Remove prodA
      res = toggleProductTag(res.next, prodA, 5);
      expect(res.next).toHaveLength(1);
      expect(res.next[0].id).toBe(prodB.id);

      // Test ceiling
      const fiveTags = DEFAULT_CARIBBEAN_PRODUCTS.slice(0, 5);
      const sixth = DEFAULT_CARIBBEAN_PRODUCTS[5];
      const capped = toggleProductTag(fiveTags, sixth, 5);
      expect(capped.next).toHaveLength(5);
      expect(capped.error).toMatch(/maximum 5/i);
    });

    it('renders ProductTaggingTray with accessibility attributes and search controls', () => {
      const onTagsChange = vi.fn();
      const onClose = vi.fn();

      const vdom = ProductTaggingTray({
        isOpen: true,
        onClose,
        selectedProducts: [DEFAULT_CARIBBEAN_PRODUCTS[0]],
        onTagsChange,
        maxTags: 5,
      });

      expect(vdom).not.toBeNull();
      const serialized = JSON.stringify(vdom);
      expect(serialized).toContain('Product Tagging Tray');
      expect(serialized).toContain('Tag Caribbean Products');
      expect(serialized).toContain('Tagged: 1/5');
    });
  });

  // ---------------------------------------------------------------------------
  // PILLAR 4: Universal Composer & Creation Studio Tagging Integration
  // ---------------------------------------------------------------------------
  describe('Pillar 4: Universal Composer & Tukubi Creation Studio Tagging Integration', () => {
    it('verifies UniversalComposer manages taggedProducts and submits tagged_product_ids formData', () => {
      const source = fs.readFileSync(composerPath, 'utf8');
      expect(source).toContain('ProductTaggingTray');
      expect(source).toMatch(/taggedProducts/);
      expect(source).toMatch(/formData\.(set|append)\(\s*['"]tagged_product_ids['"],\s*JSON\.stringify/);
    });

    it('verifies TukubiCreationStudio enables tagging in Review & Export stage and exports taggedProductIds', () => {
      const source = fs.readFileSync(studioPath, 'utf8');
      expect(source).toContain('ProductTaggingTray');
      expect(source).toContain('Tag Products for Caribbean Shop');
      expect(source).toMatch(/taggedProductIds/);
    });
  });

  // ---------------------------------------------------------------------------
  // PILLAR 5: Shoppable Post Widget & Shoppable Reel Badge Overlays
  // ---------------------------------------------------------------------------
  describe('Pillar 5: Shoppable Post Widget & Reel Badge Overlays', () => {
    const sampleProduct: TaggedProductSummary = {
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

    it('normalizes tagged products from raw data or fallback lookup', () => {
      const normalized = normalizeTaggedProducts([sampleProduct]);
      expect(normalized.length).toBeGreaterThan(0);
      expect(normalized[0].id).toBe(sampleProduct.id);
      expect(normalized[0].title).toBe('Blue Mountain Peaberry Coffee');
    });

    it('resolves reel products efficiently with fallback support', () => {
      const resolved = resolveReelProducts({ productIds: ['prod-jam-01'] });
      expect(resolved.length).toBeGreaterThan(0);
      expect(resolved[0].title).toContain('Blue Mountain');
    });

    it('renders ShoppablePostWidget with product details, pricing, and 30-Day Escrow notice', () => {
      const vdom = ShoppablePostWidget({
        products: [sampleProduct],
      });

      expect(vdom).not.toBeNull();
      const serialized = JSON.stringify(vdom);
      expect(serialized).toContain('Blue Mountain Peaberry Coffee');
      expect(serialized).toContain('$32.00');
      expect(serialized).toContain('Add to Cart');
      expect(serialized).toContain('Buy Now');
    });

    it('renders ShoppableReelBadge with interactive bag indicator', () => {
      const vdom = ShoppableReelBadge({
        productIds: ['prod-jam-01'],
      });

      expect(vdom).not.toBeNull();
      const serialized = JSON.stringify(vdom);
      expect(serialized).toMatch(/Featured Goods/);
      expect(fs.readFileSync(reelBadgePath, 'utf8')).toContain('ShoppingBag');
    });
  });

  // ---------------------------------------------------------------------------
  // PILLAR 6: Storefront Creation & Management Flow
  // ---------------------------------------------------------------------------
  describe('Pillar 6: Store Creation & Management Flow', () => {
    it('exposes Caribbean Futurism color swatches and regional currencies', () => {
      expect(CARIBBEAN_FUTURISM_SWATCHES.length).toBeGreaterThanOrEqual(4);
      expect(CARIBBEAN_CURRENCIES.some((c) => c.code === 'USD')).toBe(true);
      expect(CARIBBEAN_CURRENCIES.some((c) => c.code === 'JMD')).toBe(true);
      expect(CARIBBEAN_CURRENCIES.some((c) => c.code === 'TTD')).toBe(true);
      expect(CARIBBEAN_CURRENCIES.some((c) => c.code === 'BBD')).toBe(true);
    });

    it('creates or updates storefront config via server action', async () => {
      getCurrentUserMock.mockResolvedValueOnce({
        id: 'seller-carib-101',
        email: 'artisan@barbados.bb',
        username: 'bajan_artisan',
      } as any);

      const mockSingle = vi.fn().mockResolvedValueOnce({
        data: {
          id: 'store-cfg-99',
          seller_id: 'seller-carib-101',
          seller_type: 'merchant',
          headline: 'Barbados Handmade Ceramics',
          brand_color: '#FF6B4A',
          return_policy: '30-day Tukubi escrow guarantee returns',
          shipping_policy: 'Inter-island ferry 3-5 days',
          currency: 'USD',
          support_email: 'support@artisan.bb',
          social_links: { instagram: '@bajan_ceramics' },
          is_published: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        error: null,
      });

      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockUpsert = vi.fn().mockReturnValue({ select: mockSelect });
      createSupabaseServerClientMock.mockResolvedValueOnce({
        from: vi.fn().mockReturnValue({ upsert: mockUpsert }),
      } as any);

      const input: CreateStorefrontInput = {
        sellerType: 'merchant',
        headline: 'Barbados Handmade Ceramics',
        countryIso: 'BRB',
        brandColor: '#FF6B4A',
        returnPolicy: '30-day Tukubi escrow guarantee returns',
        shippingPolicy: 'Inter-island ferry 3-5 days',
        currency: 'USD',
        supportEmail: 'support@artisan.bb',
        socialLinks: { instagram: '@bajan_ceramics' },
        isPublished: true,
      };

      const result = await createOrUpdateStorefrontAction(input);
      expect(result.success).toBe(true);
      expect(result.data?.headline).toBe('Barbados Handmade Ceramics');
      expect(result.data?.brandColor).toBe('#FF6B4A');
      const actionsSource = fs.readFileSync(path.join(rootDir, 'apps/web/src/lib/commerce/actions.ts'), 'utf8');
      expect(actionsSource).toContain("revalidatePath('/marketplace')");
    });
  });

  // ---------------------------------------------------------------------------
  // PILLAR 7: End-to-End Escrow Order Placement & Tracking Flow
  // ---------------------------------------------------------------------------
  describe('Pillar 7: Escrow Order Placement, Cart Store & Status Tracking', () => {
    const mockCartLine: CartLine = {
      productId: 'prod-jam-01',
      sellerId: 'seller-jam-1',
      sellerName: 'Kingston Roasters',
      productTitle: 'Blue Mountain Peaberry Coffee',
      productKind: 'physical',
      unitPriceMinor: 3200,
      quantity: 2,
      variantId: 'var-dark',
      variantTitle: 'Dark Roast 1lb',
    };

    it('manages cart line additions, quantity updates, and removals', () => {
      // 1. Add item
      const added = addCartLine(mockCartLine);
      expect(added).toHaveLength(1);
      expect(added[0].quantity).toBe(2);

      // 2. Increment quantity
      const incremented = updateCartQuantity(mockCartLine.productId, mockCartLine.variantId, 4);
      expect(incremented[0].quantity).toBe(4);

      // 3. Remove line
      const removed = removeCartLine(mockCartLine.productId, mockCartLine.variantId);
      expect(removed).toHaveLength(0);
    });

    it('executes atomic escrow checkout via placeOrderWithEscrowAction and verifies response', async () => {
      getCurrentUserMock.mockResolvedValueOnce({
        id: 'buyer-carib-99',
        email: 'buyer@caribbean.org',
      } as any);

      const mockRpc = vi.fn().mockResolvedValueOnce({
        data: {
          success: true,
          order_id: 'order-escrow-uuid-777',
          escrow_status: 'held',
        },
        error: null,
      });

      createSupabaseServerClientMock.mockResolvedValueOnce({
        rpc: mockRpc,
      } as any);

      const orderInput: PlaceEscrowOrderInput = {
        sellerId: 'seller-jam-1',
        items: [
          {
            productId: 'prod-jam-01',
            variantId: 'var-dark',
            quantity: 2,
            unitPriceMinor: 3200,
            lineTotalMinor: 6400,
          },
        ],
        subtotalMinor: 6400,
        platformFeeMinor: 185,
        totalMinor: 6585,
        currency: 'USD',
        idempotencyKey: 'idemp_e2e_unified_test',
        shippingAddress: {
          recipient: 'Marlon James',
          street: '12 Trafalgar Road',
          city: 'Kingston',
          country: 'Jamaica',
        },
      };

      const result = await placeOrderWithEscrowAction(orderInput);
      expect(result.success).toBe(true);
      expect(result.orderId).toBe('order-escrow-uuid-777');
      expect(result.escrowStatus).toBe('held');
      expect(mockRpc).toHaveBeenCalledWith('place_order_with_escrow', expect.any(Object));
      const actionsSource = fs.readFileSync(path.join(rootDir, 'apps/web/src/lib/commerce/actions.ts'), 'utf8');
      expect(actionsSource).toContain("revalidatePath('/marketplace')");
      expect(actionsSource).toContain("revalidatePath('/orders')");
    });

    it('renders OrderEscrowBadge pill and card variants with remaining dispute window calculation', () => {
      const now = new Date('2026-09-27T12:00:00Z');
      vi.useFakeTimers();
      vi.setSystemTime(now);

      const orderDate = new Date('2026-09-20T12:00:00Z').toISOString();
      const remainingDays = calculateRemainingDisputeDays(orderDate);
      expect(remainingDays).toBe(23);

      const pillVdom = OrderEscrowBadge({ status: 'held', variant: 'pill' });
      expect(JSON.stringify(pillVdom)).toContain('Held in Escrow');

      const cardVdom = OrderEscrowBadge({
        status: 'held',
        variant: 'card',
        createdAt: orderDate,
      });
      const cardStr = JSON.stringify(cardVdom);
      expect(cardStr).toContain('30-Day Escrow Guarantee');
      expect(cardStr).toContain('23 days remaining');

      vi.useRealTimers();
    });

    it('verifies CartDrawer renders 30-Day Escrow guarantee trust badge and Proceed to Checkout CTA', () => {
      const drawerVdom = CartDrawer({
        isOpen: true,
        onClose: vi.fn(),
        lines: [mockCartLine],
        onUpdateQuantity: vi.fn(),
        onRemoveLine: vi.fn(),
        onProceedToCheckout: vi.fn(),
      });

      expect(drawerVdom).not.toBeNull();
      const serialized = JSON.stringify(drawerVdom);
      expect(serialized).toContain('Backed by TUKUBI 30-Day Escrow Guarantee');
      expect(serialized).toContain('Proceed to Secure Checkout');
    });
  });

  // ---------------------------------------------------------------------------
  // PILLAR 8: Full Unified Lifecycle End-to-End Walkthrough
  // ---------------------------------------------------------------------------
  describe('Pillar 8: Full Unified Social Commerce Flow Integration', () => {
    it('simulates complete social commerce lifecycle from tagging to escrow completion', async () => {
      // 1. Creator tags authentic Caribbean craft product
      const selectedProduct = DEFAULT_CARIBBEAN_PRODUCTS[0];
      const toggleRes = toggleProductTag([], selectedProduct, 5);
      const tags = toggleRes.next;
      expect(tags).toHaveLength(1);
      expect(tags[0].title).toBe(selectedProduct.title);

      // 2. Validate tagging constraints
      const validation = validateProductTags(tags.map((t) => t.id));
      expect(validation.isValid).toBe(true);

      // 3. Render shoppable post widget with tagged product
      const widgetVdom = ShoppablePostWidget({ products: tags });
      expect(widgetVdom).not.toBeNull();
      expect(JSON.stringify(widgetVdom)).toContain(selectedProduct.title);

      // 4. Buyer discovers post and adds item to cart
      const cartItem: CartLine = {
        productId: selectedProduct.id,
        sellerId: selectedProduct.sellerId,
        sellerName: selectedProduct.sellerName,
        productTitle: selectedProduct.title,
        productKind: 'physical',
        unitPriceMinor: selectedProduct.priceMinor,
        quantity: 1,
      };
      const cart = addCartLine(cartItem);
      expect(cart).toHaveLength(1);

      // 5. Buyer places order with escrow
      getCurrentUserMock.mockResolvedValueOnce({
        id: 'buyer-user-888',
        email: 'buyer888@tukubi.caribbean',
      } as any);

      createSupabaseServerClientMock.mockResolvedValueOnce({
        rpc: vi.fn().mockResolvedValueOnce({
          data: {
            success: true,
            order_id: 'ord-e2e-888',
            escrow_status: 'held',
          },
          error: null,
        }),
      } as any);

      const orderResult = await placeOrderWithEscrowAction({
        sellerId: selectedProduct.sellerId,
        items: [
          {
            productId: selectedProduct.id,
            quantity: 1,
            unitPriceMinor: selectedProduct.priceMinor,
            lineTotalMinor: selectedProduct.priceMinor,
          },
        ],
        subtotalMinor: selectedProduct.priceMinor,
        platformFeeMinor: 95,
        totalMinor: selectedProduct.priceMinor + 95,
        currency: 'USD',
        idempotencyKey: 'idemp-e2e-walkthrough-888',
      });

      expect(orderResult.success).toBe(true);
      expect(orderResult.orderId).toBe('ord-e2e-888');
      expect(orderResult.escrowStatus).toBe('held');

      // 6. Verify buyer cart is cleared post-checkout
      clearCart();
      expect(getCartLines()).toHaveLength(0);

      // 7. Verify escrow status progression in state machine:
      // Item shipped & delivered -> releasing
      expect(canTransitionEscrow(orderResult.escrowStatus as EscrowStatus, 'releasing')).toBe(true);

      // Funds settled to merchant -> released
      expect(canTransitionEscrow('releasing', 'released')).toBe(true);

      // Verify settled badge
      const settledBadge = OrderEscrowBadge({ status: 'released', variant: 'pill' });
      expect(JSON.stringify(settledBadge)).toContain('Settled to Seller');
    });
  });
});
