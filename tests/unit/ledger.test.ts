import { describe, it, expect } from 'vitest';
import { SpotPayOrchestrator } from '../../packages/spotpay/src/index';

describe('SpotPay Double-Entry Ledger Engine', () => {
  const orchestrator = new SpotPayOrchestrator();

  it('should generate balanced paired debit and credit entries for positive amounts', () => {
    const payload = orchestrator.createDoubleEntryPayload({
      transactionId: 'tx_1001',
      sourceAccountId: 'acc_wallet_user_1',
      destinationAccountId: 'acc_creator_pending_2',
      amount: 50.00,
      currency: 'USD',
      idempotencyKey: 'idemp_unique_key_1001',
      description: 'Creator Tip',
    });

    expect(payload.debitEntry.amount).toBe(-50.00);
    expect(payload.creditEntry.amount).toBe(50.00);
    expect(payload.debitEntry.amount + payload.creditEntry.amount).toBe(0);
    expect(payload.debitEntry.entry_type).toBe('DEBIT');
    expect(payload.creditEntry.entry_type).toBe('CREDIT');
  });

  it('should reject non-positive amounts with an explicit error', () => {
    expect(() => {
      orchestrator.createDoubleEntryPayload({
        transactionId: 'tx_1002',
        sourceAccountId: 'acc_1',
        destinationAccountId: 'acc_2',
        amount: -10.00,
        currency: 'USD',
        idempotencyKey: 'idemp_key_invalid',
        description: 'Invalid Amount',
      });
    }).toThrow("Financial transaction amount must be strictly greater than zero.");
  });

  it('should reject fractional ledger amounts because storage uses integer minor units', () => {
    expect(() => orchestrator.createDoubleEntryPayload({
      transactionId: 'tx_fractional',
      sourceAccountId: 'acc_1',
      destinationAccountId: 'acc_2',
      amount: 10.5,
      currency: 'USD',
      idempotencyKey: 'idemp_fractional',
      description: 'Invalid fractional amount',
    })).toThrow('integer in minor units');
  });

  it('should enforce Native In-App Purchase compliance for iOS & Android digital subscriptions', () => {
    const iosRoute = orchestrator.resolvePaymentRoute({
      countryIso: 'USA',
      platform: 'ios',
      productType: 'digital_subscription',
    });
    expect(iosRoute).toEqual(['apple_iap']);

    const androidRoute = orchestrator.resolvePaymentRoute({
      countryIso: 'USA',
      platform: 'android',
      productType: 'digital_subscription',
    });
    expect(androidRoute).toEqual(['google_play']);

    const webRoute = orchestrator.resolvePaymentRoute({
      countryIso: 'JAM',
      platform: 'web',
      productType: 'physical_goods',
    });
    expect(webRoute).toContain('spotpay_wallet');
    expect(webRoute).toContain('stripe_cards');
  });
});
