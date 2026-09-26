/**
 * TUKUBI Universal Content & Media Architecture
 * YouTube Content Provider
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
      host === 'youtu.be'
    );
  }

  extractVideoId(url: URL): string | null {
    const host = url.hostname.toLowerCase();

    // youtu.be/ID
    if (host === 'youtu.be') {
      const path = url.pathname.replace(/^\/+/, '');
      const id = path.split('/')[0];
      return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }

    // youtube.com/shorts/ID
    if (url.pathname.startsWith('/shorts/')) {
      const parts = url.pathname.split('/');
      const id = parts[2];
      return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }

    // youtube.com/embed/ID
    if (url.pathname.startsWith('/embed/')) {
      const parts = url.pathname.split('/');
      const id = parts[2];
      return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }

    // youtube.com/watch?v=ID
    const v = url.searchParams.get('v');
    if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) {
      return v;
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

    const canonicalWatchUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`;
    const defaultThumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

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

        const title = this.sanitizeText(data.title) || 'YouTube Video';
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
          aspectRatio: '16:9',
          isPlayable: true,
          status: 'resolved',
          extra: { videoId },
        });
      }
    } catch {
      // Safe network or timeout fallback
    }

    // High quality deterministic fallback when external oEmbed API is unavailable or rate limited
    return this.buildBaseMetadata({
      url,
      contentType: 'video',
      title: 'YouTube Video',
      description: `Watch video on YouTube`,
      thumbnailUrl: defaultThumbnail,
      embedUrl,
      embedHtml: `<iframe src="${embedUrl}" width="100%" height="100%" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen title="YouTube Video"></iframe>`,
      aspectRatio: '16:9',
      isPlayable: true,
      status: 'partial',
      extra: { videoId },
    });
  }
}
