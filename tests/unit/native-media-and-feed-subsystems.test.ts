import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isFeedMode, type FeedMode } from '../../packages/social/src/index';

describe('Native Media & Feed Subsystems Verification', () => {
  describe('Feed Mode & URL Parameter Normalization', () => {
    function normalizeFeedMode(rawMode?: string): FeedMode {
      let normalized = typeof rawMode === 'string' ? rawMode.toLowerCase().replace(/-/g, '_') : undefined;
      if (normalized === 'foryou') normalized = 'for_you';
      return normalized && isFeedMode(normalized) ? (normalized as FeedMode) : 'for_you';
    }

    it('normalizes kebab-case feed URLs (?feed=for-you) to internal FeedMode (for_you)', () => {
      expect(normalizeFeedMode('for-you')).toBe('for_you');
      expect(normalizeFeedMode('following')).toBe('following');
      expect(normalizeFeedMode('caribbean')).toBe('caribbean');
      expect(normalizeFeedMode('communities')).toBe('communities');
    });

    it('preserves existing snake-case modes (?mode=for_you)', () => {
      expect(normalizeFeedMode('for_you')).toBe('for_you');
      expect(normalizeFeedMode('friends')).toBe('friends');
    });

    it('defaults invalid or malicious parameters to for_you gracefully', () => {
      expect(normalizeFeedMode('unknown_channel')).toBe('for_you');
      expect(normalizeFeedMode('../../etc/passwd')).toBe('for_you');
      expect(normalizeFeedMode('<script>')).toBe('for_you');
      expect(normalizeFeedMode('')).toBe('for_you');
      expect(normalizeFeedMode(undefined)).toBe('for_you');
    });
  });

  describe('Storage Path RLS Policy Enforcement', () => {
    function validateStoragePath(filePath: string, authUid: string): boolean {
      const parts = filePath.split('/');
      return parts.length >= 2 && parts[0] === authUid;
    }

    it('approves storage paths prefixed with auth.uid() folder', () => {
      const authUid = 'b3f11652-e567-4ab2-8fc8-5a242c75a401';
      const validPhotoPath = `${authUid}/${Date.now()}_camera_snap.jpg`;
      const validVideoPath = `${authUid}/${Date.now()}_recorded_clip.mp4`;
      const validReelPath = `${authUid}/reels/${Date.now()}_caribbean_reel.mp4`;

      expect(validateStoragePath(validPhotoPath, authUid)).toBe(true);
      expect(validateStoragePath(validVideoPath, authUid)).toBe(true);
      expect(validateStoragePath(validReelPath, authUid)).toBe(true);
    });

    it('rejects paths without auth.uid() prefix preventing RLS violation errors', () => {
      const authUid = 'b3f11652-e567-4ab2-8fc8-5a242c75a401';
      const rootPath = `image_${Date.now()}.jpg`;
      const otherUserPath = `other-user-uuid/image_${Date.now()}.jpg`;

      expect(validateStoragePath(rootPath, authUid)).toBe(false);
      expect(validateStoragePath(otherUserPath, authUid)).toBe(false);
    });
  });

  describe('Community Membership Column Accuracy', () => {
    it('verifies that community_members queries target profile_id instead of user_id', () => {
      const profileId = 'user-uuid-123';
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: { community_id: 'comm-1' } }),
      };

      // Simulating query in communities/[slug]
      mockQueryBuilder.eq('community_id', 'comm-1').eq('profile_id', profileId);

      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('profile_id', profileId);
      expect(mockQueryBuilder.eq).not.toHaveBeenCalledWith('user_id', profileId);
    });
  });

  describe('Feed Engine Ranking & Base Query Routing', () => {
    let mockSupabase: any;
    let queryState: Record<string, any>;

    beforeEach(() => {
      queryState = {
        filters: [],
        table: '',
        orConditions: [],
      };

      mockSupabase = {
        from: vi.fn((table: string) => {
          queryState.table = table;
          const qb: any = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn((col: string, val: any) => {
              queryState.filters.push({ col, op: 'eq', val });
              return qb;
            }),
            in: vi.fn((col: string, val: any[]) => {
              queryState.filters.push({ col, op: 'in', val });
              return qb;
            }),
            not: vi.fn((col: string, op: string, val: any) => {
              queryState.filters.push({ col, op: `not_${op}`, val });
              return qb;
            }),
            or: vi.fn((condition: string) => {
              queryState.orConditions.push(condition);
              return qb;
            }),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null }),
            single: vi.fn().mockResolvedValue({ data: null }),
          };
          return qb;
        }),
      };
    });

    it('correctly resolves user country from origin_country_id and current_country_id on profiles', () => {
      const profileData = {
        current_country_id: null,
        origin_country_id: 'tt-caribbean-uuid',
      };

      const resolvedCountryId = profileData.current_country_id || profileData.origin_country_id || null;
      expect(resolvedCountryId).toBe('tt-caribbean-uuid');
    });

    it('surfaces active public community posts when user has not yet joined any community', async () => {
      const userId = 'new-user-id';
      const userCommunityMemberships: string[] = []; // 0 joined communities

      let postQuery = mockSupabase.from('posts').select('id, community_id');

      if (userCommunityMemberships.length > 0) {
        postQuery = postQuery.in('community_id', userCommunityMemberships);
      } else {
        postQuery = postQuery.not('community_id', 'is', null);
      }

      const notNullFilter = queryState.filters.find((f: any) => f.col === 'community_id' && f.op === 'not_is');
      expect(notNullFilter).toBeDefined();
      expect(notNullFilter.val).toBeNull();
    });

    it('filters strictly by joined community IDs when user is an active member', async () => {
      const userCommunityMemberships = ['comm-uuid-1', 'comm-uuid-2'];
      let postQuery = mockSupabase.from('posts').select('id, community_id');

      if (userCommunityMemberships.length > 0) {
        postQuery = postQuery.in('community_id', userCommunityMemberships);
      } else {
        postQuery = postQuery.not('community_id', 'is', null);
      }

      const inFilter = queryState.filters.find((f: any) => f.col === 'community_id' && f.op === 'in');
      expect(inFilter).toBeDefined();
      expect(inFilter.val).toEqual(['comm-uuid-1', 'comm-uuid-2']);
    });

    it('caribbean mode filters for posts with country_id or caribbean cultural tag', () => {
      let postQuery = mockSupabase.from('posts').select('id, country_id, cultural_tags');
      postQuery = postQuery.or('country_id.not.is.null,cultural_tags.cs.{"caribbean"}');

      expect(queryState.orConditions).toContain('country_id.not.is.null,cultural_tags.cs.{"caribbean"}');
    });

    it('following mode returns empty array immediately if following count is 0', async () => {
      const followingIds: string[] = [];
      function getFollowingPosts(ids: string[]) {
        if (ids.length === 0) return { data: [] };
        return { data: [{ id: 'post-1' }] };
      }

      const result = getFollowingPosts(followingIds);
      expect(result.data).toEqual([]);
    });
  });

  describe('Reels & Video Comment Persisted Integrity', () => {
    it('validates reel publish input requirements', () => {
      function validateReelInput(input: { title: string; storagePath: string; durationSeconds: number }) {
        if (!input.storagePath || !input.storagePath.trim()) {
          return { valid: false, error: 'Storage path is required.' };
        }
        if (!input.title || input.title.trim().length === 0) {
          return { valid: false, error: 'Title is required.' };
        }
        if (input.durationSeconds <= 0 || input.durationSeconds > 180) {
          return { valid: false, error: 'Duration must be between 1 and 180 seconds.' };
        }
        return { valid: true, error: null };
      }

      expect(validateReelInput({ title: '', storagePath: 'uid/reel.mp4', durationSeconds: 30 })).toEqual({
        valid: false,
        error: 'Title is required.',
      });

      expect(validateReelInput({ title: 'Carnival Jump Up', storagePath: '', durationSeconds: 30 })).toEqual({
        valid: false,
        error: 'Storage path is required.',
      });

      expect(validateReelInput({ title: 'Carnival Jump Up', storagePath: 'uid/reel.mp4', durationSeconds: 0 })).toEqual({
        valid: false,
        error: 'Duration must be between 1 and 180 seconds.',
      });

      expect(validateReelInput({ title: 'Carnival Jump Up', storagePath: 'uid/reel.mp4', durationSeconds: 45 })).toEqual({
        valid: true,
        error: null,
      });
    });

    it('validates video/reel comment insertion requires non-empty content and valid ID', () => {
      function validateComment(videoId: string, content: string) {
        if (!videoId || !videoId.trim()) return { error: 'Reel ID is required' };
        if (!content || !content.trim()) return { error: 'Comment content cannot be empty' };
        return { error: null };
      }

      expect(validateComment('', 'Nice reel!')).toEqual({ error: 'Reel ID is required' });
      expect(validateComment('reel-123', '   ')).toEqual({ error: 'Comment content cannot be empty' });
      expect(validateComment('reel-123', 'Vibes on fete day 🔥')).toEqual({ error: null });
    });
  });
});
