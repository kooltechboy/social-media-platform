import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Globe, MapPin, Flag, Users } from 'lucide-react';
import { createAdminSupabaseClient, getAdminSession } from '../../lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function AdminGeographyPage() {
  const adminUser = await getAdminSession();
  if (!adminUser) redirect('/login');

  const supabase = await createAdminSupabaseClient();
  if (!supabase) redirect('/login');

  const [countriesResult, diasporaResult, communityGeoResult] = await Promise.all([
    supabase.from('profiles').select('origin_country_iso').not('origin_country_iso', 'is', null),
    supabase.from('profiles').select('origin_country_iso, account_type').limit(100),
    supabase.from('communities').select('country_iso, name, member_count').limit(100),
  ]);

  const rawCountries = (countriesResult.data ?? []) as Array<{ origin_country_iso: string }>;
  const countryCounts: Record<string, number> = {};
  rawCountries.forEach((r) => {
    if (r.origin_country_iso) {
      countryCounts[r.origin_country_iso] = (countryCounts[r.origin_country_iso] || 0) + 1;
    }
  });

  const sortedCountries = Object.entries(countryCounts)
    .map(([iso, count]) => ({ iso, count }))
    .sort((a, b) => b.count - a.count);

  const communities = (communityGeoResult.data ?? []) as Array<{
    country_iso: string | null;
    name: string;
    member_count?: number;
  }>;

  return (
    <div className="min-h-screen bg-brand-twilight text-brand-sandstone p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <h1 className="text-xl font-extrabold text-brand-sandstone flex items-center gap-2">
          <Globe className="w-6 h-6 text-brand-caribbeanSea" /> Caribbean Geography &amp; Diaspora
        </h1>
        <Link href="/" className="text-xs text-brand-sandstone/60 hover:text-brand-sandstone">← Dashboard</Link>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-brand-dusk/70 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-brand-sandstone flex items-center gap-2">
            <MapPin className="w-4 h-4 text-brand-sunriseCoral" /> User Origin Distribution
          </h2>
          {sortedCountries.length === 0 ? (
            <p className="text-xs text-brand-sandstone/40">No geographic origins registered yet.</p>
          ) : (
            <div className="space-y-2">
              {sortedCountries.map(({ iso, count }) => (
                <div key={iso} className="flex items-center justify-between bg-brand-twilight border border-slate-800 rounded-xl px-4 py-2.5 text-xs">
                  <span className="font-semibold text-brand-sandstone uppercase tracking-wider">{iso}</span>
                  <span className="text-brand-caribbeanSea font-bold">{count.toLocaleString()} users</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-brand-dusk/70 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-brand-sandstone flex items-center gap-2">
            <Users className="w-4 h-4 text-brand-goldenHour" /> Regional Communities
          </h2>
          {communities.length === 0 ? (
            <p className="text-xs text-brand-sandstone/40">No regional communities found.</p>
          ) : (
            <div className="space-y-2">
              {communities.slice(0, 10).map((c, i) => (
                <div key={i} className="flex items-center justify-between bg-brand-twilight border border-slate-800 rounded-xl px-4 py-2.5 text-xs">
                  <span className="font-semibold text-brand-sandstone">{c.name}</span>
                  <span className="text-brand-sandstone/60 uppercase">{c.country_iso || 'Global'}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
