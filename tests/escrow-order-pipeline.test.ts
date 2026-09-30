import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { CartLine, EscrowStatus } from '@caribbean/marketplace';
import {
  getCartLines,
  addCartLine,
  updateCartQuantity,
  removeCartLine,
  clearCart,
  subscribeCart,
  CART_STORAGE_KEY,
  CART_CHANGE_EVENT,
  CART_ADD_EVENT,
} from '../apps/web/src/lib/commerce/cart-store';
import OrderEscrowBadge, {
  OrderEscrowBadgeProps,
  calculateRemainingDisputeDays,
} from '../apps/web/src/components/commerce/order-escrow-badge';
import {
  placeOrderWithEscrowAction,
  fetchOrderEscrowDetailsAction,
  type PlaceEscrowOrderInput,
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

describe('Task 7: Escrow Order Pipeline, Cart Store & Escrow Status Tracking', () => {
  const rootDir = process.cwd();
  const cartStorePath = path.join(rootDir, 'apps/web/src/lib/commerce/cart-store.ts');
  const escrowBadgePath = path.join(rootDir, 'apps/web/src/components/commerce/order-escrow-badge.tsx');
  const actionsFilePath = path.join(rootDir, 'apps/web/src/lib/commerce/actions.ts');
  const cartDrawerPath = path.join(rootDir, 'apps/web/src/components/marketplace/cart-drawer.tsx');

  const mockCartLine1: CartLine = {
    productId: 'prod-jam-coffee-1',
    sellerId: 'seller-jam-101',
    sellerName: 'Blue Mountain Coffee Estate',
    productTitle: 'Blue Mountain Whole Bean 1lb',
    productKind: 'physical',
    unitPriceMinor: 2800,
    quantity: 2,
    variantId: 'var-1',
    variantTitle: 'Dark Roast',
  };

  const mockCartLine2: CartLine = {
    productId: 'prod-slu-cocoa-2',
    sellerId: 'seller-slu-202',
    sellerName: 'St. Lucia Cocoa Guild',
    productTitle: 'Organic Cacao Sticks Pack of 5',
    productKind: 'physical',
    unitPriceMinor: 1500,
    quantity: 1,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. File Existence & Architecture', () => {
    it('verifies all deliverable files exist on disk', () => {
      expect(fs.existsSync(cartStorePath)).toBe(true);
      expect(fs.existsSync(escrowBadgePath)).toBe(true);
      expect(fs.existsSync(actionsFilePath)).toBe(true);
      expect(fs.existsSync(cartDrawerPath)).toBe(true);
    });
  });

  describe('2. Client Cart Store (cart-store.ts)', () => {
    let mockStorage: Record<string, string> = {};

    beforeEach(() => {
      mockStorage = {};
      clearCart();

      // Mock window and localStorage
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

    it('defines standard cart storage key and custom event constants', () => {
      expect(CART_STORAGE_KEY).toBe('tukubi_cart');
      expect(CART_CHANGE_EVENT).toBe('tukubi:cart:change');
      expect(CART_ADD_EVENT).toBe('tukubi:cart:add');
    });

    it('returns empty array when cart storage is empty', () => {
      const lines = getCartLines();
      expect(lines).toEqual([]);
    });

    it('adds item to cart and persists to localStorage', () => {
      const updated = addCartLine(mockCartLine1);
      expect(updated).toHaveLength(1);
      expect(updated[0].productId).toBe('prod-jam-coffee-1');
      expect(updated[0].quantity).toBe(2);

      const retrieved = getCartLines();
      expect(retrieved).toHaveLength(1);
      expect(retrieved[0].productId).toBe('prod-jam-coffee-1');
      expect(retrieved[0].variantId).toBe('var-1');
    });

    it('increments quantity when existing item with same variant is added, capped at 20', () => {
      addCartLine(mockCartLine1); // qty 2
      const updated = addCartLine({ ...mockCartLine1, quantity: 3 }); // now 5
      expect(updated[0].quantity).toBe(5);

      // Attempt to add 18 more (5 + 18 = 23 -> capped at 20)
      const capped = addCartLine({ ...mockCartLine1, quantity: 18 });
      expect(capped[0].quantity).toBe(20);
    });

    it('updates quantity and removes line if quantity becomes <= 0', () => {
      addCartLine(mockCartLine1);
      addCartLine(mockCartLine2);
      expect(getCartLines()).toHaveLength(2);

      // Update quantity to 4
      const updated = updateCartQuantity(mockCartLine1.productId, mockCartLine1.variantId, 4);
      const line1 = updated.find((l) => l.productId === mockCartLine1.productId);
      expect(line1?.quantity).toBe(4);

      // Update quantity to 0 removes the item
      const afterZero = updateCartQuantity(mockCartLine1.productId, mockCartLine1.variantId, 0);
      expect(afterZero.find((l) => l.productId === mockCartLine1.productId)).toBeUndefined();
      expect(afterZero).toHaveLength(1);
    });

    it('removes item by productId and variantId', () => {
      addCartLine(mockCartLine1);
      addCartLine(mockCartLine2);
      expect(getCartLines()).toHaveLength(2);

      const remaining = removeCartLine(mockCartLine2.productId, mockCartLine2.variantId);
      expect(remaining).toHaveLength(1);
      expect(remaining[0].productId).toBe(mockCartLine1.productId);
    });

    it('clears all items on clearCart()', () => {
      addCartLine(mockCartLine1);
      addCartLine(mockCartLine2);
      expect(getCartLines()).toHaveLength(2);

      clearCart();
      expect(getCartLines()).toHaveLength(0);
      expect(mockStorage[CART_STORAGE_KEY]).toBeUndefined();
    });

    it('subscribes to cart changes and dispatches custom events', () => {
      const listener = vi.fn();
      const unsubscribe = subscribeCart(listener);

      addCartLine(mockCartLine1);
      expect(listener).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({ productId: 'prod-jam-coffee-1' }),
      ]));

      updateCartQuantity(mockCartLine1.productId, mockCartLine1.variantId, 3);
      expect(listener).toHaveBeenCalledTimes(2);

      unsubscribe();
      addCartLine(mockCartLine2);
      // Listener should not be called again after unsubscribe
      expect(listener).toHaveBeenCalledTimes(2);
    });
  });

  describe('3. Order Escrow Badge Component (order-escrow-badge.tsx)', () => {
    it('calculates remaining dispute days accurately based on 30-day window', () => {
      const now = new Date('2026-09-27T12:00:00Z');
      vi.useFakeTimers();
      vi.setSystemTime(now);

      // Created 5 days ago -> 25 days remaining
      const created5DaysAgo = new Date('2026-09-22T12:00:00Z').toISOString();
      expect(calculateRemainingDisputeDays(created5DaysAgo)).toBe(25);

      // Created 30 days ago -> 0 days remaining
      const created30DaysAgo = new Date('2026-08-28T12:00:00Z').toISOString();
      expect(calculateRemainingDisputeDays(created30DaysAgo)).toBe(0);

      // Created 35 days ago -> 0 days remaining (never negative)
      const created35DaysAgo = new Date('2026-08-23T12:00:00Z').toISOString();
      expect(calculateRemainingDisputeDays(created35DaysAgo)).toBe(0);

      vi.useRealTimers();
    });

    it('renders compact pill variant for each of the 5 escrow states', () => {
      const statuses: EscrowStatus[] = ['held', 'releasing', 'released', 'refunded', 'disputed'];

      for (const status of statuses) {
        const vdom = OrderEscrowBadge({ status, variant: 'pill' });
        expect(vdom).not.toBeNull();
        const json = JSON.stringify(vdom);
        expect(json).toContain('role');
        expect(json).toContain('status');
      }

      const heldVdom = OrderEscrowBadge({ status: 'held', variant: 'pill' });
      expect(JSON.stringify(heldVdom)).toContain('Held in Escrow');

      const releasedVdom = OrderEscrowBadge({ status: 'released', variant: 'pill' });
      expect(JSON.stringify(releasedVdom)).toContain('Settled to Seller');

      const disputedVdom = OrderEscrowBadge({ status: 'disputed', variant: 'pill' });
      expect(JSON.stringify(disputedVdom)).toContain('Under Mediation');
    });

    it('renders expanded card variant with 30-day guarantee info and countdown', () => {
      const createdAt = new Date().toISOString();
      const vdom = OrderEscrowBadge({
        status: 'held',
        variant: 'card',
        createdAt,
      });

      expect(vdom).not.toBeNull();
      const json = JSON.stringify(vdom);
      expect(json).toContain('30-Day Escrow Guarantee');
      expect(json).toContain('days remaining');
    });
  });

  describe('4. Escrow Order Server Actions (actions.ts)', () => {
    const mockOrderInput: PlaceEscrowOrderInput = {
      sellerId: 'seller-jam-101',
      items: [
        {
          productId: 'prod-jam-coffee-1',
          variantId: 'var-1',
          quantity: 2,
          unitPriceMinor: 2800,
          lineTotalMinor: 5600,
        },
      ],
      subtotalMinor: 5600,
      platformFeeMinor: 162,
      totalMinor: 5762,
      currency: 'USD',
      idempotencyKey: 'idemp_test_123',
      shippingAddress: {
        recipient: 'Keisha Campbell',
        street: '14 Hope Road',
        city: 'Kingston',
        country: 'Jamaica',
      },
    };

    it('rejects unauthenticated user when placing order', async () => {
      getCurrentUserMock.mockResolvedValueOnce(null as any);

      const result = await placeOrderWithEscrowAction(mockOrderInput);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Authentication required');
    });

    it('rejects order with empty items list', async () => {
      getCurrentUserMock.mockResolvedValueOnce({
        id: 'buyer-user-77',
        email: 'buyer@tukubi.com',
      } as any);

      const result = await placeOrderWithEscrowAction({
        ...mockOrderInput,
        items: [],
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Order must contain at least one line item');
    });

    it('successfully calls place_order_with_escrow RPC and revalidates marketplace paths', async () => {
      getCurrentUserMock.mockResolvedValueOnce({
        id: 'buyer-user-77',
        email: 'buyer@tukubi.com',
      } as any);

      const mockRpc = vi.fn().mockResolvedValueOnce({
        data: {
          success: true,
          order_id: 'ord_uuid_888',
          escrow_status: 'held',
        },
        error: null,
      });

      createSupabaseServerClientMock.mockResolvedValueOnce({
        rpc: mockRpc,
      } as any);

      const result = await placeOrderWithEscrowAction(mockOrderInput);

      expect(result.success).toBe(true);
      expect(result.orderId).toBe('ord_uuid_888');
      expect(result.escrowStatus).toBe('held');

      expect(mockRpc).toHaveBeenCalledWith('place_order_with_escrow', {
        p_buyer_id: 'buyer-user-77',
        p_seller_id: 'seller-jam-101',
        p_items: [
          {
            product_id: 'prod-jam-coffee-1',
            variant_id: 'var-1',
            quantity: 2,
            unit_price_minor: 2800,
            line_total_minor: 5600,
          },
        ],
        p_subtotal_minor: 5600,
        p_platform_fee_minor: 162,
        p_total_minor: 5762,
        p_currency: 'USD',
        p_idempotency_key: 'idemp_test_123',
        p_shipping_address: expect.objectContaining({
          recipient: 'Keisha Campbell',
        }),
      });

      // Verify revalidation calls or source implementation
      const actionsSource = fs.readFileSync(actionsFilePath, 'utf8');
      expect(actionsSource).toContain("revalidatePath('/marketplace')");
      expect(actionsSource).toContain("revalidatePath('/orders')");
      expect(actionsSource).toContain("revalidatePath('/purchases')");
    });

    it('handles RPC errors gracefully during order placement', async () => {
      getCurrentUserMock.mockResolvedValueOnce({
        id: 'buyer-user-77',
      } as any);

      createSupabaseServerClientMock.mockResolvedValueOnce({
        rpc: vi.fn().mockResolvedValueOnce({
          data: null,
          error: { message: 'Insufficient stock for product prod-jam-coffee-1.' },
        }),
      } as any);

      const result = await placeOrderWithEscrowAction(mockOrderInput);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Insufficient stock');
    });

    it('fetches escrow details for an existing order', async () => {
      const mockSingle = vi.fn().mockResolvedValueOnce({
        data: {
          id: 'ord_uuid_888',
          buyer_id: 'buyer-user-77',
          seller_id: 'seller-jam-101',
          escrow_status: 'held',
          total_minor: 5762,
          currency: 'USD',
          created_at: '2026-09-27T14:30:00Z',
          escrow_released_at: null,
          dispute_reason: null,
        },
        error: null,
      });

      const mockEq = vi.fn().mockReturnValue({ maybeSingle: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

      createSupabaseServerClientMock.mockResolvedValueOnce({
        from: mockFrom,
      } as any);

      const details = await fetchOrderEscrowDetailsAction('ord_uuid_888');
      expect(details).not.toBeNull();
      expect(details?.orderId).toBe('ord_uuid_888');
      expect(details?.escrowStatus).toBe('held');
      expect(details?.totalMinor).toBe(5762);
      expect(mockFrom).toHaveBeenCalledWith('orders');
    });

    it('returns null when fetching escrow details with invalid ID or query error', async () => {
      expect(await fetchOrderEscrowDetailsAction('')).toBeNull();

      createSupabaseServerClientMock.mockResolvedValueOnce({
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValueOnce({ data: null, error: { message: 'Not found' } }),
            }),
          }),
        }),
      } as any);

      expect(await fetchOrderEscrowDetailsAction('non-existent')).toBeNull();
    });
  });

  describe('5. CartDrawer Component Integration (cart-drawer.tsx)', () => {
    it('renders escrow trust badge and checkout CTA in CartDrawer', () => {
      const onUpdateQuantity = vi.fn();
      const onRemoveLine = vi.fn();
      const onClose = vi.fn();
      const onProceedToCheckout = vi.fn();

      const vdom = CartDrawer({
        isOpen: true,
        onClose,
        lines: [mockCartLine1],
        onUpdateQuantity,
        onRemoveLine,
        onProceedToCheckout,
      });

      expect(vdom).not.toBeNull();
      const json = JSON.stringify(vdom);
      // Confirms 30-day escrow guarantee is present and checkout cta is rendered
      expect(json).toContain('Escrow');
      expect(json).toContain('Backed by TUKUBI 30-Day Escrow Guarantee');
      expect(json).toContain('Proceed to Secure Checkout');
    });

    it('renders pre-launch notification when marketplace transactions are not active and onProceedToCheckout is omitted', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-09-29T12:00:00Z'));
      try {
        const vdom = CartDrawer({
          isOpen: true,
          onClose: vi.fn(),
          lines: [mockCartLine1],
          onUpdateQuantity: vi.fn(),
          onRemoveLine: vi.fn(),
        });

        const json = JSON.stringify(vdom);
        expect(json).toContain('Transactions Begin Sept 30');
        expect(json).toContain('Escrow');
      } finally {
        vi.useRealTimers();
      }
    });
  });
});
