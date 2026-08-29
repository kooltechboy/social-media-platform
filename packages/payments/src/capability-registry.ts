// Provider Capability Registry & Rule Matching

import type { CapabilityRule, ProviderCapability, ProviderId } from './types';

export interface ProviderDefinition {
  id: ProviderId | string;
  name: string;
  capabilities: ProviderCapability[];
  supportedCountries: string[];
  supportedCurrencies: string[];
  status: 'active' | 'sandbox' | 'disabled' | 'pending_approval';
  environment: 'production' | 'sandbox' | 'test';
  isThirdPartyPSP: boolean;
  notes?: string;
}

export const REGISTERED_PROVIDERS: Record<string, ProviderDefinition> = {
  stripe: {
    id: 'stripe',
    name: 'Stripe',
    capabilities: [
      'payment',
      'checkout',
      'authorization',
      'capture',
      'refund',
      'partial_refund',
      'recurring_billing',
      'subscription',
      'tokenization',
      '3ds',
      'google_pay',
      'apple_pay',
      'webhook_support',
      'dispute_management',
    ],
    supportedCountries: ['US', 'CA', 'GB', 'IE', 'PR'],
    supportedCurrencies: ['USD', 'CAD', 'GBP', 'EUR'],
    status: 'sandbox',
    environment: 'sandbox',
    isThirdPartyPSP: true,
    notes: 'Primary international card processing rail.',
  },
  paypal: {
    id: 'paypal',
    name: 'PayPal',
    capabilities: [
      'payment',
      'checkout',
      'refund',
      'partial_refund',
      'recurring_billing',
      'subscription',
      'payout',
      'dispute_management',
      'webhook_support',
    ],
    supportedCountries: ['*'],
    supportedCurrencies: ['USD', 'CAD', 'GBP', 'EUR', 'DOP', 'JMD', 'TTD'],
    status: 'sandbox',
    environment: 'sandbox',
    isThirdPartyPSP: true,
    notes: 'Global diaspora checkout and merchant receiving.',
  },
  cxpay: {
    id: 'cxpay',
    name: 'CX Pay',
    capabilities: [
      'payment',
      'checkout',
      'tokenization',
      'refund',
      '3ds',
      'webhook_support',
    ],
    supportedCountries: ['DO', 'JM', 'TT', 'BB', 'BS', 'GY', 'SR', 'BZ', 'AG', 'KN', 'LC', 'VC', 'DM', 'GD', 'CW', 'AW', 'SX'],
    supportedCurrencies: ['USD', 'DOP', 'JMD', 'TTD', 'BBD', 'BSD', 'ANG', 'AWG', 'XCD'],
    status: 'pending_approval',
    environment: 'sandbox',
    isThirdPartyPSP: true,
    notes: 'Primary Caribbean card & localized gateway integration candidate.',
  },
  wipay: {
    id: 'wipay',
    name: 'WiPay',
    capabilities: [
      'payment',
      'checkout',
      'refund',
      'webhook_support',
      'withdrawal',
      'bank_settlement',
    ],
    supportedCountries: ['TT', 'JM', 'BB', 'GY'],
    supportedCurrencies: ['USD', 'TTD', 'JMD', 'BBD', 'GYD'],
    status: 'pending_approval',
    environment: 'sandbox',
    isThirdPartyPSP: true,
    notes: 'Caribbean localized payment processor & bank transfer rails candidate.',
  },
  apple_pay: {
    id: 'apple_pay',
    name: 'Apple Pay',
    capabilities: ['payment', 'checkout', 'tokenization'],
    supportedCountries: ['*'],
    supportedCurrencies: ['*'],
    status: 'sandbox',
    environment: 'sandbox',
    isThirdPartyPSP: false,
    notes: 'Tokenized digital wallet payment acceptance method, processed through underlying PSP.',
  },
  google_pay: {
    id: 'google_pay',
    name: 'Google Pay',
    capabilities: ['payment', 'checkout', 'tokenization'],
    supportedCountries: ['*'],
    supportedCurrencies: ['*'],
    status: 'sandbox',
    environment: 'sandbox',
    isThirdPartyPSP: false,
    notes: 'Tokenized digital wallet payment acceptance method, processed through underlying PSP.',
  },
  cashapp: {
    id: 'cashapp',
    name: 'Cash App Pay',
    capabilities: ['payment', 'refund', 'webhook_support'],
    supportedCountries: ['US'],
    supportedCurrencies: ['USD'],
    status: 'pending_approval',
    environment: 'sandbox',
    isThirdPartyPSP: true,
    notes: 'Cash App Pay merchant integration.',
  },
  bank_transfer: {
    id: 'bank_transfer',
    name: 'Bank Transfer Rails',
    capabilities: ['transfer', 'withdrawal', 'payout', 'bank_settlement', 'account_verification'],
    supportedCountries: ['US', 'DO', 'JM', 'TT', 'BB'],
    supportedCurrencies: ['USD', 'DOP', 'JMD', 'TTD', 'BBD'],
    status: 'pending_approval',
    environment: 'sandbox',
    isThirdPartyPSP: true,
    notes: 'Open banking and authorized direct settlement rails.',
  },
  spotpay: {
    id: 'spotpay',
    name: 'SpotPay (Future / Conditional)',
    capabilities: [],
    supportedCountries: [],
    supportedCurrencies: [],
    status: 'disabled',
    environment: 'test',
    isThirdPartyPSP: true,
    notes: 'Future conditional integration pending official developer API, OAuth and partner agreement.',
  },
};

