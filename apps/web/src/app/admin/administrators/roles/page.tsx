import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Shield, Key, Check, X, ArrowLeft, UserPlus } from 'lucide-react';
import { getAuthorizedUser } from '../../../../lib/supabase/server';
import AccessDenied from '../../../../components/access-denied';

export const dynamic = 'force-dynamic';

const ROLES = [
  { key: 'super_admin', label: 'Super Admin', color: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
  { key: 'admin', label: 'Administrator', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
  { key: 'moderator', label: 'Trust & Safety', color: 'bg-blue-500/20 text-blue-300 border-blue-500/40' },
  { key: 'support', label: 'Support Specialist', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
  { key: 'content_manager', label: 'Content Manager', color: 'bg-purple-500/20 text-purple-300 border-purple-500/40' },
  { key: 'analyst', label: 'Data Analyst', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' },
];

const CAPABILITIES = [
  {
    name: 'Manage Administrators & Roles',
    desc: 'Create, edit, suspend, and revoke administrative staff accounts',
    roles: { super_admin: true, admin: false, moderator: false, support: false, content_manager: false, analyst: false },
  },
  {
    name: 'Manage Feature Flags & Kill Switches',
    desc: 'Toggle system flags and progressive rollout percentages',
    roles: { super_admin: true, admin: true, moderator: false, support: false, content_manager: false, analyst: false },
  },
  {
    name: 'Manage Financials & Payment Ledger',
    desc: 'Inspect double-entry ledger accounts, transactions, and payouts',
    roles: { super_admin: true, admin: true, moderator: false, support: false, content_manager: false, analyst: false },
  },
  {
    name: 'Content Moderation & Take Downs',
    desc: 'Review flagged posts, comments, cases, and enforce bans',
    roles: { super_admin: true, admin: true, moderator: true, support: false, content_manager: true, analyst: false },
  },
  {
    name: 'Review Appeals & Sanctions',
    desc: 'Adjudicate user appeals on moderation sanctions and cases',
    roles: { super_admin: true, admin: true, moderator: true, support: false, content_manager: false, analyst: false },
  },
  {
    name: 'User Lookup & Verification',
    desc: 'Inspect user identity profiles, verified badges, and metadata',
    roles: { super_admin: true, admin: true, moderator: true, support: true, content_manager: false, analyst: false },
  },
  {
    name: 'Curate Content & Communities',
    desc: 'Feature editorial posts, curate top feeds and Caribbean communities',
    roles: { super_admin: true, admin: true, moderator: false, support: false, content_manager: true, analyst: false },
  },
  {
    name: 'Inspect Audit Logs & Security Events',
    desc: 'Access immutable security audit trail and actor history',
    roles: { super_admin: true, admin: true, moderator: false, support: false, content_manager: false, analyst: false },
  },
  {
    name: 'Telemetry & Analytics Pipelines',
    desc: 'View DAU/MAU, user retention, growth funnels, and event metrics',
    roles: { super_admin: true, admin: true, moderator: false, support: false, content_manager: false, analyst: true },
  },
];

export default async function RolesMatrixPage() {
  const auth = await getAuthorizedUser(['super_admin', 'superadmin', 'management', 'admin', 'moderator']);
  if (!auth.isLoggedIn) {
    redirect('/login?next=/admin/administrators/roles');
  }
  if (!auth.isAuthorized) {
    return (
      <AccessDenied
        user={auth.user}
        requiredRole="admin"
        currentRole={auth.role}
        resourceName="Roles & Permissions Matrix"
      />
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-brand-sandstone p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/administrators"
              className="text-brand-sandstone/50 hover:text-brand-sandstone transition-colors p-1"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-extrabold text-brand-sandstone flex items-center gap-2">
              <Key className="w-6 h-6 text-brand-goldenHour" /> Roles & Capabilities Matrix
            </h1>
          </div>
          <p className="text-xs text-brand-sandstone/60 mt-1 ml-7">
            Pre-defined RBAC tiers enforced by PostgreSQL Row Level Security & Server Middleware.
          </p>
        </div>

        <Link
          href="/admin/administrators/new"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-950 bg-brand-caribbeanSea hover:bg-sky-400 px-4 py-2 rounded-xl transition-all shadow-lg shadow-sky-500/20"
        >
          <UserPlus className="w-4 h-4" /> Create Staff Account
        </Link>
      </div>

      <div className="bg-brand-dusk/70 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#0F172A] text-[11px] uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-4 w-72">Platform Capability</th>
                {ROLES.map((role) => (
                  <th key={role.key} className="p-4 text-center">
                    <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${role.color}`}>
                      {role.label}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {CAPABILITIES.map((cap) => (
                <tr key={cap.name} className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-4">
                    <p className="font-bold text-brand-sandstone text-xs">{cap.name}</p>
                    <p className="text-[11px] text-brand-sandstone/50 mt-0.5">{cap.desc}</p>
                  </td>
                  {ROLES.map((role) => {
                    const isGranted = (cap.roles as Record<string, boolean>)[role.key];
                    return (
                      <td key={role.key} className="p-4 text-center">
                        {isGranted ? (
                          <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-900 text-slate-600 border border-slate-800">
                            <X className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
