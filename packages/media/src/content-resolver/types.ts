/**
 * TUKUBI Universal Content & Media Architecture
 * Type Definitions & Contracts
 */

export type ContentType =
  | 'video'
  | 'audio'
  | 'podcast'
  | 'article'
  | 'image'
  | 'product'
  | 'event'
  | 'map'
  | 'website';

export type ContentProviderName =
  | 'youtube'
  | 'spotify'
  | 'soundcloud'
  | 'apple_music'
  | 'apple_podcasts'
  | 'tiktok'
  | 'twitter'
  | 'vimeo'
  | 'facebook'
  | 'instagram'
  | 'tukubi_sound'
  | 'tukubi_video'
  | 'google_maps'
  | 'apple_maps'
  | 'generic';

export type ContentResolutionStatus =
  | 'resolved'
  | 'partial'
  | 'fallback'
  | 'failed'
  | 'blocked';

export interface ResolvedContentMetadata {
  url: string;
  normalizedUrl: string;
  canonicalUrl?: string;
  provider: ContentProviderName;
  providerDisplayName: string;
  providerIcon?: string;
  contentType: ContentType;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  thumbnailWidth?: number;
  thumbnailHeight?: number;
  authorName?: string;
  authorUrl?: string;
  authorAvatarUrl?: string;
  durationSeconds?: number;
  durationFormatted?: string;
  siteName?: string;
  faviconUrl?: string;
  publishedTime?: string;
  embedUrl?: string;
  embedHtml?: string;
  aspectRatio?: string;
  isPlayable: boolean;
  extra?: Record<string, unknown>;
  status: ContentResolutionStatus;
  httpStatus?: number;
  errorMessage?: string;
  resolvedAt: string;
}

export interface UrlDetectionResult {
  urls: string[];
  primaryUrl?: string;
  normalizedUrls: string[];
  hasUrls: boolean;
}

export interface ContentProvider {
  readonly name: ContentProviderName;
  readonly displayName: string;
  canHandle(url: URL | string): boolean;
  resolve(url: URL, options?: ContentResolutionOptions): Promise<ResolvedContentMetadata | null>;
}

export interface ContentResolutionOptions {
  timeoutMs?: number;
  maxRedirects?: number;
  userAgent?: string;
  allowPrivateIps?: boolean; // For testing in mock harness only, default false
}

export interface UrlMetadataCacheRow {
  url_hash: string;
  raw_url: string;
  normalized_url: string;
  canonical_url: string | null;
  provider: string;
  content_type: string;
  title: string | null;
  description: string | null;
  thumbnail_url: string | null;
  thumbnail_width: number | null;
  thumbnail_height: number | null;
  author_name: string | null;
  author_url: string | null;
  duration_seconds: number | null;
  site_name: string | null;
  favicon_url: string | null;
  embed_html: string | null;
  embed_url: string | null;
  extra_metadata: Record<string, unknown>;
  status: string;
  http_status: number | null;
  error_message: string | null;
  created_at: string;
  fetched_at: string;
  expires_at: string;
}
