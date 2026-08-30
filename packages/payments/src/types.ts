// Universal Types for TUKUBI Payments & Financial Architecture

export type MinorUnits = number;

export type Platform = 'web' | 'ios' | 'android' | 'all';

export type ProductType =
  | 'digital_subscription'
  | 'creator_tip'
  | 'live_gift'
  | 'physical_goods'
  | 'event_ticket'
  | 'service_booking'
  | 'business_ad'
  | 'store_product';

export type PaymentMethodKind =
  | 'card'
  | 'apple_pay'
  | 'google_pay'
  | 'paypal'
  | 'cxpay'
  | 'wipay'
  | 'cash_app'
  | 'bank_transfer'
  | 'wallet';

export type ProviderId =
  | 'stripe'
  | 'paypal'
  | 'cxpay'
  | 'wipay'
  | 'cashapp'
  | 'apple_pay'
  | 'google_pay'
  | 'bank_transfer';

export type IntentStatus =
  | 'requires_payment'
  | 'requires_action'
  | 'processing'
  | 'authorized'
  | 'captured'
  | 'succeeded'
  | 'settled'
  | 'failed'
  | 'cancelled'
  | 'refund_pending'
  | 'refunded'
  | 'partially_refunded'
  | 'disputed'
  | 'reversed';

export type ConnectionState =
  | 'NOT_CONNECTED'
  | 'CONNECTING'
  | 'AUTHORIZATION_REQUIRED'
  | 'AUTHORIZED'
  | 'VERIFYING'
  | 'CONNECTED'
  | 'REAUTH_REQUIRED'
  | 'SUSPENDED'
  | 'ERROR'
  | 'DISCONNECTED';

export type ProviderCapability =
  | 'payment'
  | 'checkout'
  | 'authorization'
  | 'capture'
  | 'refund'
  | 'partial_refund'
  | 'recurring_billing'
  | 'subscription'
  | 'payout'
  | 'withdrawal'
  | 'account_connection'
  | 'account_verification'
  | 'balance_inquiry'
  | 'receiving'
  | 'transfer'
  | 'bank_settlement'
  | 'tokenization'
  | '3ds'
  | 'google_pay'
  | 'apple_pay'
  | 'cash_app_pay'
  | 'webhook_support'
  | 'dispute_management';

export interface LedgerEntryInput {
  transactionId: string;
  sourceAccountId: string;
  destinationAccountId: string;
  amount: number;
  currency: string;
  idempotencyKey: string;
  description: string;
}

export interface CapabilityRule {
  countryIso: string;
  platform: Platform;
  productType: ProductType;
  provider: ProviderId | string;
  methodKind: PaymentMethodKind;
  minAmountMinor: number;
  maxAmountMinor: number;
  isEnabled: boolean;
}

export interface PolicyRequest {
  countryIso: string;
  platform: Platform;
  productType: ProductType;
  amountMinor: number;
}

export interface PolicyDecision {
  permittedProviders: string[];
  selectedMethodKinds: string[];
  compliant: boolean;
  reason?: string;
}

export interface PaymentIntentRecord {
  id: string;
  payerId: string;
  productType: ProductType;
  amountMinor: number;
  currency: string;
  idempotencyKey: string;
  selectedProvider?: string;
  selectedMethodKind?: string;
  status: IntentStatus;
  providerTransactionId?: string;
  merchantId?: string;
  creatorId?: string;
  eventId?: string;
}

export interface CreateIntentInput {
  payerId: string;
  productType: ProductType;
  amountMinor: number;
  currency: string;
  idempotencyKey: string;
  seenIdempotencyKeys: Set<string>;
  selectedProvider?: string;
  selectedMethodKind?: string;
  merchantId?: string;
  creatorId?: string;
  eventId?: string;
}

export interface WebhookEvent {
  id: string;
  providerId: string;
  type: string;
  payload: string;
  signature: string;
}

export interface WebhookOutcome {
  accepted: boolean;
  reason?: string;
  duplicate: boolean;
}

export interface RefundBreakdown {
  refundableMinor: number;
  refundedMinor: number;
  remainingMinor: number;
}

export type AccountCategory = 'user' | 'creator' | 'merchant' | 'business';

export interface CommissionRule {
  id: string;
  version: number;
  ruleName: string;
  accountCategory: AccountCategory | '*';
  tierCode: string; // 'free' | 'plus' | 'pro' | '*'
  productType: string; // 'physical' | 'digital' | 'service' | 'event_ticket' | 'creator_tip' | 'live_gift' | '*'
  countryIso?: string;
  currency?: string;
  percentageBps: number;
  fixedFeeMinor: number;
  minCommissionMinor?: number;
  maxCommissionMinor?: number;
  promotionalRateBps?: number;
  promotionalFixedMinor?: number;
  promoStartsAt?: string;
  promoEndsAt?: string;
  isExempt?: boolean;
  effectiveFrom: string;
  effectiveTo?: string;
}

export interface CommissionSnapshot {
  id: string;
  transactionId: string;
  orderId?: string;
  paymentIntentId?: string;
  payerId: string;
  sellerId: string;
  accountCategory: AccountCategory;
  sellerTier: string;
  productType: string;
  grossAmountMinor: number;
  currency: string;
  commissionRuleId?: string;
  commissionRuleVersion: number;
  commissionRateBps: number;
  commissionAmountMinor: number;
  fixedPlatformFeeMinor: number;
  paymentProcessingFeeMinor: number;
  taxAmountMinor: number;
  sellerNetMinor: number;
  tukubiRevenueMinor: number;
  refundedAmountMinor: number;
  commissionRefundedMinor: number;
  isSettled: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface CommercialSubscription {
  id: string;
  subscriberId: string;
  targetType: AccountCategory;
  targetId: string;
  tierId: string;
  billingInterval: 'monthly' | 'annual';
  priceMinor: number;
  currency: string;
  status: 'active' | 'past_due' | 'canceled' | 'trialing' | 'grace_period' | 'expired';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  paymentProvider: ProviderId;
  providerSubscriptionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FinancialDispute {
  id: string;
  orderId?: string;
  paymentIntentId?: string;
  buyerId: string;
  sellerId: string;
  providerId: ProviderId;
  providerDisputeId: string;
  originalAmountMinor: number;
  disputedAmountMinor: number;
  currency: string;
  status: 'opened' | 'under_review' | 'resolved_won' | 'resolved_lost' | 'closed';
  reason?: string;
  evidence?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

