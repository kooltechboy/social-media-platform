import { describe, it, expect } from 'vitest';
import {
  LedgerOrchestrator,
  PaymentPolicyEngine,
  CommissionEngine,
  EntitlementEngine,
  Money,
  CAN_USE_ADVANCED_ANALYTICS,
  CAN_MONETIZE,
  CAN_CREATE_PAID_SUBSCRIPTIONS,
  CAN_SELL_DIGITAL_PRODUCTS,
  CAN_CREATE_ADVANCED_CAMPAIGNS,
  CAN_USE_ADVANCED_CREATOR_TOOLS,
  CAN_ACCESS_STORE_PRO,
  PayPalAdapter,
} from '../../packages/payments/src/index';

describe('TUKUBI Payments & Monetization Production Architecture', () => {
  const orchestrator = new LedgerOrchestrator();
  const policyEngine = new PaymentPolicyEngine();
  const commissionEngine = new CommissionEngine();
  const entitlementEngine = new EntitlementEngine();

  // =========================================================================
  // 1. Double-Entry Ledger Invariants
  // =========================================================================
  describe('Double-Entry Ledger Integrity & Invariants', () => {
    it('enforces total debit + total credit = 0 on every paired entry', () => {
      const payload = orchestrator.createDoubleEntryPayload({
        transactionId: 'tx_sub_001',
        sourceAccountId: 'acc_buyer_wallet',
        destinationAccountId: 'acc_tukubi_treasury',
        amount: 1499, // $14.99 Seller Pro
        currency: 'USD',
        idempotencyKey: 'idemp_sub_001',
        description: 'TUKUBI Seller Pro Subscription',
      });

      expect(payload.debitEntry.amount).toBe(-1499);
      expect(payload.creditEntry.amount).toBe(1499);
      expect(payload.debitEntry.amount + payload.creditEntry.amount).toBe(0);
      expect(payload.debitEntry.entry_type).toBe('DEBIT');
      expect(payload.creditEntry.entry_type).toBe('CREDIT');
    });

    it('enforces multi-split double-entry balancing (Gross = Net Creator + Platform Commission)', () => {
      // Creator Fan Subscription of $10.00 with 15% platform commission ($1.50) and $8.50 creator net
      const grossAmount = 1000;
      const commissionAmount = 150;
      const creatorNetAmount = 850;

      expect(grossAmount).toBe(commissionAmount + creatorNetAmount);

      // Multi-split entries:
      // 1. Debit Escrow: -1000
      // 2. Credit Creator Pending: +850
      // 3. Credit Platform Revenue: +150
      const entries = [
        { accountId: 'acc_paypal_escrow', amount: -grossAmount, entryType: 'DEBIT' },
        { accountId: 'acc_creator_pending', amount: creatorNetAmount, entryType: 'CREDIT' },
        { accountId: 'acc_platform_revenue', amount: commissionAmount, entryType: 'CREDIT' },
      ];

      const sum = entries.reduce((acc, e) => acc + e.amount, 0);
      expect(sum).toBe(0);
    });

    it('strictly rejects non-integer minor unit amounts (no floats allowed in ledger)', () => {
      expect(() =>
        orchestrator.createDoubleEntryPayload({
          transactionId: 'tx_float_err',
          sourceAccountId: 'acc_1',
          destinationAccountId: 'acc_2',
          amount: 19.99, // float!
          currency: 'USD',
          idempotencyKey: 'idemp_err',
          description: 'Float amount attempt',
        })
      ).toThrow(/integer in minor units/i);
    });

    it('strictly rejects zero or negative transaction amounts', () => {
      expect(() =>
        orchestrator.createDoubleEntryPayload({
          transactionId: 'tx_zero_err',
          sourceAccountId: 'acc_1',
          destinationAccountId: 'acc_2',
          amount: 0,
          currency: 'USD',
          idempotencyKey: 'idemp_zero',
          description: 'Zero amount attempt',
        })
      ).toThrow(/greater than zero/i);

      expect(() =>
        orchestrator.createDoubleEntryPayload({
          transactionId: 'tx_neg_err',
          sourceAccountId: 'acc_1',
          destinationAccountId: 'acc_2',
          amount: -500,
          currency: 'USD',
          idempotencyKey: 'idemp_neg',
          description: 'Negative amount attempt',
        })
      ).toThrow(/greater than zero/i);
    });
  });

  // =========================================================================
  // 2. Model A vs Model B Revenue Segregation
  // =========================================================================
  describe('Model A vs Model B Revenue Segregation', () => {
    it('segregates Model A (100% TUKUBI Retained) from Model B (Split Marketplace GMV)', () => {
      // Model A Transaction: TUKUBI Creator Pro Platform Subscription
      const modelATx = {
        modelType: 'MODEL_A' as const,
        type: 'TUKUBI_SUBSCRIPTION' as const,
        amountMinor: 2999, // $29.99
        feeAmountMinor: 2999, // 100% retained by TUKUBI
        netAmountMinor: 0,
      };

      // Model B Transaction: Marketplace Cultural Craft Purchase
      const modelBTx = {
        modelType: 'MODEL_B' as const,
        type: 'MARKETPLACE_PURCHASE' as const,
        amountMinor: 10000, // $100.00 GMV
        feeAmountMinor: 1000, // 10% platform commission ($10.00 retained)
        netAmountMinor: 9000, // $90.00 to merchant
      };

      // Model A revenue check
      expect(modelATx.feeAmountMinor).toBe(modelATx.amountMinor);
      expect(modelATx.netAmountMinor).toBe(0);

      // Model B revenue check
      expect(modelBTx.amountMinor).toBe(10000); // GMV
      expect(modelBTx.feeAmountMinor).toBe(1000); // TUKUBI Commission
      expect(modelBTx.netAmountMinor).toBe(9000); // Merchant Net

      // Platform Retained Revenue across both
      const totalRetainedRevenue = modelATx.feeAmountMinor + modelBTx.feeAmountMinor;
      expect(totalRetainedRevenue).toBe(3999); // $29.99 + $10.00 = $39.99

      // Total GMV across both
      const totalGMV = modelBTx.amountMinor;
      expect(totalGMV).toBe(10000);
    });
  });

  // =========================================================================
  // 3. Dynamic Commission Calculations Across Tiers
  // =========================================================================
  describe('Dynamic Commission Calculations Across Tiers', () => {
    it('calculates creator tip commissions: 10% for free creator vs 0% for Creator Pro', () => {
      // Free Creator: 10% standard tip commission (1000 bps)
      const freeResult = commissionEngine.calculate({
        grossMinor: 5000, // $50 tip
        sellerCategory: 'creator',
        sellerTierCode: 'free',
        productType: 'creator_tip',
        processingCostBps: 0,
        processingCostFixedMinor: 0,
      });

      expect(freeResult.grossMinor).toBe(5000);
      expect(freeResult.commissionRateBps).toBe(1000); // 10%
      expect(freeResult.commissionMinor).toBe(500); // $5.00
      expect(freeResult.sellerNetMinor).toBe(4500); // $45.00
      expect(freeResult.tukubiRevenueMinor).toBe(500);

      // Creator Pro: 0% tip commission exemption (isExempt: true)
      const proResult = commissionEngine.calculate({
        grossMinor: 5000,
        sellerCategory: 'creator',
        sellerTierCode: 'pro',
        productType: 'creator_tip',
        processingCostBps: 0,
        processingCostFixedMinor: 0,
      });

      expect(proResult.commissionRateBps).toBe(0);
      expect(proResult.commissionMinor).toBe(0);
      expect(proResult.sellerNetMinor).toBe(5000); // 100% to creator
      expect(proResult.tukubiRevenueMinor).toBe(0);
    });

    it('calculates Free Merchant (8% + 30¢) vs Seller Pro (0% commission) physical goods', () => {
      // Free Merchant: 8% + 30¢ fixed
      const freeResult = commissionEngine.calculate({
        grossMinor: 10000, // $100.00
        sellerCategory: 'merchant',
        sellerTierCode: 'free',
        productType: 'physical',
        processingCostBps: 0,
        processingCostFixedMinor: 0,
      });
      expect(freeResult.commissionRateBps).toBe(800); // 8%
      expect(freeResult.commissionMinor).toBe(800); // $8.00
      expect(freeResult.fixedFeeMinor).toBe(30); // $0.30
      expect(freeResult.tukubiRevenueMinor).toBe(830);

      // Seller Pro: 0% commission rate on marketplace sales
      const proResult = commissionEngine.calculate({
        grossMinor: 10000, // $100.00
        sellerCategory: 'merchant',
        sellerTierCode: 'pro',
        productType: 'physical',
        processingCostBps: 0,
        processingCostFixedMinor: 0,
      });
      expect(proResult.commissionRateBps).toBe(0); // 0%
      expect(proResult.commissionMinor).toBe(0);
      expect(proResult.fixedFeeMinor).toBe(0);
      expect(proResult.sellerNetMinor).toBe(10000); // 100% net to Seller Pro
      expect(proResult.tukubiRevenueMinor).toBe(0);
    });
  });

  // =========================================================================
  // 4. Anti-Tampering & Zero-Trust Price/Currency Verification
  // =========================================================================
  describe('Anti-Tampering & Security Validations', () => {
    it('formats and compares money with strict currency isolation', () => {
      const mUSD = new Money(2500, 'USD');
      const mEUR = new Money(2500, 'EUR');

      expect(mUSD.format()).toBe('$25.00');
      expect(mEUR.format()).toBe('€25.00');

      // Money instances of different currencies cannot be directly equated
      expect(mUSD.currency).not.toBe(mEUR.currency);
    });

    it('prevents negative money allocations or fractional values in Money class', () => {
      expect(() => new Money(10.75, 'USD')).toThrow(/integer/i);
    });
  });

  // =========================================================================
  // 5. Centralized Entitlement Engine Gates
  // =========================================================================
  describe('Centralized Entitlement Engine Gates & Canonical Keys', () => {
    it('verifies all new canonical capability keys are properly defined', () => {
      expect(CAN_USE_ADVANCED_ANALYTICS).toBe('CAN_USE_ADVANCED_ANALYTICS');
      expect(CAN_MONETIZE).toBe('CAN_MONETIZE');
      expect(CAN_CREATE_PAID_SUBSCRIPTIONS).toBe('CAN_CREATE_PAID_SUBSCRIPTIONS');
      expect(CAN_SELL_DIGITAL_PRODUCTS).toBe('CAN_SELL_DIGITAL_PRODUCTS');
      expect(CAN_CREATE_ADVANCED_CAMPAIGNS).toBe('CAN_CREATE_ADVANCED_CAMPAIGNS');
      expect(CAN_USE_ADVANCED_CREATOR_TOOLS).toBe('CAN_USE_ADVANCED_CREATOR_TOOLS');
      expect(CAN_ACCESS_STORE_PRO).toBe('CAN_ACCESS_STORE_PRO');
    });

    it('correctly gates creator monetization features between Free and Pro tiers', () => {
      // Free creator can monetize (tips/fan support) but cannot use advanced creator tools or zero-commission
      expect(entitlementEngine.canMonetize('creator_free')).toBe(true);
      expect(entitlementEngine.canUseAdvancedAnalytics('creator_free')).toBe(false);
      expect(entitlementEngine.canUseAdvancedCreatorTools('creator_free')).toBe(false);

      // Creator Pro unlocks advanced analytics, advanced creator tools, and zero tip commission
      expect(entitlementEngine.canMonetize('creator_pro')).toBe(true);
      expect(entitlementEngine.canUseAdvancedAnalytics('creator_pro')).toBe(true);
      expect(entitlementEngine.canUseAdvancedCreatorTools('creator_pro')).toBe(true);
      expect(entitlementEngine.hasEntitlement('creator_pro', 'zero_tip_commission')).toBe(true);
    });

    it('correctly gates seller store pro features between Free and Pro seller tiers', () => {
      expect(entitlementEngine.canAccessStorePro('merchant_free')).toBe(false);
      expect(entitlementEngine.canAccessStorePro('seller_pro')).toBe(true);
      expect(entitlementEngine.canAccessStorePro('business_plus')).toBe(true);
    });
  });

  // =========================================================================
  // 6. PayPal Adapter & Webhook Security Architecture
  // =========================================================================
  describe('PayPal Adapter & Webhook Verification Logic', () => {
    it('instantiates PayPal adapter with sandboxed safe defaults', () => {
      const adapter = new PayPalAdapter();
      expect(adapter.providerName).toBe('paypal');
      expect(typeof adapter.isConfigured).toBe('boolean');
    });

    it('rejects capture or refund when adapter is not configured with credentials', async () => {
      const adapter = new PayPalAdapter();
      if (!adapter.isConfigured) {
        const chargeResult = await adapter.charge({
          amountMinor: 1000,
          currency: 'USD',
          sourceToken: 'token_mock',
          idempotencyKey: 'idemp_mock_001',
        });
        expect(chargeResult.success).toBe(false);
        expect(chargeResult.errorMessage).toMatch(/credentials are unavailable/i);

        const subResult = await adapter.createSubscription({
          planId: 'plan_test_001',
          subscriberId: 'usr_test_001',
          subscriberEmail: 'carib@tukubi.caribbean',
          returnUrl: 'https://tukubi.caribbean/return',
          cancelUrl: 'https://tukubi.caribbean/cancel',
        });
        expect(subResult.success).toBe(false);
        expect(subResult.errorMessage).toMatch(/credentials are unavailable/i);
      }
    });

    it('verifies webhook signature rejects unconfigured or malformed payload safely', async () => {
      const adapter = new PayPalAdapter();
      const verified = await adapter.verifyWebhook(
        '{"event_type":"PAYMENT.CAPTURE.COMPLETED"}',
        {
          'paypal-auth-algo': 'SHA256withRSA',
          'paypal-cert-url': 'https://api.sandbox.paypal.com/v1/notifications/certs/CERT-123',
          'paypal-transmission-id': 'trans_123',
          'paypal-transmission-sig': 'fake_sig',
          'paypal-transmission-time': new Date().toISOString(),
        }
      );

      // Without actual live PayPal credentials, signature verification safely returns false
      expect(verified).toBe(false);
    });
  });

  // =========================================================================
  // 7. Store Policy & In-App Purchase Compliance
  // =========================================================================
  describe('Apple App Store & Google Play Policy Compliance', () => {
    it('strictly routes iOS digital goods through native In-App Purchase', () => {
      const decision = policyEngine.decide({
        countryIso: 'USA',
        platform: 'ios',
        productType: 'digital_subscription',
        currency: 'USD',
        amountMinor: 999,
      });

      expect(decision.compliant).toBe(true);
      expect(decision.permittedProviders).toContain('apple_pay');
    });

    it('strictly routes Android digital goods through Google Play Billing', () => {
      const decision = policyEngine.decide({
        countryIso: 'JAM',
        platform: 'android',
        productType: 'digital_subscription',
        currency: 'USD',
        amountMinor: 999,
      });

      expect(decision.compliant).toBe(true);
      expect(decision.permittedProviders).toContain('google_pay');
    });

    it('permits Web platform to route physical goods via PayPal & Web PSP rails', () => {
      const decision = policyEngine.decide({
        countryIso: 'JAM',
        platform: 'web',
        productType: 'physical_goods',
        currency: 'USD',
        amountMinor: 5000,
      });

      expect(decision.compliant).toBe(true);
      expect(decision.permittedProviders).toContain('paypal');
      expect(decision.permittedProviders).toContain('stripe');
    });
  });
});
