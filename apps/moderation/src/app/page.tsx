import React from 'react';
import { redirect } from 'next/navigation';
import Image from 'next/image';
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
  high: { text: 'text-brand-goldenHour', border: 'border-brand-goldenHour/40', bg: 'bg-brand-goldenHour/10' },
  medium: { text: 'text-brand-caribbeanSea', border: 'border-brand-caribbeanSea/40', bg: 'bg-brand-caribbeanSea/10' },
  low: { text: 'text-slate-300', border: 'border-slate-600/40', bg: 'bg-brand-dusk/40' },
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
    <div className="min-h-screen bg-brand-twilight text-brand-sandstone flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-56 bg-brand-dusk border-r border-brand-sunsetPurple/20 p-4 space-y-1 sticky top-0 min-h-screen">
        <div className="px-2 py-4 mb-2 flex items-center gap-2.5">
          <Image
            src="/brand/tukubi-emblem.png"
            alt="TUKUBI"
            width={36}
            height={36}
            className="object-contain"
          />
          <div>
            <h1 className="text-sm font-black bg-gradient-to-r from-brand-caribbeanSea to-brand-sunriseCoral bg-clip-text text-transparent tracking-wider">
              TUKUBI
            </h1>
            <p className="text-[10px] text-brand-goldenHour font-semibold">Moderation Center</p>
          </div>
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
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-brand-sandstone/60 hover:bg-brand-dusk/60 hover:text-brand-sandstone transition-colors"
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            {item.label}
          </a>
        ))}
        <div className="mt-auto pt-4 border-t border-brand-sunsetPurple/20">
          <p className="text-[10px] text-slate-400 px-2">Moderator</p>
          <p className="text-[11px] text-brand-sandstone/60 px-2 truncate">{moderator.displayName}</p>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="sticky top-0 z-40 bg-brand-dusk/95 backdrop-blur border-b border-brand-sunsetPurple/20 px-6 py-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-brand-sandstone flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-brand-goldenHour" /> Moderation Queue
          </h2>
          <span className="text-[11px] text-brand-sandstone/60">Human-in-the-loop · every action is logged</span>
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
            <div className="bg-brand-sunriseCoral/10 border border-brand-sunriseCoral/30 rounded-2xl p-4">
              <p className="text-2xl font-extrabold text-brand-sunriseCoral">{decidedToday}</p>
              <p className="text-xs font-semibold text-slate-300 mt-1">Decided today</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Active case panel */}
            <div className="lg:col-span-2 bg-brand-dusk/70 border border-slate-800 rounded-2xl p-6 space-y-5">
              <h3 className="text-sm font-bold text-brand-sandstone">Active Case</h3>

              {!currentCase ? (
                <div className="py-12 text-center">
                  <CheckCircle className="w-12 h-12 text-brand-sunriseCoral mx-auto mb-3" />
                  <p className="text-sm font-semibold text-brand-sunriseCoral">Queue is clear.</p>
                  <p className="text-xs text-brand-sandstone/40 mt-1">No cases awaiting review.</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-brand-sandstone/60">Case ID</p>
                      <code className="text-sm font-mono text-slate-200">{currentCase.id.slice(0, 16)}…</code>
                    </div>
                    <span className={`text-[10px] font-bold px-3 py-1 rounded-full border uppercase ${
                      PRIORITY_COLORS[currentCase.priority].bg
                    } ${PRIORITY_COLORS[currentCase.priority].text} ${PRIORITY_COLORS[currentCase.priority].border}`}>
                      {currentCase.priority} priority
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-brand-twilight rounded-xl p-3 border border-slate-800">
                      <p className="text-brand-sandstone/60">Content type</p>
                      <p className="text-brand-sandstone font-semibold capitalize mt-0.5">{currentCase.target_type}</p>
                    </div>
                    <div className="bg-brand-twilight rounded-xl p-3 border border-slate-800">
                      <p className="text-brand-sandstone/60">Report reason</p>
                      <p className="text-brand-sandstone font-semibold capitalize mt-0.5">
                        {currentCase.reports?.reason ?? 'No report'}
                      </p>
                    </div>
                    <div className="bg-brand-twilight rounded-xl p-3 border border-slate-800">
                      <p className="text-brand-sandstone/60">Status</p>
                      <p className="text-brand-sandstone font-semibold capitalize mt-0.5">{currentCase.status}</p>
                    </div>
                    <div className="bg-brand-twilight rounded-xl p-3 border border-slate-800">
                      <p className="text-brand-sandstone/60">AI recommendation</p>
                      <p className={`font-semibold uppercase mt-0.5 ${currentCase.ai_recommendation ? 'text-amber-300' : 'text-brand-sandstone/40'}`}>
                        {currentCase.ai_recommendation ?? 'none'}
                      </p>
                    </div>
                  </div>

                  {/* AI risk signals */}
                  {Object.keys(currentCase.signals ?? {}).length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[11px] font-bold text-brand-sandstone/60 uppercase tracking-wider">AI Risk Signals</p>
                      {Object.entries(currentCase.signals).map(([label, score]) => {
                        const pct = Math.round(Number(score) * 100);
                        return (
                          <div key={label} className="flex items-center gap-3 text-xs">
                            <span className="w-28 text-brand-sandstone/60 font-semibold capitalize flex-shrink-0">{label}</span>
                            <div className="flex-1 h-2 bg-brand-dusk rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  pct >= 90 ? 'bg-rose-500' : pct >= 70 ? 'bg-brand-goldenHour' : 'bg-brand-caribbeanSea'
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
                    <div className="bg-brand-twilight border border-slate-800 rounded-xl p-4">
                      <p className="text-[11px] text-brand-sandstone/60 mb-1 font-semibold">Report Details</p>
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
              <div className="bg-brand-dusk/60 border border-slate-800 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-brand-sandstone flex items-center gap-2 mb-4">
                  <Clock className="w-4 h-4 text-brand-caribbeanSea" /> Recent Cases
                </h3>
                {recentCases.length === 0 ? (
                  <p className="text-xs text-brand-sandstone/40">No recent cases.</p>
                ) : (
                  <ul className="space-y-2">
                    {recentCases.map((c) => (
                      <li key={c.id} className="flex items-center justify-between text-xs">
                        <div>
                          <span className="text-slate-300 font-mono">{c.id.slice(0, 8)}</span>
                          <span className="text-brand-sandstone/40 ml-1 capitalize">{c.target_type}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold capitalize ${PRIORITY_COLORS[c.priority]?.text ?? 'text-brand-sandstone/60'}`}>
                            {c.priority}
                          </span>
                          <span className="text-slate-600">{relativeTime(c.created_at)}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="bg-brand-dusk/60 border border-slate-800 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-brand-sandstone flex items-center gap-2 mb-3">
                  <BarChart3 className="w-4 h-4 text-brand-sunriseCoral" /> Queue Summary
                </h3>
                <ul className="space-y-2 text-xs">
                  <li className="flex justify-between text-brand-sandstone/60">
                    <span>Total queued</span>
                    <span className="text-brand-sandstone font-semibold">{allQueued.length}</span>
                  </li>
                  <li className="flex justify-between text-brand-sandstone/60">
                    <span>Critical (immediate)</span>
                    <span className={queueCounts[0].count > 0 ? 'text-rose-400 font-semibold' : 'text-brand-sunriseCoral font-semibold'}>
                      {queueCounts[0].count}
                    </span>
                  </li>
                  <li className="flex justify-between text-brand-sandstone/60">
                    <span>Decided today</span>
                    <span className="text-brand-sunriseCoral font-semibold">{decidedToday}</span>
                  </li>
                </ul>
              </div>

              <div className="bg-brand-goldenHour/5 border border-brand-goldenHour/20 rounded-2xl p-4">
                <p className="text-[11px] text-amber-300/80 font-semibold mb-1">Moderator Reminders</p>
                <ul className="text-[11px] text-brand-sandstone/40 space-y-1">
                  <li>• Critical cases must be reviewed within 1 hour</li>
                  <li>• Auto-actions apply only at 95%+ signal confidence</li>
                  <li>• Escalate any case with legal implications</li>
                  <li>• Appeals are reviewed by senior moderators</li>
                </ul>
              </div>
            </aside>
          </div>

          {/* Dark Footer with Image 2 Logo */}
          <footer className="mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-brand-sandstone/40">
            <div className="flex items-center gap-3">
              <Image
                src="/brand/tukubi-footer-dark.png"
                alt="TUKUBI — The Caribbean Connected."
                width={130}
                height={52}
                className="object-contain rounded-lg border border-white/10"
              />
              <span>&copy; {new Date().getFullYear()} TUKUBI. All rights reserved.</span>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span>Role: Trust &amp; Safety Moderator</span>
              <span>•</span>
              <span>All moderation actions cryptographically audited</span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
