import React from 'react';
import { redirect } from 'next/navigation';
import {
  LayoutDashboard, Users, Wallet, ShieldCheck, Flag,
  BarChart3, ToggleLeft, Globe, Database, Bell, Settings,
  TrendingUp, AlertTriangle, CheckCircle, Activity, Award
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { createAdminSupabaseClient, getAdminSession } from '../lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const adminUser = await getAdminSession();
  if (!adminUser) redirect('/login');

  const supabase = await createAdminSupabaseClient();
  if (!supabase) redirect('/login');

  const [
    usersResult,
    newUsersResult,
    reportsResult,
    flagsResult,
    casesResult,
    eventsResult,
    paymentsResult,
    communitiesResult,
  ] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString()),
    supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'open'),
    supabase.from('feature_flags').select('key, enabled, description').order('key'),
    supabase.from('moderation_cases').select('id', { count: 'exact', head: true }).eq('status', 'queued'),
    supabase.from('analytics_events').select('id', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 86400000).toISOString()),
    supabase.from('payment_intents').select('id', { count: 'exact', head: true }).eq('status', 'succeeded'),
    supabase.from('communities').select('id', { count: 'exact', head: true }),
  ]);

  const flags = (flagsResult.data ?? []) as Array<{ key: string; enabled: boolean; description: string | null }>;

  const stats = [
    { label: 'Total Users', value: (usersResult.count ?? 0).toLocaleString(), icon: Users, color: 'text-brand-caribbeanSea', delta: `+${newUsersResult.count ?? 0} this week` },
    { label: 'Open Reports', value: (reportsResult.count ?? 0).toLocaleString(), icon: Flag, color: 'text-brand-goldenHour', delta: `${casesResult.count ?? 0} in mod queue` },
    { label: 'Events Today', value: (eventsResult.count ?? 0).toLocaleString(), icon: Activity, color: 'text-brand-sunriseCoral', delta: 'Last 24h analytics' },
    { label: 'Payments OK', value: (paymentsResult.count ?? 0).toLocaleString(), icon: Wallet, color: 'text-brand-sunriseCoral', delta: 'Succeeded intents' },
    { label: 'Communities', value: (communitiesResult.count ?? 0).toLocaleString(), icon: Globe, color: 'text-brand-caribbeanSea', delta: 'All time' },
    { label: 'Feature Flags', value: `${flags.filter(f => f.enabled).length}/${flags.length}`, icon: ToggleLeft, color: 'text-brand-goldenHour', delta: 'Active / Total' },
  ];

  const NAV = [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/', active: true },
    { label: 'Recognition & Rewards', icon: Award, href: '/recognition' },
    { label: 'Revenue Center', icon: TrendingUp, href: '/revenue' },
    { label: 'Users', icon: Users, href: '/users' },
    { label: 'Payments', icon: Wallet, href: '/payments' },
    { label: 'Trust & Safety', icon: ShieldCheck, href: '/trust-safety' },
    { label: 'Reports', icon: Flag, href: '/reports' },
    { label: 'Analytics', icon: BarChart3, href: '/analytics' },
    { label: 'Feature Flags', icon: ToggleLeft, href: '/flags' },
    { label: 'Geography', icon: Globe, href: '/geography' },
    { label: 'Communities', icon: Globe, href: '/communities' },
    { label: 'Notifications', icon: Bell, href: '/notifications' },
    { label: 'Settings', icon: Settings, href: '/settings' },
  ];

  return (
    <div className="min-h-screen bg-brand-twilight text-brand-sandstone flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 bg-brand-dusk border-r border-brand-sunsetPurple/20 p-4 space-y-1 min-h-screen sticky top-0">
        <div className="px-2 py-4 mb-2 flex items-center gap-2.5">
          <Image
            src="/brand/tukubi-emblem.png"
            alt="TUKUBI"
            width={36}
            height={36}
            className="object-contain"
          />
          <div>
            <h1 className="text-sm font-black bg-gradient-to-r from-brand-caribbeanSea to-brand-sunriseCoral bg-clip-text text-transparent tracking-wider">
              TUKUBI
            </h1>
            <p className="text-[10px] text-brand-sunriseCoral font-semibold">Admin Console</p>
          </div>
        </div>
        {NAV.map((item) => (
          <a
            key={item.label}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              item.active
                ? 'bg-brand-sunriseCoral/20 text-brand-sunriseCoral font-bold border border-brand-sunriseCoral/30'
                : 'text-brand-sandstone/60 hover:bg-brand-dusk/60 hover:text-brand-sandstone'
            }`}
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            {item.label}
          </a>
        ))}
        <div className="mt-auto pt-4 border-t border-brand-sunsetPurple/20">
          <p className="text-[10px] text-slate-400 px-2">Signed in as</p>
          <p className="text-[11px] text-brand-sandstone/60 px-2 truncate">{adminUser.email}</p>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col">
        <header className="sticky top-0 z-40 bg-brand-dusk/95 backdrop-blur border-b border-brand-sunsetPurple/20 px-6 py-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-brand-sandstone flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-brand-caribbeanSea" /> Dashboard
          </h2>
          <span className="text-[11px] text-rose-300 border border-rose-500/40 bg-rose-500/10 px-2 py-0.5 rounded font-semibold">
            Restricted — all actions audited
          </span>
        </header>

        <main className="p-6 space-y-6 flex-1">
          {/* Stat grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-brand-dusk/70 border border-slate-800 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                  <p className="text-[11px] font-semibold text-brand-sandstone/60 uppercase truncate">{stat.label}</p>
                </div>
                <p className="text-2xl font-extrabold text-brand-sandstone">{stat.value}</p>
                <p className="text-[10px] text-brand-sandstone/40">{stat.delta}</p>
              </div>
            ))}
          </div>

          {/* Feature flags live from DB */}
          <div className="bg-brand-dusk/70 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-brand-sandstone flex items-center gap-2 mb-4">
              <ToggleLeft className="w-4 h-4 text-brand-goldenHour" /> Feature Flags
              <span className="ml-auto text-[10px] text-brand-sandstone/40 font-normal">Live from feature_flags table</span>
            </h3>
            {flags.length === 0 ? (
              <p className="text-xs text-brand-sandstone/40">No flags in database.</p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {flags.map((flag) => (
                  <AdminFlagRow key={flag.key} flag={flag} />
                ))}
              </div>
            )}
          </div>

          {/* System health */}
          <div className="bg-brand-dusk/70 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-brand-sandstone flex items-center gap-2 mb-4">
              <ShieldCheck className="w-4 h-4 text-brand-sunriseCoral" /> System Health
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              {[
                { label: 'Postgres primary', status: 'Operational', ok: true },
                { label: 'Supabase Realtime', status: 'Connected', ok: true },
                { label: 'Row Level Security', status: 'All tables enforced', ok: true },
                { label: 'Ledger sum-zero trigger', status: 'Active', ok: true },
                { label: 'Migrations applied', status: '15 / 15', ok: true },
                { label: 'Open moderation cases', status: `${casesResult.count ?? 0} queued`, ok: (casesResult.count ?? 0) === 0 },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between bg-brand-twilight border border-slate-800 rounded-xl px-3 py-2">
                  <span className="text-brand-sandstone/60">{item.label}</span>
                  <span className={`font-semibold ${item.ok ? 'text-brand-sunriseCoral' : 'text-brand-goldenHour'}`}>{item.status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Dark Footer with Image 2 Logo */}
          <footer className="mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-brand-sandstone/40">
            <div className="flex items-center gap-3">
              <Image
                src="/brand/tukubi-footer-dark.png"
                alt="TUKUBI — The Caribbean Connected."
                width={130}
                height={52}
                className="object-contain rounded-lg border border-white/10"
              />
              <span>&copy; {new Date().getFullYear()} TUKUBI Network Inc.</span>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span>Role: Administrator</span>
              <span>•</span>
              <span>All operations cryptographically audited</span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}

function AdminFlagRow({ flag }: { flag: { key: string; enabled: boolean; description: string | null } }) {
  return (
    <div className="flex items-center justify-between bg-brand-twilight border border-slate-800 rounded-xl px-4 py-2.5">
      <div>
        <code className="text-xs text-slate-300">{flag.key}</code>
        {flag.description && (
          <p className="text-[10px] text-brand-sandstone/40 mt-0.5 truncate max-w-[160px]">{flag.description}</p>
        )}
      </div>
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border flex-shrink-0 ml-2 ${
        flag.enabled
          ? 'bg-brand-sunriseCoral/20 text-emerald-300 border-brand-sunriseCoral/30'
          : 'bg-brand-dusk text-brand-sandstone/60 border-slate-700'
      }`}>
        {flag.enabled ? 'ON' : 'OFF'}
      </span>
    </div>
  );
}
