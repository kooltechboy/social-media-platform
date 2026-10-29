/**
 * TUKUBI Universal Content & Media Architecture
 * Facebook Content Provider — Production Grade
 */

import { ContentProviderName, ContentResolutionOptions, ResolvedContentMetadata } from '../types';
import { BaseContentProvider } from './base-provider';
import { safeFetch } from '../ssrf-guard';

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
      host === 'mobile.facebook.com' ||
      host === 'web.facebook.com' ||
      host === 'fb.watch' ||
      host === 'fb.com'
    );
  }

  private extractIdentifiers(url: URL): {
    isVideo: boolean;
    isWatch: boolean;
    isReel: boolean;
    videoId: string | null;
    postId: string | null;
    authorName: string | null;
  } {
    const host = url.hostname.toLowerCase();
    const pathname = url.pathname;
    const isWatch = host === 'fb.watch' || pathname.includes('/watch');
    const isReel = pathname.includes('/reel/') || pathname.includes('/reels/');
    const isVideoPath = pathname.includes('/videos/') || pathname.includes('/video.php');
    const isVideo = isWatch || isReel || isVideoPath;

    let videoId: string | null = null;
    let postId: string | null = null;
    let authorName: string | null = null;

    if (isWatch) {
      videoId = url.searchParams.get('v') || pathname.replace(/^\/+/, '').split('/')[0] || null;
    }

    const reelMatch = pathname.match(/\/reel(?:s)?\/([a-zA-Z0-9_-]+)/i);
    if (reelMatch && reelMatch[1]) {
      videoId = reelMatch[1];
    }

    const videoMatch = pathname.match(/\/videos\/([0-9]+)/i);
    if (videoMatch && videoMatch[1]) {
      videoId = videoMatch[1];
    }

    const postMatch = pathname.match(/\/posts\/([a-zA-Z0-9_-]+)/i);
    if (postMatch && postMatch[1]) {
      postId = postMatch[1];
    }

    // Extract page or user handle from path e.g. /TrinidadCarnival/posts/...
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length >= 1 && !['watch', 'reel', 'reels', 'plugins', 'story.php'].includes(segments[0].toLowerCase())) {
      authorName = decodeURIComponent(segments[0]);
    }

    return { isVideo, isWatch, isReel, videoId, postId, authorName };
  }

  async resolve(
    url: URL,
    options?: ContentResolutionOptions
  ): Promise<ResolvedContentMetadata | null> {
    const { isVideo, isWatch, isReel, videoId, postId, authorName } = this.extractIdentifiers(url);
    const canonicalUrl = url.toString();

    // 1. Determine official Facebook plugin embed URL
    let embedUrl: string | undefined = undefined;
    if (isVideo) {
      embedUrl = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(canonicalUrl)}&show_text=false`;
    } else {
      embedUrl = `https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(canonicalUrl)}&show_text=true`;
    }

    const contentType = isVideo ? 'video' : 'article';
    const aspectRatio = isReel ? '9:16' : '16:9';
    let title = isReel
      ? 'Facebook Reel'
      : isVideo
      ? 'Facebook Video'
      : authorName
      ? `Facebook Post by ${authorName}`
      : 'Facebook Post';

    let description = authorName
      ? `View content by ${authorName} on Facebook`
      : 'View content on Facebook';
    let thumbnailUrl: string | undefined = undefined;

    // 2. Try fetching public OpenGraph metadata via safeFetch
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
      // Graceful fallback to deterministic metadata
    }

    return this.buildBaseMetadata({
      url,
      contentType,
      title,
      description,
      thumbnailUrl,
      authorName: authorName || undefined,
      aspectRatio,
      isPlayable: isVideo,
      canEmbed: true,
      embedUrl,
      embedHtml: embedUrl
        ? `<iframe src="${embedUrl}" width="100%" height="100%" style="border:none;overflow:hidden" scrolling="no" frameborder="0" allowfullscreen="true" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"></iframe>`
        : undefined,
      status: 'resolved',
      extra: { isVideo, isWatch, isReel, videoId, postId },
    });
  }
}
