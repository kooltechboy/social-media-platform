'use client';

import React from 'react';
import Link from 'next/link';
import {
  CreditCard,
  Building2,
  Receipt,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Store,
  Ticket,
  AlertCircle,
} from 'lucide-react';
import ProviderStatusBadge from './provider-status-badge';

export interface FinancialOverviewProps {
  paymentMethodsCount: number;
  connectedProvidersCount: number;
  recentTransactionsCount: number;
  activeSubscriptionsCount: number;
  creatorPendingFormatted: string;
  hasCreatorAccount: boolean;
}

export default function FinancialOverview({
  paymentMethodsCount,
  connectedProvidersCount,
  recentTransactionsCount,
  activeSubscriptionsCount,
  creatorPendingFormatted,
  hasCreatorAccount,
}: FinancialOverviewProps) {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Ecosystem Architecture Notice */}
      <div className="p-4 rounded-2xl bg-brand-dusk/70 border border-slate-800 flex items-start gap-3.5">
        <div className="p-2 rounded-xl bg-brand-sunriseCoral/10 text-brand-sunriseCoral shrink-0 mt-0.5">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="space-y-1 text-xs">
          <div className="font-bold text-white flex items-center gap-2">
            <span>TUKUBI Financial Center</span>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Provider-Neutral
            </span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            TUKUBI orchestrates digital commerce, marketplace, creator earnings, and event ticketing. All monetary processing, card tokenization, and regulated fund movements are securely executed via authorized banking and licensed payment service providers.
          </p>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Payment Methods */}
        <div className="p-5 rounded-2xl bg-brand-dusk/60 border border-slate-800 hover:border-slate-700 transition-all space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-brand-sunriseCoral uppercase tracking-wider">
              Payment Methods
            </span>
            <CreditCard className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {paymentMethodsCount}{' '}
            <span className="text-xs text-slate-400 font-normal">saved</span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
            <span className="text-slate-400">Cards, Apple Pay, Google Pay</span>
            <Link
              href="/financial-center/payment-methods"
              className="text-brand-goldenHour hover:underline font-bold flex items-center gap-1"
            >
              Manage →
            </Link>
          </div>
        </div>

        {/* Connected Provider Accounts */}
        <div className="p-5 rounded-2xl bg-brand-dusk/60 border border-slate-800 hover:border-slate-700 transition-all space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-brand-caribbeanSea uppercase tracking-wider">
              Connected Providers
            </span>
            <Building2 className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {connectedProvidersCount}{' '}
            <span className="text-xs text-slate-400 font-normal">active</span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
            <span className="text-slate-400">PayPal, CX Pay, WiPay</span>
            <Link
              href="/financial-center/accounts"
              className="text-brand-caribbeanSea hover:underline font-bold flex items-center gap-1"
            >
              Configure →
            </Link>
          </div>
        </div>

        {/* Creator Earnings */}
        <div className="p-5 rounded-2xl bg-brand-dusk/60 border border-slate-800 hover:border-slate-700 transition-all space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-brand-goldenHour uppercase tracking-wider">
              Creator Earnings
            </span>
            <Sparkles className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {hasCreatorAccount ? creatorPendingFormatted : 'Not Enrolled'}
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
            <span className="text-slate-400">Memberships &amp; tips</span>
            <Link
              href="/financial-center/creator"
              className="text-brand-goldenHour hover:underline font-bold flex items-center gap-1"
            >
              View Studio →
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Action Portals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/financial-center/transactions"
          className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 group-hover:scale-105 transition-transform">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Transactions &amp; Orders</h4>
              <p className="text-xs text-slate-400">Inspect ledger receipts, orders, and settlements</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
        </Link>

        <Link
          href="/financial-center/security"
          className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Payment Security &amp; Keys</h4>
              <p className="text-xs text-slate-400">Manage authorization policies and 2FA protection</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
        </Link>
      </div>
    </div>
  );
}
