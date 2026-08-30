import { describe, it, expect } from 'vitest';
import {
  isCreatorFreeAccessActive,
  isCreatorPaidTiersActive,
  isMarketplaceCommerceActive,
  getCurrentLaunchPhase,
  getCreatorLaunchMessaging,
  getMarketplaceLaunchMessaging,
  getMerchantOnboardingMessaging,
  getLaunchConfigSnapshot,
  CREATOR_FREE_ACCESS_START,
  CREATOR_FREE_ACCESS_END,
  CREATOR_PAID_TIERS_START,
  MARKETPLACE_COMMERCE_START,
} from '../../packages/payments/src/index';

describe('TUKUBI Phased Production Launch Engine', () => {
  describe('Canonical Launch Milestone Constants', () => {
    it('has exact date strings configured per product specifications', () => {
      expect(CREATOR_FREE_ACCESS_START).toBe('2026-08-30T00:00:00Z');
      expect(CREATOR_FREE_ACCESS_END).toBe('2026-10-31T23:59:59Z');
      expect(CREATOR_PAID_TIERS_START).toBe('2026-11-01T00:00:00Z');
      expect(MARKETPLACE_COMMERCE_START).toBe('2026-09-30T00:00:00Z');
    });
  });

  describe('Phase 1: August 30, 2026 (Initial Launch Activation)', () => {
    const aug30 = new Date('2026-08-30T15:00:00Z');

    it('activates 100% free creator access', () => {
      expect(isCreatorFreeAccessActive(aug30)).toBe(true);
      expect(isCreatorPaidTiersActive(aug30)).toBe(false);
    });

    it('gates marketplace transactional commerce while allowing catalog & storefront', () => {
      expect(isMarketplaceCommerceActive(aug30)).toBe(false);
    });

    it('identifies current phase as Phase 1 (Creator Free & Merchant Catalog)', () => {
      expect(getCurrentLaunchPhase(aug30)).toBe('PHASE_1_CREATOR_FREE_MERCHANT_CATALOG');
    });

    it('provides creator launch promotional messaging through Oct 31, 2026', () => {
      const msg = getCreatorLaunchMessaging(aug30);
      expect(msg.isFree).toBe(true);
      expect(msg.paidTiersActive).toBe(false);
      expect(msg.bannerTitle).toBe('All Creator features are FREE through October 31, 2026.');
      expect(msg.bannerBody).toContain('Enjoy full access to Creator Hub, Podcasting and Creator Studio');
      expect(msg.bannerBody).toContain('Paid creator plans will begin November 1, 2026');
    });

    it('provides pre-launch marketplace messaging with Sept 30, 2026 activation date', () => {
      const msg = getMarketplaceLaunchMessaging(aug30);
      expect(msg.canTransact).toBe(false);
      expect(msg.bannerTitle).toBe('Marketplace Commerce Launching September 30, 2026');
      expect(msg.bannerBody).toContain('Merchants can create their stores, add products and services');
      expect(msg.bannerBody).toContain('Buyer and seller transactions will officially begin September 30, 2026');
    });

    it('provides merchant onboarding messaging encouraging store creation now', () => {
      const msg = getMerchantOnboardingMessaging(aug30);
      expect(msg.headline).toBe('Build your TUKUBI store now.');
      expect(msg.subheadline).toContain('Merchants can create their stores and add products and services');
      expect(msg.subheadline).toContain('September 30, 2026');
    });

    it('generates coherent launch configuration snapshot', () => {
      const snapshot = getLaunchConfigSnapshot(aug30);
      expect(snapshot.currentPhase).toBe('PHASE_1_CREATOR_FREE_MERCHANT_CATALOG');
      expect(snapshot.isCreatorFree).toBe(true);
      expect(snapshot.isCreatorPaidActive).toBe(false);
      expect(snapshot.isMarketplaceCommerceActive).toBe(false);
    });
  });

  describe('Phase 1 Boundary: September 29, 2026 (Eve of Marketplace Commerce Launch)', () => {
    const sep29 = new Date('2026-09-29T23:59:59Z');

    it('keeps marketplace transactions gated until midnight', () => {
      expect(isMarketplaceCommerceActive(sep29)).toBe(false);
      expect(getMarketplaceLaunchMessaging(sep29).canTransact).toBe(false);
    });

    it('maintains free creator access', () => {
      expect(isCreatorFreeAccessActive(sep29)).toBe(true);
      expect(isCreatorPaidTiersActive(sep29)).toBe(false);
    });

    it('remains in Phase 1', () => {
      expect(getCurrentLaunchPhase(sep29)).toBe('PHASE_1_CREATOR_FREE_MERCHANT_CATALOG');
    });
  });

  describe('Phase 2: September 30, 2026 (Marketplace Commerce Launch)', () => {
    const sep30 = new Date('2026-09-30T00:00:00Z');

    it('officially activates marketplace transactional commerce', () => {
      expect(isMarketplaceCommerceActive(sep30)).toBe(true);
      expect(getMarketplaceLaunchMessaging(sep30).canTransact).toBe(true);
    });

    it('transitions to Phase 2 (Marketplace Commerce Active)', () => {
      expect(getCurrentLaunchPhase(sep30)).toBe('PHASE_2_MARKETPLACE_COMMERCE_ACTIVE');
    });

    it('updates marketplace messaging to live commerce status', () => {
      const msg = getMarketplaceLaunchMessaging(sep30);
      expect(msg.bannerTitle).toBe('Marketplace commerce is now live.');
      expect(msg.badge).toBe('Commerce Live');
    });

    it('continues providing 100% free creator access through October 31', () => {
      expect(isCreatorFreeAccessActive(sep30)).toBe(true);
      expect(isCreatorPaidTiersActive(sep30)).toBe(false);
      expect(getCreatorLaunchMessaging(sep30).isFree).toBe(true);
    });
  });

  describe('Phase 2 Boundary: October 31, 2026 (Final Day of Creator Free Promo)', () => {
    const oct31 = new Date('2026-10-31T23:59:59Z');

    it('preserves free creator access on the last second of October', () => {
      expect(isCreatorFreeAccessActive(oct31)).toBe(true);
      expect(isCreatorPaidTiersActive(oct31)).toBe(false);
    });

    it('continues active marketplace commerce', () => {
      expect(isMarketplaceCommerceActive(oct31)).toBe(true);
    });
  });

  describe('Phase 3: November 1, 2026 (Paid Creator Tiers Launch)', () => {
    const nov1 = new Date('2026-11-01T00:00:00Z');

    it('transitions creators from free promotional access to paid tiers', () => {
      expect(isCreatorFreeAccessActive(nov1)).toBe(false);
      expect(isCreatorPaidTiersActive(nov1)).toBe(true);
    });

    it('transitions to Phase 3 (Full Commercial Monetization)', () => {
      expect(getCurrentLaunchPhase(nov1)).toBe('PHASE_3_FULL_COMMERCIAL_MONETIZATION');
    });

    it('updates creator messaging to active subscription tiers', () => {
      const msg = getCreatorLaunchMessaging(nov1);
      expect(msg.isFree).toBe(false);
      expect(msg.paidTiersActive).toBe(true);
      expect(msg.bannerTitle).toBe('Creator plans are now available.');
      expect(msg.badge).toBe('Creator Plans Active');
    });

    it('maintains active marketplace commerce', () => {
      expect(isMarketplaceCommerceActive(nov1)).toBe(true);
    });
  });
});
