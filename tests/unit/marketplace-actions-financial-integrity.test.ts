import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getCurrentUser, createSupabaseServerClient, createServiceSupabaseClient } = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  createSupabaseServerClient: vi.fn(),
  createServiceSupabaseClient: vi.fn(),
}));

vi.mock('../../apps/web/src/lib/supabase/server', () => ({
  createSupabaseServerClient,
  createServiceSupabaseClient,
  getCurrentUser,
}));

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

function formData(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

function chain(result: { data?: unknown; error?: unknown }) {
  const value = {
    insert: vi.fn(() => value),
    update: vi.fn(() => value),
    delete: vi.fn(() => value),
    select: vi.fn(() => value),
    eq: vi.fn(() => value),
    maybeSingle: vi.fn(async () => result),
    single: vi.fn(async () => result),
    order: vi.fn(() => value),
    limit: vi.fn(async () => result),
    like: vi.fn(() => value),
  };
  return value;
}

describe('marketplace checkout financial integrity', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getCurrentUser.mockResolvedValue({ id: 'buyer-1' });
  });

  it('returns a validation error instead of throwing for malformed shipping data', async () => {
    createSupabaseServerClient.mockResolvedValue({
      from: vi.fn(() => chain({
        data: {
          id: 'product-1', title: 'Coffee', price_minor: 100, currency: 'USD',
          product_kind: 'physical', seller_id: 'seller-1', inventory_count: 1, is_active: true,
        }, error: null,
      })),
    });
    const { createOrderAction } = await import('../../apps/web/src/lib/marketplace/actions');

    const result = await createOrderAction(
      { error: null, success: null },
      formData({ productId: 'product-1', quantity: '1', shippingAddress: '{invalid' }),
    );

    expect(result).toEqual({ error: 'Invalid shipping address.', success: null });
  });

  it('rejects quantities that are not whole-number input', async () => {
    const { createOrderAction } = await import('../../apps/web/src/lib/marketplace/actions');

    const result = await createOrderAction(
      { error: null, success: null },
      formData({ productId: 'product-1', quantity: '1x' }),
    );

    expect(result).toEqual({ error: 'Invalid quantity.', success: null });
  });

  it('creates pending payment records and never creates ledger entries during checkout', async () => {
    const productQuery = chain({
      data: {
        id: 'product-1',
        title: 'Blue Mountain Coffee',
        price_minor: 2500,
        currency: 'USD',
        product_kind: 'physical',
        seller_id: 'seller-1',
        inventory_count: 3,
        is_active: true,
      },
      error: null,
    });
    const orderQuery = chain({ data: { id: 'order-1' }, error: null });
    const itemQuery = chain({ data: null, error: null });
    const intentQuery = chain({ data: { id: 'intent-1' }, error: null });
    const client = {
      from: vi.fn((table: string) => ({
        products: productQuery,
        orders: orderQuery,
        order_items: itemQuery,
      })[table]),
    };
    const admin = {
      from: vi.fn((table: string) => table === 'payment_intents' ? intentQuery : chain({ data: null, error: null })),
    };
    createSupabaseServerClient.mockResolvedValue(client);
    createServiceSupabaseClient.mockResolvedValue(admin);

    const { createOrderAction } = await import('../../apps/web/src/lib/marketplace/actions');
    const result = await createOrderAction(
      { error: null, success: null },
      formData({ productId: 'product-1', quantity: '1', paymentProvider: 'untrusted-provider' }),
    );

    expect(result).toMatchObject({ error: null, orderId: 'order-1' });
    expect(orderQuery.insert).toHaveBeenCalledWith(expect.objectContaining({ status: 'pending_payment' }));
    expect(intentQuery.insert).toHaveBeenCalledWith(expect.objectContaining({
      status: 'requires_payment',
      selected_provider: null,
      selected_method_kind: null,
    }));
    expect(admin.from).not.toHaveBeenCalledWith('ledger_entries');
  });

  it('cancels a pending order without broadly locating or reversing ledger entries', async () => {
    const orderQuery = chain({ data: { id: 'order-1', buyer_id: 'buyer-1', status: 'pending_payment' }, error: null });
    const client = { from: vi.fn(() => orderQuery) };
    createSupabaseServerClient.mockResolvedValue(client);
    createServiceSupabaseClient.mockResolvedValue({ from: vi.fn() });

    const { cancelOrderAction } = await import('../../apps/web/src/lib/marketplace/actions');
    const result = await cancelOrderAction('order-1');

    expect(result).toEqual({ error: null, success: true });
    expect(orderQuery.update).toHaveBeenCalledWith({ status: 'cancelled' });
    expect(createServiceSupabaseClient).not.toHaveBeenCalled();
  });
});
