import { describe, it, expect } from 'vitest';
import { EntitlementEngine } from '../../packages/payments/src/entitlements';

describe('TUKUBI Entitlement Engine', () => {
  const engine = new EntitlementEngine();

  describe('User Tiers', () => {
    it('verifies free user core social & browsing entitlements', () => {
      expect(engine.hasEntitlement('user_free', 'social_access')).toBe(true);
      expect(engine.hasEntitlement('user_free', 'browse_marketplace')).toBe(true);
      expect(engine.hasEntitlement('user_free', 'purchase_goods')).toBe(true);
      expect(engine.hasEntitlement('user_free', 'patron_badge')).toBe(false);
      expect(engine.hasEntitlement('user_free', 'priority_support')).toBe(false);
    });

    it('verifies premium user patron entitlements', () => {
      expect(engine.hasEntitlement('user_premium', 'patron_badge')).toBe(true);
      expect(engine.hasEntitlement('user_premium', 'priority_support')).toBe(true);
    });
  });

  describe('Creator Tiers', () => {
    it('verifies Free Creator gets tips but not reduced commission or HD live', () => {
      expect(engine.hasEntitlement('creator_free', 'fan_tips')).toBe(true);
      expect(engine.hasEntitlement('creator_free', 'live_gifts')).toBe(true);
      expect(engine.hasEntitlement('creator_free', 'reduced_commission')).toBe(false);
      expect(engine.hasEntitlement('creator_free', 'hd_broadcast')).toBe(false);
      expect(engine.hasEntitlement('creator_free', 'dedicated_manager')).toBe(false);
    });

    it('verifies Creator Plus unlocks reduced commission and custom gifts', () => {
      expect(engine.hasEntitlement('creator_plus', 'reduced_commission')).toBe(true);
      expect(engine.hasEntitlement('creator_plus', 'custom_live_gifts')).toBe(true);
      expect(engine.hasEntitlement('creator_plus', 'hd_broadcast')).toBe(true);
      expect(engine.hasEntitlement('creator_plus', 'dedicated_manager')).toBe(false);
    });

    it('verifies Creator Pro unlocks zero tip commission and dedicated partner manager', () => {
      expect(engine.hasEntitlement('creator_pro', 'zero_tip_commission')).toBe(true);
      expect(engine.hasEntitlement('creator_pro', 'dedicated_manager')).toBe(true);
      expect(engine.hasEntitlement('creator_pro', 'priority_discovery')).toBe(true);
    });
  });

  describe('Merchant & Business Listing Limits', () => {
    it('enforces 5 listings limit on merchant_free / business_free', () => {
      expect(engine.getListingLimit('merchant_free')).toBe(5);
      expect(engine.getListingLimit('business_free')).toBe(5);
      expect(engine.canCreateListing('business_free', 4)).toBe(true);
      expect(engine.canCreateListing('business_free', 5)).toBe(false);
      expect(engine.canCreateListing('business_free', 6)).toBe(false);
    });

    it('grants unlimited listings to Seller Pro and Business+', () => {
      expect(engine.getListingLimit('seller_pro')).toBeNull();
      expect(engine.getListingLimit('business_plus')).toBeNull();
      expect(engine.canCreateListing('seller_pro', 500)).toBe(true);
      expect(engine.canCreateListing('business_plus', 10000)).toBe(true);
    });

    it('verifies advanced business tools on Business+ and Enterprise', () => {
      expect(engine.hasEntitlement('business_plus', 'advanced_crm')).toBe(true);
      expect(engine.hasEntitlement('business_plus', 'ai_sales_assistant')).toBe(true);
      expect(engine.hasEntitlement('business_plus', 'multi_staff')).toBe(true);
      expect(engine.hasEntitlement('seller_pro', 'advanced_crm')).toBe(false);
    });
  });
});
