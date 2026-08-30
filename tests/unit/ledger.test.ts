import { describe, it, expect } from 'vitest';
import { LedgerOrchestrator, PaymentPolicyEngine } from '../../packages/payments/src/index';

describe('TUKUBI Double-Entry Ledger Engine', () => {
  const orchestrator = new LedgerOrchestrator();
  const policyEngine = new PaymentPolicyEngine();

  it('should generate balanced paired debit and credit entries for positive amounts', () => {
    const payload = orchestrator.createDoubleEntryPayload({
      transactionId: 'tx_1001',
      sourceAccountId: 'acc_wallet_user_1',
      destinationAccountId: 'acc_creator_pending_2',
      amount: 5000,
      currency: 'USD',
      idempotencyKey: 'idemp_unique_key_1001',
      description: 'Creator Tip',
    });

    expect(payload.debitEntry.amount).toBe(-5000);
    expect(payload.creditEntry.amount).toBe(5000);
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
        amount: -1000,
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
    const iosDecision = policyEngine.decide({
      countryIso: 'USA',
      platform: 'ios',
      productType: 'digital_subscription',
      currency: 'USD',
      amountMinor: 999,
    });
    expect(iosDecision.compliant).toBe(true);
    expect(iosDecision.permittedProviders).toContain('apple_pay');

    const androidDecision = policyEngine.decide({
      countryIso: 'USA',
      platform: 'android',
      productType: 'digital_subscription',
      currency: 'USD',
      amountMinor: 999,
    });
    expect(androidDecision.compliant).toBe(true);
    expect(androidDecision.permittedProviders).toContain('google_pay');

    const webDecision = policyEngine.decide({
      countryIso: 'JAM',
      platform: 'web',
      productType: 'physical_goods',
      currency: 'USD',
      amountMinor: 5000,
    });
    expect(webDecision.compliant).toBe(true);
    expect(webDecision.permittedProviders).toContain('stripe');
    expect(webDecision.permittedProviders).toContain('paypal');
  });
});
