import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Users, Search, BadgeCheck, ShieldAlert } from 'lucide-react';
import { createAdminSupabaseClient, getAdminSession } from '../../lib/supabase/server';

export const dynamic = 'force-dynamic';

interface Profile {
  id: string;
  username: string;
  display_name: string;
  is_verified: boolean;
  created_at: string;
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const adminUser = await getAdminSession();
  if (!adminUser) redirect('/login');

  const supabase = await createAdminSupabaseClient();
  if (!supabase) redirect('/login');

  const params = await searchParams;
  const query = params.q?.trim() ?? '';
  const page = Math.max(1, parseInt(params.page ?? '1', 10));
  const pageSize = 50;
  const from = (page - 1) * pageSize;

  let dbQuery = supabase
    .from('profiles')
    .select('id, username, display_name, is_verified, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + pageSize - 1);

  if (query) {
    dbQuery = dbQuery.or(`username.ilike.%${query}%,display_name.ilike.%${query}%`);
  }

  const { data, count } = await dbQuery;
  const profiles = (data ?? []) as Profile[];
  const totalPages = Math.ceil((count ?? 0) / pageSize);

  return (
    <div className="min-h-screen bg-brand-twilight text-brand-sandstone p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <h1 className="text-xl font-extrabold text-brand-sandstone flex items-center gap-2">
          <Users className="w-6 h-6 text-brand-caribbeanSea" /> Users
          <span className="text-sm font-normal text-brand-sandstone/40 ml-2">{(count ?? 0).toLocaleString()} total</span>
        </h1>
        <Link href="/" className="text-xs text-brand-sandstone/60 hover:text-brand-sandstone">← Dashboard</Link>
      </div>

      <form method="GET" className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-sandstone/60" />
          <input
            name="q"
            defaultValue={query}
            placeholder="Search username or display name…"
            className="w-full bg-brand-dusk border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-sm text-brand-sandstone focus:outline-none focus:border-brand-caribbeanSea transition-colors"
          />
        </div>
        <button type="submit" className="bg-brand-caribbeanSea hover:bg-brand-caribbeanSea text-slate-950 font-bold px-4 py-2 rounded-xl text-xs">
          Search
        </button>
      </form>

      <div className="bg-brand-dusk/70 border border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full text-sm text-slate-300">
          <thead className="bg-brand-twilight text-[11px] text-brand-sandstone/60 uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="p-3 text-left">User</th>
              <th className="p-3 text-left">Username</th>
              <th className="p-3 text-left">Verified</th>
              <th className="p-3 text-left">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {profiles.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-brand-sandstone/40 text-xs">No users found.</td>
              </tr>
            ) : (
              profiles.map((profile) => (
                <tr key={profile.id} className="hover:bg-brand-dusk/30 transition-colors">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-sky-950 border border-sky-800 text-brand-caribbeanSea font-bold flex items-center justify-center text-xs flex-shrink-0">
                        {profile.display_name.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="font-semibold text-brand-sandstone truncate">{profile.display_name}</span>
                    </div>
                  </td>
                  <td className="p-3 text-brand-sandstone/60">@{profile.username}</td>
                  <td className="p-3">
                    {profile.is_verified ? (
                      <span className="flex items-center gap-1 text-brand-caribbeanSea text-xs font-semibold">
                        <BadgeCheck className="w-3.5 h-3.5" /> Verified
                      </span>
                    ) : (
                      <span className="text-slate-600 text-xs">—</span>
                    )}
                  </td>
                  <td className="p-3 text-brand-sandstone/40 text-xs">
                    {new Date(profile.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 text-xs">
          {page > 1 && (
            <Link href={`?q=${query}&page=${page - 1}`} className="px-3 py-1.5 bg-brand-dusk hover:bg-slate-700 text-slate-200 rounded-lg transition-colors">
              ← Prev
            </Link>
          )}
          <span className="text-brand-sandstone/60">Page {page} of {totalPages}</span>
          {page < totalPages && (
            <Link href={`?q=${query}&page=${page + 1}`} className="px-3 py-1.5 bg-brand-dusk hover:bg-slate-700 text-slate-200 rounded-lg transition-colors">
              Next →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
