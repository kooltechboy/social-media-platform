import { describe, it, expect } from 'vitest';
import {
  buildFeedQuery,
  validateComposer,
  resolveFeedVisibility,
  isFeedMode,
  POST_MAX_LENGTH,
} from '../../packages/social/src/index';
import { encodeCursor, decodeCursor } from '../../packages/database/src/index';

describe('Feed queries (multi-mode, cursor pagination)', () => {
  it('rejects invalid feed modes', () => {
    expect(isFeedMode('for_you')).toBe(true);
    expect(isFeedMode('hot')).toBe(false);
  });

  it('builds a keyset-paginated following feed', () => {
    const { statement } = buildFeedQuery({ viewerId: 'usr_1', mode: 'following' });
    expect(statement.text).toContain('ORDER BY created_at DESC, id DESC');
    expect(statement.text).toContain('LIMIT 26');
    expect(statement.text).not.toContain('OFFSET');
  });

  it('requires communityId for the communities mode', () => {
    expect(() => buildFeedQuery({ viewerId: 'usr_1', mode: 'communities' })).toThrow('requires communityId');
  });

  it('applies cursor predicates as keyset comparison', () => {
    const cursor = encodeCursor({ sortKey: '2026-08-01T00:00:00Z', id: '00000000-0000-0000-0000-000000000001' });
    const { statement } = buildFeedQuery({ viewerId: 'usr_1', mode: 'latest', cursor });
    expect(statement.text).toContain('(created_at, id) <');
    expect(statement.params).toContain('2026-08-01T00:00:00Z');
  });

  it('rejects malformed cursors', () => {
    expect(() => decodeCursor('not-a-cursor!!')).toThrow();
  });
});

describe('Composer validation', () => {
  const base = { authorId: 'usr_1', visibility: 'public' as const, mediaCount: 0 };

  it('rejects empty posts and oversized content', () => {
    expect(validateComposer({ ...base, content: '   ' }).valid).toBe(false);
    expect(validateComposer({ ...base, content: 'a'.repeat(POST_MAX_LENGTH + 1) }).valid).toBe(false);
  });

  it('extracts hashtags and mentions', () => {
    const result = validateComposer({ ...base, content: 'Love this #Carnival2026 from @soca_nights in #Kingston!' });
    expect(result.hashtags).toEqual(['carnival2026', 'kingston']);
    expect(result.mentions).toEqual(['soca_nights']);
    expect(result.valid).toBe(true);
  });

  it('enforces the media cap', () => {
    expect(validateComposer({ ...base, content: 'hi', mediaCount: 11 }).errors[0]).toContain('at most 10');
  });
});

describe('Graph-aware visibility resolution', () => {
  const graph = {
    viewerId: 'usr_1',
    followingIds: new Set(['creator_1']),
    friendIds: new Set(['friend_1']),
    blockedIds: new Set(['bad_actor']),
    mutedIds: new Set(['loud_poster']),
  };

  it('respects visibility levels and graph membership', () => {
    expect(resolveFeedVisibility('creator_1', 'followers', graph)).toBe(true);
    expect(resolveFeedVisibility('stranger', 'followers', graph)).toBe(false);
    expect(resolveFeedVisibility('friend_1', 'friends', graph)).toBe(true);
    expect(resolveFeedVisibility('anyone', 'private', graph)).toBe(false);
  });

  it('always filters blocked and muted authors', () => {
    expect(resolveFeedVisibility('bad_actor', 'public', graph)).toBe(false);
    expect(resolveFeedVisibility('loud_poster', 'public', graph)).toBe(false);
  });

  it('lets the author always see their own posts', () => {
    expect(resolveFeedVisibility('usr_1', 'private', graph)).toBe(true);
  });
});
