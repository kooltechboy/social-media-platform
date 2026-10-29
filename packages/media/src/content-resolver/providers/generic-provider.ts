/**
 * TUKUBI Universal Content & Media Architecture
 * Generic Web Provider (OpenGraph, Twitter Cards, Schema.org JSON-LD) — Hardened
 */

import { ContentProviderName, ContentResolutionOptions, ContentType, ResolvedContentMetadata } from '../types';
import { BaseContentProvider } from './base-provider';
import { safeFetch, isPrivateIpv4, isPrivateIpv6 } from '../ssrf-guard';
import { extractDomain } from '../url-detector';

export class GenericWebProvider extends BaseContentProvider {
  readonly name: ContentProviderName = 'generic';
  readonly displayName = 'Web';

  canHandle(target: URL | string): boolean {
    const url = this.toURL(target);
    return Boolean(url && (url.protocol === 'http:' || url.protocol === 'https:'));
  }

  /**
   * Evaluates whether an extracted thumbnail, favicon, or media URL targets private or internal IP ranges.
   */
  public isDangerousExtractedMediaUrl(rawUrl?: string): boolean {
    if (!rawUrl || typeof rawUrl !== 'string') return false;
    try {
      const u = new URL(rawUrl);
      if (u.protocol !== 'http:' && u.protocol !== 'https:') return true;

      const host = u.hostname.toLowerCase();
      if (
        host === 'localhost' ||
        host === '127.0.0.1' ||
        host === '169.254.169.254' ||
        host === 'metadata.google.internal' ||
        host.endsWith('.local') ||
        host.endsWith('.internal')
      ) {
        return true;
      }

      if (/^\d+\.\d+\.\d+\.\d+$/.test(host) && isPrivateIpv4(host)) {
        return true;
      }

      if ((host.includes(':') || host.startsWith('[')) && isPrivateIpv6(host.replace(/[\[\]]/g, ''))) {
        return true;
      }

      return false;
    } catch {
      return true;
    }
  }

  private extractMeta(html: string, nameOrProperty: string): string | undefined {
    const pattern1 = new RegExp(
      `<meta\\s+[^>]*(?:property|name)=["']${nameOrProperty}["'][^>]*content=["']([^"']*)["']`,
      'i'
    );
    const match1 = html.match(pattern1);
    if (match1 && match1[1]) return match1[1];

    const pattern2 = new RegExp(
      `<meta\\s+[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']${nameOrProperty}["']`,
      'i'
    );
    const match2 = html.match(pattern2);
    if (match2 && match2[1]) return match2[1];

    return undefined;
  }

  private extractTitle(html: string): string | undefined {
    const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    return match ? match[1] : undefined;
  }

