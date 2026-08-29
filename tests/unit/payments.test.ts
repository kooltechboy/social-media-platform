import { describe, it, expect } from 'vitest';
import {
  Money,
  PaymentPolicyEngine,
  PaymentIntentService,
  WebhookProcessor,
  computeRefundBreakdown,
  LedgerOrchestrator,
  MonetizationEngine,
  SELLER_PLANS,
  CREATOR_TIERS,
  DEFAULT_CAPABILITY_RULES,
  StripeAdapter,
  PayPalAdapter,
  CXPayAdapter,
  WiPayAdapter,
  CashAppAdapter,
  ProviderRegistry,
  ConnectionStateMachine,
} from '../../packages/payments/src/index';

describe('TUKUBI Money (integer minor units)', () => {
  it('rejects non-integer and non-ISO inputs', () => {
    expect(() => new Money(10.5, 'USD')).toThrow('integer in minor units');
    expect(() => new Money(1000, 'usd')).toThrow('ISO 4217');
  });

  it('arithmetic stays in minor units and enforces currency match', () => {
    const a = new Money(1000, 'USD');
    const b = new Money(299, 'USD');
    expect(a.add(b).amountMinor).toBe(1299);
    expect(a.subtract(b).amountMinor).toBe(701);
    expect(a.multiply(1.5).amountMinor).toBe(1500);
    expect(a.percentage(1500).amountMinor).toBe(150);
    expect(() => a.add(new Money(1, 'EUR'))).toThrow('Currency mismatch');
  });

  it('formats locale-aware currency', () => {
    expect(new Money(123456, 'USD').format('en-US')).toBe('$1,234.56');
  });
});

describe('Ledger Orchestrator (double-entry integrity)', () => {
  const ledger = new LedgerOrchestrator();

  it('generates balanced double-entry debit and credit pairs', () => {
    const pair = ledger.createDoubleEntryPayload({
      transactionId: 'tx_123',
      sourceAccountId: 'acc_source',
      destinationAccountId: 'acc_dest',
      amount: 50.0,
      currency: 'USD',
      idempotencyKey: 'idemp_123',
      description: 'Order Payment',
    });

    expect(pair.debitEntry.amount + pair.creditEntry.amount).toBe(0);
    expect(pair.debitEntry.amount).toBe(-50.0);
    expect(pair.creditEntry.amount).toBe(50.0);
    expect(pair.debitEntry.entry_type).toBe('DEBIT');
    expect(pair.creditEntry.entry_type).toBe('CREDIT');
  });

  it('rejects zero or negative transaction amounts', () => {
    expect(() =>
      ledger.createDoubleEntryPayload({
        transactionId: 'tx_123',
        sourceAccountId: 'acc_1',
        destinationAccountId: 'acc_2',
        amount: -10,
        currency: 'USD',
        idempotencyKey: 'idemp_1',
        description: 'Invalid',
      })
    ).toThrow('strictly greater than zero');
  });

  it('creates compensating reversal pairs', () => {
    const reversal = ledger.createReversalPayload(
      'tx_original',
      'tx_reversal',
      'acc_buyer',
      'acc_seller',
      25.0,
      'rev_key',
      'Order cancelled'
    );

    expect(reversal.debitEntry.amount + reversal.creditEntry.amount).toBe(0);
    expect(reversal.debitEntry.account_id).toBe('acc_seller');
    expect(reversal.creditEntry.account_id).toBe('acc_buyer');
  });
});

