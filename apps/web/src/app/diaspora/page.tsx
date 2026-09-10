import React from 'react';
import Link from 'next/link';
import {
  Globe, MapPin, Users, Calendar, Sparkles, Search, Compass, ArrowRight, XCircle
} from 'lucide-react';
import { DIASPORA_CITY_HUBS } from '../../lib/constants/diaspora-hubs';
import { createSupabaseServerClient, getCurrentUser } from '../../lib/supabase/server';

export const dynamic = 'force-dynamic';

const COMBINATIONS = [
  { id: 'JAM_NYC', label: 'Jamaicans in New York', iso: 'JAM', city: 'New York', flag: '🇯🇲', emoji: '🗽' },
  { id: 'DOM_MIA', label: 'Dominicans in Miami', iso: 'DOM', city: 'Miami', flag: '🇩🇴', emoji: '🌴' },
  { id: 'TTO_TOR', label: 'Trinidadians in Toronto', iso: 'TTO', city: 'Toronto', flag: '🇹🇹', emoji: '🍁' },
  { id: 'HTI_MIA', label: 'Haitians in Miami', iso: 'HTI', city: 'Miami', flag: '🇭🇹', emoji: '🌴' },
  { id: 'BRB_LON', label: 'Barbadians in London', iso: 'BRB', city: 'London', flag: '🇧🇧', emoji: '🎡' },
  { id: 'GUY_NYC', label: 'Guyanese in New York', iso: 'GUY', city: 'New York', flag: '🇬🇾', emoji: '🗽' },
  { id: 'BMU_LON', label: 'Bermudians in London', iso: 'BMU', city: 'London', flag: '🇧🇲', emoji: '🎡' },
  { id: 'LCA_MTL', label: 'Saint Lucians in Montreal', iso: 'LCA', city: 'Montreal', flag: '🇱🇨', emoji: '❄️' },
];

