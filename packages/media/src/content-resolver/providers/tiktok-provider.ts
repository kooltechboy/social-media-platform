/**
 * TUKUBI Universal Content & Media Architecture
 * TikTok Content Provider
 */

import { ContentProviderName, ContentResolutionOptions, ResolvedContentMetadata } from '../types';
import { BaseContentProvider } from './base-provider';
import { safeFetch } from '../ssrf-guard';

export class TikTokProvider extends BaseContentProvider {
  readonly name: ContentProviderName = 'tiktok';
  readonly displayName = 'TikTok';

  canHandle(target: URL | string): boolean {
    const url = this.toURL(target);
    if (!url) return false;
    const host = url.hostname.toLowerCase();
    return host === 'tiktok.com' || host === 'www.tiktok.com' || host === 'vt.tiktok.com';
  }

  async resolve(
    url: URL,
    options?: ContentResolutionOptions
  ): Promise<ResolvedContentMetadata | null> {
    try {
      const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url.toString())}`;
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

        const title = this.sanitizeText(data.title) || 'TikTok Video';
        const author = this.sanitizeText(data.author_name);
        const pathMatch = url.pathname.match(/\/video\/(\d+)/);
        const htmlMatch = data.html?.match(/data-video-id="(\d+)"/);
        const videoId = pathMatch?.[1] || htmlMatch?.[1];
        const embedUrl = videoId ? `https://www.tiktok.com/embed/v2/${videoId}` : undefined;

        return this.buildBaseMetadata({
          url,
          contentType: 'video',
          title,
          description: author ? `Watch video by @${author} on TikTok` : 'Watch on TikTok',
          thumbnailUrl: data.thumbnail_url,
          authorName: author ? `@${author}` : undefined,
          authorUrl: data.author_url,
          embedUrl,
          embedHtml: data.html,
          aspectRatio: '9:16',
          canEmbed: Boolean(embedUrl),
          isPlayable: Boolean(embedUrl),
          status: 'resolved',
        });
      }
    } catch {
      // Safe fallback
    }

    return this.buildFallback(url, 'Could not resolve TikTok video');
  }
}
