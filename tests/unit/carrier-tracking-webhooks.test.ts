import { describe, it, expect } from 'vitest';
import {
  CARIBBEAN_CARRIERS,
  normalizeCarrierWebhookStatus,
  formatCarrierTrackingUrl,
} from '../../packages/marketplace/src/index';

describe('Caribbean Carrier Registry & Webhook Normalization (Phase 14)', () => {
  it('registers all primary regional carriers with correct transport service types', () => {
    expect(CARIBBEAN_CARRIERS.aeropost.serviceType).toBe('air_cargo');
    expect(CARIBBEAN_CARRIERS.laparkan.serviceType).toBe('maritime_freight');
    expect(CARIBBEAN_CARRIERS.tropical_shipping.serviceType).toBe('maritime_freight');
    expect(CARIBBEAN_CARRIERS.caribbean_airlines.serviceType).toBe('air_cargo');
    expect(CARIBBEAN_CARRIERS.dhl_express.serviceType).toBe('express_courier');
  });

  it('normalizes various carrier status strings to canonical milestone states', () => {
    expect(normalizeCarrierWebhookStatus('aeropost', 'DELIVERED')).toBe('delivered');
    expect(normalizeCarrierWebhookStatus('dhl_express', 'Proof of Delivery Signed by Consignee')).toBe('delivered');
    expect(normalizeCarrierWebhookStatus('laparkan', 'Out with driver for delivery')).toBe('out_for_delivery');
    expect(normalizeCarrierWebhookStatus('tropical_shipping', 'Customs clearance processed at Kingston Port')).toBe('customs_cleared');
    expect(normalizeCarrierWebhookStatus('caribbean_airlines', 'Flight departed MIA to POS in transit')).toBe('inter_island_transit');
    expect(normalizeCarrierWebhookStatus('aeropost', 'Severe tropical weather delay at Bridgetown Hub')).toBe('exception');
    expect(normalizeCarrierWebhookStatus('dhl_express', 'Shipment information received')).toBe('order_placed');
  });

  it('generates direct tracking links with encoded tracking numbers', () => {
    const aeropostUrl = formatCarrierTrackingUrl('aeropost', 'AP-982314-JM');
    expect(aeropostUrl).toBe('https://aeropost.com/track?pkg=AP-982314-JM');

    const calCargoUrl = formatCarrierTrackingUrl('caribbean_airlines', '106-98765432');
    expect(calCargoUrl).toBe('https://cargo.caribbean-airlines.com/track?awb=106-98765432');
  });
});
