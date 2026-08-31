import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Flag, ArrowLeft } from 'lucide-react';
import { createServiceSupabaseClient, getAuthorizedUser } from '../../../lib/supabase/server';
import AccessDenied from '../../../components/access-denied';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 50;

const PRIORITY_COLORS: Record<string, { text: string; bg: string }> = {
  critical: { text: 'text-rose-400', bg: 'bg-rose-500/10' },
  high: { text: 'text-brand-goldenHour', bg: 'bg-brand-goldenHour/10' },
  medium: { text: 'text-brand-caribbeanSea', bg: 'bg-brand-caribbeanSea/10' },
  low: { text: 'text-brand-sandstone/60', bg: 'bg-slate-700/30' },
};

const VALID_STATUSES = ['queued', 'decided', 'escalated', 'assigned', 'appealed'] as const;

interface CaseRow {
  id: string;
  target_type: string;
  priority: string;
  status: string;
  ai_recommendation: string | null;
  created_at: string;
}

export default async function WebModerationCasesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const auth = await getAuthorizedUser(['moderator', 'admin', 'management', 'superadmin']);
  if (!auth.isLoggedIn) {
    redirect('/login?next=/moderation/cases');
  }
  if (!auth.isAuthorized) {
    return (
      <AccessDenied
        user={auth.user}
        requiredRole="moderator"
        currentRole={auth.role}
        resourceName="the Moderation Cases Directory"
      />
    );
  }

  const supabase = await createServiceSupabaseClient();
  if (!supabase) {
    return (
      <div className="min-h-screen bg-transparent text-brand-sandstone flex items-center justify-center p-4">
        <p className="text-sm text-brand-sandstone/60">Service temporarily unavailable. Please try again.</p>
      </div>
    );
  }

  const params = await searchParams;
  const statusFilter = params.status ?? 'all';
  const currentPage = Math.max(1, parseInt(params.page ?? '1', 10) || 1);
  const offset = (currentPage - 1) * PAGE_SIZE;

  let query = supabase
    .from('moderation_cases')
    .select('id, target_type, priority, status, ai_recommendation, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (statusFilter !== 'all' && VALID_STATUSES.includes(statusFilter as typeof VALID_STATUSES[number])) {
    query = query.eq('status', statusFilter);
  }

  const { data, count } = await query;
  const cases = (data ?? []) as CaseRow[];
  const totalCount = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div className="min-h-screen bg-transparent text-brand-sandstone">
      <header className="sticky top-0 z-50 bg-[#0F172A]/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center gap-4">
        <Link href="/moderation" className="flex items-center gap-2 text-slate-300 hover:text-brand-sandstone text-sm font-semibold">
          <ArrowLeft className="w-4 h-4" /> Queue
        </Link>
        <h1 className="text-lg font-extrabold text-brand-sandstone flex items-center gap-2">
          <Flag className="w-5 h-5 text-brand-caribbeanSea" /> All Moderation Cases
        </h1>
        <div className="hidden sm:flex items-center gap-2 ml-4">
          <Link href="/moderation" className="text-brand-sandstone/60 hover:text-brand-sandstone px-3 py-1 rounded-lg text-xs font-semibold">Queue</Link>
          <Link href="/moderation/cases" className="bg-brand-dusk text-brand-sandstone px-3 py-1 rounded-lg text-xs font-semibold">Cases</Link>
          <Link href="/moderation/appeals" className="text-brand-sandstone/60 hover:text-brand-sandstone px-3 py-1 rounded-lg text-xs font-semibold">Appeals</Link>
          <Link href="/moderation/analytics" className="text-brand-sandstone/60 hover:text-brand-sandstone px-3 py-1 rounded-lg text-xs font-semibold">Analytics</Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 space-y-6">
        <nav aria-label="Filter by status" className="flex flex-wrap gap-2">
          {['all', ...VALID_STATUSES].map((s) => {
            const isActive = statusFilter === s;
            return (
              <Link
                key={s}
                href={`/moderation/cases${s === 'all' ? '' : `?status=${s}`}`}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors ${
                  isActive
                    ? 'bg-sky-600 text-brand-sandstone'
                    : 'bg-brand-dusk text-brand-sandstone/60 border border-slate-800 hover:bg-brand-dusk hover:text-brand-sandstone'
                }`}
              >
                {s}
              </Link>
            );
          })}
        </nav>

        <div className="bg-brand-dusk/70 border border-slate-800 rounded-2xl overflow-hidden">
          <table className="w-full text-sm text-slate-300">
            <thead className="bg-brand-twilight text-[11px] text-brand-sandstone/60 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-3 text-left">Case ID</th>
                <th className="p-3 text-left">Target Type</th>
                <th className="p-3 text-left">Priority</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">AI Rec.</th>
                <th className="p-3 text-left">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {cases.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-brand-sandstone/40">No cases found.</td>
                </tr>
              ) : (
                cases.map((c) => {
                  const prioColors = PRIORITY_COLORS[c.priority] ?? PRIORITY_COLORS.low;
                  return (
                    <tr key={c.id} className="hover:bg-brand-dusk/30 transition-colors">
                      <td className="p-3 font-mono text-[11px] text-brand-sandstone/40">{c.id.slice(0, 12)}…</td>
                      <td className="p-3 capitalize">{c.target_type}</td>
                      <td className="p-3">
                        <span className={`inline-block text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${prioColors.bg} ${prioColors.text}`}>
                          {c.priority}
                        </span>
                      </td>
                      <td className="p-3 capitalize font-semibold">{c.status}</td>
                      <td className="p-3 capitalize text-amber-300 font-semibold">{c.ai_recommendation ?? 'none'}</td>
                      <td className="p-3 text-brand-sandstone/40">{new Date(c.created_at).toLocaleString()}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
