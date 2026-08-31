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
    <div className="min-h-screen bg-transparent text-brand-sandstone p-4 md:p-6 max-w-7xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-brand-sandstone flex items-center gap-3">
            <Building2 className="w-8 h-8 text-brand-sunriseCoral" /> Caribbean Pages Ecosystem
          </h1>
          <p className="text-xs md:text-sm text-brand-sandstone/60 mt-1">
            Verified hubs for Businesses, Governments, Creators, Educational Institutions, and Diaspora Organizations.
          </p>
        </div>

        <Link
          href="/pages/create"
          className="bg-gradient-to-r from-brand-sunriseCoral to-brand-caribbeanSea hover:from-brand-sunriseCoral hover:to-brand-caribbeanSea text-slate-950 font-black px-5 py-2.5 rounded-2xl text-xs flex items-center gap-2 transition-all shadow-md shadow-brand-sunriseCoral/20 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" /> Create a Page
        </Link>
      </div>

      {/* Pages Grid */}
      {allPages.length === 0 ? (
        <div className="bg-brand-dusk/70 border border-slate-800 rounded-3xl p-12 text-center space-y-4 max-w-xl mx-auto">
          <Building2 className="w-12 h-12 text-brand-sunriseCoral/60 mx-auto" />
          <h3 className="text-base font-bold text-brand-sandstone">No verified pages found</h3>
          <p className="text-xs text-brand-sandstone/60 leading-relaxed">
            No business or organization pages found matching your search. Create the first verified official Caribbean page!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allPages.map((page) => (
            <article
              key={page.id}
              className="bg-brand-dusk/80 border border-slate-800 hover:border-brand-sunriseCoral/50 rounded-3xl p-6 flex flex-col justify-between transition-all shadow-xl group space-y-4"
            >
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-brand-twilight border border-slate-800 flex items-center justify-center text-3xl shadow-inner">
                    {page.avatar}
                  </div>
                  <VerificationBadge level={page.verification} showLabel={true} />
                </div>

                <div>
                  <h3 className="font-extrabold text-base text-brand-sandstone group-hover:text-emerald-300 transition-colors leading-snug">
                    {page.name}
                  </h3>
                  <span className="text-[11px] font-bold text-brand-sandstone/60 block mt-0.5">
                    {page.category}
                  </span>
                  <span className="text-xs text-brand-sunriseCoral font-semibold flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3 text-brand-sunriseCoral" /> {page.location}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                  {page.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-xs font-bold text-brand-sandstone/60">
                  {page.followers} followers
                </span>
                <Link
                  href={`/pages/${page.slug}`}
                  className="bg-brand-dusk hover:bg-slate-700 text-brand-sandstone font-bold px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1 transition-colors"
                >
                  Visit Page <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
