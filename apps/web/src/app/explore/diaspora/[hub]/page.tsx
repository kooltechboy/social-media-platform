import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { resolveGeography, DIASPORA_HUBS_ONLY } from '../../../../lib/explore/canonical-geography';
import { executeDiscoveryQuery } from '../../../../lib/explore/discovery-engine';
import DiasporaDiscoveryView from '../../../../components/explore/diaspora-discovery-view';
import { Compass, ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ hub: string }>;
}): Promise<Metadata> {
  const { hub: hubSlug } = await params;
  const hub = resolveGeography(hubSlug);
  if (!hub || !hub.isDiasporaHub) {
    return {
      title: 'Diaspora Hub Not Found | TUKUBI Explore',
      description: 'Discover Caribbean diaspora communities and hubs on TUKUBI.',
    };
  }

  const title = `🌎 Discover Caribbean ${hub.name} on TUKUBI | Diaspora Discovery`;
  const description =
    hub.summary ||
    `Explore Caribbean diaspora community guilds, fetes, creators, and commerce in ${hub.name}.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: 'TUKUBI',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

interface DiasporaExplorePageProps {
  params: Promise<{ hub: string }>;
  searchParams?: Promise<{ q?: string }>;
}

export default async function DiasporaExplorePage({
  params,
  searchParams,
}: DiasporaExplorePageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const { hub: hubSlug } = resolvedParams;
  const { q } = resolvedSearchParams;

  const hub = resolveGeography(hubSlug);

  if (!hub || !hub.isDiasporaHub) {
    return (
      <div className="surface-card rounded-3xl p-10 text-center space-y-4 max-w-lg mx-auto border border-white/10 my-12">
        <Compass className="w-12 h-12 text-amber-400 mx-auto animate-pulse" />
        <h2 className="text-2xl font-black text-white">Diaspora Hub Not Found</h2>
        <p className="text-sm text-brand-sandstone/80">
          We couldn&apos;t find a recognized Caribbean diaspora metropolitan hub matching &quot;{hubSlug}&quot;.
        </p>
        <Link
          href="/explore"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-400 text-slate-950 font-black text-sm transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Caribbean Explore
        </Link>
      </div>
    );
  }

  const exploreData = await executeDiscoveryQuery({
    hub: hub.slug,
    q,
  });

  return (
    <DiasporaDiscoveryView
      hub={hub}
      data={exploreData}
    />
  );
}
