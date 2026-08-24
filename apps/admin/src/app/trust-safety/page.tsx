import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ShieldCheck, AlertTriangle, Eye, Flag } from 'lucide-react';
import { createAdminSupabaseClient, getAdminSession } from '../../lib/supabase/server';

export const dynamic = 'force-dynamic';

interface ModerationCase {
  id: string;
  target_type: string;
  priority: string;
  status: string;
  ai_recommendation: string | null;
  created_at: string;
}

export default async function AdminTrustSafetyPage({
  searchParams,
}: {
  searchParams: Promise<{ priority?: string; page?: string }>;
}) {
  const adminUser = await getAdminSession();
  if (!adminUser) redirect('/login');

  const supabase = await createAdminSupabaseClient();
  if (!supabase) redirect('/login');

  const params = await searchParams;
  const priority = params.priority ?? 'all';
  const page = Math.max(1, parseInt(params.page ?? '1', 10));
  const pageSize = 50;
  const from = (page - 1) * pageSize;

  let query = supabase
    .from('moderation_cases')
    .select('id, target_type, priority, status, ai_recommendation, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + pageSize - 1);

  if (priority !== 'all') {
    query = query.eq('priority', priority);
  }

  const [casesResult, queuedResult, decidedResult, escalatedResult] = await Promise.all([
    query,
    supabase.from('moderation_cases').select('id', { count: 'exact', head: true }).eq('status', 'queued'),
    supabase.from('moderation_cases').select('id', { count: 'exact', head: true }).eq('status', 'decided'),
    supabase.from('moderation_cases').select('id', { count: 'exact', head: true }).eq('status', 'escalated'),
  ]);

  const cases = (casesResult.data ?? []) as ModerationCase[];
  const totalPages = Math.ceil((casesResult.count ?? 0) / pageSize);

  const PRIORITY_TABS = ['all', 'critical', 'high', 'medium', 'low'];
  const PRIORITY_COLORS: Record<string, string> = {
    critical: 'text-rose-400',
    high: 'text-brand-goldenHour',
    medium: 'text-brand-caribbeanSea',
    low: 'text-brand-sandstone/60',
  };

  return (
    <div className="min-h-screen bg-[#090D16] text-brand-sandstone p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <h1 className="text-xl font-extrabold text-brand-sandstone flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-brand-caribbeanSea" /> Trust &amp; Safety
        </h1>
        <Link href="/" className="text-xs text-brand-sandstone/60 hover:text-brand-sandstone">← Dashboard</Link>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Queued', value: queuedResult.count ?? 0, color: 'text-brand-goldenHour' },
          { label: 'Decided', value: decidedResult.count ?? 0, color: 'text-brand-sunriseCoral' },
          { label: 'Escalated', value: escalatedResult.count ?? 0, color: 'text-rose-400' },
          { label: 'Total Cases', value: casesResult.count ?? 0, color: 'text-brand-caribbeanSea' },
        ].map((stat) => (
          <div key={stat.label} className="bg-brand-dusk/70 border border-slate-800 rounded-2xl p-4">
            <p className="text-[11px] text-brand-sandstone/60 uppercase font-semibold">{stat.label}</p>
            <p className={`text-2xl font-extrabold mt-1 ${stat.color}`}>{stat.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Priority tabs */}
      <div className="flex flex-wrap gap-2">
        {PRIORITY_TABS.map((p) => (
          <a
            key={p}
            href={`?priority=${p}`}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors ${
              p === priority
                ? 'bg-brand-caribbeanSea/20 text-brand-caribbeanSea border border-brand-caribbeanSea/40'
                : 'bg-brand-dusk text-brand-sandstone/60 hover:text-brand-sandstone border border-slate-800'
            }`}
          >
            {p}
          </a>
        ))}
      </div>

      <div className="bg-brand-dusk/70 border border-slate-800 rounded-2xl overflow-x-auto">
        <table className="w-full text-sm text-slate-300">
          <thead className="bg-brand-twilight text-[11px] text-brand-sandstone/60 uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="p-3 text-left">Case ID</th>
              <th className="p-3 text-left">Type</th>
              <th className="p-3 text-left">Priority</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">AI Rec.</th>
              <th className="p-3 text-left">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {cases.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-brand-sandstone/40 text-xs">No cases found.</td>
              </tr>
            ) : (
              cases.map((c) => (
                <tr key={c.id} className="hover:bg-brand-dusk/30 transition-colors">
                  <td className="p-3 font-mono text-[11px] text-brand-sandstone/40">{c.id.slice(0, 8)}…</td>
                  <td className="p-3 capitalize">{c.target_type}</td>
                  <td className={`p-3 capitalize font-semibold ${PRIORITY_COLORS[c.priority] ?? 'text-brand-sandstone/60'}`}>
                    {c.priority}
                  </td>
                  <td className="p-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border capitalize ${
                      c.status === 'queued' ? 'bg-brand-goldenHour/20 text-amber-300 border-brand-goldenHour/30' :
                      c.status === 'decided' ? 'bg-brand-sunriseCoral/20 text-emerald-300 border-brand-sunriseCoral/30' :
                      c.status === 'escalated' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' :
                      'bg-brand-dusk text-brand-sandstone/60 border-slate-700'
                    }`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="p-3 capitalize text-brand-sandstone/60">{c.ai_recommendation ?? '—'}</td>
                  <td className="p-3 text-brand-sandstone/40 text-xs">{new Date(c.created_at).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 text-xs">
          {page > 1 && (
            <a href={`?priority=${priority}&page=${page - 1}`} className="px-3 py-1.5 bg-brand-dusk hover:bg-slate-700 text-slate-200 rounded-lg">← Prev</a>
          )}
          <span className="text-brand-sandstone/60">Page {page} of {totalPages}</span>
          {page < totalPages && (
            <a href={`?priority=${priority}&page=${page + 1}`} className="px-3 py-1.5 bg-brand-dusk hover:bg-slate-700 text-slate-200 rounded-lg">Next →</a>
          )}
        </div>
      )}
    </div>
  );
}
