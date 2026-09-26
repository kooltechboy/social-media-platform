/**
 * TUKUBI Universal Content & Media Architecture
 * Base Content Provider Abstract Definition
 */

import {
  ContentProvider,
  ContentProviderName,
  ContentResolutionOptions,
  ContentResolutionStatus,
  ContentType,
  ResolvedContentMetadata,
} from '../types';
import { extractDomain, normalizeUrl } from '../url-detector';

export abstract class BaseContentProvider implements ContentProvider {
  abstract readonly name: ContentProviderName;
  abstract readonly displayName: string;

  abstract canHandle(url: URL | string): boolean;
  abstract resolve(
    url: URL,
    options?: ContentResolutionOptions
  ): Promise<ResolvedContentMetadata | null>;

  /**
   * Helper to parse string or URL into a URL object safely.
   */
  protected toURL(input: URL | string): URL | null {
    if (input instanceof URL) return input;
    if (typeof input !== 'string' || !input.trim()) return null;
    try {
      return new URL(input);
    } catch {
      if (input.startsWith('/')) {
        try {
          return new URL(input, 'https://tukubi.com');
        } catch {
          return null;
        }
      }
      return null;
    }
  }

  /**
   * Sanitizes human-facing strings (removes HTML tags, decodes common entities, truncates safely).
   */
  protected sanitizeText(input?: string | null, maxLength = 300): string {
    if (!input || typeof input !== 'string') return '';

    // Strip HTML tags
    let clean = input.replace(/<\/?[^>]+(>|$)/g, '');

    // Decode common HTML entities
    clean = clean
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (clean.length > maxLength) {
      return `${clean.slice(0, maxLength - 1).trim()}…`;
    }

    return clean;
  }

  /**
   * Builds a consistent baseline metadata object.
   */
  protected buildBaseMetadata(params: {
    url: URL;
    contentType: ContentType;
    title: string;
    description?: string;
    thumbnailUrl?: string;
    authorName?: string;
    authorUrl?: string;
    durationSeconds?: number;
    embedUrl?: string;
    embedHtml?: string;
    aspectRatio?: string;
    isPlayable?: boolean;
    extra?: Record<string, unknown>;
    status?: ContentResolutionStatus;
  }): ResolvedContentMetadata {
    const rawUrlStr = params.url.toString();
    const normalized = normalizeUrl(rawUrlStr);

    return {
      url: rawUrlStr,
      normalizedUrl: normalized,
      canonicalUrl: normalized,
      provider: this.name,
      providerDisplayName: this.displayName,
      providerIcon: this.getProviderIcon(),
      contentType: params.contentType,
      title: this.sanitizeText(params.title, 160) || this.displayName,
      description: this.sanitizeText(params.description, 350) || undefined,
      thumbnailUrl: params.thumbnailUrl,
      authorName: this.sanitizeText(params.authorName, 80) || undefined,
      authorUrl: params.authorUrl,
      durationSeconds: params.durationSeconds,
      durationFormatted: params.durationSeconds
        ? this.formatDuration(params.durationSeconds)
        : undefined,
      siteName: this.displayName,
      faviconUrl: this.getFaviconUrl(params.url),
      embedUrl: params.embedUrl,
      embedHtml: params.embedHtml,
      aspectRatio: params.aspectRatio,
      isPlayable: params.isPlayable ?? false,
      extra: params.extra,
      status: params.status || 'resolved',
      resolvedAt: new Date().toISOString(),
    };
  }

  protected getFaviconUrl(url: URL): string {
    return `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=64`;
  }

  protected getProviderIcon(): string | undefined {
    return undefined;
  }

  protected formatDuration(seconds: number): string {
    if (isNaN(seconds) || seconds <= 0) return '';
    const total = Math.floor(seconds);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  /**
   * Generates a clean fallback card for deleted or unresolvable content on this provider.
   */
  public buildFallback(
    url: URL,
    errorMessage?: string,
    status: ContentResolutionStatus = 'fallback'
  ): ResolvedContentMetadata {
    const domain = extractDomain(url.toString());
    return {
      url: url.toString(),
      normalizedUrl: normalizeUrl(url.toString()),
      provider: this.name,
      providerDisplayName: this.displayName,
      contentType: 'website',
      title: `${this.displayName} Link`,
      description: `View content on ${domain}`,
      siteName: this.displayName,
      faviconUrl: this.getFaviconUrl(url),
      isPlayable: false,
      status,
      errorMessage,
      resolvedAt: new Date().toISOString(),
    };
  }
}
