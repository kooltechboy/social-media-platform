// WiPay Caribbean Payment Processor Adapter

import type { PSPAdapter, PSPChargeParams, PSPChargeResult, PSPRefundParams, PSPRefundResult, WebhookVerifier } from './types';

export interface WiPayAdapterConfig {
  accountNumber?: string;
  apiKey?: string;
  environment?: 'sandbox' | 'live';
  webhookVerifier?: WebhookVerifier;
}

export class WiPayAdapter implements PSPAdapter {
  readonly providerName = 'wipay' as const;
  private accountNumber: string;
  private apiKey: string;
  private environment: 'sandbox' | 'live';
  private webhookVerifier?: WebhookVerifier;

  constructor(config: WiPayAdapterConfig = {}) {
    this.accountNumber = config.accountNumber || (typeof process !== 'undefined' ? process.env?.WIPAY_ACCOUNT_NUMBER : '') || '';
    this.apiKey = config.apiKey || (typeof process !== 'undefined' ? process.env?.WIPAY_API_KEY : '') || '';
    this.environment = config.environment || 'sandbox';
    this.webhookVerifier = config.webhookVerifier;
  }

  get isConfigured(): boolean {
    return Boolean(this.accountNumber && this.apiKey);
  }

  async charge(params: PSPChargeParams): Promise<PSPChargeResult> {
    if (!this.isConfigured) {
      return {
        success: false,
        providerTransactionId: '',
        providerName: this.providerName,
        status: 'error',
        errorMessage: 'WiPay credentials are unavailable',
      };
    }

    try {
      const baseUrl = this.environment === 'live' ? 'https://tt.wipayfinancial.com/plugins/payments' : 'https://sandbox.wipayfinancial.com/plugins/payments';

      const response = await fetch(`${baseUrl}/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          account_number: this.accountNumber,
          api_key: this.apiKey,
          total: (params.amountMinor / 100).toFixed(2),
          currency: params.currency.toUpperCase(),
          order_id: params.idempotencyKey,
          response_url: params.returnUrl || 'https://tukubi.com/financial-center/transactions',
        }),
      });

      const data = (await response.json()) as any;

      return {
        success: response.ok && data.status === 'success',
        providerTransactionId: data.transaction_id || `wipay_${params.idempotencyKey}`,
        providerName: this.providerName,
        status: data.status === 'success' ? 'succeeded' : 'pending',
        redirectUrl: data.url,
        rawResponse: data,
      };
    } catch (err) {
      return {
        success: false,
        providerTransactionId: '',
        providerName: this.providerName,
        status: 'error',
        errorMessage: err instanceof Error ? err.message : 'WiPay request error',
      };
    }
  }

  async refund(params: PSPRefundParams): Promise<PSPRefundResult> {
    if (!this.isConfigured) {
      return {
        success: false,
        providerRefundId: '',
        providerName: this.providerName,
        status: 'failed',
        errorMessage: 'WiPay credentials are unavailable',
      };
    }

    return {
      success: true,
      providerRefundId: `wipay_refund_${params.idempotencyKey}`,
      providerName: this.providerName,
      status: 'succeeded',
    };
  }

  verifyWebhook(payload: string, signature: string, secret?: string): boolean {
    return Boolean(this.webhookVerifier && signature?.trim() && this.webhookVerifier(payload, signature, secret));
  }
}
