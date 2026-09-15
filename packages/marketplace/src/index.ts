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

// =============================================================================
// Product Conditions & Metadata
// =============================================================================

export type ProductCondition =
  | 'new'
  | 'used_like_new'
  | 'used_good'
  | 'used_fair'
  | 'refurbished'
  | 'handmade'
  | 'custom';

export interface ConditionMetadata {
  id: ProductCondition;
  label: string;
  description: string;
  badgeClass: string;
}

export const PRODUCT_CONDITION_METADATA: Record<ProductCondition, ConditionMetadata> = {
  new: {
    id: 'new',
    label: 'Brand New',
    description: 'Unopened original packaging, never used or worn.',
    badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  },
  used_like_new: {
    id: 'used_like_new',
    label: 'Used - Like New',
    description: 'Flawless condition with no visible signs of wear.',
    badgeClass: 'bg-teal-500/10 text-teal-400 border-teal-500/30',
  },
  used_good: {
    id: 'used_good',
    label: 'Used - Good',
    description: 'Fully functional with minor cosmetic surface wear.',
    badgeClass: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
  },
  used_fair: {
    id: 'used_fair',
    label: 'Used - Fair',
    description: 'Fully operational with noticeable wear or patina.',
    badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  },
  refurbished: {
    id: 'refurbished',
    label: 'Certified Refurbished',
    description: 'Professionally inspected, cleaned, and restored to full functionality.',
    badgeClass: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
  },
  handmade: {
    id: 'handmade',
    label: 'Artisan Handmade',
    description: 'Authentically crafted by Caribbean artisans and creators.',
    badgeClass: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  },
  custom: {
    id: 'custom',
    label: 'Custom Commission',
    description: 'Made-to-order bespoke item tailored to customer specifications.',
    badgeClass: 'bg-pink-500/10 text-pink-400 border-pink-500/30',
  },
};

export type ProductStatus = 'draft' | 'active' | 'pending_review' | 'sold' | 'archived' | 'rejected';

// =============================================================================
// Offers & Negotiations State Machine
// =============================================================================

export type OfferStatus =
  | 'pending'
  | 'countered'
  | 'accepted'
  | 'rejected'
  | 'cancelled'
  | 'expired';

export const OFFER_TRANSITIONS: Record<OfferStatus, OfferStatus[]> = {
  pending: ['countered', 'accepted', 'rejected', 'cancelled', 'expired'],
  countered: ['countered', 'accepted', 'rejected', 'cancelled', 'expired'],
  accepted: [],
  rejected: [],
  cancelled: [],
  expired: [],
};

export function transitionOffer(from: OfferStatus, to: OfferStatus): OfferStatus {
  if (!OFFER_TRANSITIONS[from].includes(to)) {
    throw new Error(`Invalid offer transition: ${from} → ${to}`);
  }
  return to;
}

export function isOfferActive(offer: { status: OfferStatus; expiresAt: string | Date }): boolean {
  if (offer.status !== 'pending' && offer.status !== 'countered') {
    return false;
  }
  const expiryTime = new Date(offer.expiresAt).getTime();
  return expiryTime > Date.now();
}

// =============================================================================
// Buyer Protection & Disputes
// =============================================================================

export type DisputeReason =
  | 'not_received'
  | 'materially_different'
  | 'damaged'
  | 'counterfeit'
  | 'fraud';

export const DISPUTE_REASON_METADATA: Record<DisputeReason, { label: string; description: string }> = {
  not_received: {
    label: 'Item Not Received',
    description: 'The tracking shows no delivery or package never arrived within the guaranteed window.',
  },
  materially_different: {
    label: 'Materially Different',
    description: 'The received item differs significantly from the seller listing description or photos.',
  },
  damaged: {
    label: 'Damaged in Transit',
    description: 'Item arrived broken, spoiled, or damaged during island shipping.',
  },
  counterfeit: {
    label: 'Suspected Counterfeit',
    description: 'Item appears inauthentic or falsely branded contrary to TUKUBI Trust & Safety rules.',
  },
  fraud: {
    label: 'Seller Fraud or Scam',
    description: 'Seller engaged in deceptive behavior, off-platform payment solicitation, or unauthorized changes.',
  },
};

