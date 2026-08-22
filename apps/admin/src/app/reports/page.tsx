import React from 'react';
import { redirect } from 'next/navigation';
import { Flag, Search } from 'lucide-react';
import { createAdminSupabaseClient, getAdminSession } from '../../lib/supabase/server';

export const dynamic = 'force-dynamic';

interface Report {
  id: string;
  target_type: string;
  reason: string;
  status: string;
  created_at: string;
  reporter: { username: string } | null;
}

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const adminUser = await getAdminSession();
  if (!adminUser) redirect('/login');

  const supabase = await createAdminSupabaseClient();
  if (!supabase) redirect('/login');

  const params = await searchParams;
  const status = params.status ?? 'open';
  const page = Math.max(1, parseInt(params.page ?? '1', 10));
  const pageSize = 50;
  const from = (page - 1) * pageSize;

  const { data, count } = await supabase
    .from('reports')
    .select('id, target_type, reason, status, created_at, reporter:reporter_id(username)', { count: 'exact' })
    .eq('status', status)
    .order('created_at', { ascending: false })
    .range(from, from + pageSize - 1);

  const reports = (data ?? []) as unknown as Report[];
  const totalPages = Math.ceil((count ?? 0) / pageSize);

  const STATUS_TABS = ['open', 'reviewing', 'resolved', 'dismissed'];

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
          <Flag className="w-6 h-6 text-amber-400" /> Reports
          <span className="text-sm font-normal text-slate-500 ml-2">{(count ?? 0).toLocaleString()} {status}</span>
        </h1>
        <a href="/" className="text-xs text-slate-400 hover:text-white">← Dashboard</a>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2">
        {STATUS_TABS.map((s) => (
          <a
            key={s}
            href={`?status=${s}`}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors ${
              s === status
                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {s}
          </a>
        ))}
      </div>

      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full text-sm text-slate-300">
          <thead className="bg-slate-950 text-[11px] text-slate-400 uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="p-3 text-left">Report ID</th>
              <th className="p-3 text-left">Type</th>
              <th className="p-3 text-left">Reason</th>
              <th className="p-3 text-left">Reporter</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {reports.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500 text-xs">No {status} reports.</td>
              </tr>
            ) : (
              reports.map((report) => (
                <tr key={report.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-3 font-mono text-[11px] text-slate-500">{report.id.slice(0, 8)}…</td>
                  <td className="p-3 capitalize text-slate-300">{report.target_type}</td>
                  <td className="p-3 capitalize text-amber-300">{report.reason}</td>
                  <td className="p-3 text-slate-400">
                    {report.reporter ? `@${(report.reporter as { username: string }).username}` : 'anonymous'}
                  </td>
                  <td className="p-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border capitalize ${
                      report.status === 'open' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                      report.status === 'resolved' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                      'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {report.status}
                    </span>
                  </td>
                  <td className="p-3 text-slate-500 text-xs">
                    {new Date(report.created_at).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 text-xs">
          {page > 1 && (
            <a href={`?status=${status}&page=${page - 1}`} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg">← Prev</a>
          )}
          <span className="text-slate-400">Page {page} of {totalPages}</span>
          {page < totalPages && (
            <a href={`?status=${status}&page=${page + 1}`} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg">Next →</a>
          )}
        </div>
      )}
    </div>
  );
}