export default async function DiasporaPortalPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; hub?: string; combo?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const activeHub = resolvedParams.hub || '';
  const comboId = resolvedParams.combo || '';

  const [user, supabase] = await Promise.all([
    getCurrentUser(),
    createSupabaseServerClient(),
  ]);

  let diasporaCommunities: any[] = [];
  let diasporaEvents: any[] = [];
  let profile = null;

  if (supabase) {
    if (user) {
      const { data } = await supabase.from('profiles').select('origin_country_id, current_city').eq('id', user.id).single();
      profile = data;
    }

    const [commsRes, eventsRes] = await Promise.all([
      supabase
        .from('communities')
        .select('id, name, slug, description, member_count, country_iso, countries(name, flag_emoji)')
        .order('member_count', { ascending: false })
        .limit(6),
      supabase
        .from('events')
        .select('id, title, description, venue, starts_at, event_kind, cities(name, country_iso)')
        .gte('starts_at', new Date().toISOString())
        .order('starts_at', { ascending: true })
        .limit(4),
    ]);

    diasporaCommunities = commsRes.data ?? [];
    diasporaEvents = eventsRes.data ?? [];
  }

  const selectedCombo = COMBINATIONS.find(c => c.id === comboId);
  let comboPosts: any[] = [];
  let comboCreators: any[] = [];
  
  if (selectedCombo && supabase) {
    // get country uuid
    const { data: countryData } = await supabase.from('countries').select('id').eq('iso_code', selectedCombo.iso).single();
    if (countryData) {
      // Top Creators
      const { data: cData } = await supabase.from('profiles')
        .select('*')
        .eq('origin_country_id', countryData.id)
        .ilike('current_city', `%${selectedCombo.city}%`)
        .limit(4);
      comboCreators = cData || [];

      // Recent Posts
      const { data: pData } = await supabase.from('posts')
        .select('*, profiles!inner(*)')
        .eq('profiles.origin_country_id', countryData.id)
        .ilike('profiles.current_city', `%${selectedCombo.city}%`)
        .order('created_at', { ascending: false })
        .limit(10);
      comboPosts = pData || [];
    }
  }

  const needsProfilePrompt = user && profile && (!profile.origin_country_id || !profile.current_city);

  return (
    <div className="min-h-screen bg-transparent text-brand-sandstone p-4 md:p-6 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* HERO BANNER */}
      <div className="bg-gradient-to-br from-amber-500/20 via-brand-dusk to-brand-twilight border border-amber-500/30 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="relative z-10 space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-black tracking-wide uppercase">
            <Globe className="w-3.5 h-3.5" /> Global Diaspora Gateway
          </div>
          <h1 className="text-2xl md:text-4xl font-black text-brand-sandstone tracking-tight leading-tight">
            Connect With Your Caribbean Roots &amp; Global Diaspora Hubs
          </h1>
          <p className="text-xs md:text-sm text-brand-sandstone/70 leading-relaxed">
            From Flatbush to Brixton, Little Haiti to Scarborough, discover verified diaspora communities, local festivals, homeland investment bonds, and cultural creators worldwide.
          </p>
        </div>
      </div>

      {needsProfilePrompt && (
        <div className="bg-brand-caribbeanSea/10 border border-brand-caribbeanSea/40 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-bold text-brand-caribbeanSea text-sm">Where are you from?</h3>
            <p className="text-xs text-brand-sandstone/70">Let us personalize your diaspora experience with communities and creators near you.</p>
          </div>
          <Link href="/settings#location" className="px-5 py-2 bg-brand-caribbeanSea text-slate-900 font-bold rounded-2xl text-xs whitespace-nowrap">
            Update Profile
          </Link>
        </div>
      )}

      {/* DIASPORA DISCOVERY PANEL */}
      <section className="space-y-4">
        <h2 className="text-sm font-extrabold text-brand-sandstone flex items-center gap-2 uppercase tracking-wider">
          <Sparkles className="w-4 h-4 text-brand-sunriseCoral" /> Diaspora Communities
        </h2>
        <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-hide">
          {COMBINATIONS.map(c => (
            <Link 
              key={c.id} 
              href={`?combo=${c.id}`}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-3 rounded-2xl border transition-colors ${comboId === c.id ? 'bg-brand-dusk border-brand-sunriseCoral text-brand-sunriseCoral' : 'bg-brand-dusk/60 border-slate-800 hover:border-brand-sunriseCoral/50'}`}
            >
              <span className="text-lg">{c.flag}{c.emoji}</span>
              <span className="text-xs font-bold whitespace-nowrap">{c.label}</span>
            </Link>
          ))}
          {comboId && (
            <Link href="?" className="flex-shrink-0 flex items-center gap-2 px-4 py-3 rounded-2xl border bg-brand-dusk/40 border-slate-700 text-slate-400 hover:text-slate-200">
              <XCircle className="w-4 h-4" /> <span className="text-xs font-bold">Clear</span>
            </Link>
          )}
        </div>
      </section>

      {/* CONTENT FEED (only visible when a combo is selected) */}
      {selectedCombo && (
        <section className="space-y-6 pt-4 border-t border-slate-800">
          <h2 className="text-lg font-black text-brand-sandstone">
            {selectedCombo.label} Hub
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-sm font-bold text-brand-sandstone/80">Recent Posts</h3>
              {comboPosts.length === 0 ? (
                <div className="p-8 border border-slate-800 rounded-3xl bg-brand-dusk/40 text-center text-xs text-slate-400">
                  No posts from {selectedCombo.label} yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {comboPosts.map(post => (
                    <div key={post.id} className="p-4 border border-slate-800 rounded-2xl bg-brand-dusk/60 flex gap-4">
                      <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center font-bold text-slate-500 shrink-0">
                        {post.profiles?.display_name?.charAt(0) || 'U'}
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-bold text-brand-sandstone">{post.profiles?.display_name}</p>
                        <p className="text-sm text-brand-sandstone/80">{post.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-brand-sandstone/80">Top Creators</h3>
                {comboCreators.length === 0 ? (
                  <div className="p-4 border border-slate-800 rounded-3xl bg-brand-dusk/40 text-xs text-slate-400 text-center">
                    No creators found in this hub.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {comboCreators.map(creator => (
                      <div key={creator.id} className="p-3 border border-slate-800 rounded-2xl flex items-center gap-3 hover:bg-slate-800/50">
                        <div className="w-8 h-8 bg-brand-caribbeanSea/20 rounded-full flex items-center justify-center font-bold text-brand-caribbeanSea shrink-0">
                          {creator.display_name?.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-brand-sandstone truncate">{creator.display_name}</p>
                          <p className="text-[10px] text-brand-sandstone/60 truncate">@{creator.username}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 1. MAJOR GLOBAL CITY HUBS */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-brand-sandstone flex items-center gap-2 uppercase tracking-wider">
            <MapPin className="w-4 h-4 text-amber-400" /> 1. Major Global Diaspora Hubs
          </h2>
          <span className="text-xs text-brand-sandstone/40">15 Key Metropolitan Centers</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {DIASPORA_CITY_HUBS.map((hub) => (
            <Link
              key={hub.id}
              href={`/explore?hub=${encodeURIComponent(hub.city.split(' ')[0])}`}
              className="bg-brand-dusk/80 border border-slate-800 hover:border-amber-400/50 hover:bg-brand-dusk rounded-3xl p-4 transition-all flex flex-col justify-between shadow-md group cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">{hub.flag}</span>
                <span className="text-[9px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full uppercase">
                  {hub.countryIso}
                </span>
              </div>
              <div className="mt-3">
                <h4 className="font-extrabold text-xs text-brand-sandstone group-hover:text-amber-300 transition-colors leading-snug">
                  {hub.city}
                </h4>
                <p className="text-[10px] text-brand-sandstone/60 mt-0.5">{hub.country}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 2. FEATURED DIASPORA GUILDS & COMMUNITIES */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-brand-sandstone flex items-center gap-2 uppercase tracking-wider">
            <Users className="w-4 h-4 text-brand-sunriseCoral" /> 2. Featured Diaspora Guilds &amp; Associations
          </h2>
          <Link href="/communities" className="text-xs text-brand-sunriseCoral hover:underline font-bold flex items-center gap-1">
            View all communities <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {diasporaCommunities.length === 0 ? (
          <div className="bg-brand-dusk/70 border border-slate-800 rounded-3xl p-8 text-center space-y-2">
            <Users className="w-8 h-8 text-brand-sunriseCoral/60 mx-auto" />
            <p className="text-xs text-brand-sandstone/60">No diaspora guilds found for this filter. Create the first diaspora hub!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {diasporaCommunities.map((comm: any) => (
              <div
                key={comm.id}
                className="bg-brand-dusk/80 border border-slate-800 rounded-3xl p-5 space-y-3 flex flex-col justify-between shadow-lg hover:border-slate-700 transition-all"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{comm.flag || comm.countries?.flag_emoji || '??'}</span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-brand-sunriseCoral/10 text-brand-sunriseCoral border border-brand-sunriseCoral/30 uppercase">
                      Guild
                    </span>
                  </div>
                  <Link href={`/communities/${comm.slug}`}>
                    <h3 className="font-extrabold text-sm text-brand-sandstone hover:text-brand-sunriseCoral transition-colors cursor-pointer">
                      {comm.name}
                    </h3>
                  </Link>
                  {comm.description && (
                    <p className="text-xs text-slate-300 line-clamp-2">{comm.description}</p>
                  )}
                  <span className="text-[11px] text-brand-sandstone/60 block pt-1">
                    {(comm.member_count || 0).toLocaleString()} Members
                  </span>
                </div>
                <div className="pt-3 border-t border-slate-800">
                  <Link
                    href={`/communities/${comm.slug}`}
                    className="block w-full text-center bg-brand-sunriseCoral hover:bg-brand-sunriseCoral text-slate-950 font-black py-2 rounded-2xl text-xs transition-all shadow-md shadow-brand-sunriseCoral/20 cursor-pointer"
                  >
                    Open Community Hub  
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 3. DIASPORA CULTURAL EVENTS & CARNIVALS */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-brand-sandstone flex items-center gap-2 uppercase tracking-wider">
            <Calendar className="w-4 h-4 text-yellow-400" /> 3. Diaspora Events &amp; Festivals
          </h2>
          <Link href="/events" className="text-xs text-yellow-400 hover:underline font-bold flex items-center gap-1">
            View all events <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {diasporaEvents.length === 0 ? (
          <div className="bg-brand-dusk/70 border border-slate-800 rounded-3xl p-8 text-center space-y-2">
            <Calendar className="w-8 h-8 text-yellow-400/60 mx-auto" />
            <p className="text-xs text-brand-sandstone/60">No upcoming diaspora events scheduled for this region.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {diasporaEvents.map((evt: any) => (
              <div
                key={evt.id}
                className="bg-brand-dusk/80 border border-slate-800 rounded-3xl p-5 space-y-3 flex flex-col justify-between shadow-lg hover:border-yellow-500/40 transition-all"
              >
                <div className="space-y-2">
                  <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 uppercase">
                    {evt.event_kind}
                  </span>
                  <h4 className="font-extrabold text-sm text-brand-sandstone leading-snug">{evt.title}</h4>
                  <div className="text-[11px] text-brand-sandstone/60 space-y-0.5 pt-1">
                    <p className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-brand-caribbeanSea" />
                      <span>{evt.venue || evt.cities?.name || evt.city || 'Diaspora'}</span>
                    </p>
                  </div>
                </div>
                <div className="pt-3 border-t border-slate-800">
                  <Link
                    href="/events"
                    className="block w-full text-center bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black py-2 rounded-2xl text-xs transition-all shadow-md shadow-yellow-500/20"
                  >
                    RSVP / Get Event Ticket  
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
