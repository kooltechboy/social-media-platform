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

export interface PSPSubscriptionParams {
  planId: string;
  subscriberId: string;
  subscriberEmail?: string;
  returnUrl?: string;
  cancelUrl?: string;
  customId?: string;
}

export interface PSPSubscriptionResult {
  success: boolean;
  providerSubscriptionId: string;
  providerName: string;
  status: 'active' | 'pending' | 'suspended' | 'cancelled' | 'error';
  approvalUrl?: string;
  errorMessage?: string;
  rawResponse?: unknown;
}

export interface PSPPayoutParams {
  recipientId: string;
  recipientEmail?: string;
  amountMinor: number;
  currency: string;
  idempotencyKey: string;
  note?: string;
}

export interface PSPPayoutResult {
  success: boolean;
  providerPayoutId: string;
  providerName: string;
  status: 'succeeded' | 'pending' | 'failed';
  errorMessage?: string;
  rawResponse?: unknown;
}

export interface PSPAdapter {
  readonly providerName: string;
  readonly isConfigured: boolean;

  charge(params: PSPChargeParams): Promise<PSPChargeResult>;
  refund(params: PSPRefundParams): Promise<PSPRefundResult>;
  createSubscription?(params: PSPSubscriptionParams): Promise<PSPSubscriptionResult>;
  cancelSubscription?(subscriptionId: string, reason?: string): Promise<{ success: boolean; errorMessage?: string }>;
  getSubscription?(subscriptionId: string): Promise<{ status: string; currentPeriodEnd?: string; raw?: unknown }>;
  createPayout?(params: PSPPayoutParams): Promise<PSPPayoutResult>;
  verifyWebhook(payload: string, signature: any, secret?: string): boolean | Promise<boolean>;
}

export type WebhookVerifier = (payload: string, signature: any, secret?: string) => boolean | Promise<boolean>;

