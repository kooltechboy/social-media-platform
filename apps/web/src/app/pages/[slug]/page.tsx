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
  Mic,
  Radio,
  Play,
  Rss,
  Video,
} from 'lucide-react';
import VerificationBadge from '../../../components/verification-badge';
import PageFollowButton from '../../../components/page-follow-button';
import PagePostComposer from '../../../components/pages/page-post-composer';
import RightRail from '../../../components/right-rail';
import PagesRail from '../../../components/rails/pages-rail';
import FeedStream from '../../../components/feed-stream';
import { fetchPageDetailsAction, fetchMyPagesAction } from '../../../lib/pages/actions';
import { createSupabaseServerClient, getCurrentUser } from '../../../lib/supabase/server';
import { hydratePostsEngagement } from '@/lib/feed/hydrate-posts';
import { formatTimestamp } from '@caribbean/podcasts';

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
  const supabase = await createSupabaseServerClient();
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

  // Query podcasts associated with this Creator Page or its owner
  let pagePodcasts: any[] = [];
  if (supabase) {
    const { data: podData } = await supabase
      .from('podcasts')
      .select(`
        id, title, subtitle, slug, description, cover_path, follower_count, is_paid,
        category, island_territory,
        podcast_episodes(
          id, title, duration_seconds, audio_path, video_path, published_at,
          season_number, episode_number, is_subscriber_only, episode_type
        )
      `)
      .or(`page_id.eq.${page.id},creator_id.eq.${page.owner_id}`)
      .limit(10);

    if (podData) {
      pagePodcasts = podData;
    }
  }

  const hydratedPosts = supabase && posts && posts.length > 0
    ? await hydratePostsEngagement(posts, supabase, { currentUserId: user?.id })
    : [];

  const myPages = user ? await fetchMyPagesAction() : [];

  const isDeactivated = Boolean(page.is_deactivated || page.is_archived);
  const canPost = ['owner', 'admin', 'editor'].includes(currentUserRole || '');

  return (
    <div className="flex flex-col lg:flex-row gap-6 xl:gap-8 items-start w-full">
      <div className="flex-1 min-w-0 space-y-6 w-full max-w-[840px] xl:max-w-[880px] mx-auto lg:mx-0 animate-fadeIn">
        {/* Deactivation Notice */}
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
          {/* Banner */}
          <div className="h-44 sm:h-56 w-full bg-gradient-to-r from-purple-900 via-indigo-950 to-slate-900 relative">
            {page.cover_url && (
              <img
                src={page.cover_url}
                alt={page.name}
                className="w-full h-full object-cover opacity-80"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
          </div>

          <div className="px-6 sm:px-8 pb-6 sm:pb-8 pt-0 relative space-y-4">
            {/* Avatar & Top Row */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 sm:-mt-20">
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-slate-900 border-4 border-slate-950 flex items-center justify-center text-4xl shadow-2xl overflow-hidden shrink-0">
                {page.logo_url ? (
                  <img src={page.logo_url} alt={page.name} className="w-full h-full object-cover" />
                ) : (
                  <span>🌴</span>
                )}
              </div>

              <div className="flex items-center gap-2.5 self-start sm:self-auto">
                <PageFollowButton
                  pageId={page.id}
                  initialIsFollowing={isFollowing}
                  initialFollowerCount={followerCount}
                />

                {canManage && (
                  <Link
                    href={`/pages/${page.slug}/manage`}
                    className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all flex items-center gap-1.5 border border-white/15"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Manage</span>
                  </Link>
                )}
              </div>
            </div>

            {/* Title & Category */}
            <div className="space-y-1 pt-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white">{page.name}</h1>
                {page.is_verified && <VerificationBadge level="business_verified" />}
              </div>
              <p className="text-xs text-brand-sandstone/70">
                @{page.slug} · <span className="text-purple-400 font-bold">{page.category}</span>
                {page.country_iso && ` · ${page.country_iso} 🌴`}
              </p>

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
              <Link
                href={`/pages/${page.slug}?tab=podcasts`}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 ${
                  activeTab === 'podcasts'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                    : 'text-brand-sandstone/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <Mic className="w-3.5 h-3.5 text-purple-400" />
                <span>Podcasts ({pagePodcasts.length})</span>
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
            {/* Featured Podcast Card on Home */}
            {pagePodcasts.length > 0 && (
              <div className="p-5 rounded-3xl bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-slate-900 border border-purple-500/30 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center shrink-0">
                    <Radio className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-purple-400">Featured Podcast</span>
                    <h3 className="text-sm font-black text-white">{pagePodcasts[0].title}</h3>
                    <p className="text-xs text-brand-sandstone/70 line-clamp-1">{pagePodcasts[0].description}</p>
                  </div>
                </div>
                <Link
                  href={`/podcasts/${pagePodcasts[0].slug}`}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black shrink-0 flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Listen</span>
                </Link>
              </div>
            )}

            {/* Publisher Box for Admins/Editors */}
            {canPost && (
              <PagePostComposer pageId={page.id} pageName={page.name} />
            )}

            {/* Page Posts Stream */}
            {hydratedPosts.length === 0 ? (
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
              <FeedStream
                initialPosts={hydratedPosts}
                currentUserId={user?.id}
                mode="page"
              />
            )}
          </div>
        )}

        {/* ── TAB: PODCASTS ── */}
        {activeTab === 'podcasts' && (
          <div className="space-y-6">
            {pagePodcasts.length === 0 ? (
              <div className="surface-card rounded-3xl p-10 text-center space-y-3 border border-white/10">
                <Mic className="w-10 h-10 text-purple-400/60 mx-auto" />
                <h3 className="text-base font-black text-white">No podcasts published by this creator yet</h3>
                <p className="text-xs text-brand-sandstone/70 max-w-sm mx-auto">
                  {canManage
                    ? 'Create and broadcast your first Caribbean audio show or video podcast in Creator Studio.'
                    : 'Check back soon for new audio documentary and podcast episodes.'}
                </p>
                {canManage && (
                  <Link
                    href="/creator-studio?tab=podcasts"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs shadow-md shadow-purple-600/30"
                  >
                    <Plus className="w-4 h-4" /> Host Podcast Show
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {pagePodcasts.map((pod) => {
                  const episodes = (pod.podcast_episodes || []) as any[];
                  return (
                    <div
                      key={pod.id}
                      className="surface-card rounded-3xl p-6 border border-white/10 space-y-4 shadow-xl"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center text-2xl shrink-0">
                            🎙️
                          </div>
                          <div>
                            <span className="text-[10px] font-black uppercase text-purple-400">
                              {pod.category || 'Culture & Talk'}
                            </span>
                            <h3 className="text-base sm:text-lg font-black text-white">{pod.title}</h3>
                            <p className="text-xs text-brand-sandstone/70">
                              {pod.follower_count || 0} Subscribers · {episodes.length} Episode{episodes.length === 1 ? '' : 's'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Link
                            href={`/podcasts/${pod.slug}`}
                            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black flex items-center gap-1.5 shadow-md shadow-purple-600/30"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>Listen Now</span>
                          </Link>
                          <a
                            href={`/api/v1/podcasts/${pod.id}/rss`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-purple-300 text-xs font-bold flex items-center gap-1 border border-white/10"
                          >
                            <Rss className="w-3.5 h-3.5" />
                            <span>RSS</span>
                          </a>
                        </div>
                      </div>

                      {pod.description && (
                        <p className="text-xs sm:text-sm text-brand-sandstone/80 leading-relaxed">
                          {pod.description}
                        </p>
                      )}

                      {/* Episode Previews */}
                      {episodes.length > 0 && (
                        <div className="space-y-2 pt-2">
                          <span className="text-[10px] font-black uppercase text-brand-sandstone/50 tracking-wider">
                            Latest Episodes
                          </span>
                          <div className="space-y-1.5">
                            {episodes.slice(0, 3).map((ep: any) => (
                              <Link
                                key={ep.id}
                                href={`/podcasts/${pod.slug}`}
                                className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-between gap-3 text-xs transition-colors"
                              >
                                <div className="flex items-center gap-2 truncate">
                                  {ep.video_path ? (
                                    <Video className="w-4 h-4 text-indigo-400 shrink-0" />
                                  ) : (
                                    <Mic className="w-4 h-4 text-purple-400 shrink-0" />
                                  )}
                                  <span className="font-bold text-white truncate">
                                    S{ep.season_number}E{ep.episode_number}: {ep.title}
                                  </span>
                                </div>
                                <span className="text-brand-sandstone/60 font-mono text-[11px] shrink-0">
                                  {formatTimestamp(ep.duration_seconds || 1800)}
                                </span>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
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
