// Centralized Launch Configuration & Phased Activation Engine

export const CREATOR_FREE_ACCESS_START = '2026-08-30T00:00:00Z';
export const CREATOR_FREE_ACCESS_END = '2026-10-31T23:59:59Z';
export const CREATOR_PAID_TIERS_START = '2026-11-01T00:00:00Z';
export const MARKETPLACE_COMMERCE_START = '2026-09-30T00:00:00Z';

export type LaunchPhase =
  | 'PHASE_1_CREATOR_FREE_MERCHANT_CATALOG'
  | 'PHASE_2_MARKETPLACE_COMMERCE_ACTIVE'
  | 'PHASE_3_FULL_COMMERCIAL_MONETIZATION';

export type CommerceState = 'PRE_LAUNCH' | 'ACTIVE' | 'PAUSED' | 'MAINTENANCE';

export interface LaunchConfigSnapshot {
  currentPhase: LaunchPhase;
  creatorFreeAccessStart: string;
  creatorFreeAccessEnd: string;
  creatorPaidTiersStart: string;
  marketplaceCommerceStart: string;
  isCreatorFree: boolean;
  isCreatorPaidActive: boolean;
  isMarketplaceCommerceActive: boolean;
}

export function isCreatorFreeAccessActive(now: Date = new Date()): boolean {
  const t = now.getTime();
  const start = new Date(CREATOR_FREE_ACCESS_START).getTime();
  const end = new Date(CREATOR_FREE_ACCESS_END).getTime();
  return t >= start && t <= end;
}

export function isCreatorPaidTiersActive(now: Date = new Date()): boolean {
  const t = now.getTime();
  const start = new Date(CREATOR_PAID_TIERS_START).getTime();
  return t >= start;
}

export function isMarketplaceCommerceActive(now: Date = new Date()): boolean {
  const t = now.getTime();
  const start = new Date(MARKETPLACE_COMMERCE_START).getTime();
  return t >= start;
}

export function getCurrentLaunchPhase(now: Date = new Date()): LaunchPhase {
  if (isCreatorPaidTiersActive(now)) {
    return 'PHASE_3_FULL_COMMERCIAL_MONETIZATION';
  }
  if (isMarketplaceCommerceActive(now)) {
    return 'PHASE_2_MARKETPLACE_COMMERCE_ACTIVE';
  }
  return 'PHASE_1_CREATOR_FREE_MERCHANT_CATALOG';
}

export function getCreatorLaunchMessaging(now: Date = new Date()): {
  bannerTitle: string;
  bannerBody: string;
  badge: string;
  isFree: boolean;
  paidTiersActive: boolean;
} {
  const isFree = isCreatorFreeAccessActive(now);
  const paidActive = isCreatorPaidTiersActive(now);

  if (paidActive) {
    return {
      bannerTitle: 'Creator plans are now available.',
      bannerBody:
        'Subscribe to premium creator tools, 4K production uploads, and expanded live studio capabilities.',
      badge: 'Creator Plans Active',
      isFree: false,
      paidTiersActive: true,
    };
  }

  return {
    bannerTitle: 'All Creator features are FREE through October 31, 2026.',
    bannerBody:
      'Enjoy full access to Creator Hub, Podcasting and Creator Studio during our launch period. Paid creator plans will begin November 1, 2026.',
    badge: 'Launch Promo: 100% Free Access',
    isFree: true,
    paidTiersActive: false,
  };
}

export function getMarketplaceLaunchMessaging(now: Date = new Date()): {
  bannerTitle: string;
  bannerBody: string;
  badge: string;
  canTransact: boolean;
} {
  const canTransact = isMarketplaceCommerceActive(now);

  if (canTransact) {
    return {
      bannerTitle: 'Marketplace commerce is now live.',
      bannerBody:
        'Discover authentic Caribbean artisanal goods, fashion, music, and food with full buyer protection.',
      badge: 'Commerce Live',
      canTransact: true,
    };
  }

  return {
    bannerTitle: 'Marketplace Commerce Launching September 30, 2026',
    bannerBody:
      'Merchants can create their stores, add products and services, and prepare their businesses now. Buyer and seller transactions will officially begin September 30, 2026.',
    badge: 'Storefront Setup Phase',
    canTransact: false,
  };
}

export function getMerchantOnboardingMessaging(now: Date = new Date()): {
  headline: string;
  subheadline: string;
} {
  if (isMarketplaceCommerceActive(now)) {
    return {
      headline: 'Grow your Caribbean business worldwide.',
      subheadline: 'Open your store, list products and services, and accept payments with TUKUBI buyer protection.',
    };
  }

  return {
    headline: 'Build your TUKUBI store now.',
    subheadline:
      'Merchants can create their stores and add products and services during our first launch phase. Marketplace transactions officially begin September 30, 2026.',
  };
}

export function getLaunchConfigSnapshot(now: Date = new Date()): LaunchConfigSnapshot {
  return {
    currentPhase: getCurrentLaunchPhase(now),
    creatorFreeAccessStart: CREATOR_FREE_ACCESS_START,
    creatorFreeAccessEnd: CREATOR_FREE_ACCESS_END,
    creatorPaidTiersStart: CREATOR_PAID_TIERS_START,
    marketplaceCommerceStart: MARKETPLACE_COMMERCE_START,
    isCreatorFree: isCreatorFreeAccessActive(now),
    isCreatorPaidActive: isCreatorPaidTiersActive(now),
    isMarketplaceCommerceActive: isMarketplaceCommerceActive(now),
  };
}
