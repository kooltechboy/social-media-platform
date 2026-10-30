import React from 'react';
import { Users, Plus, MapPin, Globe, Lock, Sparkles, MessageCircle, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { createSupabaseServerClient, getCurrentUser } from '../../lib/supabase/server';
import CommunityJoinButton from '../../components/community-join-button';
import CreateCommunityForm from '../../components/create-community-form';
import RightRail from '../../components/right-rail';
import CommunitiesRail from '../../components/rails/communities-rail';

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
      <span className="flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase tracking-wider">
        <Globe className="w-3 h-3" /> Public Hub
      </span>
    );
  if (policy === 'private')
    return (
      <span className="flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-wider">
        <Lock className="w-3 h-3" /> Private Hub
      </span>
    );
  return (
    <span className="flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full bg-white/10 text-brand-sandstone/80 border border-white/15 uppercase tracking-wider">
      <Lock className="w-3 h-3" /> Invite Only
    </span>
  );
}

export default async function CommunitiesPage({
  searchParams,
}: {
  searchParams?: Promise<{ hub?: string; country?: string; q?: string; create?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const { hub, country, q, create } = resolvedParams;

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
        ? supabase.from('community_members').select('community_id').eq('profile_id', user.id)
        : Promise.resolve({ data: [] }),
    ]);

    if (communitiesRes.data && communitiesRes.data.length > 0) {
      communities = communitiesRes.data as unknown as Community[];
    }

    if (membershipsRes.data && membershipsRes.data.length > 0) {
      membershipSet = new Set(membershipsRes.data.map((m: any) => m.community_id));
    }
  }

  const myCommunities = communities
    .filter((c) => membershipSet.has(c.id))
    .map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      members_count: c.member_count,
    }));

  const suggestedCommunities = communities
    .filter((c) => !membershipSet.has(c.id))
    .slice(0, 4)
    .map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      members_count: c.member_count,
      category: c.locationTag || c.countries?.name || 'Caribbean Hub',
    }));

  return (
    <div className="flex flex-col lg:flex-row gap-6 xl:gap-8 items-start w-full">
      <div className="flex-1 min-w-0 space-y-8 w-full max-w-[820px] xl:max-w-[860px] mx-auto lg:mx-0 animate-fadeIn">
        {/* Top Header */}
        <div className="tk-panel rounded-2xl p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-white/[0.08]">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00C2A8]" />
              <h1 className="font-display text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5 tracking-tight">
                <Users className="w-6 h-6 text-[#00C2A8]" /> Caribbean Communities
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-[#94A3B8] mt-1.5 leading-relaxed">
              Find your people across diaspora city hubs, professional guilds, cultural organizations, and alumni circles.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
            {user && <CreateCommunityForm initialOpen={create === 'true'} />}
            {!user && (
              <Link
                href="/login"
                className="tk-btn-primary px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 min-h-[42px]"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" /> Create Diaspora Hub
              </Link>
            )}
          </div>
        </div>

        {/* Communities Grid */}
        {communities.length === 0 ? (
          <div className="tk-panel rounded-2xl p-10 sm:p-12 text-center space-y-5 max-w-xl mx-auto border border-white/[0.08]">
            <div className="w-12 h-12 rounded-2xl bg-[#00C2A8]/10 border border-[#00C2A8]/25 flex items-center justify-center mx-auto">
              <Users className="w-6 h-6 text-[#00C2A8]" />
            </div>
            <div className="space-y-2">
              <h3 className="font-display text-lg sm:text-xl font-bold text-white">No diaspora communities found</h3>
              <p className="text-xs sm:text-sm text-[#94A3B8] leading-relaxed">
                {hub || country || q
                  ? 'No communities currently match your search or filter. Try clearing filters or create a new hub!'
                  : 'Be the first to launch an island guild or diaspora city hub for your community!'}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {(hub || country || q) && (
                <Link
                  href="/communities"
                  className="tk-btn-secondary px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold"
                >
                  Reset Filters
                </Link>
              )}
              <Link
                href="/communities/create"
                className="tk-btn-primary px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold inline-flex items-center gap-2 min-h-[42px]"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" /> Create Diaspora Hub
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {communities.map((community) => (
              <article
                key={community.id}
                className="surface-card surface-card-interactive rounded-3xl p-6 space-y-4 flex flex-col justify-between transition-all shadow-xl group border border-white/10"
              >
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl">{community.countries?.flag_emoji ?? '🌍'}</span>
                    <JoinPolicyBadge policy={community.join_policy} />
                  </div>

                  <div>
                    <Link href={`/communities/${community.slug}`}>
                      <h3 className="font-black text-base sm:text-lg text-white group-hover:text-brand-caribbeanSea hover:underline transition-colors leading-snug cursor-pointer">
                        {community.name}
                      </h3>
                    </Link>
                    <p className="text-xs text-brand-caribbeanSea font-bold mt-0.5">
                      {community.locationTag ?? community.countries?.name ?? 'Diaspora Wide'}
                    </p>
                  </div>

                  {community.description && (
                    <p className="text-xs sm:text-sm text-brand-sandstone/85 leading-relaxed line-clamp-3">
                      {community.description}
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t border-white/10 space-y-3">
                  <div className="flex items-center justify-between text-xs text-brand-sandstone/70 font-semibold">
                    <span>{community.member_count.toLocaleString()} members</span>
                    {community.activeNow && (
                      <span className="text-brand-sunriseCoral font-black flex items-center gap-1">
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

      <RightRail ariaLabel="Communities Hubs & Actions">
        <CommunitiesRail
          myCommunities={myCommunities}
          suggestedCommunities={suggestedCommunities}
        />
      </RightRail>
    </div>
  );
}
