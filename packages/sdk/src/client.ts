/**
 * @file packages/sdk/src/client.ts
 * @description Isomorphic client implementation for the TUKUBI Developer Platform.
 */

import {
  ApiResponse,
  CaribbeanIsland,
  CulturalTaxonomy,
  PublicPost,
  PublicProduct,
  PublicSoundLounge,
  TukubiClientOptions,
} from './types';
import {
  TukubiAuthenticationError,
  TukubiError,
  TukubiNotFoundError,
  TukubiRateLimitError,
  TukubiServerError,
  TukubiValidationError,
} from './errors';

export class TukubiClient {
  private apiKey: string;
  private baseUrl: string;
  private timeoutMs: number;
  private customFetch: typeof fetch;

  constructor(options: TukubiClientOptions) {
    if (!options.apiKey || !options.apiKey.trim()) {
      throw new TukubiAuthenticationError('apiKey is required to initialize TukubiClient');
    }
    this.apiKey = options.apiKey;
    this.baseUrl = (options.baseUrl || 'https://api.tukubi.caribbean/v1').replace(/\/$/, '');
    this.timeoutMs = options.timeoutMs || 10000;
    this.customFetch = options.fetch || globalThis.fetch;
  }

  // ---------------------------------------------------------------------------
  // Posts Namespace
  // ---------------------------------------------------------------------------
  public readonly posts = {
    get: async (postId: string): Promise<PublicPost> => {
      const res = await this.request<ApiResponse<PublicPost>>(`/posts/${encodeURIComponent(postId)}`);
      return res.data;
    },
    list: async (params: { tag?: string; countryIso?: string; limit?: number; cursor?: string } = {}): Promise<ApiResponse<PublicPost[]>> => {
      const query = new URLSearchParams();
      if (params.tag) query.set('tag', params.tag);
      if (params.countryIso) query.set('country', params.countryIso);
      if (params.limit) query.set('limit', params.limit.toString());
      if (params.cursor) query.set('cursor', params.cursor);

      const qs = query.toString() ? `?${query.toString()}` : '';
      return this.request<ApiResponse<PublicPost[]>>(`/posts${qs}`);
    },
  };

  // ---------------------------------------------------------------------------
  // Sound Lounges Namespace
  // ---------------------------------------------------------------------------
  public readonly lounges = {
    get: async (loungeId: string): Promise<PublicSoundLounge> => {
      const res = await this.request<ApiResponse<PublicSoundLounge>>(`/spaces/${encodeURIComponent(loungeId)}`);
      return res.data;
    },
    listLive: async (): Promise<ApiResponse<PublicSoundLounge[]>> => {
      return this.request<ApiResponse<PublicSoundLounge[]>>('/spaces?state=live');
    },
  };

  // ---------------------------------------------------------------------------
  // Marketplace Namespace
  // ---------------------------------------------------------------------------
  public readonly marketplace = {
    get: async (productId: string): Promise<PublicProduct> => {
      const res = await this.request<ApiResponse<PublicProduct>>(`/marketplace/${encodeURIComponent(productId)}`);
      return res.data;
    },
    list: async (params: { category?: string; countryIso?: string } = {}): Promise<ApiResponse<PublicProduct[]>> => {
      const query = new URLSearchParams();
      if (params.category) query.set('category', params.category);
      if (params.countryIso) query.set('country', params.countryIso);

      const qs = query.toString() ? `?${query.toString()}` : '';
      return this.request<ApiResponse<PublicProduct[]>>(`/marketplace${qs}`);
    },
  };

  // ---------------------------------------------------------------------------
  // Culture & Geography Namespace
  // ---------------------------------------------------------------------------
  public readonly culture = {
    getTaxonomy: async (): Promise<CulturalTaxonomy> => {
      const res = await this.request<ApiResponse<CulturalTaxonomy>>('/culture/taxonomy');
      return res.data;
    },
    getIslands: async (): Promise<CaribbeanIsland[]> => {
      const res = await this.request<ApiResponse<CaribbeanIsland[]>>('/culture/islands');
      return res.data;
    },
  };

  // ---------------------------------------------------------------------------
  // Core HTTP Pipeline
  // ---------------------------------------------------------------------------
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'Tukubi-Developer-SDK/1.0.0',
    };

    try {
      const response = await this.customFetch(url, {
        ...options,
        headers: {
          ...headers,
          ...(options.headers as Record<string, string> || {}),
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      return (await response.json()) as T;
    } catch (err: unknown) {
      if (err instanceof TukubiError) {
        throw err;
      }
      if (err instanceof Error && err.name === 'AbortError') {
        throw new TukubiError(`Request timed out after ${this.timeoutMs}ms`, 408, 'TIMEOUT');
      }
      throw new TukubiError(
        `Network error communicating with TUKUBI API: ${err instanceof Error ? err.message : String(err)}`
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async handleErrorResponse(response: Response): Promise<never> {
    let errorBody: { error?: string; message?: string } = {};
    try {
      errorBody = await response.json();
    } catch {
      // Non-JSON error body
    }

    const message = errorBody.error || errorBody.message || response.statusText;

    switch (response.status) {
      case 401:
      case 403:
        throw new TukubiAuthenticationError(message);
      case 404:
        throw new TukubiNotFoundError(message);
      case 429: {
        const retryAfter = parseInt(response.headers.get('retry-after') || '60', 10);
        throw new TukubiRateLimitError(message, isNaN(retryAfter) ? 60 : retryAfter);
      }
      case 400:
      case 422:
        throw new TukubiValidationError(message);
      default:
        if (response.status >= 500) {
          throw new TukubiServerError(message);
        }
        throw new TukubiError(message, response.status);
    }
  }
}
