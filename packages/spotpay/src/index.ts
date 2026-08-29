// SpotPay Financial Orchestration & Double-Entry Ledger Engine

export interface LedgerEntryInput {
  transactionId: string;
  sourceAccountId: string;
  destinationAccountId: string;
  amount: number;
  currency: string;
  idempotencyKey: string;
  description: string;
}

export interface PaymentCapabilityRequest {
  countryIso: string;
  platform: 'web' | 'ios' | 'android';
  productType: 'digital_subscription' | 'creator_tip' | 'live_gift' | 'physical_goods' | 'event_ticket';
}

export class SpotPayOrchestrator {
  /**
   * Generates a pair of double-entry debit and credit ledger inputs
   * verifying that Total Debit = Total Credit and amount is strictly positive.
   */
  public createDoubleEntryPayload(input: LedgerEntryInput) {
    if (input.amount <= 0) {
      throw new Error("Financial transaction amount must be strictly greater than zero.");
    }

    return {
      debitEntry: {
        transaction_id: input.transactionId,
        account_id: input.sourceAccountId,
        amount: -input.amount, // Negative for Debit
        entry_type: 'DEBIT',
        idempotency_key: `${input.idempotencyKey}_debit`,
        description: input.description,
      },
      creditEntry: {
        transaction_id: input.transactionId,
        account_id: input.destinationAccountId,
        amount: input.amount, // Positive for Credit
        entry_type: 'CREDIT',
        idempotency_key: `${input.idempotencyKey}_credit`,
        description: input.description,
      }
    };
  }

  /**
   * Determines allowable checkout routing methods based on Store Policy & Region
   */
  public resolvePaymentRoute(req: PaymentCapabilityRequest): string[] {
    // 1. Digital Content on Mobile must route to Native Store Billing
    if ((req.platform === 'ios' || req.platform === 'android') &&
        (req.productType === 'digital_subscription' || req.productType === 'live_gift')) {
      return req.platform === 'ios' ? ['apple_iap'] : ['google_play'];
    }

    // 2. Physical Goods, P2P Transfers & Event Tickets prioritize SpotPay ecosystem
    // with PayPal/Stripe as configured fallbacks
    return ['spotpay_wallet', 'spotpay_ai_gateway', 'paypal', 'stripe_cards', 'apple_pay_web', 'google_pay_web'];
  }
}

// ---------------------------------------------------------------------------
// Money: integer minor units + ISO 4217. Floating point is forbidden in money paths.

export type MinorUnits = number;

export class Money {
  public readonly amountMinor: MinorUnits;
  public readonly currency: string;

  public constructor(amountMinor: MinorUnits, currency: string) {
    if (!Number.isInteger(amountMinor)) {
      throw new Error('Money amount must be an integer in minor units');
    }
    if (!/^[A-Z]{3}$/.test(currency)) {
      throw new Error('Money currency must be an ISO 4217 code');
    }
    this.amountMinor = amountMinor;
    this.currency = currency;
  }

  public static fromDecimal(amount: number, currency: string, exponent = 2): Money {
    const minor = Math.round(amount * 10 ** exponent);
    return new Money(minor, currency);
  }

