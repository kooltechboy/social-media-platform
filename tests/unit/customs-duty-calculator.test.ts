import { describe, it, expect } from 'vitest';
import {
  estimateCaribbeanCustomsDuties,
  CARICOM_CET_RATES,
  DESTINATION_VAT_RATES,
} from '../../packages/marketplace/src/index';

describe('Cross-Border Diaspora Customs Duty & Tariff Calculator (Phase 15)', () => {
  it('returns 0 duty and flags non-cross-border for domestic island orders', () => {
    const res = estimateCaribbeanCustomsDuties({
      originCountryIso: 'JAM',
      destinationCountryIso: 'JAM',
      itemValueMinor: 8000,
    });
    expect(res.isCrossBorder).toBe(false);
    expect(res.totalEstimatedDutiesMinor).toBe(0);
    expect(res.customsDutyMinor).toBe(0);
  });

  it('exempts cross-border shipments under de minimis threshold ($50 in Jamaica)', () => {
    const res = estimateCaribbeanCustomsDuties({
      originCountryIso: 'USA',
      destinationCountryIso: 'JAM',
      itemValueMinor: 4000, // $40 USD (under $50)
      shippingMinor: 1500,
      categorySlug: 'fashion-apparel',
    });
    expect(res.isCrossBorder).toBe(true);
    expect(res.deMinimisExempt).toBe(true);
    expect(res.customsDutyMinor).toBe(0);
    expect(res.importVatMinor).toBe(0);
    expect(res.adminFeeMinor).toBe(250); // $2.50 nominal electronic clearance
  });

  it('calculates CARICOM CET duty and island VAT above de minimis threshold', () => {
    // $100 item + $20 shipping = $120 CIF value
    // Jamaica: 20% CET duty on $120 = $24 (2400 minor)
    // VAT Base = $120 + $24 = $144
    // Jamaica GCT 15% on $144 = $21.60 (2160 minor)
    // Admin Fee = $5.00 (500 minor)
    // Total = $24 + $21.60 + $5 = $50.60 (5060 minor)
    const res = estimateCaribbeanCustomsDuties({
      originCountryIso: 'USA',
      destinationCountryIso: 'JAM',
      itemValueMinor: 10000, // $100
      shippingMinor: 2000,   // $20
      categorySlug: 'fashion-apparel',
    });

    expect(res.isCrossBorder).toBe(true);
    expect(res.deMinimisExempt).toBe(false);
    expect(res.customsDutyMinor).toBe(2400);
    expect(res.importVatMinor).toBe(2160);
    expect(res.adminFeeMinor).toBe(500);
    expect(res.totalEstimatedDutiesMinor).toBe(5060);
  });

  it('applies 0% duty exemption for digital creator goods across all islands', () => {
    const res = estimateCaribbeanCustomsDuties({
      originCountryIso: 'GBR',
      destinationCountryIso: 'TTO',
      itemValueMinor: 15000, // $150
      categorySlug: 'digital-sounds',
    });
    expect(res.isCrossBorder).toBe(true);
    expect(res.customsDutyMinor).toBe(0);
    expect(res.effectiveDutyRateBps).toBe(0);
  });

  it('respects higher $200 de minimis limit for the Dominican Republic', () => {
    const res = estimateCaribbeanCustomsDuties({
      originCountryIso: 'USA',
      destinationCountryIso: 'DOM',
      itemValueMinor: 15000, // $150 (under $200 DR limit)
      shippingMinor: 2000,
    });
    expect(res.deMinimisExempt).toBe(true);
    expect(res.customsDutyMinor).toBe(0);
  });
});
