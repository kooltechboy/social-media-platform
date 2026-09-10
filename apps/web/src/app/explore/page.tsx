import React from 'react';
import { fetchExploreDataAction, fetchTrendingSignalsAction } from '../../lib/explore/actions';
import ExploreDiscoveryClient from '../../components/explore-discovery-client';

export const dynamic = 'force-dynamic';

export default async function ExplorePage({
  searchParams,
}: {
  searchParams?: Promise<{
    vibe?: string;
    country?: string;
    hub?: string;
    q?: string;
  }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const { vibe, country, hub, q } = resolvedParams;

  const [exploreData, trendingSignals] = await Promise.all([
    fetchExploreDataAction({ vibe, country, hub, q }),
    fetchTrendingSignalsAction(),
  ]);

  return (
    <div className="min-h-screen bg-transparent text-brand-sandstone px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl mx-auto">
      <ExploreDiscoveryClient
        initialResult={exploreData}
        trendingSignals={trendingSignals}
        activeVibeKey={vibe}
        activeCountryKey={country}
        activeHubKey={hub}
        activeQueryText={q}
      />
    </div>
  );
}

