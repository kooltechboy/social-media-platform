'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient, getCurrentUser } from '../supabase/server';
import { computeOrderTotals } from '@caribbean/marketplace';

export interface MarketplaceActionState {
  error: string | null;
  success: string | null;
  orderId?: string;
}

export async function createOrderAction(
  _prev: MarketplaceActionState,
  formData: FormData,
): Promise<MarketplaceActionState> {
  const productId = String(formData.get('productId') ?? '').trim();
  const quantity = parseInt(String(formData.get('quantity') ?? '1'), 10);

  if (!productId) return { error: 'Missing product.', success: null };
  if (isNaN(quantity) || quantity < 1) return { error: 'Invalid quantity.', success: null };

  const user = await getCurrentUser();
  if (!user) return { error: 'Sign in to purchase.', success: null };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: 'Service unavailable.', success: null };

  const { data: product, error: productErr } = await supabase
    .from('products')
    .select('id, title, price_minor, currency, product_kind, seller_id, inventory_count, is_active')
    .eq('id', productId)
    .maybeSingle();

  if (productErr || !product) return { error: 'Product not found.', success: null };
  if (!product.is_active) return { error: 'Product is no longer available.', success: null };
  if (product.seller_id === user.id) return { error: 'You cannot purchase your own product.', success: null };
  if (product.inventory_count !== null && product.inventory_count < quantity)
    return { error: 'Insufficient inventory.', success: null };

  const items = [{
    productId: product.id,
    sellerId: product.seller_id,
    unitPriceMinor: product.price_minor,
    quantity,
    productKind: (product.product_kind as 'physical' | 'digital' | 'service') || 'physical',
  }];
  const totals = computeOrderTotals(items);

  const idempotencyKey = `order_${user.id}_${productId}_${Date.now()}`;

  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .insert({
      buyer_id: user.id,
      status: 'pending_payment',
      subtotal_minor: totals.subtotalMinor,
      platform_fee_minor: totals.platformFeeMinor,
      total_minor: totals.totalMinor,
      currency: product.currency,
      idempotency_key: idempotencyKey,
    })
    .select('id')
    .single();

  if (orderErr) return { error: orderErr.message, success: null };

  const { error: itemErr } = await supabase.from('order_items').insert({
    order_id: order.id,
    product_id: product.id,
    quantity,
    unit_price_minor: product.price_minor,
    line_total_minor: product.price_minor * quantity,
  });

  if (itemErr) return { error: itemErr.message, success: null };

  revalidatePath('/marketplace');
  return { error: null, success: 'Order created. Proceed to payment.', orderId: order.id };
}
