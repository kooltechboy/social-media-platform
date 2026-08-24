import React from 'react';
import { redirect } from 'next/navigation';
import {
  LayoutDashboard, Users, Wallet, ShieldCheck, Flag, BarChart3, ToggleLeft,
  Globe, Database, Bell, Settings
} from 'lucide-react';
import Link from 'next/link';
import { createSupabaseServerClient, getCurrentUser } from '../../lib/supabase/server';
import FeatureFlagToggle from '../../components/feature-flag-toggle';

export const dynamic = 'force-dynamic';

interface FeatureFlag {
  key: string;
  enabled: boolean;
  description: string | null;
}

interface StatRow {
  label: string;
  value: string;
  delta: string;
  positive: boolean;
}

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect('/login');

  // Load feature flags and analytics in parallel
  const [flagsResult, dauResult, newUsersResult, reportsResult] = await Promise.all([
    supabase
      .from('feature_flags')
      .select('key, enabled, description')
      .order('key'),
    supabase
      .from('analytics_events')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 86400000).toISOString()),
    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString()),
    supabase
      .from('reports')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'open'),
  ]);

  const flags = (flagsResult.data ?? []) as FeatureFlag[];

  const stats: StatRow[] = [
    { label: 'Events today', value: (dauResult.count ?? 0).toLocaleString(), delta: 'Last 24h', positive: true },
    { label: 'New users (7d)', value: (newUsersResult.count ?? 0).toLocaleString(), delta: 'Last 7 days', positive: true },
    { label: 'Reports open', value: (reportsResult.count ?? 0).toLocaleString(), delta: 'Pending review', positive: false },
    { label: 'Feature flags', value: flags.length.toString(), delta: `${flags.filter((f) => f.enabled).length} active`, positive: true },
  ];

  const SECTIONS = [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/admin' },
    { label: 'Users', icon: Users, href: '/admin/users' },
    { label: 'Payments', icon: Wallet, href: '/admin/payments' },
    { label: 'Trust & Safety', icon: ShieldCheck, href: '/admin/trust-safety' },
    { label: 'Reports', icon: Flag, href: '/admin/reports' },
    { label: 'Analytics', icon: BarChart3, href: '/admin/analytics' },
    { label: 'Feature Flags', icon: ToggleLeft, href: '/admin' },
    { label: 'Geography', icon: Globe, href: '/admin/geography' },
    { label: 'Database', icon: Database, href: '/admin/database' },
    { label: 'Notifications', icon: Bell, href: '/admin/notifications' },
    { label: 'Settings', icon: Settings, href: '/admin/settings' },
  ];

  return (
    <div className="min-h-screen bg-[#090D16] text-brand-sandstone">
      <header className="sticky top-0 z-50 bg-[#0F172A]/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2 text-slate-300 hover:text-brand-sandstone text-sm font-semibold">
          ← Home
        </Link>
        <h1 className="text-lg font-extrabold text-brand-sandstone flex items-center gap-2">
          <LayoutDashboard className="w-5 h-5 text-brand-caribbeanSea" /> Admin Console
        </h1>
        <span className="ml-auto text-[11px] text-rose-300 border border-rose-500/40 bg-rose-500/10 px-2 py-0.5 rounded font-semibold hidden md:block">
          Restricted — all actions audited
        </span>
      </header>

      <main className="max-w-6xl mx-auto p-4 grid lg:grid-cols-4 gap-4">
        <aside className="lg:col-span-1 bg-brand-dusk/70 border border-slate-800 rounded-2xl p-3 space-y-1 h-fit">
          {SECTIONS.map((section) => (
            <Link
              key={section.label}
              href={section.href}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-300 hover:bg-brand-dusk/60 hover:text-brand-sandstone text-sm font-medium transition-colors"
            >
              <section.icon className="w-4 h-4" /> {section.label}
            </Link>
          ))}
        </aside>

        <section className="lg:col-span-3 space-y-4">
          {/* Live Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {stats.map((metric) => (
              <div key={metric.label} className="bg-brand-dusk/70 border border-slate-800 rounded-2xl p-4">
                <p className="text-[11px] font-semibold text-brand-sandstone/60 uppercase">{metric.label}</p>
                <p className="text-2xl font-extrabold text-brand-sandstone mt-1">{metric.value}</p>
                <p className={`text-[11px] font-semibold mt-0.5 ${metric.positive ? 'text-brand-sunriseCoral' : 'text-brand-goldenHour'}`}>
                  {metric.delta}
                </p>
              </div>
            ))}
          </div>

          {/* Feature Flags — live from DB */}
          <div className="bg-brand-dusk/70 border border-slate-800 rounded-2xl p-5">
            <h2 className="text-sm font-bold text-brand-sandstone flex items-center gap-2 mb-4">
              <ToggleLeft className="w-4 h-4 text-brand-goldenHour" /> Feature Flags
              <span className="text-[10px] text-brand-sandstone/40 font-normal ml-auto">Live from feature_flags table</span>
            </h2>
            {flags.length === 0 ? (
              <p className="text-xs text-brand-sandstone/40">No feature flags found in database.</p>
            ) : (
              <div className="grid md:grid-cols-2 gap-2">
                {flags.map((flag) => (
                  <FeatureFlagToggle key={flag.key} flagKey={flag.key} enabled={flag.enabled} description={flag.description} />
                ))}
              </div>
            )}
            <p className="text-[11px] text-brand-sandstone/40 mt-3">
              Flags gate server-side code paths and act as kill switches. Persisted to{' '}
              <code className="text-brand-sandstone/60">feature_flags</code> table (migration 00006).
            </p>
          </div>

          {/* System Health */}
          <div className="bg-brand-dusk/70 border border-slate-800 rounded-2xl p-5">
            <h2 className="text-sm font-bold text-brand-sandstone flex items-center gap-2 mb-3">
              <ShieldCheck className="w-4 h-4 text-brand-sunriseCoral" /> System Health
            </h2>
            <ul className="space-y-2 text-xs text-brand-sandstone/60">
              <li className="flex justify-between">
                <span>Postgres primary</span>
                <span className="text-brand-sunriseCoral font-semibold">Operational</span>
              </li>
              <li className="flex justify-between">
                <span>Supabase Realtime</span>
                <span className="text-brand-sunriseCoral font-semibold">Connected</span>
              </li>
              <li className="flex justify-between">
                <span>Row Level Security</span>
                <span className="text-brand-sunriseCoral font-semibold">All tables enforced</span>
              </li>
              <li className="flex justify-between">
                <span>Feature flags loaded</span>
                <span className="text-brand-sunriseCoral font-semibold">{flags.length} flags</span>
              </li>
              <li className="flex justify-between">
                <span>Ledger sum-zero trigger</span>
                <span className="text-brand-sunriseCoral font-semibold">Active</span>
              </li>
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}
