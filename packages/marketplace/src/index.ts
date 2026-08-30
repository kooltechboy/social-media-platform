// @caribbean/marketplace — TUKUBI Bespoke Commerce & Marketplace Engine

export type SellerType =
  | 'merchant'
  | 'business'
  | 'creator'
  | 'artist'
  | 'restaurant'
  | 'service_provider'
  | 'cultural'
  | 'marketplace_seller';

export interface SellerTypeInfo {
  type: SellerType;
  title: string;
  description: string;
  supportsServices: boolean;
  supportsPhysical: boolean;
  supportsDigital: boolean;
}

export const SELLER_TYPE_REGISTRY: Record<SellerType, SellerTypeInfo> = {
  merchant: {
    type: 'merchant',
    title: 'Retail & Island Merchant',
    description: 'Physical inventory, artisanal products, Caribbean craft, fashion, and retail commerce.',
    supportsServices: false,
    supportsPhysical: true,
    supportsDigital: true,
  },
  business: {
    type: 'business',
    title: 'Commercial Business',
    description: 'Corporate store, wholesale catalogs, products, and commercial services.',
    supportsServices: true,
    supportsPhysical: true,
    supportsDigital: true,
  },
  creator: {
    type: 'creator',
    title: 'Creator & Media Brand',
    description: 'Creator merchandise, digital audio, show tickets, subscriber-exclusive drops, and media.',
    supportsServices: true,
    supportsPhysical: true,
    supportsDigital: true,
  },
  artist: {
    type: 'artist',
    title: 'Visual Artist & Artisan',
    description: 'Original paintings, fine art prints, sculptures, handmade jewelry, and custom commissions.',
    supportsServices: true,
    supportsPhysical: true,
    supportsDigital: true,
  },
  restaurant: {
    type: 'restaurant',
    title: 'Culinary & Restaurant',
    description: 'Caribbean culinary goods, specialty sauces, meal kits, coffee roasts, and dining reservations.',
    supportsServices: true,
    supportsPhysical: true,
    supportsDigital: false,
  },
  service_provider: {
    type: 'service_provider',
    title: 'Professional & Booking Services',
    description: 'Consulting, photography, creative production, wellness, legal, and scheduled appointments.',
    supportsServices: true,
    supportsPhysical: false,
    supportsDigital: true,
  },
  cultural: {
    type: 'cultural',
    title: 'Cultural & Heritage Heritage',
    description: 'Carnival mas bands, festival packages, heritage instruments, and historical cultural goods.',
    supportsServices: true,
    supportsPhysical: true,
    supportsDigital: true,
  },
  marketplace_seller: {
    type: 'marketplace_seller',
    title: 'General Marketplace Merchant',
    description: 'Broad Caribbean marketplace catalog spanning all approved island merchandise.',
    supportsServices: true,
    supportsPhysical: true,
    supportsDigital: true,
  },
};

export type ProductKind = 'physical' | 'digital' | 'service';

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  title: string;
  options: Record<string, string>; // e.g. { size: 'Large', color: 'Sunset Coral' }
  priceMinor: number;
  compareAtPriceMinor?: number;
  inventoryCount: number;
  imageUrl?: string;
  isActive: boolean;
}

export interface ServiceAttributes {
  durationMinutes?: number;
  deliveryMode?: 'in_person' | 'remote' | 'at_venue';
  bookingWindowDays?: number;
  requirementsNote?: string;
  scheduleNotes?: string;
}

export type StorefrontSectionType =
  | 'hero'
  | 'featured_collection'
  | 'product_grid'
  | 'promotional_banner'
  | 'categories'
  | 'seller_story'
  | 'services_showcase'
  | 'customer_reviews';

export interface StorefrontSection {
  id: string;
  type: StorefrontSectionType;
  title?: string;
  subtitle?: string;
  content?: Record<string, unknown>;
  displayOrder: number;
  isVisible: boolean;
}

