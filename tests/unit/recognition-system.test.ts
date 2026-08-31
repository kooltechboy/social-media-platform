import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EligibilityEngine } from '../../apps/web/src/lib/recognition/eligibility-engine';
import { RecognitionService } from '../../apps/web/src/lib/recognition/recognition-service';

describe('TUKUBI Recognition & Rewards Subsystem', () => {
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = {
      from: vi.fn(),
      rpc: vi.fn(),
    };
  });

  describe('EligibilityEngine — Founder Program Eligibility', () => {
    it('rejects eligibility if profile is missing display_name or username', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { id: 'usr-1', username: '', display_name: null },
            }),
          }),
        }),
      });

      const engine = new EligibilityEngine(mockSupabase);
      const result = await engine.evaluateFounderEligibility('usr-1', 'founding_1000');

      expect(result.eligible).toBe(false);
      expect(result.reason).toContain('Profile must have username and display name completed');
    });

    it('rejects eligibility if founder program is closed or capped', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: 'usr-1', username: 'dan', display_name: 'Daniel Williams' },
                }),
              }),
            }),
          };
        }
        if (table === 'founder_programs') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { max_members: 1000, current_count: 1000, is_closed: true },
                }),
              }),
            }),
          };
        }
        return {};
      });

      const engine = new EligibilityEngine(mockSupabase);
      const result = await engine.evaluateFounderEligibility('usr-1', 'founding_1000');

      expect(result.eligible).toBe(false);
      expect(result.reason).toContain('maximum allocation limit');
    });

    it('approves eligibility for complete profiles when capacity exists', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: 'usr-1', username: 'dan', display_name: 'Daniel Williams' },
                }),
              }),
            }),
          };
        }
        if (table === 'founder_programs') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { max_members: 1000, current_count: 47, is_closed: false },
                }),
              }),
            }),
          };
        }
        return {};
      });

      const engine = new EligibilityEngine(mockSupabase);
      const result = await engine.evaluateFounderEligibility('usr-1', 'founding_1000');

      expect(result.eligible).toBe(true);
    });
  });

  describe('RecognitionService — Operations', () => {
    it('fetches consolidated recognition summary with fallback defaults', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: null, error: null });

      const service = new RecognitionService(mockSupabase);
      const summary = await service.getProfileRecognition('usr-1');

      expect(summary.founder.is_founder).toBe(false);
      expect(summary.reputation.level_name).toBe('Newcomer');
      expect(summary.badges).toEqual([]);
      expect(summary.achievements).toEqual([]);
    });

    it('claims founder status atomically through database RPC', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: {
          success: true,
          founder_number: 48,
          formatted_number: '#0048',
          program_name: 'TUKUBI Founding 1000',
          designation: 'TUKUBI Founding 1000',
        },
        error: null,
      });

      const service = new RecognitionService(mockSupabase);
      const result = await service.claimFounderStatus('usr-1', 'founding_1000');

      expect(result.success).toBe(true);
      expect(result.founder_number).toBe(48);
      expect(result.formatted_number).toBe('#0048');
    });

    it('awards badges through secure award_badge RPC', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: {
          success: true,
          badge_id: 'badge-123',
          badge_name: 'Community Builder',
        },
        error: null,
      });

      const service = new RecognitionService(mockSupabase);
      const result = await service.awardBadge('usr-1', 'community_builder', 'Test award');

      expect(result.success).toBe(true);
      expect(result.badge_name).toBe('Community Builder');
    });
  });
});
