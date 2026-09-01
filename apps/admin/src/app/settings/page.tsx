import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Settings, ShieldCheck, Database, Server, Key } from 'lucide-react';
import { createAdminSupabaseClient, getAdminSession } from '../../lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  const adminUser = await getAdminSession();
  if (!adminUser) redirect('/login');

  const supabase = await createAdminSupabaseClient();
  if (!supabase) redirect('/login');

  return (
    <div className="min-h-screen bg-brand-twilight text-brand-sandstone p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <h1 className="text-xl font-extrabold text-brand-sandstone flex items-center gap-2">
          <Settings className="w-6 h-6 text-brand-caribbeanSea" /> Platform Settings &amp; Infrastructure
        </h1>
        <Link href="/" className="text-xs text-brand-sandstone/60 hover:text-brand-sandstone">← Dashboard</Link>
      </div>

      <div className="bg-brand-dusk/70 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-sm font-bold text-brand-sandstone flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-brand-sunriseCoral" /> Security &amp; Ledger Compliance
        </h2>
        <div className="grid sm:grid-cols-2 gap-3 text-xs">
          <div className="bg-brand-twilight border border-slate-800 rounded-xl p-3 space-y-1">
            <p className="text-brand-sandstone/60">Ledger Invariant</p>
            <p className="text-brand-sunriseCoral font-bold">Sum-Zero Trigger Active</p>
          </div>
          <div className="bg-brand-twilight border border-slate-800 rounded-xl p-3 space-y-1">
            <p className="text-brand-sandstone/60">Idempotency Enforced</p>
            <p className="text-brand-sunriseCoral font-bold">Double-Entry Only</p>
          </div>
          <div className="bg-brand-twilight border border-slate-800 rounded-xl p-3 space-y-1">
            <p className="text-brand-sandstone/60">Row Level Security</p>
            <p className="text-brand-sunriseCoral font-bold">All 22 Tables Enforced</p>
          </div>
          <div className="bg-brand-twilight border border-slate-800 rounded-xl p-3 space-y-1">
            <p className="text-brand-sandstone/60">Admin Access Audit</p>
            <p className="text-brand-sunriseCoral font-bold">Append-Only Audit Logs</p>
          </div>
        </div>
      </div>

      <div className="bg-brand-dusk/70 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-sm font-bold text-brand-sandstone flex items-center gap-2">
          <Database className="w-4 h-4 text-brand-goldenHour" /> Environment &amp; Microservices
        </h2>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between py-2 border-b border-slate-800">
            <span className="text-brand-sandstone/60">Primary Web Console</span>
            <span className="font-mono text-slate-300">apps/web (Port 3000)</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-800">
            <span className="text-brand-sandstone/60">Admin Console Micro-Frontend</span>
            <span className="font-mono text-slate-300">apps/admin (Port 3001)</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-800">
            <span className="text-brand-sandstone/60">Moderation Console Micro-Frontend</span>
            <span className="font-mono text-slate-300">apps/moderation (Port 3002)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
