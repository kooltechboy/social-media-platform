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

        return this.buildBaseMetadata({
          url,
          contentType: 'video',
          title,
          description: author ? `Watch video by @${author} on TikTok` : 'Watch on TikTok',
          thumbnailUrl: data.thumbnail_url,
          authorName: author ? `@${author}` : undefined,
          authorUrl: data.author_url,
          embedHtml: data.html,
          aspectRatio: '9:16',
          isPlayable: false, // External attribution redirect preferred for TikTok mobile web stability
          status: 'resolved',
        });
      }
    } catch {
      // Safe fallback
    }

    return this.buildFallback(url, 'Could not resolve TikTok video');
  }
}
