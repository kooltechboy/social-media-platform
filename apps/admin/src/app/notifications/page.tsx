import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Bell, Send, CheckCircle, ShieldAlert } from 'lucide-react';
import { createAdminSupabaseClient, getAdminSession } from '../../lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function AdminNotificationsPage() {
  const adminUser = await getAdminSession();
  if (!adminUser) redirect('/login');

  const supabase = await createAdminSupabaseClient();
  if (!supabase) redirect('/login');

  const { data, count } = await supabase
    .from('notifications')
    .select('id, recipient_id, kind, title, body, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(50);

  const notifications = (data ?? []) as Array<{
    id: string;
    recipient_id: string;
    kind: string;
    title: string | null;
    body: string | null;
    created_at: string;
  }>;

  return (
    <div className="min-h-screen bg-brand-twilight text-brand-sandstone p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <h1 className="text-xl font-extrabold text-brand-sandstone flex items-center gap-2">
          <Bell className="w-6 h-6 text-brand-goldenHour" /> System Notifications &amp; Alerts
          <span className="text-sm font-normal text-brand-sandstone/40 ml-2">{(count ?? 0).toLocaleString()} sent</span>
        </h1>
        <Link href="/" className="text-xs text-brand-sandstone/60 hover:text-brand-sandstone">← Dashboard</Link>
      </div>

      <div className="bg-brand-dusk/70 border border-slate-800 rounded-2xl p-5 space-y-4">
        <h2 className="text-sm font-bold text-brand-sandstone">Recent System Dispatches</h2>
        {notifications.length === 0 ? (
          <p className="text-xs text-brand-sandstone/40">No notifications sent yet.</p>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <div key={n.id} className="flex items-start justify-between bg-brand-twilight border border-slate-800 rounded-xl p-4 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-brand-sandstone capitalize">{n.kind}</span>
                    {n.title && <span className="text-slate-300 font-semibold">— {n.title}</span>}
                  </div>
                  {n.body && <p className="text-brand-sandstone/60">{n.body}</p>}
                </div>
                <span className="text-brand-sandstone/40 text-[11px] flex-shrink-0 ml-4">
                  {new Date(n.created_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
