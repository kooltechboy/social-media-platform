import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VALID_REACTION_TYPES, type ReactionType } from '../../apps/web/src/components/reactions/reaction-picker';
import { hydratePostsEngagement } from '../../apps/web/src/lib/feed/hydrate-posts';

describe('TUKUBI Social Interactions Integrity & Unification Verification', () => {
  describe('1. Reaction Types & Validation Integrity', () => {
    it('supports all 8 authentic Caribbean reaction types', () => {
      const expectedReactions: ReactionType[] = [
        'like',
        'love',
        'fire',
        'celebrate',
        'laugh',
        'wow',
        'sad',
        'angry',
      ];
      expect(VALID_REACTION_TYPES).toHaveLength(8);
      for (const rx of expectedReactions) {
        expect(VALID_REACTION_TYPES).toContain(rx);
      }
    });

    it('rejects invalid or unauthorized reaction strings', () => {
      const invalidTypes = ['upvote', 'downvote', 'thumbs_down', 'dislike', 'fake', '<script>', ''];
      for (const t of invalidTypes) {
        expect(VALID_REACTION_TYPES.includes(t as any)).toBe(false);
      }
    });
  });

  describe('2. Reaction State Machine (Upsert, Swap, Toggle-Off)', () => {
    let mockReactionsTable: Map<string, { id: string; user_id: string; post_id: string; reaction_type: ReactionType }>;

    beforeEach(() => {
      mockReactionsTable = new Map();
    });

    function handleToggleReaction(
      userId: string,
      postId: string,
      reactionType: ReactionType
    ): { userReaction: ReactionType | null; action: 'added' | 'updated' | 'removed' } {
      const key = `${userId}:${postId}`;
      const existing = mockReactionsTable.get(key);

      if (existing) {
        if (existing.reaction_type === reactionType) {
          // Toggle off
          mockReactionsTable.delete(key);
          return { userReaction: null, action: 'removed' };
        } else {
          // Change reaction (e.g. from like to fire)
          mockReactionsTable.set(key, { ...existing, reaction_type: reactionType });
          return { userReaction: reactionType, action: 'updated' };
        }
      } else {
        // First-time reaction
        mockReactionsTable.set(key, {
          id: `rx-${Date.now()}`,
          user_id: userId,
          post_id: postId,
          reaction_type: reactionType,
        });
        return { userReaction: reactionType, action: 'added' };
      }
    }

    it('adds reaction on first click', () => {
      const res = handleToggleReaction('usr-1', 'post-1', 'like');
      expect(res.action).toBe('added');
      expect(res.userReaction).toBe('like');
      expect(mockReactionsTable.size).toBe(1);
    });

    it('swaps reaction type when clicking a different emoji', () => {
      handleToggleReaction('usr-1', 'post-1', 'like');
      const res = handleToggleReaction('usr-1', 'post-1', 'fire');
      expect(res.action).toBe('updated');
      expect(res.userReaction).toBe('fire');
      expect(mockReactionsTable.size).toBe(1);
      expect(mockReactionsTable.get('usr-1:post-1')?.reaction_type).toBe('fire');
    });

    it('removes reaction when clicking the same reaction type (toggle-off)', () => {
      handleToggleReaction('usr-1', 'post-1', 'love');
      const res = handleToggleReaction('usr-1', 'post-1', 'love');
      expect(res.action).toBe('removed');
      expect(res.userReaction).toBeNull();
      expect(mockReactionsTable.size).toBe(0);
    });
  });

  describe('3. Database Trigger Simulation (Zero Counter Drift)', () => {
    interface PostState {
      id: string;
      author_id: string;
      likes_count: number;
      comments_count: number;
      shares_count: number;
    }

    interface ProfileCountState {
      profile_id: string;
      likes_received_count: number;
    }

    let posts: Map<string, PostState>;
    let profileCounts: Map<string, ProfileCountState>;
    let postReactions: Array<{ user_id: string; post_id: string; reaction_type: string }>;
    let comments: Array<{ id: string; post_id: string }>;
    let shares: Array<{ id: string; post_id: string }>;

    beforeEach(() => {
      posts = new Map([
        ['post-100', { id: 'post-100', author_id: 'author-1', likes_count: 0, comments_count: 0, shares_count: 0 }],
      ]);
      profileCounts = new Map([
        ['author-1', { profile_id: 'author-1', likes_received_count: 0 }],
      ]);
      postReactions = [];
      comments = [];
      shares = [];
    });

    // Simulates trigger sync_post_reactions_count()
    function triggerSyncPostReactions(targetPostId: string) {
      const p = posts.get(targetPostId);
      if (!p) return;
      const count = postReactions.filter((r) => r.post_id === targetPostId).length;
      p.likes_count = count;

      // Also sync author's likes_received_count
      const authorPosts = Array.from(posts.values()).filter((item) => item.author_id === p.author_id);
      const totalAuthorLikes = authorPosts.reduce((acc, curr) => acc + curr.likes_count, 0);
      const prof = profileCounts.get(p.author_id);
      if (prof) {
        prof.likes_received_count = totalAuthorLikes;
      }
    }

    // Simulates trigger sync_post_comments_count()
    function triggerSyncPostComments(targetPostId: string) {
      const p = posts.get(targetPostId);
      if (!p) return;
      p.comments_count = comments.filter((c) => c.post_id === targetPostId).length;
    }

    // Simulates trigger sync_post_shares_count()
    function triggerSyncPostShares(targetPostId: string) {
      const p = posts.get(targetPostId);
      if (!p) return;
      p.shares_count = shares.filter((s) => s.post_id === targetPostId).length;
    }

    it('synchronizes likes_count and profile likes_received_count on reaction insert and delete', () => {
      // 1. Insert reaction from user-1
      postReactions.push({ user_id: 'user-1', post_id: 'post-100', reaction_type: 'celebrate' });
      triggerSyncPostReactions('post-100');
      expect(posts.get('post-100')?.likes_count).toBe(1);
      expect(profileCounts.get('author-1')?.likes_received_count).toBe(1);

      // 2. Insert reaction from user-2
      postReactions.push({ user_id: 'user-2', post_id: 'post-100', reaction_type: 'fire' });
      triggerSyncPostReactions('post-100');
      expect(posts.get('post-100')?.likes_count).toBe(2);
      expect(profileCounts.get('author-1')?.likes_received_count).toBe(2);

      // 3. Delete user-1 reaction
      postReactions = postReactions.filter((r) => !(r.user_id === 'user-1' && r.post_id === 'post-100'));
      triggerSyncPostReactions('post-100');
      expect(posts.get('post-100')?.likes_count).toBe(1);
      expect(profileCounts.get('author-1')?.likes_received_count).toBe(1);
    });

    it('synchronizes comments_count directly from actual child rows without mutable increments', () => {
      comments.push({ id: 'c-1', post_id: 'post-100' });
      triggerSyncPostComments('post-100');
      expect(posts.get('post-100')?.comments_count).toBe(1);

      comments.push({ id: 'c-2', post_id: 'post-100' });
      triggerSyncPostComments('post-100');
      expect(posts.get('post-100')?.comments_count).toBe(2);

      // Delete c-1
      comments = comments.filter((c) => c.id !== 'c-1');
      triggerSyncPostComments('post-100');
      expect(posts.get('post-100')?.comments_count).toBe(1);
    });

    it('synchronizes shares_count from actual child post_shares rows', () => {
      shares.push({ id: 's-1', post_id: 'post-100' });
      triggerSyncPostShares('post-100');
      expect(posts.get('post-100')?.shares_count).toBe(1);

      shares.push({ id: 's-2', post_id: 'post-100' });
      triggerSyncPostShares('post-100');
      expect(posts.get('post-100')?.shares_count).toBe(2);
    });
  });

  describe('4. Canonical Hydration Helper (hydratePostsEngagement)', () => {
    let mockSupabase: any;

    beforeEach(() => {
      mockSupabase = {
        from: vi.fn((table: string) => {
          const queryBuilder: any = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            in: vi.fn().mockImplementation((col: string, vals: any[]) => {
              if (table === 'post_reactions') {
                return Promise.resolve({
                  data: [
                    { post_id: 'p-1', reaction_type: 'fire' },
                    { post_id: 'p-2', reaction_type: 'love' },
                  ],
                  error: null,
                });
              }
              if (table === 'saved_posts') {
                return Promise.resolve({
                  data: [{ post_id: 'p-1' }],
                  error: null,
                });
              }
              if (table === 'user_favorites') {
                return Promise.resolve({
                  data: [{ target_id: 'author-p1' }],
                  error: null,
                });
              }
              if (table === 'hidden_posts') {
                return Promise.resolve({
                  data: [{ post_id: 'p-3' }],
                  error: null,
                });
              }
              return Promise.resolve({ data: [], error: null });
            }),
          };
          return queryBuilder;
        }),
      };
    });

    it('hydrates reaction, saved status, author favorites, and filters hidden posts', async () => {
      const rawPosts = [
        {
          id: 'p-1',
          author_id: 'author-p1',
          content: 'Barbados Crop Over vibes!',
          media_urls: ['https://example.com/cropover.jpg'],
          cultural_tags: ['Barbados', 'Carnival'],
          likes_count: 42,
          comments_count: 5,
          shares_count: 12,
          created_at: '2026-09-18T12:00:00Z',
          profiles: {
            username: 'bajan_creator',
            display_name: 'Bajan Creator',
            avatar_url: 'https://example.com/avatar.jpg',
            is_verified: true,
          },
        },
        {
          id: 'p-2',
          author_id: 'author-p2',
          content: 'Trinidad steelpan sunset',
          media_urls: [],
          cultural_tags: ['Trinidad', 'Steelpan'],
          likes_count: 10,
          comments_count: 2,
          shares_count: 1,
          created_at: '2026-09-18T14:00:00Z',
          profiles: [
            // Single-item array from foreign key join normalization
            {
              username: 'trini_pan',
              display_name: 'Trini Pan',
              avatar_url: null,
              is_verified: false,
            },
          ],
        },
        {
          id: 'p-3',
          author_id: 'author-p3',
          content: 'Hidden post should be excluded from feed by default',
          media_urls: [],
          cultural_tags: [],
          likes_count: 0,
          comments_count: 0,
          shares_count: 0,
          created_at: '2026-09-18T15:00:00Z',
          profiles: null,
        },
      ];

      const hydrated = await hydratePostsEngagement(rawPosts, mockSupabase, {
        currentUserId: 'viewer-user-id',
      });

      // p-3 must be filtered out because it is in hidden_posts
      expect(hydrated).toHaveLength(2);

      // p-1 assertions
      const p1 = hydrated.find((p) => p.id === 'p-1');
      expect(p1).toBeDefined();
      expect(p1?.userReaction).toBe('fire');
      expect(p1?.isUserLiked).toBe(true);
      expect(p1?.isSaved).toBe(true);
      expect(p1?.isAuthorFavorited).toBe(true);
      expect(p1?.author).toBe('Bajan Creator');
      expect(p1?.handle).toBe('bajan_creator');
      expect(p1?.verified).toBe(true);
      expect(p1?.likes).toBe(42);
      expect(p1?.comments).toBe(5);
      expect(p1?.reposts).toBe(12);

      // p-2 assertions (array profile normalized)
      const p2 = hydrated.find((p) => p.id === 'p-2');
      expect(p2).toBeDefined();
      expect(p2?.userReaction).toBe('love');
      expect(p2?.isUserLiked).toBe(true);
      expect(p2?.isSaved).toBe(false);
      expect(p2?.isAuthorFavorited).toBe(false);
      expect(p2?.author).toBe('Trini Pan');
      expect(p2?.handle).toBe('trini_pan');
      expect(p2?.verified).toBe(false);
    });

    it('preserves hidden posts when includeHidden is true (permalink and saved views)', async () => {
      const rawPosts = [
        {
          id: 'p-3',
          author_id: 'author-p3',
          content: 'Hidden post viewed directly via permalink',
          media_urls: [],
          cultural_tags: [],
          likes_count: 5,
          comments_count: 1,
          shares_count: 0,
          created_at: '2026-09-18T15:00:00Z',
          profiles: {
            username: 'carib_user',
            display_name: 'Caribbean User',
          },
        },
      ];

      const hydrated = await hydratePostsEngagement(rawPosts, mockSupabase, {
        currentUserId: 'viewer-user-id',
        includeHidden: true,
      });

      expect(hydrated).toHaveLength(1);
      expect(hydrated[0].id).toBe('p-3');
    });

    it('handles unauthenticated visitors gracefully without running user queries', async () => {
      const rawPosts = [
        {
          id: 'p-10',
          author_id: 'author-10',
          content: 'Public announcement',
          media_urls: [],
          cultural_tags: [],
          likes_count: 100,
          comments_count: 20,
          shares_count: 5,
          created_at: '2026-09-18T10:00:00Z',
        },
      ];

      const hydrated = await hydratePostsEngagement(rawPosts, mockSupabase, {
        currentUserId: undefined,
      });

      expect(hydrated).toHaveLength(1);
      expect(hydrated[0].userReaction).toBeNull();
      expect(hydrated[0].isSaved).toBe(false);
      expect(hydrated[0].isAuthorFavorited).toBe(false);
      // Verify mockSupabase.from was NOT called for user-specific tables
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });
  });

  describe('5. Hidden Posts Persistence & State Isolation', () => {
    let hiddenPostsStore: Set<string>;

    beforeEach(() => {
      hiddenPostsStore = new Set();
    });

    function hidePost(userId: string, postId: string) {
      const key = `${userId}:${postId}`;
      hiddenPostsStore.add(key);
      return { success: true };
    }

    function unhidePost(userId: string, postId: string) {
      const key = `${userId}:${postId}`;
      hiddenPostsStore.delete(key);
      return { success: true };
    }

    it('isolates hidden state per user and allows undo', () => {
      hidePost('user-A', 'post-99');
      expect(hiddenPostsStore.has('user-A:post-99')).toBe(true);
      expect(hiddenPostsStore.has('user-B:post-99')).toBe(false);

      // Undo
      unhidePost('user-A', 'post-99');
      expect(hiddenPostsStore.has('user-A:post-99')).toBe(false);
    });
  });
});
