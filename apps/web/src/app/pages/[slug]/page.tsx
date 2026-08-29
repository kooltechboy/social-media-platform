import React from 'react';
import Link from 'next/link';
import {
  Building2,
  Landmark,
  Sparkles,
  MapPin,
  Globe,
  Mail,
  Phone,
  Calendar,
  ShoppingBag,
  Heart,
  MessageCircle,
  Share2,
  Wallet,
  ShieldCheck,
  Star,
  CheckCircle,
} from 'lucide-react';
import VerificationBadge, { type VerificationLevel } from '../../../components/verification-badge';
import OrderButton from '../../../components/order-button';
import PageCommerceActions from '../../../components/page-commerce-actions';
import { getCurrentUser } from '../../../lib/supabase/server';

export const dynamic = 'force-dynamic';

interface PageDetails {
  slug: string;
  name: string;
  category: string;
  verification: VerificationLevel;
  location: string;
  followers: string;
  description: string;
  website: string;
  contactEmail: string;
  avatar: string;
  coverGradient: string;
  products: Array<{
    id: string;
    title: string;
    price: string;
    kind: string;
    rating: number;
  }>;
  posts: Array<{
    id: string;
    title: string;
    time: string;
    content: string;
    likes: number;
  }>;
}

import { notFound } from 'next/navigation';

