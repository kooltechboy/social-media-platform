import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { FavoriteTargetType, UserFavoriteItem } from '../../packages/social/src/index';
import { scoreRecommendationCandidate, type RecommendationCandidate, type RecommendationContext } from '../../packages/recommendations/src/index';

describe('Favorites System Architecture & Verification', () => {
  describe('Type Contract & Constraints', () => {
    it('accepts valid target types', () => {
      const validTypes: FavoriteTargetType[] = ['creator', 'business', 'community', 'friend', 'topic'];
      expect(validTypes).toHaveLength(5);
    });

    it('enforces UserFavoriteItem structure', () => {
      const favorite: UserFavoriteItem = {
        id: 'fav-123',
        user_id: 'usr-1',
        target_id: 'creator-456',
        target_type: 'creator',
        created_at: '2026-09-17T20:00:00Z',
      };

      expect(favorite.id).toBe('fav-123');
      expect(favorite.user_id).toBe('usr-1');
      expect(favorite.target_id).toBe('creator-456');
      expect(favorite.target_type).toBe('creator');
    });
  });

  describe('Toggle Favorite RPC Logic', () => {
    let mockDb: Map<string, UserFavoriteItem>;

    beforeEach(() => {
      mockDb = new Map();
    });

    // Simulates the behavior of Supabase RPC toggle_favorite
    function toggleFavorite(userId: string, targetId: string, targetType: FavoriteTargetType) {
      const compositeKey = `${userId}:${targetId}:${targetType}`;
      if (mockDb.has(compositeKey)) {
        mockDb.delete(compositeKey);
        return { status: 'removed', target_id: targetId, target_type: targetType };
      } else {
        const item: UserFavoriteItem = {
          id: `fav-${Date.now()}`,
          user_id: userId,
          target_id: targetId,
          target_type: targetType,
          created_at: new Date().toISOString(),
        };
        mockDb.set(compositeKey, item);
        return { status: 'added', target_id: targetId, target_type: targetType };
      }
    }

    it('adds favorite on first call', () => {
      const res = toggleFavorite('usr-1', 'creator-456', 'creator');
      expect(res.status).toBe('added');
      expect(res.target_id).toBe('creator-456');
      expect(res.target_type).toBe('creator');
      expect(mockDb.size).toBe(1);
    });

    it('removes favorite on second call (toggle)', () => {
      toggleFavorite('usr-1', 'creator-456', 'creator');
      const res = toggleFavorite('usr-1', 'creator-456', 'creator');
      expect(res.status).toBe('removed');
      expect(mockDb.size).toBe(0);
    });

    it('isolates favorites across different target types for the same target_id', () => {
      const res1 = toggleFavorite('usr-1', 'id-100', 'creator');
      const res2 = toggleFavorite('usr-1', 'id-100', 'business');
      expect(res1.status).toBe('added');
      expect(res2.status).toBe('added');
      expect(mockDb.size).toBe(2);
    });

    it('isolates favorites between different users', () => {
      toggleFavorite('usr-1', 'creator-456', 'creator');
      toggleFavorite('usr-2', 'creator-456', 'creator');
      expect(mockDb.size).toBe(2);

      toggleFavorite('usr-1', 'creator-456', 'creator');
      expect(mockDb.size).toBe(1);
      expect(mockDb.has('usr-2:creator-456:creator')).toBe(true);
    });
  });

  describe('Recommendation Feed Favorites Synergy', () => {
    it('boosts candidate score by exactly 35 when favorited', () => {
      const candidate: RecommendationCandidate = {
        id: 'store-kingston',
        entityType: 'business',
        data: {},
      };

      const unadornedContext: RecommendationContext = {
        viewerId: 'usr-buyer',
      };

      const favoritedContext: RecommendationContext = {
        viewerId: 'usr-buyer',
        favoriteIds: new Set(['store-kingston']),
      };

      const unadornedResult = scoreRecommendationCandidate(candidate, unadornedContext);
      const favoritedResult = scoreRecommendationCandidate(candidate, favoritedContext);

      expect(unadornedResult).not.toBeNull();
      expect(favoritedResult).not.toBeNull();
      expect(favoritedResult!.score - unadornedResult!.score).toBe(35);
    });
  });
});
