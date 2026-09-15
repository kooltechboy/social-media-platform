// TUKUBI Universal Entitlement Engine
// Decouples capabilities and feature gates from hardcoded plan strings.

import type { AccountCategory } from './types';

export const CAN_USE_ADVANCED_ANALYTICS = 'CAN_USE_ADVANCED_ANALYTICS';
export const CAN_MONETIZE = 'CAN_MONETIZE';
export const CAN_CREATE_PAID_SUBSCRIPTIONS = 'CAN_CREATE_PAID_SUBSCRIPTIONS';
export const CAN_SELL_DIGITAL_PRODUCTS = 'CAN_SELL_DIGITAL_PRODUCTS';
export const CAN_CREATE_ADVANCED_CAMPAIGNS = 'CAN_CREATE_ADVANCED_CAMPAIGNS';
export const CAN_USE_ADVANCED_CREATOR_TOOLS = 'CAN_USE_ADVANCED_CREATOR_TOOLS';
export const CAN_ACCESS_STORE_PRO = 'CAN_ACCESS_STORE_PRO';

export type EntitlementKey =
  | 'social_access'
  | 'browse_marketplace'
  | 'purchase_goods'
  | 'community_member'
  | 'patron_badge'
  | 'priority_support'
  | 'standard_uploads'
  | 'fan_tips'
  | 'live_gifts'
  | 'basic_analytics'
  | 'reduced_commission'
  | 'zero_tip_commission'
  | 'custom_live_gifts'
  | 'hd_broadcast'
  | 'podcast_hosting'
  | 'fan_memberships'
  | 'priority_discovery'
  | 'dedicated_manager'
  | 'basic_storefront'
  | 'orders_management'
  | 'basic_shipping'
  | 'unlimited_listings'
  | 'lower_commission'
  | 'ai_tools'
  | 'analytics_dashboard'
  | 'advanced_crm'
  | 'ai_sales_assistant'
  | 'multi_staff'
  | 'priority_search'
  | 'custom_api'
  | 'enterprise_support'
  | 'CAN_USE_ADVANCED_ANALYTICS'
  | 'CAN_MONETIZE'
  | 'CAN_CREATE_PAID_SUBSCRIPTIONS'
  | 'CAN_SELL_DIGITAL_PRODUCTS'
  | 'CAN_CREATE_ADVANCED_CAMPAIGNS'
  | 'CAN_USE_ADVANCED_CREATOR_TOOLS'
  | 'CAN_ACCESS_STORE_PRO';


export interface TierEntitlementsDefinition {
  tierId: string;
  category: AccountCategory;
  tierCode: string;
  entitlements: Set<EntitlementKey>;
  listingLimit: number | null; // null = unlimited
}

export const TIER_ENTITLEMENT_MAP: Record<string, TierEntitlementsDefinition> = {
  // User Tiers
  user_free: {
    tierId: 'user_free',
    category: 'user',
    tierCode: 'free',
    entitlements: new Set(['social_access', 'browse_marketplace', 'purchase_goods', 'community_member']),
    listingLimit: null,
  },
  user_premium: {
    tierId: 'user_premium',
    category: 'user',
    tierCode: 'premium',
    entitlements: new Set(['social_access', 'browse_marketplace', 'purchase_goods', 'community_member', 'patron_badge', 'priority_support']),
    listingLimit: null,
  },

  // Creator Tiers
  creator_free: {
    tierId: 'creator_free',
    category: 'creator',
    tierCode: 'free',
    entitlements: new Set(['standard_uploads', 'fan_tips', 'live_gifts', 'basic_analytics']),
    listingLimit: null,
  },
  creator_plus: {
    tierId: 'creator_plus',
    category: 'creator',
    tierCode: 'plus',
    entitlements: new Set([
      'standard_uploads',
      'fan_tips',
      'live_gifts',
      'basic_analytics',
      'reduced_commission',
      'custom_live_gifts',
      'hd_broadcast',
      'podcast_hosting',
      'fan_memberships',
    ]),
    listingLimit: null,
  },
  creator_pro: {
    tierId: 'creator_pro',
    category: 'creator',
    tierCode: 'pro',
    entitlements: new Set([
      'standard_uploads',
      'fan_tips',
      'live_gifts',
      'basic_analytics',
      'reduced_commission',
      'zero_tip_commission',
      'custom_live_gifts',
      'hd_broadcast',
      'podcast_hosting',
      'fan_memberships',
      'priority_discovery',
      'dedicated_manager',
    ]),
    listingLimit: null,
  },

  // Merchant & Business Tiers
  merchant_free: {
    tierId: 'merchant_free',
    category: 'merchant',
    tierCode: 'free',
    entitlements: new Set(['basic_storefront', 'orders_management', 'basic_shipping']),
    listingLimit: 5,
  },
  business_free: {
    tierId: 'business_free',
    category: 'merchant',
    tierCode: 'free',
    entitlements: new Set(['basic_storefront', 'orders_management', 'basic_shipping']),
    listingLimit: 5,
  },
  seller_pro: {
    tierId: 'seller_pro',
    category: 'merchant',
    tierCode: 'pro',
    entitlements: new Set([
      'basic_storefront',
      'orders_management',
      'basic_shipping',
      'unlimited_listings',
      'lower_commission',
      'ai_tools',
      'analytics_dashboard',
    ]),
    listingLimit: null,
  },
  business_plus: {
    tierId: 'business_plus',
    category: 'business',
    tierCode: 'business_plus',
    entitlements: new Set([
      'basic_storefront',
      'orders_management',
      'basic_shipping',
      'unlimited_listings',
      'lower_commission',
      'ai_tools',
      'analytics_dashboard',
      'advanced_crm',
      'ai_sales_assistant',
      'multi_staff',
      'priority_search',
    ]),
    listingLimit: null,
  },
  enterprise: {
    tierId: 'enterprise',
    category: 'business',
    tierCode: 'enterprise',
    entitlements: new Set([
      'basic_storefront',
      'orders_management',
      'basic_shipping',
      'unlimited_listings',
      'lower_commission',
      'ai_tools',
      'analytics_dashboard',
      'advanced_crm',
      'ai_sales_assistant',
      'multi_staff',
      'priority_search',
      'custom_api',
      'enterprise_support',
    ]),
    listingLimit: null,
  },
};

