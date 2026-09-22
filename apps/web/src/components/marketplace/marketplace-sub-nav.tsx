'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShoppingBag,
  Package,
  Heart,
  Tag,
  Store,
  Plus,
  Scale,
} from 'lucide-react';

const MARKETPLACE_TABS = [
  { href: '/marketplace', label: 'Browse Catalog', icon: ShoppingBag, exact: true },
  { href: '/marketplace/orders', label: 'My Orders', icon: Package },
  { href: '/marketplace/wishlist', label: 'Saved Wishlist', icon: Heart },
  { href: '/marketplace/offers', label: 'Offers', icon: Tag },
  { href: '/marketplace/disputes', label: 'Disputes & Protection', icon: Scale },
  { href: '/marketplace/seller-center', label: 'Seller Center', icon: Store },
];

export default function MarketplaceSubNav() {
  const pathname = usePathname();

  return (
    <div className="w-full bg-brand-dusk/90 border-b border-slate-800/80 backdrop-blur-md px-4 sm:px-6 py-3 mb-6 rounded-2xl">
      <div className="flex items-center justify-between gap-4 overflow-x-auto scrollbar-none">
        <nav className="flex items-center gap-1.5 sm:gap-2 shrink-0" aria-label="Marketplace Navigation">
          {MARKETPLACE_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.exact
              ? pathname === tab.href
              : pathname === tab.href || pathname.startsWith(`${tab.href}/`);

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 min-h-[38px] ${
                  isActive
                    ? 'bg-gradient-to-r from-brand-goldenHour to-brand-sunriseCoral text-slate-950 shadow-md shadow-brand-goldenHour/20'
                    : 'text-brand-sandstone/70 hover:text-brand-sandstone hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </nav>

        <Link
          href="/marketplace/seller-center/create"
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-caribbeanSea hover:bg-cyan-400 text-slate-950 font-black text-xs transition-all shrink-0 shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New Listing</span>
          <span className="sm:hidden">Sell</span>
        </Link>
      </div>
    </div>
  );
}
