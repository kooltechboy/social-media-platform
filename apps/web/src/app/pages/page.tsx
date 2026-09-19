import React from 'react';
import Link from 'next/link';
import {
  Building2,
  Sparkles,
  Users,
  Plus,
  ArrowUpRight,
  MapPin,
  Search,
  CheckCircle,
  ShieldCheck,
  Settings,
  FolderPlus,
  Globe,
} from 'lucide-react';
import VerificationBadge, { type VerificationLevel } from '../../components/verification-badge';
import { getCurrentUser } from '../../lib/supabase/server';
import RightRail from '../../components/right-rail';
import PagesRail from '../../components/rails/pages-rail';
import {
  fetchUniversalPagesAction,
  fetchMyPagesAction,
  type UniversalPageSummary,
} from '../../lib/pages/actions';
import {
  UNIVERSAL_CATEGORY_GROUPS,
  type PageCategoryGroupKey,
} from '../../lib/pages/categories';

export const dynamic = 'force-dynamic';

export default async function PagesDirectoryPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string; group?: string; q?: string; territory?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const activeTab = resolvedParams.tab === 'my-pages' ? 'my-pages' : 'explore';
  const activeGroup = resolvedParams.group || 'all';
  const searchQuery = resolvedParams.q || '';
  const territory = resolvedParams.territory || 'all';

  const user = await getCurrentUser();

  const [allPages, myPages] = await Promise.all([
    fetchUniversalPagesAction({
      groupKey: activeGroup !== 'all' ? activeGroup : undefined,
      query: searchQuery || undefined,
      territoryIso: territory !== 'all' ? territory : undefined,
      limit: 50,
    }),
    user ? fetchMyPagesAction() : Promise.resolve([]),
  ]);

  const displayedPages = activeTab === 'my-pages' ? myPages : allPages;

  return (
    <div className="flex flex-col lg:flex-row gap-6 xl:gap-8 items-start w-full">
      <div className="flex-1 min-w-0 space-y-6 w-full max-w-[840px] xl:max-w-[880px] mx-auto lg:mx-0 animate-fadeIn">
        {/* Top Header */}
        <div className="surface-header p-6 sm:p-8 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-brand-sunriseCoral/30 shadow-xl bg-gradient-to-br from-brand-dusk/90 via-slate-900 to-[#120B1C]">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-300 text-xs font-black uppercase tracking-wider">
              <Building2 className="w-3.5 h-3.5" /> Universal Caribbean Pages
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight flex items-center gap-3">
              Pages Ecosystem
            </h1>
            <p className="text-sm sm:text-base text-brand-sandstone/80 leading-relaxed">
              Official public identities for Creators, Brands, Businesses, Cultural Groups, Educational Institutions, and Diaspora Foundations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href="/pages/create"
              className="bg-gradient-to-r from-orange-500 via-amber-500 to-emerald-400 hover:brightness-110 text-slate-950 font-black px-6 py-3 rounded-2xl text-sm flex items-center gap-2 transition-all shadow-lg shadow-orange-500/20 min-h-[44px]"
            >
              <Plus className="w-4 h-4" /> Create a Page
            </Link>
          </div>
        </div>

        {/* Primary Tab Switcher */}
        <div className="flex items-center gap-3 border-b border-white/10 pb-2">
          <Link
            href="/pages?tab=explore"
            className={`px-5 py-2.5 rounded-2xl text-sm font-black transition-all flex items-center gap-2 ${
              activeTab === 'explore'
                ? 'bg-brand-sunriseCoral text-slate-950 shadow-md'
                : 'text-brand-sandstone/80 hover:text-white hover:bg-white/5'
            }`}
          >
            <Globe className="w-4 h-4" /> Explore Pages
          </Link>
          {user && (
            <Link
              href="/pages?tab=my-pages"
              className={`px-5 py-2.5 rounded-2xl text-sm font-black transition-all flex items-center gap-2 ${
                activeTab === 'my-pages'
                  ? 'bg-brand-sunriseCoral text-slate-950 shadow-md'
                  : 'text-brand-sandstone/80 hover:text-white hover:bg-white/5'
              }`}
            >
              <Users className="w-4 h-4" /> My Pages
              {myPages.length > 0 && (
                <span
                  className={`text-[11px] font-black px-2 py-0.5 rounded-full ${
                    activeTab === 'my-pages'
                      ? 'bg-slate-950 text-white'
                      : 'bg-white/10 text-brand-sandstone'
                  }`}
                >
                  {myPages.length}
                </span>
              )}
            </Link>
          )}
        </div>

        {/* Search & Category Filter Bar (Explore Tab) */}
        {activeTab === 'explore' && (
          <div className="space-y-4">
            <form method="GET" action="/pages" className="flex items-center gap-2 w-full">
              <input type="hidden" name="tab" value="explore" />
              {activeGroup !== 'all' && <input type="hidden" name="group" value={activeGroup} />}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-brand-sandstone/60 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  name="q"
                  defaultValue={searchQuery}
                  placeholder="Search pages by name, category, or mission..."
                  className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-brand-sandstone/40 text-sm focus:outline-none focus:border-brand-sunriseCoral transition-colors"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm transition-all shrink-0"
              >
                Search
              </button>
            </form>

            {/* Category Groups Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <Link
                href={`/pages?tab=explore${searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ''}`}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-colors ${
                  activeGroup === 'all'
                    ? 'bg-brand-caribbeanSea/20 text-brand-caribbeanSea border border-brand-caribbeanSea/40'
                    : 'bg-white/5 text-brand-sandstone hover:text-white border border-white/5'
                }`}
              >
                All Categories
              </Link>
              {UNIVERSAL_CATEGORY_GROUPS.map((grp) => (
                <Link
                  key={grp.key}
                  href={`/pages?tab=explore&group=${grp.key}${searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ''}`}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-colors ${
                    activeGroup === grp.key
                      ? 'bg-brand-caribbeanSea/20 text-brand-caribbeanSea border border-brand-caribbeanSea/40'
                      : 'bg-white/5 text-brand-sandstone hover:text-white border border-white/5'
                  }`}
                >
                  {grp.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Directory Cards Grid */}
        {displayedPages.length === 0 ? (
          <div className="surface-card rounded-3xl p-12 text-center space-y-4 max-w-xl mx-auto border border-white/10">
            <Building2 className="w-12 h-12 text-orange-400/70 mx-auto" />
            <h3 className="text-lg font-black text-white">
              {activeTab === 'my-pages'
                ? "You haven't created or managed any Pages yet"
                : 'No Caribbean pages found'}
            </h3>
            <p className="text-xs sm:text-sm text-brand-sandstone/80 leading-relaxed">
              {activeTab === 'my-pages'
                ? 'Establish your official presence on TUKUBI for your brand, creative identity, organization, or business.'
                : 'No pages match your current filters. Be the first to establish an official Page in this category!'}
            </p>
            <div className="pt-2">
              <Link
                href="/pages/create"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-brand-sunriseCoral text-slate-950 font-black text-xs hover:brightness-110 transition-all shadow-md"
              >
                <Plus className="w-4 h-4" /> Create a Page Now
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {displayedPages.map((page: UniversalPageSummary) => (
              <article
                key={page.id}
                className="surface-card surface-card-interactive rounded-3xl p-6 space-y-4 flex flex-col justify-between transition-all shadow-xl group border border-white/10"
              >
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl shadow-inner overflow-hidden">
                      {page.avatarUrl ? (
                        <img
                          src={page.avatarUrl}
                          alt={page.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xl">🌴</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {page.userRole && (
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-brand-sunriseCoral/20 text-brand-sunriseCoral border border-brand-sunriseCoral/30">
                          {page.userRole}
                        </span>
                      )}
                      <VerificationBadge
                        level={page.isVerified ? 'business_verified' : 'unverified'}
                        showLabel={false}
                      />
                    </div>
                  </div>

                  <div>
                    <h3 className="font-black text-lg text-white group-hover:text-orange-400 transition-colors leading-snug">
                      {page.name}
                    </h3>
                    <span className="text-xs font-bold text-brand-sandstone/70 block mt-1">
                      {page.category}
                    </span>
                    <span className="text-xs text-orange-400 font-bold flex items-center gap-1.5 mt-1.5">
                      <MapPin className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                      {page.countryIso ? `${page.countryIso} 🌴` : 'Caribbean Basin 🌴'}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-brand-sandstone/80 leading-relaxed line-clamp-3">
                    {page.description || 'Verified Caribbean public Page on TUKUBI.'}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                  <span className="text-xs font-bold text-brand-sandstone/60">
                    {page.followerCount} {page.followerCount === 1 ? 'follower' : 'followers'}
                  </span>
                  <div className="flex items-center gap-2">
                    {page.userRole && (
                      <Link
                        href={`/pages/${page.slug}/manage`}
                        className="bg-white/10 hover:bg-white/20 text-white font-black px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-all min-h-[38px]"
                      >
                        <Settings className="w-3.5 h-3.5 text-brand-sunriseCoral" />
                        <span>Manage</span>
                      </Link>
                    )}
                    <Link
                      href={`/pages/${page.slug}`}
                      className="bg-brand-sunriseCoral hover:brightness-110 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-all min-h-[38px]"
                    >
                      <span>Visit</span>
                      <ArrowUpRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <RightRail ariaLabel="Pages Ecosystem & Actions">
        <PagesRail myPages={myPages} />
      </RightRail>
    </div>
  );
}
