import { describe, it, expect } from 'vitest';
import {
  createInterIslandShipment,
  advanceShipmentMilestone,
  estimateInterIslandTransitHours,
  SHIPMENT_STATUS_METADATA,
} from '../../packages/marketplace/src';
import {
  evaluateContentAccess,
  minimumTierForAccessLevel,
  TIER_HIERARCHY,
} from '../../packages/creator/src';
import {
  generateDigitalPassSignature,
  encodePassQr,
  decodePassQr,
  verifyDigitalPass,
  type DigitalPassPayload,
} from '../../packages/business/src';

describe('Phase 6: Inter-Island Logistics & Shipping (@caribbean/marketplace)', () => {
  it('correctly calculates transit hours for domestic vs cross-island routes', () => {
    // Domestic same island
    expect(estimateInterIslandTransitHours('Barbados', 'Barbados', 'local_island_dispatch')).toBe(12);

    // Twin island state (Trinidad <-> Tobago)
    expect(estimateInterIslandTransitHours('Trinidad', 'Tobago', 'air_cargo')).toBe(4);
    expect(estimateInterIslandTransitHours('Trinidad', 'Tobago', 'inter_island_ferry')).toBe(8);

    // Cross-border regional Caribbean transit
    expect(estimateInterIslandTransitHours('Jamaica', 'Barbados', 'air_cargo')).toBe(24);
    expect(estimateInterIslandTransitHours('Saint Lucia', 'Martinique', 'inter_island_ferry')).toBe(36);
    expect(estimateInterIslandTransitHours('Guyana', 'Dominican Republic', 'maritime_freight')).toBe(72);
  });

  it('creates an inter-island shipment with starting milestone and customs calculation', () => {
    const fixedNow = new Date('2026-09-15T12:00:00.000Z');
    const shipment = createInterIslandShipment({
      orderId: 'ord-carib-101',
      carrierName: 'Caribbean Maritime Ferry & Freight',
      trackingNumber: 'CMF-789012',
      originIsland: 'Trinidad',
      destinationIsland: 'Barbados',
      transitMode: 'maritime_freight',
      now: fixedNow,
    });

    expect(shipment.id).toBe('ship_cmf-789012');
    expect(shipment.currentStatus).toBe('order_placed');
    expect(shipment.isCustomsRequired).toBe(true);
    expect(shipment.milestones.length).toBe(1);
    expect(shipment.milestones[0].status).toBe('order_placed');
    expect(shipment.milestones[0].location).toContain('Trinidad');
  });

  it('advances shipment milestones and updates status cleanly', () => {
    const shipment = createInterIslandShipment({
      orderId: 'ord-carib-102',
      carrierName: 'Caribbean Airlines Cargo',
      trackingNumber: 'CAL-334455',
      originIsland: 'Jamaica',
      destinationIsland: 'Cayman Islands',
      transitMode: 'air_cargo',
    });

    const inTransit = advanceShipmentMilestone(shipment, 'inter_island_transit', {
      location: 'Norman Manley International Airport (KIN)',
      description: 'Flight BW414 departed KIN destined for GCM.',
      vesselOrFlight: 'BW414',
    });

    expect(inTransit.currentStatus).toBe('inter_island_transit');
    expect(inTransit.milestones.length).toBe(2);
    expect(inTransit.milestones[1].vesselOrFlight).toBe('BW414');

    const customs = advanceShipmentMilestone(inTransit, 'customs_cleared', {
      location: 'Owen Roberts International Airport (GCM)',
      description: 'Cayman Islands customs clearance completed.',
    });

    expect(customs.currentStatus).toBe('customs_cleared');
    expect(customs.milestones.length).toBe(3);
  });

  it('provides comprehensive progress metadata for all statuses', () => {
    expect(SHIPMENT_STATUS_METADATA.order_placed.progressPercent).toBe(15);
    expect(SHIPMENT_STATUS_METADATA.inter_island_transit.progressPercent).toBe(65);
    expect(SHIPMENT_STATUS_METADATA.delivered.progressPercent).toBe(100);
  });
});

