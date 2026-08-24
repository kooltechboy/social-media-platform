import React from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Flag, ShieldAlert, ChevronLeft, ChevronRight } from 'lucide-react';
import { createModerationSupabaseClient, getModeratorSession } from '../../lib/supabase/server';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 50;

const PRIORITY_COLORS: Record<string, { text: string; bg: string }> = {
  critical: { text: 'text-rose-400', bg: 'bg-rose-500/10' },
  high: { text: 'text-brand-goldenHour', bg: 'bg-brand-goldenHour/10' },
  medium: { text: 'text-brand-caribbeanSea', bg: 'bg-brand-caribbeanSea/10' },
  low: { text: 'text-brand-sandstone/60', bg: 'bg-slate-700/30' },
};

const STATUS_COLORS: Record<string, string> = {
  queued: 'text-amber-300',
  assigned: 'text-brand-caribbeanSea',
  decided: 'text-brand-sunriseCoral',
  escalated: 'text-rose-400',
  appealed: 'text-violet-400',
};

const VALID_STATUSES = ['queued', 'decided', 'escalated', 'assigned', 'appealed'] as const;

interface CasesSearchParams {
  status?: string;
  page?: string;
}

interface CaseRow {
  id: string;
  target_type: string;
  priority: string;
  status: string;
  ai_recommendation: string | null;
  created_at: string;
}

