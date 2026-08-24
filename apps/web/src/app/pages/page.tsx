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
import { getCurrentUser } from '../../lib/supabase/server';

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

const SHOWCASE_PAGES: PageEntry[] = [
  {
    id: 'page-1',
    slug: 'gov-jamaica',
    name: 'Government of Jamaica (Official)',
    category: 'Public Sector & Civic Infrastructure',
    type: 'government',
    verification: 'government_verified',
    location: 'Kingston, Jamaica 🇯🇲',
    followers: '284.5K',
    description: 'Official announcements, tourism initiatives, diaspora civic engagement, and consular notices.',
    hasStore: false,
    avatar: '🇯🇲',
  },
  {
    id: 'page-2',
    slug: 'portland-roasters',
    name: 'Portland Blue Mountain Roasters',
    category: 'Food, Beverage & Export',
    type: 'business',
    verification: 'business_verified',
    location: 'Portland, Jamaica 🇯🇲',
    followers: '42.1K',
    description: 'Certified single-origin Jamaican Blue Mountain coffee. Direct export shipping worldwide on SpotPay.',
    hasStore: true,
    avatar: '☕',
  },
  {
    id: 'page-3',
    slug: 'belmont-carnival-atelier',
    name: 'Belmont Mas & Costume Atelier',
    category: 'Carnival, Fashion & Design',
    type: 'creator',
    verification: 'creator_verified',
    location: 'Port of Spain, Trinidad 🇹🇹',
    followers: '89.4K',
    description: 'Award-winning carnival designer crafting custom feather and wire-bra masquerade pieces.',
    hasStore: true,
    avatar: '🎭',
  },
  {
    id: 'page-4',
    slug: 'uwi-mona',
    name: 'University of the West Indies (UWI)',
    category: 'Higher Education & Research',
    type: 'institution',
    verification: 'institution_verified',
    location: 'Kingston / St. Augustine / Cave Hill',
    followers: '195.0K',
    description: 'Premier Caribbean research institution fostering scholarship, climate science, and innovation.',
    hasStore: false,
    avatar: '🎓',
  },
  {
    id: 'page-5',
    slug: 'carib-tech-alliance',
    name: 'Caribbean Technology & Startup Alliance',
    category: 'Technology & Venture Guild',
    type: 'community',
    verification: 'business_verified',
    location: 'Pan-Caribbean & Diaspora 🚀',
    followers: '34.8K',
    description: 'Connecting software engineers, founders, and angel syndicates across 26 island nations and diaspora hubs.',
    hasStore: true,
    avatar: '💻',
  },
];

export default async function PagesDirectoryPage() {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-[#090D16] text-brand-sandstone p-4 md:p-6 max-w-7xl mx-auto space-y-8">
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {SHOWCASE_PAGES.map((page) => (
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
    </div>
  );
}
