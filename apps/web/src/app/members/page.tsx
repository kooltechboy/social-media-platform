import React from 'react';
import Link from 'next/link';
import { Compass, Users, UserPlus, ArrowLeft } from 'lucide-react';
import { getCurrentUser } from '../../lib/supabase/server';
import { fetchMembersDirectoryAction, fetchPeopleYouMayKnowAction } from '../../lib/discovery/actions';
import MembersDirectoryClient from '../../components/members/members-directory-client';

export const dynamic = 'force-dynamic';

export default async function MembersPage({
  searchParams,
}: {
  searchParams?: Promise<{ country?: string; category?: string; q?: string; page?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const { country, category, q, page } = resolvedParams;
  const user = await getCurrentUser();

  const [directoryData, pymkData] = await Promise.all([
    fetchMembersDirectoryAction({
      countryIso: country,
      category,
      query: q,
      page: page ? parseInt(page, 10) : 1,
    }),
    fetchPeopleYouMayKnowAction({ limit: 6, countryIso: country }),
  ]);

  return (
    <div className="min-h-screen bg-transparent text-brand-sandstone p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Standardized Responsive Page Header */}
      <div className="surface-header rounded-3xl p-5 sm:p-7 shadow-xl">
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
                <Compass className="w-6 h-6 sm:w-7 sm:h-7 text-brand-goldenHour shrink-0" />
                <span>Caribbean Members Directory</span>
              </h1>
              <p className="text-xs sm:text-sm text-brand-sandstone/80 mt-1 leading-relaxed">
                Discover real creators, professionals, and members across the Caribbean diaspora.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0 flex-wrap">
            <Link
              href="/friends"
              className="text-xs font-bold px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/15 flex items-center gap-1.5 transition-colors min-h-[40px]"
            >
              <Users className="w-4 h-4 text-brand-caribbeanSea" /> Friends &amp; Requests
            </Link>
            <Link
              href="/search"
              className="text-xs font-black px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-caribbeanSea to-brand-sunriseCoral text-slate-950 flex items-center gap-1.5 shadow-md shadow-brand-caribbeanSea/20 hover:brightness-110 transition-all min-h-[40px]"
            >
              <UserPlus className="w-4 h-4" /> Global Search
            </Link>
          </div>
        </div>
      </div>

      {/* Main Interactive Members Client */}
      <MembersDirectoryClient
        initialMembers={directoryData.members}
        totalCount={directoryData.totalCount}
        initialPymk={pymkData}
        initialCountry={country || 'ALL'}
        initialCategory={category || 'all'}
        initialQuery={q || ''}
        currentUserId={user?.id}
      />
    </div>
  );
}
