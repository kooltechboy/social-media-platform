import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import ReliefPage from '../apps/web/src/app/relief/page';
import type { ReliefCampaign } from '../apps/web/src/lib/relief/types';

// Mock Supabase server and auth utilities
vi.mock('../apps/web/src/lib/supabase/server', () => ({
  createSupabaseServerClient: vi.fn(),
  getCurrentUser: vi.fn(),
}));

import { createSupabaseServerClient, getCurrentUser } from '../apps/web/src/lib/supabase/server';

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

describe('Task 7: Dedicated Community Relief Hub Page (/relief)', () => {
  const pagePath = path.join(
    process.cwd(),
    'apps/web/src/app/relief/page.tsx'
  );

  const mockCampaigns: ReliefCampaign[] = [
    {
      id: 'camp-carib-relief-001',
      creator_id: 'user-relief-org',
      community_id: 'comm-st-elizabeth',
      title: 'Hurricane Beryl Emergency Recovery & Rebuild Fund',
      description: 'Providing clean water purification tablets, emergency food provisions, and zinc roofing sheets for farming families.',
      category: 'hurricane_relief',
      target_country_iso: 'JAM',
      target_city_id: 'city-st-elizabeth',
      goal_minor: 5_000_000,
      raised_minor: 3_250_000,
      currency: 'USD',
      verification_status: 'verified',
      verified_at: '2026-07-04T12:00:00.000Z',
      verified_by: 'admin-disaster-lead',
      disaster_declaration_ref: 'CDEMA-2026-HURR-09',
      supporting_evidence_urls: ['https://cdema.org/reports/beryl-2026-sitrep-04.pdf'],
      cover_image_url: 'https://cdn.tukubi.com/relief/st-elizabeth-beryl.jpg',
      disbursement_status: 'verified_ready',
      deadline_at: '2026-12-31T23:59:59.000Z',
      is_active: true,
      donations_count: 142,
      created_at: '2026-07-04T08:00:00.000Z',
      updated_at: '2026-07-04T08:00:00.000Z',
      creator: {
        id: 'user-relief-org',
        username: 'caribrecover',
        display_name: 'Caribbean Disaster Recovery Alliance',
        avatar_url: 'https://cdn.tukubi.com/avatars/cdra.png',
      },
      country: {
        name: 'Jamaica',
        iso_code: 'JAM',
        flag_emoji: '🇯🇲',
      },
      city: {
        name: 'St. Elizabeth',
      },
    },
    {
      id: 'camp-carib-relief-002',
      creator_id: 'user-dma-aid',
      community_id: null,
      title: 'Dominica Roseau River Basin Flood Relief',
      description: 'Emergency containment and clean drinking water tankers for affected residents along the Roseau river valley.',
      category: 'flood_disaster',
      target_country_iso: 'DMA',
      target_city_id: null,
      goal_minor: 2_500_000,
      raised_minor: 1_100_000,
      currency: 'USD',
      verification_status: 'verified',
      verified_at: '2026-08-10T10:00:00.000Z',
      verified_by: 'admin-disaster-lead',
      disaster_declaration_ref: 'ODPEM-2026-FLOOD-02',
      supporting_evidence_urls: [],
      cover_image_url: 'https://cdn.tukubi.com/relief/dma-flood.jpg',
      disbursement_status: 'verified_ready',
      deadline_at: null,
      is_active: true,
      donations_count: 58,
      created_at: '2026-08-10T09:00:00.000Z',
      updated_at: '2026-08-10T09:00:00.000Z',
      creator: {
        id: 'user-dma-aid',
        username: 'dominicaaid',
        display_name: 'Dominica Relief Council',
        avatar_url: null,
      },
      country: {
        name: 'Dominica',
        iso_code: 'DMA',
        flag_emoji: '🇩🇲',
      },
      city: null,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Static File & Architecture Verification', () => {
    it('verifies that apps/web/src/app/relief/page.tsx exists', () => {
      expect(fs.existsSync(pagePath)).toBe(true);
    });

    it('declares force-dynamic route rendering', () => {
      const source = fs.readFileSync(pagePath, 'utf8');
      expect(source).toMatch(/export\s+const\s+dynamic\s*=\s*['"]force-dynamic['"]/);
    });

    it('contains CDEMA / ODPEM / NEMO protocol trust and safety explanations', () => {
      const source = fs.readFileSync(pagePath, 'utf8');
      expect(source).toContain('CDEMA');
      expect(source).toContain('ODPEM');
      expect(source).toContain('NEMO');
      expect(source).toMatch(/100%\s+Mutual\s+Aid\s+Guarantee/i);
      expect(source).toMatch(/0%\s+Platform\s+Fees/i);
    });

    it('contains CTA button to launch relief fundraiser linking to /create?mode=fundraiser', () => {
      const source = fs.readFileSync(pagePath, 'utf8');
      expect(source).toContain('/create?mode=fundraiser');
      expect(source).toMatch(/Launch\s+Relief\s+Fundraiser/i);
    });

    it('includes category pills for Caribbean disaster and mutual aid categories', () => {
      const source = fs.readFileSync(pagePath, 'utf8');
      expect(source).toMatch(/hurricane_relief|Hurricane/);
      expect(source).toMatch(/flood_disaster|Flood/);
      expect(source).toMatch(/medical_aid|Medical/);
      expect(source).toMatch(/community_rebuild|Rebuild/);
      expect(source).toMatch(/education|Education/);
      expect(source).toMatch(/cultural_heritage|Culture/);
    });

    it('includes island territory filter dropdown with Caribbean nations', () => {
      const source = fs.readFileSync(pagePath, 'utf8');
      expect(source).toMatch(/JAM/);
      expect(source).toMatch(/DMA/);
      expect(source).toMatch(/TTO/);
      expect(source).toMatch(/BRB/);
      expect(source).toMatch(/HTI/);
    });

    it('complies with accessibility guidelines (min-h-[44px] touch targets, role/labels)', () => {
      const source = fs.readFileSync(pagePath, 'utf8');
      expect(source).toContain('min-h-[44px]');
      expect(source).toMatch(/aria-label|role="search"/);
    });

    it('utilizes Caribbean Futurism aesthetic design tokens', () => {
      const source = fs.readFileSync(pagePath, 'utf8');
      expect(source).toMatch(/brand-sunriseCoral|text-brand-sunriseCoral|bg-brand-sunriseCoral/);
      expect(source).toMatch(/brand-caribbeanSea|brand-twilight|brand-goldenHour/);
    });
  });

  describe('Server Component Data Fetching & VDOM Rendering', () => {
    it('queries active relief campaigns joining profiles, countries, and cities', async () => {
      const mockEq = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockReturnThis();
      const mockOr = vi.fn().mockReturnThis();
      const mockLimit = vi.fn().mockResolvedValue({ data: mockCampaigns, error: null });

      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: mockEq,
        order: mockOrder,
        or: mockOr,
        limit: mockLimit,
      };

      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'relief_campaigns') {
            return mockQueryBuilder;
          }
          if (table === 'countries') {
            return {
              select: vi.fn().mockReturnThis(),
              order: vi.fn().mockResolvedValue({
                data: [
                  { iso_code: 'JAM', name: 'Jamaica', flag_emoji: '🇯🇲' },
                  { iso_code: 'DMA', name: 'Dominica', flag_emoji: '🇩🇲' },
                ],
                error: null,
              }),
            };
          }
          return mockQueryBuilder;
        }),
      };

      (createSupabaseServerClient as any).mockResolvedValue(mockSupabase);
      (getCurrentUser as any).mockResolvedValue({ id: 'user-viewer-1' });

      const vdom = await ReliefPage({
        searchParams: Promise.resolve({}),
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('relief_campaigns');
      expect(mockEq).toHaveBeenCalledWith('is_active', true);

      const serialized = serializeVDOM(vdom);
      expect(serialized).toContain('Hurricane Beryl Emergency Recovery & Rebuild Fund');
      expect(serialized).toContain('Dominica Roseau River Basin Flood Relief');
      expect(serialized).toContain('100% Mutual Aid Guarantee');
    });

    it('applies category, territory, query, and verified filters correctly', async () => {
      const mockEq = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockReturnThis();
      const mockOr = vi.fn().mockReturnThis();
      const mockLimit = vi.fn().mockResolvedValue({ data: [mockCampaigns[0]], error: null });

      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: mockEq,
        order: mockOrder,
        or: mockOr,
        limit: mockLimit,
      };

      const mockSupabase = {
        from: vi.fn(() => mockQueryBuilder),
      };

      (createSupabaseServerClient as any).mockResolvedValue(mockSupabase);
      (getCurrentUser as any).mockResolvedValue(null);

      const vdom = await ReliefPage({
        searchParams: Promise.resolve({
          category: 'hurricane_relief',
          country: 'JAM',
          q: 'Beryl',
          verified: 'true',
        }),
      });

      expect(mockEq).toHaveBeenCalledWith('category', 'hurricane_relief');
      expect(mockEq).toHaveBeenCalledWith('target_country_iso', 'JAM');
      expect(mockEq).toHaveBeenCalledWith('verification_status', 'verified');
      expect(mockOr).toHaveBeenCalledWith(expect.stringContaining('Beryl'));

      const serialized = serializeVDOM(vdom);
      expect(serialized).toContain('Hurricane Beryl Emergency Recovery & Rebuild Fund');
    });

    it('renders encouraging empty state when no campaigns match filters', async () => {
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      const mockSupabase = {
        from: vi.fn(() => mockQueryBuilder),
      };

      (createSupabaseServerClient as any).mockResolvedValue(mockSupabase);
      (getCurrentUser as any).mockResolvedValue(null);

      const vdom = await ReliefPage({
        searchParams: Promise.resolve({ q: 'NonexistentStorm' }),
      });

      const serialized = serializeVDOM(vdom);
      expect(serialized).toContain('No active relief campaigns found');
      expect(serialized).toMatch(/Launch Relief Fundraiser|Launch a fundraiser/i);
    });
  });
});
