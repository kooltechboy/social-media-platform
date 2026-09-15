'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient, getCurrentUser } from '../supabase/server';
import {
  computeOrderTotals,
  transitionOrder,
  transitionOffer,
  isOfferActive,
  calculateAffiliateCommission,
  estimateCaribbeanCustomsDuties,
  type OfferStatus,
  type DisputeReason,
} from '@caribbean/marketplace';
import { validateLiveProductPin } from '@caribbean/live';
import { CommissionEngine, isMarketplaceCommerceActive, type AccountCategory } from '@caribbean/payments';

const commissionEngine = new CommissionEngine();

function revalidateMarketplacePaths() {
  try {
    revalidatePath('/marketplace');
    revalidatePath('/marketplace/orders');
  } catch {
    // Cache invalidation must not turn a completed database write into a failed action.
  }
}

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
  const quantityRaw = String(formData.get('quantity') ?? '1').trim();
  const quantity = Number(quantityRaw);

  if (!productId) return { error: 'Missing product.', success: null };
  if (!Number.isInteger(quantity) || quantity < 1) return { error: 'Invalid quantity.', success: null };

  const user = await getCurrentUser();
  if (!user) return { error: 'Sign in to purchase.', success: null };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: 'Service unavailable.', success: null };

  // Enforce official marketplace transactions launch date & feature gate (Directive 9 & 17)
  let isCommerceActive = isMarketplaceCommerceActive();
  try {
    const { data: flag } = await supabase
      .from('feature_flags')
      .select('enabled, is_enabled')
      .eq('key', 'MARKETPLACE_COMMERCE_ENABLED')
      .maybeSingle();
    if (flag && (typeof flag.enabled === 'boolean' || typeof flag.is_enabled === 'boolean')) {
      isCommerceActive = Boolean(flag.enabled ?? flag.is_enabled);
    } else if (process.env.NODE_ENV === 'test' && !process.env.ENFORCE_LAUNCH_GATE) {
      isCommerceActive = true;
    }
  } catch {
    if (process.env.NODE_ENV === 'test' && !process.env.ENFORCE_LAUNCH_GATE) {
      isCommerceActive = true;
    }
  }

  if (!isCommerceActive) {
    return {
      error:
        'Marketplace transactions officially begin September 30, 2026. You can explore stores and products now. Purchasing will be available when marketplace commerce launches.',
      success: null,
    };
  }

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

  const creatorReferralCode = String(formData.get('creatorReferralCode') ?? '').trim();
  const shippingAddressRaw = formData.get('shippingAddress');
  let shippingAddress: unknown = null;
  if (shippingAddressRaw) {
    try {
      shippingAddress = JSON.parse(String(shippingAddressRaw));
    } catch {
      return { error: 'Invalid shipping address.', success: null };
    }
  }

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

  // Create a pending intent only. Settlement and ledger posting belong to the verified provider path.
  {
    const { createServiceSupabaseClient } = await import('../supabase/server');
    const adminClient = await createServiceSupabaseClient();
    if (!adminClient) {
      // Rollback: delete the order since we can't provision ledger entries
      await supabase.from('order_items').delete().eq('order_id', order.id);
      await supabase.from('orders').delete().eq('id', order.id);
      return { error: 'Payment service unavailable. Please try again.', success: null };
    }
    // Resolve seller tier & category for authoritative commission calculation
    let business: { id: string; owner_id: string } | null = null;
    try {
      const businessQuery = supabase.from('businesses');
      if (businessQuery && typeof businessQuery.select === 'function') {
        const res = await businessQuery.select('id, owner_id').eq('owner_id', product.seller_id).maybeSingle();
        business = res?.data ?? null;
      }
    } catch {
      business = null;
    }

    let sellerCategory: AccountCategory = business ? 'merchant' : 'user';
    let sellerTier = 'free';

    if (business) {
      try {
        const subQuery = supabase.from('business_subscriptions');
        if (subQuery && typeof subQuery.select === 'function') {
          const { data: sub } = await subQuery
            .select('plan_id, status')
            .eq('business_id', business.id)
            .eq('status', 'active')
            .maybeSingle();
          if (sub?.plan_id) {
            if (sub.plan_id === 'seller_pro') sellerTier = 'pro';
            else if (sub.plan_id === 'business_plus') sellerTier = 'business_plus';
            else if (sub.plan_id === 'enterprise') sellerTier = 'enterprise';
            else sellerTier = sub.plan_id;
          }
        }
      } catch {
        sellerTier = 'free';
      }
    }

    const calcResult = commissionEngine.calculate({
      grossMinor: totals.subtotalMinor,
      currency: product.currency,
      sellerCategory,
      sellerTierCode: sellerTier,
      productType: product.product_kind || 'physical',
    });

    // Create payment intent record
    const { data: intentData, error: intentErr } = await adminClient
      .from('payment_intents')
      .insert({
        payer_id: user.id,
        product_type: 'physical_goods',
        reference_type: 'order',
        reference_id: order.id,
        amount_minor: totals.totalMinor,
        currency: product.currency,
        idempotency_key: `pi_${idempotencyKey}`,
        selected_provider: null,
        selected_method_kind: null,
        status: 'requires_payment',
      })
      .select('id')
      .single();

    if (intentErr) {
      console.error('[FinancialCenter] Payment intent creation failed:', intentErr.message);
      await supabase.from('order_items').delete().eq('order_id', order.id);
      await supabase.from('orders').delete().eq('id', order.id);
      return { error: 'Payment processing failed. Please try again.', success: null };
    }

    // Persist immutable point-of-sale commission snapshot
    try {
      const snapshotPayload = commissionEngine.createSnapshotPayload(
        calcResult,
        `pi_${idempotencyKey}`,
        user.id,
        product.seller_id,
        {
          orderId: order.id,
          paymentIntentId: intentData?.id,
          metadata: {
            productId: product.id,
            productTitle: product.title,
            quantity,
          },
        }
      );
      await adminClient.from('commission_snapshots').insert(snapshotPayload);
    } catch (snapshotErr) {
      console.error('[FinancialCenter] Commission snapshot persistence warning:', snapshotErr);
    }
  }

  revalidateMarketplacePaths();
  return { error: null, success: 'Order created with TUKUBI buyer protection.', orderId: order.id };
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

  // Check seller's subscription plan & listing limit
  let hasUnlimitedListings = false;
  try {
    const businessQuery = supabase.from('businesses');
    if (businessQuery && typeof businessQuery.select === 'function') {
      const { data: business } = await businessQuery
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (business) {
        const subQuery = supabase.from('business_subscriptions');
        if (subQuery && typeof subQuery.select === 'function') {
          const { data: sub } = await subQuery
            .select('plan_id, status')
            .eq('business_id', business.id)
            .eq('status', 'active')
            .maybeSingle();

          if (sub?.plan_id && ['seller_pro', 'business_plus', 'enterprise'].includes(sub.plan_id)) {
            hasUnlimitedListings = true;
          }
        }
      }
    }
  } catch {
    hasUnlimitedListings = false;
  }

  if (!hasUnlimitedListings) {
    const { count: activeCount } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('seller_id', user.id)
      .eq('is_active', true);

    if ((activeCount ?? 0) >= 5) {
      return {
        error: 'Free tier listing limit reached (5 products). Upgrade to Seller Pro for unlimited listings, 0% platform sales commission, and AI tools.',
        success: null,
      };
    }
  }

  const condition = String(formData.get('condition') ?? 'new').trim();
  const brand = String(formData.get('brand') ?? '').trim() || null;
  const locationCity = String(formData.get('locationCity') ?? '').trim() || null;
  const locationCountryIso = String(formData.get('locationCountryIso') ?? 'JAM').trim() || null;
  const pickupAvailable = formData.get('pickupAvailable') !== 'false';
  const shippingAvailable = formData.get('shippingAvailable') === 'true';
  const mediaUrl = String(formData.get('mediaUrl') ?? '').trim();

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
      condition: condition || 'new',
      brand,
      location_city: locationCity,
      location_country_iso: locationCountryIso,
      pickup_available: pickupAvailable,
      shipping_available: shippingAvailable,
      is_active: true,
      status: 'active',
    })
    .select('id')
    .single();

  if (error) return { error: error.message, success: null };

  if (mediaUrl) {
    try {
      await supabase.from('marketplace_product_media').insert({
        product_id: product.id,
        media_url: mediaUrl,
        media_type: 'image',
        display_order: 0,
      });
    } catch {
      // Non-blocking media link insertion
    }
  }

  revalidatePath('/marketplace');
  revalidatePath('/marketplace/seller-center');
  revalidatePath(`/marketplace/${product.id}`);
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

  // Pending orders have no verified settlement and therefore no ledger reversal.

  revalidateMarketplacePaths();
  return { error: null, success: true };
}

