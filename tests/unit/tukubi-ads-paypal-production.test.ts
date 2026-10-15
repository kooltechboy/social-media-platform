import { describe, it, expect } from 'vitest';
import { 
  PaymentPolicyEngine,
  LedgerOrchestrator,
  DEFAULT_CAPABILITY_RULES,
  REGISTERED_PROVIDERS,
} from '../../packages/payments/src/index';
import { 
  estimateCampaignReach, 
  isAdEligible, 
  formatSponsoredFeedItem, 
  rankAndSelectAds,
  type AdCandidate, 
  type ViewerContext 
} from '../../packages/advertising/src/index';

describe('TUKUBI Ads & PayPal Prepaid Production Infrastructure', () => {
  describe('1. PayPal Capability & Prepaid Ad Funding Rules', () => {
    it('registers business_ad capability for PayPal with $10.00 minimum spend', () => {
      const engine = new PaymentPolicyEngine();
      const decision = engine.decide({
        countryIso: 'JAM',
        platform: 'web',
        productType: 'business_ad',
        amountMinor: 1000, // $10.00
        currency: 'USD',
      });

      expect(decision.compliant).toBe(true);
      expect(decision.permittedProviders).toContain('paypal');

      // Rejects below $10 minimum
      const belowMinDecision = engine.decide({
        countryIso: 'JAM',
        platform: 'web',
        productType: 'business_ad',
        amountMinor: 999, // $9.99
        currency: 'USD',
      });
      expect(belowMinDecision.compliant).toBe(false);
      expect(belowMinDecision.reason).toContain('permitted bounds');
    });

    it('enforces maximum transaction limit on PayPal ad funding ($50,000 USD)', () => {
      const engine = new PaymentPolicyEngine();
      const overMaxDecision = engine.decide({
        countryIso: 'JAM',
        platform: 'web',
        productType: 'business_ad',
        amountMinor: 5000001, // $50,000.01
        currency: 'USD',
      });
      expect(overMaxDecision.compliant).toBe(false);
      expect(overMaxDecision.reason).toContain('permitted bounds');
    });
  });

  describe('2. Reach & Delivery Estimation Engine', () => {
    it('calculates transparent impressions and reach for $10.00 baseline budget', () => {
      const reach = estimateCampaignReach(1000, 'USD', 'feed');
      // $10.00 at $6.00 CPM = ~1,667 impressions
      expect(reach.estimatedImpressions).toBe(1667);
      expect(reach.minReach).toBe(Math.round(1667 * 0.65));
      expect(reach.maxReach).toBe(Math.round(1667 * 0.95));
      expect(reach.estimatedCpmMinor).toBe(600);
    });

    it('scales reach linearly with budget amount', () => {
      const reach100 = estimateCampaignReach(10000, 'USD', 'feed');
      // $100.00 at $6.00 CPM = ~16,667 impressions
      expect(reach100.estimatedImpressions).toBe(16667);
      expect(reach100.estimatedImpressions).toBeGreaterThan(16000);
    });

    it('applies placement-specific baseline CPMs (video/reels $7.50, stories $5.00)', () => {
      const reelsReach = estimateCampaignReach(1500, 'USD', 'reels');
      expect(reelsReach.estimatedCpmMinor).toBe(750);
      expect(reelsReach.estimatedImpressions).toBe(2000);

      const storiesReach = estimateCampaignReach(1000, 'USD', 'stories');
      expect(storiesReach.estimatedCpmMinor).toBe(500);
      expect(storiesReach.estimatedImpressions).toBe(2000);
    });
  });

  describe('3. Prepaid Balance & Budget Exhaustion Safety', () => {
    const candidateAd: AdCandidate = {
      id: 'ad_carib_1',
      adSetId: 'set_1',
      campaignId: 'camp_1',
      advertiserId: 'adv_1',
      advertiserName: 'Trinidad Carnival Mas Camp',
      headline: 'Experience Carnival 2027 in Port of Spain',
      destinationUrl: 'https://carnivalmas.tt',
      isApproved: true,
      campaignStatus: 'active',
      placement: 'feed',
      bidCpmMinor: 800,
      budgetDailyMinor: 5000,
      spentTodayMinor: 500,
      fundedAmountMinor: 5000, // $50 funded
      totalSpentMinor: 1200,   // $12 spent
    };

    const viewer: ViewerContext = {
      userId: 'viewer_1',
      placement: 'feed',
    };

    it('delivers ad when funded amount exceeds spent amount', () => {
      expect(isAdEligible(candidateAd, viewer)).toBe(true);
    });

    it('strictly halts ad delivery when campaign is unfunded (fundedAmountMinor = 0)', () => {
      const unfundedAd: AdCandidate = {
        ...candidateAd,
        fundedAmountMinor: 0,
      };
      expect(isAdEligible(unfundedAd, viewer)).toBe(false);
    });

    it('strictly halts ad delivery when totalSpentMinor reaches fundedAmountMinor', () => {
      const exhaustedAd: AdCandidate = {
        ...candidateAd,
        fundedAmountMinor: 5000,
        totalSpentMinor: 5000, // 100% budget exhausted
      };
      expect(isAdEligible(exhaustedAd, viewer)).toBe(false);
    });

    it('strictly halts ad delivery if spent exceeds funded amount (fail-safe overdraft lock)', () => {
      const overspentAd: AdCandidate = {
        ...candidateAd,
        fundedAmountMinor: 5000,
        totalSpentMinor: 5050,
      };
      expect(isAdEligible(overspentAd, viewer)).toBe(false);
    });
  });

  describe('4. Feed Formatting & Identity Integrity', () => {
    const rawAd: AdCandidate = {
      id: 'ad_99',
      adSetId: 'set_99',
      campaignId: 'camp_99',
      advertiserId: 'adv_99',
      advertiserName: 'Bajan Beach Club',
      headline: 'Sunset Cocktails in Carlisle Bay',
      body: 'Book your beachfront cabana for Barbados Food and Rum Festival.',
      destinationUrl: 'https://bajanbeach.bb/reserve',
      isApproved: true,
      campaignStatus: 'active',
      placement: 'feed',
      bidCpmMinor: 800,
      budgetDailyMinor: 5000,
      spentTodayMinor: 0,
      fundedAmountMinor: 10000,
      totalSpentMinor: 0,
    };

    it('formats sponsored item with clear sponsorship disclosure and zero-state engagement', () => {
      const item = formatSponsoredFeedItem(rawAd);
      expect(item.id).toBe('ad_ad_99');
      expect(item.isSponsored).toBe(true);
      expect(item.time).toBe('Promoted');
      expect(item.likes).toBe(0);
      expect(item.comments).toBe(0);
      expect(item.reposts).toBe(0);
      expect(item.headline).toBe('Sunset Cocktails in Carlisle Bay');
      expect(item.destinationUrl).toBe('https://bajanbeach.bb/reserve');
      expect(item.author).toBe('Bajan Beach Club');
    });
  });

  describe('5. Double-Entry Ledger Escrow Settlement', () => {
    it('creates debit and credit ledger pairs strictly balancing to Net Zero', () => {
      const orchestrator = new LedgerOrchestrator();
      const payload = orchestrator.createDoubleEntryPayload({
        transactionId: 'tx_ad_paypal_001',
        amount: 2500, // $25.00
        sourceAccountId: 'user_paypal_deposit',
        destinationAccountId: 'campaign_budget_escrow',
        idempotencyKey: 'idemp_ad_paypal_001',
        description: 'Prepaid TUKUBI Ads campaign budget funding via PayPal',
      });

      expect(payload.debitEntry).toBeDefined();
      expect(payload.creditEntry).toBeDefined();
      expect(payload.debitEntry.amount).toBe(-2500);
      expect(payload.creditEntry.amount).toBe(2500);
      // Net Zero condition: debit + credit = 0
      expect(payload.debitEntry.amount + payload.creditEntry.amount).toBe(0);
    });

    it('rejects invalid, zero, or negative amounts in ledger entries', () => {
      const orchestrator = new LedgerOrchestrator();
      expect(() => {
        orchestrator.createDoubleEntryPayload({
          transactionId: 'tx_invalid',
          amount: 0,
          sourceAccountId: 'user_wallet',
          destinationAccountId: 'escrow',
          idempotencyKey: 'idemp_0',
          description: 'Zero amount funding',
        });
      }).toThrow('Financial transaction amount must be strictly greater than zero.');
    });
  });
});
