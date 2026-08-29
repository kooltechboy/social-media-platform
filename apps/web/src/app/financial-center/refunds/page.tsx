import React from 'react';
import { createSupabaseServerClient, getCurrentUser } from '../../../lib/supabase/server';
import { RotateCcw } from 'lucide-react';
import { Money } from '@caribbean/payments';

export const dynamic = 'force-dynamic';

export default async function RefundsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const { data: refunds } = await supabase
    .from('refunds')
    .select('id, amount_minor, currency, reason, state, created_at, payment_intents!inner(payer_id)')
    .eq('payment_intents.payer_id', user.id)
    .order('created_at', { ascending: false });

  const refundList = refunds ?? [];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-xl font-black text-white">Refunds &amp; Reversals</h2>
        <p className="text-xs text-slate-400">
          Status of returned payments and ledger reversal entries. Authoritative provider status is required.
        </p>
      </div>

      {refundList.length === 0 ? (
        <div className="text-center py-12 bg-brand-dusk/40 border border-slate-800 rounded-2xl space-y-2">
          <RotateCcw className="w-8 h-8 text-slate-500 mx-auto" />
          <h3 className="text-sm font-bold text-white">No Refund Requests</h3>
          <p className="text-xs text-slate-400">
            Any approved order or ticket refunds will be tracked and credited here.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-brand-dusk/60">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-3.5">Refund ID</th>
                <th className="p-3.5">Reason</th>
                <th className="p-3.5">Amount</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {refundList.map((r: any) => {
                const money = new Money(r.amount_minor, r.currency || 'USD');
                return (
                  <tr key={r.id} className="hover:bg-slate-800/30">
                    <td className="p-3.5 font-mono text-[10px] text-slate-400">{r.id.slice(0, 8)}…</td>
                    <td className="p-3.5 text-white">{r.reason || 'Order Refund'}</td>
                    <td className="p-3.5 font-bold text-brand-sunriseCoral">+{money.format()}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {r.state}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-400">{new Date(r.created_at).toLocaleDateString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
