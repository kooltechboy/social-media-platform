/**
 * TUKUBI Universal Content & Media Architecture
 * Vimeo Content Provider
 */

import { ContentProviderName, ContentResolutionOptions, ResolvedContentMetadata } from '../types';
import { BaseContentProvider } from './base-provider';
import { safeFetch } from '../ssrf-guard';

export class VimeoProvider extends BaseContentProvider {
  readonly name: ContentProviderName = 'vimeo';
  readonly displayName = 'Vimeo';

  canHandle(target: URL | string): boolean {
    const url = this.toURL(target);
    if (!url) return false;
    const host = url.hostname.toLowerCase();
    return host === 'vimeo.com' || host === 'www.vimeo.com' || host === 'player.vimeo.com';
  }

  async resolve(
    url: URL,
    options?: ContentResolutionOptions
  ): Promise<ResolvedContentMetadata | null> {
    try {
      const oembedUrl = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url.toString())}`;
      const res = await safeFetch(oembedUrl, {
        timeoutMs: options?.timeoutMs ?? 4000,
        allowPrivateIps: options?.allowPrivateIps,
      });

      if (res.ok) {
        const data = await res.json<{
          title?: string;
          description?: string;
          author_name?: string;
          author_url?: string;
          thumbnail_url?: string;
          thumbnail_width?: number;
          thumbnail_height?: number;
          duration?: number;
          video_id?: number | string;
          html?: string;
        }>();

        const title = this.sanitizeText(data.title) || 'Vimeo Video';
        const author = this.sanitizeText(data.author_name);
        const embedUrl = data.video_id ? `https://player.vimeo.com/video/${data.video_id}` : undefined;

        return this.buildBaseMetadata({
          url,
          contentType: 'video',
          title,
          description: this.sanitizeText(data.description) || (author ? `By ${author} on Vimeo` : 'Watch on Vimeo'),
          thumbnailUrl: data.thumbnail_url,
          authorName: author,
          authorUrl: data.author_url,
          durationSeconds: data.duration,
          embedUrl,
          embedHtml: data.html || (embedUrl ? `<iframe src="${embedUrl}" width="100%" height="100%" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen title="${title}"></iframe>` : undefined),
          aspectRatio: '16:9',
          isPlayable: true,
          status: 'resolved',
        });
      }
    } catch {
      // Safe fallback
    }

    return this.buildFallback(url, 'Could not resolve Vimeo video');
  }
}
