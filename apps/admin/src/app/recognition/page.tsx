import React from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Award,
  Landmark,
  Crown,
  Shield,
  Trophy,
  Users,
  FlaskConical,
  Activity,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { createAdminSupabaseClient, getAdminSession } from '../../lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function AdminRecognitionDashboard() {
  const adminUser = await getAdminSession();
  if (!adminUser) redirect('/login');

  const supabase = await createAdminSupabaseClient();
  if (!supabase) redirect('/login');

  const [
    founderProgramsResult,
    founderMembersCountResult,
    badgesResult,
    userBadgesCountResult,
    achievementsResult,
    councilCountResult,
    ambassadorsCountResult,
    labsProgramsResult,
    recentAuditLogsResult,
  ] = await Promise.all([
    supabase.from('founder_programs').select('*').order('created_at'),
    supabase.from('founder_members').select('id', { count: 'exact', head: true }).eq('is_revoked', false),
    supabase.from('recognition_badges').select('*').order('display_priority', { ascending: false }),
    supabase.from('user_badges').select('id', { count: 'exact', head: true }).eq('is_revoked', false),
    supabase.from('recognition_achievements').select('*').order('display_order'),
    supabase.from('founders_council_members').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('ambassador_members').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('labs_programs').select('*').order('created_at', { ascending: false }),
    supabase.from('audit_logs').select('*').like('action', 'recognition%').or('action.like.founder%').order('created_at', { ascending: false }).limit(8),
  ]);

  const founderPrograms = founderProgramsResult.data ?? [];
  const badges = badgesResult.data ?? [];
  const achievements = achievementsResult.data ?? [];
  const labsPrograms = labsProgramsResult.data ?? [];
  const auditLogs = recentAuditLogsResult.data ?? [];

  const kpis = [
    { label: 'Total Founders', value: (founderMembersCountResult.count ?? 0).toLocaleString(), icon: Landmark, color: 'text-amber-400' },
    { label: 'Badges Issued', value: (userBadgesCountResult.count ?? 0).toLocaleString(), icon: Award, color: 'text-brand-caribbeanSea' },
    { label: 'Active Council Seats', value: (councilCountResult.count ?? 0).toLocaleString(), icon: Crown, color: 'text-purple-400' },
    { label: 'Ambassadors Appointed', value: (ambassadorsCountResult.count ?? 0).toLocaleString(), icon: Shield, color: 'text-emerald-400' },
  ];

  return (
    <div className="min-h-screen bg-brand-twilight text-brand-sandstone p-6 lg:p-10 space-y-8">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-xs font-bold text-slate-400 hover:text-white transition-colors flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" /> Admin Dashboard
          </Link>
          <span className="text-slate-700">|</span>
          <h1 className="text-xl font-black text-brand-sandstone flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" /> Status, Recognition &amp; Rewards Engine
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
            RBAC: Super Admin / Staff
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="bg-brand-dusk/70 border border-slate-800 rounded-3xl p-5 space-y-2 shadow-lg"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-brand-sandstone/60">{kpi.label}</span>
                <Icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
              <div className="text-2xl font-black text-brand-sandstone tracking-tight">{kpi.value}</div>
            </div>
          );
        })}
      </div>

      {/* Founder Programs Section */}
      <section className="bg-brand-dusk/50 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-brand-sandstone flex items-center gap-2">
              <Landmark className="w-4 h-4 text-amber-400" /> Master Founder Programs
            </h2>
            <p className="text-xs text-brand-sandstone/60">Strict atomic chronological sequence allocations</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {founderPrograms.map((fp) => {
            const percent = Math.min(100, Math.round((fp.current_count / fp.max_members) * 100));
            return (
              <div
                key={fp.id}
                className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                    {fp.slug}
                  </span>
                  <span className={`text-[10px] font-bold ${fp.is_closed ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {fp.is_closed ? 'CLOSED' : 'ACTIVE'}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-black text-brand-sandstone">{fp.name}</h4>
                  <p className="text-xs font-mono text-amber-200 mt-1">
                    Count: {fp.current_count.toLocaleString()} / {fp.max_members.toLocaleString()}
                  </p>
                </div>

                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-brand-caribbeanSea rounded-full"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Dynamic Badge Catalog */}
      <section className="bg-brand-dusk/50 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-brand-sandstone flex items-center gap-2">
              <Award className="w-4 h-4 text-brand-caribbeanSea" /> Badge Catalog ({badges.length})
            </h2>
            <p className="text-xs text-brand-sandstone/60">Database-driven badges configurable by administrators</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-brand-sandstone/60 border-b border-slate-800 uppercase font-black tracking-wider">
              <tr>
                <th className="p-3">Badge Name</th>
                <th className="p-3">Slug</th>
                <th className="p-3">Tier / Rarity</th>
                <th className="p-3">Recipients</th>
                <th className="p-3">Priority</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {badges.map((b) => (
                <tr key={b.id} className="hover:bg-slate-900/40">
                  <td className="p-3 font-bold text-brand-sandstone flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-brand-caribbeanSea" />
                    <span>{b.name}</span>
                  </td>
                  <td className="p-3 font-mono text-brand-sandstone/60">{b.slug}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 font-bold uppercase text-[10px]">
                      {b.tier} • {b.rarity}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-brand-sandstone">
                    {b.current_recipients_count} {b.max_recipients ? `/ ${b.max_recipients}` : '(unlimited)'}
                  </td>
                  <td className="p-3 font-mono text-amber-300">{b.display_priority}</td>
                  <td className="p-3">
                    <span className={`font-bold ${b.is_active ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {b.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* TUKUBI Labs & Audit Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Labs Programs */}
        <section className="bg-brand-dusk/50 border border-slate-800 rounded-3xl p-6 space-y-4">
          <h2 className="text-base font-black text-brand-sandstone flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-cyan-400" /> TUKUBI Labs Programs ({labsPrograms.length})
          </h2>
          <div className="space-y-3">
            {labsPrograms.map((lp) => (
              <div key={lp.id} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-brand-sandstone">{lp.title}</h4>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-500/30">
                    {lp.status}
                  </span>
                </div>
                <p className="text-xs text-brand-sandstone/60">{lp.description}</p>
                <div className="pt-2 flex items-center justify-between text-[11px] font-mono text-brand-sandstone/40">
                  <span>Feature: {lp.feature_key}</span>
                  <span>Enrolled: {lp.current_participants_count}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Audit Logs */}
        <section className="bg-brand-dusk/50 border border-slate-800 rounded-3xl p-6 space-y-4">
          <h2 className="text-base font-black text-brand-sandstone flex items-center gap-2">
            <FileText className="w-4 h-4 text-brand-goldenHour" /> Recent Recognition Audit Logs
          </h2>
          <div className="space-y-2.5">
            {auditLogs.length === 0 ? (
              <p className="text-xs text-brand-sandstone/40 italic p-4">No audit logs recorded yet.</p>
            ) : (
              auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-amber-300 font-bold">{log.action}</span>
                    <span className="text-[11px] text-brand-sandstone/40">
                      {new Date(log.created_at).toLocaleTimeString('en-US')}
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-brand-sandstone/60 truncate">
                    Entity: {log.entity_type} • ID: {log.entity_id}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
