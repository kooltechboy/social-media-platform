import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ToggleLeft, RefreshCw, Calendar, Sparkles, ShoppingBag, ShieldCheck } from 'lucide-react';
import { createAdminSupabaseClient, getAdminSession } from '../../lib/supabase/server';
import AdminFlagToggle from '../../components/admin-flag-toggle';
import { getLaunchConfigSnapshot } from '@caribbean/payments';

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
    .select('key, enabled, is_enabled, description')
    .order('key');

  const flags: FeatureFlag[] = (data ?? []).map((row: any) => ({
    key: row.key,
    enabled: Boolean(row.enabled ?? row.is_enabled ?? false),
    description: row.description ?? null,
  }));

  const snapshot = getLaunchConfigSnapshot();

  return (
    <div className="min-h-screen bg-brand-twilight text-brand-sandstone p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <h1 className="text-xl font-extrabold text-brand-sandstone flex items-center gap-2">
          <ToggleLeft className="w-6 h-6 text-brand-goldenHour" /> Feature Flags &amp; Launch Control
          <span className="text-sm font-normal text-brand-sandstone/40 ml-2">{flags.length} total</span>
        </h1>
        <Link href="/" className="text-xs text-brand-sandstone/60 hover:text-brand-sandstone">← Dashboard</Link>
      </div>

      {/* Phased Launch Overview Card */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-brand-goldenHour" /> Phased Production Launch Status
          </h2>
          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-brand-goldenHour/20 text-brand-goldenHour border border-brand-goldenHour/30">
            {snapshot.currentPhase}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
            <div className="text-slate-400 font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Creator Free Access
            </div>
            <div className="font-bold text-emerald-400">
              {snapshot.isCreatorFree ? '100% Free Active' : 'Paid Tiers Active'}
            </div>
            <div className="text-[10px] text-slate-400">Through October 31, 2026</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
            <div className="text-slate-400 font-semibold flex items-center gap-1.5">
              <ShoppingBag className="w-3.5 h-3.5 text-orange-400" /> Marketplace Transactions
            </div>
            <div className="font-bold text-orange-400">
              {snapshot.isMarketplaceCommerceActive ? 'Commerce Active' : 'Store Setup Phase'}
            </div>
            <div className="text-[10px] text-slate-400">Launches September 30, 2026</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
            <div className="text-slate-400 font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" /> Payments Integration
            </div>
            <div className="font-bold text-blue-400">PayPal Gateway</div>
            <div className="text-[10px] text-slate-400">Other rails: Coming Soon</div>
          </div>
        </div>
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
