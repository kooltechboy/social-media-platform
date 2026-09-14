import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { resolveGeography } from '../../../lib/explore/canonical-geography';
import { executeDiscoveryQuery } from '../../../lib/explore/discovery-engine';
import GeographyDiscoveryView from '../../../components/explore/geography-discovery-view';
import { Compass, ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface GeographyExplorePageProps {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ vibe?: string; q?: string }>;
}

export default async function GeographyExplorePage({
  params,
  searchParams,
}: GeographyExplorePageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const { slug } = resolvedParams;
  const { vibe, q } = resolvedSearchParams;

  const geography = resolveGeography(slug);

  if (!geography) {
    return (
      <div className="surface-card rounded-3xl p-10 text-center space-y-4 max-w-lg mx-auto border border-white/10 my-12">
        <Compass className="w-12 h-12 text-brand-caribbeanSea mx-auto animate-pulse" />
        <h2 className="text-2xl font-black text-white">Territory Not Found</h2>
        <p className="text-sm text-brand-sandstone/80">
          We couldn&apos;t find a Caribbean nation, island, or diaspora hub matching &quot;{slug}&quot;.
        </p>
        <Link
          href="/explore"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-caribbeanSea text-slate-950 font-black text-sm transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Caribbean Explore
        </Link>
      </div>
    );
  }

  const exploreData = await executeDiscoveryQuery({
    geo: geography.slug,
    vibe,
    q,
  });

  return (
    <GeographyDiscoveryView
      geography={geography}
      data={exploreData}
      activeVibe={vibe}
    />
  );
}
