'use client';

import React, { useActionState, useState } from 'react';
import Link from 'next/link';
import { UserPlus, Shield, Key, Mail, User, Info, Check, AlertCircle, ArrowLeft } from 'lucide-react';
import { createStaffAccountAction, ActionResponse } from '../../lib/admin/staff-actions';

const initialState: ActionResponse = {
  error: null,
  success: null,
};

const ROLE_OPTIONS = [
  {
    value: 'super_admin',
    label: 'Super Admin',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    description: 'Full root platform control: manage all administrators, permissions, financial ledgers, and system settings.',
  },
  {
    value: 'admin',
    label: 'Administrator',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    description: 'Operational admin: manage users, feature flags, payments, and lower staff (moderators, support, analysts).',
  },
  {
    value: 'moderator',
    label: 'Trust & Safety Moderator',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    description: 'Review moderation queue, inspect reports, apply content actions, and review appeals.',
  },
  {
    value: 'support',
    label: 'Support Specialist',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    description: 'Customer helpdesk: look up user profiles, assist with account verification and inquiries.',
  },
  {
    value: 'content_manager',
    label: 'Content Manager',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    description: 'Editorial curator: feature posts, curate communities, manage banners and announcements.',
  },
  {
    value: 'analyst',
    label: 'Data Analyst',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    description: 'Analytics & telemetry: inspect engagement trends, revenue metrics, and export data reports.',
  },
];

const PERMISSION_OPTIONS = [
  { id: 'manage_admins', label: 'Manage Administrators', desc: 'Create and revoke admin privileges' },
  { id: 'manage_users', label: 'Manage Users', desc: 'Verify, suspend, or manage member accounts' },
  { id: 'manage_content', label: 'Content Moderation', desc: 'Hide posts, take down illegal content' },
  { id: 'manage_payments', label: 'Financial & SpotPay', desc: 'Inspect ledger, payouts, and transactions' },
  { id: 'manage_feature_flags', label: 'Feature Flags', desc: 'Toggle kill switches and rollout percentages' },
  { id: 'view_audit_logs', label: 'View Audit Logs', desc: 'Access immutable platform action logs' },
  { id: 'view_analytics', label: 'Platform Analytics', desc: 'Access event telemetry and growth funnels' },
  { id: 'system_settings', label: 'System Settings', desc: 'Manage API configurations and platform rules' },
];

