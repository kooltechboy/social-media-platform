import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createEventAction,
  rsvpAction,
  checkInAttendeeAction,
} from '../apps/web/src/lib/events/actions';
import {
  createReliefCampaignAction,
  donateToReliefCampaignAction,
  verifyReliefCampaignAction,
  fetchReliefCampaignAction,
} from '../apps/web/src/lib/relief/actions';

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

describe('Task 3: Server Actions for Events & Relief Campaigns', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Enhanced Event Actions', () => {
    describe('createEventAction', () => {
      it('rejects unauthenticated requests', async () => {
        getCurrentUser.mockResolvedValueOnce(null);
        const formData = new FormData();
        formData.append('title', 'Soca Monarch 2027');

        const result = await createEventAction({ error: null }, formData);
        expect(result.error).toMatch(/sign in/i);
      });

      it('validates title and future startsAt dates', async () => {
        getCurrentUser.mockResolvedValue({ id: 'user-host-1' });

        // Missing title
        const fdMissingTitle = new FormData();
        fdMissingTitle.append('startsAt', new Date(Date.now() + 86400000).toISOString());
        const res1 = await createEventAction({ error: null }, fdMissingTitle);
        expect(res1.error).toMatch(/title is required/i);

        // Past startsAt
        const fdPast = new FormData();
        fdPast.append('title', 'Carnival Yesterday');
        fdPast.append('startsAt', new Date(Date.now() - 86400000).toISOString());
        const res2 = await createEventAction({ error: null }, fdPast);
        expect(res2.error).toMatch(/must start in the future/i);
      });

      it('persists privacy, livestream_url, cover_image_url, tags, and ends_at', async () => {
        getCurrentUser.mockResolvedValue({ id: 'user-host-1' });

        let insertedPayload: Record<string, unknown> | null = null;
        const mockSupabase = {
          from: vi.fn((table: string) => {
            if (table === 'events') {
              return {
                insert: vi.fn((payload: Record<string, unknown>) => {
                  insertedPayload = payload;
                  return {
                    select: vi.fn(() => ({
                      single: vi.fn(async () => ({
                        data: { id: 'event-101', ...payload },
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
        };
        createSupabaseServerClient.mockResolvedValue(mockSupabase);

        const startsAt = new Date(Date.now() + 86400000).toISOString();
        const endsAt = new Date(Date.now() + 100000000).toISOString();

        const formData = new FormData();
        formData.append('title', 'Caribbean AI & Tech Summit');
        formData.append('eventKind', 'hybrid');
        formData.append('privacy', 'community_only');
        formData.append('venue', 'Hyatt Regency Trinidad');
        formData.append('livestreamUrl', 'https://stream.tukubi.caribbean/summit2027');
        formData.append('coverImageUrl', 'https://cdn.tukubi.caribbean/banners/summit.jpg');
        formData.append('tags', 'tech,caribbean,ai,innovation');
        formData.append('startsAt', startsAt);
        formData.append('endsAt', endsAt);
        formData.append('capacity', '250');

        const result = await createEventAction({ error: null }, formData);
        expect(result.error).toBeNull();
        expect(insertedPayload).toBeDefined();
        expect(insertedPayload?.privacy).toBe('community_only');
        expect(insertedPayload?.event_kind).toBe('hybrid');
        expect(insertedPayload?.livestream_url).toBe('https://stream.tukubi.caribbean/summit2027');
        expect(insertedPayload?.cover_image_url).toBe('https://cdn.tukubi.caribbean/banners/summit.jpg');
        expect(insertedPayload?.tags).toEqual(['tech', 'caribbean', 'ai', 'innovation']);
        expect(insertedPayload?.capacity).toBe(250);
        expect(insertedPayload?.ends_at).toBe(endsAt);
      });
    });

    describe('rsvpAction', () => {
      it('rejects guest count outside 1..10 range', async () => {
        getCurrentUser.mockResolvedValue({ id: 'user-guest-1' });

        const resZero = await rsvpAction('event-1', 'going', 0);
        expect(resZero.error).toMatch(/between 1 and 10/i);

        const resEleven = await rsvpAction('event-1', 'going', 11);
        expect(resEleven.error).toMatch(/between 1 and 10/i);
      });

      it('enforces capacity limits when joining a full event', async () => {
        getCurrentUser.mockResolvedValue({ id: 'user-guest-new' });

        const mockSupabase = {
          from: vi.fn((table: string) => {
            if (table === 'events') {
              return {
                select: vi.fn(() => ({
                  eq: vi.fn(() => ({
                    single: vi.fn(async () => ({
                      data: { id: 'event-1', capacity: 10 },
                      error: null,
                    })),
                  })),
                })),
              };
            }
            if (table === 'event_attendees') {
              return {
                select: vi.fn(() => ({
                  eq: vi.fn((col1: string, val1: string) => ({
                    eq: vi.fn(async () => {
                      if (val1 === 'event-1') {
                        // Current total going is 8 (existing guest 1 has 5, guest 2 has 3)
                        return {
                          data: [
                            { profile_id: 'user-1', guest_count: 5 },
                            { profile_id: 'user-2', guest_count: 3 },
                          ],
                          error: null,
                        };
                      }
                      return { data: [], error: null };
                    }),
                    maybeSingle: vi.fn(async () => ({ data: null, error: null })),
                  })),
                })),
              };
            }
            return {};
          }),
        };
        createSupabaseServerClient.mockResolvedValue(mockSupabase);

        // Capacity is 10, existing is 8. Trying to bring 3 guests (8 + 3 = 11 > 10)
        const res = await rsvpAction('event-1', 'going', 3);
        expect(res.status).toBeNull();
        expect(res.error).toMatch(/capacity/i);
      });

      it('generates check-in code and records guest count when RSVP succeeds', async () => {
        getCurrentUser.mockResolvedValue({ id: 'user-guest-success' });

        let upsertedRecord: Record<string, unknown> | null = null;
        const mockSupabase = {
          from: vi.fn((table: string) => {
            if (table === 'events') {
              return {
                select: vi.fn(() => ({
                  eq: vi.fn(() => ({
                    single: vi.fn(async () => ({
                      data: { id: 'event-free', capacity: 100 },
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
                      then: (r: any) => Promise.resolve({ data: [], error: null }).then(r),
                    })),
                    maybeSingle: vi.fn(async () => ({ data: null, error: null })),
                  })),
                })),
                upsert: vi.fn(async (payload: Record<string, unknown>) => {
                  upsertedRecord = payload;
                  return { error: null };
                }),
              };
            }
            return {};
          }),
        };
        createSupabaseServerClient.mockResolvedValue(mockSupabase);

        const result = await rsvpAction('event-free', 'going', 2);
        expect(result.status).toBe('going');
        expect(upsertedRecord).toBeDefined();
        expect(upsertedRecord?.guest_count).toBe(2);
        expect(typeof upsertedRecord?.check_in_code).toBe('string');
        expect((upsertedRecord?.check_in_code as string).length).toBeGreaterThanOrEqual(8);
      });
    });

    describe('checkInAttendeeAction', () => {
      it('rejects unauthorized check-in by non-host', async () => {
        getCurrentUser.mockResolvedValue({ id: 'user-intruder' });

        const mockSupabase = {
          from: vi.fn((table: string) => {
            if (table === 'events') {
              return {
                select: vi.fn(() => ({
                  eq: vi.fn(() => ({
                    single: vi.fn(async () => ({
                      data: { id: 'event-10', host_id: 'user-real-host' },
                      error: null,
                    })),
                  })),
                })),
              };
            }
            return {};
          }),
        };
        createSupabaseServerClient.mockResolvedValue(mockSupabase);

        const res = await checkInAttendeeAction('event-10', 'CODE123');
        expect(res.success).toBe(false);
        expect(res.error).toMatch(/only the event host/i);
      });

      it('rejects invalid or non-existent check-in code', async () => {
        getCurrentUser.mockResolvedValue({ id: 'user-host' });

        const mockSupabase = {
          from: vi.fn((table: string) => {
            if (table === 'events') {
              return {
                select: vi.fn(() => ({
                  eq: vi.fn(() => ({
                    single: vi.fn(async () => ({
                      data: { id: 'event-10', host_id: 'user-host' },
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
                      maybeSingle: vi.fn(async () => ({ data: null, error: null })),
                    })),
                  })),
                })),
              };
            }
            return {};
          }),
        };
        createSupabaseServerClient.mockResolvedValue(mockSupabase);

        const res = await checkInAttendeeAction('event-10', 'INVALID_CODE');
        expect(res.success).toBe(false);
        expect(res.error).toMatch(/invalid check-in code/i);
      });

      it('marks attendee as checked in with timestamp', async () => {
        getCurrentUser.mockResolvedValue({ id: 'user-host' });

        let updatedFields: Record<string, unknown> | null = null;
        const mockSupabase = {
          from: vi.fn((table: string) => {
            if (table === 'events') {
              return {
                select: vi.fn(() => ({
                  eq: vi.fn(() => ({
                    single: vi.fn(async () => ({
                      data: { id: 'event-10', host_id: 'user-host' },
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
                          event_id: 'event-10',
                          profile_id: 'user-attendee',
                          check_in_code: 'VALID123456',
                          checked_in: false,
                        },
                        error: null,
                      })),
                    })),
                  })),
                })),
                update: vi.fn((fields: Record<string, unknown>) => {
                  updatedFields = fields;
                  return {
                    eq: vi.fn(() => ({
                      eq: vi.fn(() => ({
                        select: vi.fn(() => ({
                          single: vi.fn(async () => ({
                            data: {
                              event_id: 'event-10',
                              profile_id: 'user-attendee',
                              checked_in: true,
                              checked_in_at: fields.checked_in_at,
                            },
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
        createSupabaseServerClient.mockResolvedValue(mockSupabase);

        const res = await checkInAttendeeAction('event-10', 'VALID123456');
        expect(res.success).toBe(true);
        expect(updatedFields?.checked_in).toBe(true);
        expect(updatedFields?.checked_in_at).toBeDefined();
      });
    });
  });

  describe('2. Relief Campaign Server Actions', () => {
    describe('createReliefCampaignAction', () => {
      it('requires authenticated user', async () => {
        getCurrentUser.mockResolvedValue(null);

        const res = await createReliefCampaignAction({
          title: 'Hurricane Irma Recovery',
          description: 'Emergency supply chain for Barbuda',
          category: 'hurricane_relief',
          goal_minor: 5000000,
        });

        expect(res.error).toMatch(/sign in/i);
      });

      it('validates minimum goal amount (min $100 / 10000 minor units)', async () => {
        getCurrentUser.mockResolvedValue({ id: 'user-relief-creator' });

        const res = await createReliefCampaignAction({
          title: 'Medical Supplies',
          description: 'First aid kits',
          category: 'medical_aid',
          goal_minor: 5000, // $50 < $100 minimum
        });

        expect(res.error).toMatch(/at least/i);
      });

      it('validates disaster declaration protocol code if provided', async () => {
        getCurrentUser.mockResolvedValue({ id: 'user-relief-creator' });

        const res = await createReliefCampaignAction({
          title: 'Flood Assistance',
          description: 'Drainage pumps',
          category: 'flood_disaster',
          goal_minor: 250000,
          disaster_declaration_ref: 'RANDOM-INVALID-REF',
        });

        expect(res.error).toMatch(/disaster declaration/i);
      });

      it('persists campaign with pending verification and locked disbursement', async () => {
        getCurrentUser.mockResolvedValue({ id: 'user-relief-creator' });

        let insertedCampaign: Record<string, unknown> | null = null;
        const mockSupabase = {
          from: vi.fn((table: string) => {
            if (table === 'relief_campaigns') {
              return {
                insert: vi.fn((payload: Record<string, unknown>) => {
                  insertedCampaign = payload;
                  return {
                    select: vi.fn(() => ({
                      single: vi.fn(async () => ({
                        data: { id: 'camp-hurricane-1', ...payload },
                        error: null,
                      })),
                    })),
                  };
                }),
              };
            }
            return {};
          }),
        };
        createSupabaseServerClient.mockResolvedValue(mockSupabase);

        const res = await createReliefCampaignAction({
          title: 'Hurricane Beryl Relief for Carriacou',
          description: 'Emergency solar power and freshwater generation units.',
          category: 'hurricane_relief',
          goal_minor: 10000000,
          currency: 'USD',
          target_country_iso: 'GRD',
          disaster_declaration_ref: 'CDEMA-2024-BERYL',
          supporting_evidence_urls: ['https://cdema.org/situation-reports/beryl-01'],
        });

        expect(res.error).toBeNull();
        expect(insertedCampaign).toBeDefined();
        expect(insertedCampaign?.verification_status).toBe('pending');
        expect(insertedCampaign?.disbursement_status).toBe('locked');
        expect(insertedCampaign?.disaster_declaration_ref).toBe('CDEMA-2024-BERYL');
        expect(insertedCampaign?.target_country_iso).toBe('GRD');
      });
    });

    describe('donateToReliefCampaignAction', () => {
      it('validates minimum donation amount', async () => {
        const res = await donateToReliefCampaignAction({
          campaign_id: 'camp-1',
          amount_minor: 50, // $0.50 < $1.00 minimum
        });

        expect(res.error).toMatch(/minimum donation/i);
      });

      it('records donation with unique idempotency key and revalidates paths', async () => {
        getCurrentUser.mockResolvedValue({ id: 'donor-1' });

        let insertedDonation: Record<string, unknown> | null = null;
        const mockSupabase = {
          from: vi.fn((table: string) => {
            if (table === 'relief_donations') {
              return {
                insert: vi.fn((payload: Record<string, unknown>) => {
                  insertedDonation = payload;
                  return {
                    select: vi.fn(() => ({
                      single: vi.fn(async () => ({
                        data: { id: 'don-1', ...payload },
                        error: null,
                      })),
                    })),
                  };
                }),
              };
            }
            return {};
          }),
        };
        createSupabaseServerClient.mockResolvedValue(mockSupabase);

        const res = await donateToReliefCampaignAction({
          campaign_id: 'camp-hurricane-1',
          amount_minor: 5000, // $50.00
          donor_message: 'Stay strong Carriacou!',
          is_anonymous: false,
        });

        expect(res.error).toBeNull();
        expect(insertedDonation).toBeDefined();
        expect(insertedDonation?.amount_minor).toBe(5000);
        expect(insertedDonation?.donor_message).toBe('Stay strong Carriacou!');
        expect(typeof insertedDonation?.idempotency_key).toBe('string');
        expect((insertedDonation?.idempotency_key as string).startsWith('relief_don_')).toBe(true);
      });

      it('masks donor name when anonymous', async () => {
        getCurrentUser.mockResolvedValue({ id: 'donor-2' });

        let insertedDonation: Record<string, unknown> | null = null;
        const mockSupabase = {
          from: vi.fn((table: string) => {
            if (table === 'relief_donations') {
              return {
                insert: vi.fn((payload: Record<string, unknown>) => {
                  insertedDonation = payload;
                  return {
                    select: vi.fn(() => ({
                      single: vi.fn(async () => ({
                        data: { id: 'don-2', ...payload },
                        error: null,
                      })),
                    })),
                  };
                }),
              };
            }
            return {};
          }),
        };
        createSupabaseServerClient.mockResolvedValue(mockSupabase);

        const res = await donateToReliefCampaignAction({
          campaign_id: 'camp-hurricane-1',
          amount_minor: 10000,
          is_anonymous: true,
        });

        expect(res.error).toBeNull();
        expect(insertedDonation?.is_anonymous).toBe(true);
        expect(insertedDonation?.donor_name).toBe('Anonymous Supporter');
      });
    });

    describe('verifyReliefCampaignAction', () => {
      it('requires authenticated administrator', async () => {
        getCurrentUser.mockResolvedValue(null);
        const res = await verifyReliefCampaignAction('camp-1', 'verified');
        expect(res.error).toMatch(/unauthorized/i);
      });

      it('updates verification and unlocks disbursement upon approval', async () => {
        getCurrentUser.mockResolvedValue({ id: 'admin-user-1' });

        let updatedPayload: Record<string, unknown> | null = null;
        const mockSupabase = {
          from: vi.fn((table: string) => {
            if (table === 'relief_campaigns') {
              return {
                update: vi.fn((payload: Record<string, unknown>) => {
                  updatedPayload = payload;
                  return {
                    eq: vi.fn(async () => ({ data: null, error: null })),
                  };
                }),
              };
            }
            return {};
          }),
        };
        createSupabaseServerClient.mockResolvedValue(mockSupabase);

        const res = await verifyReliefCampaignAction('camp-1', 'verified');
        expect(res.success).toBe(true);
        expect(updatedPayload?.verification_status).toBe('verified');
        expect(updatedPayload?.disbursement_status).toBe('verified_ready');
        expect(updatedPayload?.verified_by).toBe('admin-user-1');
        expect(updatedPayload?.verified_at).toBeDefined();
      });
    });

    describe('fetchReliefCampaignAction', () => {
      it('returns campaign with sanitized donation list', async () => {
        const mockSupabase = {
          from: vi.fn((table: string) => {
            if (table === 'relief_campaigns') {
              return {
                select: vi.fn(() => ({
                  eq: vi.fn(() => ({
                    maybeSingle: vi.fn(async () => ({
                      data: {
                        id: 'camp-1',
                        title: 'Dominica Hurricane Recovery',
                        creator: { id: 'host-1', display_name: 'Relief Team' },
                      },
                      error: null,
                    })),
                  })),
                })),
              };
            }
            if (table === 'relief_donations') {
              return {
                select: vi.fn(() => ({
                  eq: vi.fn(() => ({
                    order: vi.fn(() => ({
                      limit: vi.fn(async () => ({
                        data: [
                          {
                            id: 'don-1',
                            amount_minor: 5000,
                            is_anonymous: false,
                            donor: { id: 'u1', display_name: 'Marcia' },
                          },
                          {
                            id: 'don-2',
                            amount_minor: 10000,
                            is_anonymous: true,
                            donor: { id: 'u2', display_name: 'Secret' },
                          },
                        ],
                        error: null,
                      })),
                    })),
                  })),
                })),
              };
            }
            return {};
          }),
        };
        createSupabaseServerClient.mockResolvedValue(mockSupabase);

        const res = await fetchReliefCampaignAction('camp-1');
        expect(res.error).toBeNull();
        expect(res.campaign?.id).toBe('camp-1');
        expect(res.donations).toHaveLength(2);
        // Non-anonymous donor remains intact
        expect(res.donations[0].donor?.display_name).toBe('Marcia');
        // Anonymous donor is sanitized
        expect(res.donations[1].donor).toBeNull();
        expect(res.donations[1].donor_name).toBe('Anonymous Supporter');
      });
    });
  });
});
