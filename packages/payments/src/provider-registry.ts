// Universal Provider Registry & Payment Orchestration Layer

import type { PSPAdapter } from './adapters/types';
import { StripeAdapter } from './adapters/stripe';
import { PayPalAdapter } from './adapters/paypal';
import { CXPayAdapter } from './adapters/cxpay';
import { WiPayAdapter } from './adapters/wipay';
import { CashAppAdapter } from './adapters/cashapp';
import { REGISTERED_PROVIDERS, type ProviderDefinition } from './capability-registry';

export class ProviderRegistry {
  private readonly adapters = new Map<string, PSPAdapter>();

  constructor() {
    // Register standard adapters
    this.register(new StripeAdapter());
    this.register(new PayPalAdapter());
    this.register(new CXPayAdapter());
    this.register(new WiPayAdapter());
    this.register(new CashAppAdapter());
  }

  public register(adapter: PSPAdapter): void {
    this.adapters.set(adapter.providerName, adapter);
  }

  public get(name: string): PSPAdapter {
    const adapter = this.adapters.get(name);
    if (!adapter) {
      throw new Error(`Unknown or unsupported payment provider: ${name}`);
    }
    return adapter;
  }

  public has(name: string): boolean {
    return this.adapters.has(name);
  }

  public available(): string[] {
    return Array.from(this.adapters.keys());
  }

  public getDefinition(providerId: string): ProviderDefinition | undefined {
    return REGISTERED_PROVIDERS[providerId];
  }

  public listAllDefinitions(): ProviderDefinition[] {
    return Object.values(REGISTERED_PROVIDERS);
  }
}
