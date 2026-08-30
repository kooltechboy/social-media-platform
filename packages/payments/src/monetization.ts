// TUKUBI Monetization & Commerce Fee Engine

export interface SellerPlan {
  id: 'business_free' | 'seller_pro' | 'business_plus' | 'enterprise';
  name: string;
  description: string;
  priceMinor: number;
  currency: string;
  billingPeriod: 'monthly' | 'annual';
  listingLimit: number | null; // null = unlimited
  commissionRateBps: number; // Configurable commission basis points (100 bps = 1%)
  aiToolsEnabled: boolean;
  crmEnabled: boolean;
  staffLimit: number;
  prioritySupport: boolean;
}

export const SELLER_PLANS: Record<SellerPlan['id'], SellerPlan> = {
  business_free: {
    id: 'business_free',
    name: 'Business Free',
    description: 'Basic profile, community discovery, messaging, and up to 5 listings.',
    priceMinor: 0,
    currency: 'USD',
    billingPeriod: 'monthly',
    listingLimit: 5,
    commissionRateBps: 0,
    aiToolsEnabled: false,
    crmEnabled: false,
    staffLimit: 1,
    prioritySupport: false,
  },
  seller_pro: {
    id: 'seller_pro',
    name: 'Seller Pro',
    description: 'Digital storefront, unlimited listings, multi-currency checkout, orders, analytics, and AI business tools.',
    priceMinor: 1499, // $14.99/mo
    currency: 'USD',
    billingPeriod: 'monthly',
    listingLimit: null,
    commissionRateBps: 0,
    aiToolsEnabled: true,
    crmEnabled: false,
    staffLimit: 2,
    prioritySupport: false,
  },
  business_plus: {
    id: 'business_plus',
    name: 'Business+',
    description: 'Advanced analytics, CRM, AI sales assistant, multi-staff access, and priority search placement.',
    priceMinor: 3999, // $39.99/mo
    currency: 'USD',
    billingPeriod: 'monthly',
    listingLimit: null,
    commissionRateBps: 0,
    aiToolsEnabled: true,
    crmEnabled: true,
    staffLimit: 5,
    prioritySupport: true,
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Custom multi-location, dedicated API, custom integrations, enterprise advertising, and 24/7 support.',
    priceMinor: 0, // Custom contract
    currency: 'USD',
    billingPeriod: 'monthly',
    listingLimit: null,
    commissionRateBps: 0,
    aiToolsEnabled: true,
    crmEnabled: true,
    staffLimit: 50,
    prioritySupport: true,
  },
};

export interface CreatorTier {
  id: 'creator_free' | 'creator_plus' | 'creator_pro';
  name: string;
  priceMinor: number;
  platformFeeBps: number;
  features: string[];
}

export const CREATOR_TIERS: Record<CreatorTier['id'], CreatorTier> = {
  creator_free: {
    id: 'creator_free',
    name: 'Creator Starter',
    priceMinor: 0,
    platformFeeBps: 1000, // 10% platform fee on tips/gifts
    features: ['Direct fan tips', 'Basic live gifts', 'Standard media upload'],
  },
  creator_plus: {
    id: 'creator_plus',
    name: 'Creator Plus',
    priceMinor: 999, // $9.99/mo
    platformFeeBps: 500, // 5% reduced platform fee
    features: ['Fan memberships', 'Custom live gifts', 'HD live broadcast', 'Podcast hosting'],
  },
  creator_pro: {
    id: 'creator_pro',
    name: 'Creator Pro',
    priceMinor: 2499, // $24.99/mo
    platformFeeBps: 0, // 0% platform fee on tips/memberships
    features: ['All Plus features', 'Priority discovery', 'Dedicated partner manager', '0% platform fee on fan patronage'],
  },
};

export interface UserTier {
  id: 'user_free' | 'user_premium';
  name: string;
  priceMinor: number;
  features: string[];
}

