export interface EpisodeInput {
  podcastId: string;
  seasonNumber: number;
  episodeNumber: number;
  title: string;
  durationSeconds: number;
  audioPath: string;
  isSubscriberOnly: boolean;
  showNotes?: string | null;
  transcript?: string | null;
  chapters?: Chapter[];
}

export interface EpisodeValidation {
  valid: boolean;
  errors: string[];
}

export const MAX_EPISODE_TITLE = 200;
export const MIN_EPISODE_SECONDS = 15;
export const MAX_EPISODE_SECONDS = 12 * 60 * 60; // 12 hours

export function validateEpisode(input: EpisodeInput): EpisodeValidation {
  const errors: string[] = [];
  if (!input.podcastId) errors.push('Podcast is required');
  if (input.seasonNumber < 1) errors.push('Season must be >= 1');
  if (input.episodeNumber < 1) errors.push('Episode number must be >= 1');
  if (!input.title || !input.title.trim()) errors.push('Title is required');
  if (input.title && input.title.length > MAX_EPISODE_TITLE) errors.push(`Title exceeds ${MAX_EPISODE_TITLE} characters`);
  if (input.durationSeconds < MIN_EPISODE_SECONDS) errors.push('Episode is too short to publish');
  if (input.durationSeconds > MAX_EPISODE_SECONDS) errors.push('Episode exceeds maximum duration');
  if (!input.audioPath) errors.push('Audio is required');
  return { valid: errors.length === 0, errors };
}

export interface Chapter {
  startSeconds: number;
  title: string;
  url?: string;
  img?: string;
}

export function validateChapters(chapters: Chapter[], durationSeconds: number): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  let previousStart = -1;
  for (const chapter of chapters) {
    if (chapter.startSeconds < 0 || chapter.startSeconds >= durationSeconds) {
      errors.push(`Chapter "${chapter.title}" starts outside the episode duration`);
    }
    if (chapter.startSeconds <= previousStart) {
      errors.push('Chapters must be in strictly ascending timestamp order without duplicates');
      break;
    }
    previousStart = chapter.startSeconds;
  }
  return { valid: errors.length === 0, errors };
}

export function formatTimestamp(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hours > 0) {
    return `${hours}:${minutes < 10 ? '0' : ''}${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  }
  return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
}

export function parseTimestampToSeconds(timestamp: string): number {
  const parts = timestamp.trim().split(':').map((p) => parseInt(p, 10));
  if (parts.length === 3) {
    return (parts[0] * 3600) + (parts[1] * 60) + parts[2];
  }
  if (parts.length === 2) {
    return (parts[0] * 60) + parts[1];
  }
  return parseInt(timestamp, 10) || 0;
}

function escapeXml(value: string): string {
  return (value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export interface RssFeedEpisode {
  guid: string;
  title: string;
  description: string;
  audioUrl: string;
  durationSeconds: number;
  publishedAt: string;
  seasonNumber?: number;
  episodeNumber?: number;
  transcriptUrl?: string;
  chapters?: Chapter[];
  isExplicit?: boolean;
}

export interface RssFeedInput {
  podcastTitle: string;
  podcastDescription: string;
  language: string;
  siteUrl: string;
  feedUrl: string;
  coverUrl: string;
  authorName?: string;
  ownerEmail?: string;
  category?: string;
  isExplicit?: boolean;
  episodes: RssFeedEpisode[];
}

export function buildRssFeed(input: RssFeedInput): string {
  const author = escapeXml(input.authorName || 'Caribbean Creators Network');
  const ownerEmail = escapeXml(input.ownerEmail || 'podcasts@caribbeanone.app');
  const category = escapeXml(input.category || 'Society & Culture');
  const explicit = input.isExplicit ? 'yes' : 'no';

  const items = input.episodes
    .map((episode) => {
      const seasonTag = episode.seasonNumber ? `\n      <itunes:season>${episode.seasonNumber}</itunes:season>` : '';
      const episodeTag = episode.episodeNumber ? `\n      <itunes:episode>${episode.episodeNumber}</itunes:episode>` : '';
      const transcriptTag = episode.transcriptUrl
        ? `\n      <podcast:transcript url="${escapeXml(episode.transcriptUrl)}" type="text/plain" />`
        : '';
      const explicitTag = episode.isExplicit ? '\n      <itunes:explicit>yes</itunes:explicit>' : '\n      <itunes:explicit>no</itunes:explicit>';

      return `    <item>
      <title>${escapeXml(episode.title)}</title>
      <description>${escapeXml(episode.description)}</description>
      <guid isPermaLink="false">${escapeXml(episode.guid)}</guid>
      <pubDate>${new Date(episode.publishedAt).toUTCString()}</pubDate>
      <enclosure url="${escapeXml(episode.audioUrl)}" type="audio/mpeg" length="${Math.max(128000, episode.durationSeconds * 16000)}" />
      <itunes:duration>${formatTimestamp(episode.durationSeconds)}</itunes:duration>
      <itunes:author>${author}</itunes:author>${seasonTag}${episodeTag}${explicitTag}${transcriptTag}
    </item>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
  xmlns:podcast="https://podcastindex.org/namespace/1.0"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${escapeXml(input.podcastTitle)}</title>
    <description>${escapeXml(input.podcastDescription)}</description>
    <language>${escapeXml(input.language || 'en')}</language>
    <link>${escapeXml(input.siteUrl)}</link>
    <atom:link href="${escapeXml(input.feedUrl)}" rel="self" type="application/rss+xml" />
    <itunes:image href="${escapeXml(input.coverUrl)}" />
    <itunes:author>${author}</itunes:author>
    <itunes:summary>${escapeXml(input.podcastDescription)}</itunes:summary>
    <itunes:category text="${category}" />
    <itunes:explicit>${explicit}</itunes:explicit>
    <itunes:owner>
      <itunes:name>${author}</itunes:name>
      <itunes:email>${ownerEmail}</itunes:email>
    </itunes:owner>
${items}
  </channel>
</rss>`;
}

export function slugifyPodcast(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}
