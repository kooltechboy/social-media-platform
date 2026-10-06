/**
 * TUKUBI Universal Content & Media Architecture
 * YouTube Content Provider — Production Grade
 */

import { ContentProviderName, ContentResolutionOptions, ResolvedContentMetadata } from '../types';
import { BaseContentProvider } from './base-provider';
import { safeFetch } from '../ssrf-guard';

export class YouTubeProvider extends BaseContentProvider {
  readonly name: ContentProviderName = 'youtube';
  readonly displayName = 'YouTube';

  canHandle(target: URL | string): boolean {
    const url = this.toURL(target);
    if (!url) return false;
    const host = url.hostname.toLowerCase();
    return (
      host === 'youtube.com' ||
      host === 'www.youtube.com' ||
      host === 'm.youtube.com' ||
      host === 'music.youtube.com' ||
      host === 'youtu.be'
    );
  }

  extractVideoId(url: URL): string | null {
    const host = url.hostname.toLowerCase();
    const pathname = url.pathname;

    // 1. youtu.be/ID
    if (host === 'youtu.be') {
      const path = pathname.replace(/^\/+/, '');
      const id = path.split('/')[0];
      return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }

    // 2. youtube.com/shorts/ID
    const shortsMatch = pathname.match(/\/shorts\/([a-zA-Z0-9_-]{11})/i);
    if (shortsMatch && shortsMatch[1]) {
      return shortsMatch[1];
    }

    // 3. youtube.com/live/ID
    const liveMatch = pathname.match(/\/live\/([a-zA-Z0-9_-]{11})/i);
    if (liveMatch && liveMatch[1]) {
      return liveMatch[1];
    }

    // 4. youtube.com/embed/ID
    const embedMatch = pathname.match(/\/embed\/([a-zA-Z0-9_-]{11})/i);
    if (embedMatch && embedMatch[1]) {
      return embedMatch[1];
    }

    // 5. youtube.com/v/ID
    const vMatch = pathname.match(/\/v\/([a-zA-Z0-9_-]{11})/i);
    if (vMatch && vMatch[1]) {
      return vMatch[1];
    }

    // 6. youtube.com/watch?v=ID
    const v = url.searchParams.get('v');
    if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) {
      return v;
    }

    return null;
  }

  private extractTimestampSeconds(url: URL): number | null {
    const tParam = url.searchParams.get('t') || (url.hash.includes('t=') ? url.hash.split('t=')[1] : null);
    if (!tParam) return null;

    if (/^\d+s?$/.test(tParam)) {
      return parseInt(tParam, 10);
    }

    const match = tParam.match(/(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/);
    if (match) {
      const h = parseInt(match[1] || '0', 10);
      const m = parseInt(match[2] || '0', 10);
      const s = parseInt(match[3] || '0', 10);
      const total = h * 3600 + m * 60 + s;
      return total > 0 ? total : null;
    }

    return null;
  }

  async resolve(
    url: URL,
    options?: ContentResolutionOptions
  ): Promise<ResolvedContentMetadata | null> {
    const videoId = this.extractVideoId(url);
    if (!videoId) {
      return this.buildFallback(url, 'Not a recognized YouTube video ID');
    }

    const isShort = url.pathname.includes('/shorts/');
    const isLive = url.pathname.includes('/live/');
    const timestampSec = this.extractTimestampSeconds(url);

    const canonicalWatchUrl = isShort
      ? `https://www.youtube.com/shorts/${videoId}`
      : `https://www.youtube.com/watch?v=${videoId}`;
    const startQuery = timestampSec ? `&start=${timestampSec}` : '';
    const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0${startQuery}`;
    const defaultThumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
    const aspectRatio = isShort ? '9:16' : '16:9';

    try {
      const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(canonicalWatchUrl)}&format=json`;
      const res = await safeFetch(oembedUrl, {
        timeoutMs: options?.timeoutMs ?? 4000,
        allowPrivateIps: options?.allowPrivateIps,
      });

      if (res.ok) {
        const data = await res.json<{
          title?: string;
          author_name?: string;
          author_url?: string;
          thumbnail_url?: string;
          thumbnail_width?: number;
          thumbnail_height?: number;
          html?: string;
        }>();

        const title = this.sanitizeText(data.title) || (isShort ? 'YouTube Short' : 'YouTube Video');
        const author = this.sanitizeText(data.author_name);
        const thumb = data.thumbnail_url || defaultThumbnail;

        return this.buildBaseMetadata({
          url,
          contentType: 'video',
          title,
          description: author ? `Watch "${title}" by ${author} on YouTube` : `Watch on YouTube`,
          thumbnailUrl: thumb,
          authorName: author,
          authorUrl: data.author_url,
          embedUrl,
          embedHtml: `<iframe src="${embedUrl}" width="100%" height="100%" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen title="${title}"></iframe>`,
          aspectRatio,
          isPlayable: true,
          status: 'resolved',
          extra: { videoId, isShort, isLive, timestampSec },
        });
      }
    } catch {
      // Safe network or timeout fallback
    }

    // High quality deterministic fallback when external oEmbed API is unavailable, private, or rate limited
    const fallbackTitle = isShort ? 'YouTube Short' : isLive ? 'YouTube Live Stream' : 'YouTube Video';
    return this.buildBaseMetadata({
      url,
      contentType: 'video',
      title: fallbackTitle,
      description: `Watch video on YouTube`,
      thumbnailUrl: defaultThumbnail,
      embedUrl,
      embedHtml: `<iframe src="${embedUrl}" width="100%" height="100%" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen title="${fallbackTitle}"></iframe>`,
      aspectRatio,
      isPlayable: true,
      status: 'partial',
      extra: { videoId, isShort, isLive, timestampSec },
    });
  }
}
