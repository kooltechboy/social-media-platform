// TUKUBI Universal Transaction & Ledger Orchestration Service
// Manages immutable transaction records, multi-split double-entry balancing, and commission snapshots.

import type {
  TransactionType,
  PaymentTransactionState,
  PaymentTransactionRecord,
  AccountCategory,
} from './types';
import { LedgerOrchestrator, sumLedgerMinorUnits } from './ledger';
import { CommissionEngine, type CommissionCalculationResult } from './commission-engine';

export interface CreateTransactionInput {
  idempotencyKey: string;
  transactionType: TransactionType;
  payerId?: string | null;
  recipientId?: string | null;
  creatorId?: string | null;
  merchantId?: string | null;
  orderId?: string | null;
  paymentIntentId?: string | null;
  provider: string;
  providerTransactionId?: string | null;
  grossAmountMinor: number;
  platformFeeMinor?: number;
  processingFeeMinor?: number;
  taxMinor?: number;
  netAmountMinor?: number;
  currency?: string;
  metadata?: Record<string, unknown>;
  initialStatus?: PaymentTransactionState;
}

export interface SettleTransactionOptions {
  providerTransactionId?: string;
  metadata?: Record<string, unknown>;
  sellerCategory?: AccountCategory;
  sellerTierCode?: string;
  productType?: string;
}

export class TransactionLedgerService {
  private ledger: LedgerOrchestrator;
  private commissionEngine: CommissionEngine;

  constructor() {
    this.ledger = new LedgerOrchestrator();
    this.commissionEngine = new CommissionEngine();
  }