export class EntitlementEngine {
  private tierMap: Map<string, TierEntitlementsDefinition>;

  constructor(customMap?: Record<string, TierEntitlementsDefinition>) {
    this.tierMap = new Map(Object.entries(customMap || TIER_ENTITLEMENT_MAP));
  }

  /**
   * Evaluates if a given tier has a specific entitlement key.
   */
  public hasEntitlement(tierIdOrCode: string, entitlement: EntitlementKey): boolean {
    const tierDef = this.resolveTier(tierIdOrCode);
    if (!tierDef) return false;
    if (tierDef.entitlements.has(entitlement)) return true;

    // Canonical semantic aliases
    if (entitlement === 'CAN_MONETIZE') {
      return tierDef.entitlements.has('fan_tips') || tierDef.entitlements.has('fan_memberships');
    }
    if (entitlement === 'CAN_CREATE_PAID_SUBSCRIPTIONS') {
      return tierDef.entitlements.has('fan_memberships');
    }
    if (entitlement === 'CAN_USE_ADVANCED_ANALYTICS') {
      return (
        tierDef.entitlements.has('analytics_dashboard') ||
        tierDef.tierCode === 'plus' ||
        tierDef.tierCode === 'pro' ||
        tierDef.tierCode === 'business_plus'
      );
    }
    if (entitlement === 'CAN_SELL_DIGITAL_PRODUCTS') {
      return tierDef.entitlements.has('basic_storefront') || tierDef.tierCode === 'plus' || tierDef.tierCode === 'pro';
    }
    if (entitlement === 'CAN_CREATE_ADVANCED_CAMPAIGNS') {
      return (
        tierDef.entitlements.has('ai_tools') ||
        tierDef.tierCode === 'pro' ||
        tierDef.tierCode === 'business_plus' ||
        tierDef.tierCode === 'enterprise'
      );
    }
    if (entitlement === 'CAN_USE_ADVANCED_CREATOR_TOOLS') {
      return tierDef.tierCode === 'plus' || tierDef.tierCode === 'pro';
    }
    if (entitlement === 'CAN_ACCESS_STORE_PRO') {
      return (
        tierDef.tierCode === 'pro' ||
        tierDef.tierCode === 'business_plus' ||
        tierDef.tierCode === 'enterprise'
      );
    }
    return false;
  }

  public canMonetize(tierIdOrCode: string): boolean {
    return this.hasEntitlement(tierIdOrCode, 'CAN_MONETIZE');
  }

  public canCreatePaidSubscriptions(tierIdOrCode: string): boolean {
    return this.hasEntitlement(tierIdOrCode, 'CAN_CREATE_PAID_SUBSCRIPTIONS');
  }

  public canSellDigitalProducts(tierIdOrCode: string): boolean {
    return this.hasEntitlement(tierIdOrCode, 'CAN_SELL_DIGITAL_PRODUCTS');
  }

  public canUseAdvancedAnalytics(tierIdOrCode: string): boolean {
    return this.hasEntitlement(tierIdOrCode, 'CAN_USE_ADVANCED_ANALYTICS');
  }

  public canCreateAdvancedCampaigns(tierIdOrCode: string): boolean {
    return this.hasEntitlement(tierIdOrCode, 'CAN_CREATE_ADVANCED_CAMPAIGNS');
  }

  public canUseAdvancedCreatorTools(tierIdOrCode: string): boolean {
    return this.hasEntitlement(tierIdOrCode, 'CAN_USE_ADVANCED_CREATOR_TOOLS');
  }

  public canAccessStorePro(tierIdOrCode: string): boolean {
    return this.hasEntitlement(tierIdOrCode, 'CAN_ACCESS_STORE_PRO');
  }


  /**
   * Returns all entitlements for a tier.
   */
  public getEntitlements(tierIdOrCode: string): EntitlementKey[] {
    const tierDef = this.resolveTier(tierIdOrCode);
    if (!tierDef) return [];
    return Array.from(tierDef.entitlements);
  }

  /**
   * Returns the listing limit for a seller (null if unlimited).
   */
  public getListingLimit(tierIdOrCode: string): number | null {
    const tierDef = this.resolveTier(tierIdOrCode);
    if (!tierDef) return 5; // Default free limit
    return tierDef.listingLimit;
  }

  /**
   * Checks if an action is allowed given current inventory / usage.
   */
  public canCreateListing(tierIdOrCode: string, currentCount: number): boolean {
    const limit = this.getListingLimit(tierIdOrCode);
    if (limit === null) return true; // unlimited
    return currentCount < limit;
  }

  private resolveTier(tierIdOrCode: string): TierEntitlementsDefinition | undefined {
    if (this.tierMap.has(tierIdOrCode)) {
      return this.tierMap.get(tierIdOrCode);
    }
    // Search by tierCode across definitions
    for (const def of this.tierMap.values()) {
      if (def.tierCode === tierIdOrCode) {
        return def;
      }
    }
    return undefined;
  }
}
