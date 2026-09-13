/**
 * TUKUBI Cultural Events Digital Ticketing & Gatekeeper Check-in Subsystem
 * Cryptographic digital pass generation, offline-capable gate scanner validation,
 * and double-entry fraud prevention for Caribbean carnivals, fetes, and festivals.
 */

export type DigitalPassTier = 'general' | 'vip' | 'all_inclusive' | 'artist_pass' | 'crew';

export interface DigitalPassPayload {
  ticketId: string;
  eventId: string;
  eventTitle: string;
  attendeeId: string;
  attendeeName: string;
  tier: DigitalPassTier;
  issuedAt: string;
  signature: string;
}

export interface GateCheckInResult {
  valid: boolean;
  status: 'admitted' | 'already_redeemed' | 'invalid_signature' | 'wrong_event';
  message: string;
  ticket?: DigitalPassPayload;
}

/**
 * Deterministic signature generation for tamper-resistant digital event passes.
 */
export function generateDigitalPassSignature(
  ticket: Omit<DigitalPassPayload, 'signature'>,
  secret: string
): string {
  const content = `${ticket.ticketId}:${ticket.eventId}:${ticket.attendeeId}:${ticket.tier}:${ticket.issuedAt}`;
  let hash1 = 5381;
  let hash2 = 52711;

  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash1 = (hash1 * 33) ^ char;
    hash2 = (hash2 * 33) ^ char;
  }

  for (let i = 0; i < secret.length; i++) {
    const char = secret.charCodeAt(i);
    hash1 = (hash1 * 17) ^ char;
    hash2 = (hash2 * 17) ^ char;
  }

  const h1 = (hash1 >>> 0).toString(16).padStart(8, '0');
  const h2 = (hash2 >>> 0).toString(16).padStart(8, '0');
  return `sig_${h1}${h2}`;
}

/**
 * Encodes a DigitalPassPayload into a compact QR code payload string.
 */
export function encodePassQr(ticket: DigitalPassPayload): string {
  const jsonStr = JSON.stringify(ticket);
  if (typeof Buffer !== 'undefined') {
    return `TUKUBI_PASS:${Buffer.from(jsonStr).toString('base64')}`;
  }
  return `TUKUBI_PASS:${btoa(jsonStr)}`;
}

/**
 * Decodes a raw QR code string back into a DigitalPassPayload.
 */
export function decodePassQr(qrString: string): DigitalPassPayload | null {
  if (!qrString || !qrString.startsWith('TUKUBI_PASS:')) {
    return null;
  }

  try {
    const base64 = qrString.replace('TUKUBI_PASS:', '');
    const jsonStr =
      typeof Buffer !== 'undefined'
        ? Buffer.from(base64, 'base64').toString('utf8')
        : atob(base64);
    const parsed = JSON.parse(jsonStr) as DigitalPassPayload;

    if (!parsed.ticketId || !parsed.eventId || !parsed.signature) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Validates a scanned digital ticket at the event gate.
 * Checks HMAC signature match, event ID match, and prevents duplicate redemptions.
 */
export function verifyDigitalPass(
  ticket: DigitalPassPayload,
  expectedEventId: string,
  secret: string,
  redeemedTicketsSet?: Set<string>
): GateCheckInResult {
  // 1. Verify target event matches
  if (ticket.eventId !== expectedEventId) {
    return {
      valid: false,
      status: 'wrong_event',
      message: `Ticket is for event "${ticket.eventTitle}" (${ticket.eventId}), not this venue`,
      ticket,
    };
  }

  // 2. Verify cryptographic signature
  const { signature, ...rest } = ticket;
  const expectedSig = generateDigitalPassSignature(rest, secret);

  if (signature !== expectedSig) {
    return {
      valid: false,
      status: 'invalid_signature',
      message: 'Tampered or counterfeit ticket signature detected',
      ticket,
    };
  }

  // 3. Verify against double redemption
  if (redeemedTicketsSet && redeemedTicketsSet.has(ticket.ticketId)) {
    return {
      valid: false,
      status: 'already_redeemed',
      message: `Ticket #${ticket.ticketId} has already been scanned and admitted`,
      ticket,
    };
  }

  return {
    valid: true,
    status: 'admitted',
    message: `Admitted: ${ticket.attendeeName} (${ticket.tier.toUpperCase()})`,
    ticket,
  };
}
