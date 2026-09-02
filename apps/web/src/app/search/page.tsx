import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, Compass, Users } from 'lucide-react';
import { getCurrentUser } from '../../lib/supabase/server';
import { universalSearchAction, fetchPeopleYouMayKnowAction } from '../../lib/discovery/actions';
import SocialSearchClient from '../../components/search/social-search-client';

export const dynamic = 'force-dynamic';

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; country?: string }>;
}) {
  const { q, category, country } = await searchParams;
  const query = (q ?? '').trim();
  const user = await getCurrentUser();

  const [searchData, recommendedPeople] = await Promise.all([
    query
      ? universalSearchAction({
          term: query,
          category,
          countryIso: country,
          limit: 30,
        })
      : Promise.resolve(null),
    fetchPeopleYouMayKnowAction({ limit: 12, countryIso: country }),
  ]);

  return (
    <div className="min-h-screen bg-transparent text-brand-sandstone p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-slate-300 hover:text-brand-sandstone text-sm font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-brand-sandstone flex items-center gap-2.5">
              <Search className="w-5 h-5 sm:w-6 sm:h-6 text-brand-caribbeanSea" /> Universal Discovery & Search
            </h1>
            <p className="text-xs text-brand-sandstone/60">
              Find people, creators, businesses, merchants, hubs, and events across TUKUBI.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/friends"
            className="text-xs font-bold px-3 py-1.5 rounded-xl bg-brand-dusk hover:bg-slate-800 text-brand-sandstone border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <Users className="w-3.5 h-3.5 text-brand-caribbeanSea" /> Friends
          </Link>
          <Link
            href="/members"
            className="text-xs font-bold px-3 py-1.5 rounded-xl bg-brand-dusk hover:bg-slate-800 text-brand-sandstone border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <Compass className="w-3.5 h-3.5 text-brand-goldenHour" /> Members
          </Link>
        </div>
      </div>

      {/* Main Interactive Search Client */}
      <SocialSearchClient
        initialQuery={query}
        initialCategory={category || 'all'}
        initialSearchData={searchData}
        initialRecommendations={recommendedPeople}
        currentUserId={user?.id}
      />
    </div>
  );
}
