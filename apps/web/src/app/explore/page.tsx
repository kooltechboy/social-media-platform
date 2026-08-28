import React from 'react';
import { fetchExploreDataAction } from '../../lib/explore/actions';
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

  const exploreData = await fetchExploreDataAction({
    vibe,
    country,
    hub,
    q,
  });

  return (
    <div className="min-h-screen bg-[#090D16] text-brand-sandstone p-4 md:p-6 max-w-7xl mx-auto">
      <ExploreDiscoveryClient
        initialResult={exploreData}
        activeVibeKey={vibe}
        activeCountryKey={country}
        activeHubKey={hub}
        activeQueryText={q}
      />
    </div>
  );
}