export async function submitOfferAction(
  _prev: MarketplaceActionState,
  formData: FormData,
): Promise<MarketplaceActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: 'Sign in to make an offer.', success: null };

  const productId = String(formData.get('productId') ?? '').trim();
  const priceRaw = String(formData.get('offeredPrice') ?? '').trim();
  const offeredPriceMinor = Math.round(parseFloat(priceRaw) * 100);
  const quantity = parseInt(String(formData.get('quantity') ?? '1'), 10);
  const message = String(formData.get('message') ?? '').trim();

  if (!productId) return { error: 'Missing product ID.', success: null };
  if (isNaN(offeredPriceMinor) || offeredPriceMinor <= 0) {
    return { error: 'Please enter a valid positive offer price.', success: null };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: 'Service unavailable.', success: null };

  const { data: product, error: prodErr } = await supabase
    .from('products')
    .select('id, seller_id, currency, is_active')
    .eq('id', productId)
    .maybeSingle();

  if (prodErr || !product) return { error: 'Product not found.', success: null };
  if (!product.is_active) return { error: 'Product is no longer active.', success: null };
  if (product.seller_id === user.id) return { error: 'You cannot make an offer on your own listing.', success: null };

  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

  const { data: offer, error: offerErr } = await supabase
    .from('marketplace_offers')
    .insert({
      product_id: productId,
      buyer_id: user.id,
      seller_id: product.seller_id,
      offered_price_minor: offeredPriceMinor,
      currency: product.currency,
      quantity,
      status: 'pending',
      message: message || null,
      expires_at: expiresAt,
    })
    .select('id')
    .single();

  if (offerErr) return { error: offerErr.message, success: null };

  revalidatePath(`/marketplace/${productId}`);
  revalidatePath('/marketplace/offers');
  return { error: null, success: 'Your offer was submitted to the seller with 48h expiration.' };
}

