/**
 * TUKUBI Inter-Island Merchant Logistics & Shipping Subsystem
 * Regional Caribbean freight routes, maritime ferry & air cargo tracking,
 * customs milestones, and automated delivery window calculation.
 */

export type IslandTerritoryCode =
  | 'JAM' // Jamaica
  | 'TTO' // Trinidad & Tobago
  | 'BRB' // Barbados
  | 'BHS' // Bahamas
  | 'HTI' // Haiti
  | 'LCA' // Saint Lucia
  | 'CUW' // Curaçao
  | 'ABW' // Aruba
  | 'GRD' // Grenada
  | 'GUY' // Guyana
  | 'SUR' // Suriname
  | 'DOM' // Dominican Republic
  | 'PRI' // Puerto Rico
  | 'CYM' // Cayman Islands
  | 'ATG' // Antigua & Barbuda
  | 'KNA' // Saint Kitts & Nevis
  | 'VCT' // Saint Vincent & the Grenadines
  | 'DMA' // Dominica
  | 'BVI'; // British Virgin Islands

export type TransitMode =
  | 'maritime_freight'
  | 'air_cargo'
  | 'inter_island_ferry'
  | 'local_island_dispatch';

export type ShipmentMilestoneStatus =
  | 'order_placed'
  | 'packaged'
  | 'port_dispatched'
  | 'inter_island_transit'
  | 'customs_cleared'
  | 'out_for_delivery'
  | 'delivered'
  | 'exception';

export interface ShipmentMilestone {
  id: string;
  status: ShipmentMilestoneStatus;
  timestamp: string;
  location: string;
  description: string;
  carrier: string;
  vesselOrFlight?: string;
}

