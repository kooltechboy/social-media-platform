'use client';

import React from 'react';
import { Receipt, ShieldCheck, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { Money } from '@caribbean/payments';

export interface TransactionEntryView {
  id: string;
  transactionId: string;
  amountMinor: number;
  currency: string;
  entryType: 'DEBIT' | 'CREDIT';
  description: string | null;
  accountType: string;
  createdAt: string;
}

interface TransactionHistoryTableProps {
  entries: TransactionEntryView[];
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
    case 'user_wallet':
    case 'wallet':
      return 'Account Ledger';
    case 'creator_pending':
      return 'Creator Earnings';
    case 'platform_revenue':
      return 'Platform Fee';
    case 'stripe_escrow':
      return 'Card Escrow';
    case 'paypal_escrow':
      return 'PayPal Escrow';
    case 'provider_escrow':
      return 'Provider Escrow';
    default:
      return type.replace(/_/g, ' ');
  }
}

export default function TransactionHistoryTable({ entries }: TransactionHistoryTableProps) {
  return (
    <div className="space-y-5 animate-fadeIn">
      <div className="surface-header p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white">Financial Transactions</h2>
          <p className="text-xs sm:text-sm text-brand-sandstone/80 mt-1">
            Immutable double-entry ledger records. Every monetary transaction is cryptographic, idempotent, and balanced.
          </p>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="surface-card text-center py-16 p-6 rounded-3xl space-y-3 max-w-lg mx-auto border border-white/10">
          <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/15 flex items-center justify-center mx-auto text-brand-sandstone/60">
            <Receipt className="w-7 h-7" />
          </div>
          <h3 className="text-base font-black text-white">No Transactions Yet</h3>
          <p className="text-xs sm:text-sm text-brand-sandstone/70 leading-relaxed">
            Transactions will appear here after your first order, subscription, creator tip, or payout.
          </p>
        </div>
      ) : (
        <div className="surface-card rounded-2xl overflow-hidden border border-white/15">
          <div className="overflow-x-auto scrollbar-none">
            <table className="w-full text-left text-xs text-brand-sandstone/90">
              <thead className="bg-black/40 text-brand-sandstone/70 uppercase text-[11px] font-black tracking-wider border-b border-white/10">
                <tr>
                  <th className="p-4">Tx Reference</th>
                  <th className="p-4">Account</th>
                  <th className="p-4">Description</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {entries.map((entry) => {
                  const money = new Money(Math.abs(entry.amountMinor), entry.currency);

                  return (
                    <tr key={entry.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 font-mono text-[11px] text-brand-sandstone/60">
                        {entry.transactionId.slice(0, 8)}…
                      </td>
                      <td className="p-4 text-white font-bold capitalize">
                        {accountTypeLabel(entry.accountType)}
                      </td>
                      <td className="p-4 text-white font-medium max-w-[240px] truncate">
                        {entry.description || 'Commerce Settlement'}
                      </td>
                      <td className="p-4">
                        <span
                          className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                            entry.entryType === 'CREDIT'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : 'bg-white/10 text-white border-white/20'
                          }`}
                        >
                          {entry.entryType}
                        </span>
                      </td>
                      <td
                        className={`p-4 font-black text-sm ${
                          entry.entryType === 'CREDIT' ? 'text-emerald-400' : 'text-white'
                        }`}
                      >
                        {entry.entryType === 'CREDIT' ? '+' : '-'}
                        {money.format()}
                      </td>
                      <td className="p-4 text-brand-sandstone/60 font-medium">{relativeTime(entry.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

