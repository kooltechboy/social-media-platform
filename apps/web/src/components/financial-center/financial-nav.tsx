'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CreditCard,
  Building2,
  ArrowLeftRight,
  Receipt,
  RotateCcw,
  Repeat,
  Sparkles,
  Store,
  Ticket,
  FileText,
  ShieldCheck,
  HelpCircle,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/financial-center', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/financial-center/payment-methods', label: 'Payment Methods', icon: CreditCard },
  { href: '/financial-center/accounts', label: 'Connected Accounts', icon: Building2 },
  { href: '/financial-center/transactions', label: 'Transactions', icon: Receipt },
  { href: '/financial-center/transfers', label: 'Transfers', icon: ArrowLeftRight },
  { href: '/financial-center/refunds', label: 'Refunds', icon: RotateCcw },
  { href: '/financial-center/subscriptions', label: 'Subscriptions', icon: Repeat },
  { href: '/financial-center/creator', label: 'Creator Earnings', icon: Sparkles },
  { href: '/financial-center/merchant', label: 'Merchant Payouts', icon: Store },
  { href: '/financial-center/events', label: 'Event Revenue', icon: Ticket },
  { href: '/financial-center/statements', label: 'Statements', icon: FileText },
  { href: '/financial-center/security', label: 'Security & Access', icon: ShieldCheck },
  { href: '/financial-center/help', label: 'Help & Policies', icon: HelpCircle },
];

export default function FinancialNav() {
  const pathname = usePathname();

  return (
    <nav className="surface-card p-3 rounded-2xl">
      <div className="hidden lg:block px-3 py-2 text-[11px] font-black uppercase tracking-wider text-orange-400 border-b border-white/10 mb-2">
        Financial Center
      </div>
      <div className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible scrollbar-none pb-1 lg:pb-0">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap min-h-[44px] shrink-0 ${
                isActive
                  ? 'bg-gradient-to-r from-orange-500 via-amber-500 to-emerald-400 text-slate-950 font-black shadow-md shadow-orange-500/20'
                  : 'text-brand-sandstone/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-slate-950' : 'text-orange-400'}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

