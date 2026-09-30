import { describe, it, expect } from 'vitest';
import {
  validateEpisode,
  validateChapters,
  validateTimedLinks,
  buildRssFeed,
  validateRssFeedXml,
  parseWebVttTranscript,
  slugifyPodcast,
  formatTimestamp,
  parseTimestampToSeconds,
  CARIBBEAN_PODCAST_CATEGORIES,
  CARIBBEAN_PODCAST_TERRITORIES,
  EpisodeInput,
  Chapter,
  TimedLink,
  RssFeedInput,
} from '../../packages/podcasts/src/index';

describe('Phase 15 — Podcasting Network & RSS 2.0 Feeds Certification', () => {
  // ===========================================================================
  // 1. Episode Metadata & Boundary Invariants
  // ===========================================================================
  describe('1. Episode Metadata & Publishing Validation', () => {
    const validEpisode: EpisodeInput = {
      podcastId: 'pod_reggae_revolution',
      seasonNumber: 1,
      episodeNumber: 1,
      title: 'Roots, Rock, Reggae: The Sound System Era',
      durationSeconds: 3600, // 1 hour
      audioPath: 'podcasts/audio/ep1.mp3',
      isSubscriberOnly: false,
    };

    it('approves compliant episode input', () => {
      const res = validateEpisode(validEpisode);
      expect(res.valid).toBe(true);
      expect(res.errors.length).toBe(0);
    });

    it('rejects episodes shorter than 15 seconds or exceeding 12 hours', () => {
      const tooShort = validateEpisode({ ...validEpisode, durationSeconds: 10 });
      expect(tooShort.valid).toBe(false);
      expect(tooShort.errors).toContain('Episode is too short to publish');

      const tooLong = validateEpisode({ ...validEpisode, durationSeconds: 50000 });
      expect(tooLong.valid).toBe(false);
      expect(tooLong.errors).toContain('Episode exceeds maximum duration');
    });

    it('enforces season and episode numbers >= 1 and mandatory title/audio', () => {
      const invalid = validateEpisode({
        ...validEpisode,
        seasonNumber: 0,
        episodeNumber: -1,
        title: '',
        audioPath: '',
      });
      expect(invalid.valid).toBe(false);
      expect(invalid.errors).toContain('Season must be >= 1');
      expect(invalid.errors).toContain('Episode number must be >= 1');
      expect(invalid.errors).toContain('Title is required');
      expect(invalid.errors).toContain('Audio is required');
    });
  });

  // ===========================================================================
  // 2. Chapters & Timed Contextual Links
  // ===========================================================================
  describe('2. Chapters & Timed Links Validation', () => {
    it('validates strictly ascending, non-overlapping chapter markers', () => {
      const validChapters: Chapter[] = [
        { startSeconds: 0, title: 'Introduction & Greetings' },
        { startSeconds: 300, title: 'Origin of Dub in Kingston' },
        { startSeconds: 1800, title: 'Interview with King Jammy' },
      ];

      expect(validateChapters(validChapters, 3600).valid).toBe(true);

      const unorderedChapters: Chapter[] = [
        { startSeconds: 500, title: 'Part 2' },
        { startSeconds: 200, title: 'Part 1' },
      ];
      expect(validateChapters(unorderedChapters, 3600).valid).toBe(false);

      const outOfBounds: Chapter[] = [
        { startSeconds: 4000, title: 'Beyond Episode End' },
      ];
      expect(validateChapters(outOfBounds, 3600).valid).toBe(false);
    });

    it('validates timed contextual links within duration boundaries', () => {
      const validLinks: TimedLink[] = [
        {
          timestampSeconds: 600,
          title: 'King Jammy Studio Archive',
          url: 'https://tukubi.com/creators/kingjammy',
          linkKind: 'creator_page',
        },
      ];
      expect(validateTimedLinks(validLinks, 3600).valid).toBe(true);

      const invalidUrl: TimedLink[] = [
        {
          timestampSeconds: 600,
          title: 'Broken Link',
          url: 'not-a-valid-http-url',
        },
      ];
      expect(validateTimedLinks(invalidUrl, 3600).valid).toBe(false);
    });
  });

  // ===========================================================================
  // 3. RSS 2.0 Feed Generation & iTunes Compliance
  // ===========================================================================
  describe('3. RSS 2.0 XML Generation & iTunes / Spotify Compliance', () => {
    const feedInput: RssFeedInput = {
      podcastTitle: 'Caribbean Stories & Sounds',
      podcastDescription: 'The premier weekly podcast exploring Caribbean arts, music, cuisine, and culture.',
      language: 'en',
      siteUrl: 'https://tukubi.com/podcasts/caribbean-stories',
      feedUrl: 'https://api.tukubi.com/podcasts/caribbean-stories/rss.xml',
      coverUrl: 'https://cdn.tukubi.com/podcasts/caribbean-stories/cover.jpg',
      authorName: 'Tukubi Media Network',
      ownerEmail: 'media@tukubi.com',
      category: 'Music',
      subcategory: 'Music Commentary',
      isExplicit: false,
      showType: 'episodic',
      episodes: [
        {
          guid: 'ep_tukubi_001',
          title: 'Episode 1: The Pulse of Carnival',
          description: 'A deep dive into calypso roots and modern soca rhythms in Port of Spain.',
          audioUrl: 'https://cdn.tukubi.com/podcasts/ep1.mp3',
          durationSeconds: 2450,
          publishedAt: '2026-09-01T14:00:00Z',
          seasonNumber: 1,
          episodeNumber: 1,
          episodeType: 'full',
          isExplicit: false,
        },
      ],
    };

    it('generates fully compliant RSS 2.0 XML with iTunes and Podcast Index namespaces', () => {
      const xml = buildRssFeed(feedInput);

      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(xml).toContain('<rss version="2.0"');
      expect(xml).toContain('xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"');
      expect(xml).toContain('xmlns:podcast="https://podcastindex.org/namespace/1.0"');
      expect(xml).toContain('<itunes:author>Tukubi Media Network</itunes:author>');
      expect(xml).toContain('<itunes:explicit>no</itunes:explicit>');
      expect(xml).toContain('<enclosure url="https://cdn.tukubi.com/podcasts/ep1.mp3" type="audio/mpeg"');

      const validation = validateRssFeedXml(xml);
      expect(validation.valid).toBe(true);
      expect(validation.errors.length).toBe(0);
    });

    it('escapes reserved XML special characters properly', () => {
      const feedWithSpecialChars: RssFeedInput = {
        ...feedInput,
        podcastTitle: 'Trinidad & Tobago: Rhythm "Bass" <Vibes>',
        episodes: [],
      };

      const xml = buildRssFeed(feedWithSpecialChars);
      expect(xml).toContain('Trinidad &amp; Tobago: Rhythm &quot;Bass&quot; &lt;Vibes&gt;');
      expect(xml).not.toContain('Trinidad & Tobago: Rhythm "Bass" <Vibes>');
    });
  });

  // ===========================================================================
  // 4. WebVTT Transcripts & Regional Metadata
  // ===========================================================================
  describe('4. WebVTT Transcript Parsing & Territory Distribution', () => {
    it('parses WebVTT transcripts into timed speech segments with speaker attribution', () => {
      const sampleVtt = `WEBVTT

00:00:01.500 --> 00:00:04.200
Host: Welcome back to the Tukubi Podcast Network!

00:00:05.100 --> 00:00:09.800
Guest: Big up everyone tuning in from across the Caribbean and diaspora.
`;

      const parsed = parseWebVttTranscript(sampleVtt);
      expect(parsed.length).toBe(2);
      expect(parsed[0].timestampSeconds).toBe(1);
      expect(parsed[0].speaker).toBe('Host');
      expect(parsed[0].text).toBe('Welcome back to the Tukubi Podcast Network!');

      expect(parsed[1].timestampSeconds).toBe(5);
      expect(parsed[1].speaker).toBe('Guest');
      expect(parsed[1].text).toContain('tuning in from across the Caribbean');
    });

    it('slugifies titles into canonical URL keys', () => {
      expect(slugifyPodcast('Carnival & Calypso 2026: The Big Fete!')).toBe('carnival-calypso-2026-the-big-fete');
    });

    it('verifies registered Caribbean podcast territories and categories', () => {
      expect(CARIBBEAN_PODCAST_CATEGORIES.length).toBeGreaterThanOrEqual(10);
      expect(CARIBBEAN_PODCAST_TERRITORIES.length).toBeGreaterThanOrEqual(25);
      expect(CARIBBEAN_PODCAST_TERRITORIES.some((t) => t.iso === 'JAM')).toBe(true);
      expect(CARIBBEAN_PODCAST_TERRITORIES.some((t) => t.iso === 'TTO')).toBe(true);
      expect(CARIBBEAN_PODCAST_TERRITORIES.some((t) => t.iso === 'HTI')).toBe(true);
    });

    it('formats and parses timestamp durations bidirectionally', () => {
      expect(formatTimestamp(75)).toBe('1:15');
      expect(formatTimestamp(3665)).toBe('1:01:05');

      expect(parseTimestampToSeconds('1:15')).toBe(75);
      expect(parseTimestampToSeconds('01:01:05')).toBe(3665);
    });
  });
});
