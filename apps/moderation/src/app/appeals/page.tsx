import React from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Eye, ShieldAlert, Flag, BarChart3, Inbox } from 'lucide-react';
import { createModerationSupabaseClient, getModeratorSession } from '../../lib/supabase/server';

import ModAppealPanel from '../../components/mod-appeal-panel';

export const dynamic = 'force-dynamic';

const PRIORITY_COLORS: Record<string, { text: string; bg: string }> = {
  critical: { text: 'text-rose-400', bg: 'bg-rose-500/10' },
  high: { text: 'text-brand-goldenHour', bg: 'bg-brand-goldenHour/10' },
  medium: { text: 'text-brand-caribbeanSea', bg: 'bg-brand-caribbeanSea/10' },
  low: { text: 'text-brand-sandstone/60', bg: 'bg-slate-700/30' },
};

interface AppealCase {
  id: string;
  target_type: string;
  target_id: string;
  priority: string;
  status: string;
  ai_recommendation: string | null;
  created_at: string;
  updated_at: string | null;
  decided_action: string | null;
  decided_by: string | null;
  decision_rationale: string | null;
}

export default async function AppealsPage() {
  const moderator = await getModeratorSession();
  if (!moderator) redirect('/login');

  const supabase = await createModerationSupabaseClient();
  if (!supabase) redirect('/login');

  const { data, error } = await supabase
    .from('moderation_cases')
    .select(
      'id, target_type, target_id, priority, status, ai_recommendation, created_at, updated_at, decided_action, decided_by, decision_rationale',
    )
    .eq('status', 'appealed')
    .order('created_at', { ascending: false })
    .limit(100);

  const appeals = (data ?? []) as AppealCase[];

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
          <h1 className="text-sm font-extrabold text-brand-sandstone tracking-wider">TUKUBI</h1>
          <p className="text-[11px] text-amber-300 font-semibold mt-0.5">Moderation Center</p>
        </div>
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-brand-sandstone/60 hover:bg-brand-dusk/60 hover:text-brand-sandstone transition-colors"
        >
          <ShieldAlert className="w-4 h-4 flex-shrink-0" />
          Queue
        </Link>
        <Link
          href="/cases"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-brand-sandstone/60 hover:bg-brand-dusk/60 hover:text-brand-sandstone transition-colors"
        >
          <Flag className="w-4 h-4 flex-shrink-0" />
          All Cases
        </Link>
        <Link
          href="/analytics"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-brand-sandstone/60 hover:bg-brand-dusk/60 hover:text-brand-sandstone transition-colors"
        >
          <BarChart3 className="w-4 h-4 flex-shrink-0" />
          Analytics
        </Link>
        <span
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium bg-brand-dusk/60 text-brand-sandstone"
          aria-current="page"
        >
          <Eye className="w-4 h-4 flex-shrink-0" />
          Appeals
        </span>
        <div className="mt-auto pt-4 border-t border-slate-800">
          <p className="text-[10px] text-slate-600 px-2">Moderator</p>
          <p className="text-[11px] text-brand-sandstone/60 px-2 truncate">{moderator.displayName}</p>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="sticky top-0 z-40 bg-[#0F172A]/95 backdrop-blur border-b border-slate-800 px-6 py-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-brand-sandstone flex items-center gap-2">
            <Eye className="w-5 h-5 text-violet-400" aria-hidden="true" />
            Appeals
          </h2>
          <span className="text-[11px] text-brand-sandstone/60">
            {appeals.length} pending
          </span>
        </header>

        <main className="p-6 space-y-6 flex-1">
          {error && (
            <div role="alert" className="bg-rose-500/10 border border-rose-500/30 rounded-xl px-4 py-3 text-xs text-rose-400">
              Failed to load appeals. Please try again.
            </div>
          )}

          {!error && appeals.length === 0 ? (
            <div className="py-20 text-center">
              <Inbox className="w-12 h-12 text-slate-700 mx-auto mb-4" aria-hidden="true" />
              <p className="text-sm font-semibold text-brand-sandstone/40">No appeals pending review.</p>
              <p className="text-xs text-slate-600 mt-1">
                Appealed cases will appear here when users contest moderation decisions.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {appeals.map((appeal) => {
                const prioColors = PRIORITY_COLORS[appeal.priority] ?? PRIORITY_COLORS.low;
                return (
                  <article
                    key={appeal.id}
                    className="bg-brand-dusk/70 border border-slate-800 rounded-2xl p-5 space-y-4"
                  >
                    {/* Appeal header */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <p className="text-xs text-brand-sandstone/60">Case ID</p>
                          <code className="text-sm font-mono text-slate-200">
                            {appeal.id.slice(0, 16)}...
                          </code>
                        </div>
                        <p className="text-xs text-brand-sandstone/40">
                          Filed {formatDate(appeal.created_at)}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-bold uppercase px-3 py-1 rounded-full ${prioColors.bg} ${prioColors.text}`}
                      >
                        {appeal.priority}
                      </span>
                    </div>

                    {/* Appeal detail grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div className="bg-brand-twilight rounded-xl p-3 border border-slate-800">
                        <p className="text-brand-sandstone/60">Content Type</p>
                        <p className="text-brand-sandstone font-semibold capitalize mt-0.5">
                          {appeal.target_type}
                        </p>
                      </div>
                      <div className="bg-brand-twilight rounded-xl p-3 border border-slate-800">
                        <p className="text-brand-sandstone/60">Original Decision</p>
                        <p className="text-amber-300 font-semibold uppercase mt-0.5">
                          {appeal.decided_action ?? 'unknown'}
                        </p>
                      </div>
                      <div className="bg-brand-twilight rounded-xl p-3 border border-slate-800">
                        <p className="text-brand-sandstone/60">AI Recommendation</p>
                        <p
                          className={`font-semibold uppercase mt-0.5 ${
                            appeal.ai_recommendation ? 'text-brand-caribbeanSea' : 'text-slate-600'
                          }`}
                        >
                          {appeal.ai_recommendation ?? 'none'}
                        </p>
                      </div>
                      <div className="bg-brand-twilight rounded-xl p-3 border border-slate-800">
                        <p className="text-brand-sandstone/60">Status</p>
                        <p className="text-violet-400 font-semibold capitalize mt-0.5">
                          {appeal.status}
                        </p>
                      </div>
                    </div>

                    {/* Decision rationale if available */}
                    {appeal.decision_rationale && (
                      <div className="bg-brand-twilight border border-slate-800 rounded-xl p-4">
                        <p className="text-[11px] text-brand-sandstone/60 mb-1 font-semibold">
                          Original Decision Rationale
                        </p>
                        <p className="text-sm text-slate-300 leading-relaxed">
                          {appeal.decision_rationale}
                        </p>
                      </div>
                    )}

                    {/* Interactive resolution panel */}
                    <ModAppealPanel caseId={appeal.id} />

                    {/* Target reference */}
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/60">
                      <span className="text-brand-sandstone/40">
                        Target: <code className="font-mono text-brand-sandstone/60">{appeal.target_id.slice(0, 12)}...</code>
                      </span>
                      {appeal.updated_at && (
                        <span className="text-slate-600">
                          Last updated {formatDate(appeal.updated_at)}
                        </span>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
