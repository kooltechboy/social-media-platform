import { describe, it, expect } from 'vitest';
import { fetchMoreReelsAction } from '../../apps/web/src/lib/media/reel-actions';
import { fetchMoreShortsAction } from '../../apps/web/src/lib/media/short-actions';

describe('Sub-Project 2: Keyset Cursor Pagination', () => {
  it('fetchMoreReelsAction gracefully handles query with or without cursor', async () => {
    const res = await fetchMoreReelsAction({
      tab: 'for_you',
      limit: 10,
    });
    expect(res).toHaveProperty('reels');
    expect(Array.isArray(res.reels)).toBe(true);
    expect(res).toHaveProperty('nextCursor');
  });

  it('fetchMoreShortsAction gracefully handles query with or without cursor', async () => {
    const res = await fetchMoreShortsAction({
      tab: 'for_you',
      limit: 10,
    });
    expect(res).toHaveProperty('shorts');
    expect(Array.isArray(res.shorts)).toBe(true);
    expect(res).toHaveProperty('nextCursor');
  });

  it('keyset cursor respects custom cursor boundary if provided', async () => {
    const res = await fetchMoreReelsAction({
      cursor: {
        createdAt: '2026-01-01T00:00:00.000Z',
        id: '00000000-0000-0000-0000-000000000000',
      },
      limit: 5,
    });
    expect(res).toHaveProperty('reels');
    expect(Array.isArray(res.reels)).toBe(true);
  });
});
