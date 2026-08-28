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

const SHOWCASE_COMMUNITIES: Community[] = [
  {
    id: 'comm-1',
    name: 'Jamaicans in Toronto & GTA',
    slug: 'jamaicans-in-toronto',
    description: 'Diaspora network for community events, Caribana updates, business networking, and culinary meetups in Ontario.',
    join_policy: 'public',
    member_count: 18400,
    country_iso: 'JAM',
    created_by: null,
    locationTag: 'Toronto, Canada 🇨🇦',
    activeNow: 340,
    countries: { name: 'Jamaica', flag_emoji: '🇯🇲' },
  },
  {
    id: 'comm-2',
    name: 'Dominicans in New York City',
    slug: 'dominicans-in-nyc',
    description: 'Connecting Quisqueyanos across Washington Heights, the Bronx, and Queens. Cultural events, sports, and business directory.',
    join_policy: 'public',
    member_count: 24900,
    country_iso: 'DOM',
    created_by: null,
    locationTag: 'New York, USA 🗽',
    activeNow: 520,
    countries: { name: 'Dominican Republic', flag_emoji: '🇩🇴' },
  },
  {
    id: 'comm-3',
    name: 'Caribbean Developers & Tech Founders',
    slug: 'caribbean-developers-tech',
    description: 'Engineers, designers, product managers, and founders building software and AI across the islands and diaspora.',
    join_policy: 'public',
    member_count: 9200,
    country_iso: null,
    created_by: null,
    locationTag: 'Global Diaspora 🚀',
    activeNow: 210,
    countries: { name: 'Pan-Caribbean', flag_emoji: '🌴' },
  },
  {
    id: 'comm-4',
    name: 'Haitians in South Florida & Miami',
    slug: 'haitians-in-miami',
    description: 'Little Haiti, North Miami, and Broward community for heritage celebration, kompa nights, youth mentorship, and relief.',
    join_policy: 'public',
    member_count: 16800,
    country_iso: 'HTI',
    created_by: null,
    locationTag: 'Miami, USA 🏖️',
    activeNow: 290,
    countries: { name: 'Haiti', flag_emoji: '🇭🇹' },
  },
  {
    id: 'comm-5',
    name: 'Trinbago Cultural Association London',
    slug: 'trinbago-london',
    description: 'Notting Hill Carnival preparations, steelband workshops, panyard sessions, and diaspora fellowship in the UK.',
    join_policy: 'public',
    member_count: 11400,
    country_iso: 'TTO',
    created_by: null,
    locationTag: 'London, UK 🇬🇧',
    activeNow: 180,
    countries: { name: 'Trinidad & Tobago', flag_emoji: '🇹🇹' },
  },
  {
    id: 'comm-6',
    name: 'Bajan & Barbadian Global Network',
    slug: 'bajan-global-network',
    description: 'Crop Over season updates, tourism ambassadors, investment opportunities, and diaspora homecoming.',
    join_policy: 'public',
    member_count: 7300,
    country_iso: 'BRB',
    created_by: null,
    locationTag: 'Bridgetown & Global 🇧🇧',
    activeNow: 115,
    countries: { name: 'Barbados', flag_emoji: '🇧🇧' },
  },
];

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

  if (communities.length === 0) {
    communities = SHOWCASE_COMMUNITIES;
  }

  return (
    <div className="min-h-screen bg-[#090D16] text-brand-sandstone p-4 md:p-6 max-w-7xl mx-auto space-y-8">
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
    </div>
  );
}