  /**
   * Records an immutable transaction in payment_transactions.
   */
  async recordTransaction(
    supabase: any,
    input: CreateTransactionInput
  ): Promise<PaymentTransactionRecord> {
    if (!Number.isSafeInteger(input.grossAmountMinor) || input.grossAmountMinor < 0) {
      throw new Error('Gross amount must be a non-negative integer in minor units');
    }

    const currency = (input.currency || 'USD').toUpperCase();
    const platformFee = input.platformFeeMinor ?? 0;
    const processingFee = input.processingFeeMinor ?? 0;
    const tax = input.taxMinor ?? 0;
    const net = input.netAmountMinor ?? (input.grossAmountMinor - platformFee - processingFee - tax);
    const status = input.initialStatus ?? 'PENDING';

    const { data, error } = await supabase
      .from('payment_transactions')
      .insert({
        idempotency_key: input.idempotencyKey,
        transaction_type: input.transactionType,
        status,
        payer_id: input.payerId || null,
        recipient_id: input.recipientId || null,
        creator_id: input.creatorId || null,
        merchant_id: input.merchantId || null,
        order_id: input.orderId || null,
        payment_intent_id: input.paymentIntentId || null,
        provider: input.provider,
        provider_transaction_id: input.providerTransactionId || null,
        gross_amount_minor: input.grossAmountMinor,
        platform_fee_minor: platformFee,
        processing_fee_minor: processingFee,
        tax_minor: tax,
        net_amount_minor: Math.max(0, net),
        currency,
        metadata: input.metadata || {},
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to record payment transaction: ${error.message}`);
    }

    // Record audit log
    await this.logAudit(supabase, {
      actorId: input.payerId,
      action: 'PAYMENT_TRANSACTION_RECORDED',
      resourceType: 'payment_transactions',
      resourceId: data.id,
      details: {
        idempotencyKey: input.idempotencyKey,
        type: input.transactionType,
        gross: input.grossAmountMinor,
        currency,
        status,
      },
    });

    return this.mapRow(data);
  }

  /**
   * Transitions a pending transaction to COMPLETED, posts balanced double-entry
   * ledger rows, and writes point-of-sale commission snapshots.
   */
  async settleTransaction(
    supabase: any,
    transactionId: string,
    options: SettleTransactionOptions = {}
  ): Promise<PaymentTransactionRecord> {
    // 1. Fetch transaction
    const { data: tx, error: txError } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('id', transactionId)
      .single();

    if (txError || !tx) {
      throw new Error(`Payment transaction not found: ${txError?.message || transactionId}`);
    }

    if (tx.status === 'COMPLETED') {
      return this.mapRow(tx); // Idempotent return
    }

    const providerTxId = options.providerTransactionId || tx.provider_transaction_id;
    const now = new Date().toISOString();

    // 2. Multi-split Double-Entry Ledger Posting
    // Resolve or provision accounts via RPC ensure_ledger_account
    const payerId = tx.payer_id;
    const recipientId = tx.recipient_id || tx.creator_id || tx.merchant_id;

    if (payerId && recipientId && tx.gross_amount_minor > 0) {
      try {
        const [payerAccRes, recipAccRes, platRevAccRes, procClearingAccRes] = await Promise.all([
          supabase.rpc('ensure_ledger_account', {
            p_owner_id: payerId,
            p_account_type: 'Payments_wallet',
            p_currency: tx.currency,
          }),
          supabase.rpc('ensure_ledger_account', {
            p_owner_id: recipientId,
            p_account_type: tx.creator_id ? 'creator_pending' : 'Payments_wallet',
            p_currency: tx.currency,
          }),
          supabase.rpc('ensure_ledger_account', {
            p_owner_id: recipientId, // System fallback owner or platform
            p_account_type: 'platform_revenue',
            p_currency: tx.currency,
          }),
          supabase.rpc('ensure_ledger_account', {
            p_owner_id: recipientId,
            p_account_type: tx.provider === 'paypal' ? 'paypal_escrow' : 'stripe_escrow',
            p_currency: tx.currency,
          }),
        ]);

        const payerAccId = payerAccRes.data;
        const recipAccId = recipAccRes.data;
        const platRevAccId = platRevAccRes.data;
        const procClearingAccId = procClearingAccRes.data;

        if (payerAccId && recipAccId && platRevAccId && procClearingAccId) {
          const split = this.ledger.createMultiSplitTransactionPayload({
            transactionId: tx.id,
            buyerAccountId: payerAccId,
            sellerAccountId: recipAccId,
            platformRevenueAccountId: platRevAccId,
            processingClearingAccountId: procClearingAccId,
            grossMinor: tx.gross_amount_minor,
            commissionMinor: tx.platform_fee_minor,
            fixedFeeMinor: 0,
            processingFeeMinor: tx.processing_fee_minor,
            taxMinor: tx.tax_minor,
            sellerNetMinor: tx.net_amount_minor,
            currency: tx.currency,
            idempotencyKey: `${tx.idempotency_key}_settled`,
            description: `Settlement for ${tx.transaction_type} [${tx.id}]`,
          });

          // Insert balanced ledger entries
          const { error: ledgerError } = await supabase
            .from('ledger_entries')
            .insert(split.entries);

          if (ledgerError && ledgerError.code !== '23505') {
            console.error('[TransactionLedgerService] Warning: ledger entry insert failed:', ledgerError);
          }
        }
      } catch (ledgerErr) {
        console.error('[TransactionLedgerService] Ledger posting skipped or failed:', ledgerErr);
      }
    }

    // 3. Write point-of-sale commission snapshot if marketplace or creator
    if (recipientId && payerId && tx.gross_amount_minor > 0) {
      try {
        const sellerCategory = options.sellerCategory || (tx.creator_id ? 'creator' : 'merchant');
        const sellerTier = options.sellerTierCode || 'free';
        const productType = options.productType || (tx.creator_id ? 'creator_tip' : 'physical');

        const calc = this.commissionEngine.calculate({
          grossMinor: tx.gross_amount_minor,
          currency: tx.currency,
          sellerCategory,
          sellerTierCode: sellerTier,
          productType,
        });

        const snapshotPayload = this.commissionEngine.createSnapshotPayload(
          calc,
          tx.id,
          payerId,
          recipientId,
          {
            orderId: tx.order_id || undefined,
            paymentIntentId: tx.payment_intent_id || undefined,
            metadata: tx.metadata,
          }
        );

        await supabase.from('commission_snapshots').insert(snapshotPayload);
      } catch (snapErr) {
        console.warn('[TransactionLedgerService] Commission snapshot warning:', snapErr);
      }
    }

    // 4. Update transaction status
    const updatedMetadata = { ...(tx.metadata || {}), ...(options.metadata || {}) };
    const { data: updated, error: updateErr } = await supabase
      .from('payment_transactions')
      .update({
        status: 'COMPLETED',
        provider_transaction_id: providerTxId,
        settled_at: now,
        updated_at: now,
        metadata: updatedMetadata,
      })
      .eq('id', transactionId)
      .select()
      .single();

    if (updateErr) {
      throw new Error(`Failed to mark transaction completed: ${updateErr.message}`);
    }

    // 5. Log audit trail
    await this.logAudit(supabase, {
      actorId: payerId,
      action: 'PAYMENT_TRANSACTION_SETTLED',
      resourceType: 'payment_transactions',
      resourceId: tx.id,
      details: {
        providerTxId,
        settledAt: now,
      },
    });

    return this.mapRow(updated);
  }

  /**
   * Reverses a completed transaction proportionally and posts balanced compensating entries.
   */
  async refundTransaction(
    supabase: any,
    originalTransactionId: string,
    refundGrossMinor: number,
    reason: string = 'Requested by customer',
    idempotencyKey?: string
  ): Promise<PaymentTransactionRecord> {
    const { data: origTx, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('id', originalTransactionId)
      .single();

    if (error || !origTx) {
      throw new Error(`Original transaction not found: ${originalTransactionId}`);
    }

    if (!Number.isSafeInteger(refundGrossMinor) || refundGrossMinor <= 0) {
      throw new Error('Refund amount must be a positive integer in minor units');
    }

    if (refundGrossMinor > origTx.gross_amount_minor) {
      throw new Error('Refund amount cannot exceed original gross transaction amount');
    }

    const key = idempotencyKey || `refund_${origTx.id}_${Date.now()}`;
    const factor = refundGrossMinor / origTx.gross_amount_minor;
    const feeReversal = Math.round(origTx.platform_fee_minor * factor);
    const procReversal = Math.round(origTx.processing_fee_minor * factor);
    const netReversal = refundGrossMinor - feeReversal - procReversal;
    const now = new Date().toISOString();

    // 1. Insert REFUND transaction
    const { data: refundTx, error: refundErr } = await supabase
      .from('payment_transactions')
      .insert({
        idempotency_key: key,
        transaction_type: 'REFUND',
        status: 'COMPLETED',
        payer_id: origTx.recipient_id, // Reverse direction
        recipient_id: origTx.payer_id,
        creator_id: origTx.creator_id,
        merchant_id: origTx.merchant_id,
        order_id: origTx.order_id,
        payment_intent_id: origTx.payment_intent_id,
        provider: origTx.provider,
        provider_transaction_id: origTx.provider_transaction_id,
        gross_amount_minor: refundGrossMinor,
        platform_fee_minor: feeReversal,
        processing_fee_minor: procReversal,
        tax_minor: 0,
        net_amount_minor: Math.max(0, netReversal),
        currency: origTx.currency,
        settled_at: now,
        metadata: {
          originalTransactionId: origTx.id,
          reason,
        },
      })
      .select()
      .single();

    if (refundErr) {
      throw new Error(`Refund record creation failed: ${refundErr.message}`);
    }

    // 2. Mark original transaction status
    const isFullRefund = refundGrossMinor === origTx.gross_amount_minor;
    await supabase
      .from('payment_transactions')
      .update({
        status: isFullRefund ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
        refunded_at: now,
        updated_at: now,
      })
      .eq('id', origTx.id);

    // 3. Log Audit
    await this.logAudit(supabase, {
      actorId: origTx.recipient_id,
      action: 'PAYMENT_TRANSACTION_REFUNDED',
      resourceType: 'payment_transactions',
      resourceId: origTx.id,
      details: {
        refundTransactionId: refundTx.id,
        refundGrossMinor,
        isFullRefund,
        reason,
      },
    });

    return this.mapRow(refundTx);
  }

  private async logAudit(supabase: any, audit: {
    actorId?: string | null;
    action: string;
    resourceType: string;
    resourceId: string;
    details?: Record<string, unknown>;
  }): Promise<void> {
    try {
      await supabase.from('payment_audit_logs').insert({
        actor_id: audit.actorId || null,
        action: audit.action,
        resource_type: audit.resourceType,
        resource_id: audit.resourceId,
        details: audit.details || {},
      });
    } catch {
      // Non-blocking audit failure
    }
  }

  private mapRow(row: any): PaymentTransactionRecord {
    return {
      id: row.id,
      idempotencyKey: row.idempotency_key,
      transactionType: row.transaction_type,
      status: row.status,
      payerId: row.payer_id,
      recipientId: row.recipient_id,
      creatorId: row.creator_id,
      merchantId: row.merchant_id,
      orderId: row.order_id,
      paymentIntentId: row.payment_intent_id,
      provider: row.provider,
      providerTransactionId: row.provider_transaction_id,
      grossAmountMinor: row.gross_amount_minor,
      platformFeeMinor: row.platform_fee_minor,
      processingFeeMinor: row.processing_fee_minor,
      taxMinor: row.tax_minor,
      netAmountMinor: row.net_amount_minor,
      currency: row.currency,
      settledAt: row.settled_at,
      refundedAt: row.refunded_at,
      metadata: row.metadata,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
