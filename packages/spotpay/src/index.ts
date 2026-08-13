// SpotPay Financial Orchestration & Double-Entry Ledger Engine

export interface LedgerEntryInput {
  transactionId: string;
  sourceAccountId: string;
  destinationAccountId: string;
  amount: number;
  currency: string;
  idempotencyKey: string;
  description: string;
}

export interface PaymentCapabilityRequest {
  countryIso: string;
  platform: 'web' | 'ios' | 'android';
  productType: 'digital_subscription' | 'creator_tip' | 'live_gift' | 'physical_goods' | 'event_ticket';
}

export class SpotPayOrchestrator {
  /**
   * Generates a pair of double-entry debit and credit ledger inputs
   * verifying that Total Debit = Total Credit and amount is strictly positive.
   */
  public createDoubleEntryPayload(input: LedgerEntryInput) {
    if (input.amount <= 0) {
      throw new Error("Financial transaction amount must be strictly greater than zero.");
    }

    return {
      debitEntry: {
        transaction_id: input.transactionId,
        account_id: input.sourceAccountId,
        amount: -input.amount, // Negative for Debit
        entry_type: 'DEBIT',
        idempotency_key: `${input.idempotencyKey}_debit`,
        description: input.description,
      },
      creditEntry: {
        transaction_id: input.transactionId,
        account_id: input.destinationAccountId,
        amount: input.amount, // Positive for Credit
        entry_type: 'CREDIT',
        idempotency_key: `${input.idempotencyKey}_credit`,
        description: input.description,
      }
    };
  }

  /**
   * Determines allowable checkout routing methods based on Store Policy & Region
   */
  public resolvePaymentRoute(req: PaymentCapabilityRequest): string[] {
    // 1. Digital Content on Mobile must route to Native Store Billing
    if ((req.platform === 'ios' || req.platform === 'android') && 
        (req.productType === 'digital_subscription' || req.productType === 'live_gift')) {
      return req.platform === 'ios' ? ['apple_iap'] : ['google_play'];
    }

    // 2. Physical Goods, P2P Transfers & Event Tickets can route through SpotPay Wallet, Stripe, PayPal
    return ['spotpay_wallet', 'stripe_cards', 'paypal', 'apple_pay_web', 'google_pay_web'];
  }
}
