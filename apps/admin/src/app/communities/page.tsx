import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Globe, Users, ShieldCheck, Search } from 'lucide-react';
import { createAdminSupabaseClient, getAdminSession } from '../../lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function AdminCommunitiesPage() {
  const adminUser = await getAdminSession();
  if (!adminUser) redirect('/login');

  const supabase = await createAdminSupabaseClient();
  if (!supabase) redirect('/login');

  const { data, count } = await supabase
    .from('communities')
    .select('id, name, slug, description, country_iso, join_policy, created_at', { count: 'exact' })
    .order('created_at', { ascending: false });

  const communities = (data ?? []) as Array<{
    id: string;
    name: string;
    slug: string;
    description: string | null;
    country_iso: string | null;
    join_policy: string;
    created_at: string;
  }>;

  return (
    <div className="min-h-screen bg-brand-twilight text-brand-sandstone p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <h1 className="text-xl font-extrabold text-brand-sandstone flex items-center gap-2">
          <Users className="w-6 h-6 text-brand-caribbeanSea" /> Communities Directory
          <span className="text-sm font-normal text-brand-sandstone/40 ml-2">{(count ?? 0).toLocaleString()} total</span>
        </h1>
        <Link href="/" className="text-xs text-brand-sandstone/60 hover:text-brand-sandstone">← Dashboard</Link>
      </div>

      <div className="bg-brand-dusk/70 border border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full text-sm text-slate-300">
          <thead className="bg-brand-twilight text-[11px] text-brand-sandstone/60 uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="p-3 text-left">Community</th>
              <th className="p-3 text-left">Slug</th>
              <th className="p-3 text-left">Country</th>
              <th className="p-3 text-left">Join Policy</th>
              <th className="p-3 text-left">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs">
            {communities.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-brand-sandstone/40">No communities registered.</td>
              </tr>
            ) : (
              communities.map((c) => (
                <tr key={c.id} className="hover:bg-brand-dusk/30 transition-colors">
                  <td className="p-3">
                    <p className="font-bold text-brand-sandstone">{c.name}</p>
                    {c.description && <p className="text-[11px] text-brand-sandstone/40 truncate max-w-xs">{c.description}</p>}
                  </td>
                  <td className="p-3 font-mono text-brand-sandstone/60">/{c.slug}</td>
                  <td className="p-3 uppercase font-semibold text-brand-caribbeanSea">{c.country_iso || 'Global'}</td>
                  <td className="p-3 capitalize">{c.join_policy}</td>
                  <td className="p-3 text-brand-sandstone/40">{new Date(c.created_at).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
