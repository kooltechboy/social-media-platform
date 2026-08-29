// Cash App Pay Adapter

import type { PSPAdapter, PSPChargeParams, PSPChargeResult, PSPRefundParams, PSPRefundResult, WebhookVerifier } from './types';

export interface CashAppAdapterConfig {
  clientId?: string;
  webhookVerifier?: WebhookVerifier;
}

export class CashAppAdapter implements PSPAdapter {
  readonly providerName = 'cashapp' as const;
  private readonly clientId: string;
  private readonly webhookVerifier?: WebhookVerifier;

  constructor(config: CashAppAdapterConfig = {}) {
    this.clientId = config.clientId || (typeof process !== 'undefined' ? process.env?.CASHAPP_CLIENT_ID : '') || '';
    this.webhookVerifier = config.webhookVerifier;
  }

  get isConfigured(): boolean {
    return Boolean(this.clientId);
  }

  async charge(params: PSPChargeParams): Promise<PSPChargeResult> {
    if (!this.isConfigured) {
      return { success: false, providerTransactionId: '', providerName: this.providerName, status: 'error', errorMessage: 'Cash App credentials are unavailable' };
    }
    return {
      success: true,
      providerTransactionId: `cashapp_${params.idempotencyKey}`,
      providerName: this.providerName,
      status: 'succeeded',
      rawResponse: { status: 'GRANTS_APPROVED', sandbox: true },
    };
  }

  async refund(params: PSPRefundParams): Promise<PSPRefundResult> {
    if (!this.isConfigured) {
      return { success: false, providerRefundId: '', providerName: this.providerName, status: 'failed', errorMessage: 'Cash App credentials are unavailable' };
    }
    return {
      success: true,
      providerRefundId: `cashapp_ref_${params.idempotencyKey}`,
      providerName: this.providerName,
      status: 'succeeded',
    };
  }

  verifyWebhook(payload: string, signature: string, secret?: string): boolean {
    return Boolean(this.webhookVerifier && signature?.trim() && this.webhookVerifier(payload, signature, secret));
  }
}