export const DEFAULT_STOREFRONT_SECTIONS: StorefrontSection[] = [
  {
    id: 'sec-hero-1',
    type: 'hero',
    title: 'Authentic Caribbean Excellence',
    subtitle: 'Crafted with island passion and delivered with full buyer protection.',
    displayOrder: 1,
    isVisible: true,
  },
  {
    id: 'sec-featured-1',
    type: 'featured_collection',
    title: 'Featured Collection',
    subtitle: 'Hand-picked island treasures and signature pieces.',
    displayOrder: 2,
    isVisible: true,
  },
  {
    id: 'sec-grid-1',
    type: 'product_grid',
    title: 'All Products & Goods',
    subtitle: 'Explore our full catalog of authentic offerings.',
    displayOrder: 3,
    isVisible: true,
  },
  {
    id: 'sec-services-1',
    type: 'services_showcase',
    title: 'Bookable Services & Sessions',
    subtitle: 'Professional Caribbean expertise and personalized consultations.',
    displayOrder: 4,
    isVisible: true,
  },
  {
    id: 'sec-story-1',
    type: 'seller_story',
    title: 'Our Heritage & Story',
    subtitle: 'Deeply rooted in Caribbean tradition, built for the global stage.',
    displayOrder: 5,
    isVisible: true,
  },
  {
    id: 'sec-reviews-1',
    type: 'customer_reviews',
    title: 'Verified Customer Reviews',
    subtitle: 'Authentic feedback from verified Caribbean community buyers.',
    displayOrder: 6,
    isVisible: true,
  },
];

export interface CartLine {
  productId: string;
  sellerId: string;
  unitPriceMinor: number;
  quantity: number;
  productKind: ProductKind;
  variantId?: string;
  variantTitle?: string;
  productTitle?: string;
  sellerName?: string;
  imageUrl?: string;
}

export const MARKETPLACE_COMMISSION_BPS = 0; // 0 bps on Seller Pro / Business subscription plans
export const DISPUTE_WINDOW_DAYS = 30;
export const MAX_QUANTITY_PER_LINE = 20;

export interface OrderTotals {
  subtotalMinor: number;
  platformFeeMinor: number;
  processingFeeMinor?: number;
  taxMinor?: number;
  totalMinor: number;
}

export interface ComputeOrderTotalsOptions {
  commissionBps?: number;
  fixedFeeMinor?: number;
  processingFeeBps?: number;
  processingFixedMinor?: number;
  taxBps?: number;
}

export function computeLineTotal(line: CartLine): number {
  if (!Number.isInteger(line.unitPriceMinor) || line.unitPriceMinor <= 0) {
    throw new Error('Unit price must be positive integer minor units');
  }
  if (line.quantity < 1 || line.quantity > MAX_QUANTITY_PER_LINE) {
    throw new Error(`Quantity must be between 1 and ${MAX_QUANTITY_PER_LINE}`);
  }
  return line.unitPriceMinor * line.quantity;
}

export function computeOrderTotals(
  lines: CartLine[],
  optionsOrCommissionBps: number | ComputeOrderTotalsOptions = MARKETPLACE_COMMISSION_BPS
): OrderTotals {
  const options: ComputeOrderTotalsOptions =
    typeof optionsOrCommissionBps === 'number'
      ? { commissionBps: optionsOrCommissionBps }
      : optionsOrCommissionBps;

  const commissionBps = options.commissionBps ?? MARKETPLACE_COMMISSION_BPS;
  const fixedFeeMinor = options.fixedFeeMinor ?? 0;
  const processingFeeBps = options.processingFeeBps ?? 0;
  const processingFixedMinor = options.processingFixedMinor ?? 0;
  const taxBps = options.taxBps ?? 0;

  const subtotalMinor = lines.reduce((sum, line) => sum + computeLineTotal(line), 0);
  const platformFeeMinor = Math.round((subtotalMinor * commissionBps) / 10000) + fixedFeeMinor;
  const processingFeeMinor =
    processingFeeBps > 0 || processingFixedMinor > 0
      ? Math.round((subtotalMinor * processingFeeBps) / 10000) + processingFixedMinor
      : 0;
  const taxMinor = taxBps > 0 ? Math.round((subtotalMinor * taxBps) / 10000) : 0;

  return {
    subtotalMinor,
    platformFeeMinor,
    processingFeeMinor,
    taxMinor,
    totalMinor: subtotalMinor + platformFeeMinor + processingFeeMinor + taxMinor,
  };
}

