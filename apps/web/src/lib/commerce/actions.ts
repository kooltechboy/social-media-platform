'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient, getCurrentUser } from '../supabase/server';
import {
  SELLER_TYPE_REGISTRY,
  DEFAULT_STOREFRONT_SECTIONS,
  type SellerType,
} from '@caribbean/marketplace';
import type {
  StorefrontConfig,
  CreateStorefrontInput,
  UpdateStorefrontInput,
  EscrowStatus,
  OrderEscrowDetails,
} from './types';

/**
 * Supported Caribbean operational trading currencies.
 */
export const SUPPORTED_CARIBBEAN_CURRENCIES = [
  'USD',
  'JMD',
  'TTD',
  'XCD',
  'BBD',
] as const;

export type SupportedCaribbeanCurrency = (typeof SUPPORTED_CARIBBEAN_CURRENCIES)[number];

/**
 * Valid Caribbean country / territory ISO codes.
 */
export const VALID_CARIBBEAN_ISO_CODES = new Set([
  'BHS', 'CUB', 'CYM', 'JAM', 'HTI', 'DOM', 'TCA', 'PRI', 'VIR', 'VGB',
  'AIA', 'SXM', 'MAF', 'BLM', 'SAB', 'EUX', 'KNA', 'ATG', 'MSR', 'GLP',
  'DMA', 'MTQ', 'LCA', 'BRB', 'VCT', 'GRD', 'TTO', 'ABW', 'CUW', 'BES',
  'BLZ', 'PAN', 'COL', 'VEN', 'GUY', 'SUR', 'GUF', 'BMU', 'MIA', 'NYC',
  'TOR', 'LON', 'AMS', 'PAR', 'ATL',
]);

export interface StorefrontActionResult {
  success: boolean;
  data?: StorefrontConfig;
  error?: string;
}

/**
 * Maps raw database storefront row into a strongly typed StorefrontConfig contract.
 */
