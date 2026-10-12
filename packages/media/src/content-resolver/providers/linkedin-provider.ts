/**
 * TUKUBI Universal Content & Media Architecture
 * LinkedIn Content Provider
 */

import { ContentProviderName, ContentResolutionOptions, ResolvedContentMetadata } from '../types';
import { BaseContentProvider } from './base-provider';

export class LinkedInProvider extends BaseContentProvider {
  readonly name: ContentProviderName = 'linkedin';
  readonly displayName = 'LinkedIn';

  canHandle(target: URL | string): boolean {
    const url = this.toURL(target);
    if (!url) return false;
    const host = url.hostname.toLowerCase();
    return host === 'linkedin.com' || host === 'www.linkedin.com';
  }

  async resolve(
    url: URL,
    _options?: ContentResolutionOptions
  ): Promise<ResolvedContentMetadata | null> {
    const isPulse = url.pathname.includes('/pulse/');
    const title = isPulse ? 'Article on LinkedIn' : 'Post on LinkedIn';
    const description = 'View professional article and insights on LinkedIn';

    return this.buildBaseMetadata({
      url,
      contentType: 'article',
      title,
      description,
      siteName: 'LinkedIn',
      isPlayable: false,
      canEmbed: false,
      status: 'resolved',
      extra: { isPulse },
    });
  }
}
