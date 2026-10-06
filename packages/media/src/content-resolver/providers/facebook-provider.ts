/**
 * TUKUBI Universal Content & Media Architecture
 * Facebook Content Provider
 */

import { ContentProviderName, ContentResolutionOptions, ResolvedContentMetadata } from '../types';
import { BaseContentProvider } from './base-provider';

export class FacebookProvider extends BaseContentProvider {
  readonly name: ContentProviderName = 'facebook';
  readonly displayName = 'Facebook';

  canHandle(target: URL | string): boolean {
    const url = this.toURL(target);
    if (!url) return false;
    const host = url.hostname.toLowerCase();
    return (
      host === 'facebook.com' ||
      host === 'www.facebook.com' ||
      host === 'm.facebook.com' ||
      host === 'fb.watch' ||
      host === 'web.facebook.com'
    );
  }

  async resolve(
    url: URL,
    _options?: ContentResolutionOptions
  ): Promise<ResolvedContentMetadata | null> {
    const isWatch = url.hostname === 'fb.watch' || url.pathname.includes('/watch');
    const isVideo = isWatch || url.pathname.includes('/videos/');
    const title = isVideo ? 'Facebook Video' : 'Facebook Post';

    return this.buildBaseMetadata({
      url,
      contentType: isVideo ? 'video' : 'article',
      title,
      description: 'View content on Facebook',
      aspectRatio: '16:9',
      isPlayable: false,
      canEmbed: false,
      status: 'resolved',
      extra: { isVideo, isWatch },
    });
  }
}