describe('Payment Policy Engine (store compliance & provider routing)', () => {
  const engine = new PaymentPolicyEngine(DEFAULT_CAPABILITY_RULES);

  it('routes digital subscriptions on iOS exclusively through Apple Pay / IAP', () => {
    const decision = engine.decide({
      countryIso: 'USA',
      platform: 'ios',
      productType: 'digital_subscription',
      amountMinor: 499,
    });
    expect(decision.compliant).toBe(true);
    expect(decision.permittedProviders).toEqual(['apple_pay']);
  });

  it('routes digital goods on Android exclusively through Google Pay / Play Billing', () => {
    const decision = engine.decide({
      countryIso: 'JAM',
      platform: 'android',
      productType: 'live_gift',
      amountMinor: 499,
    });
    expect(decision.compliant).toBe(true);
    expect(decision.permittedProviders).toEqual(['google_pay']);
  });

  it('permits cards, PayPal, and Caribbean rails for physical goods on web', () => {
    const decision = engine.decide({
      countryIso: 'CAN',
      platform: 'web',
      productType: 'physical_goods',
      amountMinor: 5000,
    });
    expect(decision.compliant).toBe(true);
    expect(decision.permittedProviders).toContain('stripe');
    expect(decision.permittedProviders).toContain('paypal');
    expect(decision.permittedProviders).toContain('cxpay');
    expect(decision.permittedProviders).toContain('wipay');
  });

  it('rejects amounts outside capability bounds', () => {
    const decision = engine.decide({
      countryIso: 'CAN',
      platform: 'web',
      productType: 'physical_goods',
      amountMinor: 10,
    });
    expect(decision.compliant).toBe(false);
    expect(decision.reason).toContain('outside permitted bounds');
  });
});

describe('Payment Intent Service (lifecycle state machine)', () => {
  const service = new PaymentIntentService();
  const seen = new Set<string>();

  it('creates an intent and blocks duplicate idempotency keys', () => {
    const intent = service.create({
      payerId: 'usr_1',
      productType: 'creator_tip',
      amountMinor: 500,
      currency: 'USD',
      idempotencyKey: 'key_abc12345',
      seenIdempotencyKeys: seen,
    });
    expect(intent.status).toBe('requires_payment');
    expect(() =>
      service.create({
        payerId: 'usr_1',
        productType: 'creator_tip',
        amountMinor: 500,
        currency: 'USD',
        idempotencyKey: 'key_abc12345',
        seenIdempotencyKeys: seen,
      })
    ).toThrow('Duplicate idempotency key');
  });

  it('enforces valid lifecycle transitions only', () => {
    const intent = service.create({
      payerId: 'usr_1',
      productType: 'event_ticket',
      amountMinor: 1500,
      currency: 'USD',
      idempotencyKey: 'key_def67890',
      seenIdempotencyKeys: seen,
    });
    const processing = service.transition(intent, 'processing');
    expect(processing.status).toBe('processing');
    const succeeded = service.transition(processing, 'succeeded');
    expect(succeeded.status).toBe('succeeded');
    expect(() => service.transition(succeeded, 'failed')).toThrow();
  });
});

describe('Webhook Processing (deduplication & signatures)', () => {
  it('rejects unsigned webhooks and dedupes replay events', () => {
    const processor = new WebhookProcessor((payload, signature) => signature === `sig:${payload.length}`);
    const event = {
      id: 'evt_1',
      providerId: 'stripe',
      type: 'payment_intent.succeeded',
      payload: 'x'.repeat(50),
      signature: 'sig:50',
    };
    expect(processor.process(event)).toMatchObject({ accepted: true, duplicate: false });
    expect(processor.process(event)).toMatchObject({ accepted: true, duplicate: true });
    expect(processor.process({ ...event, id: 'evt_2', signature: 'sig:wrong' })).toMatchObject({
      accepted: false,
      reason: 'Signature verification failed',
    });
  });
});

describe('Refund Calculation Engine', () => {
  it('supports partial refunds up to charged limit', () => {
    const first = computeRefundBreakdown(10000, [], 3000);
    expect(first).toMatchObject({ refundableMinor: 10000, refundedMinor: 3000, remainingMinor: 7000 });
    const second = computeRefundBreakdown(10000, [3000], 7000);
    expect(second.remainingMinor).toBe(0);
    expect(() => computeRefundBreakdown(10000, [3000], 7001)).toThrow('exceeds refundable balance');
  });
});

