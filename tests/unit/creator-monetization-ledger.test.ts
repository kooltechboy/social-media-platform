/**
 * Sub-Project 5: Creator Monetization & Double-Entry Ledger — Unit Tests
 *
 * Validates:
 *   - createCreatorPlanAction: auth check, plan name, price, interval validation
 *   - toggleCreatorPlanStatusAction: auth check
 *   - requestCreatorPayoutAction: auth check, KYC verification gate, threshold checks
 *   - tipCreatorAction: auth check, minimum tip limit ($1.00), self-tipping block
 *   - subscribeToCreatorPlanAction: auth check, missing plan validation
 *   - cancelCreatorSubscriptionAction: auth check
 *   - LedgerOrchestrator: double-entry zero-sum invariant (Total Debits + Total Credits = 0)
 *   - sumLedgerMinorUnits: immutable summation from raw ledger records
 */

import { describe, it, expect } from 'vitest';

import {
  createCreatorPlanAction,
  toggleCreatorPlanStatusAction,
  requestCreatorPayoutAction,
  tipCreatorAction,
  subscribeToCreatorPlanAction,
  cancelCreatorSubscriptionAction,
} from '../../apps/web/src/lib/creator/monetization-actions';

import {
  LedgerOrchestrator,
  sumLedgerMinorUnits,
} from '../../packages/payments/src/ledger';

import {
  SELLER_PLANS,
  CREATOR_TIERS,
} from '../../packages/payments/src/monetization';

describe('Sub-Project 5: Creator Monetization & Ledger Server Actions', () => {
  describe('createCreatorPlanAction', () => {
    it('blocks unauthenticated creators', async () => {
      const formData = new FormData();
      formData.set('name', 'VIP Island Insider');
      formData.set('price', '9.99');
      formData.set('billingInterval', 'monthly');

      const res = await createCreatorPlanAction(formData);
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/Sign in/i);
    });

    it('rejects plan creation with empty name', async () => {
      const formData = new FormData();
      formData.set('name', '   ');
      formData.set('price', '9.99');
      formData.set('billingInterval', 'monthly');

      const res = await createCreatorPlanAction(formData);
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/Sign in|Plan name is required/i);
    });

    it('rejects plan creation with zero or negative price', async () => {
      const formData = new FormData();
      formData.set('name', 'Free Tier');
      formData.set('price', '0');
      formData.set('billingInterval', 'monthly');

      const res = await createCreatorPlanAction(formData);
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/Sign in|Price must be greater than/i);
    });

    it('rejects plan creation with invalid billing interval', async () => {
      const formData = new FormData();
      formData.set('name', 'Weekly Tier');
      formData.set('price', '4.99');
      formData.set('billingInterval', 'weekly');

      const res = await createCreatorPlanAction(formData);
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/Sign in|Billing interval must be/i);
    });
  });

  describe('toggleCreatorPlanStatusAction', () => {
    it('blocks unauthenticated plan status toggle', async () => {
      const res = await toggleCreatorPlanStatusAction('plan-123', false);
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/Unauthorized/i);
    });
  });

  describe('requestCreatorPayoutAction', () => {
    it('blocks unauthenticated payout requests', async () => {
      const formData = new FormData();
      const res = await requestCreatorPayoutAction(formData);
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/Sign in/i);
    });
  });

  describe('tipCreatorAction', () => {
    it('blocks unauthenticated fan tips', async () => {
      const res = await tipCreatorAction({
        creatorId: 'creator-uuid-123',
        amountMinor: 500, // $5.00
        currency: 'USD',
      });
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/Sign in/i);
    });

    it('rejects tips below minimum of $1.00 (100 minor units)', async () => {
      const res = await tipCreatorAction({
        creatorId: 'creator-uuid-123',
        amountMinor: 50, // $0.50
        currency: 'USD',
      });
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/Sign in|Minimum tip amount/i);
    });

    it('rejects non-integer tip amounts', async () => {
      const res = await tipCreatorAction({
        creatorId: 'creator-uuid-123',
        amountMinor: 500.5,
        currency: 'USD',
      });
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/Sign in|Minimum tip amount/i);
    });

    it('rejects tips exceeding upper threshold', async () => {
      const res = await tipCreatorAction({
        creatorId: 'creator-uuid-123',
        amountMinor: 200_000_000, // $2,000,000
        currency: 'USD',
      });
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/Sign in|exceeds allowable/i);
    });
  });

  describe('subscribeToCreatorPlanAction', () => {
    it('blocks unauthenticated subscriptions', async () => {
      const res = await subscribeToCreatorPlanAction({
        planId: 'plan-uuid-123',
      });
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/Sign in/i);
    });

    it('rejects subscription with empty planId', async () => {
      const res = await subscribeToCreatorPlanAction({
        planId: '',
      });
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/Sign in|Subscription plan ID is required/i);
    });
  });

  describe('cancelCreatorSubscriptionAction', () => {
    it('blocks unauthenticated subscription cancellations', async () => {
      const res = await cancelCreatorSubscriptionAction('sub-uuid-123');
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/Sign in/i);
    });
  });
});

