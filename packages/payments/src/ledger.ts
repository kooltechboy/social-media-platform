// TUKUBI Universal Double-Entry Financial Ledger Orchestrator

import type { LedgerEntryInput } from './types';

export interface GeneratedLedgerPair {
  debitEntry: {
    transaction_id: string;
    account_id: string;
    amount: number; // Negative for Debit
    entry_type: 'DEBIT';
    idempotency_key: string;
    description: string;
  };
  creditEntry: {
    transaction_id: string;
    account_id: string;
    amount: number; // Positive for Credit
    entry_type: 'CREDIT';
    idempotency_key: string;
    description: string;
  };
}

export class LedgerOrchestrator {
  /**
   * Generates a pair of double-entry debit and credit ledger inputs
   * verifying that Total Debit + Total Credit = 0 and amount is strictly positive.
   */
  public createDoubleEntryPayload(input: LedgerEntryInput): GeneratedLedgerPair {
    if (input.amount <= 0) {
      throw new Error('Financial transaction amount must be strictly greater than zero.');
    }

    if (!input.sourceAccountId || !input.destinationAccountId) {
      throw new Error('Source and destination accounts are required for double-entry ledger.');
    }

    if (input.sourceAccountId === input.destinationAccountId) {
      throw new Error('Source and destination accounts must be distinct.');
    }

    return {
      debitEntry: {
        transaction_id: input.transactionId,
        account_id: input.sourceAccountId,
        amount: -Math.abs(input.amount), // Always negative for Debit
        entry_type: 'DEBIT',
        idempotency_key: `${input.idempotencyKey}_debit`,
        description: input.description,
      },
      creditEntry: {
        transaction_id: input.transactionId,
        account_id: input.destinationAccountId,
        amount: Math.abs(input.amount), // Always positive for Credit
        entry_type: 'CREDIT',
        idempotency_key: `${input.idempotencyKey}_credit`,
        description: input.description,
      },
    };
  }

  /**
   * Generates a compensating reversing entry pair to reverse a previous transaction.
   * Never mutates existing rows.
   */
  public createReversalPayload(
    originalTransactionId: string,
    reversalTransactionId: string,
    sourceAccountId: string,
    destinationAccountId: string,
    amount: number,
    idempotencyKey: string,
    reason: string
  ): GeneratedLedgerPair {
    return this.createDoubleEntryPayload({
      transactionId: reversalTransactionId,
      sourceAccountId: destinationAccountId, // Invert source & dest
      destinationAccountId: sourceAccountId,
      amount,
      currency: 'USD',
      idempotencyKey: `rev_${idempotencyKey}`,
      description: `Reversal of tx ${originalTransactionId}: ${reason}`,
    });
  }
}
