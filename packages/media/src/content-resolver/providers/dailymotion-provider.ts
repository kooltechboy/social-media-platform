/**
 * TUKUBI Universal Content & Media Architecture
 * Dailymotion Content Provider
 */

import { ContentProviderName, ContentResolutionOptions, ResolvedContentMetadata } from '../types';
import { BaseContentProvider } from './base-provider';
import { safeFetch } from '../ssrf-guard';

export class DailymotionProvider extends BaseContentProvider {
  readonly name: ContentProviderName = 'dailymotion';
  readonly displayName = 'Dailymotion';

  canHandle(target: URL | string): boolean {
    const url = this.toURL(target);
    if (!url) return false;
    const host = url.hostname.toLowerCase();
    return (
      host === 'dailymotion.com' ||
      host === 'www.dailymotion.com' ||
      host === 'dai.ly' ||
      host === 'touch.dailymotion.com'
    );
  }

  extractVideoId(url: URL): string | null {
    const host = url.hostname.toLowerCase();
    const pathname = url.pathname;

    if (host === 'dai.ly') {
      const id = pathname.replace(/^\/+/, '').split('/')[0];
      return id || null;
    }

    const match = pathname.match(/\/video\/([a-zA-Z0-9]+)/i);
    if (match && match[1]) {
      return match[1];
    }

    return null;
  }

  async resolve(
    url: URL,
    options?: ContentResolutionOptions
  ): Promise<ResolvedContentMetadata | null> {
    const videoId = this.extractVideoId(url);
    if (!videoId) {
      return this.buildFallback(url, 'Not a recognized Dailymotion video ID');
    }

    const canonicalUrl = `https://www.dailymotion.com/video/${videoId}`;
    const embedUrl = `https://www.dailymotion.com/embed/video/${videoId}`;
    const defaultThumbnail = `https://www.dailymotion.com/thumbnail/video/${videoId}`;

    try {
      const oembedUrl = `https://www.dailymotion.com/services/oembed?url=${encodeURIComponent(canonicalUrl)}&format=json`;
      const res = await safeFetch(oembedUrl, {
        timeoutMs: options?.timeoutMs ?? 3500,
        allowPrivateIps: options?.allowPrivateIps,
      });

      if (res.ok) {
        const data = await res.json<{
          title?: string;
          author_name?: string;
          author_url?: string;
          thumbnail_url?: string;
        }>();

        const title = this.sanitizeText(data.title) || 'Dailymotion Video';
        const author = this.sanitizeText(data.author_name);
        const thumb = data.thumbnail_url || defaultThumbnail;

        return this.buildBaseMetadata({
          url,
          contentType: 'video',
          title,
          description: author ? `Watch "${title}" by ${author} on Dailymotion` : 'Watch on Dailymotion',
          thumbnailUrl: thumb,
          authorName: author,
          authorUrl: data.author_url,
          embedUrl,
          embedHtml: `<iframe src="${embedUrl}" width="100%" height="100%" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen title="${title}"></iframe>`,
          aspectRatio: '16:9',
          isPlayable: true,
          canEmbed: true,
          status: 'resolved',
          extra: { videoId, canonicalUrl },
        });
      }
    } catch {
      // Safe fallback
    }

    return this.buildBaseMetadata({
      url,
      contentType: 'video',
      title: 'Dailymotion Video',
      description: 'Watch video on Dailymotion',
      thumbnailUrl: defaultThumbnail,
      embedUrl,
      embedHtml: `<iframe src="${embedUrl}" width="100%" height="100%" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen title="Dailymotion Video"></iframe>`,
      aspectRatio: '16:9',
      isPlayable: true,
      canEmbed: true,
      status: 'partial',
      extra: { videoId, canonicalUrl },
    });
  }
}
