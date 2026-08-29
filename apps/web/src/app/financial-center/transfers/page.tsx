import React from 'react';
import { createSupabaseServerClient, getCurrentUser } from '../../../lib/supabase/server';
import { ArrowLeftRight, Building, ShieldCheck } from 'lucide-react';
import { Money } from '@caribbean/payments';

export const dynamic = 'force-dynamic';

export default async function TransfersPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const { data: transfers } = await supabase
    .from('transfer_records')
    .select('id, amount_minor, currency, provider_id, status, created_at')
    .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
    .order('created_at', { ascending: false });

  const transferList = transfers ?? [];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-xl font-black text-white">Transfers &amp; Settlements</h2>
        <p className="text-xs text-slate-400">
          Direct bank settlement and inter-account transfers executed via licensed financial partner rails.
        </p>
      </div>

      {transferList.length === 0 ? (
        <div className="text-center py-12 bg-brand-dusk/40 border border-slate-800 rounded-2xl space-y-2">
          <ArrowLeftRight className="w-8 h-8 text-slate-500 mx-auto" />
          <h3 className="text-sm font-bold text-white">No Transfer Records</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Bank transfers and settlements will be listed here when you initiate disbursements or bank payouts.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-brand-dusk/60">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-3.5">Transfer ID</th>
                <th className="p-3.5">Provider</th>
                <th className="p-3.5">Amount</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {transferList.map((t: any) => {
                const money = new Money(t.amount_minor, t.currency || 'USD');
                return (
                  <tr key={t.id} className="hover:bg-slate-800/30">
                    <td className="p-3.5 font-mono text-[10px] text-slate-400">{t.id.slice(0, 8)}…</td>
                    <td className="p-3.5 font-bold uppercase">{t.provider_id}</td>
                    <td className="p-3.5 font-bold text-white">{money.format()}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-300">
                        {t.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-400">{new Date(t.created_at).toLocaleDateString()}</td>
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