export function mapDbStorefrontToConfig(row: any): StorefrontConfig {
  const policiesObj = typeof row.policies === 'object' && row.policies !== null ? row.policies : {};
  const countryIso = policiesObj.countryIso || row.country_iso || null;

  return {
    id: row.id,
    sellerId: row.seller_id,
    businessId: row.business_id ?? null,
    sellerType: row.seller_type as SellerType,
    headline: row.headline ?? null,
    heroImageUrl: row.hero_image_url ?? null,
    sections: Array.isArray(row.sections) ? row.sections : DEFAULT_STOREFRONT_SECTIONS,
    brandColor: row.brand_color ?? '#FF6B4A',
    policies: policiesObj,
    returnPolicy: row.return_policy ?? null,
    shippingPolicy: row.shipping_policy ?? null,
    currency: row.currency || 'USD',
    countryIso,
    supportEmail: row.support_email ?? null,
    socialLinks: row.social_links ?? {},
    isPublished: row.is_published ?? true,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),

    // Database snake_case aliases
    seller_id: row.seller_id,
    business_id: row.business_id ?? null,
    seller_type: row.seller_type as SellerType,
    hero_image_url: row.hero_image_url ?? null,
    brand_color: row.brand_color ?? '#FF6B4A',
    return_policy: row.return_policy ?? null,
    shipping_policy: row.shipping_policy ?? null,
    country_iso: countryIso,
    support_email: row.support_email ?? null,
    social_links: row.social_links ?? {},
    is_published: row.is_published ?? true,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/**
 * Creates or updates a merchant / creator storefront configuration in Supabase.
 */
export async function createOrUpdateStorefrontAction(
  input: CreateStorefrontInput | UpdateStorefrontInput | FormData
): Promise<StorefrontActionResult> {
  const user = await getCurrentUser();
  if (!user?.id) {
    return {
      success: false,
      error: 'Authentication required to manage storefront.',
    };
  }

  // Parse input payload (whether JSON object or FormData)
  let headline = '';
  let sellerType: SellerType = 'merchant';
  let countryIso = '';
  let currency = 'USD';
  let heroImageUrl = '';
  let brandColor = '#FF6B4A';
  let shippingPolicy = '';
  let returnPolicy = '';
  let supportEmail = '';
  let businessId: string | undefined = undefined;
  let sections = undefined;
  let isPublished = true;
  let socialLinks: Record<string, string> | undefined = undefined;

  if (typeof (input as FormData)?.get === 'function') {
    const fd = input as FormData;
    headline = String(fd.get('headline') ?? '').trim();
    sellerType = String(fd.get('sellerType') ?? 'merchant') as SellerType;
    countryIso = String(fd.get('countryIso') ?? '').trim().toUpperCase();
    currency = String(fd.get('currency') ?? 'USD').trim().toUpperCase();
    heroImageUrl = String(fd.get('heroImageUrl') ?? '').trim();
    brandColor = String(fd.get('brandColor') ?? '#FF6B4A').trim();
    shippingPolicy = String(fd.get('shippingPolicy') ?? '').trim();
    returnPolicy = String(fd.get('returnPolicy') ?? '').trim();
    supportEmail = String(fd.get('supportEmail') ?? '').trim();
    businessId = fd.get('businessId') ? String(fd.get('businessId')) : undefined;
    const publishedRaw = fd.get('isPublished');
    if (publishedRaw !== null) {
      isPublished = publishedRaw === 'true' || publishedRaw === '1' || publishedRaw === 'on';
    }
  } else {
    const obj = input as CreateStorefrontInput;
    headline = (obj.headline ?? '').trim();
    sellerType = (obj.sellerType ?? 'merchant') as SellerType;
    countryIso = (obj.countryIso ?? '').trim().toUpperCase();
    currency = (obj.currency ?? 'USD').trim().toUpperCase();
    heroImageUrl = (obj.heroImageUrl ?? '').trim();
    brandColor = (obj.brandColor ?? '#FF6B4A').trim();
    shippingPolicy = (obj.shippingPolicy ?? '').trim();
    returnPolicy = (obj.returnPolicy ?? '').trim();
    supportEmail = (obj.supportEmail ?? '').trim();
    businessId = obj.businessId;
    sections = obj.sections;
    if (obj.isPublished !== undefined) {
      isPublished = Boolean(obj.isPublished);
    }
    socialLinks = obj.socialLinks;
  }

  // 1. Validate Seller Type against SELLER_TYPE_REGISTRY
  if (!sellerType || !SELLER_TYPE_REGISTRY[sellerType]) {
    return {
      success: false,
      error: 'Invalid seller type. Must match a registered Caribbean seller category.',
    };
  }

  // 2. Validate Caribbean territory / country ISO
  if (!countryIso || !VALID_CARIBBEAN_ISO_CODES.has(countryIso)) {
    return {
      success: false,
      error: 'Invalid Caribbean country ISO code.',
    };
  }

  // 3. Validate Caribbean trading currency
  if (!SUPPORTED_CARIBBEAN_CURRENCIES.includes(currency as SupportedCaribbeanCurrency)) {
    return {
      success: false,
      error: 'Unsupported currency. Must be a valid Caribbean trading currency (USD, JMD, TTD, XCD, BBD).',
    };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return {
      success: false,
      error: 'Commerce service temporarily unavailable.',
    };
  }

  try {
    const upsertPayload: Record<string, unknown> = {
      seller_id: user.id,
      seller_type: sellerType,
      headline: headline || null,
      hero_image_url: heroImageUrl || null,
      brand_color: brandColor || '#FF6B4A',
      policies: {
        countryIso,
        shippingPolicy: shippingPolicy || null,
        returnPolicy: returnPolicy || null,
      },
      return_policy: returnPolicy || null,
      shipping_policy: shippingPolicy || null,
      currency,
      support_email: supportEmail || null,
      social_links: socialLinks ?? {},
      is_published: isPublished,
      updated_at: new Date().toISOString(),
    };

    if (businessId) {
      upsertPayload.business_id = businessId;
    }
    if (sections) {
      upsertPayload.sections = sections;
    }

    const { data, error } = await supabase
      .from('storefront_configs')
      .upsert(upsertPayload, { onConflict: 'seller_id' })
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: error.message || 'Failed to save storefront configuration.',
      };
    }

    // Revalidate relevant store and marketplace routes
    try {
      revalidatePath('/marketplace');
      revalidatePath('/merchant');
      if (user.username) {
        revalidatePath(`/store/${user.username}`);
      }
      revalidatePath(`/store/${user.id}`);
    } catch {
      // Non-critical cache revalidation catch
    }

    return {
      success: true,
      data: mapDbStorefrontToConfig(data),
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'An unexpected error occurred while saving your storefront.',
    };
  }
}

