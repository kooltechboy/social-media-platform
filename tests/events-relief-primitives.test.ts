import { describe, it, expect } from 'vitest';
import {
  validateRSVPTransition,
  canUserAccessEvent,
  formatEventDateTime,
  isEventLive,
} from '../apps/web/src/lib/events/types';
import type {
  EventKind,
  EventPrivacy,
  RSVPStatus,
  LiveEventItem,
  EventAttendee,
  CreateEventInput,
  UpdateEventInput,
} from '../apps/web/src/lib/events/types';
import {
  RELIEF_CATEGORY_METADATA,
  calculateCampaignProgress,
  formatDonationAmount,
  validateDonationAmount,
  isDisasterDeclarationVerified,
} from '../apps/web/src/lib/relief/types';
import type {
  ReliefCategory,
  ReliefVerificationStatus,
  DisbursementStatus,
  ReliefCampaign,
  ReliefDonation,
  CreateReliefCampaignInput,
  DonateToReliefInput,
} from '../apps/web/src/lib/relief/types';

describe('Task 2: Events & Community Relief Domain Primitives & Types', () => {
  describe('1. Events Domain Primitives & Enums', () => {
    it('supports all valid event kinds and privacy levels in type signatures', () => {
      const kind: EventKind = 'in_person';
      const privacy: EventPrivacy = 'community_only';
      const status: RSVPStatus = 'going';
      expect(kind).toBe('in_person');
      expect(privacy).toBe('community_only');
      expect(status).toBe('going');
    });

    describe('validateRSVPTransition', () => {
      it('allows joining (going or interested) when current status is null', () => {
        expect(validateRSVPTransition(null, 'going')).toBe(true);
        expect(validateRSVPTransition(null, 'interested')).toBe(true);
      });

      it('rejects cancelling when current status is null', () => {
        expect(validateRSVPTransition(null, 'cancelled')).toBe(false);
      });

      it('allows changing status between going, interested, and cancelled', () => {
        expect(validateRSVPTransition('going', 'interested')).toBe(true);
        expect(validateRSVPTransition('going', 'cancelled')).toBe(true);
        expect(validateRSVPTransition('interested', 'going')).toBe(true);
        expect(validateRSVPTransition('interested', 'cancelled')).toBe(true);
        expect(validateRSVPTransition('cancelled', 'going')).toBe(true);
        expect(validateRSVPTransition('cancelled', 'interested')).toBe(true);
      });

      it('rejects redundant self-transitions', () => {
        expect(validateRSVPTransition('going', 'going')).toBe(false);
        expect(validateRSVPTransition('interested', 'interested')).toBe(false);
        expect(validateRSVPTransition('cancelled', 'cancelled')).toBe(false);
      });
    });

    describe('canUserAccessEvent', () => {
      it('allows public event access to anyone, including anonymous/unauthenticated users', () => {
        const publicEvent = { privacy: 'public' as EventPrivacy, host_id: 'host-1', community_id: null };
        expect(canUserAccessEvent(publicEvent, null)).toBe(true);
        expect(canUserAccessEvent(publicEvent, { id: 'user-guest' })).toBe(true);
      });

      it('restricts community_only events to authenticated community members or the host', () => {
        const communityEvent = {
          privacy: 'community_only' as EventPrivacy,
          host_id: 'host-1',
          community_id: 'comm-caribbean-tech',
        };

        // Unauthenticated guest rejected
        expect(canUserAccessEvent(communityEvent, null)).toBe(false);

        // Host always allowed
        expect(canUserAccessEvent(communityEvent, { id: 'host-1', communityIds: [] })).toBe(true);

        // Member of the community allowed
        expect(
          canUserAccessEvent(communityEvent, {
            id: 'user-member',
            communityIds: ['comm-caribbean-tech', 'comm-music'],
          })
        ).toBe(true);

        // Non-member rejected
        expect(
          canUserAccessEvent(communityEvent, {
            id: 'user-outsider',
            communityIds: ['comm-food'],
          })
        ).toBe(false);
      });

      it('restricts invite_only events to invited guests or the host', () => {
        const privateEvent = {
          id: 'event-vip-gala',
          privacy: 'invite_only' as EventPrivacy,
          host_id: 'host-vip',
          community_id: null,
        };

        // Unauthenticated guest rejected
        expect(canUserAccessEvent(privateEvent, null)).toBe(false);

        // Host allowed
        expect(canUserAccessEvent(privateEvent, { id: 'host-vip' })).toBe(true);

        // Invited guest allowed
        expect(
          canUserAccessEvent(privateEvent, {
            id: 'guest-1',
            invitedEventIds: ['event-vip-gala'],
          })
        ).toBe(true);

        // Uninvited guest rejected
        expect(
          canUserAccessEvent(privateEvent, {
            id: 'guest-uninvited',
            invitedEventIds: ['event-other'],
          })
        ).toBe(false);
      });
    });

    describe('formatEventDateTime', () => {
      it('formats ISO timestamp into readable date and time string', () => {
        const iso = '2026-10-15T18:30:00.000Z';
        const formatted = formatEventDateTime(iso, 'en-US');
        expect(formatted).toBeTruthy();
        expect(typeof formatted).toBe('string');
        expect(formatted).toContain('2026');
        expect(formatted).toContain('Oct');
      });
    });

    describe('isEventLive', () => {
      it('identifies currently live events within time window', () => {
        const now = new Date('2026-10-15T19:00:00.000Z').getTime();
        const startsAt = '2026-10-15T18:00:00.000Z';
        const endsAt = '2026-10-15T21:00:00.000Z';

        expect(isEventLive(startsAt, endsAt, now)).toBe(true);
      });

      it('returns false for events that have not started yet', () => {
        const now = new Date('2026-10-15T17:00:00.000Z').getTime();
        const startsAt = '2026-10-15T18:00:00.000Z';
        const endsAt = '2026-10-15T21:00:00.000Z';

        expect(isEventLive(startsAt, endsAt, now)).toBe(false);
      });

      it('returns false for events that have concluded', () => {
        const now = new Date('2026-10-15T22:00:00.000Z').getTime();
        const startsAt = '2026-10-15T18:00:00.000Z';
        const endsAt = '2026-10-15T21:00:00.000Z';

        expect(isEventLive(startsAt, endsAt, now)).toBe(false);
      });

      it('handles events without an explicit endsAt using reasonable default window', () => {
        const now = new Date('2026-10-15T19:00:00.000Z').getTime();
        const startsAt = '2026-10-15T18:30:00.000Z'; // started 30 min ago

        expect(isEventLive(startsAt, null, now)).toBe(true);

        const longPastNow = new Date('2026-10-16T18:30:00.000Z').getTime(); // 24 hours later
        expect(isEventLive(startsAt, null, longPastNow)).toBe(false);
      });
    });

    it('validates LiveEventItem and EventAttendee interface contracts', () => {
      const attendee: EventAttendee = {
        event_id: 'event-101',
        profile_id: 'user-202',
        rsvp_status: 'going',
        guest_count: 2,
        check_in_code: 'EVT-789XYZ',
        checked_in: false,
        checked_in_at: null,
        joined_at: new Date().toISOString(),
      };
      expect(attendee.guest_count).toBe(2);

      const item: LiveEventItem = {
        id: 'event-101',
        title: 'Kingston Tech Summit 2026',
        description: 'Caribbean innovation conference',
        event_kind: 'hybrid',
        privacy: 'public',
        venue: 'Jamaica Pegasus Hotel',
        starts_at: '2026-11-01T09:00:00Z',
        capacity: 300,
        cities: { name: 'Kingston', country_iso: 'JAM' },
        event_attendees: [attendee],
      };
      expect(item.event_kind).toBe('hybrid');
    });
  });

  describe('2. Relief Domain Primitives, Categories & Helpers', () => {
    it('defines RELIEF_CATEGORY_METADATA for all 6 Caribbean disaster/mutual-aid categories', () => {
      const categories: ReliefCategory[] = [
        'hurricane_relief',
        'flood_disaster',
        'medical_aid',
        'community_rebuild',
        'education',
        'cultural_heritage',
      ];

      for (const cat of categories) {
        const meta = RELIEF_CATEGORY_METADATA[cat];
        expect(meta).toBeDefined();
        expect(meta.title).toBeTruthy();
        expect(meta.description).toBeTruthy();
        expect(meta.icon).toBeTruthy();
        expect(meta.protocol).toBeTruthy();
      }
    });

    it('maps categories to official regional disaster agency protocols', () => {
      expect(RELIEF_CATEGORY_METADATA.hurricane_relief.protocol).toContain('CDEMA');
      expect(RELIEF_CATEGORY_METADATA.flood_disaster.protocol).toContain('ODPEM');
      expect(RELIEF_CATEGORY_METADATA.medical_aid.protocol).toContain('CARPHA');
      expect(RELIEF_CATEGORY_METADATA.community_rebuild.protocol).toContain('NEMO');
    });

    describe('calculateCampaignProgress', () => {
      it('calculates integer percentage accurately', () => {
        expect(calculateCampaignProgress(0, 100000)).toBe(0);
        expect(calculateCampaignProgress(50000, 100000)).toBe(50);
        expect(calculateCampaignProgress(100000, 100000)).toBe(100);
      });

      it('supports campaigns that exceed their goal (100%+)', () => {
        expect(calculateCampaignProgress(150000, 100000)).toBe(150);
      });

      it('safely handles non-positive goals and negative raised values', () => {
        expect(calculateCampaignProgress(1000, 0)).toBe(0);
        expect(calculateCampaignProgress(1000, -500)).toBe(0);
        expect(calculateCampaignProgress(-100, 1000)).toBe(0);
      });
    });

    describe('formatDonationAmount', () => {
      it('formats minor units to localized currency string', () => {
        const formatted = formatDonationAmount(5000, 'USD');
        expect(formatted).toContain('50.00');
        expect(formatted).toContain('$');
      });

      it('formats Caribbean currencies properly', () => {
        const jmd = formatDonationAmount(150000, 'JMD');
        expect(jmd).toBeTruthy();
        expect(jmd).toContain('1,500.00');
      });
    });

    describe('validateDonationAmount', () => {
      it('accepts valid donation amounts', () => {
        expect(validateDonationAmount(100).isValid).toBe(true);
        expect(validateDonationAmount(5000).isValid).toBe(true);
        expect(validateDonationAmount(1000000).isValid).toBe(true);
      });

      it('rejects zero or negative amounts', () => {
        const zeroRes = validateDonationAmount(0);
        expect(zeroRes.isValid).toBe(false);
        expect(zeroRes.error).toBeDefined();

        const negRes = validateDonationAmount(-500);
        expect(negRes.isValid).toBe(false);
      });

      it('rejects amounts below the minimum $1.00 (100 minor units)', () => {
        const lowRes = validateDonationAmount(50);
        expect(lowRes.isValid).toBe(false);
        expect(lowRes.error).toContain('100');
      });

      it('rejects non-integer float values', () => {
        const floatRes = validateDonationAmount(1234.56);
        expect(floatRes.isValid).toBe(false);
      });
    });

    describe('isDisasterDeclarationVerified', () => {
      it('recognizes verified Caribbean disaster agency emergency reference codes', () => {
        expect(isDisasterDeclarationVerified('CDEMA-HURR-2026-BERYL')).toBe(true);
        expect(isDisasterDeclarationVerified('ODPEM-FLOOD-2026-CLARENDON')).toBe(true);
        expect(isDisasterDeclarationVerified('NEMO-REBUILD-SVG-2026')).toBe(true);
        expect(isDisasterDeclarationVerified('CARPHA-MED-EMERGENCY-01')).toBe(true);
      });

      it('rejects unverified, invalid, or empty disaster declarations', () => {
        expect(isDisasterDeclarationVerified(null)).toBe(false);
        expect(isDisasterDeclarationVerified(undefined)).toBe(false);
        expect(isDisasterDeclarationVerified('')).toBe(false);
        expect(isDisasterDeclarationVerified('   ')).toBe(false);
        expect(isDisasterDeclarationVerified('UNOFFICIAL-REF-999')).toBe(false);
        expect(isDisasterDeclarationVerified('RANDOM_TEXT')).toBe(false);
      });
    });

    it('validates ReliefCampaign and ReliefDonation interface contracts', () => {
      const campaign: ReliefCampaign = {
        id: 'camp-1',
        creator_id: 'user-relief-officer',
        community_id: null,
        title: 'St. Elizabeth Flood Recovery Fund',
        description: 'Urgent supplies and shelter repair.',
        category: 'flood_disaster',
        target_country_iso: 'JAM',
        target_city_id: null,
        goal_minor: 5000000,
        raised_minor: 2500000,
        currency: 'USD',
        verification_status: 'verified',
        verified_at: new Date().toISOString(),
        verified_by: 'admin-auditor',
        disaster_declaration_ref: 'ODPEM-FLOOD-2026-004',
        supporting_evidence_urls: ['https://odpem.org.jm/bulletin/2026-004'],
        cover_image_url: 'https://images.tukubi.caribbean/relief-1.jpg',
        disbursement_status: 'verified_ready',
        deadline_at: null,
        is_active: true,
        donations_count: 42,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      expect(campaign.category).toBe('flood_disaster');
      expect(campaign.verification_status).toBe('verified');

      const donation: ReliefDonation = {
        id: 'don-1',
        campaign_id: 'camp-1',
        donor_id: 'donor-101',
        amount_minor: 10000,
        currency: 'USD',
        is_anonymous: false,
        donor_name: 'Marcus Garvey Memorial Org',
        donor_message: 'Standing in solidarity with St. Elizabeth.',
        idempotency_key: 'idem-don-998877',
        created_at: new Date().toISOString(),
      };
      expect(donation.amount_minor).toBe(10000);
    });
  });
});
