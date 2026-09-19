'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  Tag,
  ShieldCheck,
  PlusCircle,
  Truck,
  Heart,
  Store,
  ChevronRight,
  Package,
} from 'lucide-react';
import { CANONICAL_CARIBBEAN_CATEGORIES } from '@caribbean/marketplace';

export interface MarketplaceRailProps {
  activeCategory?: string | null;
  activeTerritory?: string | null;
}

export default function MarketplaceRail({
  activeCategory,
  activeTerritory,
}: MarketplaceRailProps) {
  const CATEGORIES = CANONICAL_CARIBBEAN_CATEGORIES.slice(0, 7);

  return (
    <div className="space-y-5">
      {/* 1. Seller Quick Action */}
      <div className="glass rounded-3xl p-5 border border-brand-sunriseCoral/30 bg-gradient-to-br from-brand-sunriseCoral/10 to-brand-sunsetPurple/20 space-y-3 shadow-xl">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-sunriseCoral to-brand-goldenHour flex items-center justify-center text-slate-950 font-black shadow-md">
            <Store className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white">Sell on Marketplace</h3>
            <p className="text-[10px] text-brand-sandstone/60">
              Caribbean merchants &amp; creators
            </p>
          </div>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          List authentic Caribbean arts, crafts, culinary goods, and fashion to a global audience.
        </p>
        <Link
          href="/marketplace/seller-center/create"
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-brand-sunriseCoral hover:brightness-110 text-slate-950 font-black text-xs transition-all shadow-md"
        >
          <PlusCircle className="w-4 h-4 text-slate-950" />
          <span>Create Listing</span>
        </Link>
      </div>

      {/* 2. Marketplace Navigation & Controls */}
      <section aria-label="Marketplace Navigation" className="glass rounded-3xl p-4 sm:p-5 space-y-3 border border-white/10">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-brand-goldenHour" />
          <h4 className="text-xs font-black text-white uppercase tracking-wider">
            Market Actions
          </h4>
        </div>

        <nav className="space-y-1 pt-0.5">
          <Link
            href="/marketplace/orders"
            className="flex items-center justify-between p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white transition-colors"
          >
            <span className="flex items-center gap-2">
              <Package className="w-4 h-4 text-sky-400" />
              My Orders &amp; Purchases
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-white/40" />
          </Link>

          <Link
            href="/marketplace/wishlist"
            className="flex items-center justify-between p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white transition-colors"
          >
            <span className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-400" />
              Saved Items &amp; Wishlist
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-white/40" />
          </Link>

          <Link
            href="/marketplace/seller-center"
            className="flex items-center justify-between p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white transition-colors"
          >
            <span className="flex items-center gap-2">
              <Store className="w-4 h-4 text-brand-goldenHour" />
              Seller Center &amp; Payouts
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-white/40" />
          </Link>
        </nav>
      </section>

      {/* 3. Category Navigation */}
      <section aria-label="Product Categories" className="glass rounded-3xl p-4 sm:p-5 space-y-3 border border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-brand-caribbeanSea" />
            <h4 className="text-xs font-black text-white uppercase tracking-wider">
              Categories
            </h4>
          </div>
          {activeCategory && (
            <Link href="/marketplace" className="text-[10px] font-bold text-brand-sandstone/60 hover:text-white">
              Clear
            </Link>
          )}
        </div>

        <div className="space-y-1 pt-0.5">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.slug;
            return (
              <Link
                key={cat.id}
                href={`/marketplace?category=${cat.slug}`}
                className={`flex items-center justify-between p-2 rounded-xl text-xs font-bold transition-colors ${
                  isActive
                    ? 'bg-brand-caribbeanSea/20 text-brand-caribbeanSea border border-brand-caribbeanSea/30'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white border border-transparent'
                }`}
              >
                <span className="truncate">{cat.title}</span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-caribbeanSea" />
                )}
              </Link>
            );
          })}
        </div>
      </section>

      {/* 4. Trust & Buyer Protection Badge */}
      <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2 text-center">
        <ShieldCheck className="w-6 h-6 text-emerald-400 mx-auto" />
        <p className="text-xs font-black text-white">TUKUBI Verified Escrow</p>
        <p className="text-[11px] text-brand-sandstone/70 leading-relaxed">
          Protected marketplace payments with zero credit card storage and multi-currency Caribbean settlement.
        </p>
      </div>
    </div>
  );
}