export interface InterIslandShipment {
  id: string;
  orderId: string;
  carrierName: string;
  trackingNumber: string;
  originIsland: string;
  destinationIsland: string;
  transitMode: TransitMode;
  currentStatus: ShipmentMilestoneStatus;
  milestones: ShipmentMilestone[];
  estimatedDeliveryAt: string;
  isCustomsRequired: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Standard milestone progression map with progress percentages and accessible icons.
 */
export const SHIPMENT_STATUS_METADATA: Record<
  ShipmentMilestoneStatus,
  { label: string; icon: string; progressPercent: number }
> = {
  order_placed: { label: 'Order Confirmed', icon: '📝', progressPercent: 15 },
  packaged: { label: 'Packaged & Inspected', icon: '📦', progressPercent: 30 },
  port_dispatched: { label: 'Dispatched to Port/Airport', icon: '🚚', progressPercent: 45 },
  inter_island_transit: { label: 'In Inter-Island Transit', icon: '🚢', progressPercent: 65 },
  customs_cleared: { label: 'Regional Customs Cleared', icon: '🛂', progressPercent: 80 },
  out_for_delivery: { label: 'Out for Local Island Delivery', icon: '🛵', progressPercent: 90 },
  delivered: { label: 'Delivered to Customer', icon: '✅', progressPercent: 100 },
  exception: { label: 'Weather or Port Delay', icon: '⚠️', progressPercent: 50 },
};

/**
 * Calculates estimated transit duration (in hours) between Caribbean territories.
 * Factors in geographic proximity and customs border clearance.
 */
export function estimateInterIslandTransitHours(
  origin: string,
  destination: string,
  transitMode: TransitMode
): number {
  const normOrigin = origin.toUpperCase();
  const normDest = destination.toUpperCase();

  // Same island (local island dispatch)
  if (normOrigin === normDest) {
    return 12; // Same-day or next-morning dispatch
  }

  // Same twin-island state (e.g. Trinidad <-> Tobago, St. Kitts <-> Nevis)
  const isTwinIsland =
    (normOrigin.includes('TRINIDAD') && normDest.includes('TOBAGO')) ||
    (normOrigin.includes('TOBAGO') && normDest.includes('TRINIDAD')) ||
    (normOrigin.includes('KITTS') && normDest.includes('NEVIS')) ||
    (normOrigin.includes('NEVIS') && normDest.includes('KITTS'));

  if (isTwinIsland) {
    return transitMode === 'air_cargo' ? 4 : 8; // Fast maritime ferry or domestic air hop
  }

  // Cross-border regional Caribbean transit
  switch (transitMode) {
    case 'air_cargo':
      return 24; // 1 business day including airport customs clearance
    case 'inter_island_ferry':
      return 36; // 1.5 days for proximate islands (e.g. St. Lucia <-> Martinique)
    case 'maritime_freight':
    default:
      return 72; // 3 business days for maritime container cargo & port clearance
  }
}

/**
 * Initializes a new Caribbean inter-island shipment with starting milestones.
 */
export function createInterIslandShipment(params: {
  orderId: string;
  carrierName: string;
  trackingNumber: string;
  originIsland: string;
  destinationIsland: string;
  transitMode: TransitMode;
  now?: Date;
}): InterIslandShipment {
  const now = params.now ?? new Date();
  const transitHours = estimateInterIslandTransitHours(
    params.originIsland,
    params.destinationIsland,
    params.transitMode
  );
  const estimatedDelivery = new Date(now.getTime() + transitHours * 60 * 60 * 1000);
  const isCrossBorder = params.originIsland.toLowerCase() !== params.destinationIsland.toLowerCase();

  const initialMilestone: ShipmentMilestone = {
    id: `ms-1`,
    status: 'order_placed',
    timestamp: now.toISOString(),
    location: `${params.originIsland} Merchant Hub`,
    description: `Order verified by ${params.carrierName} for dispatch to ${params.destinationIsland}.`,
    carrier: params.carrierName,
  };

  return {
    id: `ship_${params.trackingNumber.toLowerCase()}`,
    orderId: params.orderId,
    carrierName: params.carrierName,
    trackingNumber: params.trackingNumber,
    originIsland: params.originIsland,
    destinationIsland: params.destinationIsland,
    transitMode: params.transitMode,
    currentStatus: 'order_placed',
    milestones: [initialMilestone],
    estimatedDeliveryAt: estimatedDelivery.toISOString(),
    isCustomsRequired: isCrossBorder,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}

/**
 * Advances an existing shipment to a new milestone with audit tracking.
 */
export function advanceShipmentMilestone(
  shipment: InterIslandShipment,
  newStatus: ShipmentMilestoneStatus,
  details: {
    location: string;
    description?: string;
    vesselOrFlight?: string;
    timestamp?: string;
  }
): InterIslandShipment {
  const meta = SHIPMENT_STATUS_METADATA[newStatus];
  const timestamp = details.timestamp || new Date().toISOString();

  const newMilestone: ShipmentMilestone = {
    id: `ms-${shipment.milestones.length + 1}`,
    status: newStatus,
    timestamp,
    location: details.location,
    description: details.description || meta.label,
    carrier: shipment.carrierName,
    vesselOrFlight: details.vesselOrFlight,
  };

  return {
    ...shipment,
    currentStatus: newStatus,
    milestones: [...shipment.milestones, newMilestone],
    updatedAt: timestamp,
  };
}

// =============================================================================
// Caribbean Regional Carriers & Webhook Normalization (Phase 14)
// =============================================================================

export type CarrierCode =
  | 'aeropost'
  | 'laparkan'
  | 'tropical_shipping'
  | 'caribbean_airlines'
  | 'dhl_express'
  | 'custom_courier';

export interface CaribbeanCarrierInfo {
  code: CarrierCode;
  name: string;
  serviceType: 'air_cargo' | 'maritime_freight' | 'express_courier';
  trackingUrlTemplate: string;
  supportPhone?: string;
  regionsServed: string[];
}

export const CARIBBEAN_CARRIERS: Record<CarrierCode, CaribbeanCarrierInfo> = {
  aeropost: {
    code: 'aeropost',
    name: 'Aeropost Caribbean',
    serviceType: 'air_cargo',
    trackingUrlTemplate: 'https://aeropost.com/track?pkg={trackingNumber}',
    regionsServed: ['JAM', 'DOM', 'TTO', 'BRB', 'BHS', 'HTI', 'USA'],
  },
  laparkan: {
    code: 'laparkan',
    name: 'Laparkan Freight & Logistics',
    serviceType: 'maritime_freight',
    trackingUrlTemplate: 'https://laparkan.com/tracking?b_no={trackingNumber}',
    regionsServed: ['GUY', 'SUR', 'JAM', 'TTO', 'BRB', 'USA', 'CAN'],
  },
  tropical_shipping: {
    code: 'tropical_shipping',
    name: 'Tropical Shipping Maritime',
    serviceType: 'maritime_freight',
    trackingUrlTemplate: 'https://tropical.com/track/booking/{trackingNumber}',
    regionsServed: ['JAM', 'DOM', 'TTO', 'BRB', 'BHS', 'LCA', 'ATG'],
  },
  caribbean_airlines: {
    code: 'caribbean_airlines',
    name: 'Caribbean Airlines Cargo',
    serviceType: 'air_cargo',
    trackingUrlTemplate: 'https://cargo.caribbean-airlines.com/track?awb={trackingNumber}',
    regionsServed: ['TTO', 'JAM', 'GUY', 'BRB', 'MIA', 'JFK', 'YYZ'],
  },
  dhl_express: {
    code: 'dhl_express',
    name: 'DHL Express Caribbean',
    serviceType: 'express_courier',
    trackingUrlTemplate: 'https://www.dhl.com/en/express/tracking.html?AWB={trackingNumber}',
    regionsServed: ['ALL'],
  },
  custom_courier: {
    code: 'custom_courier',
    name: 'Island Local Dispatcher',
    serviceType: 'express_courier',
    trackingUrlTemplate: '/marketplace/tracking?num={trackingNumber}',
    regionsServed: ['LOCAL'],
  },
};

export function normalizeCarrierWebhookStatus(carrierCode: string, rawStatus: string): ShipmentMilestoneStatus {
  const norm = rawStatus.toLowerCase().trim();
  if (
    norm.includes('out for delivery') ||
    norm.includes('with driver') ||
    norm.includes('with courier') ||
    norm.includes('for delivery') ||
    norm.includes('van') ||
    norm.includes('on vehicle')
  ) {
    return 'out_for_delivery';
  }
  if (norm.includes('delivered') || norm === 'delivered' || norm === 'pod' || norm.includes('signed')) {
    return 'delivered';
  }
  if (norm.includes('custom') || norm.includes('duty') || norm.includes('tax') || norm.includes('clearance')) {
    return 'customs_cleared';
  }
  if (norm.includes('transit') || norm.includes('depart') || norm.includes('sailing') || norm.includes('flight') || norm.includes('arrived at hub')) {
    return 'inter_island_transit';
  }
  if (norm.includes('port') || norm.includes('dock') || norm.includes('warehouse')) {
    return 'port_dispatched';
  }
  if (norm.includes('delay') || norm.includes('exception') || norm.includes('weather') || norm.includes('failed')) {
    return 'exception';
  }
  if (norm.includes('pack') || norm.includes('ready')) {
    return 'packaged';
  }
  return 'order_placed';
}

export function formatCarrierTrackingUrl(carrierCode: string, trackingNumber: string): string {
  const carrier = CARIBBEAN_CARRIERS[carrierCode as CarrierCode] || CARIBBEAN_CARRIERS.custom_courier;
  return carrier.trackingUrlTemplate.replace('{trackingNumber}', encodeURIComponent(trackingNumber));
}

// =============================================================================
// Cross-Border Diaspora Duty & Tariff Calculation Engine (Phase 15)
// =============================================================================

export interface CustomsDutyParams {
  itemValueMinor: number;
  shippingMinor?: number;
  originCountryIso: string;
  destinationCountryIso: string;
  categorySlug?: string;
  prepayDuties?: boolean;
}

export interface CustomsDutyResult {
  isCrossBorder: boolean;
  deMinimisExempt: boolean;
  deMinimisLimitMinor: number;
  customsDutyMinor: number;
  importVatMinor: number;
  adminFeeMinor: number;
  totalEstimatedDutiesMinor: number;
  effectiveDutyRateBps: number;
  effectiveVatRateBps: number;
  currency: string;
}

export const CARICOM_CET_RATES: Record<string, number> = {
  'food-spices': 2000,       // 20%
  'carnival-mas': 2000,      // 20%
  'art-decor': 2000,         // 20%
  'fashion-apparel': 2000,   // 20%
  'beauty-wellness': 2000,   // 20%
  'digital-sounds': 0,       // 0% digital exemption
  'services-bookings': 0,    // 0% service exemption
  'electronics-tech': 1000,  // 10%
  'vehicles-transport': 3000,// 30%
  'real-estate-rentals': 0,  // 0%
  default: 2000,             // 20% standard CET
};

export const DESTINATION_VAT_RATES: Record<string, number> = {
  JAM: 1500, // 15% GCT (Jamaica)
  DOM: 1800, // 18% ITBIS (Dominican Republic)
  TTO: 1250, // 12.5% VAT (Trinidad & Tobago)
  BRB: 1750, // 17.5% VAT (Barbados)
  BHS: 1000, // 10% VAT (Bahamas)
  HTI: 1000, // 10% TCA (Haiti)
  PRI: 1150, // 11.5% IVU (Puerto Rico)
  LCA: 1250, // 12.5% VAT (Saint Lucia)
  GUY: 1400, // 14% VAT (Guyana)
  default: 1500,
};

export const DE_MINIMIS_LIMITS_USD_MINOR: Record<string, number> = {
  JAM: 5000,  // $50 USD
  DOM: 20000, // $200 USD
  TTO: 5000,  // $50 USD
  BRB: 5000,  // $50 USD
  default: 5000,
};

export function estimateCaribbeanCustomsDuties(params: CustomsDutyParams): CustomsDutyResult {
  const origin = params.originCountryIso.toUpperCase();
  const dest = params.destinationCountryIso.toUpperCase();
  const isCrossBorder = origin !== dest;

  if (!isCrossBorder || params.itemValueMinor <= 0) {
    return {
      isCrossBorder: false,
      deMinimisExempt: true,
      deMinimisLimitMinor: 0,
      customsDutyMinor: 0,
      importVatMinor: 0,
      adminFeeMinor: 0,
      totalEstimatedDutiesMinor: 0,
      effectiveDutyRateBps: 0,
      effectiveVatRateBps: 0,
      currency: 'USD',
    };
  }

  const category = params.categorySlug || 'default';
  const dutyRateBps = CARICOM_CET_RATES[category] ?? CARICOM_CET_RATES.default;
  const vatRateBps = DESTINATION_VAT_RATES[dest] ?? DESTINATION_VAT_RATES.default;
  const deMinimisLimitMinor = DE_MINIMIS_LIMITS_USD_MINOR[dest] ?? DE_MINIMIS_LIMITS_USD_MINOR.default;

  // Check de minimis threshold for small personal parcels
  const isExempt = params.itemValueMinor <= deMinimisLimitMinor || dutyRateBps === 0;

  if (isExempt && dutyRateBps === 0) {
    return {
      isCrossBorder: true,
      deMinimisExempt: true,
      deMinimisLimitMinor,
      customsDutyMinor: 0,
      importVatMinor: 0,
      adminFeeMinor: 0,
      totalEstimatedDutiesMinor: 0,
      effectiveDutyRateBps: 0,
      effectiveVatRateBps: 0,
      currency: 'USD',
    };
  }

  if (isExempt) {
    return {
      isCrossBorder: true,
      deMinimisExempt: true,
      deMinimisLimitMinor,
      customsDutyMinor: 0,
      importVatMinor: 0,
      adminFeeMinor: 250, // $2.50 flat clearance handling
      totalEstimatedDutiesMinor: 250,
      effectiveDutyRateBps: 0,
      effectiveVatRateBps: 0,
      currency: 'USD',
    };
  }

  // CIF Value = Cost (item value) + Insurance & Freight (shipping)
  const shippingMinor = params.shippingMinor ?? 1500;
  const cifValueMinor = params.itemValueMinor + shippingMinor;

  const customsDutyMinor = Math.round((cifValueMinor * dutyRateBps) / 10000);
  const vatBaseMinor = cifValueMinor + customsDutyMinor;
  const importVatMinor = Math.round((vatBaseMinor * vatRateBps) / 10000);
  const adminFeeMinor = 500; // $5.00 regional customs electronic declaration fee

  const totalEstimatedDutiesMinor = customsDutyMinor + importVatMinor + adminFeeMinor;

  return {
    isCrossBorder: true,
    deMinimisExempt: false,
    deMinimisLimitMinor,
    customsDutyMinor,
    importVatMinor,
    adminFeeMinor,
    totalEstimatedDutiesMinor,
    effectiveDutyRateBps: dutyRateBps,
    effectiveVatRateBps: vatRateBps,
    currency: 'USD',
  };
}

