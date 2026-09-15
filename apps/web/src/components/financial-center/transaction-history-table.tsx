'use client';

import React, { useState } from 'react';
import { Receipt, ShieldCheck, ArrowUpRight, ArrowDownLeft, Layers, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { Money } from '@caribbean/payments';

export interface PaymentTransactionView {
  id: string;
  transactionType: string;
  amountMinor: number;
  feeAmountMinor: number;
  netAmountMinor: number;
  currency: string;
  provider: string;
  state: string;
  modelType: 'MODEL_A' | 'MODEL_B';
  role: 'PAYER' | 'RECIPIENT';
  description?: string;
  createdAt: string;
}

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
  paymentTransactions?: PaymentTransactionView[];
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

export default function TransactionHistoryTable({
  paymentTransactions = [],
  entries,
}: TransactionHistoryTableProps) {
  const [activeTab, setActiveTab] = useState<'payments' | 'ledger'>(
    paymentTransactions.length > 0 ? 'payments' : 'ledger'
  );

  return (
    <div className="space-y-5 animate-fadeIn">
      <div className="surface-header p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white">Financial Transactions</h2>
          <p className="text-xs sm:text-sm text-brand-sandstone/80 mt-1">
            Immutable double-entry ledger records. Every monetary transaction is cryptographic, idempotent, and balanced.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-black/40 p-1 rounded-xl border border-white/10 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('payments')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              activeTab === 'payments'
                ? 'bg-brand-coral text-white shadow'
                : 'text-brand-sandstone/70 hover:text-white'
            }`}
          >
            Payments ({paymentTransactions.length})
          </button>
          <button
            onClick={() => setActiveTab('ledger')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              activeTab === 'ledger'
                ? 'bg-brand-coral text-white shadow'
                : 'text-brand-sandstone/70 hover:text-white'
            }`}
          >
            Double-Entry Ledger ({entries.length})
          </button>
        </div>
      </div>

      {activeTab === 'payments' ? (
        paymentTransactions.length === 0 ? (
          <div className="surface-card text-center py-16 p-6 rounded-3xl space-y-3 max-w-lg mx-auto border border-white/10">
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/15 flex items-center justify-center mx-auto text-brand-sandstone/60">
              <Receipt className="w-7 h-7" />
            </div>
            <h3 className="text-base font-black text-white">No Payments Recorded Yet</h3>
            <p className="text-xs sm:text-sm text-brand-sandstone/70 leading-relaxed">
              Payments, marketplace orders, and fan subscriptions will appear here with live settlement status.
            </p>
          </div>
        ) : (
          <div className="surface-card rounded-2xl overflow-hidden border border-white/15">
            <div className="overflow-x-auto scrollbar-none">
              <table className="w-full text-left text-xs text-brand-sandstone/90">
                <thead className="bg-black/40 text-brand-sandstone/70 uppercase text-[11px] font-black tracking-wider border-b border-white/10">
                  <tr>
                    <th className="p-4">Tx ID</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Model</th>
                    <th className="p-4">Gross</th>
                    <th className="p-4">Platform Fee</th>
                    <th className="p-4">Net</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {paymentTransactions.map((tx) => {
                    const gross = new Money(tx.amountMinor, tx.currency);
                    const fee = new Money(tx.feeAmountMinor, tx.currency);
                    const net = new Money(tx.netAmountMinor, tx.currency);
                    const isPayer = tx.role === 'PAYER';

                    return (
                      <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-4 font-mono text-[11px] text-brand-sandstone/60">
                          {tx.id.slice(0, 8)}…
                        </td>
                        <td className="p-4 text-white font-bold">
                          {tx.transactionType.replace(/_/g, ' ')}
                        </td>
                        <td className="p-4">
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded border ${
                              tx.modelType === 'MODEL_A'
                                ? 'bg-brand-gold/10 text-brand-gold border-brand-gold/30'
                                : 'bg-brand-coral/10 text-brand-coral border-brand-coral/30'
                            }`}
                          >
                            {tx.modelType === 'MODEL_A' ? 'Platform' : 'Marketplace'}
                          </span>
                        </td>
                        <td className="p-4 font-medium text-white">
                          {gross.format()}
                        </td>
                        <td className="p-4 font-mono text-brand-sandstone/60">
                          {fee.format()}
                        </td>
                        <td
                          className={`p-4 font-black ${
                            isPayer ? 'text-white' : 'text-emerald-400'
                          }`}
                        >
                          {isPayer ? `-${gross.format()}` : `+${net.format()}`}
                        </td>
                        <td className="p-4">
                          <span
                            className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                              tx.state === 'COMPLETED'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                : tx.state === 'PENDING'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            }`}
                          >
                            {tx.state}
                          </span>
                        </td>
                        <td className="p-4 text-brand-sandstone/60 font-medium">
                          {relativeTime(tx.createdAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        /* Ledger Entries Tab */
        entries.length === 0 ? (
          <div className="surface-card text-center py-16 p-6 rounded-3xl space-y-3 max-w-lg mx-auto border border-white/10">
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/15 flex items-center justify-center mx-auto text-brand-sandstone/60">
              <Layers className="w-7 h-7" />
            </div>
            <h3 className="text-base font-black text-white">No Ledger Entries</h3>
            <p className="text-xs sm:text-sm text-brand-sandstone/70 leading-relaxed">
              Cryptographic double-entry ledger lines balance debit and credit accounts on every settlement.
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
        )
      )}
    </div>
  );
}
