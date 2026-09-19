'use client';

import React from 'react';
import Link from 'next/link';
import { Building2, PlusCircle, Sparkles, CheckCircle, ChevronRight, Store } from 'lucide-react';

export interface PagesRailProps {
  myPages?: Array<{
    id: string;
    name: string;
    slug: string;
    is_verified?: boolean;
    category?: string;
  }>;
  activePage?: {
    id: string;
    name: string;
    slug: string;
    category?: string;
    is_admin?: boolean;
  } | null;
}

export default function PagesRail({
  myPages = [],
  activePage = null,
}: PagesRailProps) {
  if (activePage) {
    return (
      <div className="space-y-5">
        <div className="glass rounded-3xl p-5 border border-white/10 space-y-2.5 shadow-lg">
          <span className="text-[10px] font-black uppercase tracking-wider text-brand-sunriseCoral">
            Official Page
          </span>
          <h3 className="text-lg font-black text-white">{activePage.name}</h3>
          {activePage.category && (
            <p className="text-xs text-brand-sandstone/70 font-bold">{activePage.category}</p>
          )}
        </div>

        <section aria-label="Page Controls" className="glass rounded-3xl p-4 sm:p-5 space-y-2 border border-white/10">
          <h4 className="text-xs font-black text-white uppercase tracking-wider">
            Page Navigator
          </h4>
          <nav className="space-y-1 pt-1">
            <Link
              href={`/pages/${activePage.slug}`}
              className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-white transition-colors"
            >
              <span>Page Home &amp; Posts</span>
              <ChevronRight className="w-3.5 h-3.5 text-white/40" />
            </Link>
            <Link
              href={`/pages/${activePage.slug}?tab=about`}
              className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-white transition-colors"
            >
              <span>About &amp; Information</span>
              <ChevronRight className="w-3.5 h-3.5 text-white/40" />
            </Link>
            <Link
              href={`/pages/${activePage.slug}?tab=store`}
              className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-white transition-colors"
            >
              <span>Storefront Products</span>
              <Store className="w-3.5 h-3.5 text-brand-sunriseCoral" />
            </Link>
          </nav>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Create Page CTA */}
      <div className="glass rounded-3xl p-5 border border-brand-sunriseCoral/30 bg-gradient-to-br from-brand-sunriseCoral/10 to-transparent space-y-3 shadow-xl">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-sunriseCoral to-amber-400 flex items-center justify-center text-slate-950 font-black shadow-md">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white">Create a Page</h3>
            <p className="text-[10px] text-brand-sandstone/60">
              Businesses, artists &amp; orgs
            </p>
          </div>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Establish an official presence for your Caribbean company, restaurant, cultural foundation, or brand.
        </p>
        <Link
          href="/pages/create"
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-brand-sunriseCoral hover:brightness-110 text-slate-950 font-black text-xs transition-all shadow-md"
        >
          <PlusCircle className="w-4 h-4 text-slate-950" />
          <span>Launch Page</span>
        </Link>
      </div>

      {/* My Pages */}
      {myPages.length > 0 && (
        <section aria-label="My Pages" className="glass rounded-3xl p-4 sm:p-5 space-y-3 border border-white/10">
          <h4 className="text-xs font-black text-white uppercase tracking-wider">
            Your Managed Pages
          </h4>
          <div className="space-y-1.5 pt-0.5">
            {myPages.map((page) => (
              <Link
                key={page.id}
                href={`/pages/${page.slug}`}
                className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-colors group"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className="text-xs font-bold text-white group-hover:text-brand-sunriseCoral transition-colors truncate">
                    {page.name}
                  </span>
                  {page.is_verified && (
                    <CheckCircle className="w-3.5 h-3.5 text-brand-caribbeanSea shrink-0" />
                  )}
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-white/40" />
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
