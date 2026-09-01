import React from 'react';
import Link from 'next/link';
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
    high: 'bg-brand-goldenHour',
    medium: 'bg-brand-caribbeanSea',
    low: 'bg-brand-sandstone/40',
  };

  const ACTION_COLORS: Record<string, string> = {
    remove: 'text-rose-400',
    restrict: 'text-brand-goldenHour',
    allow: 'text-brand-sunriseCoral',
    escalate: 'text-brand-caribbeanSea',
  };

  function relativeTime(iso: string): string {
    const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    return `${Math.floor(m / 60)}h ago`;
  }

  return (
    <div className="min-h-screen bg-brand-twilight text-brand-sandstone p-6 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <h1 className="text-xl font-extrabold text-brand-sandstone flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-brand-sunriseCoral" /> Moderation Analytics
        </h1>
        <Link href="/" className="text-xs text-brand-sandstone/60 hover:text-brand-sandstone">← Queue</Link>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Cases', value: total, color: 'text-brand-caribbeanSea' },
          { label: 'Decided', value: decided, color: 'text-brand-sunriseCoral' },
          { label: 'Escalated', value: escalatedResult.count ?? 0, color: 'text-rose-400' },
          { label: 'Resolution Rate', value: `${resolutionRate}%`, color: 'text-brand-goldenHour' },
        ].map((stat) => (
          <div key={stat.label} className="bg-brand-dusk/70 border border-slate-800 rounded-2xl p-5">
            <p className="text-[11px] text-brand-sandstone/60 uppercase font-semibold">{stat.label}</p>
            <p className={`text-3xl font-extrabold mt-1 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Cases by priority */}
        <div className="bg-brand-dusk/70 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-brand-sandstone">Cases by Priority</h3>
          {priorityCounts.map((p) => {
            const pct = total > 0 ? Math.round((p.count / total) * 100) : 0;
            return (
              <div key={p.priority} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="capitalize text-slate-300 font-semibold">{p.priority}</span>
                  <span className="text-brand-sandstone/60">{p.count} ({pct}%)</span>
                </div>
                <div className="h-2 bg-brand-dusk rounded-full overflow-hidden">
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
        <div className="bg-brand-dusk/70 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-brand-sandstone">Actions Taken</h3>
          {actionCounts.map((a) => {
            const totalActions = actionCounts.reduce((s, x) => s + x.count, 0);
            const pct = totalActions > 0 ? Math.round((a.count / totalActions) * 100) : 0;
            return (
              <div key={a.action} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className={`capitalize font-semibold ${ACTION_COLORS[a.action]}`}>{a.action}</span>
                  <span className="text-brand-sandstone/60">{a.count} ({pct}%)</span>
                </div>
                <div className="h-2 bg-brand-dusk rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      a.action === 'remove' ? 'bg-rose-500' :
                      a.action === 'restrict' ? 'bg-brand-goldenHour' :
                      a.action === 'allow' ? 'bg-brand-sunriseCoral' : 'bg-brand-caribbeanSea'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Cases by content type */}
        <div className="bg-brand-dusk/70 border border-slate-800 rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-brand-sandstone">Cases by Content Type</h3>
          {typeCounts.length === 0 ? (
            <p className="text-xs text-brand-sandstone/40">No data yet.</p>
          ) : (
            typeCounts.map((t) => (
              <div key={t.type} className="flex justify-between text-xs">
                <span className="capitalize text-slate-300">{t.type}</span>
                <span className="text-brand-sandstone/60 font-semibold">{t.count}</span>
              </div>
            ))
          )}
        </div>

        {/* Recent actions log */}
        <div className="bg-brand-dusk/70 border border-slate-800 rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-brand-sandstone flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand-caribbeanSea" /> Recent Actions
          </h3>
          {recentActions.length === 0 ? (
            <p className="text-xs text-brand-sandstone/40">No actions recorded yet.</p>
          ) : (
            <ul className="space-y-2">
              {recentActions.map((a) => (
                <li key={a.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`capitalize font-bold ${ACTION_COLORS[a.action] ?? 'text-brand-sandstone/60'}`}>
                      {a.action}
                    </span>
                    {a.rationale && (
                      <span className="text-brand-sandstone/40 truncate max-w-[140px]">{a.rationale}</span>
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
