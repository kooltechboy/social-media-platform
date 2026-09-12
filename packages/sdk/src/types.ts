/**
 * @file packages/sdk/src/types.ts
 * @description Strongly-typed schemas and configuration for the TUKUBI Developer SDK.
 */

export interface TukubiClientOptions {
  apiKey: string;
  baseUrl?: string;
  timeoutMs?: number;
  fetch?: typeof fetch;
}

export interface ApiResponse<T> {
  data: T;
  meta?: {
    total?: number;
    cursor?: string;
    hasMore?: boolean;
  };
}

export interface PublicPost {
  id: string;
  authorId: string;
  content: string;
  visibility: 'public';
  countryIso?: string;
  culturalTags: string[];
  mediaUrls: string[];
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  createdAt: string;
}

export interface PublicSoundLounge {
  id: string;
  title: string;
  description?: string;
  hostId: string;
  culturalGenre: string;
  state: 'scheduled' | 'live' | 'ended';
  listenerCount: number;
  scheduledFor?: string;
  startedAt?: string;
  createdAt: string;
}

export interface PublicProduct {
  id: string;
  sellerId: string;
  title: string;
  description?: string;
  priceMinor: number;
  currency: string;
  countryIso: string;
  category: string;
}

export interface CaribbeanIsland {
  iso: string;
  name: string;
  region: 'Greater Antilles' | 'Lesser Antilles' | 'Lucayan Archipelago' | 'Continental Caribbean';
  capital: string;
}

export interface CulturalTaxonomy {
  islands: CaribbeanIsland[];
  genres: string[];
  carnivalSeasons: string[];
}
