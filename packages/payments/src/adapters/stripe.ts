// Stripe Payment Service Provider Adapter

import Stripe from 'stripe';
import type { PSPAdapter, PSPChargeParams, PSPChargeResult, PSPRefundParams, PSPRefundResult } from './types';

export interface StripeAdapterConfig {
  apiKey?: string;
  webhookSecret?: string;
}

export class StripeAdapter implements PSPAdapter {
  readonly providerName = 'stripe' as const;
  private stripeClient: Stripe | null = null;
  private webhookSecret: string;

  constructor(config: StripeAdapterConfig = {}) {
    const apiKey = config.apiKey || (typeof process !== 'undefined' ? process.env?.STRIPE_SECRET_KEY : '') || '';
    if (apiKey) {
      this.stripeClient = new Stripe(apiKey, {
        apiVersion: '2026-07-29.dahlia' as any,
        appInfo: {
          name: 'TUKUBI Financial Center',
        },
      });
    }
    this.webhookSecret = config.webhookSecret || (typeof process !== 'undefined' ? process.env?.STRIPE_WEBHOOK_SECRET : '') || '';
  }

  get isConfigured(): boolean {
    return this.stripeClient !== null;
  }

  async charge(params: PSPChargeParams): Promise<PSPChargeResult> {
    if (!this.stripeClient) {
      return {
        success: false,
        providerTransactionId: '',
        providerName: this.providerName,
        status: 'error',
        errorMessage: 'Stripe credentials are unavailable',
      };
    }

    try {
      const paymentIntent = await this.stripeClient.paymentIntents.create(
        {
          amount: params.amountMinor,
          currency: params.currency.toLowerCase(),
          payment_method_types: ['card'],
          metadata: {
            ...params.metadata,
            idempotencyKey: params.idempotencyKey,
          },
        },
        {
          idempotencyKey: params.idempotencyKey,
        }
      );

      return {
        success: paymentIntent.status === 'succeeded' || paymentIntent.status === 'requires_action',
        providerTransactionId: paymentIntent.id,
        providerName: this.providerName,
        status: paymentIntent.status === 'succeeded' ? 'succeeded' : 'pending',
        rawResponse: paymentIntent,
      };
    } catch (err) {
      return {
        success: false,
        providerTransactionId: '',
        providerName: this.providerName,
        status: 'error',
        errorMessage: err instanceof Error ? err.message : 'Stripe network error',
      };
    }
  }

  async refund(params: PSPRefundParams): Promise<PSPRefundResult> {
    if (!this.stripeClient) {
      return {
        success: false,
        providerRefundId: '',
        providerName: this.providerName,
        status: 'failed',
        errorMessage: 'Stripe credentials are unavailable',
      };
    }

    try {
      const refund = await this.stripeClient.refunds.create(
        {
          payment_intent: params.providerTransactionId,
          amount: params.amountMinor,
        },
        {
          idempotencyKey: params.idempotencyKey,
        }
      );

      return {
        success: refund.status === 'succeeded' || refund.status === 'pending',
        providerRefundId: refund.id,
        providerName: this.providerName,
        status: refund.status === 'succeeded' ? 'succeeded' : 'pending',
      };
    } catch (err) {
      return {
        success: false,
        providerRefundId: '',
        providerName: this.providerName,
        status: 'failed',
        errorMessage: err instanceof Error ? err.message : 'Stripe refund error',
      };
    }
  }

  verifyWebhook(payload: string, signature: string, secret?: string): boolean {
    const key = secret || this.webhookSecret;
    if (!key || !this.stripeClient || !signature?.trim()) return false;

    try {
      this.stripeClient.webhooks.constructEvent(payload, signature, key);
      return true;
    } catch {
      return false;
    }
  }
}