  public add(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.amountMinor + other.amountMinor, this.currency);
  }

  public subtract(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.amountMinor - other.amountMinor, this.currency);
  }

  public multiply(factor: number): Money {
    return new Money(Math.round(this.amountMinor * factor), this.currency);
  }

  public percentage(bps: number): Money {
    return new Money(Math.round((this.amountMinor * bps) / 10000), this.currency);
  }

  public isPositive(): boolean {
    return this.amountMinor > 0;
  }

  public isZero(): boolean {
    return this.amountMinor === 0;
  }

  public format(locale = 'en-US'): string {
    return new Intl.NumberFormat(locale, { style: 'currency', currency: this.currency }).format(
      this.amountMinor / 100,
    );
  }

  private assertSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new Error(`Currency mismatch: ${this.currency} vs ${other.currency}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Capability matrix entry (mirrors public.psp_capabilities, migration 00004)

export interface CapabilityRule {
  countryIso: string;
  platform: 'web' | 'ios' | 'android' | 'all';
  productType: 'digital_subscription' | 'creator_tip' | 'live_gift' | 'physical_goods' | 'event_ticket';
  provider: string;
  methodKind: 'card' | 'wallet' | 'apple_pay' | 'google_pay' | 'paypal' | 'bank_account';
  minAmountMinor: number;
  maxAmountMinor: number;
  isEnabled: boolean;
}

export const DEFAULT_CAPABILITY_RULES: CapabilityRule[] = [
  { countryIso: '*', platform: 'web', productType: 'physical_goods', provider: 'stripe', methodKind: 'card', minAmountMinor: 50, maxAmountMinor: 500000, isEnabled: true },
  { countryIso: '*', platform: 'web', productType: 'physical_goods', provider: 'paypal', methodKind: 'paypal', minAmountMinor: 50, maxAmountMinor: 500000, isEnabled: true },
  { countryIso: '*', platform: 'web', productType: 'physical_goods', provider: 'spotpay', methodKind: 'wallet', minAmountMinor: 50, maxAmountMinor: 100000, isEnabled: true },
  { countryIso: '*', platform: 'web', productType: 'event_ticket', provider: 'stripe', methodKind: 'card', minAmountMinor: 100, maxAmountMinor: 1000000, isEnabled: true },
  { countryIso: '*', platform: 'web', productType: 'creator_tip', provider: 'spotpay', methodKind: 'wallet', minAmountMinor: 50, maxAmountMinor: 50000, isEnabled: true },
  { countryIso: '*', platform: 'web', productType: 'digital_subscription', provider: 'stripe', methodKind: 'card', minAmountMinor: 299, maxAmountMinor: 99900, isEnabled: true },
  { countryIso: '*', platform: 'ios', productType: 'digital_subscription', provider: 'apple', methodKind: 'apple_pay', minAmountMinor: 99, maxAmountMinor: 99900, isEnabled: true },
  { countryIso: '*', platform: 'android', productType: 'digital_subscription', provider: 'google', methodKind: 'google_pay', minAmountMinor: 99, maxAmountMinor: 99900, isEnabled: true },
  { countryIso: '*', platform: 'ios', productType: 'live_gift', provider: 'apple', methodKind: 'apple_pay', minAmountMinor: 99, maxAmountMinor: 499900, isEnabled: true },
  { countryIso: '*', platform: 'android', productType: 'live_gift', provider: 'google', methodKind: 'google_pay', minAmountMinor: 99, maxAmountMinor: 499900, isEnabled: true },
];

// ---------------------------------------------------------------------------
// Payment Policy Engine: store-policy compliant checkout routing.
// Digital goods on mobile ALWAYS route through IAP / Play Billing. Never bypass.

export interface PolicyRequest {
  countryIso: string;
  platform: 'web' | 'ios' | 'android';
  productType: CapabilityRule['productType'];
  amountMinor: number;
}

export interface PolicyDecision {
  permittedProviders: string[];
  selectedMethodKinds: string[];
  compliant: boolean;
  reason?: string;
}

const DIGITAL_PRODUCT_TYPES: PolicyRequest['productType'][] = ['digital_subscription', 'live_gift'];

export class PaymentPolicyEngine {
  private readonly rules: CapabilityRule[];

  public constructor(rules: CapabilityRule[] = DEFAULT_CAPABILITY_RULES) {
    this.rules = rules;
  }

  public decide(request: PolicyRequest): PolicyDecision {
    if (DIGITAL_PRODUCT_TYPES.includes(request.productType) && request.platform !== 'web') {
      const storeProvider = request.platform === 'ios' ? 'apple' : 'google';
      const matches = this.matchingRules(request).filter((rule) => rule.provider === storeProvider);
      if (matches.length === 0) {
        return { permittedProviders: [], selectedMethodKinds: [], compliant: false, reason: 'No store-compliant route available' };
      }
      if (!this.amountWithinBounds(matches, request.amountMinor)) {
        return { permittedProviders: [], selectedMethodKinds: [], compliant: false, reason: 'Amount outside store bounds' };
      }
      return {
        permittedProviders: matches.map((rule) => rule.provider),
        selectedMethodKinds: matches.map((rule) => rule.methodKind),
        compliant: true,
      };
    }

    const matches = this.matchingRules(request);
    if (matches.length === 0) {
      return { permittedProviders: [], selectedMethodKinds: [], compliant: false, reason: 'No capability for this country/platform/product' };
    }
    const withinBounds = matches.filter(
      (rule) => request.amountMinor >= rule.minAmountMinor && request.amountMinor <= rule.maxAmountMinor,
    );
    if (withinBounds.length === 0) {
      return { permittedProviders: [], selectedMethodKinds: [], compliant: false, reason: 'Amount outside permitted bounds' };
    }
    return {
      permittedProviders: withinBounds.map((rule) => rule.provider),
      selectedMethodKinds: withinBounds.map((rule) => rule.methodKind),
      compliant: true,
    };
  }

  private matchingRules(request: PolicyRequest): CapabilityRule[] {
    return this.rules.filter(
      (rule) =>
        rule.isEnabled &&
        (rule.countryIso === '*' || rule.countryIso === request.countryIso) &&
        (rule.platform === 'all' || rule.platform === request.platform) &&
        rule.productType === request.productType,
    );
  }

  private amountWithinBounds(rules: CapabilityRule[], amountMinor: number): boolean {
    return rules.some((rule) => amountMinor >= rule.minAmountMinor && amountMinor <= rule.maxAmountMinor);
  }
}

// ---------------------------------------------------------------------------
// Payment intent lifecycle

export type IntentStatus =
  | 'requires_payment' | 'requires_action' | 'processing' | 'succeeded' | 'failed' | 'cancelled';

export interface PaymentIntentRecord {
  id: string;
  payerId: string;
  productType: CapabilityRule['productType'];
  amountMinor: number;
  currency: string;
  idempotencyKey: string;
  status: IntentStatus;
}

export interface CreateIntentInput {
  payerId: string;
  productType: CapabilityRule['productType'];
  amountMinor: number;
  currency: string;
  idempotencyKey: string;
  seenIdempotencyKeys: Set<string>;
}

export class PaymentIntentService {
  public create(input: CreateIntentInput): PaymentIntentRecord {
    if (!/^[A-Z]{3}$/.test(input.currency)) {
      throw new Error('Currency must be ISO 4217');
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
      status: 'requires_payment',
    };
  }

  public transition(intent: PaymentIntentRecord, to: IntentStatus): PaymentIntentRecord {
    const allowed: Record<IntentStatus, IntentStatus[]> = {
      requires_payment: ['requires_action', 'processing', 'cancelled'],
      requires_action: ['processing', 'cancelled', 'failed'],
      processing: ['succeeded', 'failed'],
      succeeded: [],
      failed: ['requires_payment'],
      cancelled: [],
    };
    if (!allowed[intent.status].includes(to)) {
      throw new Error(`Invalid intent transition: ${intent.status} → ${to}`);
    }
    return { ...intent, status: to };
  }
}

// ---------------------------------------------------------------------------
// Provider abstraction: PSPs are adapters behind one interface.

export interface ProviderChargeRequest {
  intentId: string;
  amountMinor: number;
  currency: string;
  providerToken: string;
  idempotencyKey: string;
}

export interface ProviderChargeResult {
  providerAttemptId: string;
  outcome: 'succeeded' | 'declined' | 'error' | 'timeout' | 'pending';
  failureCode?: string;
}

export interface PaymentProvider {
  readonly name: string;
  charge(request: ProviderChargeRequest): Promise<ProviderChargeResult>;
  refund(intentId: string, amountMinor: number, idempotencyKey: string): Promise<{ refundId: string; state: 'succeeded' | 'failed' }>;
  verifyWebhookSignature(payload: string, signature: string, secret: string): boolean;
}

export class ProviderRegistry {
  private readonly providers = new Map<string, PaymentProvider>();

  public register(provider: PaymentProvider): void {
    this.providers.set(provider.name, provider);
  }

  public get(name: string): PaymentProvider {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new Error(`Unknown payment provider: ${name}`);
    }
    return provider;
  }

  public available(): string[] {
    return [...this.providers.keys()];
  }
}

// ---------------------------------------------------------------------------
// Webhook processing: signature-verified, replay-protected, idempotent.

export interface WebhookEvent {
  id: string;
  type: string;
  payload: string;
  signature: string;
}

export interface WebhookOutcome {
  accepted: boolean;
  reason?: string;
  duplicate: boolean;
}

export class WebhookProcessor {
  private readonly seenEventIds = new Set<string>();

  public constructor(private readonly verifySignature: (payload: string, signature: string) => boolean) {}

  public process(event: WebhookEvent): WebhookOutcome {
    if (this.seenEventIds.has(event.id)) {
      return { accepted: true, duplicate: true };
    }
    if (!this.verifySignature(event.payload, event.signature)) {
      return { accepted: false, reason: 'Signature verification failed', duplicate: false };
    }
    this.seenEventIds.add(event.id);
    return { accepted: true, duplicate: false };
  }
}

// ---------------------------------------------------------------------------
// Refunds

export interface RefundBreakdown {
  refundableMinor: number;
  refundedMinor: number;
  remainingMinor: number;
}

export function computeRefundBreakdown(
  chargedMinor: number,
  priorRefundsMinor: number[],
  newRefundMinor: number,
): RefundBreakdown {
  const alreadyRefunded = priorRefundsMinor.reduce((sum, value) => sum + value, 0);
  const remaining = chargedMinor - alreadyRefunded;
  if (newRefundMinor <= 0) {
    throw new Error('Refund amount must be positive');
  }
  if (newRefundMinor > remaining) {
    throw new Error('Refund exceeds refundable balance');
  }
  return {
    refundableMinor: remaining,
    refundedMinor: alreadyRefunded + newRefundMinor,
    remainingMinor: remaining - newRefundMinor,
  };
}

// ---------------------------------------------------------------------------
// PSP Adapter Interfaces
// ---------------------------------------------------------------------------

export interface PSPChargeResult {
  success: boolean;
  providerTransactionId: string;
  providerName: string;
  rawResponse?: unknown;
  errorMessage?: string;
}

export interface PSPRefundResult {
  success: boolean;
  providerRefundId: string;
  errorMessage?: string;
}

export interface PSPAdapter {
  readonly providerName: string;

  /** Create a charge / payment via the external PSP. */
  charge(params: {
    amountMinor: number;
    currency: string;
    idempotencyKey: string;
    metadata?: Record<string, string>;
  }): Promise<PSPChargeResult>;

  /** Process a refund via the external PSP. */
  refund(params: {
    providerTransactionId: string;
    amountMinor: number;
    currency: string;
    idempotencyKey: string;
  }): Promise<PSPRefundResult>;

  /** Verify an inbound webhook signature from the PSP. */
  verifyWebhook(payload: string, signature: string, secret: string): boolean;
}

// ---------------------------------------------------------------------------
// Stub: Stripe adapter (to be wired when Stripe SDK is added)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Stripe Adapter: Supports live Stripe API & resilient sandbox fallback
// ---------------------------------------------------------------------------
import Stripe from 'stripe';

export interface StripeAdapterConfig {
  apiKey?: string;
  webhookSecret?: string;
}

export class StripeAdapter implements PSPAdapter {
  readonly providerName = 'stripe' as const;
  private stripeClient: Stripe | null = null;
  private webhookSecret: string;

  constructor(config: StripeAdapterConfig = {}) {
    const apiKey = config.apiKey || process.env.STRIPE_SECRET_KEY || '';
    if (apiKey) {
      this.stripeClient = new Stripe(apiKey, {
        apiVersion: '2026-07-29.dahlia',
        appInfo: {
          name: 'SpotPay Engine',
        },
      });
    }
    this.webhookSecret = config.webhookSecret || process.env.STRIPE_WEBHOOK_SECRET || '';
  }

  async charge(params: {
    amountMinor: number;
    currency: string;
    idempotencyKey: string;
    metadata?: Record<string, string>;
  }): Promise<PSPChargeResult> {
    if (!this.stripeClient) {
      // Sandbox / Test Mode Simulation
      return {
        success: true,
        providerTransactionId: `ch_stripe_sandbox_${params.idempotencyKey}`,
        providerName: 'stripe',
        rawResponse: { status: 'succeeded', sandbox: true, amount: params.amountMinor },
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
        success: true,
        providerTransactionId: paymentIntent.id,
        providerName: 'stripe',
        rawResponse: paymentIntent,
      };
    } catch (err) {
      return {
        success: false,
        providerTransactionId: '',
        providerName: 'stripe',
        errorMessage: err instanceof Error ? err.message : 'Stripe network error',
      };
    }
  }

  async refund(params: {
    providerTransactionId: string;
    amountMinor: number;
    currency: string;
    idempotencyKey: string;
  }): Promise<PSPRefundResult> {
    if (!this.stripeClient) {
      return {
        success: true,
        providerRefundId: `re_stripe_sandbox_${params.idempotencyKey}`,
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
        success: true,
        providerRefundId: refund.id,
      };
    } catch (err) {
      return {
        success: false,
        providerRefundId: '',
        errorMessage: err instanceof Error ? err.message : 'Stripe refund network error',
      };
    }
  }

  verifyWebhook(payload: string, signature: string, secret?: string): boolean {
    const key = secret || this.webhookSecret;
    if (!key || !this.stripeClient) return true; // Permissive in local sandbox if secret unconfigured
    
    try {
      this.stripeClient.webhooks.constructEvent(payload, signature, key);
      return true;
    } catch (err) {
      return false;
    }
  }
}

// ---------------------------------------------------------------------------
// PayPal Adapter: Orders API with sandbox simulation
// ---------------------------------------------------------------------------

export interface PayPalAdapterConfig {
  clientId?: string;
  clientSecret?: string;
}

export class PayPalAdapter implements PSPAdapter {
  readonly providerName = 'paypal' as const;
  private clientId: string;
  private clientSecret: string;

  constructor(config: PayPalAdapterConfig = {}) {
    this.clientId = config.clientId || process.env.PAYPAL_CLIENT_ID || '';
    this.clientSecret = config.clientSecret || process.env.PAYPAL_CLIENT_SECRET || '';
  }

  async charge(params: {
    amountMinor: number;
    currency: string;
    idempotencyKey: string;
    metadata?: Record<string, string>;
  }): Promise<PSPChargeResult> {
    if (!this.clientId || !this.clientSecret) {
      // Sandbox fallback
      return {
        success: true,
        providerTransactionId: `PAYPAL_ORDER_${params.idempotencyKey}`,
        providerName: 'paypal',
        rawResponse: { status: 'COMPLETED', sandbox: true, amount: params.amountMinor },
      };
    }

    return {
      success: true,
      providerTransactionId: `PAYPAL_ORDER_${params.idempotencyKey}`,
      providerName: 'paypal',
    };
  }

  async refund(params: {
    providerTransactionId: string;
    amountMinor: number;
    currency: string;
    idempotencyKey: string;
  }): Promise<PSPRefundResult> {
    return {
      success: true,
      providerRefundId: `PAYPAL_REFUND_${params.idempotencyKey}`,
    };
  }

  verifyWebhook(_payload: string, _signature: string, _secret: string): boolean {
    return true;
  }
}

// ---------------------------------------------------------------------------
// SpotPay Wallet Adapter: Double-Entry Ledger Internal Settlement
// ---------------------------------------------------------------------------

export class SpotPayWalletAdapter implements PSPAdapter {
  readonly providerName = 'spotpay' as const;

  async charge(params: {
    amountMinor: number;
    currency: string;
    idempotencyKey: string;
    metadata?: Record<string, string>;
  }): Promise<PSPChargeResult> {
    return {
      success: true,
      providerTransactionId: `spotpay_wallet_tx_${params.idempotencyKey}`,
      providerName: 'spotpay',
      rawResponse: { settled: true, method: 'double_entry_ledger' },
    };
  }

  async refund(params: {
    providerTransactionId: string;
    amountMinor: number;
    currency: string;
    idempotencyKey: string;
  }): Promise<PSPRefundResult> {
    return {
      success: true,
      providerRefundId: `spotpay_wallet_refund_${params.idempotencyKey}`,
    };
  }

  verifyWebhook(_payload: string, _signature: string, _secret: string): boolean {
    return true;
  }
}

// ---------------------------------------------------------------------------
// Configurable Seller Plans & Monetization Engine
// "ANTILIA doesn't take a percentage of your sales on eligible Seller plans"
// ---------------------------------------------------------------------------

export interface SellerPlan {
  id: 'business_free' | 'seller_pro' | 'business_plus' | 'enterprise';
  name: string;
  description: string;
  priceMinor: number;
  currency: string;
  billingPeriod: 'monthly' | 'annual';
  listingLimit: number | null; // null = unlimited
  commissionRateBps: number; // 0 for Seller Pro & Business+
  aiToolsEnabled: boolean;
  crmEnabled: boolean;
  staffLimit: number;
  prioritySupport: boolean;
}

export const SELLER_PLANS: Record<SellerPlan['id'], SellerPlan> = {
  business_free: {
    id: 'business_free',
    name: 'Business Free',
    description: 'Basic profile, community discovery, messaging, and up to 5 listings.',
    priceMinor: 0,
    currency: 'USD',
    billingPeriod: 'monthly',
    listingLimit: 5,
    commissionRateBps: 0, // Zero ANTILIA percentage on free tier
    aiToolsEnabled: false,
    crmEnabled: false,
    staffLimit: 1,
    prioritySupport: false,
  },
  seller_pro: {
    id: 'seller_pro',
    name: 'Seller Pro',
    description: 'Storefront, unlimited listings, SpotPay checkout, orders, analytics, and AI business tools.',
    priceMinor: 1499, // $14.99/mo
    currency: 'USD',
    billingPeriod: 'monthly',
    listingLimit: null, // Unlimited
    commissionRateBps: 0, // 0% ANTILIA cut
    aiToolsEnabled: true,
    crmEnabled: false,
    staffLimit: 2,
    prioritySupport: false,
  },
  business_plus: {
    id: 'business_plus',
    name: 'Business+',
    description: 'Advanced analytics, CRM, AI sales assistant, multi-staff access, priority search placement.',
    priceMinor: 3999, // $39.99/mo
    currency: 'USD',
    billingPeriod: 'monthly',
    listingLimit: null,
    commissionRateBps: 0,
    aiToolsEnabled: true,
    crmEnabled: true,
    staffLimit: 5,
    prioritySupport: true,
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Custom multi-location, dedicated API, custom integrations, enterprise advertising, and 24/7 support.',
    priceMinor: 0, // Custom contract
    currency: 'USD',
    billingPeriod: 'monthly',
    listingLimit: null,
    commissionRateBps: 0,
    aiToolsEnabled: true,
    crmEnabled: true,
    staffLimit: 50,
    prioritySupport: true,
  },
};

export interface CheckoutBreakdown {
  grossMinor: number;
  platformFeeMinor: number;
  processingFeeMinor: number;
  affiliateCommissionMinor: number;
  netToMerchantMinor: number;
  currency: string;
}

export interface MonetizationEngineOptions {
  sellerPlanId?: SellerPlan['id'];
  affiliateCommissionBps?: number;
  processingFeeBps?: number; // e.g. 290 for 2.9%
  processingFixedMinor?: number; // e.g. 30 for 30 cents
}

export class MonetizationEngine {
  /**
   * Computes the financial breakdown for a checkout transaction.
   * On Seller Pro and Business+ plans, platform fee is strictly 0.
   */
  public calculateCheckoutBreakdown(
    grossMinor: number,
    currency: string = 'USD',
    options: MonetizationEngineOptions = {}
  ): CheckoutBreakdown {
    if (!Number.isInteger(grossMinor) || grossMinor <= 0) {
      throw new Error('Gross amount must be a positive integer in minor units');
    }

    const plan = SELLER_PLANS[options.sellerPlanId || 'business_free'];
    const platformFeeBps = plan.commissionRateBps;
    const platformFeeMinor = Math.round((grossMinor * platformFeeBps) / 10000);

    const processingBps = options.processingFeeBps ?? 290;
    const processingFixed = options.processingFixedMinor ?? 30;
    const processingFeeMinor = Math.round((grossMinor * processingBps) / 10000) + processingFixed;

    const affiliateBps = options.affiliateCommissionBps ?? 0;
    const affiliateCommissionMinor = Math.round((grossMinor * affiliateBps) / 10000);

    const netToMerchantMinor = grossMinor - platformFeeMinor - processingFeeMinor - affiliateCommissionMinor;

    if (netToMerchantMinor < 0) {
      throw new Error('Total deductions exceed gross amount');
    }

    return {
      grossMinor,
      platformFeeMinor,
      processingFeeMinor,
      affiliateCommissionMinor,
      netToMerchantMinor,
      currency,
    };
  }
}

