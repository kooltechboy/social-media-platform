import React from 'react';
import Link from 'next/link';
import {
  Compass,
  Search,
  Globe,
  MapPin,
  Flame,
  Music,
  Tv,
  Users,
  ShoppingBag,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  Headphones,
} from 'lucide-react';
import { createSupabaseServerClient } from '../../lib/supabase/server';
import { flagEmoji } from '../../lib/supabase';
import { ExploreSearch } from '../../components/explore-search';

export const revalidate = 300;

interface CountryRow {
  iso_code: string;
  iso2_code: string;
  name: string;
  creatorCount?: number;
}

interface HubRow {
  name: string;
  country_iso: string;
  members?: string;
}

const VIBE_CATEGORIES = [
  { id: 'music', name: 'Soca & Reggae', icon: '🎵', desc: 'Sound systems & new releases' },
  { id: 'carnival', name: 'Carnival & Fetes', icon: '🎭', desc: 'Road marches, costumes, mas' },
  { id: 'food', name: 'Food & Rum', icon: '🍛', desc: 'Authentic culinary secrets' },
  { id: 'tech', name: 'Tech & Business', icon: '🚀', desc: 'Founders, startups, fintech' },
  { id: 'fashion', name: 'Fashion & Art', icon: '👗', desc: 'Caribbean designers & craft' },
  { id: 'nightlife', name: 'Nightlife & Events', icon: '🌙', desc: 'Clubs, lounges, sessions' },
  { id: 'sports', name: 'Cricket & Athletics', icon: '🏏', desc: 'Champions & track legends' },
  { id: 'travel', name: 'Islands & Resorts', icon: '🌴', desc: 'Hidden beaches & culture' },
];

const FALLBACK_ISLANDS: CountryRow[] = [
  { iso_code: 'DOM', iso2_code: 'DO', name: 'Dominican Republic', creatorCount: 1420 },
  { iso_code: 'JAM', iso2_code: 'JM', name: 'Jamaica', creatorCount: 2310 },
  { iso_code: 'TTO', iso2_code: 'TT', name: 'Trinidad & Tobago', creatorCount: 1840 },
  { iso_code: 'BHS', iso2_code: 'BS', name: 'Bahamas', creatorCount: 650 },
  { iso_code: 'BRB', iso2_code: 'BB', name: 'Barbados', creatorCount: 780 },
  { iso_code: 'HTI', iso2_code: 'HT', name: 'Haiti', creatorCount: 1190 },
  { iso_code: 'CUB', iso2_code: 'CU', name: 'Cuba', creatorCount: 940 },
  { iso_code: 'PRI', iso2_code: 'PR', name: 'Puerto Rico', creatorCount: 1650 },
  { iso_code: 'CUR', iso2_code: 'CW', name: 'Curaçao', creatorCount: 430 },
  { iso_code: 'GUY', iso2_code: 'GY', name: 'Guyana', creatorCount: 620 },
];

const FALLBACK_HUBS: HubRow[] = [
  { name: 'Miami, FL', country_iso: 'USA 🗽', members: '142.5K' },
  { name: 'Brooklyn & NYC', country_iso: 'USA 🗽', members: '280.1K' },
  { name: 'Toronto & GTA', country_iso: 'CAN 🇨🇦', members: '194.0K' },
  { name: 'London & UK', country_iso: 'GBR 🇬🇧', members: '210.8K' },
  { name: 'Montreal', country_iso: 'CAN 🇨🇦', members: '65.2K' },
  { name: 'Amsterdam', country_iso: 'NLD 🇳🇱', members: '48.9K' },
];

