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
    <div className="min-h-screen bg-transparent text-brand-sandstone p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
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
              <Compass className="w-6 h-6 text-brand-goldenHour" /> Caribbean Members Directory
            </h1>
            <p className="text-xs text-brand-sandstone/60">
              Discover real creators, professionals, and members across the Caribbean diaspora.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/friends"
            className="text-xs font-bold px-3.5 py-2 rounded-xl bg-brand-dusk hover:bg-slate-800 text-brand-sandstone border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <Users className="w-4 h-4 text-brand-caribbeanSea" /> Friends & Requests
          </Link>
          <Link
            href="/search"
            className="text-xs font-bold px-3.5 py-2 rounded-xl bg-gradient-to-r from-brand-caribbeanSea to-brand-sunriseCoral text-slate-950 flex items-center gap-1.5 shadow-md shadow-brand-caribbeanSea/20 transition-all"
          >
            <UserPlus className="w-4 h-4" /> Global Search
          </Link>
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
