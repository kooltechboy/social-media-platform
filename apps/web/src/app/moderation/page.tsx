import React from 'react';
import { redirect } from 'next/navigation';
import {
  ShieldAlert, Eye, EyeOff, Flag, ArrowUpRight, ArrowLeft,
  CheckCircle, XCircle, AlertTriangle, Clock
} from 'lucide-react';
import Link from 'next/link';
import { createServiceSupabaseClient, getAuthorizedUser } from '../../lib/supabase/server';
import ModerationActionButton from '../../components/moderation-action-button';
import AccessDenied from '../../components/access-denied';
import { TukubiLogo } from '../../components/brand/tukubi-logo';
import { AdminFooter } from '../../components/admin/admin-footer';

export const dynamic = 'force-dynamic';

interface QueueCount {
  priority: string;
  count: number;
}

interface ModerationCase {
  id: string;
  target_type: string;
  target_id: string;
  signals: Record<string, number>;
  ai_recommendation: 'remove' | 'restrict' | 'allow' | 'escalate' | null;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'queued' | 'assigned' | 'decided' | 'escalated';
  created_at: string;
  reports: { reason: string; details: string | null } | null;
}

const PRIORITY_COLORS: Record<string, { text: string; border: string; bg: string }> = {
  critical: { text: 'text-rose-400', border: 'border-rose-500/40', bg: 'bg-rose-500/10' },
  high: { text: 'text-brand-goldenHour', border: 'border-brand-goldenHour/40', bg: 'bg-brand-goldenHour/10' },
  medium: { text: 'text-brand-caribbeanSea', border: 'border-brand-caribbeanSea/40', bg: 'bg-brand-caribbeanSea/10' },
  low: { text: 'text-slate-300', border: 'border-slate-600/40', bg: 'bg-brand-dusk/40' },
};