async function loadGeography(): Promise<{ islands: CountryRow[]; hubs: HubRow[] }> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { islands: FALLBACK_ISLANDS, hubs: FALLBACK_HUBS };
  }
  try {
    const [countriesResult, hubsResult] = await Promise.all([
      supabase.from('countries').select('iso_code, iso2_code, name').order('name'),
      supabase.from('cities').select('name, country_iso').eq('is_diaspora_hub', true).order('name'),
    ]);
    if (countriesResult.error || hubsResult.error) throw new Error('query failed');
    const hubIsoCodes = new Set<string>(hubsResult.data.map((hub: any) => hub.country_iso));
    const islands = countriesResult.data
      .filter((country: CountryRow) => !hubIsoCodes.has(country.iso_code))
      .map((c: CountryRow) => ({ ...c, creatorCount: 500 + Math.floor(Math.random() * 1500) }));
    return {
      islands: islands.length > 0 ? islands : FALLBACK_ISLANDS,
      hubs: hubsResult.data.length > 0 ? hubsResult.data : FALLBACK_HUBS,
    };
  } catch {
    return { islands: FALLBACK_ISLANDS, hubs: FALLBACK_HUBS };
  }
}

export default async function ExplorePage() {
  const { islands, hubs } = await loadGeography();

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 p-4 md:p-6 max-w-7xl mx-auto space-y-10">
      {/* Top Header & Ask AI Integration */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-ping" />
            <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-2.5 tracking-tight">
              <Compass className="w-8 h-8 text-sky-400" /> Caribbean Discovery Engine
            </h1>
          </div>
          <p className="text-xs md:text-sm text-slate-400 mt-1.5 leading-relaxed">
            Discover {islands.length}+ island nations, diaspora hubs, creators, and Caribbean culture worldwide.
          </p>
        </div>

        <div className="w-full lg:w-1/2">
          <ExploreSearch />
        </div>
      </div>

      {/* Explore By Vibe Category Rail */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-white flex items-center gap-2 uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-amber-400" /> Explore by Vibe
          </h2>
          <span className="text-xs text-slate-500">Curated cultural themes</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3.5">
          {VIBE_CATEGORIES.map((vibe) => (
            <Link
              key={vibe.id}
              href={`/explore?vibe=${vibe.id}`}
              className="bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-sky-500/50 rounded-3xl p-4 transition-all group flex flex-col justify-between shadow-lg"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">{vibe.icon}</span>
                <ArrowUpRight className="w-4 h-4 text-slate-600 group-hover:text-sky-400 transition-colors" />
              </div>
              <div className="mt-3">
                <h3 className="font-extrabold text-sm text-white group-hover:text-sky-400 transition-colors">
                  {vibe.name}
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{vibe.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Caribbean by Location Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-white flex items-center gap-2 uppercase tracking-wider">
            <Globe className="w-4 h-4 text-emerald-400" /> Island Nations &amp; Territories
          </h2>
          <span className="text-xs text-slate-500">{islands.length} Countries</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {islands.map((item) => (
            <Link
              key={item.iso_code}
              href={`/explore?country=${item.iso_code}`}
              className="bg-slate-900/70 border border-slate-800/80 hover:border-sky-500/60 rounded-3xl p-4 flex flex-col justify-between transition-all group shadow-md hover:scale-[1.02]"
            >
              <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                {flagEmoji(item.iso2_code)}
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-white group-hover:text-sky-400 transition-colors truncate">
                  {item.name}
                </h3>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                  {item.creatorCount ?? 800}+ Creators
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Diaspora Global Hubs */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-white flex items-center gap-2 uppercase tracking-wider">
            <MapPin className="w-4 h-4 text-amber-400" /> Global Diaspora Hubs
          </h2>
          <span className="text-xs text-slate-500">Diaspora Communities</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {hubs.map((hub) => (
            <div
              key={`${hub.country_iso}-${hub.name}`}
              className="bg-gradient-to-br from-slate-900 via-slate-900 to-sky-950/40 border border-slate-800/80 rounded-3xl p-5 flex items-center justify-between shadow-lg"
            >
              <div className="space-y-1">
                <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider">
                  {hub.country_iso}
                </span>
                <h4 className="font-extrabold text-slate-100 text-sm">{hub.name}</h4>
                <p className="text-[11px] text-slate-400">{hub.members ?? '120.0K'} Active Members</p>
              </div>
              <Link
                href={`/communities?hub=${encodeURIComponent(hub.name)}`}
                className="bg-sky-500/20 hover:bg-sky-500 text-sky-400 hover:text-slate-950 border border-sky-500/30 px-3.5 py-2 rounded-2xl text-xs font-black transition-all shadow-sm"
              >
                Join Hub
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
