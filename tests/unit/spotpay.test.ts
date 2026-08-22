import { describe, it, expect } from 'vitest';
import {
  Money,
  PaymentPolicyEngine,
  PaymentIntentService,
  WebhookProcessor,
  computeRefundBreakdown,
  DEFAULT_CAPABILITY_RULES,
} from '../../packages/spotpay/src/index';

describe('SpotPay Money (integer minor units)', () => {
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

describe('Payment Policy Engine (store compliance)', () => {
  const engine = new PaymentPolicyEngine(DEFAULT_CAPABILITY_RULES);

  it('routes digital subscriptions on iOS exclusively through Apple IAP', () => {
    const decision = engine.decide({
      countryIso: 'USA', platform: 'ios', productType: 'digital_subscription', amountMinor: 499,
    });
    expect(decision.compliant).toBe(true);
    expect(decision.permittedProviders).toEqual(['apple']);
  });

  it('routes digital goods on Android exclusively through Google Play Billing', () => {
    const decision = engine.decide({
      countryIso: 'JAM', platform: 'android', productType: 'live_gift', amountMinor: 499,
    });
    expect(decision.compliant).toBe(true);
    expect(decision.permittedProviders).toEqual(['google']);
  });

  it('permits wallet, cards and PayPal for physical goods on web', () => {
    const decision = engine.decide({
      countryIso: 'CAN', platform: 'web', productType: 'physical_goods', amountMinor: 5000,
    });
    expect(decision.compliant).toBe(true);
    expect(decision.permittedProviders).toContain('stripe');
    expect(decision.permittedProviders).toContain('paypal');
    expect(decision.permittedProviders).toContain('spotpay');
  });

  it('rejects amounts outside capability bounds', () => {
    const decision = engine.decide({
      countryIso: 'CAN', platform: 'web', productType: 'physical_goods', amountMinor: 10,
    });
    expect(decision.compliant).toBe(false);
    expect(decision.reason).toBe('Amount outside permitted bounds');
  });
});

describe('Payment intents (idempotency + lifecycle)', () => {
  const service = new PaymentIntentService();
  const seen = new Set<string>();

  it('creates an intent and blocks duplicate idempotency keys', () => {
    const intent = service.create({
      payerId: 'usr_1', productType: 'creator_tip', amountMinor: 500,
      currency: 'USD', idempotencyKey: 'key_abc12345', seenIdempotencyKeys: seen,
    });
    expect(intent.status).toBe('requires_payment');
    expect(() =>
      service.create({
        payerId: 'usr_1', productType: 'creator_tip', amountMinor: 500,
        currency: 'USD', idempotencyKey: 'key_abc12345', seenIdempotencyKeys: seen,
      }),
    ).toThrow('Duplicate idempotency key');
  });

  it('enforces valid lifecycle transitions only', () => {
    const intent = service.create({
      payerId: 'usr_1', productType: 'event_ticket', amountMinor: 1500,
      currency: 'USD', idempotencyKey: 'key_def67890', seenIdempotencyKeys: seen,
    });
    const processing = service.transition(intent, 'processing');
    expect(processing.status).toBe('processing');
    const succeeded = service.transition(processing, 'succeeded');
    expect(succeeded.status).toBe('succeeded');
    expect(() => service.transition(succeeded, 'refunded' as never)).toThrow();
  });
});

describe('Webhook processing (signature + replay protection)', () => {
  it('rejects unsigned webhooks, accepts valid ones exactly once', () => {
    const processor = new WebhookProcessor((payload, signature) => signature === `sig:${payload.length}`);
    const event = { id: 'evt_1', type: 'payment_intent.succeeded', payload: 'x'.repeat(50), signature: 'sig:50' };
    expect(processor.process(event)).toMatchObject({ accepted: true, duplicate: false });
    expect(processor.process(event)).toMatchObject({ accepted: true, duplicate: true });
    expect(processor.process({ ...event, id: 'evt_2', signature: 'sig:999' })).toMatchObject({
      accepted: false,
      reason: 'Signature verification failed',
    });
  });
});

describe('Refunds (partial refund accounting)', () => {
  it('supports partial refunds up to the charged amount only', () => {
    const first = computeRefundBreakdown(10000, [], 3000);
    expect(first).toMatchObject({ refundableMinor: 10000, refundedMinor: 3000, remainingMinor: 7000 });
    const second = computeRefundBreakdown(10000, [3000], 7000);
    expect(second.remainingMinor).toBe(0);
    expect(() => computeRefundBreakdown(10000, [3000], 7001)).toThrow('exceeds refundable balance');
  });
});

describe('PSP Adapters (Stripe, PayPal, SpotPay Wallet)', () => {
  it('charges and refunds via StripeAdapter sandbox fallback', async () => {
    const { StripeAdapter } = await import('../../packages/spotpay/src/index');
    const adapter = new StripeAdapter();
    const charge = await adapter.charge({
      amountMinor: 2500,
      currency: 'USD',
      idempotencyKey: 'test_charge_123',
    });
    expect(charge.success).toBe(true);
    expect(charge.providerTransactionId).toContain('ch_stripe_sandbox_test_charge_123');

    const refund = await adapter.refund({
      providerTransactionId: charge.providerTransactionId,
      amountMinor: 2500,
      currency: 'USD',
      idempotencyKey: 'test_refund_123',
    });
    expect(refund.success).toBe(true);
    expect(refund.providerRefundId).toContain('re_stripe_sandbox_test_refund_123');
  });

  it('charges via SpotPayWalletAdapter internal ledger', async () => {
    const { SpotPayWalletAdapter } = await import('../../packages/spotpay/src/index');
    const wallet = new SpotPayWalletAdapter();
    const charge = await wallet.charge({
      amountMinor: 1500,
      currency: 'USD',
      idempotencyKey: 'test_wallet_123',
    });
    expect(charge.success).toBe(true);
    expect(charge.providerName).toBe('spotpay');
  });
});