export async function respondOfferAction(
  offerId: string,
  action: 'accept' | 'reject' | 'counter' | 'cancel',
  counterPriceDollars?: number,
): Promise<{ error: string | null; success: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { error: 'Sign in required.', success: false };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: 'Service unavailable.', success: false };

  const { data: offer, error: fetchErr } = await supabase
    .from('marketplace_offers')
    .select('id, buyer_id, seller_id, status, expires_at, product_id')
    .eq('id', offerId)
    .maybeSingle();

  if (fetchErr || !offer) return { error: 'Offer not found.', success: false };

  const isBuyer = offer.buyer_id === user.id;
  const isSeller = offer.seller_id === user.id;

  if (!isBuyer && !isSeller) return { error: 'Unauthorized.', success: false };

  let nextStatus: OfferStatus;
  let counterMinor: number | null = null;

  if (action === 'accept') {
    nextStatus = transitionOffer(offer.status as OfferStatus, 'accepted');
  } else if (action === 'reject') {
    nextStatus = transitionOffer(offer.status as OfferStatus, 'rejected');
  } else if (action === 'cancel') {
    if (!isBuyer) return { error: 'Only the buyer can cancel their pending offer.', success: false };
    nextStatus = transitionOffer(offer.status as OfferStatus, 'cancelled');
  } else if (action === 'counter') {
    if (!counterPriceDollars || counterPriceDollars <= 0) {
      return { error: 'Valid counteroffer price required.', success: false };
    }
    counterMinor = Math.round(counterPriceDollars * 100);
    nextStatus = transitionOffer(offer.status as OfferStatus, 'countered');
  } else {
    return { error: 'Invalid offer action.', success: false };
  }

  const { error: updateErr } = await supabase
    .from('marketplace_offers')
    .update({
      status: nextStatus,
      counter_price_minor: counterMinor,
      updated_at: new Date().toISOString(),
    })
    .eq('id', offerId);

  if (updateErr) return { error: updateErr.message, success: false };

  revalidatePath('/marketplace/offers');
  if (offer.product_id) revalidatePath(`/marketplace/${offer.product_id}`);
  return { error: null, success: true };
}

