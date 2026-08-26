import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ShieldCheck, Search, Filter, Clock, User, ArrowLeft } from 'lucide-react';
import { createServiceSupabaseClient, getAuthorizedUser } from '../../../lib/supabase/server';
import AccessDenied from '../../../components/access-denied';
import AuditLogDetails from '../../../components/admin/audit-log-details';

export const dynamic = 'force-dynamic';

interface AuditLogEntry {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  actor: {
    username: string;
    display_name: string;
  } | null;
}

const ACTION_COLORS: Record<string, string> = {
  'platform.bootstrapped': 'bg-purple-500/20 text-purple-300 border-purple-500/40',
  'staff.created': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  'staff.role_updated': 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  'staff.revoked': 'bg-rose-500/20 text-rose-300 border-rose-500/40',
  'account.active': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  'account.suspended': 'bg-rose-500/20 text-rose-300 border-rose-500/40',
  'account.deactivated': 'bg-slate-700 text-slate-300 border-slate-600',
  'feature_flag.toggled': 'bg-sky-500/20 text-sky-300 border-sky-500/40',
};

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; q?: string; page?: string }>;
}) {
  const auth = await getAuthorizedUser(['super_admin', 'superadmin', 'management', 'admin']);
  if (!auth.isLoggedIn) {
    redirect('/login?next=/admin/audit-logs');
  }
  if (!auth.isAuthorized) {
    return (
      <AccessDenied
        user={auth.user}
        requiredRole="admin"
        currentRole={auth.role}
        resourceName="Immutable Platform Audit Trail"
      />
    );
  }

  const supabase = await createServiceSupabaseClient();
  if (!supabase) {
    return (
      <div className="min-h-screen bg-[#090D16] text-brand-sandstone flex items-center justify-center p-4">
        <p className="text-sm text-brand-sandstone/60">Service temporarily unavailable. Please try again.</p>
      </div>
    );
  }

  const params = await searchParams;
  const actionFilter = params.action ?? 'all';
  const query = params.q?.trim() ?? '';
  const page = Math.max(1, parseInt(params.page ?? '1', 10));
  const pageSize = 50;
  const from = (page - 1) * pageSize;

  let dbQuery = supabase
    .from('audit_logs')
    .select(`
      id,
      actor_id,
      action,
      entity_type,
      entity_id,
      metadata,
      created_at,
      actor:actor_id(username, display_name)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + pageSize - 1);

  if (actionFilter !== 'all') {
    dbQuery = dbQuery.eq('action', actionFilter);
  }

  const { data, count } = await dbQuery;
  let logs = (data ?? []) as unknown as AuditLogEntry[];

  if (query) {
    const qLower = query.toLowerCase();
    logs = logs.filter(
      (l) =>
        l.action.toLowerCase().includes(qLower) ||
        l.entity_type?.toLowerCase().includes(qLower) ||
        l.actor?.username?.toLowerCase().includes(qLower) ||
        l.actor?.display_name?.toLowerCase().includes(qLower)
    );
  }

  const totalPages = Math.ceil((count ?? 0) / pageSize);

  return (
    <div className="min-h-screen bg-[#090D16] text-brand-sandstone p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-brand-sandstone flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-brand-caribbeanSea" /> Security Audit Trail
            </h1>
            <span className="text-xs bg-slate-800 text-slate-300 font-semibold px-2 py-0.5 rounded-full">
              {(count ?? 0).toLocaleString()} Events
            </span>
          </div>
          <p className="text-xs text-brand-sandstone/60 mt-1">
            Immutable log of all staff mutations, privilege grants, and administrative executions.
          </p>
        </div>

        <Link
          href="/admin"
          className="text-xs text-brand-sandstone/60 hover:text-brand-sandstone"
        >
          ← Admin Console
        </Link>
      </div>

      {/* Filter bar */}
      <form method="GET" className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-sandstone/60" />
          <input
            name="q"
            defaultValue={query}
            placeholder="Search action, actor, or entity..."
            className="w-full bg-[#0F172A] border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-brand-sandstone placeholder:text-slate-600 focus:outline-none focus:border-brand-caribbeanSea"
          />
        </div>

        <select
          name="action"
          defaultValue={actionFilter}
          className="bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-xs text-brand-sandstone focus:outline-none focus:border-brand-caribbeanSea"
        >
          <option value="all">All Action Types</option>
          <option value="platform.bootstrapped">platform.bootstrapped</option>
          <option value="staff.created">staff.created</option>
          <option value="staff.role_updated">staff.role_updated</option>
          <option value="staff.revoked">staff.revoked</option>
          <option value="account.suspended">account.suspended</option>
          <option value="account.active">account.active</option>
          <option value="feature_flag.toggled">feature_flag.toggled</option>
        </select>

        <button
          type="submit"
          className="bg-brand-caribbeanSea hover:bg-sky-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition-colors"
        >
          Filter
        </button>
      </form>

      {/* Audit Log Table */}
      <div className="bg-brand-dusk/70 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#0F172A] text-[11px] text-brand-sandstone/60 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-3.5">Timestamp</th>
                <th className="p-3.5">Actor</th>
                <th className="p-3.5">Action Executed</th>
                <th className="p-3.5">Target Entity</th>
                <th className="p-3.5 text-right">Audit Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-brand-sandstone/40">
                    No audit records found matching your filters.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const badgeColor =
                    ACTION_COLORS[log.action] || 'bg-slate-800 text-slate-300 border-slate-700';

                  return (
                    <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-3.5 whitespace-nowrap text-brand-sandstone/70">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>{new Date(log.created_at).toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="p-3.5">
                        {log.actor ? (
                          <div>
                            <span className="font-semibold text-brand-sandstone">
                              {log.actor.display_name}
                            </span>
                            <p className="text-[10px] text-brand-sandstone/50">
                              @{log.actor.username}
                            </p>
                          </div>
                        ) : log.actor_id ? (
                          <span className="font-mono text-[11px] text-slate-400">
                            {log.actor_id.slice(0, 8)}...
                          </span>
                        ) : (
                          <span className="text-slate-500 font-semibold">System Root</span>
                        )}
                      </td>
                      <td className="p-3.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${badgeColor}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="p-3.5 text-brand-sandstone/60">
                        {log.entity_type ? (
                          <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-[11px] font-mono">
                            {log.entity_type}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="p-3.5 text-right">
                        <AuditLogDetails metadata={log.metadata} action={log.action} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 text-xs">
          {page > 1 && (
            <a
              href={`?action=${actionFilter}&q=${query}&page=${page - 1}`}
              className="px-3 py-1.5 bg-brand-dusk text-slate-200 rounded-lg"
            >
              ← Prev
            </a>
          )}
          <span className="text-brand-sandstone/60">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <a
              href={`?action=${actionFilter}&q=${query}&page=${page + 1}`}
              className="px-3 py-1.5 bg-brand-dusk text-slate-200 rounded-lg"
            >
              Next →
            </a>
          )}
        </div>
      )}
    </div>
  );
}
