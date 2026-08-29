// Money: integer minor units + ISO 4217. Floating point is forbidden in money paths.

import type { MinorUnits } from './types';

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

  public toDecimal(): number {
    return this.amountMinor / 100;
  }

  public format(locale = 'en-US'): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: this.currency,
    }).format(this.amountMinor / 100);
  }

  private assertSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new Error(`Currency mismatch: ${this.currency} vs ${other.currency}`);
    }
  }
}
