import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Globe,
  MapPin,
  Users,
  Calendar,
  Sparkles,
  ShoppingBag,
  Music,
  Tv,
  ArrowRight,
  Compass,
  Building2,
  CheckCircle,
} from 'lucide-react';
import { createSupabaseServerClient, getCurrentUser } from '../../lib/supabase/server';
import { CANONICAL_GEOGRAPHIES } from '../../lib/explore/canonical-geography';
import RightRail from '../../components/right-rail';
import ExploreRail from '../../components/rails/explore-rail';
import { fetchTrendingSignalsAction } from '../../lib/explore/actions';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Caribbean — The Caribbean Connected',
  description: 'Connect with Island Territories, Diaspora Gateways, Caribbean culture, sounds, and communities.',
};

const DIASPORA_GATEWAYS = [
  { id: 'NYC', name: 'New York (Brooklyn & Queens)', flag: '🗽', country: 'USA', members: '120k+ Diaspora' },
  { id: 'MIA', name: 'Miami & South Florida', flag: '🌴', country: 'USA', members: '95k+ Diaspora' },
  { id: 'TOR', name: 'Toronto & Greater Area', flag: '🍁', country: 'CAN', members: '85k+ Diaspora' },
  { id: 'LON', name: 'London & United Kingdom', flag: '🎡', country: 'GBR', members: '70k+ Diaspora' },
  { id: 'MTL', name: 'Montreal & Quebec', flag: '❄️', country: 'CAN', members: '35k+ Diaspora' },
];

