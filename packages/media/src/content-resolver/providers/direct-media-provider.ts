/**
 * TUKUBI Universal Content & Media Architecture
 * Direct Media Provider (.mp4, .webm, .mp3, .wav, .jpg, .png, etc.)
 */

import { ContentProviderName, ContentResolutionOptions, ContentType, ResolvedContentMetadata } from '../types';
import { BaseContentProvider } from './base-provider';
import { extractDomain } from '../url-detector';

const VIDEO_EXTENSIONS = new Set(['mp4', 'webm', 'mov', 'm3u8']);
const AUDIO_EXTENSIONS = new Set(['mp3', 'wav', 'ogg', 'm4a', 'aac']);
const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg']);

export class DirectMediaProvider extends BaseContentProvider {
  readonly name: ContentProviderName = 'direct_media';
  readonly displayName = 'Direct Media';

  private getExtension(url: URL): string | null {
    const pathname = url.pathname.toLowerCase();
    const lastPart = pathname.split('/').pop() || '';
    const dotIdx = lastPart.lastIndexOf('.');
    if (dotIdx === -1) return null;
    return lastPart.slice(dotIdx + 1).split('?')[0];
  }

  canHandle(target: URL | string): boolean {
    const url = this.toURL(target);
    if (!url) return false;
    const ext = this.getExtension(url);
    if (!ext) return false;
    return VIDEO_EXTENSIONS.has(ext) || AUDIO_EXTENSIONS.has(ext) || IMAGE_EXTENSIONS.has(ext);
  }

  async resolve(
    url: URL,
    _options?: ContentResolutionOptions
  ): Promise<ResolvedContentMetadata | null> {
    const ext = this.getExtension(url);
    if (!ext) {
      return this.buildFallback(url, 'Not a direct media URL');
    }

    const domain = extractDomain(url.toString());
    const pathname = url.pathname;
    const rawFileName = pathname.split('/').pop() || 'Media File';
    const cleanFileName = decodeURIComponent(rawFileName.replace(/\.[^/.]+$/, ''))
      .replace(/[-_]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const title = cleanFileName
      ? cleanFileName.charAt(0).toUpperCase() + cleanFileName.slice(1)
      : 'Direct Media';

    let contentType: ContentType = 'website';
    let isPlayable = false;
    let thumbnailUrl: string | undefined = undefined;
    let embedUrl: string | undefined = undefined;
    const extra: Record<string, unknown> = { extension: ext };

    if (IMAGE_EXTENSIONS.has(ext)) {
      contentType = 'image';
      thumbnailUrl = url.toString();
      isPlayable = false;
    } else if (VIDEO_EXTENSIONS.has(ext)) {
      contentType = 'video';
      embedUrl = url.toString();
      isPlayable = true;
      extra.videoUrl = url.toString();
    } else if (AUDIO_EXTENSIONS.has(ext)) {
      contentType = 'audio';
      embedUrl = url.toString();
      isPlayable = true;
      extra.audioUrl = url.toString();
    }

    return this.buildBaseMetadata({
      url,
      contentType,
      title,
      description: `${contentType.toUpperCase()} file from ${domain}`,
      thumbnailUrl,
      embedUrl,
      aspectRatio: contentType === 'video' ? '16:9' : undefined,
      isPlayable,
      extra,
      status: 'resolved',
    });
  }
}
