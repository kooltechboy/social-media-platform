'use server';

import { createSupabaseServerClient } from '../supabase/server';
import { executeDiscoveryQuery, type DiscoveryFilterParams } from './discovery-engine';
import { VIBE_CATEGORIES, type VibeCategory, type ExploreQueryResult, type ExploreCounts } from './constants';
import { resolveGeography, type CanonicalGeography } from './canonical-geography';

export type { VibeCategory, ExploreQueryResult, ExploreCounts, CanonicalGeography, DiscoveryFilterParams };

export type TrendingSignal = {
  id: string;
  territory_iso: string | null;
  signal_type: string;
  entity_id: string;
  entity_label: string;
  entity_avatar_url: string | null;
  score: number;
  post_count_last_2h: number;
  post_count_last_24h: number;
};

export async function fetchTrendingSignalsAction(territoryIso?: string | null): Promise<TrendingSignal[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  try {
    let query = supabase
      .from('trending_signals')
      .select('*')
      .gt('expires_at', new Date().toISOString())
      .order('score', { ascending: false })
      .limit(10);

    if (territoryIso) {
      query = query.eq('territory_iso', territoryIso.toUpperCase());
    } else {
      query = query.is('territory_iso', null);
    }

    const { data } = await query;
    return data || [];
  } catch (err) {
    console.error('fetchTrendingSignalsAction error:', err);
    return [];
  }
}

export async function fetchExploreDataAction(params: {
  geo?: string;
  country?: string;
  vibe?: string;
  hub?: string;
  q?: string;
  contentType?: string;
  limit?: number;
}): Promise<ExploreQueryResult> {
  return executeDiscoveryQuery({
    geo: params.geo || params.country,
    country: params.country,
    vibe: params.vibe,
    hub: params.hub,
    q: params.q,
    contentType: params.contentType,
    limit: params.limit,
  });
}