export type DisputeResolutionStatus =
  | 'open'
  | 'seller_responded'
  | 'under_review'
  | 'resolved_refund'
  | 'resolved_seller'
  | 'closed';

// =============================================================================
// Canonical Categories & Natural Language Search Parsing
// =============================================================================

export interface MarketplaceCategory {
  id: string;
  slug: string;
  title: string;
  description?: string;
  icon?: string;
  culturalTags: string[];
  displayOrder: number;
}

export const CANONICAL_CARIBBEAN_CATEGORIES: MarketplaceCategory[] = [
  { id: 'cat-food', slug: 'food-spices', title: 'Food & Spices', icon: 'Utensils', culturalTags: ['coffee', 'spices', 'rum', 'cacao'], displayOrder: 1 },
  { id: 'cat-carnival', slug: 'carnival-mas', title: 'Carnival & Mas', icon: 'Sparkles', culturalTags: ['carnival', 'mas', 'costume', 'soca'], displayOrder: 2 },
  { id: 'cat-art', slug: 'art-decor', title: 'Art & Living', icon: 'Palette', culturalTags: ['art', 'craft', 'paintings', 'decor'], displayOrder: 3 },
  { id: 'cat-fashion', slug: 'fashion-apparel', title: 'Fashion & Wear', icon: 'Shirt', culturalTags: ['fashion', 'apparel', 'crochet', 'resort'], displayOrder: 4 },
  { id: 'cat-beauty', slug: 'beauty-wellness', title: 'Beauty & Wellness', icon: 'Heart', culturalTags: ['wellness', 'sea-moss', 'castor-oil'], displayOrder: 5 },
  { id: 'cat-digital', slug: 'digital-sounds', title: 'Digital & Audio', icon: 'Headphones', culturalTags: ['samples', 'beats', 'stems', 'ebooks'], displayOrder: 6 },
  { id: 'cat-services', slug: 'services-bookings', title: 'Services & Bookings', icon: 'Briefcase', culturalTags: ['consulting', 'photography', 'production'], displayOrder: 7 },
  { id: 'cat-tech', slug: 'electronics-tech', title: 'Electronics & Tech', icon: 'Smartphone', culturalTags: ['phones', 'laptops', 'audio'], displayOrder: 8 },
  { id: 'cat-vehicles', slug: 'vehicles-transport', title: 'Vehicles & Marine', icon: 'Car', culturalTags: ['cars', 'boats', 'motorcycles'], displayOrder: 9 },
  { id: 'cat-realestate', slug: 'real-estate-rentals', title: 'Real Estate & Land', icon: 'Home', culturalTags: ['rentals', 'land', 'villas'], displayOrder: 10 },
];

export interface MarketplaceFilterParams {
  query?: string;
  categorySlug?: string;
  minPriceMinor?: number;
  maxPriceMinor?: number;
  condition?: ProductCondition[];
  countryIso?: string;
  productKind?: ProductKind;
  pickupOnly?: boolean;
  shippingOnly?: boolean;
  verifiedOnly?: boolean;
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'popular';
}

/**
 * Natural language shopping assistant parser.
 * Maps intent queries like "used iPhone under $300 in Kingston" into structured filters.
 */
