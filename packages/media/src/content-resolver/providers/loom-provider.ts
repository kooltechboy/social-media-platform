/**
 * TUKUBI Universal Content & Media Architecture
 * Loom Content Provider
 */

import { ContentProviderName, ContentResolutionOptions, ResolvedContentMetadata } from '../types';
import { BaseContentProvider } from './base-provider';
import { safeFetch } from '../ssrf-guard';

export class LoomProvider extends BaseContentProvider {
  readonly name: ContentProviderName = 'loom';
  readonly displayName = 'Loom';

  canHandle(target: URL | string): boolean {
    const url = this.toURL(target);
    if (!url) return false;
    const host = url.hostname.toLowerCase();
    return host === 'loom.com' || host === 'www.loom.com';
  }

  extractVideoId(url: URL): string | null {
    const match = url.pathname.match(/\/(?:share|embed)\/([a-zA-Z0-9]+)/i);
    return match ? match[1] : null;
  }

  async resolve(
    url: URL,
    options?: ContentResolutionOptions
  ): Promise<ResolvedContentMetadata | null> {
    const videoId = this.extractVideoId(url);
    if (!videoId) {
      return this.buildFallback(url, 'Not a recognized Loom recording URL');
    }

    const canonicalUrl = `https://www.loom.com/share/${videoId}`;
    const embedUrl = `https://www.loom.com/embed/${videoId}`;

    try {
      const oembedUrl = `https://www.loom.com/v1/oembed?url=${encodeURIComponent(canonicalUrl)}`;
      const res = await safeFetch(oembedUrl, {
        timeoutMs: options?.timeoutMs ?? 3500,
        allowPrivateIps: options?.allowPrivateIps,
      });

      if (res.ok) {
        const data = await res.json<{
          title?: string;
          author_name?: string;
          thumbnail_url?: string;
        }>();

        const title = this.sanitizeText(data.title) || 'Loom Recording';
        const author = this.sanitizeText(data.author_name);

        return this.buildBaseMetadata({
          url,
          contentType: 'video',
          title,
          description: author ? `Watch "${title}" by ${author} on Loom` : 'Watch video on Loom',
          thumbnailUrl: data.thumbnail_url,
          authorName: author,
          embedUrl,
          embedHtml: `<iframe src="${embedUrl}" width="100%" height="100%" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen title="${title}"></iframe>`,
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
      title: 'Loom Recording',
      description: 'Watch video on Loom',
      embedUrl,
      embedHtml: `<iframe src="${embedUrl}" width="100%" height="100%" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen title="Loom Recording"></iframe>`,
      aspectRatio: '16:9',
      isPlayable: true,
      canEmbed: true,
      status: 'partial',
      extra: { videoId, canonicalUrl },
    });
  }
}
