import React from 'react';
import { Compass, Search, Globe, MapPin } from 'lucide-react';
import { createServerSupabase, flagEmoji } from '../../lib/supabase';

import { ExploreSearch } from '../../components/explore-search';

export const revalidate = 300;

interface CountryRow {
  iso_code: string;
  iso2_code: string;
  name: string;
}

interface HubRow {
  name: string;
  country_iso: string;
}

const FALLBACK_ISLANDS: CountryRow[] = [
  { iso_code: 'DOM', iso2_code: 'DO', name: 'Dominican Republic' },
  { iso_code: 'JAM', iso2_code: 'JM', name: 'Jamaica' },
  { iso_code: 'TTO', iso2_code: 'TT', name: 'Trinidad & Tobago' },
  { iso_code: 'BHS', iso2_code: 'BS', name: 'Bahamas' },
  { iso_code: 'BRB', iso2_code: 'BB', name: 'Barbados' },
  { iso_code: 'HTI', iso2_code: 'HT', name: 'Haiti' },
  { iso_code: 'CUB', iso2_code: 'CU', name: 'Cuba' },
  { iso_code: 'PRI', iso2_code: 'PR', name: 'Puerto Rico' },
  { iso_code: 'CUR', iso2_code: 'CW', name: 'Curaçao' },
  { iso_code: 'GUY', iso2_code: 'GY', name: 'Guyana' },
];

const FALLBACK_HUBS: HubRow[] = [
  { name: 'New York', country_iso: 'USA' },
  { name: 'Miami', country_iso: 'USA' },
  { name: 'Toronto', country_iso: 'CAN' },
  { name: 'London', country_iso: 'GBR' },
  { name: 'Amsterdam', country_iso: 'NLD' },
];

async function loadGeography(): Promise<{ islands: CountryRow[]; hubs: HubRow[] }> {
  const supabase = createServerSupabase();
  if (!supabase) {
    return { islands: FALLBACK_ISLANDS, hubs: FALLBACK_HUBS };
  }
  try {
    const [countriesResult, hubsResult] = await Promise.all([
      supabase.from('countries').select('iso_code, iso2_code, name').order('name'),
      supabase.from('cities').select('name, country_iso').eq('is_diaspora_hub', true).order('name'),
    ]);
    if (countriesResult.error || hubsResult.error) throw new Error('query failed');
    const hubIsoCodes = new Set<string>(hubsResult.data.map((hub: HubRow) => hub.country_iso));
    const islands = countriesResult.data.filter((country: CountryRow) => !hubIsoCodes.has(country.iso_code));
    return { islands, hubs: hubsResult.data };
  } catch {
    return { islands: FALLBACK_ISLANDS, hubs: FALLBACK_HUBS };
  }
}

export default async function ExplorePage() {
  const { islands, hubs } = await loadGeography();

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 p-6 max-w-7xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3">
            <Compass className="w-7 h-7 text-sky-400" /> Caribbean Discovery Engine
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Explore creators, music, culture, and diaspora communities across {islands.length} countries & worldwide hubs.
          </p>
        </div>

        <div className="w-full md:w-1/2">
          <ExploreSearch />
        </div>
      </div>

      {/* Caribbean by Location Grid */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Globe className="w-5 h-5 text-emerald-400" /> Browse by Island & Country
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {islands.map((item) => (
            <div key={item.iso_code} className="bg-slate-900/80 border border-slate-800 hover:border-sky-500/60 rounded-2xl p-4 flex flex-col justify-between transition-all cursor-pointer group">
              <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">{flagEmoji(item.iso2_code)}</div>
              <div>
                <h3 className="font-bold text-sm text-white group-hover:text-sky-400 transition-colors">{item.name}</h3>
                <span className="text-xs text-slate-400">#{item.name.replace(/[^A-Za-z]/g, '')}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Diaspora Global Hubs */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <MapPin className="w-5 h-5 text-amber-400" /> Major Diaspora Hubs
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {hubs.map((hub) => (
            <div key={`${hub.country_iso}-${hub.name}`} className="bg-gradient-to-r from-slate-900 via-slate-900 to-sky-950/40 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-amber-400">{hub.country_iso}</span>
                <h4 className="font-bold text-slate-100 text-sm">{hub.name}</h4>
                <span className="text-xs text-slate-400">Caribbean diaspora hub</span>
              </div>
              <button className="bg-sky-500/20 text-sky-400 border border-sky-500/30 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-sky-500/30 transition-colors">
                Connect Hub
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
