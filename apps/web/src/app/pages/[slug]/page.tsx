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
import PageFollowButton from '../../../components/page-follow-button';
import { getCurrentUser, createSupabaseServerClient } from '../../../lib/supabase/server';

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
  ownerId?: string;
  ownerUsername?: string;
  isFollowing?: boolean;
  followerCount?: number;
  isArchived?: boolean;
  products: Array<{
    id: string;
    title: string;
    price: string;
    kind: string;
    rating?: number;
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
      let isFollowing = false;
      let followerCount = 0;

      const supabase = await createSupabaseServerClient();
      if (supabase && business.owner_id) {
        const { data: countRow } = await supabase
          .from('profile_counts')
          .select('followers_count')
          .eq('id', business.owner_id)
          .maybeSingle();
        followerCount = countRow?.followers_count || 0;

        if (user) {
          const { data: followRow } = await supabase
            .from('follows')
            .select('following_id')
            .eq('follower_id', user.id)
            .eq('following_id', business.owner_id)
            .maybeSingle();
          isFollowing = Boolean(followRow);
        }
      }

      dbPage = {
        slug: business.slug,
        name: business.name,
        category: business.category || 'Verified Caribbean Business',
        verification: 'business_verified' as VerificationLevel,
        location: `${business.country_iso || 'Caribbean'} 🌴`,
        followers: followerCount.toString(),
        followerCount,
        isFollowing,
        ownerId: business.owner_id,
        description: business.description || 'Verified Caribbean Business page on TUKUBI. The Caribbean Connected.',
        website: business.website || 'https://tukubi.com',
        contactEmail: business.contact_email || 'contact@tukubi.com',
        avatar: business.avatar_url || '🏪',
        coverGradient: business.cover_image_url
          ? `url('${business.cover_image_url}') bg-cover bg-center`
          : 'from-amber-900/50 via-slate-900 to-[#110D17]',
        ownerUsername: business.owner?.username || undefined,
        isArchived: Boolean(business.is_archived),
        products: (products || []).map((p: any) => ({
          id: p.id,
          title: p.title,
          price: `$${(p.price_minor / 100).toFixed(2)} USD`,
          kind: p.product_kind || 'physical',
        })),
        posts: [],
      };
    }
  } catch {
    // DB error
  }

  if (!dbPage) {
    notFound();
  }

  const page = dbPage;
  const isOwner = Boolean(user && user.id === page.ownerId);

  return (
    <div className="min-h-screen bg-transparent text-brand-sandstone p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Owner Management Quick Bar */}
      {isOwner && (
        <div className="surface-card rounded-2xl p-4 border border-brand-goldenHour/40 bg-brand-goldenHour/10 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2 text-xs text-white">
            <span className="text-base">👑</span>
            <span className="font-extrabold">You are an administrator of this Page.</span>
            {page.isArchived && (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                Archived &amp; Hidden
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Link
              href={`/pages/${page.slug}/manage`}
              className="flex-1 sm:flex-initial bg-brand-goldenHour hover:bg-amber-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-brand-goldenHour/20"
            >
              Manage Page &amp; Settings →
            </Link>
          </div>
        </div>
      )}

      {/* Public Archived Notice if viewer is not owner */}
      {!isOwner && page.isArchived && (
        <div className="surface-card rounded-2xl p-4 border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs font-bold text-center">
          ⚠️ This Caribbean Page is currently archived by its owner and is not accepting public inquiries.
        </div>
      )}

      {/* Page Header & Cover */}
      <div className="surface-header border border-white/15 rounded-3xl overflow-hidden shadow-2xl relative">
        {/* Cover Banner */}
        <div
          className={`h-48 md:h-64 relative ${
            page.coverGradient.startsWith('url') ? page.coverGradient : `bg-gradient-to-r ${page.coverGradient}`
          }`}
          style={page.coverGradient.startsWith('url') ? { backgroundImage: page.coverGradient.replace(/ bg-cover.*$/, '') } : undefined}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
            <VerificationBadge level={page.verification} showLabel={true} />
          </div>
        </div>

        {/* Profile Info Bar */}
        <div className="p-6 pt-0 relative flex flex-col md:flex-row items-start md:items-end justify-between gap-6 -mt-16 z-10">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-5">
            <div className="w-28 h-28 rounded-3xl bg-slate-900 border-4 border-slate-950 flex items-center justify-center text-5xl shadow-2xl shrink-0 overflow-hidden">
              {page.avatar.startsWith('http') ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={page.avatar} alt={page.name} className="w-full h-full object-cover" />
              ) : (
                page.avatar
              )}
            </div>
            <div className="space-y-1.5">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-white leading-tight flex items-center gap-2">
                {page.name}
              </h1>
              <p className="text-xs sm:text-sm font-bold text-brand-sandstone/80">{page.category}</p>
              <p className="text-xs text-orange-400 font-bold flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-orange-400 shrink-0" /> {page.location}
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
            {page.ownerId ? (
              <PageFollowButton
                targetUserId={page.ownerId}
                initialIsFollowing={page.isFollowing ?? false}
                initialFollowerCount={page.followerCount ?? 0}
              />
            ) : (
              <button disabled className="flex-1 md:flex-initial bg-white/10 text-white/50 font-bold px-6 py-3 rounded-2xl text-xs sm:text-sm min-h-[44px] flex items-center justify-center">
                Follow ({page.followers})
              </button>
            )}
            <Link
              href={`/messages?u=${encodeURIComponent(page.ownerUsername || page.slug)}`}
              className="bg-white/10 hover:bg-white/20 text-white font-black px-5 py-3 rounded-2xl text-xs sm:text-sm border border-white/15 transition-colors min-h-[44px] flex items-center justify-center"
            >
              Message
            </Link>
          </div>
        </div>

        {/* Tab Navigation Rail */}
        <div className="px-6 border-t border-white/10 flex gap-6 overflow-x-auto scrollbar-none text-xs font-black text-brand-sandstone/70">
          <button className="py-3 text-orange-400 border-b-2 border-orange-400 whitespace-nowrap">
            Overview &amp; Feed
          </button>
          {page.products.length > 0 && (
            <Link
              href={`/store/${page.slug}`}
              className="py-3 text-brand-sandstone/80 hover:text-white whitespace-nowrap flex items-center gap-1.5 transition-colors"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-orange-400" /> Shop &amp; Storefront ({page.products.length})
            </Link>
          )}
          <button className="py-3 hover:text-white whitespace-nowrap">
            Events &amp; Notices
          </button>
          <button className="py-3 hover:text-white whitespace-nowrap">
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
                <h3 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-wider">
                  <ShoppingBag className="w-4 h-4 text-orange-400" /> Verified Storefront
                </h3>
                <Link
                  href={`/store/${page.slug}`}
                  className="text-xs text-orange-400 hover:text-orange-300 font-bold flex items-center gap-1"
                >
                  Open Full Storefront →
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {page.products.map((prod) => (
                  <div
                    key={prod.id}
                    className="surface-card surface-card-interactive rounded-3xl p-5 space-y-4 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-orange-500/10 text-orange-300 border border-orange-500/25 uppercase">
                          {prod.kind}
                        </span>
                      </div>
                      <h4 className="font-black text-base text-white mt-2 leading-snug">{prod.title}</h4>
                      <p className="text-xl font-black text-orange-400 mt-1">{prod.price}</p>
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
            <h3 className="text-sm font-black text-white uppercase tracking-wider">
              Official Updates &amp; Announcements
            </h3>

            {page.posts.length === 0 ? (
              <div className="surface-card rounded-3xl p-8 text-center space-y-2 border border-white/10">
                <p className="text-sm text-brand-sandstone/70">No official announcements posted yet.</p>
              </div>
            ) : (
              page.posts.map((post) => (
                <article
                  key={post.id}
                  className="surface-card surface-card-interactive rounded-3xl p-6 space-y-4 shadow-xl"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{page.avatar}</span>
                      <div>
                        <h4 className="font-black text-sm text-white">{page.name}</h4>
                        <time className="text-[11px] text-brand-sandstone/50">{post.time}</time>
                      </div>
                    </div>
                  </div>

                  <h4 className="font-black text-base sm:text-lg text-white leading-snug">{post.title}</h4>
                  <p className="text-sm text-brand-sandstone/85 leading-relaxed font-medium">{post.content}</p>

                  <div className="flex items-center gap-6 pt-3 border-t border-white/10 text-brand-sandstone/70 text-xs font-bold">
                    <button className="flex items-center gap-1.5 hover:text-rose-400 transition-colors min-h-[36px]">
                      <Heart className="w-4 h-4" /> <span>{post.likes}</span>
                    </button>
                    <button className="flex items-center gap-1.5 hover:text-orange-400 transition-colors min-h-[36px]">
                      <MessageCircle className="w-4 h-4" /> <span>Discuss</span>
                    </button>
                    <button className="flex items-center gap-1.5 hover:text-emerald-400 transition-colors min-h-[36px]">
                      <Share2 className="w-4 h-4" /> <span>Share</span>
                    </button>
                  </div>
                </article>
              ))
            )}
          </section>
        </div>

        {/* Right Info Box (Col 4) */}
        <div className="lg:col-span-4 space-y-5">
          <div className="surface-card rounded-3xl p-6 space-y-4 shadow-xl">
            <h3 className="font-black text-sm text-white uppercase tracking-wider">
              Verified Information
            </h3>
            <p className="text-xs sm:text-sm text-brand-sandstone/80 leading-relaxed font-medium">
              {page.description}
            </p>

            <div className="space-y-3 pt-3 border-t border-white/10 text-xs">
              {(() => {
                let safeUrl: string | null = null;
                try {
                  const parsed = new URL(page.website.startsWith('http://') || page.website.startsWith('https://') ? page.website : `https://${page.website}`);
                  if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
                    safeUrl = parsed.toString();
                  }
                } catch {}

                if (!safeUrl) return null;

                return (
                  <p className="flex items-center gap-2.5 text-brand-sandstone/75">
                    <Globe className="w-4 h-4 text-orange-400 shrink-0" />
                    <a href={safeUrl} target="_blank" rel="noopener noreferrer" className="text-orange-300 hover:underline font-bold">
                      {safeUrl.replace(/^https?:\/\//, '')}
                    </a>
                  </p>
                );
              })()}
              <p className="flex items-center gap-2.5 text-brand-sandstone/75">
                <Mail className="w-4 h-4 text-orange-400 shrink-0" />
                <span className="font-medium">{page.contactEmail}</span>
              </p>
            </div>
          </div>

          <div className="surface-card border border-orange-500/30 rounded-3xl p-6 space-y-2.5 shadow-lg bg-orange-950/20">
            <div className="flex items-center gap-2 text-xs font-black text-orange-300 uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-orange-400" /> Escrow Protected
            </div>
            <p className="text-xs text-brand-sandstone/80 leading-relaxed">
              Orders and contracts placed on this Page are protected with direct double-entry ledger settlement.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
