/**
 * TUKUBI Universal Content & Media Architecture
 * TikTok Content Provider — Production Grade
 */

import { ContentProviderName, ContentResolutionOptions, ResolvedContentMetadata } from '../types';
import { BaseContentProvider } from './base-provider';
import { safeFetch } from '../ssrf-guard';

export class TikTokProvider extends BaseContentProvider {
  readonly name: ContentProviderName = 'tiktok';
  readonly displayName = 'TikTok';

  canHandle(target: URL | string): boolean {
    const url = this.toURL(target);
    if (!url) return false;
    const host = url.hostname.toLowerCase();
    return (
      host === 'tiktok.com' ||
      host === 'www.tiktok.com' ||
      host === 'vt.tiktok.com' ||
      host === 'vm.tiktok.com' ||
      host === 'm.tiktok.com'
    );
  }

  private extractVideoInfo(url: URL): { videoId: string | null; username: string | null } {
    const pathname = url.pathname;
    const pathMatch = pathname.match(/\/video\/(\d+)/);
    const userMatch = pathname.match(/@([a-zA-Z0-9_.-]+)/);
    const vMatch = pathname.match(/\/v\/(\d+)/);

    const videoId = pathMatch?.[1] || vMatch?.[1] || null;
    const username = userMatch?.[1] || null;

    return { videoId, username };
  }

  async resolve(
    url: URL,
    options?: ContentResolutionOptions
  ): Promise<ResolvedContentMetadata | null> {
    const { videoId: urlVideoId, username: urlUsername } = this.extractVideoInfo(url);

    try {
      const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url.toString())}`;
      const res = await safeFetch(oembedUrl, {
        timeoutMs: options?.timeoutMs ?? 3500,
        allowPrivateIps: options?.allowPrivateIps,
      });

      if (res.ok) {
        const data = await res.json<{
          title?: string;
          author_name?: string;
          author_url?: string;
          thumbnail_url?: string;
          thumbnail_width?: number;
          thumbnail_height?: number;
          html?: string;
        }>();

        const title = this.sanitizeText(data.title) || 'TikTok Video';
        const author = this.sanitizeText(data.author_name);
        const htmlMatch = data.html?.match(/data-video-id="(\d+)"/);
        const videoId = urlVideoId || htmlMatch?.[1];
        const embedUrl = videoId ? `https://www.tiktok.com/embed/v2/${videoId}` : undefined;

        return this.buildBaseMetadata({
          url,
          contentType: 'video',
          title,
          description: author ? `Watch video by @${author} on TikTok` : 'Watch on TikTok',
          thumbnailUrl: data.thumbnail_url,
          authorName: author ? `@${author}` : urlUsername ? `@${urlUsername}` : undefined,
          authorUrl: data.author_url,
          embedUrl,
          embedHtml: data.html,
          aspectRatio: '9:16',
          canEmbed: Boolean(embedUrl),
          isPlayable: Boolean(embedUrl),
          status: 'resolved',
          extra: { videoId },
        });
      }
    } catch {
      // Safe fallback
    }

    // High quality deterministic fallback when external oEmbed API is unavailable, private, or rate limited
    const embedUrl = urlVideoId ? `https://www.tiktok.com/embed/v2/${urlVideoId}` : undefined;
    const title = urlUsername ? `TikTok Video by @${urlUsername}` : 'TikTok Video';
    const authorName = urlUsername ? `@${urlUsername}` : undefined;

    return this.buildBaseMetadata({
      url,
      contentType: 'video',
      title,
      description: authorName ? `Watch video by ${authorName} on TikTok` : 'Watch on TikTok',
      authorName,
      embedUrl,
      embedHtml: embedUrl
        ? `<iframe src="${embedUrl}" width="100%" height="100%" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`
        : undefined,
      aspectRatio: '9:16',
      canEmbed: Boolean(embedUrl),
      isPlayable: Boolean(embedUrl),
      status: urlVideoId ? 'resolved' : 'partial',
      extra: { videoId: urlVideoId },
    });
  }
}
