import React from 'react';
import Link from 'next/link';
import { Users, UserPlus, Compass, ArrowLeft, Search } from 'lucide-react';
import { getCurrentUser } from '../../lib/supabase/server';
import {
  fetchMembersDirectoryAction,
  fetchFriendsOverviewAction,
  fetchPeopleYouMayKnowAction,
} from '../../lib/discovery/actions';
import PeopleHubClient, { type PeopleTab } from '../../components/people/people-hub-client';

export const dynamic = 'force-dynamic';

export default async function PeoplePage({
  searchParams,
}: {
  searchParams?: Promise<{
    tab?: string;
    country?: string;
    category?: string;
    q?: string;
    page?: string;
  }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const { tab = 'discover', country, category, q, page } = resolvedParams;
  const user = await getCurrentUser();

  const [overviewData, directoryData, pymkData] = await Promise.all([
    fetchFriendsOverviewAction({
      tab: (tab as any) || 'friends',
      query: q,
    }),
    fetchMembersDirectoryAction({
      countryIso: country,
      category,
      query: q,
      page: page ? parseInt(page, 10) : 1,
    }),
    fetchPeopleYouMayKnowAction({ limit: 6, countryIso: country }),
  ]);

  // Merge pymk into overview
  overviewData.pymk = pymkData;

  const activeTabKey = (['discover', 'friends', 'requests', 'following', 'followers'].includes(tab)
    ? tab
    : 'discover') as PeopleTab;

  return (
    <div className="w-full space-y-6 animate-fadeIn">
      {/* Standardized Responsive Page Header */}
      <div className="surface-header rounded-3xl p-5 sm:p-7 shadow-xl border border-white/10 bg-[#140C22]/90 backdrop-blur-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <Link
              href="/"
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-white/5 hover:bg-white/10 text-brand-sandstone/80 hover:text-white border border-white/10 transition-colors inline-flex items-center gap-1.5 text-xs font-bold shrink-0 min-h-[40px]"
              aria-label="Back to Home"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white flex items-center gap-2.5 tracking-tight">
                <Users className="w-6 h-6 sm:w-7 sm:h-7 text-brand-caribbeanSea shrink-0" />
                <span>Caribbean People &amp; Network</span>
              </h1>
              <p className="text-xs sm:text-sm text-brand-sandstone/80 mt-1 leading-relaxed">
                Connect with Caribbean members, manage your personal friends, and follow creators across the diaspora.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0 flex-wrap">
            <Link
              href="/search"
              className="text-xs font-black px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-caribbeanSea to-brand-sunriseCoral text-slate-950 flex items-center gap-1.5 shadow-md shadow-brand-caribbeanSea/20 hover:brightness-110 transition-all min-h-[40px]"
            >
              <Search className="w-4 h-4" /> Global Search
            </Link>
          </div>
        </div>
      </div>

      {/* Main Interactive People Hub Client */}
      <PeopleHubClient
        initialTab={activeTabKey}
        initialOverview={overviewData}
        initialDirectory={directoryData}
        initialCountry={country || 'ALL'}
        initialCategory={category || 'all'}
        initialQuery={q || ''}
        currentUserId={user?.id}
      />
    </div>
  );
}
