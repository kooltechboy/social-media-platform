import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { VIBE_CATEGORIES } from '../../../../lib/explore/constants';
import { executeDiscoveryQuery } from '../../../../lib/explore/discovery-engine';
import VibeDiscoveryView from '../../../../components/explore/vibe-discovery-view';
import { Compass, ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface VibeExplorePageProps {
  params: Promise<{ vibe: string }>;
  searchParams?: Promise<{ country?: string; q?: string }>;
}

export default async function VibeExplorePage({
  params,
  searchParams,
}: VibeExplorePageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const { vibe: vibeId } = resolvedParams;
  const { country, q } = resolvedSearchParams;

  const vibe = VIBE_CATEGORIES.find((v) => v.id === vibeId.toLowerCase().trim());

  if (!vibe) {
    return (
      <div className="surface-card rounded-3xl p-10 text-center space-y-4 max-w-lg mx-auto border border-white/10 my-12">
        <Compass className="w-12 h-12 text-purple-400 mx-auto animate-pulse" />
        <h2 className="text-2xl font-black text-white">Vibe Not Found</h2>
        <p className="text-sm text-brand-sandstone/80">
          We couldn&apos;t find a Caribbean vibe category matching &quot;{vibeId}&quot;.
        </p>
        <Link
          href="/explore"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-500 text-white font-black text-sm transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Caribbean Explore
        </Link>
      </div>
    );
  }

  const exploreData = await executeDiscoveryQuery({
    vibe: vibe.id,
    country,
    q,
  });

  return (
    <VibeDiscoveryView
      vibe={vibe}
      data={exploreData}
      activeCountry={country}
    />
  );
}