export default async function AllCasesPage({
  searchParams,
}: {
  searchParams: Promise<CasesSearchParams>;
}) {
  const moderator = await getModeratorSession();
  if (!moderator) redirect('/login');

  const supabase = await createModerationSupabaseClient();
  if (!supabase) redirect('/login');

  const params = await searchParams;
  const statusFilter = params.status ?? 'all';
  const currentPage = Math.max(1, parseInt(params.page ?? '1', 10) || 1);
  const offset = (currentPage - 1) * PAGE_SIZE;

  let query = supabase
    .from('moderation_cases')
    .select('id, target_type, priority, status, ai_recommendation, created_at', {
      count: 'exact',
    })
    .order('created_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (statusFilter !== 'all' && VALID_STATUSES.includes(statusFilter as typeof VALID_STATUSES[number])) {
    query = query.eq('status', statusFilter);
  }

  const { data, count, error } = await query;
  const cases = (data ?? []) as CaseRow[];
  const totalCount = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  function formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }

  return (
    <div className="min-h-screen bg-[#090D16] text-brand-sandstone flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-56 bg-[#0F172A] border-r border-slate-800 p-4 space-y-1 sticky top-0 min-h-screen">
        <div className="px-2 py-4 mb-2">
          <h1 className="text-sm font-extrabold text-brand-sandstone">ANTILIA</h1>
          <p className="text-[11px] text-amber-300 font-semibold mt-0.5">Moderation Center</p>
        </div>
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-brand-sandstone/60 hover:bg-brand-dusk/60 hover:text-brand-sandstone transition-colors"
        >
          <ShieldAlert className="w-4 h-4 flex-shrink-0" />
          Queue
        </Link>
        <span
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium bg-brand-dusk/60 text-brand-sandstone"
          aria-current="page"
        >
          <Flag className="w-4 h-4 flex-shrink-0" />
          All Cases
        </span>
        <div className="mt-auto pt-4 border-t border-slate-800">
          <p className="text-[10px] text-slate-600 px-2">Moderator</p>
          <p className="text-[11px] text-brand-sandstone/60 px-2 truncate">{moderator.displayName}</p>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="sticky top-0 z-40 bg-[#0F172A]/95 backdrop-blur border-b border-slate-800 px-6 py-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-brand-sandstone flex items-center gap-2">
            <Flag className="w-5 h-5 text-brand-caribbeanSea" aria-hidden="true" />
            All Cases
          </h2>
          <span className="text-[11px] text-brand-sandstone/60">
            {totalCount} total {statusFilter !== 'all' ? `(${statusFilter})` : ''}
          </span>
        </header>

        <main className="p-6 space-y-6 flex-1">
          {/* Status filter tabs */}
          <nav aria-label="Filter by status" className="flex flex-wrap gap-2">
            {['all', ...VALID_STATUSES].map((s) => {
              const isActive = statusFilter === s;
              return (
                <Link
                  key={s}
                  href={`/cases${s === 'all' ? '' : `?status=${s}`}`}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors focus:outline-none focus:ring-2 focus:ring-brand-caribbeanSea ${
                    isActive
                      ? 'bg-sky-600 text-brand-sandstone'
                      : 'bg-brand-dusk text-brand-sandstone/60 border border-slate-800 hover:bg-brand-dusk hover:text-brand-sandstone'
                  }`}
                  aria-current={isActive ? 'true' : undefined}
                >
                  {s}
                </Link>
              );
            })}
          </nav>

          {error && (
            <div role="alert" className="bg-rose-500/10 border border-rose-500/30 rounded-xl px-4 py-3 text-xs text-rose-400">
              Failed to load cases. Please try again.
            </div>
          )}

          {!error && cases.length === 0 ? (
            <div className="py-16 text-center">
              <Flag className="w-10 h-10 text-slate-700 mx-auto mb-3" aria-hidden="true" />
              <p className="text-sm font-semibold text-brand-sandstone/40">No cases found.</p>
              <p className="text-xs text-slate-600 mt-1">
                {statusFilter !== 'all'
                  ? `No cases with status "${statusFilter}".`
                  : 'The moderation queue is empty.'}
              </p>
            </div>
          ) : (
            <>
              {/* Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-800">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-brand-dusk/80 border-b border-slate-800">
                      <th scope="col" className="text-left px-4 py-3 text-[11px] font-bold text-brand-sandstone/60 uppercase tracking-wider">
                        Case ID
                      </th>
                      <th scope="col" className="text-left px-4 py-3 text-[11px] font-bold text-brand-sandstone/60 uppercase tracking-wider">
                        Target Type
                      </th>
                      <th scope="col" className="text-left px-4 py-3 text-[11px] font-bold text-brand-sandstone/60 uppercase tracking-wider">
                        Priority
                      </th>
                      <th scope="col" className="text-left px-4 py-3 text-[11px] font-bold text-brand-sandstone/60 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="text-left px-4 py-3 text-[11px] font-bold text-brand-sandstone/60 uppercase tracking-wider">
                        AI Recommendation
                      </th>
                      <th scope="col" className="text-left px-4 py-3 text-[11px] font-bold text-brand-sandstone/60 uppercase tracking-wider">
                        Created At
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {cases.map((c) => {
                      const prioColors = PRIORITY_COLORS[c.priority] ?? PRIORITY_COLORS.low;
                      const statusColor = STATUS_COLORS[c.status] ?? 'text-brand-sandstone/60';
                      return (
                        <tr
                          key={c.id}
                          className="hover:bg-brand-dusk/50 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <code className="text-xs font-mono text-slate-300">
                              {c.id.slice(0, 12)}...
                            </code>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-300 capitalize">
                            {c.target_type}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-block text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${prioColors.bg} ${prioColors.text}`}
                            >
                              {c.priority}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-semibold capitalize ${statusColor}`}>
                              {c.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`text-xs font-semibold uppercase ${
                                c.ai_recommendation ? 'text-amber-300' : 'text-slate-600'
                              }`}
                            >
                              {c.ai_recommendation ?? 'none'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-brand-sandstone/40">
                            {formatDate(c.created_at)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <nav aria-label="Pagination" className="flex items-center justify-between pt-2">
                  <p className="text-xs text-brand-sandstone/40">
                    Page {currentPage} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    {currentPage > 1 ? (
                      <Link
                        href={`/cases?${new URLSearchParams({
                          ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
                          page: String(currentPage - 1),
                        }).toString()}`}
                        className="flex items-center gap-1 px-3 py-1.5 bg-brand-dusk border border-slate-800 rounded-lg text-xs text-slate-300 hover:bg-brand-dusk transition-colors focus:outline-none focus:ring-2 focus:ring-brand-caribbeanSea"
                      >
                        <ChevronLeft className="w-3 h-3" aria-hidden="true" />
                        Previous
                      </Link>
                    ) : (
                      <span className="flex items-center gap-1 px-3 py-1.5 bg-brand-twilight border border-brand-dusk rounded-lg text-xs text-slate-700 cursor-not-allowed">
                        <ChevronLeft className="w-3 h-3" aria-hidden="true" />
                        Previous
                      </span>
                    )}
                    {currentPage < totalPages ? (
                      <Link
                        href={`/cases?${new URLSearchParams({
                          ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
                          page: String(currentPage + 1),
                        }).toString()}`}
                        className="flex items-center gap-1 px-3 py-1.5 bg-brand-dusk border border-slate-800 rounded-lg text-xs text-slate-300 hover:bg-brand-dusk transition-colors focus:outline-none focus:ring-2 focus:ring-brand-caribbeanSea"
                      >
                        Next
                        <ChevronRight className="w-3 h-3" aria-hidden="true" />
                      </Link>
                    ) : (
                      <span className="flex items-center gap-1 px-3 py-1.5 bg-brand-twilight border border-brand-dusk rounded-lg text-xs text-slate-700 cursor-not-allowed">
                        Next
                        <ChevronRight className="w-3 h-3" aria-hidden="true" />
                      </span>
                    )}
                  </div>
                </nav>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
