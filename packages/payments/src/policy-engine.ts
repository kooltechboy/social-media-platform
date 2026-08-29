// Payment Policy Engine: Store-policy compliant checkout routing & capability filtering

import type { CapabilityRule, PolicyDecision, PolicyRequest, ProductType } from './types';
import { DEFAULT_CAPABILITY_RULES } from './capability-registry';

const DIGITAL_PRODUCT_TYPES: ProductType[] = ['digital_subscription', 'live_gift'];

export class PaymentPolicyEngine {
  private readonly rules: CapabilityRule[];

  public constructor(rules: CapabilityRule[] = DEFAULT_CAPABILITY_RULES) {
    this.rules = rules;
  }

  public decide(request: PolicyRequest): PolicyDecision {
    // 1. Digital Goods on iOS/Android must route via Apple IAP / Google Play Billing
    if (DIGITAL_PRODUCT_TYPES.includes(request.productType) && request.platform !== 'web') {
      const storeProvider = request.platform === 'ios' ? 'apple_pay' : 'google_pay';
      const matches = this.matchingRules(request).filter((rule) => rule.provider === storeProvider);

      if (matches.length === 0) {
        return {
          permittedProviders: [],
          selectedMethodKinds: [],
          compliant: false,
          reason: 'No store-compliant route available for digital goods on mobile',
        };
      }

      if (!this.amountWithinBounds(matches, request.amountMinor)) {
        return {
          permittedProviders: [],
          selectedMethodKinds: [],
          compliant: false,
          reason: 'Amount outside mobile store transaction bounds',
        };
      }

      return {
        permittedProviders: matches.map((rule) => String(rule.provider)),
        selectedMethodKinds: matches.map((rule) => rule.methodKind),
        compliant: true,
      };
    }

    // 2. Multimodal Web & Commerce routing
    const matches = this.matchingRules(request);
    if (matches.length === 0) {
      return {
        permittedProviders: [],
        selectedMethodKinds: [],
        compliant: false,
        reason: 'No payment capability registered for this country/platform/product',
      };
    }

    const withinBounds = matches.filter(
      (rule) => request.amountMinor >= rule.minAmountMinor && request.amountMinor <= rule.maxAmountMinor
    );

    if (withinBounds.length === 0) {
      return {
        permittedProviders: [],
        selectedMethodKinds: [],
        compliant: false,
        reason: 'Amount outside permitted bounds for available payment rails',
      };
    }

    return {
      permittedProviders: Array.from(new Set(withinBounds.map((rule) => String(rule.provider)))),
      selectedMethodKinds: Array.from(new Set(withinBounds.map((rule) => rule.methodKind))),
      compliant: true,
    };
  }

  private matchingRules(request: PolicyRequest): CapabilityRule[] {
    return this.rules.filter(
      (rule) =>
        rule.isEnabled &&
        (rule.countryIso === '*' || rule.countryIso === request.countryIso) &&
        (rule.platform === 'all' || rule.platform === request.platform) &&
        rule.productType === request.productType
    );
  }

  private amountWithinBounds(rules: CapabilityRule[], amountMinor: number): boolean {
    return rules.some((rule) => amountMinor >= rule.minAmountMinor && amountMinor <= rule.maxAmountMinor);
  }
}
