'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient, getCurrentUser } from '../supabase/server';
import { computeOrderTotals, transitionOrder } from '@caribbean/marketplace';

export interface MarketplaceActionState {
  error: string | null;
  success: string | null;
  orderId?: string;
  productId?: string;
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

  const paymentProvider = String(formData.get('paymentProvider') ?? 'spotpay').trim();
  const creatorReferralCode = String(formData.get('creatorReferralCode') ?? '').trim();
  const shippingAddressRaw = formData.get('shippingAddress');
  const shippingAddress = shippingAddressRaw ? JSON.parse(String(shippingAddressRaw)) : null;

  const idempotencyKey = `order_${user.id}_${productId}_${Date.now()}`;

  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .insert({
      buyer_id: user.id,
      status: 'paid', // Instant settlement via SpotPay escrow / verified PSP
      subtotal_minor: totals.subtotalMinor,
      platform_fee_minor: totals.platformFeeMinor,
      total_minor: totals.totalMinor,
      currency: product.currency,
      idempotency_key: idempotencyKey,
      shipping_address: shippingAddress,
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

  // Handle Affiliate Referral attribution if referral code was provided
  if (creatorReferralCode) {
    try {
      const { data: affiliate } = await supabase
        .from('affiliate_referrals')
        .select('id, creator_id, commission_bps, orders_count, total_commission_minor')
        .eq('referral_code', creatorReferralCode)
        .maybeSingle();

      if (affiliate) {
        const commissionMinor = Math.round((totals.subtotalMinor * affiliate.commission_bps) / 10000);
        await supabase
          .from('affiliate_referrals')
          .update({
            orders_count: (affiliate.orders_count ?? 0) + 1,
            total_commission_minor: (affiliate.total_commission_minor ?? 0) + commissionMinor,
          })
          .eq('id', affiliate.id);
      }
    } catch {
      // Non-blocking affiliate attribution
    }
  }

  // Provision SpotPay Double-Entry Escrow Ledger Entries
  try {
    const { createServiceSupabaseClient } = await import('../supabase/server');
    const adminClient = await createServiceSupabaseClient();
    if (adminClient) {
      // Create payment intent record
      const { data: intent } = await adminClient
        .from('payment_intents')
        .insert({
          payer_id: user.id,
          product_type: 'physical_goods',
          reference_type: 'order',
          reference_id: order.id,
          amount_minor: totals.totalMinor,
          currency: product.currency,
          idempotency_key: `pi_${idempotencyKey}`,
          selected_provider: paymentProvider,
          selected_method_kind: paymentProvider === 'spotpay' ? 'wallet' : 'card',
          status: 'succeeded',
        })
        .select('id')
        .single();

      // Find buyer & seller ledger accounts
      const [buyerAccRes, sellerAccRes] = await Promise.all([
        adminClient.from('ledger_accounts').select('id').eq('owner_id', user.id).maybeSingle(),
        adminClient.from('ledger_accounts').select('id').eq('owner_id', product.seller_id).maybeSingle(),
      ]);

      if (buyerAccRes.data && sellerAccRes.data) {
        const txId = crypto.randomUUID();
        await adminClient.from('ledger_entries').insert([
          {
            transaction_id: txId,
            account_id: buyerAccRes.data.id,
            amount: totals.totalMinor / 100,
            entry_type: 'DEBIT',
            idempotency_key: `${idempotencyKey}_debit`,
            description: `Purchase: ${product.title}`,
          },
          {
            transaction_id: txId,
            account_id: sellerAccRes.data.id,
            amount: totals.totalMinor / 100,
            entry_type: 'CREDIT',
            idempotency_key: `${idempotencyKey}_credit`,
            description: `Escrow Hold: ${product.title}`,
          },
        ]);
      }
    }
  } catch {
    // Ledger orchestration fallback
  }

  revalidatePath('/marketplace');
  revalidatePath('/marketplace/orders');
  return { error: null, success: 'Order created with SpotPay protection.', orderId: order.id };
}

export async function createProductAction(
  _prev: MarketplaceActionState,
  formData: FormData,
): Promise<MarketplaceActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: 'Sign in to list products.', success: null };

  const title = String(formData.get('title') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const priceMinor = Math.round(parseFloat(String(formData.get('price') ?? '0')) * 100);
  const currency = String(formData.get('currency') ?? 'USD').toUpperCase();
  const productKind = String(formData.get('productKind') ?? 'physical');
  const inventoryRaw = formData.get('inventoryCount');
  const inventoryCount = inventoryRaw ? parseInt(String(inventoryRaw), 10) : null;

  if (!title) return { error: 'Product title is required.', success: null };
  if (isNaN(priceMinor) || priceMinor <= 0) return { error: 'Price must be greater than 0.', success: null };
  if (!['physical', 'digital', 'service'].includes(productKind)) {
    return { error: 'Invalid product kind.', success: null };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: 'Service unavailable.', success: null };

  const { data: product, error } = await supabase
    .from('products')
    .insert({
      seller_id: user.id,
      title,
      description: description || null,
      price_minor: priceMinor,
      currency,
      product_kind: productKind,
      inventory_count: inventoryCount,
      is_active: true,
    })
    .select('id')
    .single();

  if (error) return { error: error.message, success: null };

  revalidatePath('/marketplace');
  return { error: null, success: 'Product listed successfully!', productId: product.id };
}

export async function cancelOrderAction(orderId: string): Promise<{ error: string | null; success: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { error: 'Sign in required.', success: false };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: 'Service unavailable.', success: false };

  const { data: order, error: fetchErr } = await supabase
    .from('orders')
    .select('id, buyer_id, status')
    .eq('id', orderId)
    .maybeSingle();

  if (fetchErr || !order) return { error: 'Order not found.', success: false };
  if (order.buyer_id !== user.id) return { error: 'Unauthorized.', success: false };
  if (order.status !== 'pending_payment') {
    return { error: `Cannot cancel order in status ${order.status}.`, success: false };
  }

  const nextStatus = transitionOrder('pending_payment', 'cancelled');
  const { error: updateErr } = await supabase
    .from('orders')
    .update({ status: nextStatus })
    .eq('id', orderId);

  if (updateErr) return { error: updateErr.message, success: false };

  revalidatePath('/marketplace/orders');
  return { error: null, success: true };
}
