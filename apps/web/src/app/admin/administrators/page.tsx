import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Shield, UserPlus, Search, ShieldCheck, Key, AlertTriangle } from 'lucide-react';
import { createServiceSupabaseClient, getAuthorizedUser } from '../../../lib/supabase/server';
import AccessDenied from '../../../components/access-denied';
import StaffRoleModal from '../../../components/admin/staff-role-modal';

export const dynamic = 'force-dynamic';

interface StaffAccount {
  id: string; // account id
  profile_id: string;
  role: string;
  status: string;
  permissions: string[];
  assigned_at: string;
  notes: string | null;
  profile: {
    username: string;
    display_name: string;
    avatar_url: string | null;
    created_at: string;
  } | null;
}

const ROLE_BADGES: Record<string, { label: string; color: string }> = {
  super_admin: { label: 'SUPER ADMIN', color: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
  superadmin: { label: 'SUPER ADMIN', color: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
  management: { label: 'MANAGEMENT', color: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
  admin: { label: 'ADMIN', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
  moderator: { label: 'MODERATOR', color: 'bg-blue-500/20 text-blue-300 border-blue-500/40' },
  support: { label: 'SUPPORT', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
  content_manager: { label: 'CONTENT MGR', color: 'bg-purple-500/20 text-purple-300 border-purple-500/40' },
  analyst: { label: 'ANALYST', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' },
};

export default async function AdministratorsPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; q?: string }>;
}) {
  const auth = await getAuthorizedUser(['super_admin', 'superadmin', 'management', 'admin']);
  if (!auth.isLoggedIn) {
    redirect('/login?next=/admin/administrators');
  }
  if (!auth.isAuthorized) {
    return (
      <AccessDenied
        user={auth.user}
        requiredRole="admin"
        currentRole={auth.role}
        resourceName="Staff & Administrator Management"
      />
    );
  }

  const isSuperAdmin =
    auth.role === 'super_admin' || auth.role === 'superadmin' || auth.role === 'management';

  const supabase = await createServiceSupabaseClient();
  if (!supabase) {
    return (
      <div className="min-h-screen bg-transparent text-brand-sandstone flex items-center justify-center p-4">
        <p className="text-sm text-brand-sandstone/60">Service temporarily unavailable. Please try again.</p>
      </div>
    );
  }

  const params = await searchParams;
  const roleFilter = params.role ?? 'all';
  const query = params.q?.trim() ?? '';

  let dbQuery = supabase
    .from('accounts')
    .select(`
      id,
      profile_id,
      role,
      status,
      permissions,
      assigned_at,
      notes,
      profile:profile_id(username, display_name, avatar_url, created_at)
    `)
    .in('role', ['super_admin', 'superadmin', 'management', 'admin', 'moderator', 'support', 'content_manager', 'analyst'])
    .order('assigned_at', { ascending: false });

  if (roleFilter !== 'all') {
    dbQuery = dbQuery.eq('role', roleFilter);
  }

  const { data } = await dbQuery;
  let staffList = (data ?? []) as unknown as StaffAccount[];

  if (query) {
    const qLower = query.toLowerCase();
    staffList = staffList.filter(
      (s) =>
        s.profile?.username?.toLowerCase().includes(qLower) ||
        s.profile?.display_name?.toLowerCase().includes(qLower) ||
        s.role?.toLowerCase().includes(qLower)
    );
  }

  const countByRole = staffList.reduce((acc, curr) => {
    acc[curr.role] = (acc[curr.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-transparent text-brand-sandstone p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-brand-sandstone flex items-center gap-2">
              <Shield className="w-6 h-6 text-brand-caribbeanSea" /> Staff & Administrators
            </h1>
            <span className="text-xs bg-slate-800 text-slate-300 font-semibold px-2 py-0.5 rounded-full">
              {staffList.length} Active Staff
            </span>
          </div>
          <p className="text-xs text-brand-sandstone/60 mt-1">
            Supabase-backed Role Based Access Control (RBAC) & Administrative Directory.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/administrators/roles"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-sandstone/80 bg-brand-dusk hover:bg-slate-700 border border-slate-700 px-3 py-2 rounded-xl transition-colors"
          >
            <Key className="w-4 h-4 text-brand-goldenHour" /> Permissions Matrix
          </Link>
          <Link
            href="/admin/administrators/new"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-950 bg-brand-caribbeanSea hover:bg-sky-400 px-4 py-2 rounded-xl transition-all shadow-lg shadow-sky-500/20"
          >
            <UserPlus className="w-4 h-4" /> Create Administrator
          </Link>
        </div>
      </div>

      {/* Quick Role Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <Link
          href="/admin/administrators"
          className={`px-3 py-1.5 rounded-xl font-semibold transition-colors ${
            roleFilter === 'all'
              ? 'bg-brand-caribbeanSea text-slate-950 font-bold'
              : 'bg-brand-dusk text-brand-sandstone/60 hover:text-brand-sandstone hover:bg-slate-800'
          }`}
        >
          All Roles ({staffList.length})
        </Link>
        {[
          { id: 'super_admin', label: 'Super Admins' },
          { id: 'admin', label: 'Administrators' },
          { id: 'moderator', label: 'Moderators' },
          { id: 'support', label: 'Support' },
          { id: 'content_manager', label: 'Content Mgrs' },
          { id: 'analyst', label: 'Analysts' },
        ].map((tier) => (
          <Link
            key={tier.id}
            href={`/admin/administrators?role=${tier.id}`}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-colors whitespace-nowrap ${
              roleFilter === tier.id
                ? 'bg-brand-caribbeanSea text-slate-950 font-bold'
                : 'bg-brand-dusk text-brand-sandstone/60 hover:text-brand-sandstone hover:bg-slate-800'
            }`}
          >
            {tier.label}
          </Link>
        ))}
      </div>

      {/* Staff Table */}
      <div className="bg-brand-dusk/70 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-[#0F172A] text-[11px] text-brand-sandstone/60 uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="p-4">Staff Member</th>
              <th className="p-4">System Role</th>
              <th className="p-4">Status</th>
              <th className="p-4">Assigned</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs">
            {staffList.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-12 text-center text-brand-sandstone/40">
                  No staff members matching criteria.
                </td>
              </tr>
            ) : (
              staffList.map((staff) => {
                const badge = ROLE_BADGES[staff.role] || {
                  label: staff.role.toUpperCase(),
                  color: 'bg-slate-800 text-slate-300 border-slate-700',
                };
                const statusColor =
                  staff.status === 'active'
                    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                    : staff.status === 'suspended'
                    ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                    : 'text-rose-400 bg-rose-500/10 border-rose-500/30';

                return (
                  <tr key={staff.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-sky-950 border border-sky-800 text-brand-caribbeanSea font-bold flex items-center justify-center text-xs flex-shrink-0">
                          {staff.profile?.display_name?.slice(0, 2).toUpperCase() ?? 'ST'}
                        </div>
                        <div>
                          <p className="font-bold text-brand-sandstone text-sm">
                            {staff.profile?.display_name ?? 'Unknown Staff'}
                          </p>
                          <p className="text-brand-sandstone/50 text-xs">
                            @{staff.profile?.username ?? 'unnamed'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md border ${badge.color}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border capitalize ${statusColor}`}>
                        {staff.status || 'active'}
                      </span>
                    </td>
                    <td className="p-4 text-brand-sandstone/50">
                      {new Date(staff.assigned_at || Date.now()).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      <StaffRoleModal
                        staff={{
                          id: staff.id,
                          profileId: staff.profile_id,
                          username: staff.profile?.username ?? 'staff',
                          displayName: staff.profile?.display_name ?? 'Staff Member',
                          role: staff.role,
                          status: staff.status || 'active',
                          permissions: staff.permissions || [],
                        }}
                        isCallerSuperAdmin={isSuperAdmin}
                        currentUserId={auth.user?.id || ''}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Security Notice */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex items-center justify-between text-xs text-brand-sandstone/50">
        <span className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" /> All administrative actions, role updates, and privilege revocations are immutably logged.
        </span>
        <Link href="/admin/audit-logs" className="text-brand-caribbeanSea hover:underline font-semibold">
          View Audit Logs →
        </Link>
      </div>
    </div>
  );
}
