/**
 * TUKUBI Universal Content & Media Architecture
 * Reddit Content Provider
 */

import { ContentProviderName, ContentResolutionOptions, ResolvedContentMetadata } from '../types';
import { BaseContentProvider } from './base-provider';

export class RedditProvider extends BaseContentProvider {
  readonly name: ContentProviderName = 'reddit';
  readonly displayName = 'Reddit';

  canHandle(target: URL | string): boolean {
    const url = this.toURL(target);
    if (!url) return false;
    const host = url.hostname.toLowerCase();
    return (
      host === 'reddit.com' ||
      host === 'www.reddit.com' ||
      host === 'old.reddit.com' ||
      host === 'redd.it'
    );
  }

  async resolve(
    url: URL,
    _options?: ContentResolutionOptions
  ): Promise<ResolvedContentMetadata | null> {
    const pathname = url.pathname;
    let subreddit = 'reddit';
    const subMatch = pathname.match(/\/r\/([a-zA-Z0-9_]+)/i);
    if (subMatch && subMatch[1]) {
      subreddit = `r/${subMatch[1]}`;
    }

    const title = `Discussion on ${subreddit}`;
    const description = 'View discussion and community conversation on Reddit';

    return this.buildBaseMetadata({
      url,
      contentType: 'article',
      title,
      description,
      siteName: 'Reddit',
      isPlayable: false,
      canEmbed: false,
      status: 'resolved',
      extra: { subreddit },
    });
  }
}
