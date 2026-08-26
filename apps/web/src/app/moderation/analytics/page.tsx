import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { BarChart3, ArrowLeft, Clock } from 'lucide-react';
import { createServiceSupabaseClient, getAuthorizedUser } from '../../../lib/supabase/server';
import AccessDenied from '../../../components/access-denied';

export const dynamic = 'force-dynamic';

export default async function WebModerationAnalyticsPage() {
  const auth = await getAuthorizedUser(['moderator', 'admin', 'management', 'superadmin']);
  if (!auth.isLoggedIn) {
    redirect('/login?next=/moderation/analytics');
  }
  if (!auth.isAuthorized) {
    return (
      <AccessDenied
        user={auth.user}
        requiredRole="moderator"
        currentRole={auth.role}
        resourceName="Moderation Telemetry & Analytics"
      />
    );
  }

  const supabase = await createServiceSupabaseClient();
  if (!supabase) {
    return (
      <div className="min-h-screen bg-[#090D16] text-brand-sandstone flex items-center justify-center p-4">
        <p className="text-sm text-brand-sandstone/60">Service temporarily unavailable. Please try again.</p>
      </div>
    );
  }

  const [
    totalResult,
    decidedResult,
    escalatedResult,
    queuedResult,
    byPriorityResult,
    byActionResult,
    recentActionsResult,
  ] = await Promise.all([
    supabase.from('moderation_cases').select('id', { count: 'exact', head: true }),
    supabase.from('moderation_cases').select('id', { count: 'exact', head: true }).eq('status', 'decided'),
    supabase.from('moderation_cases').select('id', { count: 'exact', head: true }).eq('status', 'escalated'),
    supabase.from('moderation_cases').select('id', { count: 'exact', head: true }).eq('status', 'queued'),
    supabase.from('moderation_cases').select('priority').order('priority'),
    supabase.from('moderation_actions').select('action').order('action'),
    supabase
      .from('moderation_actions')
      .select('id, action, rationale, created_at')
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  const priorityCounts = (['critical', 'high', 'medium', 'low'] as const).map((p) => ({
    priority: p,
    count: ((byPriorityResult.data ?? []) as Array<{ priority: string }>).filter((c) => c.priority === p).length,
  }));

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

  return (
    <div className="min-h-screen bg-[#090D16] text-brand-sandstone">
      <header className="sticky top-0 z-50 bg-[#0F172A]/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center gap-4">
        <Link href="/moderation" className="flex items-center gap-2 text-slate-300 hover:text-brand-sandstone text-sm font-semibold">
          <ArrowLeft className="w-4 h-4" /> Queue
        </Link>
        <h1 className="text-lg font-extrabold text-brand-sandstone flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-brand-sunriseCoral" /> Moderation Telemetry &amp; Resolution Metrics
        </h1>
        <div className="hidden sm:flex items-center gap-2 ml-4">
          <Link href="/moderation" className="text-brand-sandstone/60 hover:text-brand-sandstone px-3 py-1 rounded-lg text-xs font-semibold">Queue</Link>
          <Link href="/moderation/cases" className="text-brand-sandstone/60 hover:text-brand-sandstone px-3 py-1 rounded-lg text-xs font-semibold">Cases</Link>
          <Link href="/moderation/appeals" className="text-brand-sandstone/60 hover:text-brand-sandstone px-3 py-1 rounded-lg text-xs font-semibold">Appeals</Link>
          <Link href="/moderation/analytics" className="bg-brand-dusk text-brand-sandstone px-3 py-1 rounded-lg text-xs font-semibold">Analytics</Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 space-y-6">
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
          <div className="bg-brand-dusk/70 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-brand-sandstone">Queue Distribution by Priority</h3>
            {priorityCounts.map((p) => {
              const pct = total > 0 ? Math.round((p.count / total) * 100) : 0;
              return (
                <div key={p.priority} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="capitalize font-semibold text-slate-300">{p.priority}</span>
                    <span className="text-brand-sandstone/60">{p.count} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-brand-dusk rounded-full overflow-hidden">
                    <div className="h-full bg-brand-caribbeanSea rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-brand-dusk/70 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-brand-sandstone">Actions Taken</h3>
            {actionCounts.map((a) => {
              const totalActions = actionCounts.reduce((sum, x) => sum + x.count, 0);
              const pct = totalActions > 0 ? Math.round((a.count / totalActions) * 100) : 0;
              return (
                <div key={a.action} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="capitalize font-semibold text-slate-300">{a.action}</span>
                    <span className="text-brand-sandstone/60">{a.count} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-brand-dusk rounded-full overflow-hidden">
                    <div className="h-full bg-brand-sunriseCoral rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
