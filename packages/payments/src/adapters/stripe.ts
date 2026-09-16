// Stripe Payment Service Provider Adapter — with Stripe Connect Marketplace & Creator Payout Rails

import Stripe from 'stripe';
import type { PSPAdapter, PSPChargeParams, PSPChargeResult, PSPRefundParams, PSPRefundResult } from './types';

export interface StripeAdapterConfig {
  apiKey?: string;
  webhookSecret?: string;
}

export interface StripeConnectAccountParams {
  email: string;
  country: string; // ISO 2-letter country code e.g. 'JM', 'TT', 'US'
  businessType?: 'individual' | 'company';
  metadata?: Record<string, string>;
}

export interface StripeConnectAccountResult {
  success: boolean;
  accountId?: string;
  errorMessage?: string;
}

export interface StripeAccountLinkParams {
  accountId: string;
  refreshUrl: string;
  returnUrl: string;
  type?: 'account_onboarding' | 'account_update';
}

export interface StripeAccountLinkResult {
  success: boolean;
  url?: string;
  errorMessage?: string;
}

export interface StripeDestinationChargeParams {
  amountMinor: number;
  currency: string;
  destinationAccountId: string;
  applicationFeeMinor: number;
  idempotencyKey: string;
  metadata?: Record<string, string>;
}

export interface StripeTransferParams {
  destinationAccountId: string;
  amountMinor: number;
  currency: string;
  idempotencyKey: string;
  description?: string;
  metadata?: Record<string, string>;
}

export interface StripeTransferResult {
  success: boolean;
  transferId?: string;
  errorMessage?: string;
}

export interface StripeAccountStatusResult {
  success: boolean;
  chargesEnabled?: boolean;
  payoutsEnabled?: boolean;
  detailsSubmitted?: boolean;
  errorMessage?: string;
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

  // ─── Stripe Connect Merchant & Creator Rails ─────────────────────────────

  async createConnectAccount(params: StripeConnectAccountParams): Promise<StripeConnectAccountResult> {
    if (!this.stripeClient) {
      return { success: false, errorMessage: 'Stripe credentials are unavailable' };
    }

    try {
      const account = await this.stripeClient.accounts.create({
        type: 'express',
        country: params.country,
        email: params.email,
        business_type: params.businessType || 'individual',
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        metadata: params.metadata,
      });

      return { success: true, accountId: account.id };
    } catch (err) {
      return {
        success: false,
        errorMessage: err instanceof Error ? err.message : 'Failed to create Stripe Connect account',
      };
    }
  }

  async createAccountLink(params: StripeAccountLinkParams): Promise<StripeAccountLinkResult> {
    if (!this.stripeClient) {
      return { success: false, errorMessage: 'Stripe credentials are unavailable' };
    }

    try {
      const link = await this.stripeClient.accountLinks.create({
        account: params.accountId,
        refresh_url: params.refreshUrl,
        return_url: params.returnUrl,
        type: params.type || 'account_onboarding',
      });

      return { success: true, url: link.url };
    } catch (err) {
      return {
        success: false,
        errorMessage: err instanceof Error ? err.message : 'Failed to generate account link',
      };
    }
  }

  async createDestinationCharge(params: StripeDestinationChargeParams): Promise<PSPChargeResult> {
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
          application_fee_amount: params.applicationFeeMinor,
          transfer_data: {
            destination: params.destinationAccountId,
          },
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
        errorMessage: err instanceof Error ? err.message : 'Stripe destination charge error',
      };
    }
  }

  async createTransfer(params: StripeTransferParams): Promise<StripeTransferResult> {
    if (!this.stripeClient) {
      return { success: false, errorMessage: 'Stripe credentials are unavailable' };
    }

    try {
      const transfer = await this.stripeClient.transfers.create(
        {
          amount: params.amountMinor,
          currency: params.currency.toLowerCase(),
          destination: params.destinationAccountId,
          description: params.description,
          metadata: params.metadata,
        },
        {
          idempotencyKey: params.idempotencyKey,
        }
      );

      return { success: true, transferId: transfer.id };
    } catch (err) {
      return {
        success: false,
        errorMessage: err instanceof Error ? err.message : 'Stripe transfer error',
      };
    }
  }

  async getAccountStatus(accountId: string): Promise<StripeAccountStatusResult> {
    if (!this.stripeClient) {
      return { success: false, errorMessage: 'Stripe credentials are unavailable' };
    }

    try {
      const account = await this.stripeClient.accounts.retrieve(accountId);
      return {
        success: true,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        detailsSubmitted: account.details_submitted,
      };
    } catch (err) {
      return {
        success: false,
        errorMessage: err instanceof Error ? err.message : 'Failed to retrieve account status',
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