export default async function CaribbeanPortalPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string; geo?: string; q?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const activeTab = resolvedParams.tab || 'territories';
  const selectedGeo = resolvedParams.geo || '';

  const [user, supabase, trendingSignals] = await Promise.all([
    getCurrentUser(),
    createSupabaseServerClient(),
    fetchTrendingSignalsAction(),
  ]);

  let diasporaCommunities: any[] = [];
  let upcomingEvents: any[] = [];
  let activeLiveStream: any = null;

  if (supabase) {
    const nowIso = new Date().toISOString();
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();

    const [commsRes, eventsRes, liveRes] = await Promise.all([
      supabase
        .from('communities')
        .select('id, name, slug, description, member_count, country_iso, countries(name, flag_emoji)')
        .order('member_count', { ascending: false })
        .limit(6),
      supabase
        .from('events')
        .select('id, title, description, venue, starts_at, event_kind, cities(name, country_iso)')
        .gte('starts_at', nowIso)
        .order('starts_at', { ascending: true })
        .limit(4),
      supabase
        .from('livestreams')
        .select('id, title, peak_viewers, profiles(display_name)')
        .eq('state', 'live')
        .gte('started_at', sixHoursAgo)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    diasporaCommunities = commsRes.data ?? [];
    upcomingEvents = eventsRes.data ?? [];
    activeLiveStream = liveRes.data ?? null;
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 xl:gap-8 items-start w-full">
      {/* ── CENTER WORKSPACE: CARIBBEAN PORTAL ── */}
      <div className="flex-1 min-w-0 space-y-8 w-full max-w-[840px] xl:max-w-[880px] mx-auto lg:mx-0 animate-fadeIn">
        {/* Hero Header */}
        <header className="surface-header rounded-3xl p-6 sm:p-8 md:p-10 border border-brand-caribbeanSea/30 shadow-2xl relative overflow-hidden bg-gradient-to-br from-[#180F29]/95 via-[#100A1C] to-[#0A0612] backdrop-blur-2xl">
          <div className="absolute right-0 top-0 w-96 h-96 bg-brand-caribbeanSea/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          <div className="relative z-10 space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-caribbeanSea/15 border border-brand-caribbeanSea/30 text-brand-caribbeanSea text-xs font-black uppercase tracking-wider">
              <Globe className="w-3.5 h-3.5" /> The Caribbean Connected
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
              Caribbean Nations &amp; Global Diaspora
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-brand-sandstone/80 leading-relaxed">
              Explore culture, island territories, diaspora gateway hubs, community voices, events, and commerce across the Caribbean archipelago and worldwide diaspora.
            </p>

            {/* Quick Stats / Highlights */}
            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs font-bold text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>30+ Island Territories</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-brand-goldenHour" />
                <span>Global Diaspora Gateways</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-brand-sunriseCoral" />
                <span>100% Verified Island Culture</span>
              </span>
            </div>
          </div>

          {/* Tab Navigation */}
          <nav
            aria-label="Caribbean Portal Sections"
            className="flex items-center gap-2 overflow-x-auto pt-6 mt-6 border-t border-white/10 scrollbar-none"
          >
            {[
              { id: 'territories', label: 'Island Territories', icon: Globe },
              { id: 'gateways', label: 'Diaspora Gateways', icon: MapPin },
              { id: 'communities', label: 'Hubs & Communities', icon: Users },
              { id: 'culture', label: 'Events & Culture', icon: Calendar },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <Link
                  key={tab.id}
                  href={`/caribbean?tab=${tab.id}`}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all min-h-[40px] ${
                    isActive
                      ? 'bg-brand-caribbeanSea text-slate-950 shadow-md shadow-brand-caribbeanSea/20'
                      : 'text-brand-sandstone/70 hover:bg-white/5 hover:text-white border border-transparent'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </Link>
              );
            })}
          </nav>
        </header>

        {/* ── TAB 1: ISLAND TERRITORIES DIRECTORY ── */}
        {activeTab === 'territories' && (
          <section className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-black text-brand-caribbeanSea uppercase tracking-wider flex items-center gap-2">
                <Globe className="w-4 h-4" /> Island Territories &amp; Nations
              </h2>
              <span className="text-xs text-brand-sandstone/60">Select an island to explore</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
              {CANONICAL_GEOGRAPHIES.slice(0, 18).map((geo) => (
                <Link
                  key={geo.slug}
                  href={`/explore?geo=${geo.slug}`}
                  className="glass rounded-2xl p-4 border border-white/10 hover:border-brand-caribbeanSea/50 transition-all hover:bg-white/5 flex items-center justify-between group min-h-[72px]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-2xl shrink-0 group-hover:scale-115 transition-transform">
                      {geo.flagEmoji}
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-sm font-black text-white group-hover:text-brand-caribbeanSea truncate">
                        {geo.name}
                      </h3>
                      <p className="text-[11px] text-brand-sandstone/60 truncate">
                        {geo.region || 'Caribbean Basin'}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-brand-sandstone/40 group-hover:text-brand-caribbeanSea group-hover:translate-x-1 transition-all shrink-0" />
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── TAB 2: DIASPORA GATEWAYS ── */}
        {activeTab === 'gateways' && (
          <section className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-black text-brand-goldenHour uppercase tracking-wider flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Global Diaspora Gateway Cities
              </h2>
              <span className="text-xs text-brand-sandstone/60">Global hubs connected</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {DIASPORA_GATEWAYS.map((gw) => (
                <div
                  key={gw.id}
                  className="glass rounded-2xl p-5 border border-white/10 space-y-3 bg-gradient-to-br from-white/5 to-transparent"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{gw.flag}</span>
                    <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-brand-goldenHour/15 text-amber-300 border border-brand-goldenHour/30">
                      {gw.members}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">{gw.name}</h3>
                    <p className="text-xs text-brand-sandstone/70 mt-0.5">
                      Connect with island community organizations and diaspora businesses.
                    </p>
                  </div>
                  <div className="pt-2 flex items-center gap-2 border-t border-white/10">
                    <Link
                      href={`/communities?q=${encodeURIComponent(gw.id)}`}
                      className="text-xs font-bold text-brand-caribbeanSea hover:underline flex items-center gap-1"
                    >
                      <span>Find Hubs</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── TAB 3: COMMUNITIES & HUBS ── */}
        {activeTab === 'communities' && (
          <section className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-black text-brand-sunriseCoral uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4" /> Featured Diaspora Communities
              </h2>
              <Link href="/communities" className="text-xs font-bold text-brand-sunriseCoral hover:underline">
                View All Communities &rarr;
              </Link>
            </div>

            {diasporaCommunities.length === 0 ? (
              <div className="surface-card rounded-2xl p-8 text-center text-brand-sandstone/70 border border-white/10">
                <Users className="w-8 h-8 mx-auto text-slate-500 mb-2" />
                <p className="text-sm font-bold text-white">No communities listed yet</p>
                <p className="text-xs text-brand-sandstone/60 mt-1">Be the first to create a diaspora community hub.</p>
                <Link
                  href="/communities?create=true"
                  className="inline-block mt-3 bg-brand-caribbeanSea text-slate-950 font-black text-xs px-4 py-2 rounded-xl"
                >
                  Create Community
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {diasporaCommunities.map((c) => (
                  <Link
                    key={c.id}
                    href={`/communities/${c.slug}`}
                    className="glass rounded-2xl p-4 border border-white/10 hover:border-brand-sunriseCoral/40 transition-all block group"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-black text-white group-hover:text-brand-sunriseCoral truncate">
                        {c.name}
                      </h3>
                      <span className="text-[10px] font-mono text-brand-sandstone/70 shrink-0">
                        {c.member_count} members
                      </span>
                    </div>
                    {c.description && (
                      <p className="text-xs text-brand-sandstone/70 mt-1 line-clamp-2">
                        {c.description}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── TAB 4: EVENTS & CULTURE ── */}
        {activeTab === 'culture' && (
          <section className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Cultural Events &amp; Fetes
              </h2>
              <Link href="/events" className="text-xs font-bold text-amber-400 hover:underline">
                View All Events &rarr;
              </Link>
            </div>

            {upcomingEvents.length === 0 ? (
              <div className="surface-card rounded-2xl p-8 text-center text-brand-sandstone/70 border border-white/10">
                <Calendar className="w-8 h-8 mx-auto text-slate-500 mb-2" />
                <p className="text-sm font-bold text-white">No upcoming events scheduled</p>
                <p className="text-xs text-brand-sandstone/60 mt-1">Host an island gathering or diaspora fete.</p>
                <Link
                  href="/events?create=true"
                  className="inline-block mt-3 bg-yellow-400 text-slate-950 font-black text-xs px-4 py-2 rounded-xl"
                >
                  Host an Event
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {upcomingEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="glass rounded-2xl p-4 border border-white/10 space-y-2"
                  >
                    <span className="text-[10px] font-black uppercase text-amber-300 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                      {evt.event_kind || 'cultural'}
                    </span>
                    <h3 className="text-sm font-black text-white">{evt.title}</h3>
                    <p className="text-xs text-brand-sandstone/70 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-brand-caribbeanSea shrink-0" />
                      <span>{evt.venue || 'Caribbean Venue'}</span>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      {/* ── RIGHT COLUMN: CONTEXTUAL REGIONAL RAIL ── */}
      <RightRail ariaLabel="Caribbean Regional Context">
        <ExploreRail
          activeGeoKey={selectedGeo || null}
          activeContentType="all"
          trendingSignals={trendingSignals}
        />
      </RightRail>
    </div>
  );
}