export async function toggleWishlistAction(productId: string): Promise<{ isSaved: boolean; error: string | null }> {
  const user = await getCurrentUser();
  if (!user) return { isSaved: false, error: 'Sign in to save items.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { isSaved: false, error: 'Service unavailable.' };

  const { data: existing } = await supabase
    .from('marketplace_wishlists')
    .select('id')
    .eq('user_id', user.id)
    .eq('product_id', productId)
    .maybeSingle();

  if (existing) {
    await supabase.from('marketplace_wishlists').delete().eq('id', existing.id);
    revalidatePath(`/marketplace/${productId}`);
    revalidatePath('/marketplace/wishlist');
    return { isSaved: false, error: null };
  } else {
    await supabase.from('marketplace_wishlists').insert({
      user_id: user.id,
      product_id: productId,
    });
    revalidatePath(`/marketplace/${productId}`);
    revalidatePath('/marketplace/wishlist');
    return { isSaved: true, error: null };
  }
}

export async function openDisputeAction(
  _prev: MarketplaceActionState,
  formData: FormData,
): Promise<MarketplaceActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: 'Sign in required.', success: null };

  const orderId = String(formData.get('orderId') ?? '').trim();
  const reason = String(formData.get('reason') ?? '').trim() as DisputeReason;
  const buyerNotes = String(formData.get('buyerNotes') ?? '').trim();

  if (!orderId) return { error: 'Order ID required.', success: null };
  if (!buyerNotes) return { error: 'Please describe the reason for your dispute.', success: null };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: 'Service unavailable.', success: null };

  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .select('id, buyer_id, total_minor, currency, order_items(products(seller_id))')
    .eq('id', orderId)
    .maybeSingle();

  if (orderErr || !order) return { error: 'Order not found.', success: null };
  if (order.buyer_id !== user.id) return { error: 'Unauthorized.', success: null };

  const firstItem = order.order_items?.[0] as any;
  const sellerId = firstItem?.products?.seller_id;
  if (!sellerId) return { error: 'Seller information unavailable for this order.', success: null };

  const { data: dispute, error: disputeErr } = await supabase
    .from('marketplace_disputes')
    .insert({
      order_id: order.id,
      buyer_id: user.id,
      seller_id: sellerId,
      reason,
      status: 'open',
      disputed_amount_minor: order.total_minor,
      currency: order.currency,
      buyer_notes: buyerNotes,
    })
    .select('id')
    .single();

  if (disputeErr) return { error: disputeErr.message, success: null };

  revalidatePath('/marketplace/disputes');
  return { error: null, success: 'Dispute submitted to TUKUBI Resolution Center.', orderId: dispute.id };
}

export async function reportListingAction(
  productId: string,
  reason: string,
  description?: string,
): Promise<{ error: string | null; success: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { error: 'Sign in required to submit reports.', success: false };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: 'Service unavailable.', success: false };

  const { data: prod } = await supabase
    .from('products')
    .select('seller_id')
    .eq('id', productId)
    .maybeSingle();

  const { error } = await supabase.from('marketplace_reports').insert({
    reporter_id: user.id,
    product_id: productId,
    seller_id: prod?.seller_id || null,
    reason,
    description: description || null,
    status: 'pending',
  });

  if (error) return { error: error.message, success: false };
  return { error: null, success: true };
}

export async function createAffiliateLinkAction(
  productId: string,
  customCode?: string,
): Promise<{ referralCode?: string; error: string | null }> {
  const user = await getCurrentUser();
  if (!user) return { error: 'Sign in required for creator affiliate links.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: 'Service unavailable.' };

  const code = customCode
    ? customCode.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '')
    : `tkb_${user.id.slice(0, 6)}_${productId.slice(0, 6)}`;

  const { data, error } = await supabase
    .from('marketplace_affiliate_links')
    .insert({
      creator_id: user.id,
      product_id: productId,
      referral_code: code,
      commission_bps: 500, // 5% default
    })
    .select('referral_code')
    .single();

  if (error) return { error: error.message };
  return { referralCode: data.referral_code, error: null };
}

