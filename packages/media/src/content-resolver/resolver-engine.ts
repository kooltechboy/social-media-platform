/**
 * TUKUBI Universal Content & Media Architecture
 * Master Resolver Engine & Provider Orchestrator
 */

import {
  ContentProvider,
  ContentResolutionOptions,
  ResolvedContentMetadata,
} from './types';
import { normalizeUrl } from './url-detector';
import { TukubiMediaProvider } from './providers/tukubi-provider';
import { YouTubeProvider } from './providers/youtube-provider';
import { SpotifyProvider } from './providers/spotify-provider';
import { SoundCloudProvider } from './providers/soundcloud-provider';
import { AppleProvider } from './providers/apple-provider';
import { TikTokProvider } from './providers/tiktok-provider';
import { VimeoProvider } from './providers/vimeo-provider';
import { TwitterProvider } from './providers/twitter-provider';
import { LocationProvider } from './providers/location-provider';
import { GenericWebProvider } from './providers/generic-provider';

export interface CacheEntry {
  data: ResolvedContentMetadata;
  expiresAt: number;
}

export class ContentResolverEngine {
  private static instance: ContentResolverEngine | null = null;
  private providers: ContentProvider[] = [];
  private fallbackProvider: ContentProvider;
  private memoryCache: Map<string, CacheEntry> = new Map();
  private maxCacheEntries = 1000;
  private defaultTtlMs = 60 * 60 * 1000; // 1 hour memory TTL

  constructor() {
    this.fallbackProvider = new GenericWebProvider();

    // Default registered provider chain ordered by specificity
    this.providers = [
      new TukubiMediaProvider(),
      new YouTubeProvider(),
      new SpotifyProvider(),
      new SoundCloudProvider(),
      new AppleProvider(),
      new TikTokProvider(),
      new VimeoProvider(),
      new TwitterProvider(),
      new LocationProvider(),
    ];
  }

  public static getInstance(): ContentResolverEngine {
    if (!ContentResolverEngine.instance) {
      ContentResolverEngine.instance = new ContentResolverEngine();
    }
    return ContentResolverEngine.instance;
  }

  /**
   * Registers a new provider into the resolution chain before the generic fallback.
   * Enables seamless future extension without touching existing code.
   */
  public registerProvider(provider: ContentProvider, priority: 'prepend' | 'append' = 'prepend'): void {
    if (priority === 'prepend') {
      this.providers.unshift(provider);
    } else {
      this.providers.push(provider);
    }
  }

  /**
   * Returns registered content providers.
   */
  public getProviders(): ReadonlyArray<ContentProvider> {
    return [...this.providers, this.fallbackProvider];
  }

  /**
   * Resolves a URL into a rich, structured metadata object.
   */
  public async resolve(
    rawUrl: string,
    options?: ContentResolutionOptions & { forceRefresh?: boolean }
  ): Promise<ResolvedContentMetadata> {
    const normalized = normalizeUrl(rawUrl);

    // 1. Check in-memory LRU cache
    if (!options?.forceRefresh) {
      const cached = this.memoryCache.get(normalized);
      if (cached && cached.expiresAt > Date.now()) {
        return cached.data;
      }
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(normalized);
    } catch {
      if (normalized.startsWith('/')) {
        try {
          parsedUrl = new URL(normalized, 'https://tukubi.com');
        } catch {
          // Fall through to failure
        }
      }

      if (!parsedUrl!) {
        return {
          url: rawUrl,
          normalizedUrl: normalized || rawUrl,
          provider: 'generic',
          providerDisplayName: 'Link',
          contentType: 'website',
          title: rawUrl,
          isPlayable: false,
          status: 'failed',
          errorMessage: 'Invalid URL syntax',
          resolvedAt: new Date().toISOString(),
        };
      }
    }

    // 2. Identify candidate provider
    let matchedProvider = this.providers.find((p) => p.canHandle(parsedUrl));
    if (!matchedProvider) {
      matchedProvider = this.fallbackProvider;
    }

    let result: ResolvedContentMetadata | null = null;
    try {
      result = await matchedProvider.resolve(parsedUrl, options);
    } catch (err: any) {
      // If specialized provider throws an unexpected error, attempt generic fallback
      if (matchedProvider !== this.fallbackProvider) {
        try {
          result = await this.fallbackProvider.resolve(parsedUrl, options);
        } catch {
          // Handled below
        }
      }
      if (!result) {
        result = {
          url: rawUrl,
          normalizedUrl: normalized,
          provider: matchedProvider.name,
          providerDisplayName: matchedProvider.displayName,
          contentType: 'website',
          title: matchedProvider.displayName,
          description: 'External link',
          isPlayable: false,
          status: 'fallback',
          errorMessage: err?.message || 'Resolution failed',
          resolvedAt: new Date().toISOString(),
        };
      }
    }

    if (!result) {
      result = {
        url: rawUrl,
        normalizedUrl: normalized,
        provider: 'generic',
        providerDisplayName: 'Web Link',
        contentType: 'website',
        title: rawUrl,
        isPlayable: false,
        status: 'fallback',
        resolvedAt: new Date().toISOString(),
      };
    }

    // 3. Store in memory cache
    this.setMemoryCache(normalized, result);

    return result;
  }

  private setMemoryCache(key: string, data: ResolvedContentMetadata): void {
    if (this.memoryCache.size >= this.maxCacheEntries) {
      const oldestKey = this.memoryCache.keys().next().value;
      if (oldestKey) this.memoryCache.delete(oldestKey);
    }
    this.memoryCache.set(key, {
      data,
      expiresAt: Date.now() + this.defaultTtlMs,
    });
  }

  public clearCache(): void {
    this.memoryCache.clear();
  }
}

/**
 * Convenient singleton access function.
 */
export async function resolveContentUrl(
  rawUrl: string,
  options?: ContentResolutionOptions & { forceRefresh?: boolean }
): Promise<ResolvedContentMetadata> {
  return ContentResolverEngine.getInstance().resolve(rawUrl, options);
}

export function getContentResolver(): ContentResolverEngine {
  return ContentResolverEngine.getInstance();
}
