/**
 * TUKUBI Universal Content & Media Architecture
 * Spotify Content Provider (Music & Podcasts)
 */

import { ContentProviderName, ContentResolutionOptions, ContentType, ResolvedContentMetadata } from '../types';
import { BaseContentProvider } from './base-provider';
import { safeFetch } from '../ssrf-guard';

export class SpotifyProvider extends BaseContentProvider {
  readonly name: ContentProviderName = 'spotify';
  readonly displayName = 'Spotify';

  canHandle(target: URL | string): boolean {
    const url = this.toURL(target);
    if (!url) return false;
    const host = url.hostname.toLowerCase();
    return host === 'open.spotify.com' || host === 'spotify.link';
  }

  parseSpotifyPath(url: URL): { type: string; id: string } | null {
    // Expected: /track/{id}, /album/{id}, /playlist/{id}, /episode/{id}, /show/{id}
    const match = url.pathname.match(/^\/(track|album|playlist|episode|show)\/([a-zA-Z0-9]+)/);
    if (match) {
      return { type: match[1], id: match[2] };
    }
    return null;
  }

  async resolve(
    url: URL,
    options?: ContentResolutionOptions
  ): Promise<ResolvedContentMetadata | null> {
    const parsed = this.parseSpotifyPath(url);
    const contentType: ContentType =
      parsed?.type === 'episode' || parsed?.type === 'show' ? 'podcast' : 'audio';

    const embedUrl = parsed
      ? `https://open.spotify.com/embed/${parsed.type}/${parsed.id}?utm_source=generator`
      : undefined;

    try {
      const oembedUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(url.toString())}`;
      const res = await safeFetch(oembedUrl, {
        timeoutMs: options?.timeoutMs ?? 4000,
        allowPrivateIps: options?.allowPrivateIps,
      });

      if (res.ok) {
        const data = await res.json<{
          title?: string;
          thumbnail_url?: string;
          thumbnail_width?: number;
          thumbnail_height?: number;
          html?: string;
        }>();

        const title = this.sanitizeText(data.title) || (contentType === 'podcast' ? 'Spotify Podcast' : 'Spotify Track');

        return this.buildBaseMetadata({
          url,
          contentType,
          title,
          description: `Listen to "${title}" on Spotify`,
          thumbnailUrl: data.thumbnail_url,
          embedUrl,
          embedHtml: embedUrl
            ? `<iframe src="${embedUrl}" width="100%" height="152" frameborder="0" allowfullscreen allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`
            : undefined,
          aspectRatio: '1:1',
          isPlayable: true,
          status: 'resolved',
          extra: { spotifyType: parsed?.type, spotifyId: parsed?.id },
        });
      }
    } catch {
      // Network or safeFetch fallback
    }

    if (parsed && embedUrl) {
      const typeLabel = parsed.type.charAt(0).toUpperCase() + parsed.type.slice(1);
      return this.buildBaseMetadata({
        url,
        contentType,
        title: `Spotify ${typeLabel}`,
        description: `Listen on Spotify`,
        embedUrl,
        embedHtml: `<iframe src="${embedUrl}" width="100%" height="152" frameborder="0" allowfullscreen allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`,
        aspectRatio: '1:1',
        isPlayable: true,
        status: 'partial',
        extra: { spotifyType: parsed.type, spotifyId: parsed.id },
      });
    }

    return this.buildFallback(url, 'Could not resolve Spotify content details');
  }
}