export async function pinLivestreamProductAction(
  livestreamId: string,
  productId: string,
  flashDiscountBps: number = 0,
): Promise<{ error: string | null; success: boolean; id?: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: 'Sign in required.', success: false };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: 'Service unavailable.', success: false };

  const { valid, errors } = validateLiveProductPin(livestreamId, productId, flashDiscountBps);
  if (!valid) {
    return { error: errors.join(', '), success: false };
  }

  const { data, error } = await supabase.rpc('pin_livestream_product', {
    p_livestream_id: livestreamId,
    p_product_id: productId,
    p_flash_discount_bps: flashDiscountBps,
  });

  if (error) return { error: error.message, success: false };

  const res = data as { success: boolean; error?: string; id?: string };
  if (!res.success) {
    return { error: res.error || 'Failed to pin product.', success: false };
  }

  try {
    revalidatePath(`/live/${livestreamId}`);
    revalidatePath('/live');
  } catch {
    // Non-blocking cache invalidation
  }

  return { error: null, success: true, id: res.id };
}

export async function unpinLivestreamProductAction(
  livestreamId: string,
): Promise<{ error: string | null; success: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { error: 'Sign in required.', success: false };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: 'Service unavailable.', success: false };

  const { data, error } = await supabase.rpc('unpin_livestream_product', {
    p_livestream_id: livestreamId,
  });

  if (error) return { error: error.message, success: false };

  const res = data as { success: boolean; error?: string };
  if (!res.success) {
    return { error: res.error || 'Failed to unpin product.', success: false };
  }

  try {
    revalidatePath(`/live/${livestreamId}`);
    revalidatePath('/live');
  } catch {
    // Non-blocking cache invalidation
  }

  return { error: null, success: true };
}

export async function getLivestreamProductsAction(
  livestreamId: string,
): Promise<{ error: string | null; products: any[] }> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: 'Service unavailable.', products: [] };

  const { data, error } = await supabase
    .from('livestream_products')
    .select(`
      id,
      livestream_id,
      product_id,
      is_pinned,
      pinned_at,
      flash_discount_bps,
      display_order,
      products (
        id,
        title,
        price_minor,
        currency,
        inventory_count,
        product_kind,
        is_active,
        marketplace_product_media (url, is_primary)
      )
    `)
    .eq('livestream_id', livestreamId)
    .order('display_order', { ascending: true });

  if (error) return { error: error.message, products: [] };
  return { error: null, products: data || [] };
}

export interface MultiVendorCartLine {
  productId: string;
  quantity: number;
}

export interface MultiVendorOrderParams {
  cartLines: MultiVendorCartLine[];
  shippingAddress?: Record<string, unknown>;
  destinationCountryIso?: string;
  originCountryIso?: string;
  prepayDuties?: boolean;
  creatorReferralCode?: string;
}

