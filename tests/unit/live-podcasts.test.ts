import { describe, it, expect } from 'vitest';
import {
  StreamStateMachine,
  GIFT_CATALOG,
  LIVE_CATEGORIES,
  findGift,
  validateGiftPurchase,
  validateStreamCreation,
  formatLiveDuration,
} from '../../packages/live/src/index';
import {
  validateEpisode,
  validateChapters,
  buildRssFeed,
  slugifyPodcast,
  formatTimestamp,
  parseTimestampToSeconds,
} from '../../packages/podcasts/src/index';

describe('Live stream state machine', () => {
  const machine = new StreamStateMachine();
  const stream = {
    creatorId: 'creator_1',
    state: 'live' as const,
    accessLevel: 'subscribers' as const,
  };
  const viewer = { id: 'usr_1', followsCreator: true, isSubscriber: false, communityMember: false };

  it('walks scheduled → live → ended and forbids revivals', () => {
    expect(machine.transition('scheduled', 'live')).toBe('live');
    expect(machine.transition('live', 'ended')).toBe('ended');
    expect(() => machine.transition('ended', 'live')).toThrow('Invalid stream transition');
    expect(machine.canTransition('scheduled', 'ended')).toBe(false);
  });

  it('gates viewing by access level', () => {
    expect(machine.canView(stream, viewer)).toBe(false);
    expect(machine.canView(stream, { ...viewer, isSubscriber: true })).toBe(true);
    expect(machine.canView({ ...stream, accessLevel: 'public' }, viewer)).toBe(true);
    expect(machine.canView(stream, { ...viewer, id: 'creator_1' })).toBe(true);
  });

  it('allows chat only while live and unbanned', () => {
    expect(machine.canChat(stream, { id: 'usr_1', banned: false })).toBe(true);
    expect(machine.canChat(stream, { id: 'usr_1', banned: true })).toBe(false);
    expect(machine.canChat({ ...stream, state: 'ended' }, { id: 'usr_1', banned: false })).toBe(false);
  });

  it('tracks peak viewers monotonically', () => {
    expect(machine.updatePeakViewers(1200, 900)).toBe(1200);
    expect(machine.updatePeakViewers(1200, 1500)).toBe(1500);
  });
});

describe('Live broadcast creation, formatting & categories', () => {
  it('validates stream creation rules and boundaries', () => {
    const valid = validateStreamCreation({
      creatorId: 'creator-uuid',
      title: 'Carnival 2026 Band Launch Live',
      accessLevel: 'public',
    });
    expect(valid.valid).toBe(true);
    expect(valid.errors).toHaveLength(0);

    const emptyTitle = validateStreamCreation({
      creatorId: 'creator-uuid',
      title: '  ',
    });
    expect(emptyTitle.valid).toBe(false);
    expect(emptyTitle.errors[0]).toContain('at least 3 characters');

    const missingCreator = validateStreamCreation({
      creatorId: '',
      title: 'Valid Stream Title',
    });
    expect(missingCreator.valid).toBe(false);
    expect(missingCreator.errors[0]).toContain('Creator ID is required');
  });

  it('formats broadcast elapsed durations accurately', () => {
    expect(formatLiveDuration(45)).toBe('0:45');
    expect(formatLiveDuration(135)).toBe('2:15');
    expect(formatLiveDuration(3672)).toBe('1:01:12');
  });

  it('includes core Caribbean live broadcast categories', () => {
    expect(LIVE_CATEGORIES.length).toBeGreaterThanOrEqual(5);
    expect(LIVE_CATEGORIES).toContain('Carnival & Mas');
    expect(LIVE_CATEGORIES).toContain('Sound Systems & Dub');
    expect(LIVE_CATEGORIES).toContain('Acoustic & Bachata');
  });
});

