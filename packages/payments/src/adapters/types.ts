// Universal Payment Service Provider (PSP) Adapter Interface

export interface PSPChargeParams {
  amountMinor: number;
  currency: string;
  idempotencyKey: string;
  paymentMethodToken?: string;
  metadata?: Record<string, string>;
  customerEmail?: string;
  customerName?: string;
  returnUrl?: string;
  cancelUrl?: string;
}

export interface PSPChargeResult {
  success: boolean;
  providerTransactionId: string;
  providerName: string;
  status: 'succeeded' | 'pending' | 'requires_action' | 'declined' | 'error' | 'timeout';
  redirectUrl?: string;
  rawResponse?: unknown;
  errorMessage?: string;
  failureCode?: string;
}

export interface PSPRefundParams {
  providerTransactionId: string;
  amountMinor: number;
  currency: string;
  idempotencyKey: string;
  reason?: string;
}

export interface PSPRefundResult {
  success: boolean;
  providerRefundId: string;
  providerName: string;
  status: 'succeeded' | 'pending' | 'failed';
  errorMessage?: string;
}

export interface PSPAdapter {
  readonly providerName: string;
  readonly isConfigured: boolean;

  charge(params: PSPChargeParams): Promise<PSPChargeResult>;
  refund(params: PSPRefundParams): Promise<PSPRefundResult>;
  verifyWebhook(payload: string, signature: string, secret?: string): boolean;
}
