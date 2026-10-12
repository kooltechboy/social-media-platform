/**
 * TUKUBI Universal Content & Media Architecture
 * Threads Content Provider
 */

import { ContentProviderName, ContentResolutionOptions, ResolvedContentMetadata } from '../types';
import { BaseContentProvider } from './base-provider';

export class ThreadsProvider extends BaseContentProvider {
  readonly name: ContentProviderName = 'threads';
  readonly displayName = 'Threads';

  canHandle(target: URL | string): boolean {
    const url = this.toURL(target);
    if (!url) return false;
    const host = url.hostname.toLowerCase();
    return host === 'threads.net' || host === 'www.threads.net';
  }

  async resolve(
    url: URL,
    _options?: ContentResolutionOptions
  ): Promise<ResolvedContentMetadata | null> {
    const userMatch = url.pathname.match(/@([a-zA-Z0-9_.-]+)/i);
    const author = userMatch && userMatch[1] ? `@${userMatch[1]}` : undefined;

    return this.buildBaseMetadata({
      url,
      contentType: 'article',
      title: author ? `Post by ${author} on Threads` : 'Threads Post',
      description: 'View thread and conversation on Threads',
      authorName: author,
      siteName: 'Threads',
      isPlayable: false,
      canEmbed: false,
      status: 'resolved',
      extra: { author },
    });
  }
}
