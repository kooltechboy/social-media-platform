import React from 'react';
import {
  MapPin,
  Globe,
  BadgeCheck,
  Calendar,
  Settings,
  UserPlus,
  Briefcase,
  GraduationCap,
  Sparkles,
  Lock,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  Facebook,
  Video,
  FileText,
  Pin,
} from 'lucide-react';
import Link from 'next/link';
import { createSupabaseServerClient, getCurrentUser } from '../../../lib/supabase/server';
import FollowButton from '../../../components/follow-button';
import ProfileHeaderActions from '../../../components/profile-header-actions';
import UserAvatar from '../../../components/user-avatar';
import OfficialBadge from '../../../components/official/official-badge';
import type { ProfileData } from '../../../components/profile-edit-modal';
import { RecognitionService } from '../../../lib/recognition/recognition-service';
import FounderBadge from '../../../components/recognition/founder-badge';
import ReputationIndicator from '../../../components/recognition/reputation-indicator';
import BadgePill from '../../../components/recognition/badge-pill';
import ProfileRecognitionTab from '../../../components/recognition/profile-recognition-tab';

export const dynamic = 'force-dynamic';

interface ProfileCountRow {
  followers_count: number;
  following_count: number;
  posts_count: number;
  likes_received_count: number;
}

interface PostRow {
  id: string;
  content: string | null;
  created_at: string;
  media_urls?: string[] | null;
  is_pinned?: boolean;
  is_official?: boolean;
  official_content_type?: string;
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function formatJoinDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  } catch {
    return 'Recently';
  }
}

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { username } = await params;
  const { tab = 'about' } = await searchParams;
  const decodedParam = decodeURIComponent(username || '').trim();

  const [currentUser, supabase] = await Promise.all([
    getCurrentUser(),
    createSupabaseServerClient(),
  ]);

  if (!supabase) {
    return (
      <div className="min-h-screen bg-transparent text-brand-sandstone flex items-center justify-center p-6">
        <div className="bg-brand-dusk/70 border border-slate-800 rounded-3xl p-8 text-center max-w-sm">
          <p className="text-sm text-brand-sandstone/60">Database service temporarily unavailable.</p>
        </div>
      </div>
    );
  }

  // 1. Look up by case-insensitive username first
  let { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .ilike('username', decodedParam)
    .maybeSingle();

  // 2. Fallback lookup by UUID if param matches UUID pattern
  if (!profile && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(decodedParam)) {
    const { data: profileById } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', decodedParam)
      .maybeSingle();
    profile = profileById;
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-transparent text-brand-sandstone flex items-center justify-center p-6">
        <div className="bg-brand-dusk/80 border border-slate-800 rounded-3xl p-8 text-center max-w-md space-y-4">
          <div className="w-16 h-16 rounded-full bg-brand-sunriseCoral/20 text-brand-sunriseCoral border border-brand-sunriseCoral/30 flex items-center justify-center mx-auto text-2xl font-black">
            🌴
          </div>
          <h2 className="text-lg font-black text-brand-sandstone">Member Profile Not Found</h2>
          <p className="text-xs text-brand-sandstone/60 leading-relaxed">
            The profile &quot;@{decodedParam}&quot; could not be located on the Tukubi Network. The username may have changed or the profile may have been removed.
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <Link
              href="/"
              className="bg-brand-dusk hover:bg-slate-800 text-slate-300 text-xs font-bold px-4 py-2 rounded-xl border border-slate-700 transition-colors"
            >
              Return Home
            </Link>
            <Link
              href="/search"
              className="bg-brand-caribbeanSea hover:bg-brand-caribbeanSea text-slate-950 text-xs font-black px-4 py-2 rounded-xl transition-colors"
            >
              Search Ecosystem
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const profileData = profile as unknown as ProfileData & {
    created_at: string;
    is_verified?: boolean;
    is_official?: boolean;
    is_system_account?: boolean;
    is_private?: boolean;
  };

  const isOwnProfile = currentUser?.id === profileData.id;

  // Privacy barrier: if profile is private and viewer is not the owner
  if (profileData.is_private && !isOwnProfile) {
    return (
      <div className="min-h-screen bg-transparent text-brand-sandstone flex items-center justify-center p-6">
        <div className="bg-brand-dusk/80 border border-slate-800 rounded-3xl p-8 text-center max-w-md space-y-4">
          <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto text-2xl font-black">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-black text-brand-sandstone">Private Account</h2>
          <p className="text-xs text-brand-sandstone/60 leading-relaxed">
            @{profileData.username}&apos;s profile is set to private. Only approved followers can view their posts and details.
          </p>
          <Link
            href="/"
            className="inline-block bg-brand-dusk hover:bg-slate-800 text-slate-300 text-xs font-bold px-5 py-2 rounded-xl border border-slate-700 transition-colors"
          >
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  // Fetch real counts, follow status, posts, and recognition in parallel
  const recognitionService = new RecognitionService(supabase);
  const [countsResult, followResult, postsResult, recognition] = await Promise.all([
    supabase
      .from('profile_counts')
      .select('followers_count, following_count, posts_count, likes_received_count')
      .eq('profile_id', profileData.id)
      .maybeSingle(),
    currentUser && !isOwnProfile
      ? supabase
          .from('follows')
          .select('follower_id')
          .eq('follower_id', currentUser.id)
          .eq('following_id', profileData.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from('posts')
      .select('id, content, created_at, media_urls')
      .eq('author_id', profileData.id)
      .order('created_at', { ascending: false })
      .limit(20),
    recognitionService.getProfileRecognition(profileData.id),
  ]);

  const isFollowing = !!followResult.data;
  let posts = (postsResult.data ?? []) as PostRow[];

  // Guarantee official launch post appears on @tukubi profile
  if (posts.length === 0 && profileData.username.toLowerCase() === 'tukubi') {
    posts = [
      {
        id: 'd23f3e75-0dfa-47c6-8df9-2c0fa299d7ff',
        content: `🌴 Welcome to TUKUBI — The Caribbean Connected.\n\nConnecting Caribbean people, culture, creators, businesses & the global diaspora in one unified digital ecosystem.\n\n🌎 Born in the Caribbean. Built for the World.\n\nJoin conversations across the islands, explore live audio/video broadcasts, discover local creators, support Caribbean merchants, and build the future of our digital heritage together. ☀️🌊🎶`,
        created_at: new Date().toISOString(),
        media_urls: [],
        is_pinned: true,
        is_official: true,
        official_content_type: 'welcome',
      },
    ];
  }

  const counts = (countsResult.data as ProfileCountRow | null) || {
    followers_count: 0,
    following_count: 0,
    posts_count: posts.length,
    likes_received_count: 0,
  };

  // Privacy filters for visitor view
  const canViewDob = isOwnProfile || profileData.dob_visibility === 'public';
  const canViewAddress = isOwnProfile || profileData.address_visibility === 'public';
  const canViewRelationship = isOwnProfile || profileData.relationship_visibility === 'public';

  const social = profileData.social_links || {};
  const hasSocialLinks = Object.keys(social).some((k) => !!social[k]);

  const locationDisplay = [profileData.city, profileData.island, profileData.country]
    .filter(Boolean)
    .join(', ');

  const isOfficialTukubi = profileData.username.toLowerCase() === 'tukubi';
  const coverUrl = profileData.cover_url || profileData.banner_url || (isOfficialTukubi ? '/backgrounds/island-vibes.jpg' : null);
  const avatarUrl = profileData.avatar_url || (isOfficialTukubi ? '/brand/tukubi-emblem.png' : null);

  return (
    <div className="min-h-screen bg-transparent text-brand-sandstone pb-12">
      {/* Top sticky app header */}
      <header className="sticky top-0 z-40 surface-header backdrop-blur-xl border-b border-white/15 px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-brand-sandstone/70 hover:text-white text-xs font-bold transition-colors min-h-[36px] px-2"
          >
            ← Back
          </Link>
          <span className="text-white/20">|</span>
          <span className="text-xs sm:text-sm font-black text-white truncate max-w-[200px] sm:max-w-md">
            {profileData.display_name}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <ProfileHeaderActions
            username={profileData.username}
            isOwnProfile={isOwnProfile}
            isAuthenticated={!!currentUser}
            profileData={profileData}
          />
          {isOwnProfile && (
            <Link
              href="/settings"
              aria-label="Account Settings"
              className="p-2.5 text-brand-sandstone/80 hover:text-white rounded-xl hover:bg-white/10 border border-white/15 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
            >
              <Settings className="w-4 h-4" />
            </Link>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Profile Card Header */}
        <section className="surface-card border border-white/15 rounded-3xl overflow-hidden shadow-2xl">
          {/* Cover Banner — High-Resolution Responsive Container */}
          <div className="h-44 sm:h-56 md:h-64 lg:h-72 relative w-full overflow-hidden bg-gradient-to-r from-sky-950 via-slate-900 to-amber-950/40">
            {coverUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={coverUrl}
                  alt={`${profileData.display_name}'s cover`}
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/30 pointer-events-none" />
              </>
            ) : (
              <div className="w-full h-full bg-gradient-to-tr from-slate-950 via-slate-900 to-slate-950" />
            )}
          </div>

          {/* Profile Meta & Actions */}
          <div className="p-6 sm:p-8 -mt-16 sm:-mt-20 relative">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5">
                <UserAvatar
                  src={avatarUrl}
                  name={profileData.display_name}
                  size="2xl"
                  className="ring-4 ring-slate-950 shadow-2xl shrink-0"
                />

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight flex items-center gap-2">
                      <span>{profileData.display_name}</span>
                      {isOfficialTukubi ? (
                        <OfficialBadge
                          size="md"
                          showLabel={true}
                          label="Official TUKUBI"
                        />
                      ) : profileData.is_official || profileData.is_system_account ? (
                        <OfficialBadge
                          size="md"
                          showLabel={true}
                          label="Official Platform"
                        />
                      ) : profileData.is_verified ? (
                        <BadgeCheck className="w-6 h-6 text-orange-400 shrink-0" aria-label="Verified Member" />
                      ) : null}
                    </h1>

                    {recognition.founder.is_founder && (
                      <FounderBadge founder={recognition.founder} size="sm" />
                    )}

                    {profileData.account_type && profileData.account_type !== 'personal' && (
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-orange-500/15 text-orange-300 border border-orange-500/30 font-black uppercase tracking-wider">
                        {profileData.account_type}
                      </span>
                    )}

                    {!isOfficialTukubi && (
                      <ReputationIndicator reputation={recognition.reputation} size="sm" />
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm sm:text-base font-bold text-brand-sandstone/80">
                      @{profileData.username}
                      {profileData.pronouns && (
                        <span className="ml-2 text-xs text-brand-sandstone/50">({profileData.pronouns})</span>
                      )}
                    </p>
                    {/* Top 2 featured badges preview */}
                    {recognition.badges.slice(0, 2).map((b) => (
                      <BadgePill key={b.id} badge={b} size="sm" />
                    ))}
                  </div>

                  {isOfficialTukubi && (
                    <div className="pt-1 text-xs sm:text-sm text-orange-300 font-black tracking-wide">
                      The Caribbean Connected. Born in the Caribbean. Built for the World.
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2 sm:pt-0 self-stretch sm:self-auto justify-end">
                {isOwnProfile ? (
                  <ProfileHeaderActions
                    username={profileData.username}
                    isOwnProfile={true}
                    isAuthenticated={true}
                    profileData={profileData}
                  />
                ) : (
                  currentUser ? (
                    <FollowButton
                      targetUserId={profileData.id}
                      isFollowing={isFollowing}
                    />
                  ) : (
                    <Link
                      href="/login"
                      className="flex items-center gap-1.5 bg-gradient-to-r from-orange-500 via-amber-500 to-emerald-400 hover:brightness-110 text-slate-950 font-black text-xs sm:text-sm px-5 py-2.5 rounded-2xl transition-all shadow-md min-h-[44px]"
                    >
                      <UserPlus className="w-4 h-4" /> Sign in to Follow
                    </Link>
                  )
                )}
              </div>
            </div>

            {/* Bio */}
            {profileData.bio ? (
              <p className="text-sm sm:text-base text-brand-sandstone/90 mt-5 leading-relaxed max-w-2xl whitespace-pre-wrap font-normal">
                {profileData.bio}
              </p>
            ) : isOwnProfile ? (
              <p className="text-xs sm:text-sm text-brand-sandstone/50 italic mt-4">
                No bio added yet. Click &quot;Edit Profile&quot; to tell your Caribbean story.
              </p>
            ) : null}

            {/* Sub-meta tags (Location, Website, Join Date) */}
            <div className="mt-5 flex flex-wrap items-center gap-y-2 gap-x-5 text-xs sm:text-sm text-brand-sandstone/75 font-medium">
              {locationDisplay && (
                <span className="flex items-center gap-1.5 text-orange-300 font-bold">
                  <MapPin className="w-4 h-4 text-orange-400 shrink-0" />
                  <span>{locationDisplay}</span>
                </span>
              )}

              {profileData.website && (
                <a
                  href={profileData.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-orange-300 hover:underline font-bold"
                >
                  <Globe className="w-4 h-4 text-orange-400 shrink-0" />
                  <span>{profileData.website.replace(/^https?:\/\//, '')}</span>
                </a>
              )}

              <span className="flex items-center gap-1.5 text-brand-sandstone/60">
                <Calendar className="w-4 h-4 text-brand-sandstone/60 shrink-0" />
                <span>Joined {formatJoinDate(profileData.created_at)}</span>
              </span>
            </div>

            {/* Real Statistics Counters */}
            <div className="mt-6 pt-5 border-t border-white/10 flex items-center gap-8 text-sm sm:text-base">
              <Link href={`/profile/${profileData.username}?tab=posts`} className="hover:text-white transition-colors">
                <strong className="text-white font-black text-base sm:text-lg">{counts.posts_count.toLocaleString()}</strong>{' '}
                <span className="text-brand-sandstone/70">Posts</span>
              </Link>
              <span>
                <strong className="text-white font-black text-base sm:text-lg">{counts.followers_count.toLocaleString()}</strong>{' '}
                <span className="text-brand-sandstone/70">Followers</span>
              </span>
              <span>
                <strong className="text-white font-black text-base sm:text-lg">{counts.following_count.toLocaleString()}</strong>{' '}
                <span className="text-brand-sandstone/70">Following</span>
              </span>
            </div>
          </div>
        </section>

        {/* Tab Navigation */}
        <nav className="flex border-b border-white/15 gap-8 text-sm font-black" aria-label="Profile navigation">
          <Link
            href={`/profile/${profileData.username}?tab=about`}
            className={`pb-3.5 border-b-2 transition-all min-h-[44px] flex items-center ${
              tab === 'about'
                ? 'border-orange-500 text-orange-400 font-black'
                : 'border-transparent text-brand-sandstone/70 hover:text-white'
            }`}
          >
            About
          </Link>
          <Link
            href={`/profile/${profileData.username}?tab=posts`}
            className={`pb-3.5 border-b-2 transition-all min-h-[44px] flex items-center ${
              tab === 'posts'
                ? 'border-orange-500 text-orange-400 font-black'
                : 'border-transparent text-brand-sandstone/70 hover:text-white'
            }`}
          >
            Posts ({posts.length})
          </Link>
          <Link
            href={`/profile/${profileData.username}?tab=recognition`}
            className={`pb-3.5 border-b-2 transition-all flex items-center gap-2 min-h-[44px] ${
              tab === 'recognition'
                ? 'border-amber-400 text-amber-300 font-black'
                : 'border-transparent text-brand-sandstone/70 hover:text-white'
            }`}
          >
            <span>Recognition</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-500/30">
              {recognition.badges.length + (recognition.founder.is_founder ? 1 : 0)}
            </span>
          </Link>
        </nav>


        {/* TAB: ABOUT CONTENT */}
        {tab === 'about' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Professional & Career */}
            <section className="surface-card rounded-3xl p-6 sm:p-7 space-y-4 border border-white/15">
              <h3 className="text-xs font-black uppercase tracking-wider text-orange-400 flex items-center gap-2">
                <Briefcase className="w-4 h-4" /> Work &amp; Career
              </h3>

              {profileData.job_title || profileData.employer || profileData.industry ? (
                <div className="text-xs sm:text-sm space-y-2.5 text-brand-sandstone/85">
                  {profileData.job_title && (
                    <p>
                      <span className="text-brand-sandstone/50 font-medium">Role:</span>{' '}
                      <span className="font-black text-white">{profileData.job_title}</span>
                    </p>
                  )}
                  {profileData.employer && (
                    <p>
                      <span className="text-brand-sandstone/50 font-medium">Company:</span>{' '}
                      <span className="text-white font-medium">{profileData.employer}</span>
                    </p>
                  )}
                  {profileData.industry && (
                    <p>
                      <span className="text-brand-sandstone/50 font-medium">Industry:</span>{' '}
                      <span className="text-white font-medium">{profileData.industry}</span>
                    </p>
                  )}
                  {profileData.professional_bio && (
                    <p className="pt-2 text-brand-sandstone/90 italic">{profileData.professional_bio}</p>
                  )}
                </div>
              ) : (
                <p className="text-xs sm:text-sm text-brand-sandstone/50">
                  {isOwnProfile ? 'Add your work experience to connect with diaspora opportunities.' : 'No career information listed.'}
                </p>
              )}

              {/* Skills */}
              {profileData.skills && profileData.skills.length > 0 && (
                <div className="pt-4 border-t border-white/10">
                  <span className="text-xs font-black text-brand-sandstone/70 block mb-2 uppercase tracking-wider">Skills &amp; Expertise</span>
                  <div className="flex flex-wrap gap-2">
                    {profileData.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="text-xs font-bold bg-white/5 text-orange-300 px-3 py-1.5 rounded-xl border border-white/10"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* Education & Roots */}
            <section className="surface-card rounded-3xl p-6 sm:p-7 space-y-4 border border-white/15">
              <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <GraduationCap className="w-4 h-4" /> Education &amp; Background
              </h3>

              {profileData.education || profileData.school ? (
                <div className="text-xs sm:text-sm space-y-2.5 text-brand-sandstone/85">
                  {profileData.education && (
                    <p>
                      <span className="text-brand-sandstone/50 font-medium">Degree:</span>{' '}
                      <span className="font-black text-white">{profileData.education}</span>
                    </p>
                  )}
                  {profileData.school && (
                    <p>
                      <span className="text-brand-sandstone/50 font-medium">Institution:</span>{' '}
                      <span className="text-white font-medium">{profileData.school}</span>
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs sm:text-sm text-brand-sandstone/50">
                  {isOwnProfile ? 'Add your education or academic background.' : 'No education listed.'}
                </p>
              )}

              {/* Personal Details (Privacy Filtered) */}
              <div className="pt-4 border-t border-white/10 space-y-2.5 text-xs sm:text-sm">
                <span className="text-xs font-black text-brand-sandstone/70 block uppercase tracking-wider">Personal Information</span>

                {canViewRelationship && profileData.relationship_status && (
                  <p>
                    <span className="text-brand-sandstone/50 font-medium">Status:</span>{' '}
                    <span className="text-white font-medium">{profileData.relationship_status}</span>
                  </p>
                )}

                {profileData.gender && (
                  <p>
                    <span className="text-brand-sandstone/50 font-medium">Gender:</span>{' '}
                    <span className="text-white font-medium">{profileData.gender}</span>
                  </p>
                )}

                {canViewDob && profileData.date_of_birth && (
                  <p>
                    <span className="text-brand-sandstone/50 font-medium">Date of Birth:</span>{' '}
                    <span className="text-white font-medium">{profileData.date_of_birth}</span>
                  </p>
                )}

                {canViewAddress && profileData.address && (
                  <p>
                    <span className="text-brand-sandstone/50 font-medium">Address:</span>{' '}
                    <span className="text-white font-medium">{profileData.address}</span>
                  </p>
                )}
              </div>
            </section>

            {/* Social Links */}
            {hasSocialLinks && (
              <section className="surface-card rounded-3xl p-6 sm:p-7 space-y-4 md:col-span-2 border border-white/15">
                <h3 className="text-xs font-black uppercase tracking-wider text-orange-400 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> Social &amp; Web Links
                </h3>
                <div className="flex flex-wrap gap-3 pt-1">
                  {social.instagram && (
                    <a
                      href={`https://instagram.com/${social.instagram}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-pink-500/10 hover:bg-pink-500/20 text-pink-300 text-xs font-bold border border-pink-500/30 transition-colors min-h-[40px]"
                    >
                      <Instagram className="w-4 h-4" /> @{social.instagram}
                    </a>
                  )}
                  {social.twitter && (
                    <a
                      href={`https://x.com/${social.twitter}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 text-xs font-bold border border-sky-500/30 transition-colors min-h-[40px]"
                    >
                      <Twitter className="w-4 h-4" /> @{social.twitter}
                    </a>
                  )}
                  {social.tiktok && (
                    <a
                      href={`https://tiktok.com/@${social.tiktok}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-xs font-bold border border-cyan-500/30 transition-colors min-h-[40px]"
                    >
                      <Video className="w-4 h-4" /> @{social.tiktok}
                    </a>
                  )}
                  {social.youtube && (
                    <a
                      href={social.youtube}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs font-bold border border-red-500/30 transition-colors min-h-[40px]"
                    >
                      <Youtube className="w-4 h-4" /> YouTube
                    </a>
                  )}
                  {social.linkedin && (
                    <a
                      href={social.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-500/30 transition-colors min-h-[40px]"
                    >
                      <Linkedin className="w-4 h-4" /> LinkedIn
                    </a>
                  )}
                  {social.facebook && (
                    <a
                      href={social.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30 transition-colors min-h-[40px]"
                    >
                      <Facebook className="w-4 h-4" /> Facebook
                    </a>
                  )}
                </div>
              </section>
            )}
          </div>
        )}

        {/* TAB: POSTS CONTENT */}
        {tab === 'posts' && (
          <section className="space-y-5">
            {posts.length === 0 ? (
              <div className="surface-card rounded-3xl p-12 text-center space-y-4 max-w-md mx-auto border border-white/10">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/15 flex items-center justify-center mx-auto text-brand-sandstone/60">
                  <FileText className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-lg font-black text-white">No posts published yet</h4>
                  <p className="text-xs sm:text-sm text-brand-sandstone/70 max-w-sm mx-auto leading-relaxed">
                    {isOwnProfile
                      ? 'Share your thoughts, music, diaspora updates, or stories with the Caribbean network.'
                      : `@${profileData.username} hasn't published any posts yet.`}
                  </p>
                </div>
                {isOwnProfile && (
                  <div className="pt-2">
                    <Link
                      href="/create"
                      className="inline-flex items-center justify-center bg-gradient-to-r from-orange-500 via-amber-500 to-emerald-400 hover:brightness-110 text-slate-950 text-xs sm:text-sm font-black px-6 py-3 rounded-2xl transition-all shadow-md min-h-[44px]"
                    >
                      Create First Post
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              posts.map((post) => (
                <article key={post.id} className="surface-card surface-card-interactive rounded-3xl p-6 space-y-4 border border-white/10 shadow-xl">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      <UserAvatar
                        src={profileData.avatar_url}
                        name={profileData.display_name}
                        size="sm"
                      />
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm font-black text-white">{profileData.display_name}</span>
                          {profileData.is_official && (
                            <OfficialBadge size="xs" showLabel={false} />
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-brand-sandstone/50 font-medium">
                          <span>{relativeTime(post.created_at)}</span>
                          {post.official_content_type && (
                            <>
                              <span>•</span>
                              <span className="text-orange-400 font-bold capitalize">
                                {post.official_content_type.replace('_', ' ')}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    {post.is_pinned && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-black text-orange-400 bg-orange-500/15 px-3 py-1 rounded-full border border-orange-500/30">
                        <Pin className="w-3 h-3" />
                        Pinned
                      </span>
                    )}
                  </div>
                  {post.content && (
                    <p className="text-sm sm:text-base text-brand-sandstone/95 leading-relaxed whitespace-pre-wrap font-normal">{post.content}</p>
                  )}
                  {post.media_urls && post.media_urls.length > 0 && (
                    <div className={`grid gap-3 rounded-2xl overflow-hidden ${
                      post.media_urls.length === 1 ? 'grid-cols-1 max-h-96' : 'grid-cols-2 max-h-80'
                    }`}>
                      {post.media_urls.map((url, idx) => {
                        const isVideo = url.match(/\.(mp4|webm|ogg|mov)$/i) || url.includes('/video');
                        return isVideo ? (
                          <video
                            key={idx}
                            src={url}
                            controls
                            className="w-full h-full object-cover rounded-xl bg-black"
                          />
                        ) : (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            key={idx}
                            src={url}
                            alt={`Post attachment ${idx + 1}`}
                            className="w-full h-full object-cover rounded-xl"
                          />
                        );
                      })}
                    </div>
                  )}
                </article>
              ))
            )}
          </section>
        )}

        {/* TAB: RECOGNITION CONTENT */}
        {tab === 'recognition' && (
          <ProfileRecognitionTab
            recognition={recognition}
            username={profileData.username}
            isOwnProfile={isOwnProfile}
          />
        )}
      </main>
    </div>
  );
}