export default function StaffCreateForm({ isCallerSuperAdmin }: { isCallerSuperAdmin: boolean }) {
  const [state, formAction, isPending] = useActionState(createStaffAccountAction, initialState);
  const [selectedRole, setSelectedRole] = useState<string>('moderator');
  const [authMode, setAuthMode] = useState<'invite' | 'password'>('invite');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const handlePermissionToggle = (permId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permId) ? prev.filter((p) => p !== permId) : [...prev, permId]
    );
  };

  const availableRoles = isCallerSuperAdmin
    ? ROLE_OPTIONS
    : ROLE_OPTIONS.filter((r) => r.value !== 'super_admin' && r.value !== 'admin');

  return (
    <form action={formAction} className="space-y-6">
      {state.error && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 flex items-start gap-3 text-rose-300 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Creation Error</p>
            <p className="text-xs text-rose-300/80 mt-0.5">{state.error}</p>
          </div>
        </div>
      )}

      {state.success && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-start gap-3 text-emerald-300 text-sm">
          <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Account Initialized</p>
            <p className="text-xs text-emerald-300/80 mt-0.5">{state.success}</p>
            <div className="mt-3">
              <Link
                href="/admin/administrators"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-950 bg-emerald-400 px-3 py-1.5 rounded-lg hover:bg-emerald-300"
              >
                View Staff Directory →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Basic Identity */}
      <div className="bg-brand-dusk/70 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-brand-sandstone flex items-center gap-2">
          <User className="w-4 h-4 text-brand-caribbeanSea" /> Staff Identity
        </h3>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-brand-sandstone/70 mb-1">
              Full / Display Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              name="displayName"
              required
              placeholder="e.g. Maya Chen"
              className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-brand-sandstone placeholder:text-slate-600 focus:outline-none focus:border-brand-caribbeanSea"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-sandstone/70 mb-1">
              Staff Username <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500 font-semibold">@</span>
              <input
                type="text"
                name="username"
                required
                placeholder="maya_chen"
                pattern="[a-zA-Z0-9_]{3,30}"
                title="3-30 letters, numbers, or underscores"
                className="w-full bg-[#0F172A] border border-slate-700 rounded-xl pl-8 pr-3.5 py-2.5 text-sm text-brand-sandstone placeholder:text-slate-600 focus:outline-none focus:border-brand-caribbeanSea"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-brand-sandstone/70 mb-1">
            Email Address <span className="text-rose-400">*</span>
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="email"
              name="email"
              required
              placeholder="staff@caribbeanone.app"
              className="w-full bg-[#0F172A] border border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-brand-sandstone placeholder:text-slate-600 focus:outline-none focus:border-brand-caribbeanSea"
            />
          </div>
          <p className="text-[11px] text-brand-sandstone/40 mt-1">
            Must be a valid email for Supabase Auth identity verification.
          </p>
        </div>
      </div>

      {/* Role Selection */}
      <div className="bg-brand-dusk/70 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-brand-sandstone flex items-center gap-2">
          <Shield className="w-4 h-4 text-brand-goldenHour" /> Assigned Role & Tier
        </h3>

        <div className="grid md:grid-cols-2 gap-3">
          {availableRoles.map((role) => {
            const isSelected = selectedRole === role.value;
            return (
              <label
                key={role.value}
                onClick={() => setSelectedRole(role.value)}
                className={`relative flex flex-col p-4 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-sky-950/40 border-brand-caribbeanSea ring-1 ring-brand-caribbeanSea/50'
                    : 'bg-[#0F172A] border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm text-brand-sandstone">{role.label}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${role.badgeColor}`}>
                    {role.value.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-brand-sandstone/60 flex-1">{role.description}</p>
                <input
                  type="radio"
                  name="role"
                  value={role.value}
                  checked={isSelected}
                  onChange={() => setSelectedRole(role.value)}
                  className="sr-only"
                />
              </label>
            );
          })}
        </div>
      </div>

      {/* Permissions Overrides */}
      <div className="bg-brand-dusk/70 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-brand-sandstone flex items-center gap-2">
            <Key className="w-4 h-4 text-brand-sunriseCoral" /> Permissions & Granular Capabilities
          </h3>
          <span className="text-[11px] text-brand-sandstone/40">Optional overrides</span>
        </div>

        <p className="text-xs text-brand-sandstone/60">
          Selected role provides default permissions. You can grant explicit capabilities below:
        </p>

        <div className="grid md:grid-cols-2 gap-2.5">
          {PERMISSION_OPTIONS.map((perm) => {
            const isChecked = selectedPermissions.includes(perm.id);
            return (
              <label
                key={perm.id}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                  isChecked
                    ? 'bg-sky-950/30 border-sky-700/60'
                    : 'bg-[#0F172A] border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <input
                  type="checkbox"
                  name="permissions"
                  value={perm.id}
                  checked={isChecked}
                  onChange={() => handlePermissionToggle(perm.id)}
                  className="mt-0.5 rounded bg-slate-900 border-slate-700 text-brand-caribbeanSea focus:ring-0"
                />
                <div>
                  <p className="text-xs font-semibold text-brand-sandstone">{perm.label}</p>
                  <p className="text-[11px] text-brand-sandstone/40 mt-0.5">{perm.desc}</p>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* Authentication & Credentials Mode */}
      <div className="bg-brand-dusk/70 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-brand-sandstone flex items-center gap-2">
          <Key className="w-4 h-4 text-brand-caribbeanSea" /> Credentials Provisioning
        </h3>

        <div className="flex gap-4 border-b border-slate-800 pb-3 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setAuthMode('invite')}
            className={`pb-2 border-b-2 transition-colors ${
              authMode === 'invite'
                ? 'border-brand-caribbeanSea text-brand-caribbeanSea'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Send Supabase Email Invite (Recommended)
          </button>
          <button
            type="button"
            onClick={() => setAuthMode('password')}
            className={`pb-2 border-b-2 transition-colors ${
              authMode === 'password'
                ? 'border-brand-caribbeanSea text-brand-caribbeanSea'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Set Temporary Password
          </button>
        </div>

        {authMode === 'invite' ? (
          <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-4 flex items-start gap-3 text-xs text-brand-sandstone/70">
            <Info className="w-4 h-4 text-brand-caribbeanSea flex-shrink-0 mt-0.5" />
            <p>
              Supabase Auth will securely email an invitation link to the user. They will set their own private password and MFA upon first login. No plaintext credentials stored or shared.
            </p>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-semibold text-brand-sandstone/70 mb-1">
              Temporary Initial Password <span className="text-rose-400">*</span>
            </label>
            <input
              type="password"
              name="password"
              placeholder="Min 8 characters (must change on first login)"
              className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-brand-sandstone placeholder:text-slate-600 focus:outline-none focus:border-brand-caribbeanSea"
            />
            <p className="text-[11px] text-brand-sandstone/40 mt-1">
              User will be forced to change this password and configure 2FA upon signing in.
            </p>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-brand-sandstone/70 mb-1">
            Internal Provisioning Notes (Optional)
          </label>
          <textarea
            name="notes"
            rows={2}
            placeholder="e.g. Approved by Executive Board for Trust & Safety shifts"
            className="w-full bg-[#0F172A] border border-slate-700 rounded-xl p-3 text-xs text-brand-sandstone placeholder:text-slate-600 focus:outline-none focus:border-brand-caribbeanSea resize-none"
          />
        </div>
      </div>

      {/* Submission */}
      <div className="flex items-center justify-between pt-2">
        <Link
          href="/admin/administrators"
          className="inline-flex items-center gap-1.5 text-xs text-brand-sandstone/60 hover:text-brand-sandstone font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Cancel
        </Link>

        <button
          type="submit"
          disabled={isPending}
          className="bg-brand-caribbeanSea hover:bg-sky-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-sm transition-all flex items-center gap-2 shadow-lg shadow-sky-500/20 disabled:opacity-50"
        >
          <UserPlus className="w-4 h-4" />
          {isPending ? 'Provisioning Account...' : 'Create Staff Account'}
        </button>
      </div>
    </form>
  );
}