export default async function ModularPageView({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await getCurrentUser();

  // Load live business page from database
  let dbPage: PageDetails | null = null;
  try {
    const { fetchBusinessPageAction } = await import('../../../lib/business/actions');
    const { business, products } = await fetchBusinessPageAction(slug);
    if (business) {
      dbPage = {
        slug: business.slug,
        name: business.name,
        category: business.category || 'Verified Caribbean Business',
        verification: 'business_verified' as VerificationLevel,
        location: `${business.country_iso || 'Caribbean'} 🌴`,
        followers: '1.2K',
        description: business.description || 'Verified Caribbean Business page on the Antilia ecosystem.',
        website: business.website || 'https://caribbeanone.com',
        contactEmail: 'contact@caribbeanone.com',
        avatar: '🏪',
        coverGradient: 'from-amber-900/50 via-slate-900 to-[#090D16]',
        products: (products || []).map((p: any) => ({
          id: p.id,
          title: p.title,
          price: `$${(p.price_minor / 100).toFixed(2)} USD`,
          kind: p.product_kind || 'physical',
          rating: 5.0,
        })),
        posts: [
          {
            id: `post-${business.id}`,
            title: `Welcome to ${business.name}`,
            time: 'Recently published',
            content: business.description || 'Welcome to our verified Antilia storefront.',
            likes: 24,
          },
        ],
      };
    }
  } catch {
    // DB error
  }

  if (!dbPage) {
    notFound();
  }

  const page = dbPage;

  return (
    <div className="min-h-screen bg-[#090D16] text-brand-sandstone p-4 md:p-6 max-w-7xl mx-auto space-y-8">
      {/* Page Header & Cover */}
      <div className="bg-brand-dusk border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative">
        {/* Cover Banner */}
        <div className={`h-48 md:h-64 bg-gradient-to-r ${page.coverGradient} relative`}>
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <VerificationBadge level={page.verification} showLabel={true} />
          </div>
        </div>

        {/* Profile Info Bar */}
        <div className="p-6 pt-0 relative flex flex-col md:flex-row items-start md:items-end justify-between gap-4 -mt-16">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-4">
            <div className="w-28 h-28 rounded-3xl bg-brand-twilight border-4 border-slate-900 flex items-center justify-center text-5xl shadow-2xl">
              {page.avatar}
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl md:text-3xl font-black text-brand-sandstone leading-tight flex items-center gap-2">
                {page.name}
              </h1>
              <p className="text-xs font-bold text-brand-sandstone/60">{page.category}</p>
              <p className="text-xs text-brand-sunriseCoral font-semibold flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-brand-sunriseCoral" /> {page.location}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <PageCommerceActions
              businessName={page.name}
              businessSlug={page.slug}
              category={page.category}
              location={page.location}
            />
            <button className="flex-1 md:flex-initial bg-gradient-to-r from-brand-caribbeanSea to-brand-sunriseCoral hover:from-brand-caribbeanSea hover:to-brand-sunriseCoral text-slate-950 font-black px-5 py-2.5 rounded-2xl text-xs transition-all shadow-md shadow-brand-caribbeanSea/20">
              Follow ({page.followers})
            </button>
            <Link
              href="/messages"
              className="bg-brand-dusk hover:bg-slate-700 text-brand-sandstone font-bold px-4 py-2.5 rounded-2xl text-xs border border-slate-700 transition-colors"
            >
              Message
            </Link>
          </div>
        </div>

        {/* Tab Navigation Rail */}
        <div className="px-6 border-t border-slate-800 flex gap-6 overflow-x-auto scrollbar-none text-xs font-black text-brand-sandstone/60">
          <button className="py-3 text-brand-caribbeanSea border-b-2 border-brand-caribbeanSea whitespace-nowrap">
            Overview &amp; Feed
          </button>
          {page.products.length > 0 && (
            <button className="py-3 hover:text-brand-sandstone whitespace-nowrap flex items-center gap-1.5">
              <ShoppingBag className="w-3.5 h-3.5" /> Storefront ({page.products.length})
            </button>
          )}
          <button className="py-3 hover:text-brand-sandstone whitespace-nowrap">
            Events &amp; Notices
          </button>
          <button className="py-3 hover:text-brand-sandstone whitespace-nowrap">
            About &amp; Verified Info
          </button>
        </div>
      </div>

      {/* Main Grid: Content & Storefront vs Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Feed & Store (Col 8) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Storefront Shelf if products exist */}
          {page.products.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-brand-sandstone flex items-center gap-2 uppercase tracking-wider">
                  <ShoppingBag className="w-4 h-4 text-brand-sunriseCoral" /> Verified Storefront
                </h3>
                <span className="text-xs text-brand-sandstone/40">SpotPay Instant Escrow</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {page.products.map((prod) => (
                  <div
                    key={prod.id}
                    className="bg-brand-dusk/80 border border-slate-800 rounded-3xl p-5 space-y-3 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-brand-sunriseCoral/10 text-brand-sunriseCoral border border-brand-sunriseCoral/20 uppercase">
                          {prod.kind}
                        </span>
                        <span className="text-xs font-bold text-brand-goldenHour flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 fill-brand-goldenHour" /> {prod.rating}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-sm text-brand-sandstone mt-2 leading-snug">{prod.title}</h4>
                      <p className="text-lg font-black text-brand-sunriseCoral mt-1">{prod.price}</p>
                    </div>

                    <OrderButton
                      productId={prod.id}
                      isAuthenticated={!!user}
                      disabled={!user}
                      isSeller={false}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Posts & Announcements */}
          <section className="space-y-4">
            <h3 className="text-sm font-extrabold text-brand-sandstone uppercase tracking-wider">
              Official Updates &amp; Announcements
            </h3>

            {page.posts.map((post) => (
              <article
                key={post.id}
                className="bg-brand-dusk/80 border border-slate-800 rounded-3xl p-6 space-y-3 shadow-xl"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{page.avatar}</span>
                    <div>
                      <h4 className="font-extrabold text-sm text-brand-sandstone">{page.name}</h4>
                      <time className="text-[11px] text-brand-sandstone/40">{post.time}</time>
                    </div>
                  </div>
                </div>

                <h4 className="font-extrabold text-base text-brand-caribbeanSea leading-snug">{post.title}</h4>
                <p className="text-sm text-slate-200 leading-relaxed font-medium">{post.content}</p>

                <div className="flex items-center gap-6 pt-3 border-t border-slate-800 text-brand-sandstone/60 text-xs">
                  <button className="flex items-center gap-1.5 hover:text-rose-400 transition-colors">
                    <Heart className="w-4 h-4" /> <span>{post.likes}</span>
                  </button>
                  <button className="flex items-center gap-1.5 hover:text-brand-caribbeanSea transition-colors">
                    <MessageCircle className="w-4 h-4" /> <span>Discuss</span>
                  </button>
                  <button className="flex items-center gap-1.5 hover:text-brand-sunriseCoral transition-colors">
                    <Share2 className="w-4 h-4" /> <span>Share</span>
                  </button>
                </div>
              </article>
            ))}
          </section>
        </div>

        {/* Right Info Box (Col 4) */}
        <div className="lg:col-span-4 space-y-5">
          <div className="bg-brand-dusk/80 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <h3 className="font-extrabold text-sm text-brand-sandstone uppercase tracking-wider">
              Verified Information
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              {page.description}
            </p>

            <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
              <p className="flex items-center gap-2 text-brand-sandstone/60">
                <Globe className="w-3.5 h-3.5 text-brand-caribbeanSea" />
                <a href={page.website} target="_blank" rel="noopener noreferrer" className="text-brand-caribbeanSea hover:underline">
                  {page.website.replace('https://', '')}
                </a>
              </p>
              <p className="flex items-center gap-2 text-brand-sandstone/60">
                <Mail className="w-3.5 h-3.5 text-brand-sunriseCoral" />
                <span>{page.contactEmail}</span>
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-brand-sunriseCoral/30 rounded-3xl p-5 space-y-2.5 shadow-lg">
            <div className="flex items-center gap-1.5 text-xs font-black text-brand-sunriseCoral uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" /> SpotPay Escrow Backed
            </div>
            <p className="text-xs text-slate-300">
              Orders and contracts placed on this Page are protected with direct double-entry ledger settlement.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
