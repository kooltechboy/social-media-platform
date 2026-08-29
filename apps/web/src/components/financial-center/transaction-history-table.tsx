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
    case 'spotpay_wallet':
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
    <div className="space-y-4 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white">Financial Transactions</h2>
          <p className="text-xs text-slate-400">
            Immutable double-entry ledger records. Every monetary transaction is cryptographic and balanced.
          </p>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-12 bg-brand-dusk/40 border border-slate-800 rounded-2xl space-y-2">
          <Receipt className="w-8 h-8 text-slate-500 mx-auto" />
          <h3 className="text-sm font-bold text-white">No Transactions Yet</h3>
          <p className="text-xs text-slate-400">
            Transactions will appear here after your first order, subscription, or creator payout.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-brand-dusk/60">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-3.5">Tx Reference</th>
                <th className="p-3.5">Account</th>
                <th className="p-3.5">Description</th>
                <th className="p-3.5">Type</th>
                <th className="p-3.5">Amount</th>
                <th className="p-3.5">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {entries.map((entry) => {
                const money = new Money(Math.abs(entry.amountMinor), entry.currency);

                return (
                  <tr key={entry.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-3.5 font-mono text-[10px] text-slate-400">
                      {entry.transactionId.slice(0, 8)}…
                    </td>
                    <td className="p-3.5 text-slate-300 font-medium capitalize">
                      {accountTypeLabel(entry.accountType)}
                    </td>
                    <td className="p-3.5 text-white font-medium max-w-[240px] truncate">
                      {entry.description || 'Commerce Settlement'}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          entry.entryType === 'CREDIT'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {entry.entryType}
                      </span>
                    </td>
                    <td
                      className={`p-3.5 font-bold ${
                        entry.entryType === 'CREDIT' ? 'text-emerald-400' : 'text-slate-200'
                      }`}
                    >
                      {entry.entryType === 'CREDIT' ? '+' : '-'}
                      {money.format()}
                    </td>
                    <td className="p-3.5 text-slate-400">{relativeTime(entry.createdAt)}</td>
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
