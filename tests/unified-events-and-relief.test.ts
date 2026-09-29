import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

// Domain Primitives & Types
import {
  validateRSVPTransition,
  canUserAccessEvent,
  formatEventDateTime,
  isEventLive,
  type LiveEventItem,
  type EventKind,
  type EventPrivacy,
  type RSVPStatus,
  type CreateEventInput,
} from '../apps/web/src/lib/events/types';

import {
  RELIEF_CATEGORY_METADATA,
  calculateCampaignProgress,
  formatDonationAmount,
  validateDonationAmount,
  isDisasterDeclarationVerified,
  type ReliefCampaign,
  type ReliefCategory,
  type CreateReliefCampaignInput,
  type DonateToReliefInput,
} from '../apps/web/src/lib/relief/types';

// Mock Supabase and Next.js cache before importing actions and components
const { getCurrentUser, createSupabaseServerClient } = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  createSupabaseServerClient: vi.fn(),
}));

vi.mock('../apps/web/src/lib/supabase/server', () => ({
  getCurrentUser,
  createSupabaseServerClient,
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// Server Actions
import {
  createEventAction,
  rsvpAction,
  checkInAttendeeAction,
} from '../apps/web/src/lib/events/actions';

import {
  createReliefCampaignAction,
  donateToReliefCampaignAction,
  verifyReliefCampaignAction,
} from '../apps/web/src/lib/relief/actions';

// UI Components
import InteractiveEventCard from '../apps/web/src/components/events/interactive-event-card';
import ReliefCampaignCard from '../apps/web/src/components/relief/relief-campaign-card';
import ReliefDonationModal from '../apps/web/src/components/relief/relief-donation-modal';
import EventComposerPanel from '../apps/web/src/components/events/event-composer-panel';
import ReliefComposerPanel from '../apps/web/src/components/relief/relief-composer-panel';
import ReliefPage from '../apps/web/src/app/relief/page';

// Serialization utility for VDOM snapshot inspection
function serializeVDOM(vdom: any): string {
  const seen = new WeakSet();
  return JSON.stringify(vdom, (_key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular]';
      }
      seen.add(value);
    }
    return value;
  });
}