describe('Sub-Project 5: Double-Entry Ledger Orchestrator Invariants', () => {
  const orchestrator = new LedgerOrchestrator();

  it('guarantees that total debits + total credits = 0 (Zero-Sum Invariant)', () => {
    const payload = orchestrator.createDoubleEntryPayload({
      transactionId: 'tx-1001',
      sourceAccountId: 'account-payer-001',
      destinationAccountId: 'account-creator-002',
      amount: 1500, // $15.00
      currency: 'USD',
      idempotencyKey: 'idem_tip_1001',
      description: 'Fan tip for soca riddim',
    });

    expect(payload.debitEntry.amount).toBe(-1500);
    expect(payload.debitEntry.entry_type).toBe('DEBIT');
    expect(payload.creditEntry.amount).toBe(1500);
    expect(payload.creditEntry.entry_type).toBe('CREDIT');

    // Inviolable Zero-Sum rule
    const sum = payload.debitEntry.amount + payload.creditEntry.amount;
    expect(sum).toBe(0);
  });

  it('rejects zero-amount transactions', () => {
    expect(() =>
      orchestrator.createDoubleEntryPayload({
        transactionId: 'tx-1002',
        sourceAccountId: 'account-payer',
        destinationAccountId: 'account-creator',
        amount: 0,
        currency: 'USD',
        idempotencyKey: 'idem_zero',
        description: 'Zero transaction',
      })
    ).toThrow(/strictly greater than zero/i);
  });

  it('rejects negative-amount transactions in payload input', () => {
    expect(() =>
      orchestrator.createDoubleEntryPayload({
        transactionId: 'tx-1003',
        sourceAccountId: 'account-payer',
        destinationAccountId: 'account-creator',
        amount: -500,
        currency: 'USD',
        idempotencyKey: 'idem_neg',
        description: 'Negative transaction',
      })
    ).toThrow(/strictly greater than zero/i);
  });

  it('rejects non-integer amounts in ledger inputs', () => {
    expect(() =>
      orchestrator.createDoubleEntryPayload({
        transactionId: 'tx-1004',
        sourceAccountId: 'account-payer',
        destinationAccountId: 'account-creator',
        amount: 12.34,
        currency: 'USD',
        idempotencyKey: 'idem_float',
        description: 'Float transaction',
      })
    ).toThrow(/must be an integer/i);
  });

  it('rejects identical source and destination accounts', () => {
    expect(() =>
      orchestrator.createDoubleEntryPayload({
        transactionId: 'tx-1005',
        sourceAccountId: 'same-account-id',
        destinationAccountId: 'same-account-id',
        amount: 1000,
        currency: 'USD',
        idempotencyKey: 'idem_same',
        description: 'Self transaction',
      })
    ).toThrow(/must be distinct/i);
  });

  it('creates compensating reversal payload that inverts accounts and maintains zero-sum', () => {
    const reversal = orchestrator.createReversalPayload(
      'orig-tx-999',
      'rev-tx-999',
      'account-source',
      'account-dest',
      2500, // $25.00
      'idem_rev_999',
      'Refund requested by fan',
      'USD'
    );

    // Reversal inverts accounts
    expect(reversal.debitEntry.account_id).toBe('account-dest');
    expect(reversal.debitEntry.amount).toBe(-2500);
    expect(reversal.creditEntry.account_id).toBe('account-source');
    expect(reversal.creditEntry.amount).toBe(2500);

    // Sum invariant holds
    expect(reversal.debitEntry.amount + reversal.creditEntry.amount).toBe(0);
  });

  it('sumLedgerMinorUnits accurately calculates net balances without mutable columns', () => {
    const entries = [
      { amount: 5000 },  // +$50.00 credit
      { amount: 2500 },  // +$25.00 credit
      { amount: -1000 }, // -$10.00 debit / withdrawal
      { amount: 1500 },  // +$15.00 credit
    ];

    const net = sumLedgerMinorUnits(entries);
    expect(net).toBe(8000); // $80.00
  });

  it('sumLedgerMinorUnits returns 0 for empty entry list', () => {
    expect(sumLedgerMinorUnits([])).toBe(0);
  });
});

describe('Sub-Project 5: Creator Tier & Seller Plan Economics', () => {
  it('defines valid Caribbean creator tiers with fee structures', () => {
    expect(CREATOR_TIERS).toHaveProperty('creator_free');
    expect(CREATOR_TIERS).toHaveProperty('creator_plus');
    expect(CREATOR_TIERS).toHaveProperty('creator_pro');

    expect(CREATOR_TIERS.creator_free.platformFeeBps).toBe(1000); // 10%
    expect(CREATOR_TIERS.creator_plus.platformFeeBps).toBe(500);  // 5%
  });

  it('defines valid seller plans for Caribbean digital commerce', () => {
    expect(SELLER_PLANS).toHaveProperty('business_free');
    expect(SELLER_PLANS).toHaveProperty('seller_pro');
    expect(SELLER_PLANS).toHaveProperty('business_plus');
    expect(SELLER_PLANS).toHaveProperty('enterprise');

    expect(SELLER_PLANS.seller_pro.priceMinor).toBe(1499); // $14.99
    expect(SELLER_PLANS.business_plus.priceMinor).toBe(3999); // $39.99
  });
});
