'use client';

import React from 'react';
import Link from 'next/link';
import {
  Building2,
  PlusCircle,
  Sparkles,
  CheckCircle,
  ChevronRight,
  Store,
  Settings,
  Users,
  Layers,
  FileText,
} from 'lucide-react';

export interface PagesRailProps {
  myPages?: Array<{
    id: string;
    name: string;
    slug: string;
    is_verified?: boolean;
    category?: string;
    userRole?: string | null;
    followerCount?: number;
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
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-brand-caribbeanSea" />
                <span>Page Home &amp; Posts</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-white/40" />
            </Link>
            <Link
              href={`/pages/${activePage.slug}?tab=about`}
              className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-white transition-colors"
            >
              <div className="flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-brand-goldenHour" />
                <span>About &amp; Info</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-white/40" />
            </Link>
            <Link
              href={`/pages/${activePage.slug}?tab=store`}
              className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-white transition-colors"
            >
              <div className="flex items-center gap-2">
                <Store className="w-3.5 h-3.5 text-brand-sunriseCoral" />
                <span>Storefront Products</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-white/40" />
            </Link>
            {activePage.is_admin && (
              <Link
                href={`/pages/${activePage.slug}/manage`}
                className="flex items-center justify-between p-2.5 rounded-xl bg-brand-sunriseCoral/10 hover:bg-brand-sunriseCoral/20 border border-brand-sunriseCoral/30 text-xs font-black text-brand-sunriseCoral transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Settings className="w-3.5 h-3.5 text-brand-sunriseCoral" />
                  <span>Manage Page &amp; Roles</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-brand-sunriseCoral/70" />
              </Link>
            )}
          </nav>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Create Page CTA */}
      <div className="glass rounded-3xl p-5 border border-brand-sunriseCoral/30 bg-gradient-to-br from-brand-sunriseCoral/10 via-amber-500/5 to-transparent space-y-3 shadow-xl">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-sunriseCoral to-amber-400 flex items-center justify-center text-slate-950 font-black shadow-md">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white">Create a Page</h3>
            <p className="text-[10px] text-brand-sandstone/60">
              Creators, brands, NGOs &amp; businesses
            </p>
          </div>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Establish an official public identity on TUKUBI with custom roles, dedicated followers, and direct publishing.
        </p>
        <Link
          href="/pages/create"
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-brand-sunriseCoral hover:brightness-110 text-slate-950 font-black text-xs transition-all shadow-md"
        >
          <PlusCircle className="w-4 h-4 text-slate-950" />
          <span>Launch Your Page</span>
        </Link>
      </div>

      {/* My Managed Pages */}
      {myPages.length > 0 && (
        <section aria-label="My Pages" className="glass rounded-3xl p-4 sm:p-5 space-y-3 border border-white/10">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black text-white uppercase tracking-wider">
              Your Managed Pages
            </h4>
            <span className="text-[10px] font-bold text-brand-sunriseCoral px-2 py-0.5 rounded-full bg-brand-sunriseCoral/10">
              {myPages.length}
            </span>
          </div>
          <div className="space-y-2 pt-0.5">
            {myPages.map((page) => (
              <div
                key={page.id}
                className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all group space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <Link
                    href={`/pages/${page.slug}`}
                    className="flex items-center gap-1.5 truncate max-w-[70%]"
                  >
                    <span className="text-xs font-bold text-white group-hover:text-brand-sunriseCoral transition-colors truncate">
                      {page.name}
                    </span>
                    {page.is_verified && (
                      <CheckCircle className="w-3.5 h-3.5 text-brand-caribbeanSea shrink-0" />
                    )}
                  </Link>
                  {page.userRole && (
                    <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-white/10 text-brand-sandstone/70">
                      {page.userRole}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between text-[11px] text-brand-sandstone/60">
                  <span>{page.followerCount ?? 0} followers</span>
                  <Link
                    href={`/pages/${page.slug}/manage`}
                    className="text-brand-sunriseCoral hover:underline text-[11px] font-bold flex items-center gap-1"
                  >
                    Manage →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Universal Directory Link */}
      <div className="p-4 rounded-3xl bg-white/5 border border-white/10 space-y-2">
        <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-brand-caribbeanSea" />
          <span>Universal Directory</span>
        </h4>
        <p className="text-[11px] text-brand-sandstone/70 leading-relaxed">
          Discover verified Caribbean creators, organizations, institutions, and businesses basin-wide.
        </p>
        <Link
          href="/pages"
          className="inline-flex items-center gap-1 text-xs font-black text-brand-caribbeanSea hover:text-emerald-400 transition-colors pt-1"
        >
          <span>Browse All Pages</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
