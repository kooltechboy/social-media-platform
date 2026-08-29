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
    <nav className="space-y-1 bg-brand-dusk/60 border border-slate-800/80 rounded-2xl p-2 md:p-3">
      <div className="px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
        Financial Center
      </div>
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
              isActive
                ? 'bg-gradient-to-r from-brand-sunriseCoral to-brand-goldenHour text-slate-950 shadow-md shadow-brand-sunriseCoral/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