export const USER_TIERS: Record<UserTier['id'], UserTier> = {
  user_free: {
    id: 'user_free',
    name: 'Community Member',
    priceMinor: 0,
    features: ['Feed browsing', 'Social messaging', 'Marketplace shopping', 'Community participation'],
  },
  user_premium: {
    id: 'user_premium',
    name: 'TUKUBI Patron',
    priceMinor: 499, // $4.99/mo
    features: ['All free features', 'Patron badge', 'Exclusive communities', 'Priority support'],
  },
};

export interface BusinessTier {
  id: 'business_free' | 'seller_pro' | 'business_plus' | 'enterprise';
  name: string;
  priceMinor: number;
  features: string[];
}

export const BUSINESS_TIERS: Record<BusinessTier['id'], BusinessTier> = {
  business_free: {
    id: 'business_free',
    name: 'Business Free',
    priceMinor: 0,
    features: ['Basic profile', '5 listings', 'Standard marketplace rates'],
  },
  seller_pro: {
    id: 'seller_pro',
    name: 'Seller Pro',
    priceMinor: 1499, // $14.99/mo
    features: ['Unlimited listings', '0% platform sales commission', 'AI tools', 'Digital storefront'],
  },
  business_plus: {
    id: 'business_plus',
    name: 'Business+',
    priceMinor: 3999, // $39.99/mo
    features: ['Unlimited listings', '0% platform sales commission', 'Advanced CRM', 'AI sales assistant', '5 staff seats'],
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    priceMinor: 0,
    features: ['Custom contracts', 'Dedicated API', 'Multi-location', '24/7 dedicated support'],
  },
};

export interface CheckoutBreakdown {
  grossMinor: number;
  platformFeeMinor: number;
  processingFeeMinor: number;
  affiliateCommissionMinor: number;
  netToMerchantMinor: number;
  currency: string;
}

export interface MonetizationEngineOptions {
  sellerPlanId?: SellerPlan['id'];
  creatorTierId?: CreatorTier['id'];
  affiliateCommissionBps?: number;
  platformCommissionBpsOverride?: number;
  processingFeeBps?: number; // e.g. 290 for 2.9%
  processingFixedMinor?: number; // e.g. 30 for 30 cents
}

export class MonetizationEngine {
  /**
   * Computes the financial breakdown for a transaction.
   * Uses exact integer arithmetic in minor units.
   */
  public calculateCheckoutBreakdown(
    grossMinor: number,
    currency: string = 'USD',
    options: MonetizationEngineOptions = {}
  ): CheckoutBreakdown {
    if (!Number.isInteger(grossMinor) || grossMinor <= 0) {
      throw new Error('Gross amount must be a positive integer in minor units');
    }

    let platformFeeBps = 0;
    if (options.platformCommissionBpsOverride !== undefined) {
      platformFeeBps = options.platformCommissionBpsOverride;
    } else if (options.sellerPlanId) {
      const plan = SELLER_PLANS[options.sellerPlanId] ?? SELLER_PLANS.business_free;
      platformFeeBps = plan.commissionRateBps;
    } else if (options.creatorTierId) {
      const tier = CREATOR_TIERS[options.creatorTierId] ?? CREATOR_TIERS.creator_free;
      platformFeeBps = tier.platformFeeBps;
    }

    const platformFeeMinor = Math.round((grossMinor * platformFeeBps) / 10000);

    const processingBps = options.processingFeeBps ?? 290;
    const processingFixed = options.processingFixedMinor ?? 30;
    const processingFeeMinor = Math.round((grossMinor * processingBps) / 10000) + processingFixed;

    const affiliateBps = options.affiliateCommissionBps ?? 0;
    const affiliateCommissionMinor = Math.round((grossMinor * affiliateBps) / 10000);

    const netToMerchantMinor = grossMinor - platformFeeMinor - processingFeeMinor - affiliateCommissionMinor;

    if (netToMerchantMinor < 0) {
      throw new Error('Total deductions exceed gross amount');
    }

    return {
      grossMinor,
      platformFeeMinor,
      processingFeeMinor,
      affiliateCommissionMinor,
      netToMerchantMinor,
      currency,
    };
  }
}