export default async function ModerationPage() {
  const auth = await getAuthorizedUser(['moderator', 'admin', 'management', 'superadmin']);
  if (!auth.isLoggedIn) {
    redirect('/login?next=/moderation');
  }
  if (!auth.isAuthorized) {
    return (
      <AccessDenied
        user={auth.user}
        requiredRole="moderator"
        currentRole={auth.role}
        resourceName="the Moderation Command Center"
      />
    );
  }

  const user = auth.user;
  const supabase = await createServiceSupabaseClient();
  if (!supabase) {
    return (
      <div className="min-h-screen bg-transparent text-brand-sandstone flex items-center justify-center p-4">
        <p className="text-sm text-brand-sandstone/60">Service temporarily unavailable. Please try again.</p>
      </div>
    );
  }

  const [queueResult, casesResult, recentResult] = await Promise.all([
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
      .limit(5),
  ]);

  const allQueued = (queueResult.data ?? []) as Array<{ priority: string }>;
  const queueCounts = ['critical', 'high', 'medium', 'low'].map((p) => ({
    priority: p,
    count: allQueued.filter((c) => c.priority === p).length,
  }));

  const currentCase = ((casesResult.data ?? []) as unknown as ModerationCase[])[0] ?? null;
  const recentCases = (recentResult.data ?? []) as Array<{
    id: string;
    target_type: string;
    priority: string;
    status: string;
    created_at: string;
  }>;

  function relativeTime(iso: string): string {
    const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    return `${Math.floor(m / 60)}h ago`;
  }

  return (
    <div className="min-h-screen bg-transparent text-brand-sandstone">
      <header className="sticky top-0 z-50 bg-[#0F172A]/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <TukubiLogo variant="horizontal" size="xs" href="/" />
          <div className="h-5 w-px bg-slate-700 hidden sm:block" />
          <h1 className="text-base font-extrabold text-brand-sandstone flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-brand-goldenHour" /> Moderation
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/moderation" className="bg-brand-dusk text-brand-sandstone px-3 py-1 rounded-lg text-xs font-semibold">Queue</Link>
          <Link href="/moderation/cases" className="text-brand-sandstone/60 hover:text-brand-sandstone px-3 py-1 rounded-lg text-xs font-semibold">Cases</Link>
          <Link href="/moderation/appeals" className="text-brand-sandstone/60 hover:text-brand-sandstone px-3 py-1 rounded-lg text-xs font-semibold">Appeals</Link>
          <Link href="/moderation/analytics" className="text-brand-sandstone/60 hover:text-brand-sandstone px-3 py-1 rounded-lg text-xs font-semibold">Analytics</Link>
        </div>
        <span className="text-[11px] text-brand-sandstone/60 hidden md:block">
          Human-in-the-loop · every action is logged
        </span>
      </header>

      <main className="max-w-6xl mx-auto p-4 space-y-6">
        {/* Queue counts */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {queueCounts.map((queue) => {
            const colors = PRIORITY_COLORS[queue.priority];
            return (
              <div key={queue.priority} className={`${colors.bg} border ${colors.border} rounded-2xl p-4`}>
                <p className={`text-2xl font-extrabold ${colors.text}`}>{queue.count}</p>
                <p className="text-xs font-semibold text-slate-300 capitalize mt-1">{queue.priority}</p>
              </div>
            );
          })}
        </section>

        <section className="grid lg:grid-cols-3 gap-4">
          {/* Current case */}
          <div className="lg:col-span-2 bg-brand-dusk/70 border border-slate-800 rounded-2xl p-5 space-y-4">
            {!currentCase ? (
              <div className="py-10 text-center">
                <CheckCircle className="w-10 h-10 text-brand-sunriseCoral mx-auto mb-2" />
                <p className="text-sm font-semibold text-brand-sunriseCoral">Queue is clear.</p>
                <p className="text-xs text-brand-sandstone/40 mt-1">No cases awaiting review.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-brand-sandstone">Case #{currentCase.id.slice(0, 8)}</h2>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                      PRIORITY_COLORS[currentCase.priority].bg
                    } ${PRIORITY_COLORS[currentCase.priority].text} ${PRIORITY_COLORS[currentCase.priority].border}`}
                  >
                    {currentCase.priority} priority
                  </span>
                </div>

                <div className="text-xs text-brand-sandstone/60 space-y-1">
                  <p>
                    Content type:{' '}
                    <span className="text-slate-200 font-semibold capitalize">{currentCase.target_type}</span>
                  </p>
                  {currentCase.reports && (
                    <p>
                      Report reason:{' '}
                      <span className="text-slate-200 font-semibold capitalize">{currentCase.reports.reason}</span>
                    </p>
                  )}
                  <p>
                    Status:{' '}
                    <span className="text-slate-200 font-semibold capitalize">{currentCase.status}</span>
                  </p>
                </div>

                {/* AI signals */}
                {Object.keys(currentCase.signals).length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-[11px] font-bold text-brand-sandstone/60 uppercase tracking-wider">AI Risk Signals</h3>
                    {Object.entries(currentCase.signals).map(([label, score]) => {
                      const pct = Math.round(Number(score) * 100);
                      return (
                        <div key={label} className="flex items-center gap-3 text-xs">
                          <span className="w-24 text-brand-sandstone/60 font-semibold capitalize">{label}</span>
                          <div className="flex-1 h-2 bg-brand-dusk rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
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

                {/* Action buttons */}
                <div className="pt-3 border-t border-slate-800 flex flex-wrap gap-2">
                  <ModerationActionButton caseId={currentCase.id} action="remove" />
                  <ModerationActionButton caseId={currentCase.id} action="restrict" />
                  <ModerationActionButton caseId={currentCase.id} action="allow" />
                  <ModerationActionButton caseId={currentCase.id} action="escalate" />
                </div>

                {currentCase.ai_recommendation && (
                  <p className="text-[11px] text-brand-sandstone/40">
                    AI recommendation:{' '}
                    <span className="text-amber-300 font-semibold uppercase">
                      {currentCase.ai_recommendation}
                    </span>{' '}
                    — AI assists, humans decide.
                  </p>
                )}
              </>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-4">
            <div className="bg-brand-dusk/60 border border-slate-800 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-brand-sandstone flex items-center gap-2 mb-3">
                <Eye className="w-4 h-4 text-brand-caribbeanSea" /> Recent Cases
              </h3>
              {recentCases.length === 0 ? (
                <p className="text-xs text-brand-sandstone/40">No recent cases.</p>
              ) : (
                <ul className="space-y-2 text-xs">
                  {recentCases.map((c) => (
                    <li key={c.id} className="flex justify-between text-brand-sandstone/60">
                      <span>#{c.id.slice(0, 8)} {c.target_type} ({c.priority})</span>
                      <span className="text-brand-sandstone/40">{relativeTime(c.created_at)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="bg-brand-dusk/60 border border-slate-800 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-brand-sandstone flex items-center gap-2 mb-3">
                <Flag className="w-4 h-4 text-brand-goldenHour" /> Queue Summary
              </h3>
              <ul className="space-y-2 text-xs text-brand-sandstone/60">
                <li className="flex justify-between">
                  <span>Total queued</span>
                  <span className="text-brand-sandstone font-semibold">{allQueued.length}</span>
                </li>
                <li className="flex justify-between">
                  <span>Critical</span>
                  <span className={`font-semibold ${queueCounts[0].count > 0 ? 'text-rose-400' : 'text-brand-sunriseCoral'}`}>
                    {queueCounts[0].count}
                  </span>
                </li>
              </ul>
            </div>

            <div className="bg-brand-dusk/60 border border-slate-800 rounded-2xl p-5 flex items-center gap-3">
              <EyeOff className="w-4 h-4 text-brand-sandstone/40 flex-shrink-0" />
              <p className="text-[11px] text-brand-sandstone/40">
                Auto-action applies only to high-confidence categories. All others require human review.
              </p>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}
