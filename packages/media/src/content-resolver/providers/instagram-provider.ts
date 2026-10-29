/**
 * TUKUBI Universal Content & Media Architecture
 * Instagram Content Provider — Production Grade
 */

import { ContentProviderName, ContentResolutionOptions, ResolvedContentMetadata } from '../types';
import { BaseContentProvider } from './base-provider';
import { safeFetch } from '../ssrf-guard';

export class InstagramProvider extends BaseContentProvider {
  readonly name: ContentProviderName = 'instagram';
  readonly displayName = 'Instagram';

  canHandle(target: URL | string): boolean {
    const url = this.toURL(target);
    if (!url) return false;
    const host = url.hostname.toLowerCase();
    return (
      host === 'instagram.com' ||
      host === 'www.instagram.com' ||
      host === 'instagr.am' ||
      host === 'm.instagram.com'
    );
  }

  extractMediaId(url: URL): { id: string | null; isReel: boolean; isProfile: boolean; username: string | null } {
    const pathname = url.pathname;
    const reelMatch = pathname.match(/\/reel(?:s)?\/([a-zA-Z0-9_-]+)/i);
    if (reelMatch && reelMatch[1]) {
      return { id: reelMatch[1], isReel: true, isProfile: false, username: null };
    }

    const postMatch = pathname.match(/\/p\/([a-zA-Z0-9_-]+)/i);
    if (postMatch && postMatch[1]) {
      return { id: postMatch[1], isReel: false, isProfile: false, username: null };
    }

    const tvMatch = pathname.match(/\/tv\/([a-zA-Z0-9_-]+)/i);
    if (tvMatch && tvMatch[1]) {
      return { id: tvMatch[1], isReel: false, isProfile: false, username: null };
    }

    const segments = pathname.split('/').filter(Boolean);
    if (segments.length === 1 && !['explore', 'reels', 'stories', 'direct', 'accounts'].includes(segments[0].toLowerCase())) {
      return { id: null, isReel: false, isProfile: true, username: segments[0] };
    }

    return { id: null, isReel: false, isProfile: false, username: null };
  }

  async resolve(
    url: URL,
    options?: ContentResolutionOptions
  ): Promise<ResolvedContentMetadata | null> {
    const { id, isReel, isProfile, username } = this.extractMediaId(url);
    const canonicalUrl = id
      ? `https://www.instagram.com/${isReel ? 'reel' : 'p'}/${id}/`
      : url.toString();

    let embedUrl: string | undefined = undefined;
    if (id) {
      embedUrl = `https://www.instagram.com/${isReel ? 'reel' : 'p'}/${id}/embed/`;
    }

    const contentType = isReel ? 'video' : isProfile ? 'website' : 'image';
    const aspectRatio = isReel ? '9:16' : isProfile ? '16:9' : '1:1';
    let title = isReel
      ? 'Instagram Reel'
      : isProfile && username
      ? `Instagram Profile (@${username})`
      : 'Instagram Post';
    let description = isProfile && username
      ? `View @${username} on Instagram`
      : 'View media on Instagram';
    let thumbnailUrl: string | undefined = undefined;
    let authorName: string | undefined = username ? `@${username}` : undefined;

    // Try fetching public OpenGraph metadata if available
    try {
      const res = await safeFetch(url.toString(), {
        timeoutMs: options?.timeoutMs ?? 3500,
        allowPrivateIps: options?.allowPrivateIps,
      });

      if (res.ok) {
        const html = await res.text();
        const ogTitle = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i)?.[1];
        const ogDesc = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["']/i)?.[1];
        const ogImage = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']*)["']/i)?.[1];

        if (ogTitle) title = this.sanitizeText(ogTitle, 140);
        if (ogDesc) description = this.sanitizeText(ogDesc, 280);
        if (ogImage && ogImage.startsWith('http')) thumbnailUrl = ogImage;
      }
    } catch {
      // Deterministic fallback
    }

    return this.buildBaseMetadata({
      url,
      contentType,
      title,
      description,
      thumbnailUrl,
      authorName,
      aspectRatio,
      isPlayable: isReel,
      canEmbed: Boolean(embedUrl),
      embedUrl,
      embedHtml: embedUrl
        ? `<iframe src="${embedUrl}" width="100%" height="100%" frameborder="0" scrolling="no" allowtransparency="true" allow="encrypted-media"></iframe>`
        : undefined,
      status: 'resolved',
      extra: { instagramId: id, isReel, isProfile, username, canonicalUrl },
    });
  }
}
