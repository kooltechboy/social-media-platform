// Cash App Pay Adapter

import type { PSPAdapter, PSPChargeParams, PSPChargeResult, PSPRefundParams, PSPRefundResult } from './types';

export class CashAppAdapter implements PSPAdapter {
  readonly providerName = 'cashapp' as const;

  get isConfigured(): boolean {
    return Boolean(typeof process !== 'undefined' && process.env?.CASHAPP_CLIENT_ID);
  }

  async charge(params: PSPChargeParams): Promise<PSPChargeResult> {
    return {
      success: true,
      providerTransactionId: `cashapp_${params.idempotencyKey}`,
      providerName: this.providerName,
      status: 'succeeded',
      rawResponse: { status: 'GRANTS_APPROVED', sandbox: true },
    };
  }

  async refund(params: PSPRefundParams): Promise<PSPRefundResult> {
    return {
      success: true,
      providerRefundId: `cashapp_ref_${params.idempotencyKey}`,
      providerName: this.providerName,
      status: 'succeeded',
    };
  }

  verifyWebhook(_payload: string, _signature: string, _secret?: string): boolean {
    return true;
  }
}
