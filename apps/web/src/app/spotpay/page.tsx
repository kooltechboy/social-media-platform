import React from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Wallet, ArrowUpRight, ArrowDownLeft, ShieldCheck, Send, CreditCard } from 'lucide-react';
import { createSupabaseServerClient, getCurrentUser } from '../../lib/supabase/server';
import { Money } from '@caribbean/spotpay';
import SpotPayHubActions from '../../components/spotpay-hub-actions';

export const dynamic = 'force-dynamic';

interface LedgerAccount {
  id: string;
  account_type: string;
  currency: string;
}

interface LedgerEntry {
  id: string;
  transaction_id: string;
  amount: number;
  entry_type: 'DEBIT' | 'CREDIT';
  description: string | null;
  created_at: string;
  ledger_accounts: { account_type: string; currency: string } | null;
}

interface PaymentMethod {
  id: string;
  provider: string;
  method_kind: string;
  brand: string | null;
  last4: string | null;
  is_default: boolean;
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function accountTypeLabel(type: string): string {
  switch (type) {
    case 'spotpay_wallet': return 'SpotPay Wallet';
    case 'creator_pending': return 'Creator Earnings';
    case 'platform_revenue': return 'Platform Revenue';
    case 'stripe_escrow': return 'Stripe Escrow';
    case 'paypal_escrow': return 'PayPal Escrow';
    default: return type;
  }
}

function methodLabel(method: PaymentMethod): string {
  if (method.method_kind === 'card') {
    return `${method.brand ?? 'Card'} ••••${method.last4 ?? ''}`;
  }
  if (method.method_kind === 'apple_pay') return 'Apple Pay';
  if (method.method_kind === 'google_pay') return 'Google Pay';
  if (method.method_kind === 'paypal') return 'PayPal';
  if (method.method_kind === 'wallet') return 'SpotPay Wallet';
  return method.provider;
}

export default async function SpotPayPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect('/login');

  const [accountsResult, methodsResult] = await Promise.all([
    supabase
      .from('ledger_accounts')
      .select('id, account_type, currency')
      .eq('owner_id', user.id),
    supabase
      .from('payment_methods')
      .select('id, provider, method_kind, brand, last4, is_default')
      .eq('owner_id', user.id)
      .order('is_default', { ascending: false }),
  ]);

  const accounts = (accountsResult.data ?? []) as LedgerAccount[];
  const paymentMethods = (methodsResult.data ?? []) as PaymentMethod[];

  // Compute running balances per account from ledger entries
  const accountIds = accounts.map((a) => a.id);
  let recentEntries: LedgerEntry[] = [];
  const balanceByAccountId = new Map<string, number>();
  for (const account of accounts) {
    balanceByAccountId.set(account.id, 0);
  }

  if (accountIds.length > 0) {
    const [allResult, recentResult] = await Promise.all([
      supabase
        .from('ledger_entries')
        .select('account_id, amount, entry_type')
        .in('account_id', accountIds),
      supabase
        .from('ledger_entries')
        .select('id, transaction_id, amount, entry_type, description, created_at, ledger_accounts(account_type, currency)')
        .in('account_id', accountIds)
        .order('created_at', { ascending: false })
        .limit(20),
    ]);

    const balanceEntries = (allResult.data ?? []) as Array<{ account_id: string; amount: number; entry_type: string }>;
    for (const entry of balanceEntries) {
      const current = balanceByAccountId.get(entry.account_id) ?? 0;
      const delta = entry.entry_type === 'CREDIT' ? Number(entry.amount) : -Number(entry.amount);
      balanceByAccountId.set(entry.account_id, current + delta);
    }

    recentEntries = (recentResult.data ?? []) as unknown as LedgerEntry[];
  }

  const walletAccount = accounts.find((a) => a.account_type === 'spotpay_wallet');
  const creatorAccount = accounts.find((a) => a.account_type === 'creator_pending');

  const walletBalanceMinor = walletAccount ? Math.round((balanceByAccountId.get(walletAccount.id) ?? 0) * 100) : 0;
  const creatorBalanceMinor = creatorAccount ? Math.round((balanceByAccountId.get(creatorAccount.id) ?? 0) * 100) : 0;

  const walletCurrency = walletAccount?.currency ?? 'USD';
  const creatorCurrency = creatorAccount?.currency ?? 'USD';

  const walletMoney = new Money(Math.abs(walletBalanceMinor), walletCurrency);
  const creatorMoney = new Money(Math.abs(creatorBalanceMinor), creatorCurrency);

