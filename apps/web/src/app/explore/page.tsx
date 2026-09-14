import React from 'react';
import { fetchExploreDataAction, fetchTrendingSignalsAction } from '../../lib/explore/actions';
import ExploreDiscoveryClient from '../../components/explore-discovery-client';
import { resolveGeography } from '../../lib/explore/canonical-geography';

export const dynamic = 'force-dynamic';

export default async function ExplorePage({
  searchParams,
}: {
  searchParams?: Promise<{
    geo?: string;
    country?: string;
    vibe?: string;
    hub?: string;
    q?: string;
    type?: string;
  }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const { geo, country, vibe, hub, q, type } = resolvedParams;
  const targetGeo = geo || country;

  const geography = targetGeo ? resolveGeography(targetGeo) : null;

  const [exploreData, trendingSignals] = await Promise.all([
    fetchExploreDataAction({
      geo: targetGeo,
      country,
      vibe,
      hub,
      q,
      contentType: type,
    }),
    fetchTrendingSignalsAction(geography?.iso || null),
  ]);

  return (
    <div className="w-full space-y-8 animate-fadeIn">
      <ExploreDiscoveryClient
        initialResult={exploreData}
        trendingSignals={trendingSignals}
        activeVibeKey={vibe}
        activeCountryKey={targetGeo}
        activeHubKey={hub}
        activeQueryText={q}
      />
    </div>
  );
}
