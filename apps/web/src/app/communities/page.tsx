import React from 'react';
import { Users, Plus, MapPin, Globe, Lock, Sparkles, MessageCircle, ShieldCheck } from 'lucide-react';
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
  locationTag?: string;
  activeNow?: number;
}

function JoinPolicyBadge({ policy }: { policy: string }) {
  if (policy === 'public')
    return (
      <span className="flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-brand-sunriseCoral/10 text-brand-sunriseCoral border border-brand-sunriseCoral/20">
        <Globe className="w-3 h-3" /> Public Hub
      </span>
    );
  if (policy === 'private')
    return (
      <span className="flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-brand-goldenHour/10 text-brand-goldenHour border border-brand-goldenHour/20">
        <Lock className="w-3 h-3" /> Private Hub
      </span>
    );
  return (
    <span className="flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-brand-dusk text-brand-sandstone/60 border border-slate-700">
      <Lock className="w-3 h-3" /> Invite Only
    </span>
  );
}

export default async function CommunitiesPage({
  searchParams,
}: {
  searchParams?: Promise<{ hub?: string; country?: string; q?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const { hub, country, q } = resolvedParams;

  const [user, supabase] = await Promise.all([getCurrentUser(), createSupabaseServerClient()]);

  let communities: Community[] = [];
  let membershipSet = new Set<string>();

  if (supabase) {
    let query = supabase
      .from('communities')
      .select('id, name, slug, description, join_policy, member_count, country_iso, created_by, countries(name, flag_emoji)')
      .order('member_count', { ascending: false })
      .limit(30);

    if (country) {
      query = query.eq('country_iso', country.toUpperCase());
    } else if (hub) {
      query = query.ilike('name', `%${hub}%`);
    } else if (q) {
      query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%`);
    }

    const [communitiesRes, membershipsRes] = await Promise.all([
      query,
      user
        ? supabase.from('community_members').select('community_id').eq('user_id', user.id)
        : Promise.resolve({ data: [] }),
    ]);

    if (communitiesRes.data && communitiesRes.data.length > 0) {
      communities = communitiesRes.data as unknown as Community[];
    }

    if (membershipsRes.data && membershipsRes.data.length > 0) {
      membershipSet = new Set(membershipsRes.data.map((m: any) => m.community_id));
    }
  }

  return (
    <div className="min-h-screen bg-transparent text-brand-sandstone p-4 md:p-6 max-w-7xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-brand-sunriseCoral animate-ping" />
            <h1 className="text-2xl md:text-3xl font-black text-brand-sandstone flex items-center gap-3">
              <Users className="w-8 h-8 text-brand-sunriseCoral" /> Caribbean Communities
            </h1>
          </div>
          <p className="text-xs md:text-sm text-brand-sandstone/60 mt-1">
            Find your people across diaspora city hubs, professional guilds, cultural organizations, and alumni circles.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          {user && <CreateCommunityForm />}
          {!user && (
            <Link
              href="/login"
              className="bg-brand-sunriseCoral hover:bg-brand-sunriseCoral text-slate-950 font-black px-5 py-2.5 rounded-2xl text-xs flex items-center gap-2 transition-all shadow-md shadow-brand-sunriseCoral/20"
            >
              <Plus className="w-4 h-4" /> Create Diaspora Hub
            </Link>
          )}
        </div>
      </div>

      {/* Communities Grid */}
      {communities.length === 0 ? (
        <div className="bg-brand-dusk/70 border border-slate-800 rounded-3xl p-12 text-center space-y-4 max-w-xl mx-auto">
          <Users className="w-12 h-12 text-brand-sunriseCoral/60 mx-auto" />
          <h3 className="text-base font-bold text-brand-sandstone">No diaspora communities found</h3>
          <p className="text-xs text-brand-sandstone/60 leading-relaxed">
            No communities currently match your search or filter. Create your own island guild or diaspora city hub!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {communities.map((community) => (
            <article
              key={community.id}
              className="bg-brand-dusk/80 border border-slate-800/90 hover:border-brand-sunriseCoral/50 rounded-3xl p-6 space-y-4 flex flex-col justify-between transition-all shadow-xl group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-3xl">{community.countries?.flag_emoji ?? '🌍'}</span>
                  <JoinPolicyBadge policy={community.join_policy} />
                </div>

                <div>
                  <Link href={`/communities/${community.slug}`}>
                    <h3 className="font-extrabold text-base text-brand-sandstone group-hover:text-emerald-300 hover:underline transition-colors leading-snug cursor-pointer">
                      {community.name}
                    </h3>
                  </Link>
                  <p className="text-xs text-brand-sunriseCoral font-semibold mt-0.5">
                    {community.locationTag ?? community.countries?.name ?? 'Diaspora Wide'}
                  </p>
                </div>

                {community.description && (
                  <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                    {community.description}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between text-xs text-brand-sandstone/60 font-medium">
                  <span>{community.member_count.toLocaleString()} members</span>
                  {community.activeNow && (
                    <span className="text-brand-sunriseCoral font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-sunriseCoral" /> {community.activeNow} active now
                    </span>
                  )}
                </div>

                <div className="w-full">
                  <CommunityJoinButton
                    communityId={community.id}
                    joinPolicy={community.join_policy}
                    isMember={membershipSet.has(community.id)}
                    isAuthenticated={!!user}
                  />
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
