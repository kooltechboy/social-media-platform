/**
 * TUKUBI Universal Content & Media Architecture
 * X / Twitter Content Provider — Production Grade
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
      host === 'twitter.com' ||
      host === 'www.twitter.com' ||
      host === 'x.com' ||
      host === 'www.x.com' ||
      host === 'mobile.twitter.com'
    );
  }

  private extractInfo(url: URL): {
    isStatus: boolean;
    isProfile: boolean;
    username: string | null;
    statusId: string | null;
  } {
    const pathname = url.pathname;
    const statusMatch = pathname.match(/\/(?:i\/web\/status|[^/]+\/status)\/([0-9]+)/i);
    const userMatch = pathname.match(/^\/([a-zA-Z0-9_]{1,15})(?:\/|$)/);

    let username: string | null = null;
    let statusId: string | null = null;

    if (userMatch && !['home', 'explore', 'notifications', 'messages', 'settings', 'i'].includes(userMatch[1].toLowerCase())) {
      username = userMatch[1];
    }

    if (statusMatch && statusMatch[1]) {
      statusId = statusMatch[1];
      return { isStatus: true, isProfile: false, username, statusId };
    }

    if (username) {
      return { isStatus: false, isProfile: true, username, statusId: null };
    }

    return { isStatus: false, isProfile: false, username: null, statusId: null };
  }

  async resolve(
    url: URL,
    options?: ContentResolutionOptions
  ): Promise<ResolvedContentMetadata | null> {
    const { isStatus, isProfile, username, statusId } = this.extractInfo(url);

    // Profile URL resolution
    if (isProfile && username) {
      const handle = `@${username}`;
      return this.buildBaseMetadata({
        url,
        contentType: 'website',
        title: `X Profile (${handle})`,
        description: `View ${handle} on X`,
        authorName: handle,
        authorUrl: `https://x.com/${username}`,
        aspectRatio: '16:9',
        isPlayable: false,
        canEmbed: false,
        status: 'resolved',
        extra: { username },
      });
    }

    // Tweet Status URL resolution
    if (isStatus) {
      try {
        const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(url.toString())}&omit_script=true`;
        const res = await safeFetch(oembedUrl, {
          timeoutMs: options?.timeoutMs ?? 3500,
          allowPrivateIps: options?.allowPrivateIps,
        });

        if (res.ok) {
          const data = await res.json<{
            author_name?: string;
            author_url?: string;
            html?: string;
          }>();

          const author = this.sanitizeText(data.author_name) || (username ? `@${username}` : 'Post on X');
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
            authorUrl: data.author_url || (username ? `https://x.com/${username}` : undefined),
            embedHtml: data.html,
            aspectRatio: '16:9',
            isPlayable: false,
            status: 'resolved',
            extra: { statusId, username },
          });
        }
      } catch {
        // Fallback below
      }

      // Deterministic tweet fallback when publish.twitter.com fails or is throttled
      const author = username ? `@${username}` : 'Post on X';
      return this.buildBaseMetadata({
        url,
        contentType: 'article',
        title: `Post by ${author} on X`,
        description: `View post by ${author} on X`,
        authorName: author,
        authorUrl: username ? `https://x.com/${username}` : undefined,
        aspectRatio: '16:9',
        isPlayable: false,
        canEmbed: false,
        status: 'resolved',
        extra: { statusId, username },
      });
    }

    return this.buildFallback(url, 'Could not resolve content on X');
  }
}
