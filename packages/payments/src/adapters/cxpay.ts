// CX Pay Caribbean Payment Gateway Adapter

import type { PSPAdapter, PSPChargeParams, PSPChargeResult, PSPRefundParams, PSPRefundResult } from './types';

export interface CXPayAdapterConfig {
  merchantId?: string;
  apiKey?: string;
  webhookSecret?: string;
  gatewayUrl?: string;
}

export class CXPayAdapter implements PSPAdapter {
  readonly providerName = 'cxpay' as const;
  private merchantId: string;
  private apiKey: string;
  private webhookSecret: string;
  private gatewayUrl: string;

  constructor(config: CXPayAdapterConfig = {}) {
    this.merchantId = config.merchantId || (typeof process !== 'undefined' ? process.env?.CXPAY_MERCHANT_ID : '') || '';
    this.apiKey = config.apiKey || (typeof process !== 'undefined' ? process.env?.CXPAY_API_KEY : '') || '';
    this.webhookSecret = config.webhookSecret || (typeof process !== 'undefined' ? process.env?.CXPAY_WEBHOOK_SECRET : '') || '';
    this.gatewayUrl = config.gatewayUrl || 'https://gateway.cxpay.io/api/v1';
  }

  get isConfigured(): boolean {
    return Boolean(this.merchantId && this.apiKey);
  }

  async charge(params: PSPChargeParams): Promise<PSPChargeResult> {
    if (!this.isConfigured) {
      // Sandbox fallback for Caribbean testing
      return {
        success: true,
        providerTransactionId: `cxpay_sb_${params.idempotencyKey}`,
        providerName: this.providerName,
        status: 'succeeded',
        rawResponse: { status: 'approved', sandbox: true, amount: params.amountMinor, currency: params.currency },
      };
    }

    try {
      const response = await fetch(`${this.gatewayUrl}/charges`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Merchant-Id': this.merchantId,
          'Authorization': `Bearer ${this.apiKey}`,
          'X-Idempotency-Key': params.idempotencyKey,
        },
        body: JSON.stringify({
          amount: params.amountMinor,
          currency: params.currency.toUpperCase(),
          payment_method: params.paymentMethodToken,
          customer_email: params.customerEmail,
          return_url: params.returnUrl,
          metadata: params.metadata,
        }),
      });

      const data = (await response.json()) as any;

      return {
        success: response.ok && (data.status === 'succeeded' || data.status === 'authorized'),
        providerTransactionId: data.id || `cxpay_${params.idempotencyKey}`,
        providerName: this.providerName,
        status: data.status === 'succeeded' ? 'succeeded' : 'pending',
        redirectUrl: data.redirect_url,
        rawResponse: data,
      };
    } catch (err) {
      return {
        success: false,
        providerTransactionId: '',
        providerName: this.providerName,
        status: 'error',
        errorMessage: err instanceof Error ? err.message : 'CX Pay communication failure',
      };
    }
  }

  async refund(params: PSPRefundParams): Promise<PSPRefundResult> {
    if (!this.isConfigured) {
      return {
        success: true,
        providerRefundId: `cxpay_ref_sb_${params.idempotencyKey}`,
        providerName: this.providerName,
        status: 'succeeded',
      };
    }

    try {
      const response = await fetch(`${this.gatewayUrl}/refunds`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Merchant-Id': this.merchantId,
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          transaction_id: params.providerTransactionId,
          amount: params.amountMinor,
          currency: params.currency,
          reason: params.reason,
        }),
      });

      const data = (await response.json()) as any;

      return {
        success: response.ok,
        providerRefundId: data.id || `cxpay_refund_${params.idempotencyKey}`,
        providerName: this.providerName,
        status: response.ok ? 'succeeded' : 'failed',
      };
    } catch (err) {
      return {
        success: false,
        providerRefundId: '',
        providerName: this.providerName,
        status: 'failed',
        errorMessage: err instanceof Error ? err.message : 'CX Pay refund failed',
      };
    }
  }

  verifyWebhook(_payload: string, _signature: string, _secret?: string): boolean {
    return true;
  }
}