  private extractFavicon(html: string, baseUrl: URL): string | undefined {
    const match = html.match(/<link\s+[^>]*rel=["'](?:shortcut\s+)?icon["'][^>]*href=["']([^"']*)["']/i);
    if (match && match[1]) {
      try {
        const resolved = new URL(match[1], baseUrl).toString();
        return this.isDangerousExtractedMediaUrl(resolved) ? undefined : resolved;
      } catch {
        return undefined;
      }
    }
    return undefined;
  }

  private extractJsonLd(html: string): Record<string, any> | null {
    try {
      const match = html.match(/<script\s+[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
      if (match && match[1]) {
        const parsed = JSON.parse(match[1]);
        if (Array.isArray(parsed)) return parsed[0];
        if (parsed['@graph'] && Array.isArray(parsed['@graph'])) return parsed['@graph'][0];
        return parsed;
      }
    } catch {
      // Ignored
    }
    return null;
  }

  /**
   * Pure parser for extracted HTML strings (testable & decoupled).
   */
  public parseHtmlMetadata(html: string, url: URL): ResolvedContentMetadata {
    const domain = extractDomain(url.toString());

    // Extract Open Graph & Twitter Card tags
    const ogTitle = this.extractMeta(html, 'og:title');
    const twitterTitle = this.extractMeta(html, 'twitter:title');
    const docTitle = this.extractTitle(html);
    const title = this.sanitizeText(ogTitle || twitterTitle || docTitle || domain, 160);

    const ogDesc = this.extractMeta(html, 'og:description');
    const twitterDesc = this.extractMeta(html, 'twitter:description');
    const metaDesc = this.extractMeta(html, 'description');
    const description = this.sanitizeText(ogDesc || twitterDesc || metaDesc, 300);

    let ogImage = this.extractMeta(html, 'og:image') || this.extractMeta(html, 'twitter:image');
    if (ogImage && !ogImage.startsWith('http')) {
      try {
        ogImage = new URL(ogImage, url).toString();
      } catch {
        ogImage = undefined;
      }
    }
    if (ogImage && this.isDangerousExtractedMediaUrl(ogImage)) {
      ogImage = undefined;
    }

    const siteName = this.sanitizeText(this.extractMeta(html, 'og:site_name') || domain, 60);
    const authorName = this.sanitizeText(this.extractMeta(html, 'author') || this.extractMeta(html, 'article:author'), 60);
    const faviconUrl = this.extractFavicon(html, url) || this.getFaviconUrl(url);

    // Media indicators
    const ogVideo = this.extractMeta(html, 'og:video') || this.extractMeta(html, 'og:video:url');
    const ogAudio = this.extractMeta(html, 'og:audio');
    const ogType = this.extractMeta(html, 'og:type')?.toLowerCase();

    // Schema.org Structured Data
    const jsonLd = this.extractJsonLd(html);
    const ldType = (jsonLd?.['@type'] || '').toLowerCase();

    // Content classification
    let contentType: ContentType = 'article';

    if (ldType.includes('product') || this.extractMeta(html, 'product:price:amount')) {
      contentType = 'product';
    } else if (ldType.includes('event')) {
      contentType = 'event';
    } else if (ogVideo || ldType.includes('video') || ogType?.includes('video')) {
      contentType = 'video';
    } else if (ogAudio || ldType.includes('music') || ldType.includes('audio') || ogType?.includes('music')) {
      contentType = 'audio';
    } else if (ogType === 'website' || (!ogImage && !description)) {
      contentType = 'website';
    }

    const extra: Record<string, unknown> = {};
    if (contentType === 'product') {
      const price = this.extractMeta(html, 'product:price:amount') || jsonLd?.offers?.price || jsonLd?.price;
      const currency = this.extractMeta(html, 'product:price:currency') || jsonLd?.offers?.priceCurrency || jsonLd?.priceCurrency || 'USD';
      if (price) {
        extra.price = price;
        extra.currency = currency;
      }
    }

    if (contentType === 'event') {
      const startDate = jsonLd?.startDate || this.extractMeta(html, 'event:start_time');
      const location = jsonLd?.location?.name || jsonLd?.location?.address?.addressLocality || this.extractMeta(html, 'event:location');
      if (startDate) extra.startDate = startDate;
      if (location) extra.location = location;
    }

    return {
      url: url.toString(),
      normalizedUrl: url.toString(),
      canonicalUrl: this.extractMeta(html, 'og:url') || url.toString(),
      provider: 'generic',
      providerDisplayName: siteName,
      contentType,
      title: title || domain,
      description: description || undefined,
      thumbnailUrl: ogImage,
      siteName,
      authorName: authorName || undefined,
      faviconUrl,
      aspectRatio: contentType === 'video' ? '16:9' : undefined,
      isPlayable: Boolean(ogVideo),
      canEmbed: Boolean(ogVideo),
      extra: Object.keys(extra).length > 0 ? extra : undefined,
      status: 'resolved',
      resolvedAt: new Date().toISOString(),
    };
  }

  async resolve(
    url: URL,
    options?: ContentResolutionOptions
  ): Promise<ResolvedContentMetadata | null> {
    try {
      const res = await safeFetch(url.toString(), {
        timeoutMs: options?.timeoutMs ?? 4000,
        allowPrivateIps: options?.allowPrivateIps,
      });

      if (!res.ok) {
        return this.buildFallback(url, `HTTP Error ${res.status}`);
      }

      const html = await res.text();
      return this.parseHtmlMetadata(html, url);
    } catch (err: any) {
      return this.buildFallback(url, err?.message || 'Resolution failed');
    }
  }
}

export const GenericProvider = GenericWebProvider;
export type GenericProvider = GenericWebProvider;

