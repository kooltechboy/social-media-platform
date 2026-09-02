import React from 'react';
import Link from 'next/link';
import { Users, UserPlus, Compass, ArrowLeft } from 'lucide-react';
import { getCurrentUser } from '../../lib/supabase/server';
import { fetchFriendsOverviewAction } from '../../lib/discovery/actions';
import FriendsCenterClient from '../../components/friends/friends-center-client';

export const dynamic = 'force-dynamic';

export default async function FriendsPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string; q?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const { tab, q } = resolvedParams;
  const user = await getCurrentUser();

  const overviewData = await fetchFriendsOverviewAction({
    tab: (tab as any) || 'friends',
    query: q,
  });

  return (
    <div className="min-h-screen bg-transparent text-brand-sandstone p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
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
              <Users className="w-6 h-6 text-brand-caribbeanSea" /> Friends & Connections
            </h1>
            <p className="text-xs text-brand-sandstone/60">
              Manage your Caribbean network, friend requests, and social graph.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/members"
            className="text-xs font-bold px-3.5 py-2 rounded-xl bg-brand-dusk hover:bg-slate-800 text-brand-sandstone border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <Compass className="w-4 h-4 text-brand-goldenHour" /> Discover Members
          </Link>
          <Link
            href="/search"
            className="text-xs font-bold px-3.5 py-2 rounded-xl bg-gradient-to-r from-brand-caribbeanSea to-brand-sunriseCoral text-slate-950 flex items-center gap-1.5 shadow-md shadow-brand-caribbeanSea/20 transition-all"
          >
            <UserPlus className="w-4 h-4" /> Find People
          </Link>
        </div>
      </div>

      {/* Main Interactive Client */}
      <FriendsCenterClient
        initialData={overviewData}
        initialTab={tab || 'friends'}
        initialQuery={q || ''}
        currentUserId={user?.id}
      />
    </div>
  );
}