describe('Live gifts (ledger-backed)', () => {
  it('resolves gift catalog items by key with minor-unit prices and emojis', () => {
    const crown = findGift('carnival_crown');
    expect(crown?.priceMinor).toBe(999);
    expect(crown?.emoji).toBe('👑');
    expect(findGift('nonexistent')).toBeUndefined();
    expect(GIFT_CATALOG.length).toBeGreaterThan(3);
  });

  it('validates gift purchases with idempotency keys', () => {
    const valid = validateGiftPurchase({
      giftKey: 'steel_pan', senderId: 'usr_1', livestreamId: 'ls_1', idempotencyKey: 'gift_key_12345',
    });
    expect(valid.valid).toBe(true);
    expect(
      validateGiftPurchase({ giftKey: 'nope', senderId: 'usr_1', livestreamId: 'ls_1', idempotencyKey: 'gift_key_12345' }).valid,
    ).toBe(false);
    expect(
      validateGiftPurchase({ giftKey: 'steel_pan', senderId: 'usr_1', livestreamId: 'ls_1', idempotencyKey: 'short' }).errors[0],
    ).toContain('Idempotency');
  });
});

describe('Podcast episodes and chapters', () => {
  const episode = {
    podcastId: 'pod_1',
    seasonNumber: 1,
    episodeNumber: 14,
    title: 'Sound System Culture in 2026',
    durationSeconds: 2520,
    audioPath: 'podcasts/pod_1/ep14.mp3',
    isSubscriberOnly: false,
  };

  it('validates publishable episodes', () => {
    expect(validateEpisode(episode).valid).toBe(true);
    expect(validateEpisode({ ...episode, episodeNumber: 0 }).valid).toBe(false);
    expect(validateEpisode({ ...episode, durationSeconds: 5 }).valid).toBe(false);
  });

  it('requires ordered chapters within duration', () => {
    expect(validateChapters([{ startSeconds: 0, title: 'Intro' }, { startSeconds: 600, title: 'Main' }], 2520).valid).toBe(true);
    expect(validateChapters([{ startSeconds: 600, title: 'A' }, { startSeconds: 0, title: 'B' }], 2520).valid).toBe(false);
    expect(validateChapters([{ startSeconds: 9999, title: 'Out of range' }], 2520).valid).toBe(false);
  });

  it('formats and parses timestamps correctly', () => {
    expect(formatTimestamp(125)).toBe('2:05');
    expect(formatTimestamp(3725)).toBe('1:02:05');
    expect(parseTimestampToSeconds('2:05')).toBe(125);
    expect(parseTimestampToSeconds('1:02:05')).toBe(3725);
  });
});

describe('Podcasting 2.0 & iTunes RSS feed generation', () => {
  it('produces a standards-compliant Podcasting 2.0 & iTunes RSS document', () => {
    const xml = buildRssFeed({
      podcastTitle: 'Caribbean Creators "Network"',
      podcastDescription: 'Stories & sounds of the diaspora',
      language: 'en',
      siteUrl: 'https://caribbeanone.app/podcasts/creators',
      feedUrl: 'https://caribbeanone.app/podcasts/creators/rss',
      coverUrl: 'https://cdn.caribbeanone.app/cover.jpg',
      authorName: 'Tukubi Studio',
      category: 'Society & Culture',
      episodes: [
        {
          guid: 'ep-14',
          title: 'Sound System Culture',
          description: 'Dancehall evolution',
          audioUrl: 'https://cdn.caribbeanone.app/ep14.mp3',
          durationSeconds: 2520,
          publishedAt: '2026-08-01T10:00:00Z',
          seasonNumber: 1,
          episodeNumber: 14,
          transcriptUrl: 'https://cdn.caribbeanone.app/podcasts/ep14-transcript.txt',
        },
      ],
    });
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<rss version="2.0"');
    expect(xml).toContain('xmlns:podcast="https://podcastindex.org/namespace/1.0"');
    expect(xml).toContain('xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"');
    expect(xml).toContain('Caribbean Creators &quot;Network&quot;');
    expect(xml).toContain('<itunes:season>1</itunes:season>');
    expect(xml).toContain('<itunes:episode>14</itunes:episode>');
    expect(xml).toContain('<enclosure url="https://cdn.caribbeanone.app/ep14.mp3"');
    expect(xml).toContain('<itunes:duration>42:00</itunes:duration>');
    expect(xml).toContain('<podcast:transcript url="https://cdn.caribbeanone.app/podcasts/ep14-transcript.txt"');
  });

  it('slugifies podcast titles', () => {
    expect(slugifyPodcast('Diaspora Diaries — Toronto Edition')).toBe('diaspora-diaries-toronto-edition');
  });
});
