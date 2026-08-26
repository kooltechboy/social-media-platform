import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Eye, ArrowLeft, Inbox } from 'lucide-react';
import { createServiceSupabaseClient, getAuthorizedUser } from '../../../lib/supabase/server';
import AppealActionForm from '../../../components/appeal-action-form';
import AccessDenied from '../../../components/access-denied';

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
  appeal_status?: string | null;
  appeal_rationale?: string | null;
}

export default async function WebModerationAppealsPage() {
  const auth = await getAuthorizedUser(['moderator', 'admin', 'management', 'superadmin']);
  if (!auth.isLoggedIn) {
    redirect('/login?next=/moderation/appeals');
  }
  if (!auth.isAuthorized) {
    return (
      <AccessDenied
        user={auth.user}
        requiredRole="moderator"
        currentRole={auth.role}
        resourceName="the Appeals Desk"
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

  const { data } = await supabase
    .from('moderation_cases')
    .select('id, target_type, target_id, priority, status, ai_recommendation, created_at, appeal_status, appeal_rationale')
    .or('status.eq.appealed,appeal_status.in.(submitted,under_review)')
    .order('created_at', { ascending: false })
    .limit(50);

  const appeals = (data ?? []) as AppealCase[];

  return (
    <div className="min-h-screen bg-[#090D16] text-brand-sandstone">
      <header className="sticky top-0 z-50 bg-[#0F172A]/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center gap-4">
        <Link href="/moderation" className="flex items-center gap-2 text-slate-300 hover:text-brand-sandstone text-sm font-semibold">
          <ArrowLeft className="w-4 h-4" /> Queue
        </Link>
        <h1 className="text-lg font-extrabold text-brand-sandstone flex items-center gap-2">
          <Eye className="w-5 h-5 text-violet-400" /> Appeals Desk
        </h1>
        <div className="hidden sm:flex items-center gap-2 ml-4">
          <Link href="/moderation" className="text-brand-sandstone/60 hover:text-brand-sandstone px-3 py-1 rounded-lg text-xs font-semibold">Queue</Link>
          <Link href="/moderation/cases" className="text-brand-sandstone/60 hover:text-brand-sandstone px-3 py-1 rounded-lg text-xs font-semibold">Cases</Link>
          <Link href="/moderation/appeals" className="bg-brand-dusk text-brand-sandstone px-3 py-1 rounded-lg text-xs font-semibold">Appeals</Link>
          <Link href="/moderation/analytics" className="text-brand-sandstone/60 hover:text-brand-sandstone px-3 py-1 rounded-lg text-xs font-semibold">Analytics</Link>
        </div>
        <span className="ml-auto text-xs text-brand-sandstone/40">{appeals.length} pending</span>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-4">
        {appeals.length === 0 ? (
          <div className="py-20 text-center">
            <Inbox className="w-12 h-12 text-slate-700 mx-auto mb-4" />
            <p className="text-sm font-semibold text-brand-sandstone/40">No appeals pending review.</p>
          </div>
        ) : (
          appeals.map((appeal) => {
            const prioColors = PRIORITY_COLORS[appeal.priority] ?? PRIORITY_COLORS.low;
            return (
              <article key={appeal.id} className="bg-brand-dusk/70 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-brand-sandstone/60">Case #{appeal.id.slice(0, 12)}…</p>
                    <p className="text-xs text-brand-sandstone/40">{new Date(appeal.created_at).toLocaleString()}</p>
                  </div>
                  <span className={`text-[10px] font-bold uppercase px-3 py-1 rounded-full ${prioColors.bg} ${prioColors.text}`}>
                    {appeal.priority}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="bg-brand-twilight rounded-xl p-3 border border-slate-800">
                    <p className="text-brand-sandstone/60">Target Type</p>
                    <p className="font-semibold text-brand-sandstone capitalize mt-0.5">{appeal.target_type}</p>
                  </div>
                  <div className="bg-brand-twilight rounded-xl p-3 border border-slate-800">
                    <p className="text-brand-sandstone/60">Status</p>
                    <p className="font-semibold text-violet-400 capitalize mt-0.5">{appeal.status}</p>
                  </div>
                  <div className="bg-brand-twilight rounded-xl p-3 border border-slate-800">
                    <p className="text-brand-sandstone/60">AI Recommendation</p>
                    <p className="font-semibold text-amber-300 uppercase mt-0.5">{appeal.ai_recommendation ?? 'none'}</p>
                  </div>
                </div>

                {appeal.appeal_rationale && (
                  <div className="bg-brand-twilight border border-slate-800 rounded-xl p-3 text-xs text-slate-300">
                    <p className="text-[10px] font-semibold text-brand-sandstone/60 mb-1">Appellant Statement</p>
                    <p>{appeal.appeal_rationale}</p>
                  </div>
                )}

                <AppealActionForm caseId={appeal.id} />
              </article>
            );
          })
        )}
      </main>
    </div>
  );
}
