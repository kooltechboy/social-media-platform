// TUKUBI Universal Double-Entry Financial Ledger Orchestrator

import type { LedgerEntryInput } from "./types";

export function sumLedgerMinorUnits(
  entries: ReadonlyArray<{ amount: number | string | bigint }>,
): number {
  return entries.reduce((sum, entry) => sum + Number(entry.amount), 0);
}

export interface GeneratedLedgerPair {
  debitEntry: {
    transaction_id: string;
    account_id: string;
    amount: number; // Negative for Debit
    entry_type: "DEBIT";
    idempotency_key: string;
    description: string;
  };
  creditEntry: {
    transaction_id: string;
    account_id: string;
    amount: number; // Positive for Credit
    entry_type: "CREDIT";
    idempotency_key: string;
    description: string;
  };
}

export class LedgerOrchestrator {
  /**
   * Generates a pair of double-entry debit and credit ledger inputs
   * verifying that Total Debit + Total Credit = 0 and amount is strictly positive.
   */
  public createDoubleEntryPayload(
    input: LedgerEntryInput,
  ): GeneratedLedgerPair {
    if (!Number.isSafeInteger(input.amount)) {
      throw new Error('Ledger amount must be an integer in minor units.');
    }

    if (input.amount <= 0) {
      throw new Error(
        "Financial transaction amount must be strictly greater than zero.",
      );
    }

    if (!input.sourceAccountId || !input.destinationAccountId) {
      throw new Error(
        "Source and destination accounts are required for double-entry ledger.",
      );
    }

    if (input.sourceAccountId === input.destinationAccountId) {
      throw new Error("Source and destination accounts must be distinct.");
    }

    return {
      debitEntry: {
        transaction_id: input.transactionId,
        account_id: input.sourceAccountId,
        amount: -Math.abs(input.amount), // Always negative for Debit
        entry_type: "DEBIT",
        idempotency_key: `${input.idempotencyKey}_debit`,
        description: input.description,
      },
      creditEntry: {
        transaction_id: input.transactionId,
        account_id: input.destinationAccountId,
        amount: Math.abs(input.amount), // Always positive for Credit
        entry_type: "CREDIT",
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
    reason: string,
  ): GeneratedLedgerPair {
    return this.createDoubleEntryPayload({
      transactionId: reversalTransactionId,
      sourceAccountId: destinationAccountId, // Invert source & dest
      destinationAccountId: sourceAccountId,
      amount,
      currency: "USD",
      idempotencyKey: `rev_${idempotencyKey}`,
      description: `Reversal of tx ${originalTransactionId}: ${reason}`,
    });
  }

  /**
   * Generates a multi-split balanced ledger set for commercial transactions:
   * Buyer Debit (-Gross) + Seller Credit (+Net) + Platform Revenue Credit (+Commission + FixedFee)
   * + Processing Clearing Credit (+ProcessingCost) + Tax Clearing Credit (+Tax) = 0
   */
  public createMultiSplitTransactionPayload(input: {
    transactionId: string;
    buyerAccountId: string;
    sellerAccountId: string;
    platformRevenueAccountId: string;
    processingClearingAccountId: string;
    taxClearingAccountId?: string;
    grossMinor: number;
    commissionMinor: number;
    fixedFeeMinor: number;
    processingFeeMinor: number;
    taxMinor?: number;
    sellerNetMinor: number;
    currency: string;
    idempotencyKey: string;
    description: string;
  }): {
    entries: Array<{
      transaction_id: string;
      account_id: string;
      amount: number;
      entry_type: "DEBIT" | "CREDIT";
      category: string;
      idempotency_key: string;
      description: string;
    }>;
    totalDebitMinor: number;
    totalCreditMinor: number;
    netZeroVerified: boolean;
  } {
    const taxMinor = input.taxMinor ?? 0;
    const platformRevenueMinor = input.commissionMinor + input.fixedFeeMinor;

    // Verify equation: grossMinor = sellerNetMinor + platformRevenueMinor + processingFeeMinor + taxMinor
    const totalCredits = input.sellerNetMinor + platformRevenueMinor + input.processingFeeMinor + taxMinor;
    if (totalCredits !== input.grossMinor) {
      throw new Error(
        `Ledger integrity violation: Total credits (${totalCredits}) must equal gross debit (${input.grossMinor})`
      );
    }

    const entries = [
      // 1. Buyer Debit
      {
        transaction_id: input.transactionId,
        account_id: input.buyerAccountId,
        amount: -input.grossMinor,
        entry_type: "DEBIT" as const,
        category: "GROSS_TRANSACTION",
        idempotency_key: `${input.idempotencyKey}_buyer_debit`,
        description: input.description,
      },
      // 2. Seller Credit
      {
        transaction_id: input.transactionId,
        account_id: input.sellerAccountId,
        amount: input.sellerNetMinor,
        entry_type: "CREDIT" as const,
        category: "SELLER_NET",
        idempotency_key: `${input.idempotencyKey}_seller_net_credit`,
        description: `Seller net proceeds for ${input.description}`,
      },
      // 3. Platform Revenue (Commission + Platform Fee)
      {
        transaction_id: input.transactionId,
        account_id: input.platformRevenueAccountId,
        amount: platformRevenueMinor,
        entry_type: "CREDIT" as const,
        category: "PLATFORM_REVENUE",
        idempotency_key: `${input.idempotencyKey}_platform_rev_credit`,
        description: `TUKUBI platform revenue for ${input.description}`,
      },
      // 4. Processing Cost Clearing
      {
        transaction_id: input.transactionId,
        account_id: input.processingClearingAccountId,
        amount: input.processingFeeMinor,
        entry_type: "CREDIT" as const,
        category: "PROCESSING_FEE",
        idempotency_key: `${input.idempotencyKey}_proc_clearing_credit`,
        description: `Provider payment processing clearing for ${input.description}`,
      },
    ];

    // Optional 5. Tax Clearing
    if (taxMinor > 0 && input.taxClearingAccountId) {
      entries.push({
        transaction_id: input.transactionId,
        account_id: input.taxClearingAccountId,
        amount: taxMinor,
        entry_type: "CREDIT" as const,
        category: "TAX",
        idempotency_key: `${input.idempotencyKey}_tax_credit`,
        description: `Jurisdictional tax clearing for ${input.description}`,
      });
    }

    const sum = sumLedgerMinorUnits(entries);
    if (sum !== 0) {
      throw new Error(`Ledger entry sum mismatch: expected 0, got ${sum}`);
    }

    return {
      entries,
      totalDebitMinor: input.grossMinor,
      totalCreditMinor: totalCredits,
      netZeroVerified: true,
    };
  }
}

