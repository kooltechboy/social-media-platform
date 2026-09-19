import React from 'react';
import { fetchExploreDataAction, fetchTrendingSignalsAction } from '../../lib/explore/actions';
import ExploreDiscoveryClient from '../../components/explore-discovery-client';
import { resolveGeography } from '../../lib/explore/canonical-geography';
import RightRail from '../../components/right-rail';
import ExploreRail from '../../components/rails/explore-rail';

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
    <div className="flex flex-col lg:flex-row gap-6 xl:gap-8 items-start w-full">
      <div className="flex-1 min-w-0 space-y-8 w-full max-w-[820px] xl:max-w-[860px] mx-auto lg:mx-0 animate-fadeIn">
        <ExploreDiscoveryClient
          initialResult={exploreData}
          trendingSignals={trendingSignals}
          activeVibeKey={vibe}
          activeCountryKey={targetGeo}
          activeHubKey={hub}
          activeQueryText={q}
        />
      </div>

      <RightRail ariaLabel="Explore Caribbean Context">
        <ExploreRail
          activeGeoKey={targetGeo}
          activeContentType={type}
          trendingSignals={trendingSignals}
        />
      </RightRail>
    </div>
  );
}