  return (
    <div className="min-h-screen bg-[#090D16] text-brand-sandstone p-4 md:p-6 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-brand-sandstone flex items-center gap-3">
            <Wallet className="w-8 h-8 text-brand-sunriseCoral" /> SpotPay Financial Hub
          </h1>
          <p className="text-sm text-brand-sandstone/60 mt-1">
            Double-entry ledger wallet, payment methods, and transaction history.
          </p>
        </div>
        <SpotPayHubActions walletBalanceFormatted={walletMoney.format()} />
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-brand-sunriseCoral/30 rounded-2xl p-6 space-y-3">
          <span className="text-xs font-bold text-brand-sunriseCoral uppercase tracking-wider">SpotPay Wallet Balance</span>
          {walletAccount ? (
            <>
              <div className="text-3xl font-black text-brand-sandstone">
                {walletMoney.format()}{' '}
                <span className="text-xs text-brand-sandstone/60 font-normal">{walletCurrency}</span>
              </div>
              <p className="text-xs text-brand-sandstone/60 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-brand-sunriseCoral" /> Double-entry ledger secured
              </p>
            </>
          ) : (
            <div className="text-sm text-brand-sandstone/60">No wallet account yet.</div>
          )}
        </div>

        <div className="bg-brand-dusk/80 border border-slate-800 rounded-2xl p-6 space-y-3">
          <span className="text-xs font-bold text-brand-caribbeanSea uppercase tracking-wider">Creator Pending Earnings</span>
          {creatorAccount ? (
            <>
              <div className="text-3xl font-black text-brand-sandstone">
                {creatorMoney.format()}{' '}
                <span className="text-xs text-brand-sandstone/60 font-normal">{creatorCurrency}</span>
              </div>
              <p className="text-xs text-brand-sandstone/60">Available for payout request</p>
            </>
          ) : (
            <div className="text-sm text-brand-sandstone/60">No creator account. <Link href="/creator-studio" className="text-brand-caribbeanSea hover:underline">Set up Creator Studio.</Link></div>
          )}
        </div>

        <div className="bg-brand-dusk/80 border border-slate-800 rounded-2xl p-6 space-y-3">
          <span className="text-xs font-bold text-brand-goldenHour uppercase tracking-wider">Payment Methods</span>
          {paymentMethods.length === 0 ? (
            <div className="text-sm text-brand-sandstone/60">No payment methods added.</div>
          ) : (
            <div className="flex flex-wrap gap-2 pt-1">
              {paymentMethods.map((method) => (
                <span
                  key={method.id}
                  className="px-2.5 py-1 rounded-md bg-brand-dusk text-xs font-bold text-slate-200 border border-slate-700 flex items-center gap-1"
                >
                  <CreditCard className="w-3 h-3 text-brand-sandstone/60" />
                  {methodLabel(method)}
                  {method.is_default && (
                    <span className="text-[9px] text-brand-sunriseCoral ml-0.5">DEFAULT</span>
                  )}
                </span>
              ))}
            </div>
          )}
          <p className="text-xs text-brand-sandstone/40">Tokenized — card numbers never stored</p>
        </div>
      </div>

      {/* Recent Ledger Transactions */}
      <div className="bg-brand-dusk/60 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-base font-bold text-brand-sandstone">Recent Ledger Entries</h3>
        {recentEntries.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-brand-sandstone/40">No transactions yet.</p>
            <p className="text-xs text-slate-600 mt-1">
              Transactions appear here after your first SpotPay activity.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-brand-twilight text-brand-sandstone/60 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3">Transaction ID</th>
                  <th className="p-3">Account</th>
                  <th className="p-3">Description</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {recentEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-brand-dusk/30 transition-colors">
                    <td className="p-3 font-mono text-[10px] text-brand-sandstone/40">
                      {entry.transaction_id.slice(0, 8)}…
                    </td>
                    <td className="p-3 text-slate-300">
                      {accountTypeLabel(entry.ledger_accounts?.account_type ?? '')}
                    </td>
                    <td className="p-3 text-brand-sandstone font-medium max-w-[200px] truncate">
                      {entry.description ?? '—'}
                    </td>
                    <td className="p-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          entry.entry_type === 'CREDIT'
                            ? 'bg-brand-sunriseCoral/20 text-emerald-300 border-brand-sunriseCoral/30'
                            : 'bg-brand-dusk text-brand-sandstone/60 border-slate-700'
                        }`}
                      >
                        {entry.entry_type}
                      </span>
                    </td>
                    <td
                      className={`p-3 font-bold ${
                        entry.entry_type === 'CREDIT' ? 'text-brand-sunriseCoral' : 'text-slate-300'
                      }`}
                    >
                      {entry.entry_type === 'CREDIT' ? '+' : '-'}
                      {new Money(Math.round(Math.abs(Number(entry.amount)) * 100), entry.ledger_accounts?.currency ?? 'USD').format()}
                    </td>
                    <td className="p-3 text-brand-sandstone/40">{relativeTime(entry.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-center text-[11px] text-slate-600">
        SpotPay uses a double-entry ledger. Every transaction is immutable and auditable.{' '}
        <ShieldCheck className="w-3 h-3 inline text-emerald-600" />
      </p>
    </div>
  );
}
