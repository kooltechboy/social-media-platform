import React from 'react';
import Link from 'next/link';
import {
  Building2,
  Landmark,
  Sparkles,
  GraduationCap,
  Tv,
  Users,
  Plus,
  ArrowUpRight,
  ShieldCheck,
  MapPin,
} from 'lucide-react';
import VerificationBadge, { type VerificationLevel } from '../../components/verification-badge';
import { createSupabaseServerClient, getCurrentUser } from '../../lib/supabase/server';

export const dynamic = 'force-dynamic';

interface PageEntry {
  id: string;
  slug: string;
  name: string;
  category: string;
  type: 'business' | 'government' | 'creator' | 'institution' | 'media' | 'community';
  verification: VerificationLevel;
  location: string;
  followers: string;
  description: string;
  hasStore: boolean;
  avatar: string;
}

export default async function PagesDirectoryPage({
  searchParams,
}: {
  searchParams?: Promise<{ category?: string; q?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const { category: activeCategory, q: searchQuery } = resolvedParams;

  const [user, supabase] = await Promise.all([getCurrentUser(), createSupabaseServerClient()]);

  let dynamicPages: PageEntry[] = [];
  if (supabase) {
    let query = supabase
      .from('businesses')
      .select('id, name, slug, category, description, is_verified, country_iso, created_at')
      .order('created_at', { ascending: false })
      .limit(30);

    if (activeCategory && activeCategory !== 'all') {
      query = query.ilike('category', `%${activeCategory}%`);
    }
    if (searchQuery) {
      query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
    }

    const { data: dbBusinesses } = await query;
    if (dbBusinesses && dbBusinesses.length > 0) {
      dynamicPages = dbBusinesses.map((b: any) => ({
        id: b.id,
        slug: b.slug,
        name: b.name,
        category: b.category || 'Caribbean Organization & Storefront',
        type: 'business' as const,
        verification: 'business_verified' as VerificationLevel,
        location: `${b.country_iso || 'Caribbean'} 🌴`,
        followers: '0',
        description: b.description || 'Verified Caribbean business and storefront on Tukubi.',
        hasStore: true,
        avatar: '🏪',
      }));
    }
  }
  const allPages = dynamicPages;

  return (
    <div className="min-h-screen bg-transparent text-brand-sandstone p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="surface-header p-6 sm:p-8 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-300 text-xs font-black uppercase tracking-wider">
            <Building2 className="w-3.5 h-3.5" /> Official Ecosystem
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight flex items-center gap-3">
            Caribbean Pages Ecosystem
          </h1>
          <p className="text-sm sm:text-base text-brand-sandstone/80 leading-relaxed">
            Verified hubs for Businesses, Governments, Creators, Educational Institutions, and Diaspora Organizations across the Caribbean basin.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/pages/create"
            className="bg-gradient-to-r from-orange-500 via-amber-500 to-emerald-400 hover:brightness-110 text-slate-950 font-black px-6 py-3 rounded-2xl text-sm flex items-center gap-2 transition-all shadow-lg shadow-orange-500/20 min-h-[44px]"
          >
            <Plus className="w-4 h-4" /> Create a Page
          </Link>
        </div>
      </div>

      {/* Category Pills & Search */}
      <div className="surface-card p-4 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs font-black">
          {[
            { id: 'all', label: 'All Pages' },
            { id: 'business', label: 'Businesses' },
            { id: 'creator', label: 'Creators' },
            { id: 'institution', label: 'Institutions' },
            { id: 'media', label: 'Media' },
            { id: 'community', label: 'Community' },
          ].map((tab) => {
            const isActive = (!activeCategory && tab.id === 'all') || activeCategory === tab.id;
            return (
              <Link
                key={tab.id}
                href={tab.id === 'all' ? '/pages' : `/pages?category=${tab.id}`}
                className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap min-h-[40px] flex items-center justify-center font-bold ${
                  isActive
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25 font-black'
                    : 'bg-white/5 text-brand-sandstone/70 hover:text-white hover:bg-white/10'
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>

        <form action="/pages" method="GET" className="flex items-center gap-2">
          {activeCategory && <input type="hidden" name="category" value={activeCategory} />}
          <input
            type="search"
            name="q"
            defaultValue={searchQuery || ''}
            placeholder="Search pages..."
            className="bg-black/40 border border-white/15 focus:border-orange-500 text-white placeholder:text-brand-sandstone/40 text-xs px-4 py-2.5 rounded-xl w-full sm:w-56 focus:outline-none min-h-[40px]"
          />
          <button
            type="submit"
            className="bg-white/10 hover:bg-white/20 text-white font-black px-4 py-2.5 rounded-xl text-xs transition-colors min-h-[40px]"
          >
            Search
          </button>
        </form>
      </div>

      {/* Pages Grid */}
      {allPages.length === 0 ? (
        <div className="surface-card p-12 text-center space-y-4 max-w-xl mx-auto rounded-3xl border border-white/10">
          <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center mx-auto text-orange-400">
            <Building2 className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black text-white">No verified pages found</h3>
          <p className="text-sm text-brand-sandstone/70 leading-relaxed">
            No business or organization pages found matching your filters. Create the first verified official Caribbean page on Tukubi!
          </p>
          <div className="pt-2">
            <Link
              href="/pages/create"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-black px-5 py-2.5 rounded-xl text-xs transition-all shadow-md min-h-[44px]"
            >
              <Plus className="w-4 h-4" /> Create First Page
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allPages.map((page) => (
            <article
              key={page.id}
              className="surface-card surface-card-interactive rounded-3xl p-6 flex flex-col justify-between transition-all group space-y-5"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-white/15 flex items-center justify-center text-3xl shadow-inner">
                    {page.avatar}
                  </div>
                  <VerificationBadge level={page.verification} showLabel={true} />
                </div>

                <div>
                  <h3 className="font-black text-lg text-white group-hover:text-orange-400 transition-colors leading-snug">
                    {page.name}
                  </h3>
                  <span className="text-xs font-bold text-brand-sandstone/70 block mt-1">
                    {page.category}
                  </span>
                  <span className="text-xs text-orange-400 font-bold flex items-center gap-1.5 mt-1.5">
                    <MapPin className="w-3.5 h-3.5 text-orange-400 shrink-0" /> {page.location}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-brand-sandstone/80 leading-relaxed line-clamp-3">
                  {page.description}
                </p>
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                <span className="text-xs font-bold text-brand-sandstone/60">
                  {page.followers} followers
                </span>
                <Link
                  href={`/pages/${page.slug}`}
                  className="bg-white/10 hover:bg-orange-500 hover:text-slate-950 text-white font-black px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-all min-h-[40px]"
                >
                  Visit Page <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
