'use client';

import React, { useState, useActionState } from 'react';
import { Shield, UserX, AlertTriangle, Check, X } from 'lucide-react';
import {
  updateStaffRoleAction,
  toggleAccountStatusAction,
  revokeStaffAccessAction,
  ActionResponse,
} from '../../lib/admin/staff-actions';

interface StaffMember {
  id: string; // account id
  profileId: string;
  username: string;
  displayName: string;
  role: string;
  status: string;
  permissions: string[];
}

const ROLES = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'admin', label: 'Administrator' },
  { value: 'moderator', label: 'Trust & Safety Moderator' },
  { value: 'support', label: 'Support Specialist' },
  { value: 'content_manager', label: 'Content Manager' },
  { value: 'analyst', label: 'Data Analyst' },
];

const initialState: ActionResponse = { error: null, success: null };

export default function StaffRoleModal({
  staff,
  isCallerSuperAdmin,
  currentUserId,
}: {
  staff: StaffMember;
  isCallerSuperAdmin: boolean;
  currentUserId: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'role' | 'status' | 'revoke'>('role');

  const [roleState, roleAction, isRolePending] = useActionState(updateStaffRoleAction, initialState);
  const [statusState, statusAction, isStatusPending] = useActionState(toggleAccountStatusAction, initialState);
  const [revokeState, revokeAction, isRevokePending] = useActionState(revokeStaffAccessAction, initialState);

  const isSelf = staff.profileId === currentUserId;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-xs font-semibold text-brand-caribbeanSea hover:text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 px-2.5 py-1 rounded-lg transition-colors"
      >
        Manage
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#090D16] border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-brand-sandstone flex items-center gap-2">
                  <Shield className="w-5 h-5 text-brand-caribbeanSea" /> Manage Staff Access
                </h3>
                <p className="text-xs text-brand-sandstone/60 mt-0.5">
                  {staff.displayName} (@{staff.username})
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-500 hover:text-slate-300 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-2 border-b border-slate-800 pb-2 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('role')}
                className={`pb-1 px-2 border-b-2 transition-colors ${
                  activeTab === 'role'
                    ? 'border-brand-caribbeanSea text-brand-caribbeanSea'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Change Role
              </button>
              <button
                onClick={() => setActiveTab('status')}
                className={`pb-1 px-2 border-b-2 transition-colors ${
                  activeTab === 'status'
                    ? 'border-brand-caribbeanSea text-brand-caribbeanSea'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Account Status
              </button>
              {isCallerSuperAdmin && !isSelf && (
                <button
                  onClick={() => setActiveTab('revoke')}
                  className={`pb-1 px-2 border-b-2 transition-colors ${
                    activeTab === 'revoke'
                      ? 'border-rose-500 text-rose-400'
                      : 'border-transparent text-slate-400 hover:text-rose-300'
                  }`}
                >
                  Revoke Privileges
                </button>
              )}
            </div>

            {/* Tab 1: Change Role */}
            {activeTab === 'role' && (
              <form action={roleAction} className="space-y-4">
                <input type="hidden" name="accountId" value={staff.id} />
                <input type="hidden" name="targetProfileId" value={staff.profileId} />

                {roleState.error && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs">
                    {roleState.error}
                  </div>
                )}
                {roleState.success && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                    <Check className="w-4 h-4" /> {roleState.success}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-brand-sandstone/70 mb-1.5">
                    Select New System Role
                  </label>
                  <select
                    name="newRole"
                    defaultValue={staff.role}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl p-2.5 text-sm text-brand-sandstone focus:outline-none focus:border-brand-caribbeanSea"
                  >
                    {ROLES.filter((r) => isCallerSuperAdmin || (r.value !== 'super_admin' && r.value !== 'admin')).map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-sandstone/70 mb-1.5">
                    Reason / Administrative Note
                  </label>
                  <input
                    type="text"
                    name="notes"
                    placeholder="e.g. Promoted to Head of Moderation"
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl p-2.5 text-xs text-brand-sandstone placeholder:text-slate-600 focus:outline-none focus:border-brand-caribbeanSea"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={isRolePending}
                    className="bg-brand-caribbeanSea hover:bg-sky-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition-all disabled:opacity-50"
                  >
                    {isRolePending ? 'Saving...' : 'Update Role'}
                  </button>
                </div>
              </form>
            )}

            {/* Tab 2: Account Status */}
            {activeTab === 'status' && (
              <form action={statusAction} className="space-y-4">
                <input type="hidden" name="accountId" value={staff.id} />

                {statusState.error && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs">
                    {statusState.error}
                  </div>
                )}
                {statusState.success && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                    <Check className="w-4 h-4" /> {statusState.success}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-brand-sandstone/70 mb-1.5">
                    Account Status
                  </label>
                  <select
                    name="newStatus"
                    defaultValue={staff.status || 'active'}
                    disabled={isSelf}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl p-2.5 text-sm text-brand-sandstone focus:outline-none focus:border-brand-caribbeanSea disabled:opacity-50"
                  >
                    <option value="active">Active (Full access to role duties)</option>
                    <option value="suspended">Suspended (Temporarily block all staff login)</option>
                    <option value="deactivated">Deactivated (Permanently locked)</option>
                  </select>
                  {isSelf && (
                    <p className="text-[11px] text-amber-400 mt-1">You cannot change your own account status.</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-sandstone/70 mb-1.5">
                    Reason
                  </label>
                  <input
                    type="text"
                    name="reason"
                    placeholder="e.g. Leave of absence / security audit"
                    disabled={isSelf}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl p-2.5 text-xs text-brand-sandstone placeholder:text-slate-600 focus:outline-none focus:border-brand-caribbeanSea disabled:opacity-50"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={isStatusPending || isSelf}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition-all disabled:opacity-50"
                  >
                    {isStatusPending ? 'Updating...' : 'Save Status'}
                  </button>
                </div>
              </form>
            )}

            {/* Tab 3: Revoke Privileges */}
            {activeTab === 'revoke' && (
              <form action={revokeAction} className="space-y-4">
                <input type="hidden" name="accountId" value={staff.id} />

                {revokeState.error && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs">
                    {revokeState.error}
                  </div>
                )}
                {revokeState.success && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                    <Check className="w-4 h-4" /> {revokeState.success}
                  </div>
                )}

                <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 flex items-start gap-3 text-xs text-rose-300">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <p>
                    Revoking will demote @{staff.username} back to a standard member account and immediately strip all administrative capabilities and RLS access across the platform.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-sandstone/70 mb-1.5">
                    Revocation Reason (Logged to Audit Trail)
                  </label>
                  <input
                    type="text"
                    name="reason"
                    required
                    placeholder="e.g. End of contract / role transition"
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl p-2.5 text-xs text-brand-sandstone placeholder:text-slate-600 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isRevokePending}
                    className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <UserX className="w-4 h-4" />
                    {isRevokePending ? 'Revoking...' : 'Revoke Privileges'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