describe('Phase 7: Creator Paid Subscriptions & Content Gating (@caribbean/creator)', () => {
  it('allows creator full owner access regardless of required level', () => {
    const result = evaluateContentAccess(
      {
        userId: 'creator-1',
        creatorId: 'creator-1',
        isOwner: true,
        isFollower: false,
        isSubscriber: false,
      },
      'subscriber_pro'
    );
    expect(result.granted).toBe(true);
  });

  it('allows public content to all users including unauthenticated guests', () => {
    const result = evaluateContentAccess(
      {
        userId: null,
        creatorId: 'creator-2',
        isOwner: false,
        isFollower: false,
        isSubscriber: false,
      },
      'public'
    );
    expect(result.granted).toBe(true);
  });

  it('enforces follower check for followers_only content', () => {
    const nonFollower = evaluateContentAccess(
      {
        userId: 'user-guest',
        creatorId: 'creator-3',
        isOwner: false,
        isFollower: false,
        isSubscriber: false,
      },
      'followers_only'
    );
    expect(nonFollower.granted).toBe(false);
    expect(nonFollower.reason).toContain('Follow this Caribbean creator');

    const follower = evaluateContentAccess(
      {
        userId: 'user-fan',
        creatorId: 'creator-3',
        isOwner: false,
        isFollower: true,
        isSubscriber: false,
      },
      'followers_only'
    );
    expect(follower.granted).toBe(true);
  });

  it('enforces subscription tier hierarchy for gated subscriber media', () => {
    // Non-subscriber attempting to view subscriber_plus
    const nonSub = evaluateContentAccess(
      {
        userId: 'user-10',
        creatorId: 'creator-4',
        isOwner: false,
        isFollower: true,
        isSubscriber: false,
      },
      'subscriber_plus'
    );
    expect(nonSub.granted).toBe(false);
    expect(nonSub.requiredTier).toBe('plus');

    // Basic tier subscriber trying to view Plus content (insufficient tier)
    const basicSub = evaluateContentAccess(
      {
        userId: 'user-11',
        creatorId: 'creator-4',
        isOwner: false,
        isFollower: true,
        isSubscriber: true,
        subscriberTier: 'basic',
      },
      'subscriber_plus'
    );
    expect(basicSub.granted).toBe(false);
    expect(basicSub.reason).toContain('Upgrade to PLUS');

    // Pro tier subscriber viewing Plus content (higher tier satisfies requirement)
    const proSub = evaluateContentAccess(
      {
        userId: 'user-12',
        creatorId: 'creator-4',
        isOwner: false,
        isFollower: true,
        isSubscriber: true,
        subscriberTier: 'pro',
      },
      'subscriber_plus'
    );
    expect(proSub.granted).toBe(true);
  });
});

describe('Phase 8: Cultural Events Digital Ticketing (@caribbean/business)', () => {
  const secretKey = 'caribbean_carnival_master_secret_2026';
  const sampleTicket: Omit<DigitalPassPayload, 'signature'> = {
    ticketId: 'tkt-soca-405',
    eventId: 'event-trinidad-carnival-2027',
    eventTitle: 'Soca Monarch Finals',
    attendeeId: 'user-attendee-1',
    attendeeName: 'Marcus Garvey Jr.',
    tier: 'vip',
    issuedAt: '2026-09-13T18:00:00.000Z',
  };

  it('generates consistent HMAC digital pass signatures and verifies valid tickets', () => {
    const sig = generateDigitalPassSignature(sampleTicket, secretKey);
    expect(sig).toMatch(/^sig_[0-9a-f]{16}$/);

    const signedTicket: DigitalPassPayload = { ...sampleTicket, signature: sig };
    const result = verifyDigitalPass(
      signedTicket,
      'event-trinidad-carnival-2027',
      secretKey
    );

    expect(result.valid).toBe(true);
    expect(result.status).toBe('admitted');
    expect(result.message).toContain('Admitted: Marcus Garvey Jr. (VIP)');
  });

  it('rejects counterfeit or tampered ticket signatures', () => {
    const signedTicket: DigitalPassPayload = {
      ...sampleTicket,
      signature: 'sig_counterfeit12345',
    };
    const result = verifyDigitalPass(
      signedTicket,
      'event-trinidad-carnival-2027',
      secretKey
    );

    expect(result.valid).toBe(false);
    expect(result.status).toBe('invalid_signature');
    expect(result.message).toContain('counterfeit');
  });

  it('rejects tickets presented at the wrong event venue', () => {
    const sig = generateDigitalPassSignature(sampleTicket, secretKey);
    const signedTicket: DigitalPassPayload = { ...sampleTicket, signature: sig };

    const result = verifyDigitalPass(
      signedTicket,
      'event-reggae-sumfest-2027', // Wrong event ID
      secretKey
    );

    expect(result.valid).toBe(false);
    expect(result.status).toBe('wrong_event');
  });

  it('prevents double-spending redemption at gate scanners', () => {
    const sig = generateDigitalPassSignature(sampleTicket, secretKey);
    const signedTicket: DigitalPassPayload = { ...sampleTicket, signature: sig };
    const redeemedSet = new Set<string>(['tkt-soca-405']);

    const result = verifyDigitalPass(
      signedTicket,
      'event-trinidad-carnival-2027',
      secretKey,
      redeemedSet
    );

    expect(result.valid).toBe(false);
    expect(result.status).toBe('already_redeemed');
    expect(result.message).toContain('already been scanned');
  });

  it('encodes and decodes QR payload cleanly', () => {
    const sig = generateDigitalPassSignature(sampleTicket, secretKey);
    const signedTicket: DigitalPassPayload = { ...sampleTicket, signature: sig };

    const qrPayload = encodePassQr(signedTicket);
    expect(qrPayload.startsWith('TUKUBI_PASS:')).toBe(true);

    const decoded = decodePassQr(qrPayload);

    expect(decoded).not.toBeNull();
    expect(decoded?.ticketId).toBe(signedTicket.ticketId);
    expect(decoded?.attendeeName).toBe(signedTicket.attendeeName);
    expect(decoded?.signature).toBe(signedTicket.signature);
  });
});