describe('Monetization Engine & Seller Plans', () => {
  const engine = new MonetizationEngine();

  it('verifies 0% platform fee on Seller Pro and Business+ plans', () => {
    expect(SELLER_PLANS.seller_pro.commissionRateBps).toBe(0);
    const breakdownPro = engine.calculateCheckoutBreakdown(10000, 'USD', {
      sellerPlanId: 'seller_pro',
      processingFeeBps: 290,
      processingFixedMinor: 30,
    });
    expect(breakdownPro.platformFeeMinor).toBe(0);
    expect(breakdownPro.processingFeeMinor).toBe(320); // $3.20 (2.9% + 30¢)
    expect(breakdownPro.netToMerchantMinor).toBe(9680); // $96.80
  });

  it('calculates creator tier fee structure', () => {
    expect(CREATOR_TIERS.creator_free.platformFeeBps).toBe(1000); // 10%
    const breakdownCreator = engine.calculateCheckoutBreakdown(5000, 'USD', {
      creatorTierId: 'creator_free',
    });
    expect(breakdownCreator.platformFeeMinor).toBe(500); // $5.00
  });
});

describe('Provider Connection State Machine', () => {
  it('manages valid provider connection states', () => {
    expect(ConnectionStateMachine.canTransition('NOT_CONNECTED', 'CONNECTING')).toBe(true);
    expect(ConnectionStateMachine.canTransition('CONNECTING', 'CONNECTED')).toBe(false); // must verify or auth first
    expect(ConnectionStateMachine.transition('NOT_CONNECTED', 'CONNECTING')).toBe('CONNECTING');
    expect(ConnectionStateMachine.isUsable('CONNECTED')).toBe(true);
    expect(ConnectionStateMachine.isUsable('CONNECTING')).toBe(false);
  });
});

describe('PSP Adapters (Stripe, PayPal, CX Pay, WiPay, Cash App)', () => {
  it('executes Stripe adapter charges and refunds', async () => {
    const adapter = new StripeAdapter();
    const charge = await adapter.charge({
      amountMinor: 2500,
      currency: 'USD',
      idempotencyKey: 'test_stripe_tx',
    });
    expect(charge.success).toBe(true);
    expect(charge.providerTransactionId).toContain('ch_stripe_sandbox_test_stripe_tx');

    const refund = await adapter.refund({
      providerTransactionId: charge.providerTransactionId,
      amountMinor: 2500,
      currency: 'USD',
      idempotencyKey: 'test_stripe_ref',
    });
    expect(refund.success).toBe(true);
  });

  it('executes PayPal adapter charges in sandbox', async () => {
    const adapter = new PayPalAdapter();
    const charge = await adapter.charge({
      amountMinor: 3500,
      currency: 'USD',
      idempotencyKey: 'test_paypal_tx',
    });
    expect(charge.success).toBe(true);
    expect(charge.providerName).toBe('paypal');
  });

  it('executes CX Pay Caribbean gateway charges in sandbox', async () => {
    const adapter = new CXPayAdapter();
    const charge = await adapter.charge({
      amountMinor: 5000,
      currency: 'USD',
      idempotencyKey: 'test_cxpay_tx',
    });
    expect(charge.success).toBe(true);
    expect(charge.providerName).toBe('cxpay');
  });

  it('executes WiPay Caribbean processor charges in sandbox', async () => {
    const adapter = new WiPayAdapter();
    const charge = await adapter.charge({
      amountMinor: 4000,
      currency: 'TTD',
      idempotencyKey: 'test_wipay_tx',
    });
    expect(charge.success).toBe(true);
    expect(charge.providerName).toBe('wipay');
  });

  it('executes Cash App Pay charges in sandbox', async () => {
    const adapter = new CashAppAdapter();
    const charge = await adapter.charge({
      amountMinor: 1500,
      currency: 'USD',
      idempotencyKey: 'test_cashapp_tx',
    });
    expect(charge.success).toBe(true);
    expect(charge.providerName).toBe('cashapp');
  });

  it('resolves all registered adapters from ProviderRegistry', () => {
    const registry = new ProviderRegistry();
    expect(registry.has('stripe')).toBe(true);
    expect(registry.has('paypal')).toBe(true);
    expect(registry.has('cxpay')).toBe(true);
    expect(registry.has('wipay')).toBe(true);
    expect(registry.has('cashapp')).toBe(true);
  });
});
