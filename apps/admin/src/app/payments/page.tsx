import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Wallet, DollarSign, ArrowUpRight, ArrowDownLeft, ShieldCheck, AlertCircle } from 'lucide-react';
import { createAdminSupabaseClient, getAdminSession } from '../../lib/supabase/server';

export const dynamic = 'force-dynamic';

interface PaymentIntent {
  id: string;
  product_type: string;
  amount_minor: number;
  currency: string;
  status: string;
  created_at: string;
  payer: { display_name: string; username: string } | null;
}

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const adminUser = await getAdminSession();
  if (!adminUser) redirect('/login');

  const supabase = await createAdminSupabaseClient();
  if (!supabase) redirect('/login');

  const params = await searchParams;
  const status = params.status ?? 'succeeded';
  const page = Math.max(1, parseInt(params.page ?? '1', 10));
  const pageSize = 50;
  const from = (page - 1) * pageSize;

  const [intentsResult, totalRevenueResult] = await Promise.all([
    supabase
      .from('payment_intents')
      .select('id, product_type, amount_minor, currency, status, created_at, payer:payer_id(display_name, username)', { count: 'exact' })
      .eq('status', status)
      .order('created_at', { ascending: false })
      .range(from, from + pageSize - 1),
    supabase
      .from('payment_intents')
      .select('amount_minor')
      .eq('status', 'succeeded'),
  ]);

  const intents = (intentsResult.data ?? []) as unknown as PaymentIntent[];
  const totalPages = Math.ceil((intentsResult.count ?? 0) / pageSize);
  const totalRevenue = (totalRevenueResult.data ?? [])
    .reduce((sum: number, r: { amount_minor: number }) => sum + r.amount_minor, 0);

  const STATUS_TABS = ['succeeded', 'failed', 'processing', 'requires_payment', 'cancelled'];

  function formatMinor(minor: number, currency: string): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency ?? 'USD' }).format(minor / 100);
  }

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
          <Wallet className="w-6 h-6 text-emerald-400" /> Payments
        </h1>
        <Link href="/" className="text-xs text-slate-400 hover:text-white">← Dashboard</Link>
      </div>

      {/* Revenue summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-slate-900 to-emerald-950/30 border border-emerald-500/30 rounded-2xl p-5">
          <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Total Succeeded Revenue</p>
          <p className="text-3xl font-black text-white mt-2">{formatMinor(totalRevenue, 'USD')}</p>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" /> All-time platform payments
          </p>
        </div>
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5">
          <p className="text-xs font-bold text-sky-400 uppercase tracking-wider">Total Intents ({status})</p>
          <p className="text-3xl font-black text-white mt-2">{(intentsResult.count ?? 0).toLocaleString()}</p>
          <p className="text-[11px] text-slate-400 mt-1">Page {page} of {totalPages || 1}</p>
        </div>
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5">
          <p className="text-xs font-bold text-amber-400 uppercase tracking-wider">Ledger Architecture</p>
          <p className="text-sm text-slate-300 mt-2">Double-entry ledger</p>
          <p className="text-[11px] text-slate-400 mt-1">Idempotency enforced · No mutable balances</p>
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex flex-wrap gap-2">
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

      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-x-auto">
        <table className="w-full text-sm text-slate-300">
          <thead className="bg-slate-950 text-[11px] text-slate-400 uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="p-3 text-left">Intent ID</th>
              <th className="p-3 text-left">Payer</th>
              <th className="p-3 text-left">Product</th>
              <th className="p-3 text-left">Amount</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {intents.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500 text-xs">No {status} payments.</td>
              </tr>
            ) : (
              intents.map((intent) => (
                <tr key={intent.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-3 font-mono text-[11px] text-slate-500">{intent.id.slice(0, 8)}…</td>
                  <td className="p-3 text-slate-300">
                    {intent.payer
                      ? `${(intent.payer as { display_name: string }).display_name}`
                      : '—'}
                  </td>
                  <td className="p-3 capitalize text-slate-300">{intent.product_type}</td>
                  <td className="p-3 font-bold text-emerald-400">
                    {formatMinor(intent.amount_minor, intent.currency)}
                  </td>
                  <td className="p-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border capitalize ${
                      intent.status === 'succeeded' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                      intent.status === 'failed' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' :
                      'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {intent.status}
                    </span>
                  </td>
                  <td className="p-3 text-slate-500 text-xs">
                    {new Date(intent.created_at).toLocaleString()}
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
