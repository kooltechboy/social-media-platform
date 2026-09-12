/**
 * TUKUBI Enterprise Video Streaming & Adaptive Bitrate (HLS) Subsystem
 * Architecture adhering to Caribbean Futurism standards.
 */

export type StreamingProviderName = 'mux' | 'cloudflare' | 'supabase_storage';

export interface VideoThumbnailOptions {
  timeSec?: number;
  width?: number;
  height?: number;
  format?: 'webp' | 'jpg' | 'png';
}

export interface StreamingProvider {
  readonly name: StreamingProviderName;

  /**
   * Generates an adaptive bitrate HLS (.m3u8) playback manifest URL.
   */
  getPlaybackUrl(assetId: string, fallbackUrl?: string): string;

  /**
   * Generates a video poster / thumbnail image URL at a given timestamp.
   */
  getThumbnailUrl(assetId: string, options?: VideoThumbnailOptions): string;

  /**
   * Verifies if a given URL is a valid streaming manifest.
   */
  isStreamingManifest(url: string): boolean;
}

export class MuxStreamingAdapter implements StreamingProvider {
  readonly name: StreamingProviderName = 'mux';

  getPlaybackUrl(assetId: string, fallbackUrl?: string): string {
    if (!assetId && fallbackUrl) return fallbackUrl;
    const cleanId = assetId.replace(/\.m3u8$/, '');
    return `https://stream.mux.com/${cleanId}.m3u8`;
  }

  getThumbnailUrl(assetId: string, options?: VideoThumbnailOptions): string {
    const cleanId = assetId.replace(/\.m3u8$/, '');
    const time = options?.timeSec ?? 1;
    const width = options?.width ? `&width=${options.width}` : '';
    const height = options?.height ? `&height=${options.height}` : '';
    const format = options?.format ?? 'webp';
    return `https://image.mux.com/${cleanId}/thumbnail.${format}?time=${time}${width}${height}`;
  }

  isStreamingManifest(url: string): boolean {
    return url.includes('stream.mux.com') || url.endsWith('.m3u8');
  }
}

export class CloudflareStreamAdapter implements StreamingProvider {
  readonly name: StreamingProviderName = 'cloudflare';

  getPlaybackUrl(assetId: string, fallbackUrl?: string): string {
    if (!assetId && fallbackUrl) return fallbackUrl;
    const cleanId = assetId.replace(/\/manifest\/video\.m3u8$/, '');
    return `https://videodelivery.net/${cleanId}/manifest/video.m3u8`;
  }

  getThumbnailUrl(assetId: string, options?: VideoThumbnailOptions): string {
    const cleanId = assetId.replace(/\/manifest\/video\.m3u8$/, '');
    const time = options?.timeSec ?? 1;
    const width = options?.width ? `&width=${options.width}` : '';
    const height = options?.height ? `&height=${options.height}` : '';
    return `https://videodelivery.net/${cleanId}/thumbnails/thumbnail.webp?time=${time}s${width}${height}`;
  }

  isStreamingManifest(url: string): boolean {
    return url.includes('videodelivery.net') || url.endsWith('.m3u8');
  }
}

export class SupabaseStorageStreamingAdapter implements StreamingProvider {
  readonly name: StreamingProviderName = 'supabase_storage';

  getPlaybackUrl(assetId: string, fallbackUrl?: string): string {
    return fallbackUrl || assetId;
  }

  getThumbnailUrl(assetId: string, options?: VideoThumbnailOptions): string {
    // For direct storage, if no thumbnail exists, use fallback or return asset URL
    if (assetId.includes('/post-media/')) {
      return assetId.replace(/\.(mp4|mov|webm)$/i, '-thumb.webp');
    }
    return assetId;
  }

  isStreamingManifest(url: string): boolean {
    return url.endsWith('.m3u8');
  }
}

/**
 * Factory to resolve the active streaming provider based on configuration.
 */
export function resolveStreamingProvider(providerName?: string): StreamingProvider {
  const normalized = (providerName || process.env.NEXT_PUBLIC_VIDEO_STREAMING_PROVIDER || 'supabase_storage').toLowerCase();

  switch (normalized) {
    case 'mux':
      return new MuxStreamingAdapter();
    case 'cloudflare':
    case 'cloudflare_stream':
      return new CloudflareStreamAdapter();
    case 'supabase_storage':
    default:
      return new SupabaseStorageStreamingAdapter();
  }
}
