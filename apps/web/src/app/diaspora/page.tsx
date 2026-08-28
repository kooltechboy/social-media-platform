import React from 'react';
import Link from 'next/link';
import {
  Globe,
  MapPin,
  Users,
  Calendar,
  Sparkles,
  Search,
  Building2,
  Compass,
  ArrowRight,
  ArrowUpRight,
  Flame,
  Radio,
  ShoppingBag,
} from 'lucide-react';
import { DIASPORA_CITY_HUBS, DIASPORA_COUNTRIES } from '../../lib/constants/diaspora-hubs';
import { CARIBBEAN_TERRITORIES } from '../../lib/constants/caribbean-territories';
import { createSupabaseServerClient, getCurrentUser } from '../../lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function DiasporaPortalPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; hub?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const query = resolvedParams.q || '';
  const activeHub = resolvedParams.hub || '';

  const [user, supabase] = await Promise.all([
    getCurrentUser(),
    createSupabaseServerClient(),
  ]);

  let diasporaCommunities: any[] = [];
  let diasporaEvents: any[] = [];

  if (supabase) {
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

  return (
    <div className="min-h-screen bg-[#090D16] text-brand-sandstone p-4 md:p-6 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* ────────────────────────────────────────────────────────── */}
      {/* HERO BANNER                                                */}
      {/* ────────────────────────────────────────────────────────── */}
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

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/map"
              className="bg-brand-caribbeanSea hover:bg-brand-caribbeanSea text-slate-950 font-black px-4 py-2 rounded-2xl text-xs flex items-center gap-2 transition-all shadow-md shadow-brand-caribbeanSea/20"
            >
              <Compass className="w-4 h-4" /> Open Geospatial Map
            </Link>
            <Link
              href="/explore"
              className="bg-brand-dusk hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold px-4 py-2 rounded-2xl text-xs flex items-center gap-2 transition-colors"
            >
              <Search className="w-4 h-4 text-amber-300" /> Explore All Vibes
            </Link>
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 1. MAJOR GLOBAL CITY HUBS                                  */}
      {/* ────────────────────────────────────────────────────────── */}
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

      {/* ────────────────────────────────────────────────────────── */}
      {/* 2. FEATURED DIASPORA GUILDS & COMMUNITIES                  */}
      {/* ────────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-brand-sandstone flex items-center gap-2 uppercase tracking-wider">
            <Users className="w-4 h-4 text-brand-sunriseCoral" /> 2. Featured Diaspora Guilds &amp; Associations
          </h2>
          <Link href="/communities" className="text-xs text-brand-sunriseCoral hover:underline font-bold flex items-center gap-1">
            View all communities <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(diasporaCommunities.length > 0
            ? diasporaCommunities
            : [
                {
                  id: 'c1',
                  name: 'Jamaicans in Toronto & GTA',
                  slug: 'jamaicans-in-toronto',
                  description: 'Diaspora network for community events, Caribana updates, business networking, and culinary meetups in Ontario.',
                  member_count: 18400,
                  flag: '🇯🇲',
                },
                {
                  id: 'c2',
                  name: 'Dominicans in New York City',
                  slug: 'dominicans-in-nyc',
                  description: 'Connecting Quisqueyanos across Washington Heights, the Bronx, and Queens. Cultural events, sports, and business directory.',
                  member_count: 24900,
                  flag: '🇩🇴',
                },
                {
                  id: 'c3',
                  name: 'Caribbean Developers & Tech Founders',
                  slug: 'caribbean-developers-tech',
                  description: 'Engineers, designers, product managers, and founders building software and AI across the islands and diaspora.',
                  member_count: 9200,
                  flag: '🌴',
                },
              ]
          ).map((comm: any) => (
            <div
              key={comm.id}
              className="bg-brand-dusk/80 border border-slate-800 rounded-3xl p-5 space-y-3 flex flex-col justify-between shadow-lg hover:border-slate-700 transition-all"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{comm.flag || comm.countries?.flag_emoji || '🌴'}</span>
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
                  {(comm.member_count || 1200).toLocaleString()} Members
                </span>
              </div>

              <div className="pt-3 border-t border-slate-800">
                <Link
                  href={`/communities/${comm.slug}`}
                  className="block w-full text-center bg-brand-sunriseCoral hover:bg-brand-sunriseCoral text-slate-950 font-black py-2 rounded-2xl text-xs transition-all shadow-md shadow-brand-sunriseCoral/20 cursor-pointer"
                >
                  Open Community Hub →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 3. DIASPORA CULTURAL EVENTS & CARNIVALS                    */}
      {/* ────────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-brand-sandstone flex items-center gap-2 uppercase tracking-wider">
            <Calendar className="w-4 h-4 text-yellow-400" /> 3. Diaspora Events &amp; Festivals
          </h2>
          <Link href="/events" className="text-xs text-yellow-400 hover:underline font-bold flex items-center gap-1">
            View all events <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {(diasporaEvents.length > 0
            ? diasporaEvents
            : [
                {
                  id: 'e1',
                  title: 'Caribana Toronto Grand Parade & Lakeshore Celebration',
                  venue: 'Exhibition Place & Lakeshore Blvd',
                  city: 'Toronto, Canada 🇨🇦',
                  event_kind: 'in_person',
                  starts_at: new Date(Date.now() + 25 * 86400000).toISOString(),
                },
                {
                  id: 'e2',
                  title: 'Dominican Food & Merengue Summit in the Heights',
                  venue: 'Highbridge Park Plaza',
                  city: 'New York, USA 🗽',
                  event_kind: 'in_person',
                  starts_at: new Date(Date.now() + 8 * 86400000).toISOString(),
                },
                {
                  id: 'e3',
                  title: 'London Notting Hill Warm-Up: Caribbean Creators Summit',
                  venue: 'The Tabernacle, Notting Hill',
                  city: 'London, UK 🇬🇧',
                  event_kind: 'hybrid',
                  starts_at: new Date(Date.now() + 18 * 86400000).toISOString(),
                },
              ]
          ).map((evt: any) => (
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
                  RSVP / Get SpotPay Ticket →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
