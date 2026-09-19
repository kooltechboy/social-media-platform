import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  Building2,
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
  Settings,
  AlertTriangle,
  FileText,
  Store,
  ChevronRight,
  Plus,
} from 'lucide-react';
import VerificationBadge from '../../../components/verification-badge';
import PageFollowButton from '../../../components/page-follow-button';
import PagePostComposer from '../../../components/pages/page-post-composer';
import RightRail from '../../../components/right-rail';
import PagesRail from '../../../components/rails/pages-rail';
import { fetchPageDetailsAction, fetchMyPagesAction } from '../../../lib/pages/actions';
import { getCurrentUser } from '../../../lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function UniversalPageView({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ tab?: string }>;
}) {
  const { slug } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const activeTab = resolvedSearchParams.tab || 'home';

  const user = await getCurrentUser();
  const pageData = await fetchPageDetailsAction(slug);

  if (!pageData.page || pageData.error) {
    notFound();
  }

  const {
    page,
    products,
    posts,
    followerCount,
    isFollowing,
    currentUserRole,
    canManage,
  } = pageData;

  const myPages = user ? await fetchMyPagesAction() : [];

  const isDeactivated = Boolean(page.is_deactivated || page.is_archived);
  const canPost = ['owner', 'admin', 'editor'].includes(currentUserRole || '');

  return (
    <div className="flex flex-col lg:flex-row gap-6 xl:gap-8 items-start w-full">
      <div className="flex-1 min-w-0 space-y-6 w-full max-w-[840px] xl:max-w-[880px] mx-auto lg:mx-0 animate-fadeIn">
        {/* Deactivation Notice (if page is deactivated and viewer is team member) */}
        {isDeactivated && (
          <div className="p-4 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <p className="font-black text-white">This Page is Currently Deactivated</p>
                <p className="text-amber-300/80">
                  It is hidden from public discovery. Only team members can view it. You can reactivate it anytime in Page Management.
                </p>
              </div>
            </div>
            {canManage && (
              <Link
                href={`/pages/${page.slug}/manage`}
                className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-black text-xs shrink-0 hover:brightness-110 transition-all"
              >
                Manage
              </Link>
            )}
          </div>
        )}

        {/* ── Page Profile Header ── */}
        <div className="surface-card rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
          {/* Cover Banner */}
          <div
            className="h-44 sm:h-56 w-full relative bg-gradient-to-r from-amber-900/40 via-purple-900/40 to-slate-950 bg-cover bg-center"
            style={{
              backgroundImage: page.cover_image_url ? `url('${page.cover_image_url}')` : undefined,
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-[#120B1C] via-transparent to-black/30" />
          </div>

          {/* Identity & Actions Bar */}
          <div className="p-6 sm:p-8 pt-0 relative space-y-5">
            {/* Avatar & Action Row */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 sm:-mt-20">
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-[#120B1C] border-4 border-[#120B1C] shadow-2xl flex items-center justify-center overflow-hidden shrink-0">
                {page.avatar_url ? (
                  <img
                    src={page.avatar_url}
                    alt={page.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-brand-sunriseCoral to-amber-500 flex items-center justify-center text-slate-950 text-4xl font-black">
                    {page.name.charAt(0)}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5">
                <PageFollowButton
                  pageId={page.id}
                  initialIsFollowing={isFollowing}
                  initialFollowerCount={followerCount}
                />

                {page.contact_email && (
                  <a
                    href={`mailto:${page.contact_email}`}
                    className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-black text-xs flex items-center gap-1.5 transition-all min-h-[44px]"
                  >
                    <Mail className="w-4 h-4 text-brand-sandstone" />
                    <span>Contact</span>
                  </a>
                )}

                {canManage && (
                  <Link
                    href={`/pages/${page.slug}/manage`}
                    className="px-5 py-3 rounded-2xl bg-brand-sunriseCoral/10 hover:bg-brand-sunriseCoral/20 border border-brand-sunriseCoral/30 text-brand-sunriseCoral font-black text-xs flex items-center gap-1.5 transition-all min-h-[44px]"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Manage Page</span>
                  </Link>
                )}
              </div>
            </div>

            {/* Title & Metadata */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {page.name}
                </h1>
                <VerificationBadge
                  level={page.is_verified ? 'business_verified' : 'unverified'}
                  showLabel={true}
                />
                {currentUserRole && (
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-brand-sunriseCoral/20 text-brand-sunriseCoral border border-brand-sunriseCoral/30">
                    {currentUserRole}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-brand-sandstone/70 font-bold">
                <span className="text-brand-sunriseCoral">{page.category || 'Universal Page'}</span>
                <span>·</span>
                <span className="flex items-center gap-1 text-white/90">
                  <MapPin className="w-3.5 h-3.5 text-orange-400" />
                  {page.country_iso ? `${page.country_iso} 🌴` : 'Caribbean Basin 🌴'}
                </span>
                <span>·</span>
                <span>
                  {followerCount} {followerCount === 1 ? 'follower' : 'followers'}
                </span>
              </div>

              {page.description && (
                <p className="text-xs sm:text-sm text-brand-sandstone/90 leading-relaxed max-w-3xl pt-1">
                  {page.description}
                </p>
              )}

              {/* Links Row */}
              <div className="flex flex-wrap items-center gap-4 pt-2 text-xs font-bold text-brand-sandstone/60">
                {page.website && (
                  <a
                    href={page.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-brand-caribbeanSea hover:underline"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>{page.website.replace(/^https?:\/\//, '')}</span>
                  </a>
                )}
                {page.phone && (
                  <span className="flex items-center gap-1 text-slate-300">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{page.phone}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-t border-white/10 pt-4 overflow-x-auto scrollbar-none">
              <Link
                href={`/pages/${page.slug}?tab=home`}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 ${
                  activeTab === 'home'
                    ? 'bg-white/15 text-white'
                    : 'text-brand-sandstone/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Home &amp; Posts</span>
              </Link>
              <Link
                href={`/pages/${page.slug}?tab=about`}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 ${
                  activeTab === 'about'
                    ? 'bg-white/15 text-white'
                    : 'text-brand-sandstone/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>About</span>
              </Link>
              {products.length > 0 && (
                <Link
                  href={`/pages/${page.slug}?tab=store`}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 ${
                    activeTab === 'store'
                      ? 'bg-white/15 text-white'
                      : 'text-brand-sandstone/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Store className="w-3.5 h-3.5 text-brand-sunriseCoral" />
                  <span>Storefront ({products.length})</span>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* ── TAB: HOME & POSTS ── */}
        {activeTab === 'home' && (
          <div className="space-y-6">
            {/* Publisher Box for Admins/Editors */}
            {canPost && (
              <PagePostComposer pageId={page.id} pageName={page.name} />
            )}

            {/* Page Posts Stream */}
            {posts.length === 0 ? (
              <div className="surface-card rounded-3xl p-10 text-center space-y-3 border border-white/10">
                <FileText className="w-10 h-10 text-brand-sandstone/40 mx-auto" />
                <h3 className="text-base font-black text-white">No posts published yet</h3>
                <p className="text-xs text-brand-sandstone/70 max-w-sm mx-auto">
                  {canPost
                    ? 'Publish your first official post above to connect with Caribbean followers!'
                    : 'Follow this Page to stay updated when new announcements and content are published.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post: any) => (
                  <article
                    key={post.id}
                    className="surface-card rounded-3xl p-6 border border-white/10 shadow-xl space-y-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center overflow-hidden shrink-0">
                        {page.avatar_url ? (
                          <img src={page.avatar_url} alt={page.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-base font-black text-white">{page.name.charAt(0)}</span>
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-white leading-tight">{page.name}</h4>
                        <span className="text-[10px] text-brand-sandstone/60">
                          {new Date(post.created_at).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                      {post.content}
                    </p>

                    {post.media_urls && post.media_urls.length > 0 && (
                      <div className="rounded-2xl overflow-hidden border border-white/10 max-h-96">
                        <img
                          src={post.media_urls[0]}
                          alt="Post Media"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {post.cultural_tags && post.cultural_tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {post.cultural_tags.map((t: string) => (
                          <span
                            key={t}
                            className="px-2 py-0.5 rounded-lg bg-white/5 text-[10px] font-bold text-brand-caribbeanSea"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="pt-3 border-t border-white/5 flex items-center gap-4 text-xs font-bold text-brand-sandstone/60">
                      <span>{post.likes_count || 0} likes</span>
                      <span>{post.comments_count || 0} comments</span>
                      <span>{post.shares_count || 0} shares</span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB: ABOUT ── */}
        {activeTab === 'about' && (
          <div className="surface-card rounded-3xl p-6 sm:p-8 border border-white/10 shadow-xl space-y-6">
            <h3 className="text-lg font-black text-white">About {page.name}</h3>

            <div className="space-y-4 text-xs sm:text-sm text-brand-sandstone/80 leading-relaxed">
              <p>{page.description || 'Verified Caribbean entity profile on TUKUBI.'}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/10">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-brand-sandstone/50 tracking-wider">
                  Category
                </span>
                <p className="text-xs font-bold text-white">{page.category}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-brand-sandstone/50 tracking-wider">
                  Location &amp; Basin
                </span>
                <p className="text-xs font-bold text-white">
                  {page.country_iso ? `${page.country_iso} 🌴` : 'Caribbean Basin'}
                </p>
              </div>

              {page.website && (
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase text-brand-sandstone/50 tracking-wider">
                    Official Website
                  </span>
                  <p className="text-xs font-bold text-brand-caribbeanSea truncate">{page.website}</p>
                </div>
              )}

              {page.contact_email && (
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase text-brand-sandstone/50 tracking-wider">
                    Contact Email
                  </span>
                  <p className="text-xs font-bold text-white truncate">{page.contact_email}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB: STOREFRONT ── */}
        {activeTab === 'store' && products.length > 0 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {products.map((p: any) => (
                <div
                  key={p.id}
                  className="surface-card rounded-3xl p-5 border border-white/10 shadow-xl space-y-3"
                >
                  <h4 className="text-sm font-black text-white">{p.title}</h4>
                  <p className="text-xs text-brand-sandstone/70 line-clamp-2">
                    {p.description || 'Authentic island product.'}
                  </p>
                  <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                    <span className="text-sm font-black text-brand-sunriseCoral">
                      ${(p.price_minor / 100).toFixed(2)} {p.currency || 'USD'}
                    </span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-white/5 text-brand-sandstone/60">
                      {p.product_kind}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right Rail */}
      <RightRail ariaLabel="Page Directory & Quick Navigation">
        <PagesRail
          myPages={myPages}
          activePage={{
            id: page.id,
            name: page.name,
            slug: page.slug,
            category: page.category,
            is_admin: canManage,
          }}
        />
      </RightRail>
    </div>
  );
}
