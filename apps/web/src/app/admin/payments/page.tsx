import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Wallet, ShieldCheck } from 'lucide-react';
import { createServiceSupabaseClient, getAuthorizedUser } from '../../../lib/supabase/server';
import AccessDenied from '../../../components/access-denied';

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

export default async function WebAdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const auth = await getAuthorizedUser(['admin', 'management', 'superadmin']);
  if (!auth.isLoggedIn) {
    redirect('/login?next=/admin/payments');
  }
  if (!auth.isAuthorized) {
    return (
      <AccessDenied
        user={auth.user}
        requiredRole="admin"
        currentRole={auth.role}
        resourceName="the Payment Ledger & Financial Management Console"
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
    <div className="min-h-screen bg-[#090D16] text-brand-sandstone p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <h1 className="text-xl font-extrabold text-brand-sandstone flex items-center gap-2">
          <Wallet className="w-6 h-6 text-brand-sunriseCoral" /> Payment Ledger &amp; Transactions
        </h1>
        <Link href="/admin" className="text-xs text-brand-sandstone/60 hover:text-brand-sandstone">← Admin Console</Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-slate-900 to-emerald-950/30 border border-brand-sunriseCoral/30 rounded-2xl p-5">
          <p className="text-xs font-bold text-brand-sunriseCoral uppercase tracking-wider">Total Succeeded Revenue</p>
          <p className="text-3xl font-black text-brand-sandstone mt-2">{formatMinor(totalRevenue, 'USD')}</p>
          <p className="text-[11px] text-brand-sandstone/60 mt-1 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-brand-sunriseCoral" /> Double-entry verified
          </p>
        </div>
        <div className="bg-brand-dusk/70 border border-slate-800 rounded-2xl p-5">
          <p className="text-xs font-bold text-brand-caribbeanSea uppercase tracking-wider">Intents ({status})</p>
          <p className="text-3xl font-black text-brand-sandstone mt-2">{(intentsResult.count ?? 0).toLocaleString()}</p>
          <p className="text-[11px] text-brand-sandstone/60 mt-1">Page {page} of {totalPages || 1}</p>
        </div>
        <div className="bg-brand-dusk/70 border border-slate-800 rounded-2xl p-5">
          <p className="text-xs font-bold text-brand-goldenHour uppercase tracking-wider">SpotPay Financial</p>
          <p className="text-sm text-slate-300 mt-2">NASA-Grade Ledger</p>
          <p className="text-[11px] text-brand-sandstone/60 mt-1">Idempotent paired credit/debit records</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
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

      <div className="bg-brand-dusk/70 border border-slate-800 rounded-2xl overflow-x-auto">
        <table className="w-full text-sm text-slate-300">
          <thead className="bg-brand-twilight text-[11px] text-brand-sandstone/60 uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="p-3 text-left">Intent ID</th>
              <th className="p-3 text-left">Payer</th>
              <th className="p-3 text-left">Product</th>
              <th className="p-3 text-left">Amount</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs">
            {intents.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-brand-sandstone/40">No {status} payments found.</td>
              </tr>
            ) : (
              intents.map((intent) => (
                <tr key={intent.id} className="hover:bg-brand-dusk/30 transition-colors">
                  <td className="p-3 font-mono text-[11px] text-brand-sandstone/40">{intent.id.slice(0, 8)}…</td>
                  <td className="p-3 text-slate-300">
                    {intent.payer ? (intent.payer as { display_name: string }).display_name : '—'}
                  </td>
                  <td className="p-3 capitalize">{intent.product_type}</td>
                  <td className="p-3 font-bold text-brand-sunriseCoral">
                    {formatMinor(intent.amount_minor, intent.currency)}
                  </td>
                  <td className="p-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border capitalize ${
                      intent.status === 'succeeded' ? 'bg-brand-sunriseCoral/20 text-emerald-300 border-brand-sunriseCoral/30' :
                      'bg-brand-dusk text-brand-sandstone/60 border-slate-700'
                    }`}>
                      {intent.status}
                    </span>
                  </td>
                  <td className="p-3 text-brand-sandstone/40">{new Date(intent.created_at).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
