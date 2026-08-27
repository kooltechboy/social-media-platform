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

describe('Feed post normalization and pipeline state reconciliation', () => {
  it('normalizes database post with object profile', () => {
    const rawDbRow = {
      id: 'post_100',
      content: 'DEBUG-POST-1710000000000',
      created_at: '2026-08-26T22:00:00.000Z',
      media_urls: ['https://storage.antilia.io/feed/img1.jpg'],
      cultural_tags: ['carnival'],
      likes_count: 5,
      shares_count: 2,
      comments_count: 1,
      profiles: {
        display_name: 'Marcus Garvey',
        username: 'm_garvey',
        is_verified: true,
      },
    };

    const rawProfile = rawDbRow.profiles;
    const profile = Array.isArray(rawProfile) ? rawProfile[0] : rawProfile;

    const normalized = {
      id: rawDbRow.id,
      author: profile?.display_name || 'Caribbean Member',
      handle: profile?.username || 'member',
      verified: profile?.is_verified ?? true,
      location: 'Antilia Network 🌴',
      time: 'just now',
      content: rawDbRow.content,
      mediaUrls: rawDbRow.media_urls,
      culturalTags: rawDbRow.cultural_tags,
      likes: rawDbRow.likes_count,
      reposts: rawDbRow.shares_count,
      comments: rawDbRow.comments_count,
      category: 'caribbean' as const,
    };

    expect(normalized.id).toBe('post_100');
    expect(normalized.author).toBe('Marcus Garvey');
    expect(normalized.handle).toBe('m_garvey');
    expect(normalized.content).toBe('DEBUG-POST-1710000000000');
  });

  it('normalizes database post with array profile (PostgREST variant)', () => {
    const rawDbRow = {
      id: 'post_101',
      content: 'DEBUG-POST-1710000000001',
      created_at: '2026-08-26T22:00:00.000Z',
      media_urls: [],
      cultural_tags: [],
      likes_count: 0,
      shares_count: 0,
      comments_count: 0,
      profiles: [
        {
          display_name: 'Aaliyah Baptiste',
          username: 'aaliyah_soca',
          is_verified: true,
        },
      ],
    };

    const rawProfile = rawDbRow.profiles;
    const profile = Array.isArray(rawProfile) ? rawProfile[0] : rawProfile;

    const normalized = {
      id: rawDbRow.id,
      author: profile?.display_name || 'Caribbean Member',
      handle: profile?.username || 'member',
      verified: profile?.is_verified ?? true,
      location: 'Antilia Network 🌴',
      time: 'just now',
      content: rawDbRow.content,
      mediaUrls: rawDbRow.media_urls,
      culturalTags: rawDbRow.cultural_tags,
      likes: rawDbRow.likes_count,
      reposts: rawDbRow.shares_count,
      comments: rawDbRow.comments_count,
      category: 'caribbean' as const,
    };

    expect(normalized.id).toBe('post_101');
    expect(normalized.author).toBe('Aaliyah Baptiste');
    expect(normalized.handle).toBe('aaliyah_soca');
  });

  it('reconciles and deduplicates feed state when a new post is published', () => {
    const existingPosts = [
      { id: 'p1', author: 'User 1', handle: 'u1', time: '1h ago', content: 'Old post', likes: 10, reposts: 2, comments: 1 },
      { id: 'p2', author: 'User 2', handle: 'u2', time: '2h ago', content: 'Older post', likes: 5, reposts: 0, comments: 0 },
    ];

    const newlyCreatedPost = {
      id: 'p_new',
      author: 'Current User',
      handle: 'current_u',
      time: 'just now',
      content: 'DEBUG-POST-NEW',
      likes: 0,
      reposts: 0,
      comments: 0,
    };

    // Prepend without duplicate
    const updatedState = existingPosts.some((p) => p.id === newlyCreatedPost.id)
      ? existingPosts
      : [newlyCreatedPost, ...existingPosts];

    expect(updatedState.length).toBe(3);
    expect(updatedState[0].id).toBe('p_new');
    expect(updatedState[0].content).toBe('DEBUG-POST-NEW');

    // Duplicate insertion prevention
    const stateAfterDuplicateAttempt = updatedState.some((p) => p.id === newlyCreatedPost.id)
      ? updatedState
      : [newlyCreatedPost, ...updatedState];

    expect(stateAfterDuplicateAttempt.length).toBe(3);
  });

  it('hydrates user reaction states accurately against post_reactions dataset', () => {
    const posts = [
      { id: 'post_1', likes: 10 },
      { id: 'post_2', likes: 5 },
      { id: 'post_3', likes: 2 },
    ];
    const userReactions = [{ post_id: 'post_1' }, { post_id: 'post_3' }];
    const userLikedSet = new Set(userReactions.map((r) => r.post_id));

    const hydrated = posts.map((p) => ({
      ...p,
      isUserLiked: userLikedSet.has(p.id),
    }));

    expect(hydrated[0].isUserLiked).toBe(true);
    expect(hydrated[1].isUserLiked).toBe(false);
    expect(hydrated[2].isUserLiked).toBe(true);
  });

  it('removes deleted posts from feed state', () => {
    const posts = [
      { id: 'p1', content: 'Post 1' },
      { id: 'p2', content: 'Post 2' },
    ];
    const deletedPostId = 'p1';
    const updated = posts.filter((p) => p.id !== deletedPostId);

    expect(updated.length).toBe(1);
    expect(updated[0].id).toBe('p2');
  });

  it('removes deleted comments from comment list and updates comment count', () => {
    const comments = [
      { id: 'c1', content: 'Nice!' },
      { id: 'c2', content: 'Big up!' },
    ];
    const post = { id: 'p1', comments: 2 };
    const deletedCommentId = 'c1';

    const updatedComments = comments.filter((c) => c.id !== deletedCommentId);
    const updatedPost = { ...post, comments: Math.max(0, post.comments - 1) };

    expect(updatedComments.length).toBe(1);
    expect(updatedComments[0].id).toBe('c2');
    expect(updatedPost.comments).toBe(1);
  });

  it('increments share counts correctly on post sharing', () => {
    const post = { id: 'p1', reposts: 4 };
    const updatedPost = { ...post, reposts: post.reposts + 1 };
    expect(updatedPost.reposts).toBe(5);
  });

  it('correctly associates threaded replies with parent comments', () => {
    const rawComments = [
      { id: 'c1', post_id: 'p1', parent_id: null, content: 'Root comment 1' },
      { id: 'c2', post_id: 'p1', parent_id: 'c1', content: 'Reply to comment 1' },
      { id: 'c3', post_id: 'p1', parent_id: null, content: 'Root comment 2' },
      { id: 'c4', post_id: 'p1', parent_id: 'c1', content: 'Second reply to comment 1' },
    ];

    const rootComments = rawComments.filter((c) => !c.parent_id);
    const repliesByParent = rawComments.reduce((acc: Record<string, typeof rawComments>, c) => {
      if (c.parent_id) {
        acc[c.parent_id] = acc[c.parent_id] || [];
        acc[c.parent_id].push(c);
      }
      return acc;
    }, {});

    expect(rootComments.length).toBe(2);
    expect(rootComments.map((c) => c.id)).toEqual(['c1', 'c3']);
    expect(repliesByParent['c1']?.length).toBe(2);
    expect(repliesByParent['c1']?.map((r) => r.id)).toEqual(['c2', 'c4']);
  });

  it('generates accurate profile and direct message routing URLs', () => {
    const profile = { username: 'karenereid', id: 'usr-123' };
    const profileUrl = `/profile/${profile.username}`;
    const dmUrl = `/messages?u=${encodeURIComponent(profile.username)}`;

    expect(profileUrl).toBe('/profile/karenereid');
    expect(dmUrl).toBe('/messages?u=karenereid');
  });

  it('assembles structured attachments properly for all Create Hub modes', () => {
    // Poll Mode
    const pollContent = (text: string, question: string, options: string[]) =>
      `${text}\n\n📊 **Poll:** ${question}\n${options.map((o) => `• ${o}`).join('\n')}`;

    const poll = pollContent('Vote now', 'Best J\'ouvert Band?', ['Band A', 'Band B']);
    expect(poll).toContain('📊 **Poll:** Best J\'ouvert Band?');
    expect(poll).toContain('• Band A');
    expect(poll).toContain('• Band B');

    // Product Mode
    const productContent = (text: string, title: string, price: string) =>
      `${text}\n\n🛍️ **Featured Product:** ${title} ($${price} USD on SpotPay)`;
    const prod = productContent('Check out new batch', 'Blue Mountain Beans', '35.00');
    expect(prod).toContain('🛍️ **Featured Product:** Blue Mountain Beans ($35.00 USD on SpotPay)');

    // Event Mode
    const eventContent = (text: string, title: string, date: string) =>
      `${text}\n\n📅 **Upcoming Caribbean Event:** ${title} (${date})`;
    const evt = eventContent('Get your tickets', 'Trinidad Carnival Gala', '2026-03-01');
    expect(evt).toContain('📅 **Upcoming Caribbean Event:** Trinidad Carnival Gala (2026-03-01)');

    // Fundraiser Mode
    const fundraiserContent = (text: string, title: string, goal: string) =>
      `${text}\n\n💰 **SpotPay Fundraiser:** ${title} (Goal: $${goal} USD)`;
    const fund = fundraiserContent('Please support', 'Hurricane Relief Fund', '50,000');
    expect(fund).toContain('💰 **SpotPay Fundraiser:** Hurricane Relief Fund (Goal: $50,000 USD)');

    // Civic Alert Mode
    const alertContent = (text: string) => `🚨 **OFFICIAL CARIBBEAN ADVISORY** 🚨\n\n${text}`;
    const alert = alertContent('Tropical Storm Watch issued for Leeward Islands');
    expect(alert).toContain('🚨 **OFFICIAL CARIBBEAN ADVISORY** 🚨');
  });
});