export const DEFAULT_CAPABILITY_RULES: CapabilityRule[] = [
  // Web physical goods
  { countryIso: '*', platform: 'web', productType: 'physical_goods', provider: 'stripe', methodKind: 'card', minAmountMinor: 50, maxAmountMinor: 500000, isEnabled: true },
  { countryIso: '*', platform: 'web', productType: 'physical_goods', provider: 'paypal', methodKind: 'paypal', minAmountMinor: 50, maxAmountMinor: 500000, isEnabled: true },
  { countryIso: '*', platform: 'web', productType: 'physical_goods', provider: 'cxpay', methodKind: 'cxpay', minAmountMinor: 50, maxAmountMinor: 500000, isEnabled: true },
  { countryIso: '*', platform: 'web', productType: 'physical_goods', provider: 'wipay', methodKind: 'wipay', minAmountMinor: 50, maxAmountMinor: 500000, isEnabled: true },

  // Event tickets
  { countryIso: '*', platform: 'web', productType: 'event_ticket', provider: 'stripe', methodKind: 'card', minAmountMinor: 100, maxAmountMinor: 1000000, isEnabled: true },
  { countryIso: '*', platform: 'web', productType: 'event_ticket', provider: 'paypal', methodKind: 'paypal', minAmountMinor: 100, maxAmountMinor: 1000000, isEnabled: true },
  { countryIso: '*', platform: 'web', productType: 'event_ticket', provider: 'cxpay', methodKind: 'cxpay', minAmountMinor: 100, maxAmountMinor: 1000000, isEnabled: true },

  // Creator tips & live gifts (web)
  { countryIso: '*', platform: 'web', productType: 'creator_tip', provider: 'stripe', methodKind: 'card', minAmountMinor: 100, maxAmountMinor: 50000, isEnabled: true },
  { countryIso: '*', platform: 'web', productType: 'creator_tip', provider: 'paypal', methodKind: 'paypal', minAmountMinor: 100, maxAmountMinor: 50000, isEnabled: true },

  // Digital subscriptions (web)
  { countryIso: '*', platform: 'web', productType: 'digital_subscription', provider: 'stripe', methodKind: 'card', minAmountMinor: 299, maxAmountMinor: 99900, isEnabled: true },
  { countryIso: '*', platform: 'web', productType: 'digital_subscription', provider: 'paypal', methodKind: 'paypal', minAmountMinor: 299, maxAmountMinor: 99900, isEnabled: true },

  // Mobile App Store compliance rules (§3.1.1)
  { countryIso: '*', platform: 'ios', productType: 'digital_subscription', provider: 'apple_pay', methodKind: 'apple_pay', minAmountMinor: 99, maxAmountMinor: 99900, isEnabled: true },
  { countryIso: '*', platform: 'android', productType: 'digital_subscription', provider: 'google_pay', methodKind: 'google_pay', minAmountMinor: 99, maxAmountMinor: 99900, isEnabled: true },
  { countryIso: '*', platform: 'ios', productType: 'live_gift', provider: 'apple_pay', methodKind: 'apple_pay', minAmountMinor: 99, maxAmountMinor: 499900, isEnabled: true },
  { countryIso: '*', platform: 'android', productType: 'live_gift', provider: 'google_pay', methodKind: 'google_pay', minAmountMinor: 99, maxAmountMinor: 499900, isEnabled: true },
];