/**
 * Fetches an existing storefront configuration for a given seller ID.
 */
export async function fetchStorefrontConfigAction(
  sellerId: string
): Promise<StorefrontConfig | null> {
  if (!sellerId || typeof sellerId !== 'string' || sellerId.trim().length === 0) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('storefront_configs')
      .select('*')
      .eq('seller_id', sellerId.trim())
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return mapDbStorefrontToConfig(data);
  } catch {
    return null;
  }
}

export interface EscrowOrderItemInput {
  productId: string;
  variantId?: string | null;
  quantity: number;
  unitPriceMinor: number;
  lineTotalMinor?: number;
}

export interface PlaceEscrowOrderInput {
  sellerId?: string;
  items: EscrowOrderItemInput[];
  subtotalMinor: number;
  platformFeeMinor?: number;
  totalMinor: number;
  currency?: string;
  idempotencyKey?: string;
  shippingAddress?: Record<string, unknown>;
}

export interface PlaceEscrowOrderResult {
  success: boolean;
  orderId?: string;
  escrowStatus?: EscrowStatus;
  idempotentReplay?: boolean;
  error?: string;
  data?: any;
}

/**
 * Places an atomic order with escrow status reservation via RPC public.place_order_with_escrow.
 */
export async function placeOrderWithEscrowAction(
  input: PlaceEscrowOrderInput
): Promise<PlaceEscrowOrderResult> {
  const user = await getCurrentUser();
  if (!user?.id) {
    return {
      success: false,
      error: 'Authentication required to place escrow order.',
    };
  }

  if (!input.items || !Array.isArray(input.items) || input.items.length === 0) {
    return {
      success: false,
      error: 'Order must contain at least one line item.',
    };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return {
      success: false,
      error: 'Commerce service temporarily unavailable.',
    };
  }

  try {
    const itemsPayload = input.items.map((item) => ({
      product_id: item.productId,
      variant_id: item.variantId || null,
      quantity: item.quantity,
      unit_price_minor: item.unitPriceMinor,
      line_total_minor: item.lineTotalMinor ?? item.unitPriceMinor * item.quantity,
    }));

    const { data, error } = await supabase.rpc('place_order_with_escrow', {
      p_buyer_id: user.id,
      p_seller_id: input.sellerId || null,
      p_items: itemsPayload,
      p_subtotal_minor: input.subtotalMinor,
      p_platform_fee_minor: input.platformFeeMinor ?? 0,
      p_total_minor: input.totalMinor,
      p_currency: input.currency || 'USD',
      p_idempotency_key: input.idempotencyKey || null,
      p_shipping_address: input.shippingAddress || {},
    });

    if (error) {
      return {
        success: false,
        error: error.message || 'Failed to place order with escrow protection.',
      };
    }

    try {
      revalidatePath('/marketplace');
      revalidatePath('/orders');
      revalidatePath('/purchases');
    } catch {
      // Non-critical revalidation catch
    }

    return {
      success: true,
      orderId: data?.order_id,
      escrowStatus: (data?.escrow_status as EscrowStatus) || 'held',
      idempotentReplay: Boolean(data?.idempotent_replay),
      data,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'An unexpected error occurred while placing escrow order.',
    };
  }
}

/**
 * Fetches order escrow verification status and dispute window details.
 */
export async function fetchOrderEscrowDetailsAction(
  orderId: string
): Promise<OrderEscrowDetails | null> {
  if (!orderId || typeof orderId !== 'string' || orderId.trim().length === 0) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('orders')
      .select('id, buyer_id, seller_id, escrow_status, total_minor, currency, created_at, escrow_released_at, dispute_reason')
      .eq('id', orderId.trim())
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return {
      orderId: data.id,
      buyerId: data.buyer_id,
      sellerId: data.seller_id,
      escrowStatus: (data.escrow_status as EscrowStatus) || 'held',
      totalMinor: data.total_minor,
      currency: data.currency,
      createdAt: data.created_at,
      escrowReleasedAt: data.escrow_released_at ?? null,
      disputeReason: data.dispute_reason ?? null,
    };
  } catch {
    return null;
  }
}