export function validateCart(lines: CartLine[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (lines.length === 0) errors.push('Cart is empty');
  for (const line of lines) {
    try {
      computeLineTotal(line);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Invalid cart line');
    }
  }
  return { valid: errors.length === 0, errors };
}

export function groupCartBySeller(lines: CartLine[]): Map<string, CartLine[]> {
  const map = new Map<string, CartLine[]>();
  for (const line of lines) {
    const existing = map.get(line.sellerId) ?? [];
    existing.push(line);
    map.set(line.sellerId, existing);
  }
  return map;
}

export function computeMultiSellerOrderTotals(
  lines: CartLine[],
  options: ComputeOrderTotalsOptions = {}
): {
  grandTotal: OrderTotals;
  sellerBreakdown: Record<string, { lines: CartLine[]; totals: OrderTotals }>;
} {
  const grouped = groupCartBySeller(lines);
  const sellerBreakdown: Record<string, { lines: CartLine[]; totals: OrderTotals }> = {};

  for (const [sellerId, sellerLines] of grouped.entries()) {
    sellerBreakdown[sellerId] = {
      lines: sellerLines,
      totals: computeOrderTotals(sellerLines, options),
    };
  }

  const grandTotal = computeOrderTotals(lines, options);

  return {
    grandTotal,
    sellerBreakdown,
  };
}

export function validateVariantSelection(
  variant: ProductVariant,
  quantity: number
): { valid: boolean; error?: string } {
  if (!variant.isActive) {
    return { valid: false, error: 'This product option is currently inactive.' };
  }
  if (variant.inventoryCount <= 0) {
    return { valid: false, error: 'This variant is out of stock.' };
  }
  if (quantity > variant.inventoryCount) {
    return {
      valid: false,
      error: `Requested quantity exceeds available stock (${variant.inventoryCount} remaining).`,
    };
  }
  return { valid: true };
}

export interface B2BTier {
  minimumUnits: number;
  discountBps: number;
}

export function computeB2BPrice(
  basePriceMinor: number,
  quantity: number,
  tiers: B2BTier[] = []
): { effectivePriceMinor: number; discountAppliedBps: number } {
  if (quantity <= 0 || basePriceMinor <= 0) {
    return { effectivePriceMinor: basePriceMinor, discountAppliedBps: 0 };
  }

  const sorted = [...tiers].sort((a, b) => b.minimumUnits - a.minimumUnits);
  const matched = sorted.find((t) => quantity >= t.minimumUnits);

  if (!matched || matched.discountBps <= 0) {
    return { effectivePriceMinor: basePriceMinor, discountAppliedBps: 0 };
  }

  const discountAmount = Math.round((basePriceMinor * matched.discountBps) / 10000);
  const effectivePriceMinor = Math.max(1, basePriceMinor - discountAmount);

  return {
    effectivePriceMinor,
    discountAppliedBps: matched.discountBps,
  };
}

export type DisputeState = 'open' | 'under_review' | 'resolved_buyer' | 'resolved_seller' | 'rejected';

export interface DisputeWindowContext {
  deliveredAt: string;
  now?: Date;
}

export function disputeWindowOpen(context: DisputeWindowContext): boolean {
  const now = context.now ?? new Date();
  const delivered = new Date(context.deliveredAt);
  const deadline = new Date(delivered.getTime() + DISPUTE_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  return now >= delivered && now <= deadline;
}

export type FulfillmentState =
  | 'pending_payment'
  | 'paid'
  | 'processing'
  | 'fulfilling'
  | 'shipped'
  | 'fulfilled'
  | 'cancelled'
  | 'refunded';

export const FULFILLMENT_TRANSITIONS: Record<FulfillmentState, FulfillmentState[]> = {
  pending_payment: ['paid', 'cancelled'],
  paid: ['processing', 'fulfilling', 'shipped', 'fulfilled', 'cancelled', 'refunded'],
  processing: ['fulfilling', 'shipped', 'fulfilled', 'cancelled', 'refunded'],
  fulfilling: ['shipped', 'fulfilled', 'refunded'],
  shipped: ['fulfilled', 'refunded'],
  fulfilled: ['refunded'],
  cancelled: [],
  refunded: [],
};

export function transitionOrder(from: FulfillmentState, to: FulfillmentState): FulfillmentState {
  if (!FULFILLMENT_TRANSITIONS[from].includes(to)) {
    throw new Error(`Invalid order transition: ${from} → ${to}`);
  }
  return to;
}

export function digitalGoodsRequireMobileStoreRouting(lines: CartLine[], platform: 'web' | 'ios' | 'android'): boolean {
  const hasDigital = lines.some((line) => line.productKind === 'digital');
  return hasDigital && platform !== 'web';
}
