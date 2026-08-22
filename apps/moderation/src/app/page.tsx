import React from 'react';
import { redirect } from 'next/navigation';
import {
  ShieldAlert, Eye, EyeOff, Flag, CheckCircle,
  AlertTriangle, Clock, ChevronRight, BarChart3
} from 'lucide-react';
import { createModerationSupabaseClient, getModeratorSession } from '../lib/supabase/server';
import ModActionPanel from '../components/mod-action-panel';

export const dynamic = 'force-dynamic';

interface ModerationCase {
  id: string;
  target_type: string;
  target_id: string;
  signals: Record<string, number>;
  ai_recommendation: 'remove' | 'restrict' | 'allow' | 'escalate' | null;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: string;
  created_at: string;
  reports: { reason: string; details: string | null } | null;
}

const PRIORITY_COLORS: Record<string, { text: string; border: string; bg: string }> = {
  critical: { text: 'text-rose-400', border: 'border-rose-500/40', bg: 'bg-rose-500/10' },
  high: { text: 'text-amber-400', border: 'border-amber-500/40', bg: 'bg-amber-500/10' },
  medium: { text: 'text-sky-400', border: 'border-sky-500/40', bg: 'bg-sky-500/10' },
  low: { text: 'text-slate-300', border: 'border-slate-600/40', bg: 'bg-slate-800/40' },
};