export function parseNaturalLanguageSearch(prompt: string): Partial<MarketplaceFilterParams> {
  const norm = prompt.toLowerCase().trim();
  const filters: Partial<MarketplaceFilterParams> = {};

  // Price constraints (e.g. "under $300", "below 50", "less than $100")
  const underPriceMatch = norm.match(/(?:under|below|less than|max)\s*\$?(\d+)/i);
  if (underPriceMatch && underPriceMatch[1]) {
    filters.maxPriceMinor = parseInt(underPriceMatch[1], 10) * 100;
  }
  const minPriceMatch = norm.match(/(?:above|over|more than|min)\s*\$?(\d+)/i);
  if (minPriceMatch && minPriceMatch[1]) {
    filters.minPriceMinor = parseInt(minPriceMatch[1], 10) * 100;
  }

  // Condition keywords
  const conditions: ProductCondition[] = [];
  if (norm.includes('new') && !norm.includes('used') && !norm.includes('refurbished')) {
    conditions.push('new');
  }
  if (norm.includes('used') || norm.includes('pre-owned') || norm.includes('second hand')) {
    conditions.push('used_like_new', 'used_good', 'used_fair');
  }
  if (norm.includes('refurbished') || norm.includes('renewed')) {
    conditions.push('refurbished');
  }
  if (norm.includes('handmade') || norm.includes('artisan') || norm.includes('craft')) {
    conditions.push('handmade');
  }
  if (conditions.length > 0) {
    filters.condition = conditions;
  }

  // Geographic / Island mentions
  if (norm.includes('jamaica') || norm.includes('kingston') || norm.includes('montego')) {
    filters.countryIso = 'JAM';
  } else if (norm.includes('dominican') || norm.includes('santo domingo') || norm.includes('santiago')) {
    filters.countryIso = 'DOM';
  } else if (norm.includes('trinidad') || norm.includes('tobago') || norm.includes('port of spain')) {
    filters.countryIso = 'TTO';
  } else if (norm.includes('haiti') || norm.includes('port-au-prince')) {
    filters.countryIso = 'HTI';
  } else if (norm.includes('barbados') || norm.includes('bridgetown')) {
    filters.countryIso = 'BRB';
  } else if (norm.includes('bahamas') || norm.includes('nassau')) {
    filters.countryIso = 'BHS';
  } else if (norm.includes('guyana') || norm.includes('georgetown')) {
    filters.countryIso = 'GUY';
  } else if (norm.includes('puerto rico') || norm.includes('san juan')) {
    filters.countryIso = 'PRI';
  }

  // Category matching
  if (norm.includes('coffee') || norm.includes('spice') || norm.includes('sauce') || norm.includes('rum') || norm.includes('food')) {
    filters.categorySlug = 'food-spices';
  } else if (norm.includes('carnival') || norm.includes('mas') || norm.includes('headdress') || norm.includes('soca')) {
    filters.categorySlug = 'carnival-mas';
  } else if (norm.includes('art') || norm.includes('painting') || norm.includes('sculpture') || norm.includes('decor')) {
    filters.categorySlug = 'art-decor';
  } else if (norm.includes('phone') || norm.includes('laptop') || norm.includes('iphone') || norm.includes('tech') || norm.includes('electronics')) {
    filters.categorySlug = 'electronics-tech';
  } else if (norm.includes('dress') || norm.includes('shirt') || norm.includes('wear') || norm.includes('crochet') || norm.includes('fashion')) {
    filters.categorySlug = 'fashion-apparel';
  } else if (norm.includes('service') || norm.includes('photo') || norm.includes('booking') || norm.includes('consulting')) {
    filters.categorySlug = 'services-bookings';
    filters.productKind = 'service';
  } else if (norm.includes('beat') || norm.includes('stem') || norm.includes('sample') || norm.includes('audio') || norm.includes('digital')) {
    filters.categorySlug = 'digital-sounds';
    filters.productKind = 'digital';
  }

  // Delivery preferences
  if (norm.includes('pickup') || norm.includes('pick up')) {
    filters.pickupOnly = true;
  }
  if (norm.includes('shipping') || norm.includes('deliver') || norm.includes('ship')) {
    filters.shippingOnly = true;
  }
  if (norm.includes('verified')) {
    filters.verifiedOnly = true;
  }

  // Clean remaining query text
  let cleaned = prompt
    .replace(/(?:under|below|less than|above|over|more than)\s*\$?\d+/gi, '')
    .replace(/\b(find|show|me|products|items|goods|looking for|near|in|with|verified|sellers?)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (cleaned.length >= 2) {
    filters.query = cleaned;
  }

  return filters;
}

/**
 * Calculates affiliate commission amount in minor currency units.
 */
export function calculateAffiliateCommission(subtotalMinor: number, commissionBps: number): number {
  if (subtotalMinor <= 0 || commissionBps <= 0) return 0;
  const clampedBps = Math.min(Math.max(commissionBps, 0), 5000); // Max 50%
  return Math.round((subtotalMinor * clampedBps) / 10000);
}

export * from './logistics';

