import React from 'react';
import { redirect } from 'next/navigation';
import { BarChart3, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { createModerationSupabaseClient, getModeratorSession } from '../../lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function ModerationAnalyticsPage() {
  const moderator = await getModeratorSession();
  if (!moderator) redirect('/login');

  const supabase = await createModerationSupabaseClient();
  if (!supabase) redirect('/login');

  const [
    totalResult,
    decidedResult,
    escalatedResult,
    queuedResult,
    byPriorityResult,
    byTypeResult,
    byActionResult,
    recentActionsResult,
  ] = await Promise.all([
    supabase.from('moderation_cases').select('id', { count: 'exact', head: true }),
    supabase.from('moderation_cases').select('id', { count: 'exact', head: true }).eq('status', 'decided'),
    supabase.from('moderation_cases').select('id', { count: 'exact', head: true }).eq('status', 'escalated'),
    supabase.from('moderation_cases').select('id', { count: 'exact', head: true }).eq('status', 'queued'),
    supabase.from('moderation_cases').select('priority').order('priority'),
    supabase.from('moderation_cases').select('target_type').order('target_type'),
    supabase.from('moderation_actions').select('action').order('action'),
    supabase
      .from('moderation_actions')
      .select('id, action, rationale, created_at')
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  // Aggregate counts
  const priorityCounts = (['critical', 'high', 'medium', 'low'] as const).map((p) => ({
    priority: p,
    count: ((byPriorityResult.data ?? []) as Array<{ priority: string }>).filter((c) => c.priority === p).length,
  }));

  const typeCounts = [...new Set(((byTypeResult.data ?? []) as Array<{ target_type: string }>).map((c) => c.target_type))].map((t) => ({
    type: t,
    count: ((byTypeResult.data ?? []) as Array<{ target_type: string }>).filter((c) => c.target_type === t).length,
  })).sort((a, b) => b.count - a.count);

  const actionCounts = (['remove', 'restrict', 'allow', 'escalate'] as const).map((a) => ({
    action: a,
    count: ((byActionResult.data ?? []) as Array<{ action: string }>).filter((c) => c.action === a).length,
  }));

  const total = totalResult.count ?? 0;
  const decided = decidedResult.count ?? 0;
  const resolutionRate = total > 0 ? Math.round((decided / total) * 100) : 0;

  const recentActions = (recentActionsResult.data ?? []) as Array<{
    id: string;
    action: string;
    rationale: string | null;
    created_at: string;
  }>;

  const PRIORITY_COLORS: Record<string, string> = {
    critical: 'bg-rose-500',
    high: 'bg-amber-500',
    medium: 'bg-sky-500',
    low: 'bg-slate-500',
  };

  const ACTION_COLORS: Record<string, string> = {
    remove: 'text-rose-400',
    restrict: 'text-amber-400',
    allow: 'text-emerald-400',
    escalate: 'text-sky-400',
  };

  function relativeTime(iso: string): string {
    const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    return `${Math.floor(m / 60)}h ago`;
  }

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 p-6 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-emerald-400" /> Moderation Analytics
        </h1>
        <a href="/" className="text-xs text-slate-400 hover:text-white">← Queue</a>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Cases', value: total, color: 'text-sky-400' },
          { label: 'Decided', value: decided, color: 'text-emerald-400' },
          { label: 'Escalated', value: escalatedResult.count ?? 0, color: 'text-rose-400' },
          { label: 'Resolution Rate', value: `${resolutionRate}%`, color: 'text-amber-400' },
        ].map((stat) => (
          <div key={stat.label} className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5">
            <p className="text-[11px] text-slate-400 uppercase font-semibold">{stat.label}</p>
            <p className={`text-3xl font-extrabold mt-1 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Cases by priority */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white">Cases by Priority</h3>
          {priorityCounts.map((p) => {
            const pct = total > 0 ? Math.round((p.count / total) * 100) : 0;
            return (
              <div key={p.priority} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="capitalize text-slate-300 font-semibold">{p.priority}</span>
                  <span className="text-slate-400">{p.count} ({pct}%)</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${PRIORITY_COLORS[p.priority]}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions taken */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white">Actions Taken</h3>
          {actionCounts.map((a) => {
            const totalActions = actionCounts.reduce((s, x) => s + x.count, 0);
            const pct = totalActions > 0 ? Math.round((a.count / totalActions) * 100) : 0;
            return (
              <div key={a.action} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className={`capitalize font-semibold ${ACTION_COLORS[a.action]}`}>{a.action}</span>
                  <span className="text-slate-400">{a.count} ({pct}%)</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      a.action === 'remove' ? 'bg-rose-500' :
                      a.action === 'restrict' ? 'bg-amber-500' :
                      a.action === 'allow' ? 'bg-emerald-500' : 'bg-sky-500'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Cases by content type */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-white">Cases by Content Type</h3>
          {typeCounts.length === 0 ? (
            <p className="text-xs text-slate-500">No data yet.</p>
          ) : (
            typeCounts.map((t) => (
              <div key={t.type} className="flex justify-between text-xs">
                <span className="capitalize text-slate-300">{t.type}</span>
                <span className="text-slate-400 font-semibold">{t.count}</span>
              </div>
            ))
          )}
        </div>

        {/* Recent actions log */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-sky-400" /> Recent Actions
          </h3>
          {recentActions.length === 0 ? (
            <p className="text-xs text-slate-500">No actions recorded yet.</p>
          ) : (
            <ul className="space-y-2">
              {recentActions.map((a) => (
                <li key={a.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`capitalize font-bold ${ACTION_COLORS[a.action] ?? 'text-slate-400'}`}>
                      {a.action}
                    </span>
                    {a.rationale && (
                      <span className="text-slate-500 truncate max-w-[140px]">{a.rationale}</span>
                    )}
                  </div>
                  <span className="text-slate-600 flex-shrink-0">{relativeTime(a.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