export default async function ModerationDashboard() {
  const moderator = await getModeratorSession();
  if (!moderator) redirect('/login');

  const supabase = await createModerationSupabaseClient();
  if (!supabase) redirect('/login');

  const [
    queuedResult,
    currentCaseResult,
    recentResult,
    decidedTodayResult,
  ] = await Promise.all([
    supabase
      .from('moderation_cases')
      .select('priority', { count: 'exact' })
      .eq('status', 'queued'),
    supabase
      .from('moderation_cases')
      .select('id, target_type, target_id, signals, ai_recommendation, priority, status, created_at, reports(reason, details)')
      .in('status', ['queued', 'assigned'])
      .order('priority', { ascending: true })
      .order('created_at', { ascending: true })
      .limit(1),
    supabase
      .from('moderation_cases')
      .select('id, target_type, priority, status, created_at')
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('moderation_cases')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'decided')
      .gte('created_at', new Date(Date.now() - 86400000).toISOString()),
  ]);

  const allQueued = (queuedResult.data ?? []) as Array<{ priority: string }>;
  const queueCounts = ['critical', 'high', 'medium', 'low'].map((p) => ({
    priority: p,
    count: allQueued.filter((c) => c.priority === p).length,
  }));

  const currentCase = ((currentCaseResult.data ?? []) as unknown as ModerationCase[])[0] ?? null;
  const recentCases = (recentResult.data ?? []) as Array<{
    id: string;
    target_type: string;
    priority: string;
    status: string;
    created_at: string;
  }>;
  const decidedToday = decidedTodayResult.count ?? 0;

  function relativeTime(iso: string): string {
    const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    return `${Math.floor(m / 60)}h ago`;
  }

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-56 bg-[#0F172A] border-r border-slate-800 p-4 space-y-1 sticky top-0 min-h-screen">
        <div className="px-2 py-4 mb-2">
          <h1 className="text-sm font-extrabold text-white">CARIBBEAN ONE</h1>
          <p className="text-[11px] text-amber-300 font-semibold mt-0.5">Moderation Center</p>
        </div>
        {[
          { label: 'Queue', href: '/', icon: ShieldAlert },
          { label: 'All Cases', href: '/cases', icon: Flag },
          { label: 'Analytics', href: '/analytics', icon: BarChart3 },
          { label: 'Appeals', href: '/appeals', icon: Eye },
        ].map((item) => (
          <a
            key={item.label}
            href={item.href}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-slate-800/60 hover:text-white transition-colors"
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            {item.label}
          </a>
        ))}
        <div className="mt-auto pt-4 border-t border-slate-800">
          <p className="text-[10px] text-slate-600 px-2">Moderator</p>
          <p className="text-[11px] text-slate-400 px-2 truncate">{moderator.displayName}</p>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="sticky top-0 z-40 bg-[#0F172A]/95 backdrop-blur border-b border-slate-800 px-6 py-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" /> Moderation Queue
          </h2>
          <span className="text-[11px] text-slate-400">Human-in-the-loop · every action is logged</span>
        </header>

        <main className="p-6 space-y-6 flex-1">
          {/* Queue summary */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {queueCounts.map((q) => {
              const colors = PRIORITY_COLORS[q.priority];
              return (
                <div key={q.priority} className={`${colors.bg} border ${colors.border} rounded-2xl p-4`}>
                  <p className={`text-2xl font-extrabold ${colors.text}`}>{q.count}</p>
                  <p className="text-xs font-semibold text-slate-300 capitalize mt-1">{q.priority}</p>
                </div>
              );
            })}
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4">
              <p className="text-2xl font-extrabold text-emerald-400">{decidedToday}</p>
              <p className="text-xs font-semibold text-slate-300 mt-1">Decided today</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Active case panel */}
            <div className="lg:col-span-2 bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-5">
              <h3 className="text-sm font-bold text-white">Active Case</h3>

              {!currentCase ? (
                <div className="py-12 text-center">
                  <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-emerald-400">Queue is clear.</p>
                  <p className="text-xs text-slate-500 mt-1">No cases awaiting review.</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-400">Case ID</p>
                      <code className="text-sm font-mono text-slate-200">{currentCase.id.slice(0, 16)}…</code>
                    </div>
                    <span className={`text-[10px] font-bold px-3 py-1 rounded-full border uppercase ${
                      PRIORITY_COLORS[currentCase.priority].bg
                    } ${PRIORITY_COLORS[currentCase.priority].text} ${PRIORITY_COLORS[currentCase.priority].border}`}>
                      {currentCase.priority} priority
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-950 rounded-xl p-3 border border-slate-800">
                      <p className="text-slate-400">Content type</p>
                      <p className="text-white font-semibold capitalize mt-0.5">{currentCase.target_type}</p>
                    </div>
                    <div className="bg-slate-950 rounded-xl p-3 border border-slate-800">
                      <p className="text-slate-400">Report reason</p>
                      <p className="text-white font-semibold capitalize mt-0.5">
                        {currentCase.reports?.reason ?? 'No report'}
                      </p>
                    </div>
                    <div className="bg-slate-950 rounded-xl p-3 border border-slate-800">
                      <p className="text-slate-400">Status</p>
                      <p className="text-white font-semibold capitalize mt-0.5">{currentCase.status}</p>
                    </div>
                    <div className="bg-slate-950 rounded-xl p-3 border border-slate-800">
                      <p className="text-slate-400">AI recommendation</p>
                      <p className={`font-semibold uppercase mt-0.5 ${currentCase.ai_recommendation ? 'text-amber-300' : 'text-slate-500'}`}>
                        {currentCase.ai_recommendation ?? 'none'}
                      </p>
                    </div>
                  </div>

                  {/* AI risk signals */}
                  {Object.keys(currentCase.signals ?? {}).length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">AI Risk Signals</p>
                      {Object.entries(currentCase.signals).map(([label, score]) => {
                        const pct = Math.round(Number(score) * 100);
                        return (
                          <div key={label} className="flex items-center gap-3 text-xs">
                            <span className="w-28 text-slate-400 font-semibold capitalize flex-shrink-0">{label}</span>
                            <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  pct >= 90 ? 'bg-rose-500' : pct >= 70 ? 'bg-amber-500' : 'bg-sky-500'
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="w-10 text-right text-slate-300 font-bold">{pct}%</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {currentCase.reports?.details && (
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                      <p className="text-[11px] text-slate-400 mb-1 font-semibold">Report Details</p>
                      <p className="text-sm text-slate-200 leading-relaxed">{currentCase.reports.details}</p>
                    </div>
                  )}

                  {/* Action panel — client component for server action dispatch */}
                  <ModActionPanel caseId={currentCase.id} />

                  <p className="text-[11px] text-slate-600 pt-1">
                    AI assists classification only. Humans make all final decisions. Actions are immutable audit records.
                  </p>
                </>
              )}
            </div>

            {/* Sidebar */}
            <aside className="space-y-4">
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
                  <Clock className="w-4 h-4 text-sky-400" /> Recent Cases
                </h3>
                {recentCases.length === 0 ? (
                  <p className="text-xs text-slate-500">No recent cases.</p>
                ) : (
                  <ul className="space-y-2">
                    {recentCases.map((c) => (
                      <li key={c.id} className="flex items-center justify-between text-xs">
                        <div>
                          <span className="text-slate-300 font-mono">{c.id.slice(0, 8)}</span>
                          <span className="text-slate-500 ml-1 capitalize">{c.target_type}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold capitalize ${PRIORITY_COLORS[c.priority]?.text ?? 'text-slate-400'}`}>
                            {c.priority}
                          </span>
                          <span className="text-slate-600">{relativeTime(c.created_at)}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                  <BarChart3 className="w-4 h-4 text-emerald-400" /> Queue Summary
                </h3>
                <ul className="space-y-2 text-xs">
                  <li className="flex justify-between text-slate-400">
                    <span>Total queued</span>
                    <span className="text-white font-semibold">{allQueued.length}</span>
                  </li>
                  <li className="flex justify-between text-slate-400">
                    <span>Critical (immediate)</span>
                    <span className={queueCounts[0].count > 0 ? 'text-rose-400 font-semibold' : 'text-emerald-400 font-semibold'}>
                      {queueCounts[0].count}
                    </span>
                  </li>
                  <li className="flex justify-between text-slate-400">
                    <span>Decided today</span>
                    <span className="text-emerald-400 font-semibold">{decidedToday}</span>
                  </li>
                </ul>
              </div>

              <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4">
                <p className="text-[11px] text-amber-300/80 font-semibold mb-1">Moderator Reminders</p>
                <ul className="text-[11px] text-slate-500 space-y-1">
                  <li>• Critical cases must be reviewed within 1 hour</li>
                  <li>• Auto-actions apply only at 95%+ signal confidence</li>
                  <li>• Escalate any case with legal implications</li>
                  <li>• Appeals are reviewed by senior moderators</li>
                </ul>
              </div>
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
}
