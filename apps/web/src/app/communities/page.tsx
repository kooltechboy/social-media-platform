import React from 'react';
import { Users, Plus, MapPin, Globe, Lock } from 'lucide-react';
import Link from 'next/link';
import { createSupabaseServerClient, getCurrentUser } from '../../lib/supabase/server';
import CommunityJoinButton from '../../components/community-join-button';
import CreateCommunityForm from '../../components/create-community-form';

export const dynamic = 'force-dynamic';

interface Community {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  join_policy: 'public' | 'private' | 'invite_only';
  member_count: number;
  country_iso: string | null;
  created_by: string | null;
  countries: { name: string; flag_emoji: string } | null;
}

interface MembershipRow {
  community_id: string;
  membership_status: string;
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diffMs / 86400000);
  if (days < 1) return 'Today';
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

function JoinPolicyBadge({ policy }: { policy: string }) {
  if (policy === 'public')
    return (
      <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
        <Globe className="w-3 h-3" /> Public
      </span>
    );
  if (policy === 'private')
    return (
      <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-400">
        <Lock className="w-3 h-3" /> Private
      </span>
    );
  return (
    <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-400">
      <Lock className="w-3 h-3" /> Invite Only
    </span>
  );
}

export default async function CommunitiesPage() {
  const [user, supabase] = await Promise.all([getCurrentUser(), createSupabaseServerClient()]);

  let communities: Community[] = [];
  let membershipSet = new Set<string>();

  if (supabase) {
    const { data } = await supabase
      .from('communities')
      .select('id, name, slug, description, join_policy, member_count, country_iso, created_by, countries(name, flag_emoji)')
      .order('member_count', { ascending: false })
      .limit(30);
    communities = (data ?? []) as Community[];

    if (user && communities.length > 0) {
      const { data: memberships } = await supabase
        .from('community_members')
        .select('community_id, membership_status')
        .eq('profile_id', user.id)
        .in('community_id', communities.map((c) => c.id));
      for (const m of (memberships ?? []) as MembershipRow[]) {
        if (m.membership_status === 'active') membershipSet.add(m.community_id);
      }
    }
  }

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 p-4 md:p-6 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3">
            <Users className="w-8 h-8 text-sky-400" /> Caribbean Communities
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Connect with diaspora groups, cultural organizations, and professional networks worldwide.
          </p>
        </div>
        {user && <CreateCommunityForm />}
        {!user && (
          <Link
            href="/login"
            className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" /> Sign in to Create
          </Link>
        )}
      </div>

      {communities.length === 0 ? (
        <div className="bg-slate-900/60 border border-dashed border-slate-800 rounded-2xl p-12 text-center">
          <Users className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-400">No communities yet.</p>
          <p className="text-xs text-slate-500 mt-1">Be the first to create one for your community.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {communities.map((community) => (
            <article
              key={community.id}
              className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between hover:border-sky-500/40 transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xl">
                    {community.countries?.flag_emoji ?? '🌍'}
                  </span>
                  <JoinPolicyBadge policy={community.join_policy} />
                </div>
                <h3 className="font-bold text-base text-white leading-snug">{community.name}</h3>
                {community.countries && (
                  <span className="flex items-center gap-1 text-[11px] text-slate-400">
                    <MapPin className="w-3 h-3 text-emerald-400" /> {community.countries.name}
                  </span>
                )}
                <p className="text-xs text-slate-400">
                  {community.member_count.toLocaleString()} member{community.member_count !== 1 ? 's' : ''}
                </p>
                {community.description && (
                  <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                    {community.description}
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <CommunityJoinButton
                  communityId={community.id}
                  joinPolicy={community.join_policy}
                  isMember={membershipSet.has(community.id)}
                  isAuthenticated={!!user}
                />
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
