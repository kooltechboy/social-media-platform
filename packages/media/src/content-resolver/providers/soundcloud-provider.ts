/**
 * TUKUBI Universal Content & Media Architecture
 * SoundCloud Content Provider
 */

import { ContentProviderName, ContentResolutionOptions, ResolvedContentMetadata } from '../types';
import { BaseContentProvider } from './base-provider';
import { safeFetch } from '../ssrf-guard';

export class SoundCloudProvider extends BaseContentProvider {
  readonly name: ContentProviderName = 'soundcloud';
  readonly displayName = 'SoundCloud';

  canHandle(target: URL | string): boolean {
    const url = this.toURL(target);
    if (!url) return false;
    const host = url.hostname.toLowerCase();
    return host === 'soundcloud.com' || host === 'www.soundcloud.com' || host === 'on.soundcloud.com';
  }

  async resolve(
    url: URL,
    options?: ContentResolutionOptions
  ): Promise<ResolvedContentMetadata | null> {
    try {
      const oembedUrl = `https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(url.toString())}`;
      const res = await safeFetch(oembedUrl, {
        timeoutMs: options?.timeoutMs ?? 4000,
        allowPrivateIps: options?.allowPrivateIps,
      });

      if (res.ok) {
        const data = await res.json<{
          title?: string;
          description?: string;
          thumbnail_url?: string;
          author_name?: string;
          author_url?: string;
          html?: string;
        }>();

        const title = this.sanitizeText(data.title) || 'SoundCloud Track';
        const author = this.sanitizeText(data.author_name);

        return this.buildBaseMetadata({
          url,
          contentType: 'audio',
          title,
          description: this.sanitizeText(data.description) || (author ? `By ${author} on SoundCloud` : 'Listen on SoundCloud'),
          thumbnailUrl: data.thumbnail_url,
          authorName: author,
          authorUrl: data.author_url,
          embedHtml: data.html,
          aspectRatio: '16:9',
          isPlayable: true,
          status: 'resolved',
        });
      }
    } catch {
      // Safe fallback
    }

    return this.buildFallback(url, 'Could not resolve SoundCloud audio');
  }
}
