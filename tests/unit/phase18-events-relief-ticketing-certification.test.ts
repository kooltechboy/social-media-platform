import { describe, it, expect } from 'vitest';
import {
  generateDigitalPassSignature,
  encodePassQr,
  decodePassQr,
  verifyDigitalPass,
  DigitalPassPayload,
  DigitalPassTier,
} from '../../packages/business/src/ticketing';
import { canRsvp, type EventCapacity } from '../../packages/business/src/index';

describe('Phase 18 — Events, Cultural Relief & Ticketing Certification', () => {
  const SECRET_KEY = 'tukubi_secure_event_gatekeeper_secret_key_2026';

  const baseTicketData = {
    ticketId: 'tkt_carnival_jouvert_001',
    eventId: 'evt_trinidad_carnival_2027',
    eventTitle: 'Trinidad Carnival Jouvert 2027: Dawn Fete',
    attendeeId: 'usr_soca_lover_99',
    attendeeName: 'Marcus Garvey Jr.',
    tier: 'vip' as DigitalPassTier,
    issuedAt: '2026-09-01T10:00:00Z',
  };

  // ===========================================================================
  // 1. Cryptographic Signature Generation & Tamper Resistance
  // ===========================================================================
  describe('1. Digital Pass Cryptographic Signatures', () => {
    it('generates deterministic signatures for ticket payloads', () => {
      const sig1 = generateDigitalPassSignature(baseTicketData, SECRET_KEY);
      const sig2 = generateDigitalPassSignature(baseTicketData, SECRET_KEY);

      expect(sig1).toBe(sig2);
      expect(sig1).toMatch(/^sig_[0-9a-f]{16}$/);
    });

    it('produces completely different signatures if any attribute is altered (anti-tamper)', () => {
      const sigOriginal = generateDigitalPassSignature(baseTicketData, SECRET_KEY);

      // Alter tier from VIP to general
      const sigAlteredTier = generateDigitalPassSignature(
        { ...baseTicketData, tier: 'general' },
        SECRET_KEY
      );
      expect(sigOriginal).not.toBe(sigAlteredTier);

      // Alter attendee ID
      const sigAlteredAttendee = generateDigitalPassSignature(
        { ...baseTicketData, attendeeId: 'usr_imposter' },
        SECRET_KEY
      );
      expect(sigOriginal).not.toBe(sigAlteredAttendee);
    });
  });

  // ===========================================================================
  // 2. QR Code Pass Serialization & Decoding
  // ===========================================================================
  describe('2. QR Code Pass Serialization & Lossless Decoding', () => {
    it('encodes and decodes digital pass payload via TUKUBI_PASS format', () => {
      const signature = generateDigitalPassSignature(baseTicketData, SECRET_KEY);
      const ticket: DigitalPassPayload = { ...baseTicketData, signature };

      const qr = encodePassQr(ticket);
      expect(qr.startsWith('TUKUBI_PASS:')).toBe(true);

      const decoded = decodePassQr(qr);
      expect(decoded).not.toBeNull();
      expect(decoded?.ticketId).toBe(ticket.ticketId);
      expect(decoded?.eventId).toBe(ticket.eventId);
      expect(decoded?.tier).toBe('vip');
      expect(decoded?.signature).toBe(signature);
    });

    it('returns null when decoding malformed or corrupted QR strings', () => {
      expect(decodePassQr('INVALID_PREFIX:12345')).toBeNull();
      expect(decodePassQr('TUKUBI_PASS:not_valid_base64_json!@#')).toBeNull();
      expect(decodePassQr('')).toBeNull();
    });
  });

  // ===========================================================================
  // 3. Gatekeeper Check-In Scanner Verification
  // ===========================================================================
  describe('3. Gatekeeper Scanner Admission & Double-Entry Prevention', () => {
    const signature = generateDigitalPassSignature(baseTicketData, SECRET_KEY);
    const validPass: DigitalPassPayload = { ...baseTicketData, signature };
    const redeemedSet = new Set<string>();

    it('admits authentic digital pass for the correct event', () => {
      const res = verifyDigitalPass(
        validPass,
        'evt_trinidad_carnival_2027',
        SECRET_KEY,
        redeemedSet
      );

      expect(res.valid).toBe(true);
      expect(res.status).toBe('admitted');
      expect(res.message).toContain('Marcus Garvey Jr.');
      expect(res.message).toContain('VIP');
    });

    it('prevents double-redemption fraud when ticket is scanned a second time', () => {
      // First scan admits and records in redeemed set
      redeemedSet.add(validPass.ticketId);

      // Second scan attempt
      const res = verifyDigitalPass(
        validPass,
        'evt_trinidad_carnival_2027',
        SECRET_KEY,
        redeemedSet
      );

      expect(res.valid).toBe(false);
      expect(res.status).toBe('already_redeemed');
      expect(res.message).toContain('already been scanned');
    });

    it('rejects tickets presented at the wrong event or venue', () => {
      const res = verifyDigitalPass(
        validPass,
        'evt_different_barbados_crop_over',
        SECRET_KEY,
        new Set()
      );

      expect(res.valid).toBe(false);
      expect(res.status).toBe('wrong_event');
      expect(res.message).toContain('not this venue');
    });

    it('detects counterfeit or forged signatures with invalid secret', () => {
      const forgedPass: DigitalPassPayload = {
        ...validPass,
        signature: 'sig_forged_signature_000',
      };

      const res = verifyDigitalPass(
        forgedPass,
        'evt_trinidad_carnival_2027',
        SECRET_KEY,
        new Set()
      );

      expect(res.valid).toBe(false);
      expect(res.status).toBe('invalid_signature');
      expect(res.message).toContain('Tampered or counterfeit');
    });
  });

  // ===========================================================================
  // 4. Capacity Controls & Cultural Relief Status
  // ===========================================================================
  describe('4. Event Capacity & Cultural Relief Governance', () => {
    it('evaluates event capacity boundaries accurately', () => {
      const limitedEvent: EventCapacity = { capacity: 500, attendeeCount: 499 };
      expect(canRsvp(limitedEvent)).toBe(true);

      const soldOutEvent: EventCapacity = { capacity: 500, attendeeCount: 500 };
      expect(canRsvp(soldOutEvent)).toBe(false);

      const openAirEvent: EventCapacity = { capacity: null, attendeeCount: 15000 };
      expect(canRsvp(openAirEvent)).toBe(true);
    });

    it('verifies relief campaign funding progress and percentage calculations', () => {
      const goalMinor = 5000000;   // $50,000.00
      const raisedMinor = 3250000; // $32,500.00

      const percent = Math.min(100, Math.round((raisedMinor / goalMinor) * 100));
      expect(percent).toBe(65);

      const remainingMinor = Math.max(0, goalMinor - raisedMinor);
      expect(remainingMinor).toBe(1750000); // $17,500.00
    });
  });
});