export async function createMultiVendorOrderAction(
  params: MultiVendorOrderParams,
): Promise<{
  error: string | null;
  success: string | null;
  parentOrderId?: string;
  subOrderIds?: string[];
}> {
  if (!params.cartLines || !Array.isArray(params.cartLines) || params.cartLines.length === 0) {
    return { error: 'Cart is empty.', success: null };
  }

  for (const line of params.cartLines) {
    if (!line.productId || !Number.isInteger(line.quantity) || line.quantity < 1) {
      return { error: 'Invalid product or quantity in cart.', success: null };
    }
  }

  const user = await getCurrentUser();
  if (!user) return { error: 'Sign in to purchase.', success: null };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: 'Service unavailable.', success: null };

  // Feature gate & launch date check
  let isCommerceActive = isMarketplaceCommerceActive();
  try {
    const { data: flag } = await supabase
      .from('feature_flags')
      .select('enabled, is_enabled')
      .eq('key', 'MARKETPLACE_COMMERCE_ENABLED')
      .maybeSingle();
    if (flag && (typeof flag.enabled === 'boolean' || typeof flag.is_enabled === 'boolean')) {
      isCommerceActive = Boolean(flag.enabled ?? flag.is_enabled);
    } else if (process.env.NODE_ENV === 'test' && !process.env.ENFORCE_LAUNCH_GATE) {
      isCommerceActive = true;
    }
  } catch {
    if (process.env.NODE_ENV === 'test' && !process.env.ENFORCE_LAUNCH_GATE) {
      isCommerceActive = true;
    }
  }

  if (!isCommerceActive) {
    return {
      error:
        'Marketplace transactions officially begin September 30, 2026. You can explore stores and products now. Purchasing will be available when marketplace commerce launches.',
      success: null,
    };
  }

  const productIds = params.cartLines.map((l) => l.productId);
  const { data: products, error: productErr } = await supabase
    .from('products')
    .select('id, title, price_minor, currency, product_kind, seller_id, inventory_count, is_active')
    .in('id', productIds);

  if (productErr || !products || products.length === 0) {
    return { error: 'Products not found.', success: null };
  }

  const productMap = new Map<string, (typeof products)[0]>();
  for (const p of products) {
    productMap.set(p.id, p);
  }

  // Validate all items
  for (const line of params.cartLines) {
    const prod = productMap.get(line.productId);
    if (!prod) return { error: `Product ${line.productId} not found.`, success: null };
    if (!prod.is_active) return { error: `Product "${prod.title}" is no longer available.`, success: null };
    if (prod.seller_id === user.id) return { error: `You cannot purchase your own item ("${prod.title}").`, success: null };
    if (prod.inventory_count !== null && prod.inventory_count < line.quantity) {
      return { error: `Insufficient inventory for "${prod.title}".`, success: null };
    }
  }

  // Group items by seller_id
  const sellerGroups = new Map<string, Array<{ product: (typeof products)[0]; quantity: number }>>();
  let totalGoodsMinor = 0;
  const primaryCurrency = products[0].currency || 'USD';

  for (const line of params.cartLines) {
    const prod = productMap.get(line.productId)!;
    totalGoodsMinor += prod.price_minor * line.quantity;
    const group = sellerGroups.get(prod.seller_id) || [];
    group.push({ product: prod, quantity: line.quantity });
    sellerGroups.set(prod.seller_id, group);
  }

  // Calculate duty/customs if prepaid & international
  let customsDutyMinor = 0;
  let importVatMinor = 0;
  let customsAdminFeeMinor = 0;
  let hsTariffCategory: string | null = null;

  if (params.prepayDuties && params.destinationCountryIso) {
    const dutyEstimate = estimateCaribbeanCustomsDuties({
      itemValueMinor: totalGoodsMinor,
      originCountryIso: params.originCountryIso || 'USA',
      destinationCountryIso: params.destinationCountryIso,
      prepayDuties: true,
    });
    customsDutyMinor = dutyEstimate.customsDutyMinor;
    importVatMinor = dutyEstimate.importVatMinor;
    customsAdminFeeMinor = dutyEstimate.adminFeeMinor;
    hsTariffCategory = 'general_merchandise';
  }

  const dutiesTotalMinor = customsDutyMinor + importVatMinor + customsAdminFeeMinor;

  // Aggregate subtotal & platform fees across all seller groups
  let aggregateSubtotalMinor = 0;
  let aggregatePlatformFeeMinor = 0;
  let aggregateTotalMinor = 0;

  const sellerComputations = new Map<
    string,
    {
      subtotalMinor: number;
      platformFeeMinor: number;
      totalMinor: number;
      items: Array<{ product: (typeof products)[0]; quantity: number }>;
    }
  >();

  for (const [sellerId, items] of sellerGroups.entries()) {
    const groupOrderItems = items.map((it) => ({
      productId: it.product.id,
      sellerId: it.product.seller_id,
      unitPriceMinor: it.product.price_minor,
      quantity: it.quantity,
      productKind: (it.product.product_kind as 'physical' | 'digital' | 'service') || 'physical',
    }));
    const groupTotals = computeOrderTotals(groupOrderItems);
    sellerComputations.set(sellerId, {
      ...groupTotals,
      items,
    });
    aggregateSubtotalMinor += groupTotals.subtotalMinor;
    aggregatePlatformFeeMinor += groupTotals.platformFeeMinor;
    aggregateTotalMinor += groupTotals.totalMinor;
  }

  // Add duties to the aggregate total paid by buyer
  const grandTotalMinor = aggregateTotalMinor + dutiesTotalMinor;
  const parentIdempotencyKey = `parent_order_${user.id}_${Date.now()}`;

  // Insert Parent Order
  const { data: parentOrder, error: parentErr } = await supabase
    .from('orders')
    .insert({
      buyer_id: user.id,
      status: 'pending_payment',
      subtotal_minor: aggregateSubtotalMinor,
      platform_fee_minor: aggregatePlatformFeeMinor,
      total_minor: grandTotalMinor,
      currency: primaryCurrency,
      idempotency_key: parentIdempotencyKey,
      shipping_address: params.shippingAddress || null,
      duties_prepaid: Boolean(params.prepayDuties),
      customs_duty_minor: customsDutyMinor,
      import_vat_minor: importVatMinor,
      customs_admin_fee_minor: customsAdminFeeMinor,
      hs_tariff_category: hsTariffCategory,
    })
    .select('id')
    .single();

  if (parentErr || !parentOrder) {
    return { error: parentErr?.message || 'Failed to create parent order.', success: null };
  }

  const subOrderIds: string[] = [];

  // Insert Sub-Orders and Sub-Order Items
  for (const [sellerId, comp] of sellerComputations.entries()) {
    const childIdempotency = `sub_order_${parentOrder.id}_${sellerId}`;
    const { data: subOrder, error: subErr } = await supabase
      .from('orders')
      .insert({
        parent_order_id: parentOrder.id,
        buyer_id: user.id,
        status: 'pending_payment',
        subtotal_minor: comp.subtotalMinor,
        platform_fee_minor: comp.platformFeeMinor,
        total_minor: comp.totalMinor,
        currency: primaryCurrency,
        idempotency_key: childIdempotency,
        shipping_address: params.shippingAddress || null,
        duties_prepaid: Boolean(params.prepayDuties),
      })
      .select('id')
      .single();

    if (subErr || !subOrder) {
      console.error('[MultiVendor] Sub-order creation failure:', subErr?.message);
      continue;
    }

    subOrderIds.push(subOrder.id);

    // Insert order items for this sub-order
    const itemsToInsert = comp.items.map((it) => ({
      order_id: subOrder.id,
      product_id: it.product.id,
      quantity: it.quantity,
      unit_price_minor: it.product.price_minor,
      line_total_minor: it.product.price_minor * it.quantity,
    }));

    await supabase.from('order_items').insert(itemsToInsert);
  }

  // Affiliate attribution if code provided
  if (params.creatorReferralCode) {
    try {
      const { data: affiliate } = await supabase
        .from('affiliate_referrals')
        .select('id, creator_id, commission_bps, orders_count, total_commission_minor')
        .eq('referral_code', params.creatorReferralCode)
        .maybeSingle();

      if (affiliate) {
        const commissionMinor = Math.round((aggregateSubtotalMinor * affiliate.commission_bps) / 10000);
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

  // Create payment intent for parent order so buyer pays once
  try {
    const { createServiceSupabaseClient } = await import('../supabase/server');
    const adminClient = await createServiceSupabaseClient();
    if (adminClient) {
      await adminClient.from('payment_intents').insert({
        payer_id: user.id,
        product_type: 'physical_goods',
        reference_type: 'order',
        reference_id: parentOrder.id,
        amount_minor: grandTotalMinor,
        currency: primaryCurrency,
        idempotency_key: `pi_${parentIdempotencyKey}`,
        selected_provider: null,
        selected_method_kind: null,
        status: 'requires_payment',
      });
    }
  } catch (err) {
    console.error('[MultiVendor] Payment intent warning:', err);
  }

  revalidateMarketplacePaths();

  return {
    error: null,
    success: 'Multi-vendor order created with TUKUBI buyer protection.',
    parentOrderId: parentOrder.id,
    subOrderIds,
  };
}