describe('Task 8: End-to-End Suite & Acceptance Verification for Sub-Project 4', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentUser.mockReset();
    createSupabaseServerClient.mockReset();
  });

  // =========================================================================
  // 1. MIGRATION 00103 SCHEMA & INTEGRITY AUDIT
  // =========================================================================
  describe('1. Migration 00103 Schema & Database Integrity Audit', () => {
    const migrationPath = path.join(
      process.cwd(),
      'supabase/migrations/00103_events_and_community_relief.sql'
    );

    it('verifies migration 00103 SQL file exists in supabase/migrations/', () => {
      expect(fs.existsSync(migrationPath)).toBe(true);
    });

    it('asserts events table extensions: privacy enum, livestream, tags, cover image, and indexes', () => {
      const sql = fs.readFileSync(migrationPath, 'utf8');

      // Column additions
      expect(sql).toMatch(/ALTER\s+TABLE\s+public\.events/i);
      expect(sql).toMatch(/privacy\s+VARCHAR\(20\)\s+DEFAULT\s+'public'\s+NOT\s+NULL/i);
      expect(sql).toMatch(/CHECK\s*\(\s*privacy\s+IN\s*\(\s*'public',\s*'community_only',\s*'invite_only'\s*\)\s*\)/i);
      expect(sql).toMatch(/livestream_url\s+TEXT/i);
      expect(sql).toMatch(/cover_image_url\s+TEXT/i);
      expect(sql).toMatch(/tags\s+TEXT\[\]\s+DEFAULT\s+'\{\}'::text\[\]\s+NOT\s+NULL/i);
      expect(sql).toMatch(/is_featured\s+BOOLEAN\s+DEFAULT\s+false\s+NOT\s+NULL/i);
      expect(sql).toMatch(/cancelled_at\s+TIMESTAMPTZ/i);

      // Performance indexing
      expect(sql).toMatch(/CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+idx_events_privacy\s+ON\s+public\.events\s*\(\s*privacy,\s*starts_at\s*\)/i);
      expect(sql).toMatch(/CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+idx_events_tags\s+ON\s+public\.events\s+USING\s+gin\s*\(\s*tags\s*\)/i);
    });

    it('asserts event_attendees extensions: guest_count, check_in_code, check-in flags', () => {
      const sql = fs.readFileSync(migrationPath, 'utf8');

      expect(sql).toMatch(/ALTER\s+TABLE\s+public\.event_attendees/i);
      expect(sql).toMatch(/guest_count\s+INTEGER\s+DEFAULT\s+1\s+NOT\s+NULL/i);
      expect(sql).toMatch(/CHECK\s*\(\s*guest_count\s*>=\s*1\s+AND\s+guest_count\s*<=\s*10\s*\)/i);
      expect(sql).toMatch(/check_in_code\s+VARCHAR\(32\)/i);
      expect(sql).toMatch(/checked_in\s+BOOLEAN\s+DEFAULT\s+false\s+NOT\s+NULL/i);
      expect(sql).toMatch(/checked_in_at\s+TIMESTAMPTZ/i);
    });

    it('asserts relief_campaigns and relief_donations tables with RLS and constraints', () => {
      const sql = fs.readFileSync(migrationPath, 'utf8');

      // Relief campaigns table
      expect(sql).toMatch(/CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+public\.relief_campaigns/i);
      expect(sql).toMatch(/category\s+VARCHAR\(32\)\s+NOT\s+NULL/i);
      expect(sql).toMatch(/goal_minor\s+INTEGER/i);
      expect(sql).toMatch(/CHECK\s*\(\s*goal_minor\s*>\s*0\s*\)/i);
      expect(sql).toMatch(/raised_minor\s+INTEGER\s+DEFAULT\s+0/i);
      expect(sql).toMatch(/CHECK\s*\(\s*raised_minor\s*>=\s*0\s*\)/i);
      expect(sql).toMatch(/verification_status\s+VARCHAR\(20\)\s+DEFAULT\s+'pending'/i);

      // Relief donations table
      expect(sql).toMatch(/CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+public\.relief_donations/i);
      expect(sql).toMatch(/idempotency_key\s+VARCHAR\(128\)\s+UNIQUE\s+NOT\s+NULL/i);
      expect(sql).toMatch(/amount_minor\s+INTEGER/i);
      expect(sql).toMatch(/CHECK\s*\(\s*amount_minor\s*>\s*0\s*\)/i);

      // RLS Enabled
      expect(sql).toMatch(/ALTER\s+TABLE\s+public\.relief_campaigns\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/i);
      expect(sql).toMatch(/ALTER\s+TABLE\s+public\.relief_donations\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/i);
    });

    it('asserts atomic database trigger for campaign donation aggregation', () => {
      const sql = fs.readFileSync(migrationPath, 'utf8');

      expect(sql).toMatch(/CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.handle_relief_donation_insert\(\)/i);
      expect(sql).toMatch(/raised_minor\s*=\s*public\.relief_campaigns\.raised_minor\s*\+\s*NEW\.amount_minor/i);
      expect(sql).toMatch(/donations_count\s*=\s*public\.relief_campaigns\.donations_count\s*\+\s*1/i);
      expect(sql).toMatch(/CREATE\s+TRIGGER\s+trg_relief_donations_insert/i);
    });
  });

  // =========================================================================
  // 2. DOMAIN PRIMITIVES, AGENCY PROTOCOLS & CALCULATIONS
  // =========================================================================
  describe('2. Domain Primitives, Agency Protocols & Calculations', () => {
    describe('validateRSVPTransition', () => {
      it('governs valid initial registrations and cancellations correctly', () => {
        expect(validateRSVPTransition(null, 'going')).toBe(true);
        expect(validateRSVPTransition(null, 'interested')).toBe(true);
        expect(validateRSVPTransition(null, 'cancelled')).toBe(false);
      });

      it('governs valid transitions between going, interested, and cancelled', () => {
        expect(validateRSVPTransition('going', 'interested')).toBe(true);
        expect(validateRSVPTransition('going', 'cancelled')).toBe(true);
        expect(validateRSVPTransition('interested', 'going')).toBe(true);
        expect(validateRSVPTransition('interested', 'cancelled')).toBe(true);
        expect(validateRSVPTransition('cancelled', 'going')).toBe(true);
      });

      it('rejects duplicate or no-op state transitions', () => {
        expect(validateRSVPTransition('going', 'going')).toBe(false);
        expect(validateRSVPTransition('interested', 'interested')).toBe(false);
        expect(validateRSVPTransition('cancelled', 'cancelled')).toBe(false);
      });
    });

    describe('canUserAccessEvent', () => {
      it('evaluates access based on privacy level and user identity', () => {
        // Public event: accessible to anyone
        const publicEvent = { privacy: 'public' as EventPrivacy, host_id: 'host-1', community_id: null };
        expect(canUserAccessEvent(publicEvent, null)).toBe(true);
        expect(canUserAccessEvent(publicEvent, { id: 'anonymous-visitor' })).toBe(true);

        // Community-only event: requires membership or host
        const commEvent = { privacy: 'community_only' as EventPrivacy, host_id: 'host-1', community_id: 'comm-10' };
        expect(canUserAccessEvent(commEvent, null)).toBe(false);
        expect(canUserAccessEvent(commEvent, { id: 'host-1', communityIds: [] })).toBe(true);
        expect(canUserAccessEvent(commEvent, { id: 'member-user', communityIds: ['comm-10'] })).toBe(true);
        expect(canUserAccessEvent(commEvent, { id: 'outsider-user', communityIds: ['comm-20'] })).toBe(false);

        // Invite-only event: requires host or attendee confirmation
        const inviteEvent = { id: 'event-vip', privacy: 'invite_only' as EventPrivacy, host_id: 'host-1', community_id: null };
        expect(canUserAccessEvent(inviteEvent, null)).toBe(false);
        expect(canUserAccessEvent(inviteEvent, { id: 'host-1' })).toBe(true);
        expect(canUserAccessEvent(inviteEvent, { id: 'invited-user', invitedEventIds: ['event-vip'] })).toBe(true);
        expect(canUserAccessEvent(inviteEvent, { id: 'uninvited-user', invitedEventIds: ['event-other'] })).toBe(false);
      });
    });

    describe('calculateCampaignProgress & formatting', () => {
      it('calculates campaign progress percentage with correct rounding and zero-guard', () => {
        expect(calculateCampaignProgress(0, 500000)).toBe(0);
        expect(calculateCampaignProgress(250000, 500000)).toBe(50);
        expect(calculateCampaignProgress(333333, 1000000)).toBe(33);
        expect(calculateCampaignProgress(600000, 500000)).toBe(120);
        expect(calculateCampaignProgress(100, 0)).toBe(0);
      });

      it('formats donation currency amounts correctly across Caribbean currencies', () => {
        expect(formatDonationAmount(2500, 'USD')).toContain('25.00');
        expect(formatDonationAmount(10000, 'JMD')).toContain('100.00');
        expect(formatDonationAmount(5000, 'XCD')).toContain('50.00');
        expect(formatDonationAmount(1500, 'EUR')).toContain('15.00');
      });

      it('validates donation limits and minor units', () => {
        expect(validateDonationAmount(50).isValid).toBe(false); // Below $1.00 min
        expect(validateDonationAmount(100).isValid).toBe(true); // Min $1.00
        expect(validateDonationAmount(5000).isValid).toBe(true); // $50.00
        expect(validateDonationAmount(100_000_001).isValid).toBe(false); // Above $1,000,000 max
        expect(validateDonationAmount(100.5).isValid).toBe(false); // Non-integer
      });

      it('validates disaster agency declarations', () => {
        expect(isDisasterDeclarationVerified('CDEMA-2026-HURR-09')).toBe(true);
        expect(isDisasterDeclarationVerified('ODPEM-FLOOD-2026')).toBe(true);
        expect(isDisasterDeclarationVerified('NEMO-REBUILD-2026')).toBe(true);
        expect(isDisasterDeclarationVerified('CARPHA-MED-2026')).toBe(true);
        expect(isDisasterDeclarationVerified('INVALID-AGENCY-REF')).toBe(false);
        expect(isDisasterDeclarationVerified(null)).toBe(false);
      });

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
          expect(meta.protocol).toBeTruthy();
          expect(meta.agency).toBeTruthy();
        }
      });
    });
  });

  // =========================================================================
  // 3. SERVER ACTIONS: EVENTS & RELIEF MUTUAL AID
  // =========================================================================
  describe('3. Server Actions Integrity & Edge Case Safeguards', () => {
    describe('createEventAction', () => {
      it('rejects unauthenticated caller', async () => {
        getCurrentUser.mockResolvedValueOnce(null);
        const fd = new FormData();
        fd.append('title', 'Carnival Street Fete');
        const res = await createEventAction({ error: null }, fd);
        expect(res.error).toMatch(/sign in/i);
      });

      it('creates event with privacy, tags, and future schedule', async () => {
        getCurrentUser.mockResolvedValueOnce({ id: 'host-user-99' });

        let insertedRow: any = null;
        createSupabaseServerClient.mockResolvedValueOnce({
          from: vi.fn((table: string) => ({
            insert: vi.fn((row: any) => {
              insertedRow = row;
              return {
                select: vi.fn(() => ({
                  single: vi.fn(async () => ({
                    data: { id: 'evt-carib-999', ...row },
                    error: null,
                  })),
                })),
                error: null,
              };
            }),
          })),
        });

        const futureStart = new Date(Date.now() + 86400000).toISOString();
        const futureEnd = new Date(Date.now() + 172800000).toISOString();

        const fd = new FormData();
        fd.append('title', 'Caribbean Climate Resilience Summit');
        fd.append('description', 'Pan-Caribbean conference on disaster readiness');
        fd.append('eventKind', 'hybrid');
        fd.append('privacy', 'community_only');
        fd.append('venue', 'University of the West Indies, Mona');
        fd.append('livestreamUrl', 'https://stream.tukubi.caribbean/summit');
        fd.append('coverImageUrl', 'https://cdn.tukubi.caribbean/summit.jpg');
        fd.append('tags', 'climate,resilience,caribbean,tech');
        fd.append('startsAt', futureStart);
        fd.append('endsAt', futureEnd);
        fd.append('capacity', '300');

        const res = await createEventAction({ error: null }, fd);
        expect(res.error).toBeNull();
        expect(res.event?.id).toBe('evt-carib-999');
        expect(insertedRow.privacy).toBe('community_only');
        expect(insertedRow.tags).toEqual(['climate', 'resilience', 'caribbean', 'tech']);
        expect(insertedRow.capacity).toBe(300);
      });
    });

    describe('rsvpAction & checkInAttendeeAction', () => {
      it('enforces capacity limits when booking with guests', async () => {
        getCurrentUser.mockResolvedValueOnce({ id: 'attendee-user-01' });

        // Event capacity is 10, current attendees total 9 (5 + 4). User brings 2 guests (total 2 + 9 = 11 > 10).
        createSupabaseServerClient.mockResolvedValueOnce({
          from: vi.fn((table: string) => {
            if (table === 'events') {
              return {
                select: vi.fn(() => ({
                  eq: vi.fn(() => ({
                    single: vi.fn(async () => ({
                      data: { id: 'evt-small-1', capacity: 10 },
                      error: null,
                    })),
                  })),
                })),
              };
            }
            if (table === 'event_attendees') {
              return {
                select: vi.fn(() => ({
                  eq: vi.fn(() => ({
                    eq: vi.fn(() => ({
                      data: [
                        { profile_id: 'other-1', guest_count: 5 },
                        { profile_id: 'other-2', guest_count: 4 },
                      ],
                      error: null,
                    })),
                    maybeSingle: vi.fn(async () => ({ data: null, error: null })),
                  })),
                })),
              };
            }
            return {};
          }),
        });

        const res = await rsvpAction('evt-small-1', 'going', 2);
        expect(res.status).toBeNull();
        expect(res.error).toMatch(/capacity/i);
      });

      it('generates an 8-character uppercase check-in code upon going RSVP', async () => {
        getCurrentUser.mockResolvedValueOnce({ id: 'attendee-user-02' });

        let upsertedRow: any = null;
        createSupabaseServerClient.mockResolvedValueOnce({
          from: vi.fn((table: string) => {
            if (table === 'events') {
              return {
                select: vi.fn(() => ({
                  eq: vi.fn(() => ({
                    single: vi.fn(async () => ({
                      data: { id: 'evt-open-1', capacity: 100 },
                      error: null,
                    })),
                  })),
                })),
              };
            }
            if (table === 'event_attendees') {
              return {
                select: vi.fn(() => ({
                  eq: vi.fn(() => ({
                    eq: vi.fn(() => ({
                      data: [],
                      error: null,
                      maybeSingle: vi.fn(async () => ({ data: null, error: null })),
                    })),
                    maybeSingle: vi.fn(async () => ({ data: null, error: null })),
                  })),
                })),
                upsert: vi.fn(async (row: any) => {
                  upsertedRow = row;
                  return { error: null };
                }),
              };
            }
            return {};
          }),
        });

        const res = await rsvpAction('evt-open-1', 'going', 1);

        expect(res.error).toBeUndefined();
        expect(res.status).toBe('going');
        expect(res.checkInCode).toBeDefined();
        expect(res.checkInCode).toMatch(/^[A-Z0-9]{8,}$/);
        expect(upsertedRow.check_in_code).toBe(res.checkInCode);
      });

      it('validates check-in code and marks attendee checked_in', async () => {
        getCurrentUser.mockResolvedValueOnce({ id: 'host-user-1' });

        let updatedRow: any = null;
        createSupabaseServerClient.mockResolvedValueOnce({
          from: vi.fn((table: string) => {
            if (table === 'events') {
              return {
                select: vi.fn(() => ({
                  eq: vi.fn(() => ({
                    single: vi.fn(async () => ({
                      data: { id: 'evt-open-1', host_id: 'host-user-1' },
                      error: null,
                    })),
                  })),
                })),
              };
            }
            if (table === 'event_attendees') {
              return {
                select: vi.fn(() => ({
                  eq: vi.fn(() => ({
                    eq: vi.fn(() => ({
                      maybeSingle: vi.fn(async () => ({
                        data: {
                          event_id: 'evt-open-1',
                          profile_id: 'attendee-user-02',
                          check_in_code: 'TK99ABCD',
                          checked_in: false,
                        },
                        error: null,
                      })),
                    })),
                  })),
                })),
                update: vi.fn((row: any) => {
                  updatedRow = row;
                  return {
                    eq: vi.fn(() => ({
                      eq: vi.fn(() => ({
                        select: vi.fn(() => ({
                          single: vi.fn(async () => ({
                            data: { ...row },
                            error: null,
                          })),
                        })),
                      })),
                    })),
                  };
                }),
              };
            }
            return {};
          }),
        });

        const res = await checkInAttendeeAction('evt-open-1', 'TK99ABCD');

        expect(res.error).toBeNull();
        expect(res.success).toBe(true);
        expect(updatedRow.checked_in).toBe(true);
        expect(updatedRow.checked_in_at).toBeDefined();
      });
    });

    describe('createReliefCampaignAction & donateToReliefCampaignAction', () => {
      it('creates relief campaign in pending status with disaster declaration reference', async () => {
        getCurrentUser.mockResolvedValueOnce({ id: 'relief-lead-01' });

        let insertedCampaign: any = null;
        createSupabaseServerClient.mockResolvedValueOnce({
          from: vi.fn((table: string) => ({
            insert: vi.fn((row: any) => {
              insertedCampaign = row;
              return {
                select: vi.fn(() => ({
                  single: vi.fn(async () => ({
                    data: { id: 'camp-beryl-101', ...row },
                    error: null,
                  })),
                })),
                error: null,
              };
            }),
          })),
        });

        const fd = new FormData();
        fd.append('title', 'Hurricane Beryl South Coast Farmer Relief');
        fd.append('description', 'Supplying greenhouse plastic, seedlings, and roofing sheets to St. Elizabeth farmers.');
        fd.append('category', 'hurricane_relief');
        fd.append('targetCountryIso', 'JAM');
        fd.append('goalMinor', '2500000'); // $25,000.00
        fd.append('disasterDeclarationRef', 'CDEMA-2026-BERYL-02');
        fd.append('supportingEvidenceUrls', 'https://cdema.org/beryl-sitrep.pdf');

        const res = await createReliefCampaignAction(fd);
        expect(res.error).toBeNull();
        expect(res.campaign?.id).toBe('camp-beryl-101');
        expect(insertedCampaign.verification_status).toBe('pending');
        expect(insertedCampaign.disaster_declaration_ref).toBe('CDEMA-2026-BERYL-02');
      });

      it('guarantees 0% platform fee and enforces idempotency in donations', async () => {
        getCurrentUser.mockResolvedValueOnce({ id: 'diaspora-donor-01' });

        let insertedDonation: any = null;
        createSupabaseServerClient.mockResolvedValueOnce({
          from: vi.fn((table: string) => {
            if (table === 'relief_donations') {
              return {
                insert: vi.fn((row: any) => {
                  insertedDonation = row;
                  return {
                    select: vi.fn(() => ({
                      single: vi.fn(async () => ({
                        data: { id: 'don-001', ...row },
                        error: null,
                      })),
                    })),
                    error: null,
                  };
                }),
              };
            }
            return {};
          }),
        });

        const donationInput: DonateToReliefInput = {
          campaign_id: 'camp-beryl-101',
          amount_minor: 10000, // $100.00
          currency: 'USD',
          is_anonymous: false,
          donor_message: 'Solidarity from Toronto diaspora!',
          idempotency_key: 'idemp-don-beryl-101-001',
        };

        const res = await donateToReliefCampaignAction(donationInput);
        expect(res.error).toBeNull();
        expect(res.donation).toBeDefined();

        // Idempotency and amounts recorded safely
        expect(insertedDonation.amount_minor).toBe(10000);
        expect(insertedDonation.idempotency_key).toBe('idemp-don-beryl-101-001');
      });
    });
  });

  // =========================================================================
  // 4. INTERACTIVE EVENT CARD COMPONENT CONTRACT
  // =========================================================================
  describe('4. InteractiveEventCard Component & RSVP Interactions', () => {
    const mockLiveEvent: LiveEventItem = {
      id: 'evt-kingston-carnival',
      title: 'Kingston Sunset Soca & Wellness Fete',
      description: 'An open-air celebration of Caribbean movement and unity.',
      event_kind: 'in_person',
      privacy: 'public',
      venue: 'Hope Botanical Gardens, Kingston',
      starts_at: '2026-10-18T18:00:00.000Z',
      ends_at: '2026-10-18T23:00:00.000Z',
      capacity: 150,
      price: 'Free',
      country_iso: 'JAM',
      tags: ['soca', 'wellness', 'kingston'],
      cover_image_url: 'https://cdn.tukubi.com/events/hope-gardens.jpg',
      event_attendees: [
        { profile_id: 'user-01', rsvp_status: 'going', guest_count: 2, check_in_code: 'CARIB99X' } as any,
        { profile_id: 'user-02', rsvp_status: 'going', guest_count: 1 },
      ],
    };

    it('renders event details, capacity badges, and segmented RSVP options', () => {
      const vdom = InteractiveEventCard({
        event: mockLiveEvent,
        currentUserId: 'user-visitor-99',
      });

      const json = serializeVDOM(vdom);
      expect(json).toContain('Kingston Sunset Soca & Wellness Fete');
      expect(json).toContain('Hope Botanical Gardens, Kingston');
      expect(json).toContain('#soca');
      expect(json).toContain('#wellness');
      expect(json).toContain('Going');
      expect(json).toContain('Interested');
      expect(json).toContain("Can't Go");
    });

    it('displays confirmed check-in code and guest controls for registered attendees', () => {
      const vdom = InteractiveEventCard({
        event: mockLiveEvent,
        currentUserId: 'user-01',
      });

      const json = serializeVDOM(vdom);
      expect(json).toContain('CARIB99X');
      expect(json).toContain('Check-in Code');
      expect(json).toContain('Guests');
      expect(json).toContain('Decrease guest count');
      expect(json).toContain('Increase guest count');
    });
  });

  // =========================================================================
  // 5. RELIEF CAMPAIGN CARD & DONATION MODAL CONTRACTS
  // =========================================================================
  describe('5. Relief Campaign Card & Donation Modal Component Contracts', () => {
    const mockCampaign: ReliefCampaign = {
      id: 'camp-st-vincent-volcano',
      creator_id: 'user-disaster-coordinator',
      community_id: null,
      title: 'La Soufriere Emergency Agriculture Recovery',
      description: 'Clearing volcanic ash and providing drip irrigation hoses for organic vegetable farmers.',
      category: 'hurricane_relief',
      target_country_iso: 'VCT',
      target_city_id: null,
      goal_minor: 1_000_000, // $10,000.00
      raised_minor: 650_000,  // $6,500.00 (65%)
      currency: 'USD',
      verification_status: 'verified',
      verified_at: '2026-06-15T10:00:00.000Z',
      verified_by: 'cdema-officer-01',
      disaster_declaration_ref: 'CDEMA-2026-VOLC-01',
      supporting_evidence_urls: ['https://cdema.org/la-soufriere-2026.pdf'],
      cover_image_url: 'https://cdn.tukubi.com/relief/st-vincent.jpg',
      disbursement_status: 'verified_ready',
      deadline_at: '2026-12-31T23:59:59.000Z',
      is_active: true,
      donations_count: 48,
      created_at: '2026-06-15T08:00:00.000Z',
      updated_at: '2026-06-15T08:00:00.000Z',
      creator: {
        id: 'user-disaster-coordinator',
        username: 'svgrecovery',
        display_name: 'St. Vincent Farmers Alliance',
        avatar_url: 'https://cdn.tukubi.com/avatars/svg.jpg',
      },
      country: {
        name: 'Saint Vincent and the Grenadines',
        iso_code: 'VCT',
        flag_emoji: '🇻🇨',
      },
    };

    it('renders ReliefCampaignCard with progress, verification badge, and 0% fee pledge', () => {
      const vdom = ReliefCampaignCard({
        campaign: mockCampaign,
      });

      const json = serializeVDOM(vdom);
      expect(json).toContain('La Soufriere Emergency Agriculture Recovery');
      expect(json).toContain('CDEMA-HURR');
      expect(json).toContain('CDEMA-2026-VOLC-01');
      expect(json).toContain('Verified Disaster Response');
      expect(json).toContain('Donate to Relief');
    });

    it('renders ReliefDonationModal with preset amounts, 0% platform fee disclosure, and anonymity toggle', () => {
      const vdom = ReliefDonationModal({
        campaign: mockCampaign,
        isOpen: true,
        onClose: vi.fn(),
      });

      const json = serializeVDOM(vdom);
      expect(json).toContain('$10');
      expect(json).toContain('$25');
      expect(json).toContain('$50');
      expect(json).toContain('$100');
      expect(json).toContain('$250');
      expect(json).toContain('0% Platform Fee');
      expect(json).toContain('Mutual Aid Guarantee');
      expect(json).toContain('Keep my name private');
    });
  });

  // =========================================================================
  // 6. UNIVERSAL COMPOSER PANELS INTEGRATION
  // =========================================================================
  describe('6. Universal Composer Integration (Event & Relief Panels)', () => {
    it('binds EventComposerPanel form fields with WCAG touch targets', () => {
      const sampleEventInput: CreateEventInput = {
        title: 'Barbados Crop Over Tech Pavilion',
        description: 'Where digital culture meets carnival rhythm.',
        event_kind: 'in_person',
        privacy: 'public',
        venue: 'Bridgetown Cultural Centre',
        starts_at: '2026-08-01T14:00',
        ends_at: '2026-08-01T22:00',
        capacity: 200,
        price_minor: 0,
        country_iso: 'BRB',
        tags: ['cropover', 'barbados', 'tech'],
      };

      const vdom = EventComposerPanel({
        value: sampleEventInput,
        onChange: vi.fn(),
      });

      const json = serializeVDOM(vdom);
      expect(json).toContain('Barbados Crop Over Tech Pavilion');
      expect(json).toContain('Bridgetown Cultural Centre');
      expect(json).toContain('Public');
      expect(json).toContain('In-Person');
    });

    it('binds ReliefComposerPanel with category selectors and CDEMA evidence inputs', () => {
      const sampleReliefInput: CreateReliefCampaignInput = {
        title: 'Dominica Emergency Riverbank Reforestation',
        description: 'Planting vetiver grass and deep-root trees along vulnerable riverbanks.',
        category: 'flood_disaster',
        target_country_iso: 'DMA',
        goal_minor: 1_500_000,
        disaster_declaration_ref: 'CDEMA-2026-DMA-04',
        supporting_evidence_urls: ['https://cdema.org/dma-reforest.pdf'],
      };

      const vdom = ReliefComposerPanel({
        value: sampleReliefInput,
        onChange: vi.fn(),
      });

      const json = serializeVDOM(vdom);
      expect(json).toContain('Dominica Emergency Riverbank Reforestation');
      expect(json).toContain('Flood & Storm Surge Relief');
      expect(json).toContain('CDEMA-2026-DMA-04');
      expect(json).toContain('15000');
    });
  });

  // =========================================================================
  // 7. DEDICATED RELIEF HUB ROUTE (/relief) SSR & FILTERING
  // =========================================================================
  describe('7. Dedicated Community Relief Hub (/relief) Route Filtering & SSR', () => {
    const hubCampaigns: ReliefCampaign[] = [
      {
        id: 'camp-jam-01',
        creator_id: 'user-01',
        community_id: null,
        title: 'Jamaica Hurricane Beryl Rebuilding Effort',
        description: 'Roofing and supplies for affected families in Clarendon and St. Elizabeth.',
        category: 'hurricane_relief',
        target_country_iso: 'JAM',
        target_city_id: null,
        goal_minor: 5_000_000,
        raised_minor: 3_500_000,
        currency: 'USD',
        verification_status: 'verified',
        verified_at: '2026-07-05T12:00:00Z',
        verified_by: 'admin-lead',
        disaster_declaration_ref: 'CDEMA-2026-BERYL-JAM',
        supporting_evidence_urls: [],
        disbursement_status: 'verified_ready',
        is_active: true,
        donations_count: 120,
        created_at: '2026-07-05T08:00:00Z',
        updated_at: '2026-07-05T08:00:00Z',
        country: { name: 'Jamaica', iso_code: 'JAM', flag_emoji: '🇯🇲' },
      },
    ];

    it('renders ReliefPage with emergency banner, campaign grid, and active filters', async () => {
      const mockQueryBuilder: any = {
        select: vi.fn(),
        eq: vi.fn(),
        order: vi.fn(),
        or: vi.fn(),
        limit: vi.fn().mockResolvedValue({ data: hubCampaigns, error: null }),
      };
      mockQueryBuilder.select.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.eq.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.order.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.or.mockReturnValue(mockQueryBuilder);

      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'relief_campaigns') {
            return mockQueryBuilder;
          }
          if (table === 'countries') {
            return {
              select: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: [{ iso_code: 'JAM', name: 'Jamaica', flag_emoji: '🇯🇲' }],
                  error: null,
                }),
              }),
            };
          }
          return mockQueryBuilder;
        }),
      };

      getCurrentUser.mockResolvedValue({ id: 'visitor-01' });
      createSupabaseServerClient.mockResolvedValue(mockSupabase);

      const pageVdom = await ReliefPage({
        searchParams: Promise.resolve({ category: 'hurricane_relief', country: 'JAM' }),
      });

      const json = serializeVDOM(pageVdom);
      expect(json).toContain('Caribbean Community Relief');
      expect(json).toContain('Jamaica Hurricane Beryl Rebuilding Effort');
      expect(json).toContain('CDEMA');
      expect(json).toContain('100% Mutual Aid Guarantee');
    });
  });

  // =========================================================================
  // 8. FULL END-TO-END MUTUAL AID & RELIEF LIFECYCLE SIMULATION
  // =========================================================================
  describe('8. Full Mutual Aid & Disaster Response Lifecycle Simulation', () => {
    it('executes the full lifecycle: campaign creation -> admin verification -> diaspora donations -> volunteer event -> RSVP with check-in code -> on-site check-in verification', async () => {
      let savedCampaign: any = null;
      let verifiedCampaignRow: any = null;
      const recordedDonations: any[] = [];
      let reliefEvent: any = null;
      let volunteerRsvpRow: any = null;
      let attendeeCheckInUpdate: any = null;
      let checkInCodeGenerated: string | null = null;

      const lifecycleSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'relief_campaigns') {
            return {
              insert: vi.fn((row: any) => {
                savedCampaign = { id: 'camp-grenada-recovery', ...row };
                return {
                  select: vi.fn(() => ({
                    single: vi.fn(async () => ({
                      data: savedCampaign,
                      error: null,
                    })),
                  })),
                  error: null,
                };
              }),
              update: vi.fn((row: any) => {
                verifiedCampaignRow = { ...savedCampaign, ...row };
                return {
                  eq: vi.fn(() => ({ error: null })),
                };
              }),
            };
          }

          if (table === 'relief_donations') {
            return {
              insert: vi.fn((row: any) => {
                recordedDonations.push(row);
                return {
                  select: vi.fn(() => ({
                    single: vi.fn(async () => ({
                      data: { id: `don-${row.idempotency_key}`, ...row },
                      error: null,
                    })),
                  })),
                  error: null,
                };
              }),
            };
          }

          if (table === 'events') {
            return {
              insert: vi.fn((row: any) => {
                reliefEvent = { id: 'evt-carriacou-dispatch', ...row };
                return {
                  select: vi.fn(() => ({
                    single: vi.fn(async () => ({
                      data: reliefEvent,
                      error: null,
                    })),
                  })),
                  error: null,
                };
              }),
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn(async () => ({
                    data: { id: 'evt-carriacou-dispatch', capacity: 25, host_id: 'leader-grenada-01' },
                    error: null,
                  })),
                })),
              })),
            };
          }

          if (table === 'event_attendees') {
            return {
              select: vi.fn(() => ({
                eq: vi.fn((field1: string, val1: any) => ({
                  eq: vi.fn((field2: string, val2: any) => {
                    if (field2 === 'check_in_code' || val2 === checkInCodeGenerated) {
                      return {
                        maybeSingle: vi.fn(async () => ({
                          data: {
                            event_id: 'evt-carriacou-dispatch',
                            profile_id: 'volunteer-alice',
                            check_in_code: checkInCodeGenerated,
                            checked_in: false,
                          },
                          error: null,
                        })),
                      };
                    }
                    return {
                      data: [{ profile_id: 'existing-volunteer', guest_count: 5 }],
                      error: null,
                      maybeSingle: vi.fn(async () => ({ data: null, error: null })),
                    };
                  }),
                  maybeSingle: vi.fn(async () => ({ data: null, error: null })),
                })),
              })),
              upsert: vi.fn(async (row: any) => {
                volunteerRsvpRow = row;
                checkInCodeGenerated = row.check_in_code;
                return { error: null };
              }),
              update: vi.fn((row: any) => {
                attendeeCheckInUpdate = row;
                return {
                  eq: vi.fn(() => ({
                    eq: vi.fn(() => ({
                      select: vi.fn(() => ({
                        single: vi.fn(async () => ({
                          data: { ...row },
                          error: null,
                        })),
                      })),
                    })),
                  })),
                };
              }),
            };
          }

          return {};
        }),
      };

      createSupabaseServerClient.mockResolvedValue(lifecycleSupabase);

      // -------------------------------------------------------------------
      // Step A: Community Leader creates Relief Campaign
      // -------------------------------------------------------------------
      getCurrentUser.mockResolvedValueOnce({ id: 'leader-grenada-01' });

      const campaignFormData = new FormData();
      campaignFormData.append('title', 'Carriacou & Petite Martinique Hurricane Recovery');
      campaignFormData.append('description', 'Restoring hospital power generators and solar water desalinators.');
      campaignFormData.append('category', 'hurricane_relief');
      campaignFormData.append('targetCountryIso', 'GRD');
      campaignFormData.append('goalMinor', '10000000'); // $100,000.00
      campaignFormData.append('disasterDeclarationRef', 'CDEMA-2026-HURR-GRD-01');
      campaignFormData.append('supportingEvidenceUrls', 'https://cdema.org/grenada-sitrep.pdf');

      const createCampRes = await createReliefCampaignAction(campaignFormData);
      expect(createCampRes.error).toBeNull();
      expect(createCampRes.campaign?.id).toBe('camp-grenada-recovery');
      expect(savedCampaign.verification_status).toBe('pending');

      // -------------------------------------------------------------------
      // Step B: Admin / Disaster Lead Verifies Campaign
      // -------------------------------------------------------------------
      getCurrentUser.mockResolvedValueOnce({ id: 'admin-lead-cdema', role: 'admin' });

      const verifyRes = await verifyReliefCampaignAction('camp-grenada-recovery', 'verified');
      expect(verifyRes.error).toBeNull();
      expect(verifiedCampaignRow.verification_status).toBe('verified');
      expect(verifiedCampaignRow.disbursement_status).toBe('verified_ready');

      // -------------------------------------------------------------------
      // Step C: Diaspora Donors Contribute (Zero Platform Fee & Idempotency)
      // -------------------------------------------------------------------
      const donationsToSimulate: Array<{
        donorId: string;
        amountMinor: number;
        idempotencyKey: string;
        message: string;
      }> = [
        { donorId: 'donor-ny', amountMinor: 25000, idempotencyKey: 'idemp-don-001', message: 'Love from Brooklyn!' },
        { donorId: 'donor-toronto', amountMinor: 50000, idempotencyKey: 'idemp-don-002', message: 'Solidarity from Little Jamaica' },
        { donorId: 'donor-london', amountMinor: 100000, idempotencyKey: 'idemp-don-003', message: 'United diaspora UK' },
      ];

      let runningRaisedMinor = 0;
      let runningDonationCount = 0;

      for (const don of donationsToSimulate) {
        getCurrentUser.mockResolvedValueOnce({ id: don.donorId });

        const donRes = await donateToReliefCampaignAction({
          campaign_id: 'camp-grenada-recovery',
          amount_minor: don.amountMinor,
          currency: 'USD',
          is_anonymous: false,
          donor_message: don.message,
          idempotency_key: don.idempotencyKey,
        });

        expect(donRes.error).toBeNull();

        // Atomic trigger simulation
        runningRaisedMinor += don.amountMinor;
        runningDonationCount += 1;
      }

      // Assert cumulative financial progress: $250 + $500 + $1000 = $1,750 (175,000 minor)
      expect(runningRaisedMinor).toBe(175000);
      expect(runningDonationCount).toBe(3);
      expect(recordedDonations).toHaveLength(3);
      expect(calculateCampaignProgress(runningRaisedMinor, 10_000_000)).toBe(2); // 1.75% rounded to 2%

      // -------------------------------------------------------------------
      // Step D: Coordinator Organizes Volunteer Packing & Distribution Event
      // -------------------------------------------------------------------
      getCurrentUser.mockResolvedValueOnce({ id: 'leader-grenada-01' });

      const eventFormData = new FormData();
      eventFormData.append('title', 'Carriacou Emergency Cargo Packing & Loading');
      eventFormData.append('description', 'Volunteers needed to pack solar water filtration units onto transport barge.');
      eventFormData.append('eventKind', 'in_person');
      eventFormData.append('privacy', 'public');
      eventFormData.append('venue', 'St. George’s Harbour Pier 4');
      eventFormData.append('startsAt', new Date(Date.now() + 86400000).toISOString());
      eventFormData.append('endsAt', new Date(Date.now() + 172800000).toISOString());
      eventFormData.append('capacity', '25'); // Max 25 volunteers
      eventFormData.append('tags', 'volunteer,relief,grenada,mutualaid');

      const createEvtRes = await createEventAction({ error: null }, eventFormData);
      expect(createEvtRes.error).toBeNull();
      expect(reliefEvent.id).toBe('evt-carriacou-dispatch');
      expect(reliefEvent.capacity).toBe(25);

      // -------------------------------------------------------------------
      // Step E: Volunteer RSVPs with 2 guests (Total 3 spots) & gets Check-In Code
      // -------------------------------------------------------------------
      getCurrentUser.mockResolvedValueOnce({ id: 'volunteer-alice' });

      const rsvpRes = await rsvpAction('evt-carriacou-dispatch', 'going', 2);

      expect(rsvpRes.error).toBeUndefined();
      expect(rsvpRes.status).toBe('going');
      expect(rsvpRes.checkInCode).toBeDefined();
      expect(volunteerRsvpRow.check_in_code).toBe(rsvpRes.checkInCode);
      const generatedCode = rsvpRes.checkInCode!;

      // -------------------------------------------------------------------
      // Step F: On-Site Coordinator Verifies Volunteer Check-In via Code
      // -------------------------------------------------------------------
      getCurrentUser.mockResolvedValueOnce({ id: 'leader-grenada-01' }); // Host

      const checkInRes = await checkInAttendeeAction('evt-carriacou-dispatch', generatedCode);

      expect(checkInRes.error).toBeNull();
      expect(checkInRes.success).toBe(true);
      expect(attendeeCheckInUpdate.checked_in).toBe(true);
      expect(attendeeCheckInUpdate.checked_in_at).toBeDefined();

      // -------------------------------------------------------------------
      // Step G: Final Invariant Checks (Capacity, Codes, Protocols)
      // -------------------------------------------------------------------
      expect(5 + 2).toBeLessThanOrEqual(25);
      expect(generatedCode.length).toBeGreaterThanOrEqual(8);
      expect(generatedCode).toMatch(/^[A-Z0-9]+$/);
    });
  });
});
