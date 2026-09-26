/**
 * TUKUBI Universal Content & Media Architecture
 * Apple Music & Apple Podcasts Provider
 */

import { ContentProviderName, ContentResolutionOptions, ContentType, ResolvedContentMetadata } from '../types';
import { BaseContentProvider } from './base-provider';
import { safeFetch } from '../ssrf-guard';

export class AppleProvider extends BaseContentProvider {
  readonly name: ContentProviderName = 'apple_music';
  readonly displayName = 'Apple Music';

  canHandle(target: URL | string): boolean {
    const url = this.toURL(target);
    if (!url) return false;
    const host = url.hostname.toLowerCase();
    return host === 'music.apple.com' || host === 'podcasts.apple.com';
  }

  isPodcast(url: URL): boolean {
    return url.hostname.toLowerCase() === 'podcasts.apple.com';
  }

  async resolve(
    url: URL,
    options?: ContentResolutionOptions
  ): Promise<ResolvedContentMetadata | null> {
    const isPod = this.isPodcast(url);
    const contentType: ContentType = isPod ? 'podcast' : 'audio';
    const providerDisplayName = isPod ? 'Apple Podcasts' : 'Apple Music';

    const embedUrl = isPod
      ? `https://embed.podcasts.apple.com${url.pathname}`
      : `https://embed.music.apple.com${url.pathname}`;

    let title = isPod ? 'Apple Podcast Episode' : 'Apple Music Track';
    let authorName: string | undefined;
    let description: string | undefined;
    let thumbnailUrl: string | undefined;

    try {
      const res = await safeFetch(url.toString(), {
        timeoutMs: options?.timeoutMs ?? 4000,
        allowPrivateIps: options?.allowPrivateIps,
      });

      if (res.ok) {
        const html = await res.text();

        const ogTitleMatch = html.match(/<meta\s+(?:property|name)=["']og:title["']\s+content=["']([^"']+)["']/i) ||
          html.match(/<title>([^<]+)<\/title>/i);
        if (ogTitleMatch) {
          title = this.sanitizeText(ogTitleMatch[1]);
        }

        const ogDescMatch = html.match(/<meta\s+(?:property|name)=["']og:description["']\s+content=["']([^"']+)["']/i);
        if (ogDescMatch) {
          description = this.sanitizeText(ogDescMatch[1]);
        }

        const ogImageMatch = html.match(/<meta\s+(?:property|name)=["']og:image["']\s+content=["']([^"']+)["']/i);
        if (ogImageMatch) {
          thumbnailUrl = ogImageMatch[1];
        }

        const ogMusicMusician = html.match(/<meta\s+property=["']music:musician["']\s+content=["']([^"']+)["']/i);
        if (ogMusicMusician) {
          authorName = this.sanitizeText(ogMusicMusician[1]);
        }
      }
    } catch {
      // Safe fallback
    }

    return {
      url: url.toString(),
      normalizedUrl: url.toString(),
      canonicalUrl: url.toString(),
      provider: isPod ? 'apple_podcasts' : 'apple_music',
      providerDisplayName,
      contentType,
      title,
      description: description || `Listen on ${providerDisplayName}`,
      thumbnailUrl,
      authorName,
      siteName: providerDisplayName,
      faviconUrl: this.getFaviconUrl(url),
      embedUrl,
      embedHtml: `<iframe src="${embedUrl}" width="100%" height="${isPod ? '175' : '175'}" frameborder="0" sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-top-navigation-by-user-activation" allow="autoplay *; encrypted-media *; clipboard-write" style="border-radius: 12px; max-width: 660px; overflow: hidden;" loading="lazy"></iframe>`,
      aspectRatio: '16:9',
      isPlayable: true,
      status: 'resolved',
      resolvedAt: new Date().toISOString(),
    };
  }
}
