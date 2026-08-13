import React from 'react';
import { Wallet, ArrowUpRight, ArrowDownLeft, ShieldCheck, CreditCard, DollarSign, Send, RefreshCw } from 'lucide-react';

export default function SpotPayPage() {
  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 p-6 max-w-6xl mx-auto space-y-8">
      {/* SpotPay Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3">
            <Wallet className="w-8 h-8 text-emerald-400" /> SpotPay Financial Hub
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Native stored-value digital wallet & multi-gateway payment orchestration (Stripe, PayPal, Apple Pay, Google Pay).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-colors">
            <ArrowDownLeft className="w-4 h-4" /> Add Money
          </button>
          <button className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-colors">
            <Send className="w-4 h-4" /> Send SpotPay P2P
          </button>
        </div>
      </div>

      {/* Main Balance Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-emerald-500/30 rounded-2xl p-6 space-y-3">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">SpotPay Wallet Balance</span>
          <div className="text-3xl font-black text-white">$240.50 <span className="text-xs text-slate-400 font-normal">USD</span></div>
          <p className="text-xs text-slate-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Double-entry ledger secured
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-3">
          <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">Creator Pending Earnings</span>
          <div className="text-3xl font-black text-white">$1,850.00 <span className="text-xs text-slate-400 font-normal">USD</span></div>
          <p className="text-xs text-slate-400">Available for payout on 15th</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-3">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Active Payment Methods</span>
          <div className="flex items-center gap-2 pt-1">
            <span className="px-2.5 py-1 rounded-md bg-slate-800 text-xs font-bold text-slate-200 border border-slate-700">SpotPay Wallet</span>
            <span className="px-2.5 py-1 rounded-md bg-slate-800 text-xs font-bold text-slate-200 border border-slate-700">Stripe</span>
            <span className="px-2.5 py-1 rounded-md bg-slate-800 text-xs font-bold text-slate-200 border border-slate-700">Apple Pay</span>
          </div>
          <p className="text-xs text-slate-400">Linked to 1 local Caribbean bank</p>
        </div>
      </div>

      {/* Transaction History Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-base font-bold text-white">Recent Ledger Transactions</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-3">Transaction ID</th>
                <th className="p-3">Type</th>
                <th className="p-3">Description</th>
                <th className="p-3">Method</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              <tr>
                <td className="p-3 font-mono text-slate-400">tx_8932401</td>
                <td className="p-3 text-emerald-400 font-semibold">Tip Received</td>
                <td className="p-3 text-white font-medium">Fan Tip from @KingstonVibes</td>
                <td className="p-3">SpotPay Wallet</td>
                <td className="p-3 text-emerald-400 font-bold">+$10.00</td>
                <td className="p-3"><span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold">Completed</span></td>
              </tr>
              <tr>
                <td className="p-3 font-mono text-slate-400">tx_8932402</td>
                <td className="p-3 text-sky-400 font-semibold">Event Ticket</td>
                <td className="p-3 text-white font-medium">Trinidad Carnival Preview Entry</td>
                <td className="p-3">Stripe Cards</td>
                <td className="p-3 text-slate-200 font-bold">-$15.00</td>
                <td className="p-3"><span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold">Completed</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
