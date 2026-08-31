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
} from 'lucide-react';
import Link from 'next/link';
import { createSupabaseServerClient, getCurrentUser } from '../../../lib/supabase/server';
import FollowButton from '../../../components/follow-button';
import ProfileHeaderActions from '../../../components/profile-header-actions';
import UserAvatar from '../../../components/user-avatar';
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
      <div className="min-h-screen bg-[#090D16] text-brand-sandstone flex items-center justify-center p-6">
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
      <div className="min-h-screen bg-[#090D16] text-brand-sandstone flex items-center justify-center p-6">
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
    is_private?: boolean;
  };

  const isOwnProfile = currentUser?.id === profileData.id;

  // Privacy barrier: if profile is private and viewer is not the owner
  if (profileData.is_private && !isOwnProfile) {
    return (
      <div className="min-h-screen bg-[#090D16] text-brand-sandstone flex items-center justify-center p-6">
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
      .select('id, content, created_at')
      .eq('author_id', profileData.id)
      .order('created_at', { ascending: false })
      .limit(20),
    recognitionService.getProfileRecognition(profileData.id),
  ]);

  const counts = (countsResult.data as ProfileCountRow | null) || {
    followers_count: 0,
    following_count: 0,
    posts_count: postsResult.data?.length ?? 0,
    likes_received_count: 0,
  };

  const isFollowing = !!followResult.data;
  const posts = (postsResult.data ?? []) as PostRow[];

  // Privacy filters for visitor view
  const canViewDob = isOwnProfile || profileData.dob_visibility === 'public';
  const canViewAddress = isOwnProfile || profileData.address_visibility === 'public';
  const canViewRelationship = isOwnProfile || profileData.relationship_visibility === 'public';

  const social = profileData.social_links || {};
  const hasSocialLinks = Object.keys(social).some((k) => !!social[k]);

  const locationDisplay = [profileData.city, profileData.island, profileData.country]
    .filter(Boolean)
    .join(', ');

  const coverUrl = profileData.cover_url || profileData.banner_url;

  return (
    <div className="min-h-screen bg-[#090D16] text-brand-sandstone">
      {/* Top sticky app header */}
      <header className="sticky top-0 z-40 bg-[#0F172A]/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-slate-300 hover:text-brand-sandstone text-xs font-bold transition-colors"
          >
            ← Back
          </Link>
          <span className="text-slate-600">|</span>
          <span className="text-xs font-black text-brand-sandstone truncate max-w-[200px] sm:max-w-md">
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
              className="p-2 text-slate-300 hover:text-brand-sandstone rounded-full hover:bg-slate-800 border border-slate-800 transition-colors"
            >
              <Settings className="w-4 h-4" />
            </Link>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Profile Card Header */}
        <section className="bg-brand-dusk/70 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          {/* Cover Banner */}
          <div className="h-36 sm:h-52 relative w-full overflow-hidden bg-gradient-to-r from-sky-950 via-slate-900 to-amber-950/40">
            {coverUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={coverUrl}
                alt={`${profileData.display_name}'s cover`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-tr from-brand-twilight via-slate-900 to-[#1A2642] flex items-center justify-center">
                <span className="text-xs text-brand-sandstone/30 font-bold uppercase tracking-widest">
                  Tukubi Ecosystem
                </span>
              </div>
            )}
          </div>

          {/* Profile Meta & Actions */}
          <div className="p-5 sm:p-6 -mt-14 sm:-mt-16 relative">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="flex items-end gap-4">
                <UserAvatar
                  src={profileData.avatar_url}
                  name={profileData.display_name}
                  size="2xl"
                  className="ring-4 ring-[#090D16] shadow-2xl"
                />

                <div className="mb-2 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl sm:text-2xl font-black text-brand-sandstone tracking-tight">
                      {profileData.display_name}
                    </h1>
                    {profileData.is_verified && (
                      <BadgeCheck className="w-5 h-5 text-brand-caribbeanSea" aria-label="Verified Member" />
                    )}
                    {recognition.founder.is_founder && (
                      <FounderBadge founder={recognition.founder} size="sm" />
                    )}
                    <ReputationIndicator reputation={recognition.reputation} size="sm" />
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs sm:text-sm font-semibold text-brand-sandstone/60">
                      @{profileData.username}
                      {profileData.pronouns && (
                        <span className="ml-2 text-[11px] text-brand-sandstone/40">({profileData.pronouns})</span>
                      )}
                    </p>
                    {/* Top 2 featured badges preview */}
                    {recognition.badges.slice(0, 2).map((b) => (
                      <BadgePill key={b.id} badge={b} size="sm" />
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 sm:pt-0">
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
                      className="flex items-center gap-1.5 bg-brand-caribbeanSea text-slate-950 font-bold text-xs px-4 py-2 rounded-full transition-all"
                    >
                      <UserPlus className="w-3.5 h-3.5" /> Sign in to Follow
                    </Link>
                  )
                )}
              </div>
            </div>

            {/* Bio */}
            {profileData.bio ? (
              <p className="text-sm text-slate-200 mt-4 leading-relaxed max-w-2xl whitespace-pre-wrap">
                {profileData.bio}
              </p>
            ) : isOwnProfile ? (
              <p className="text-xs text-brand-sandstone/40 italic mt-3">
                No bio added yet. Click &quot;Edit Profile&quot; to tell your Caribbean story.
              </p>
            ) : null}

            {/* Sub-meta tags (Location, Website, Join Date) */}
            <div className="mt-4 flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-brand-sandstone/60">
              {locationDisplay && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-brand-sunriseCoral" />
                  <span>{locationDisplay}</span>
                </span>
              )}

              {profileData.website && (
                <a
                  href={profileData.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-brand-caribbeanSea hover:underline"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>{profileData.website.replace(/^https?:\/\//, '')}</span>
                </a>
              )}

              <span className="flex items-center gap-1 text-brand-sandstone/50">
                <Calendar className="w-3.5 h-3.5" />
                <span>Joined {formatJoinDate(profileData.created_at)}</span>
              </span>
            </div>

            {/* Real Statistics Counters */}
            <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center gap-6 text-sm">
              <Link href={`/profile/${profileData.username}?tab=posts`} className="hover:underline">
                <strong className="text-brand-sandstone">{counts.posts_count.toLocaleString()}</strong>{' '}
                <span className="text-brand-sandstone/60">Posts</span>
              </Link>
              <span>
                <strong className="text-brand-sandstone">{counts.followers_count.toLocaleString()}</strong>{' '}
                <span className="text-brand-sandstone/60">Followers</span>
              </span>
              <span>
                <strong className="text-brand-sandstone">{counts.following_count.toLocaleString()}</strong>{' '}
                <span className="text-brand-sandstone/60">Following</span>
              </span>
            </div>
          </div>
        </section>

        {/* Tab Navigation */}
        <nav className="flex border-b border-slate-800 gap-6 text-sm font-bold" aria-label="Profile navigation">
          <Link
            href={`/profile/${profileData.username}?tab=about`}
            className={`pb-3 border-b-2 transition-all ${
              tab === 'about'
                ? 'border-brand-caribbeanSea text-brand-caribbeanSea font-black'
                : 'border-transparent text-brand-sandstone/60 hover:text-slate-200'
            }`}
          >
            About
          </Link>
          <Link
            href={`/profile/${profileData.username}?tab=posts`}
            className={`pb-3 border-b-2 transition-all ${
              tab === 'posts'
                ? 'border-brand-caribbeanSea text-brand-caribbeanSea font-black'
                : 'border-transparent text-brand-sandstone/60 hover:text-slate-200'
            }`}
          >
            Posts ({posts.length})
          </Link>
          <Link
            href={`/profile/${profileData.username}?tab=recognition`}
            className={`pb-3 border-b-2 transition-all flex items-center gap-1.5 ${
              tab === 'recognition'
                ? 'border-brand-goldenHour text-brand-goldenHour font-black'
                : 'border-transparent text-brand-sandstone/60 hover:text-slate-200'
            }`}
          >
            <span>Recognition</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-brand-goldenHour/20 text-amber-300 font-mono">
              {recognition.badges.length + (recognition.founder.is_founder ? 1 : 0)}
            </span>
          </Link>
        </nav>

        {/* TAB: ABOUT CONTENT */}
        {tab === 'about' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Professional & Career */}
            <section className="bg-brand-dusk/60 border border-slate-800 rounded-3xl p-6 space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-brand-caribbeanSea flex items-center gap-2">
                <Briefcase className="w-4 h-4" /> Work &amp; Career
              </h3>

              {profileData.job_title || profileData.employer || profileData.industry ? (
                <div className="text-xs space-y-2 text-brand-sandstone/80">
                  {profileData.job_title && (
                    <p>
                      <span className="text-brand-sandstone/40">Role:</span>{' '}
                      <span className="font-bold text-brand-sandstone">{profileData.job_title}</span>
                    </p>
                  )}
                  {profileData.employer && (
                    <p>
                      <span className="text-brand-sandstone/40">Company:</span>{' '}
                      <span className="text-slate-200">{profileData.employer}</span>
                    </p>
                  )}
                  {profileData.industry && (
                    <p>
                      <span className="text-brand-sandstone/40">Industry:</span>{' '}
                      <span className="text-slate-200">{profileData.industry}</span>
                    </p>
                  )}
                  {profileData.professional_bio && (
                    <p className="pt-2 text-slate-300 italic">{profileData.professional_bio}</p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-brand-sandstone/40">
                  {isOwnProfile ? 'Add your work experience to connect with diaspora opportunities.' : 'No career information listed.'}
                </p>
              )}

              {/* Skills */}
              {profileData.skills && profileData.skills.length > 0 && (
                <div className="pt-3 border-t border-slate-800/80">
                  <span className="text-[11px] font-bold text-brand-sandstone/60 block mb-2">Skills &amp; Expertise</span>
                  <div className="flex flex-wrap gap-1.5">
                    {profileData.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] font-semibold bg-brand-twilight text-brand-caribbeanSea px-2.5 py-1 rounded-lg border border-slate-700"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* Education & Roots */}
            <section className="bg-brand-dusk/60 border border-slate-800 rounded-3xl p-6 space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-brand-goldenHour flex items-center gap-2">
                <GraduationCap className="w-4 h-4" /> Education &amp; Background
              </h3>

              {profileData.education || profileData.school ? (
                <div className="text-xs space-y-2 text-brand-sandstone/80">
                  {profileData.education && (
                    <p>
                      <span className="text-brand-sandstone/40">Degree:</span>{' '}
                      <span className="font-bold text-brand-sandstone">{profileData.education}</span>
                    </p>
                  )}
                  {profileData.school && (
                    <p>
                      <span className="text-brand-sandstone/40">Institution:</span>{' '}
                      <span className="text-slate-200">{profileData.school}</span>
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-brand-sandstone/40">
                  {isOwnProfile ? 'Add your education or academic background.' : 'No education listed.'}
                </p>
              )}

              {/* Personal Details (Privacy Filtered) */}
              <div className="pt-3 border-t border-slate-800/80 space-y-2 text-xs">
                <span className="text-[11px] font-bold text-brand-sandstone/60 block">Personal Information</span>

                {canViewRelationship && profileData.relationship_status && (
                  <p>
                    <span className="text-brand-sandstone/40">Status:</span>{' '}
                    <span className="text-slate-200">{profileData.relationship_status}</span>
                  </p>
                )}

                {profileData.gender && (
                  <p>
                    <span className="text-brand-sandstone/40">Gender:</span>{' '}
                    <span className="text-slate-200">{profileData.gender}</span>
                  </p>
                )}

                {canViewDob && profileData.date_of_birth && (
                  <p>
                    <span className="text-brand-sandstone/40">Date of Birth:</span>{' '}
                    <span className="text-slate-200">{profileData.date_of_birth}</span>
                  </p>
                )}

                {canViewAddress && profileData.address && (
                  <p>
                    <span className="text-brand-sandstone/40">Address:</span>{' '}
                    <span className="text-slate-200">{profileData.address}</span>
                  </p>
                )}
              </div>
            </section>

            {/* Social Links */}
            {hasSocialLinks && (
              <section className="bg-brand-dusk/60 border border-slate-800 rounded-3xl p-6 space-y-3 md:col-span-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-brand-sunriseCoral flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> Social &amp; Web Links
                </h3>
                <div className="flex flex-wrap gap-3 pt-1">
                  {social.instagram && (
                    <a
                      href={`https://instagram.com/${social.instagram}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 text-xs font-bold border border-pink-500/20 transition-colors"
                    >
                      <Instagram className="w-3.5 h-3.5" /> @{social.instagram}
                    </a>
                  )}
                  {social.twitter && (
                    <a
                      href={`https://x.com/${social.twitter}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 text-xs font-bold border border-sky-500/20 transition-colors"
                    >
                      <Twitter className="w-3.5 h-3.5" /> @{social.twitter}
                    </a>
                  )}
                  {social.tiktok && (
                    <a
                      href={`https://tiktok.com/@${social.tiktok}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-xs font-bold border border-cyan-500/20 transition-colors"
                    >
                      <Video className="w-3.5 h-3.5" /> @{social.tiktok}
                    </a>
                  )}
                  {social.youtube && (
                    <a
                      href={social.youtube}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold border border-red-500/20 transition-colors"
                    >
                      <Youtube className="w-3.5 h-3.5" /> YouTube
                    </a>
                  )}
                  {social.linkedin && (
                    <a
                      href={social.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs font-bold border border-blue-500/20 transition-colors"
                    >
                      <Linkedin className="w-3.5 h-3.5" /> LinkedIn
                    </a>
                  )}
                  {social.facebook && (
                    <a
                      href={social.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-xs font-bold border border-indigo-500/20 transition-colors"
                    >
                      <Facebook className="w-3.5 h-3.5" /> Facebook
                    </a>
                  )}
                </div>
              </section>
            )}
          </div>
        )}

        {/* TAB: POSTS CONTENT */}
        {tab === 'posts' && (
          <section className="space-y-4">
            {posts.length === 0 ? (
              <div className="bg-brand-dusk/40 border border-dashed border-slate-800 rounded-3xl p-10 text-center space-y-2">
                <FileText className="w-8 h-8 mx-auto text-brand-sandstone/30" />
                <h4 className="text-sm font-bold text-brand-sandstone">No posts published yet</h4>
                <p className="text-xs text-brand-sandstone/50 max-w-sm mx-auto">
                  {isOwnProfile
                    ? 'Share your thoughts, music, diaspora updates, or stories on Tukubi.'
                    : `@${profileData.username} hasn't published any posts yet.`}
                </p>
                {isOwnProfile && (
                  <div className="pt-2">
                    <Link
                      href="/create"
                      className="inline-block bg-brand-caribbeanSea hover:bg-brand-caribbeanSea text-slate-950 text-xs font-black px-4 py-2 rounded-xl transition-all"
                    >
                      Create Post
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              posts.map((post) => (
                <article key={post.id} className="bg-brand-dusk/60 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <UserAvatar
                      src={profileData.avatar_url}
                      name={profileData.display_name}
                      size="sm"
                    />
                    <div>
                      <span className="text-xs font-bold text-brand-sandstone block">{profileData.display_name}</span>
                      <span className="text-[11px] text-brand-sandstone/40">{relativeTime(post.created_at)}</span>
                    </div>
                  </div>
                  <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{post.content}</p>
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
