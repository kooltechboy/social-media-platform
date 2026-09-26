/**
 * @caribbean/podcasts
 * Enterprise Podcasting 2.0 Engine & Apple Podcasts / Spotify RSS Generator
 * NASA-Grade Architectural Implementation
 */

export interface Chapter {
  startSeconds: number;
  title: string;
  url?: string;
  img?: string;
  description?: string;
}

export interface TimedLink {
  timestampSeconds: number;
  title: string;
  url: string;
  description?: string;
  linkKind?: 'external' | 'product' | 'creator_page' | 'community' | 'tukubi_post';
  targetId?: string;
}

export interface TranscriptSegment {
  startSeconds: number;
  endSeconds: number;
  speaker?: string;
  text: string;
}

export interface EpisodeInput {
  podcastId: string;
  seasonNumber: number;
  episodeNumber: number;
  title: string;
  durationSeconds: number;
  audioPath: string;
  videoPath?: string | null;
  isSubscriberOnly: boolean;
  isPremium?: boolean;
  showNotes?: string | null;
  transcript?: string | null;
  transcriptSegments?: TranscriptSegment[];
  chapters?: Chapter[];
  timedLinks?: TimedLink[];
  episodeType?: 'full' | 'trailer' | 'bonus';
  contentWarnings?: string[];
  isExplicit?: boolean;
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

export function validateTimedLinks(links: TimedLink[], durationSeconds: number): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  for (const link of links) {
    if (link.timestampSeconds < 0 || link.timestampSeconds >= durationSeconds) {
      errors.push(`Timed link "${link.title}" timestamp is outside the episode duration`);
    }
    if (!link.url || !link.url.startsWith('http')) {
      errors.push(`Timed link "${link.title}" has an invalid URL`);
    }
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

export function escapeXml(value: string): string {
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
  videoUrl?: string | null;
  durationSeconds: number;
  publishedAt: string;
  seasonNumber?: number;
  episodeNumber?: number;
  episodeType?: 'full' | 'trailer' | 'bonus';
  transcriptUrl?: string;
  chapters?: Chapter[];
  isExplicit?: boolean;
  authorName?: string;
  artworkUrl?: string;
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
  subcategory?: string;
  isExplicit?: boolean;
  showType?: 'episodic' | 'serial';
  copyright?: string;
  episodes: RssFeedEpisode[];
}

export function buildRssFeed(input: RssFeedInput): string {
  const author = escapeXml(input.authorName || 'TUKUBI Caribbean Network');
  const ownerEmail = escapeXml(input.ownerEmail || 'podcasts@tukubi.com');
  const category = escapeXml(input.category || 'Society & Culture');
  const subcategory = input.subcategory ? `<itunes:category text="${escapeXml(input.subcategory)}" />` : '';
  const explicit = input.isExplicit ? 'yes' : 'no';
  const showType = input.showType === 'serial' ? 'serial' : 'episodic';
  const copyright = escapeXml(input.copyright || `© ${new Date().getFullYear()} ${input.authorName || 'TUKUBI Creators'}`);

  const items = input.episodes
    .map((episode) => {
      const seasonTag = episode.seasonNumber ? `\n      <itunes:season>${episode.seasonNumber}</itunes:season>` : '';
      const episodeTag = episode.episodeNumber ? `\n      <itunes:episode>${episode.episodeNumber}</itunes:episode>` : '';
      const episodeTypeTag = episode.episodeType ? `\n      <itunes:episodeType>${episode.episodeType}</itunes:episodeType>` : '';
      const transcriptTag = episode.transcriptUrl
        ? `\n      <podcast:transcript url="${escapeXml(episode.transcriptUrl)}" type="text/plain" />`
        : '';
      const explicitTag = episode.isExplicit ? '\n      <itunes:explicit>yes</itunes:explicit>' : '\n      <itunes:explicit>no</itunes:explicit>';
      const epArtwork = episode.artworkUrl ? `\n      <itunes:image href="${escapeXml(episode.artworkUrl)}" />` : '';
      const epAuthor = episode.authorName ? `\n      <itunes:author>${escapeXml(episode.authorName)}</itunes:author>` : `\n      <itunes:author>${author}</itunes:author>`;

      const enclosureLength = Math.max(128000, episode.durationSeconds * 16000);
      const enclosureMime = episode.videoUrl ? 'video/mp4' : 'audio/mpeg';
      const enclosureUrl = episode.videoUrl || episode.audioUrl;

      return `    <item>
      <title>${escapeXml(episode.title)}</title>
      <description>${escapeXml(episode.description)}</description>
      <guid isPermaLink="false">${escapeXml(episode.guid)}</guid>
      <pubDate>${new Date(episode.publishedAt).toUTCString()}</pubDate>
      <enclosure url="${escapeXml(enclosureUrl)}" type="${enclosureMime}" length="${enclosureLength}" />
      <itunes:duration>${formatTimestamp(episode.durationSeconds)}</itunes:duration>${epAuthor}${seasonTag}${episodeTag}${episodeTypeTag}${explicitTag}${transcriptTag}${epArtwork}
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
    <itunes:type>${showType}</itunes:type>
    <copyright>${copyright}</copyright>
    <itunes:category text="${category}">
      ${subcategory}
    </itunes:category>
    <itunes:explicit>${explicit}</itunes:explicit>
    <itunes:owner>
      <itunes:name>${author}</itunes:name>
      <itunes:email>${ownerEmail}</itunes:email>
    </itunes:owner>
${items}
  </channel>
</rss>`;
}

export function validateRssFeedXml(xml: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!xml || !xml.trim()) {
    return { valid: false, errors: ['Feed XML is empty'] };
  }
  if (!xml.includes('<?xml version="1.0"')) {
    errors.push('Missing XML declaration');
  }
  if (!xml.includes('<rss version="2.0"')) {
    errors.push('Missing RSS 2.0 root element');
  }
  if (!xml.includes('xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"')) {
    errors.push('Missing iTunes namespace');
  }
  if (!xml.includes('<channel>') || !xml.includes('</channel>')) {
    errors.push('Missing channel element');
  }
  if (!xml.includes('<title>') || !xml.includes('</title>')) {
    errors.push('Missing podcast title');
  }
  if (!xml.includes('<description>') || !xml.includes('</description>')) {
    errors.push('Missing podcast description');
  }
  if (!xml.includes('<itunes:image')) {
    errors.push('Missing itunes:image artwork tag');
  }
  return { valid: errors.length === 0, errors };
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

export interface ParsedTranscriptLine {
  timestampSeconds: number;
  timestampFormatted: string;
  speaker?: string;
  text: string;
}

export function parseWebVttTranscript(vttContent: string): ParsedTranscriptLine[] {
  const lines = vttContent.split('\n');
  const results: ParsedTranscriptLine[] = [];
  let currentTimestamp: number | null = null;
  let currentSpeaker: string | undefined = undefined;

  const timeRegex = /([0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}|[0-9]{2}:[0-9]{2}\.[0-9]{3})\s*-->/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line === 'WEBVTT' || line.startsWith('NOTE')) continue;

    const match = line.match(timeRegex);
    if (match) {
      const timeStr = match[1].split('.')[0];
      currentTimestamp = parseTimestampToSeconds(timeStr);
      continue;
    }

    if (currentTimestamp !== null && line) {
      let text = line;
      if (text.includes(':')) {
        const parts = text.split(':');
        currentSpeaker = parts[0].trim();
        text = parts.slice(1).join(':').trim();
      }
      results.push({
        timestampSeconds: currentTimestamp,
        timestampFormatted: formatTimestamp(currentTimestamp),
        speaker: currentSpeaker,
        text,
      });
      currentTimestamp = null;
    }
  }

  return results;
}

export const CARIBBEAN_PODCAST_CATEGORIES = [
  'Culture & History',
  'Music & Sound Systems',
  'Business & Tech',
  'Food & Culinary',
  'Diaspora Life',
  'Carnival & Mas',
  'Sports & Athletics',
  'Comedy & Storytelling',
  'News & Politics',
  'Faith & Spirituality',
  'Health & Wellness',
  'Arts & Design',
] as const;

export const CARIBBEAN_PODCAST_TERRITORIES = [
  { iso: 'ALL', name: 'All Caribbean & Diaspora', flag: '🌴' },
  { iso: 'TTO', name: 'Trinidad & Tobago', flag: '🇹🇹' },
  { iso: 'JAM', name: 'Jamaica', flag: '🇯🇲' },
  { iso: 'BRB', name: 'Barbados', flag: '🇧🇧' },
  { iso: 'HTI', name: 'Haiti', flag: '🇭🇹' },
  { iso: 'DOM', name: 'Dominican Republic', flag: '🇩🇴' },
  { iso: 'GUY', name: 'Guyana', flag: '🇬🇾' },
  { iso: 'BHS', name: 'Bahamas', flag: '🇧🇸' },
  { iso: 'DMA', name: 'Dominica', flag: '🇩🇲' },
  { iso: 'LCA', name: 'Saint Lucia', flag: '🇱🇨' },
  { iso: 'GRD', name: 'Grenada', flag: '🇬🇩' },
  { iso: 'VCT', name: 'St. Vincent & the Grenadines', flag: '🇻🇨' },
  { iso: 'ATG', name: 'Antigua & Barbuda', flag: '🇦🇬' },
  { iso: 'KNA', name: 'St. Kitts & Nevis', flag: '🇰🇳' },
  { iso: 'SUR', name: 'Suriname', flag: '🇸🇷' },
  { iso: 'BLZ', name: 'Belize', flag: '🇧🇿' },
  { iso: 'CUW', name: 'Curaçao', flag: '🇨🇼' },
  { iso: 'ABW', name: 'Aruba', flag: '🇦🇼' },
  { iso: 'PRI', name: 'Puerto Rico', flag: '🇵🇷' },
  { iso: 'GLP', name: 'Guadeloupe', flag: '🇬🇵' },
  { iso: 'MTQ', name: 'Martinique', flag: '🇲🇶' },
  { iso: 'CYM', name: 'Cayman Islands', flag: '🇰🇾' },
  { iso: 'BMU', name: 'Bermuda', flag: '🇧🇲' },
  { iso: 'TCA', name: 'Turks & Caicos', flag: '🇹🇨' },
  { iso: 'VIR', name: 'US Virgin Islands', flag: '🇻🇮' },
  { iso: 'VGB', name: 'British Virgin Islands', flag: '🇻🇬' },
  { iso: 'AIA', name: 'Anguilla', flag: '🇦🇮' },
  { iso: 'MSR', name: 'Montserrat', flag: '🇲🇸' },
  { iso: 'SXM', name: 'Sint Maarten', flag: '🇸🇽' },
  { iso: 'DIASPORA', name: 'Global Diaspora', flag: '🌍' },
] as const;
