/**
 * TUKUBI Universal Content & Media Architecture
 * Instagram Content Provider
 */

import { ContentProviderName, ContentResolutionOptions, ResolvedContentMetadata } from '../types';
import { BaseContentProvider } from './base-provider';

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

  extractMediaId(url: URL): { id: string | null; isReel: boolean } {
    const pathname = url.pathname;
    const reelMatch = pathname.match(/\/reel\/([a-zA-Z0-9_-]+)/i);
    if (reelMatch && reelMatch[1]) {
      return { id: reelMatch[1], isReel: true };
    }

    const postMatch = pathname.match(/\/p\/([a-zA-Z0-9_-]+)/i);
    if (postMatch && postMatch[1]) {
      return { id: postMatch[1], isReel: false };
    }

    const tvMatch = pathname.match(/\/tv\/([a-zA-Z0-9_-]+)/i);
    if (tvMatch && tvMatch[1]) {
      return { id: tvMatch[1], isReel: false };
    }

    return { id: null, isReel: false };
  }

  async resolve(
    url: URL,
    _options?: ContentResolutionOptions
  ): Promise<ResolvedContentMetadata | null> {
    const { id, isReel } = this.extractMediaId(url);
    const canonicalUrl = id
      ? `https://www.instagram.com/${isReel ? 'reel' : 'p'}/${id}/`
      : url.toString();

    const title = isReel ? 'Instagram Reel' : 'Instagram Post';
    const description = 'View media on Instagram';

    return this.buildBaseMetadata({
      url,
      contentType: isReel ? 'video' : 'image',
      title,
      description,
      aspectRatio: isReel ? '9:16' : '1:1',
      isPlayable: false,
      canEmbed: false, // Protected by Meta walled-garden policy; link preview card rendered safely
      status: 'resolved',
      extra: { instagramId: id, isReel, canonicalUrl },
    });
  }
}
