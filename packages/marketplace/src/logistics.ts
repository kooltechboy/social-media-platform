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
