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
      <div className="surface-card p-5 rounded-2xl flex items-start gap-4 border border-white/10">
        <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-400 shrink-0 mt-0.5 border border-orange-500/20">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="space-y-1.5 text-xs sm:text-sm">
          <div className="font-black text-white flex flex-wrap items-center gap-2">
            <span className="text-base">TUKUBI Financial Center</span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Double-Entry Ledger Verified
            </span>
          </div>
          <p className="text-brand-sandstone/80 leading-relaxed">
            TUKUBI orchestrates digital commerce, marketplace, creator earnings, and event ticketing with direct double-entry ledger safety. All monetary processing, card tokenization, and regulated fund movements are securely executed via authorized banking and licensed payment service providers.
          </p>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Payment Methods */}
        <div className="surface-card surface-card-interactive p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-orange-400 uppercase tracking-wider">
              Payment Methods
            </span>
            <CreditCard className="w-5 h-5 text-orange-400" />
          </div>
          <div className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            {paymentMethodsCount}{' '}
            <span className="text-xs text-brand-sandstone/70 font-bold uppercase tracking-wider">saved</span>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs">
            <span className="text-brand-sandstone/70">Cards, Apple &amp; Google Pay</span>
            <Link
              href="/financial-center/payment-methods"
              className="text-orange-400 hover:text-orange-300 font-black flex items-center gap-1 min-h-[36px]"
            >
              Manage →
            </Link>
          </div>
        </div>

        {/* Connected Provider Accounts */}
        <div className="surface-card surface-card-interactive p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-amber-400 uppercase tracking-wider">
              Connected Providers
            </span>
            <Building2 className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            {connectedProvidersCount}{' '}
            <span className="text-xs text-brand-sandstone/70 font-bold uppercase tracking-wider">active</span>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs">
            <span className="text-brand-sandstone/70">PayPal, CX Pay, WiPay</span>
            <Link
              href="/financial-center/accounts"
              className="text-amber-400 hover:text-amber-300 font-black flex items-center gap-1 min-h-[36px]"
            >
              Configure →
            </Link>
          </div>
        </div>

        {/* Creator Earnings */}
        <div className="surface-card surface-card-interactive p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-emerald-400 uppercase tracking-wider">
              Creator Earnings
            </span>
            <Sparkles className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            {hasCreatorAccount ? creatorPendingFormatted : 'Not Enrolled'}
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs">
            <span className="text-brand-sandstone/70">Memberships &amp; tips</span>
            <Link
              href="/financial-center/creator"
              className="text-emerald-400 hover:text-emerald-300 font-black flex items-center gap-1 min-h-[36px]"
            >
              View Studio →
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Action Portals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Link
          href="/financial-center/transactions"
          className="surface-card surface-card-interactive p-6 rounded-2xl flex items-center justify-between group min-h-[72px]"
        >
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-xl bg-purple-500/15 text-purple-300 border border-purple-500/30 group-hover:scale-105 transition-transform">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-black text-white group-hover:text-orange-400 transition-colors">Transactions &amp; Orders</h4>
              <p className="text-xs sm:text-sm text-brand-sandstone/70">Inspect ledger receipts, orders, and settlements</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-brand-sandstone/50 group-hover:text-white transition-colors" />
        </Link>

        <Link
          href="/financial-center/security"
          className="surface-card surface-card-interactive p-6 rounded-2xl flex items-center justify-between group min-h-[72px]"
        >
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-black text-white group-hover:text-orange-400 transition-colors">Payment Security &amp; Keys</h4>
              <p className="text-xs sm:text-sm text-brand-sandstone/70">Manage authorization policies and 2FA protection</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-brand-sandstone/50 group-hover:text-white transition-colors" />
        </Link>
      </div>
    </div>
  );
}
