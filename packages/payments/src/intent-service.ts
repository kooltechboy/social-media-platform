// Payment Intent Service: Lifecycle state management with idempotency

import type { CreateIntentInput, IntentStatus, PaymentIntentRecord } from './types';

export class PaymentIntentService {
  public create(input: CreateIntentInput): PaymentIntentRecord {
    if (!/^[A-Z]{3}$/.test(input.currency)) {
      throw new Error('Currency must be an ISO 4217 code');
    }
    if (!Number.isInteger(input.amountMinor) || input.amountMinor <= 0) {
      throw new Error('Amount must be positive integer minor units');
    }
    if (input.seenIdempotencyKeys.has(input.idempotencyKey)) {
      throw new Error('Duplicate idempotency key: replay blocked');
    }
    input.seenIdempotencyKeys.add(input.idempotencyKey);

    return {
      id: `pi_${input.idempotencyKey}`,
      payerId: input.payerId,
      productType: input.productType,
      amountMinor: input.amountMinor,
      currency: input.currency,
      idempotencyKey: input.idempotencyKey,
      selectedProvider: input.selectedProvider,
      selectedMethodKind: input.selectedMethodKind,
      merchantId: input.merchantId,
      creatorId: input.creatorId,
      eventId: input.eventId,
      status: 'requires_payment',
    };
  }

  public transition(intent: PaymentIntentRecord, to: IntentStatus): PaymentIntentRecord {
    const allowed: Record<IntentStatus, IntentStatus[]> = {
      requires_payment: ['requires_action', 'processing', 'authorized', 'cancelled', 'failed'],
      requires_action: ['processing', 'authorized', 'cancelled', 'failed'],
      processing: ['authorized', 'captured', 'succeeded', 'failed', 'settled'],
      authorized: ['captured', 'cancelled', 'failed'],
      captured: ['settled', 'succeeded', 'refund_pending', 'refunded', 'partially_refunded', 'disputed'],
      succeeded: ['settled', 'refund_pending', 'refunded', 'partially_refunded', 'disputed'],
      settled: ['refund_pending', 'refunded', 'partially_refunded', 'disputed'],
      failed: ['requires_payment'],
      cancelled: [],
      refund_pending: ['refunded', 'partially_refunded', 'failed', 'settled'],
      refunded: ['reversed'],
      partially_refunded: ['refund_pending', 'refunded', 'disputed'],
      disputed: ['reversed', 'settled'],
      reversed: [],
    };

    if (!allowed[intent.status]?.includes(to)) {
      throw new Error(`Invalid intent transition: ${intent.status} → ${to}`);
    }

    return { ...intent, status: to };
  }
}
