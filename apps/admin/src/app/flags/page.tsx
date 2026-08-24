import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ToggleLeft, RefreshCw } from 'lucide-react';
import { createAdminSupabaseClient, getAdminSession } from '../../lib/supabase/server';
import AdminFlagToggle from '../../components/admin-flag-toggle';

export const dynamic = 'force-dynamic';

interface FeatureFlag {
  key: string;
  enabled: boolean;
  description: string | null;
}

export default async function AdminFlagsPage() {
  const adminUser = await getAdminSession();
  if (!adminUser) redirect('/login');

  const supabase = await createAdminSupabaseClient();
  if (!supabase) redirect('/login');

  const { data } = await supabase
    .from('feature_flags')
    .select('key, enabled, description')
    .order('key');

  const flags = (data ?? []) as FeatureFlag[];

  return (
    <div className="min-h-screen bg-[#090D16] text-brand-sandstone p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <h1 className="text-xl font-extrabold text-brand-sandstone flex items-center gap-2">
          <ToggleLeft className="w-6 h-6 text-brand-goldenHour" /> Feature Flags
          <span className="text-sm font-normal text-brand-sandstone/40 ml-2">{flags.length} total</span>
        </h1>
        <Link href="/" className="text-xs text-brand-sandstone/60 hover:text-brand-sandstone">← Dashboard</Link>
      </div>

      <p className="text-xs text-brand-sandstone/60">
        Flags gate server-side code paths and act as kill switches. Changes take effect immediately and are persisted to the{' '}
        <code className="text-slate-300">feature_flags</code> table. Every toggle is auditable.
      </p>

      <div className="space-y-2">
        {flags.map((flag) => (
          <AdminFlagToggle key={flag.key} flagKey={flag.key} enabled={flag.enabled} description={flag.description} />
        ))}
        {flags.length === 0 && (
          <div className="bg-brand-dusk/60 border border-dashed border-slate-800 rounded-2xl p-10 text-center">
            <p className="text-sm text-brand-sandstone/40">No feature flags in database.</p>
          </div>
        )}
      </div>
    </div>
  );
}
