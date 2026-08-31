import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { BarChart3, Activity } from 'lucide-react';
import { createServiceSupabaseClient, getAuthorizedUser } from '../../../lib/supabase/server';
import AccessDenied from '../../../components/access-denied';

export const dynamic = 'force-dynamic';

export default async function WebAdminAnalyticsPage() {
  const auth = await getAuthorizedUser(['admin', 'management', 'superadmin']);
  if (!auth.isLoggedIn) {
    redirect('/login?next=/admin/analytics');
  }
  if (!auth.isAuthorized) {
    return (
      <AccessDenied
        user={auth.user}
        requiredRole="admin"
        currentRole={auth.role}
        resourceName="Admin Analytics & Platform Metrics"
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

  const [
    eventsTotalResult,
    eventsTodayResult,
    usersTotalResult,
    newUsers7dResult,
    postsTotalResult,
    paymentsTotalResult,
    recentEventsResult,
  ] = await Promise.all([
    supabase.from('analytics_events').select('id', { count: 'exact', head: true }),
    supabase.from('analytics_events').select('id', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 86400000).toISOString()),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString()),
    supabase.from('posts').select('id', { count: 'exact', head: true }),
    supabase.from('payment_intents').select('id', { count: 'exact', head: true }).eq('status', 'succeeded'),
    supabase.from('analytics_events').select('id, event_name, entity_type, created_at')
      .order('created_at', { ascending: false }).limit(20),
  ]);

  const recentEvents = (recentEventsResult.data ?? []) as Array<{
    id: string;
    event_name: string;
    entity_type: string;
    created_at: string;
  }>;

  const metrics = [
    { label: 'Events (24h)', value: (eventsTodayResult.count ?? 0).toLocaleString(), delta: 'Realtime activity', color: 'text-brand-sunriseCoral' },
    { label: 'Total Events', value: (eventsTotalResult.count ?? 0).toLocaleString(), delta: 'All-time volume', color: 'text-brand-caribbeanSea' },
    { label: 'Total Profiles', value: (usersTotalResult.count ?? 0).toLocaleString(), delta: `+${newUsers7dResult.count ?? 0} this week`, color: 'text-brand-goldenHour' },
    { label: 'Total Posts', value: (postsTotalResult.count ?? 0).toLocaleString(), delta: 'Platform posts', color: 'text-brand-sandstone' },
    { label: 'Succeeded Payments', value: (paymentsTotalResult.count ?? 0).toLocaleString(), delta: 'Platform transactions', color: 'text-brand-sunriseCoral' },
  ];

  return (
    <div className="min-h-screen bg-transparent text-brand-sandstone p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <h1 className="text-xl font-extrabold text-brand-sandstone flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-brand-caribbeanSea" /> Admin Analytics &amp; Platform Metrics
        </h1>
        <Link href="/admin" className="text-xs text-brand-sandstone/60 hover:text-brand-sandstone">← Admin Console</Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {metrics.map((m) => (
          <div key={m.label} className="bg-brand-dusk/70 border border-slate-800 rounded-2xl p-4 space-y-1">
            <p className="text-[11px] font-semibold text-brand-sandstone/60 uppercase">{m.label}</p>
            <p className={`text-2xl font-extrabold ${m.color}`}>{m.value}</p>
            <p className="text-[10px] text-brand-sandstone/40">{m.delta}</p>
          </div>
        ))}
      </div>

      <div className="bg-brand-dusk/70 border border-slate-800 rounded-2xl p-5 space-y-4">
        <h2 className="text-sm font-bold text-brand-sandstone flex items-center gap-2">
          <Activity className="w-4 h-4 text-brand-goldenHour" /> Recent Event Feed
        </h2>
        {recentEvents.length === 0 ? (
          <p className="text-xs text-brand-sandstone/40">No analytics events recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-slate-300">
              <thead className="bg-brand-twilight text-[11px] text-brand-sandstone/60 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3 text-left">Event Name</th>
                  <th className="p-3 text-left">Entity Type</th>
                  <th className="p-3 text-left">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {recentEvents.map((evt) => (
                  <tr key={evt.id} className="hover:bg-brand-dusk/30 transition-colors">
                    <td className="p-3 font-semibold text-brand-sandstone">{evt.event_name}</td>
                    <td className="p-3 text-brand-sandstone/60 capitalize">{evt.entity_type || 'system'}</td>
                    <td className="p-3 text-brand-sandstone/40">{new Date(evt.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
