/**
 * TUKUBI Universal Content & Media Architecture
 * X / Twitter Content Provider
 */

import { ContentProviderName, ContentResolutionOptions, ResolvedContentMetadata } from '../types';
import { BaseContentProvider } from './base-provider';
import { safeFetch } from '../ssrf-guard';

export class TwitterProvider extends BaseContentProvider {
  readonly name: ContentProviderName = 'twitter';
  readonly displayName = 'X';

  canHandle(target: URL | string): boolean {
    const url = this.toURL(target);
    if (!url) return false;
    const host = url.hostname.toLowerCase();
    return (
      (host === 'twitter.com' ||
        host === 'www.twitter.com' ||
        host === 'x.com' ||
        host === 'www.x.com' ||
        host === 'mobile.twitter.com') &&
      url.pathname.includes('/status/')
    );
  }

  async resolve(
    url: URL,
    options?: ContentResolutionOptions
  ): Promise<ResolvedContentMetadata | null> {
    try {
      const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(url.toString())}&omit_script=true`;
      const res = await safeFetch(oembedUrl, {
        timeoutMs: options?.timeoutMs ?? 4000,
        allowPrivateIps: options?.allowPrivateIps,
      });

      if (res.ok) {
        const data = await res.json<{
          author_name?: string;
          author_url?: string;
          html?: string;
        }>();

        const author = this.sanitizeText(data.author_name) || 'Post on X';
        // Extract clean text from tweet HTML blockquote
        let textExcerpt: string | undefined;
        if (data.html) {
          const match = data.html.match(/<p[^>]*>(.*?)<\/p>/i);
          if (match) {
            textExcerpt = this.sanitizeText(match[1]);
          }
        }

        return this.buildBaseMetadata({
          url,
          contentType: 'article',
          title: `Post by ${author} on X`,
          description: textExcerpt || `View post by ${author} on X`,
          authorName: author,
          authorUrl: data.author_url,
          embedHtml: data.html,
          aspectRatio: '16:9',
          isPlayable: false,
          status: 'resolved',
        });
      }
    } catch {
      // Safe fallback
    }

    return this.buildFallback(url, 'Could not resolve post on X');
  }
}
