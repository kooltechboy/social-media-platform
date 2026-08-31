import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  MapPin,
  Globe,
  ShieldCheck,
  MessageCircle,
  Sparkles,
  ArrowLeft,
  Calendar,
  Share2,
  Lock,
  Plus,
} from 'lucide-react';
import { createSupabaseServerClient, getCurrentUser } from '../../../lib/supabase/server';
import CommunityJoinButton from '../../../components/community-join-button';
import FeedStream, { type FeedPostData } from '../../../components/feed-stream';

export const dynamic = 'force-dynamic';

interface CommunityDetail {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  join_policy: 'public' | 'private' | 'invite_only';
  member_count: number;
  country_iso: string | null;
  created_by: string | null;
  locationTag?: string;
  activeNow?: number;
  flag?: string;
}

export default async function CommunityHubPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug || '').trim().toLowerCase();

  const [user, supabase] = await Promise.all([
    getCurrentUser(),
    createSupabaseServerClient(),
  ]);

  let community: CommunityDetail | null = null;
  let isMember = false;
  let communityPosts: FeedPostData[] = [];

  if (supabase) {
    const { data: dbComm } = await supabase
      .from('communities')
      .select('id, name, slug, description, join_policy, member_count, country_iso, created_by, countries(name, flag_emoji)')
      .eq('slug', decodedSlug)
      .maybeSingle();

    if (dbComm) {
      community = {
        id: dbComm.id,
        name: dbComm.name,
        slug: dbComm.slug,
        description: dbComm.description,
        join_policy: dbComm.join_policy,
        member_count: dbComm.member_count || 1,
        country_iso: dbComm.country_iso,
        created_by: dbComm.created_by,
        locationTag: (dbComm.countries as any)?.name || 'Pan-Caribbean',
        flag: (dbComm.countries as any)?.flag_emoji || '🌴',
      };

      const [memberRes, postsRes] = await Promise.all([
        user
          ? supabase
              .from('community_members')
              .select('community_id')
              .eq('community_id', dbComm.id)
              .eq('user_id', user.id)
              .maybeSingle()
          : Promise.resolve({ data: null }),
        supabase
          .from('posts')
          .select('id, author_id, content, created_at, media_urls, cultural_tags, likes_count, comments_count, shares_count, profiles(display_name, username, is_verified)')
          .order('created_at', { ascending: false })
          .limit(20),
      ]);

      isMember = !!memberRes.data;

      if (postsRes.data && postsRes.data.length > 0) {
        communityPosts = postsRes.data.map((p: any) => {
          const rawProfile = p.profiles;
          const profile = Array.isArray(rawProfile) ? rawProfile[0] : rawProfile;
          return {
            id: p.id,
            authorId: p.author_id,
            author: profile?.display_name || 'Caribbean Member',
            handle: profile?.username || 'member',
            verified: profile?.is_verified ?? true,
            location: community?.name || 'Community Hub',
            time: 'Recent',
            content: p.content || '',
            mediaUrls: p.media_urls || [],
            culturalTags: p.cultural_tags || [],
            likes: p.likes_count || 0,
            reposts: p.shares_count || 0,
            comments: p.comments_count || 0,
            category: 'caribbean',
          };
        });
      }
    }
  }

  if (!community) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-transparent text-brand-sandstone p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
        <Link
          href="/communities"
          className="flex items-center gap-1.5 text-slate-300 hover:text-brand-sandstone text-xs font-bold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Communities
        </Link>
      </div>

      {/* Community Banner Card */}
      <div className="bg-brand-dusk border border-slate-800 rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-2xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="text-4xl md:text-5xl p-4 bg-brand-twilight border border-slate-700/80 rounded-3xl shadow-inner flex items-center justify-center flex-shrink-0">
              {community.flag || '🌴'}
            </div>
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-black text-brand-sandstone">
                  {community.name}
                </h1>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-brand-sunriseCoral/10 text-brand-sunriseCoral border border-brand-sunriseCoral/30">
                  {community.join_policy === 'public' ? 'Public Hub' : 'Private Guild'}
                </span>
              </div>
              <p className="text-xs text-brand-sunriseCoral font-bold flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                {community.locationTag || 'Caribbean & Diaspora'}
              </p>
              {community.description && (
                <p className="text-xs text-slate-300 max-w-2xl leading-relaxed pt-1">
                  {community.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <CommunityJoinButton
              communityId={community.id}
              joinPolicy={community.join_policy}
              isMember={isMember}
              isAuthenticated={!!user}
            />
          </div>
        </div>

        {/* Member Stats Bar */}
        <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-slate-800 text-xs text-brand-sandstone/70">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-brand-sunriseCoral" />
            <span className="font-extrabold text-brand-sandstone">
              {community.member_count.toLocaleString()}
            </span>{' '}
            Members
          </div>
          {community.activeNow && (
            <div className="flex items-center gap-2 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-extrabold">{community.activeNow}</span> Active Now
            </div>
          )}
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-brand-caribbeanSea" />
            <span>Verified Diaspora Guild</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Feed + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Community Feed */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-brand-sandstone flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-brand-sunriseCoral" /> Community Discussions &amp; Updates
            </h2>
          </div>

          <FeedStream
            initialPosts={communityPosts}
            currentUserId={user?.id}
          />
        </div>

        {/* Right 1 Col: Community Guidelines & Sidebar */}
        <div className="space-y-6">
          <div className="bg-brand-dusk/70 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-brand-sandstone/60 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-brand-goldenHour" /> Community Rules
            </h3>
            <ul className="text-xs text-slate-300 space-y-2.5 list-disc list-inside">
              <li>Respect cultural identity and diaspora diversity.</li>
              <li>No harassment, hate speech, or unverified claims.</li>
              <li>Marketplace commerce must use verified merchant escrow.</li>
              <li>Keep discussions constructive, supportive, and authentic.</li>
            </ul>
          </div>

          <div className="bg-brand-dusk/70 border border-slate-800 rounded-3xl p-6 space-y-3 text-xs text-slate-300">
            <h3 className="font-black text-xs uppercase tracking-wider text-brand-sandstone/60 flex items-center gap-2">
              <Globe className="w-4 h-4 text-cyan-400" /> Share Hub
            </h3>
            <p className="text-brand-sandstone/60">
              Invite diaspora friends to join {community.name}.
            </p>
            <div className="p-2.5 rounded-xl bg-brand-twilight border border-slate-700 text-brand-sandstone/80 text-[11px] font-mono select-all break-all">
              https://caribbeanone.app/communities/{community.slug}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
