import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Flag } from 'lucide-react';
import { createServiceSupabaseClient, getStaffUser } from '../../../lib/supabase/server';

export const dynamic = 'force-dynamic';

interface Report {
  id: string;
  target_type: string;
  reason: string;
  status: string;
  created_at: string;
  reporter: { username: string } | null;
}

export default async function WebAdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const user = await getStaffUser('admin');
  if (!user) redirect('/login');

  const supabase = await createServiceSupabaseClient();
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
    <div className="min-h-screen bg-[#090D16] text-brand-sandstone p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <h1 className="text-xl font-extrabold text-brand-sandstone flex items-center gap-2">
          <Flag className="w-6 h-6 text-brand-goldenHour" /> User Reports Directory
          <span className="text-sm font-normal text-brand-sandstone/40 ml-2">{(count ?? 0).toLocaleString()} {status}</span>
        </h1>
        <Link href="/admin" className="text-xs text-brand-sandstone/60 hover:text-brand-sandstone">← Admin Console</Link>
      </div>

      <div className="flex gap-2">
        {STATUS_TABS.map((s) => (
          <a
            key={s}
            href={`?status=${s}`}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors ${
              s === status
                ? 'bg-brand-caribbeanSea/20 text-brand-caribbeanSea border border-brand-caribbeanSea/40'
                : 'bg-brand-dusk text-brand-sandstone/60 hover:text-brand-sandstone border border-slate-800'
            }`}
          >
            {s}
          </a>
        ))}
      </div>

      <div className="bg-brand-dusk/70 border border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full text-sm text-slate-300">
          <thead className="bg-brand-twilight text-[11px] text-brand-sandstone/60 uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="p-3 text-left">Report ID</th>
              <th className="p-3 text-left">Type</th>
              <th className="p-3 text-left">Reason</th>
              <th className="p-3 text-left">Reporter</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs">
            {reports.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-brand-sandstone/40">No {status} reports.</td>
              </tr>
            ) : (
              reports.map((report) => (
                <tr key={report.id} className="hover:bg-brand-dusk/30 transition-colors">
                  <td className="p-3 font-mono text-[11px] text-brand-sandstone/40">{report.id.slice(0, 8)}…</td>
                  <td className="p-3 capitalize text-slate-300">{report.target_type}</td>
                  <td className="p-3 capitalize text-amber-300">{report.reason}</td>
                  <td className="p-3 text-brand-sandstone/60">
                    {report.reporter ? `@${(report.reporter as { username: string }).username}` : 'anonymous'}
                  </td>
                  <td className="p-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border capitalize ${
                      report.status === 'open' ? 'bg-brand-goldenHour/20 text-amber-300 border-brand-goldenHour/30' :
                      report.status === 'resolved' ? 'bg-brand-sunriseCoral/20 text-emerald-300 border-brand-sunriseCoral/30' :
                      'bg-brand-dusk text-brand-sandstone/60 border-slate-700'
                    }`}>
                      {report.status}
                    </span>
                  </td>
                  <td className="p-3 text-brand-sandstone/40">{new Date(report.created_at).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
