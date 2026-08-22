export interface EpisodeInput {
  podcastId: string;
  seasonNumber: number;
  episodeNumber: number;
  title: string;
  durationSeconds: number;
  audioPath: string;
  isSubscriberOnly: boolean;
}

export interface EpisodeValidation {
  valid: boolean;
  errors: string[];
}

export const MAX_EPISODE_TITLE = 200;
export const MIN_EPISODE_SECONDS = 30;
export const MAX_EPISODE_SECONDS = 6 * 60 * 60;

export function validateEpisode(input: EpisodeInput): EpisodeValidation {
  const errors: string[] = [];
  if (!input.podcastId) errors.push('Podcast is required');
  if (input.seasonNumber < 1) errors.push('Season must be >= 1');
  if (input.episodeNumber < 1) errors.push('Episode number must be >= 1');
  if (!input.title.trim()) errors.push('Title is required');
  if (input.title.length > MAX_EPISODE_TITLE) errors.push(`Title exceeds ${MAX_EPISODE_TITLE} characters`);
  if (input.durationSeconds < MIN_EPISODE_SECONDS) errors.push('Episode is too short to publish');
  if (input.durationSeconds > MAX_EPISODE_SECONDS) errors.push('Episode exceeds maximum duration');
  if (!input.audioPath) errors.push('Audio is required');
  return { valid: errors.length === 0, errors };
}

export interface Chapter {
  startSeconds: number;
  title: string;
}

export function validateChapters(chapters: Chapter[], durationSeconds: number): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  let previousStart = -1;
  for (const chapter of chapters) {
    if (chapter.startSeconds < 0 || chapter.startSeconds >= durationSeconds) {
      errors.push(`Chapter "${chapter.title}" starts outside the episode`);
    }
    if (chapter.startSeconds <= previousStart) {
      errors.push('Chapters must be in ascending order without duplicates');
      break;
    }
    previousStart = chapter.startSeconds;
  }
  return { valid: errors.length === 0, errors };
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export interface RssFeedInput {
  podcastTitle: string;
  podcastDescription: string;
  language: string;
  siteUrl: string;
  feedUrl: string;
  coverUrl: string;
  episodes: Array<{
    guid: string;
    title: string;
    description: string;
    audioUrl: string;
    durationSeconds: number;
    publishedAt: string;
  }>;
}

export function buildRssFeed(input: RssFeedInput): string {
  const items = input.episodes
    .map(
      (episode) => `    <item>
      <title>${escapeXml(episode.title)}</title>
      <description>${escapeXml(episode.description)}</description>
      <guid isPermaLink="false">${escapeXml(episode.guid)}</guid>
      <pubDate>${new Date(episode.publishedAt).toUTCString()}</pubDate>
      <enclosure url="${escapeXml(episode.audioUrl)}" type="audio/mpeg" length="${episode.durationSeconds * 128000}" />
      <itunes:duration>${Math.floor(episode.durationSeconds / 60)}:${String(episode.durationSeconds % 60).padStart(2, '0')}</itunes:duration>
    </item>`,
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(input.podcastTitle)}</title>
    <description>${escapeXml(input.podcastDescription)}</description>
    <language>${escapeXml(input.language)}</language>
    <link>${escapeXml(input.siteUrl)}</link>
    <atom:link href="${escapeXml(input.feedUrl)}" rel="self" type="application/rss+xml" />
    <itunes:image href="${escapeXml(input.coverUrl)}" />
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
