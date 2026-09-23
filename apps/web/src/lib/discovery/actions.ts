'use server';

import { createSupabaseServerClient, getCurrentUser } from '../supabase/server';
import { sanitizeSearchTerm, computeMatchScore, type SearchHit, type UniversalSearchResults } from '@caribbean/search';
import { scoreRecommendationCandidate, diversifyRecommendations, type ScoredRecommendation } from '@caribbean/recommendations';
import { getRelationshipBatchAction } from '../social/relationship-actions';
import { CARIBBEAN_TERRITORIES_BY_ISO } from '../constants/caribbean-territories';

export interface DiscoverProfile {
  id: string;
  display_name: string;
  username: string;
  avatar_url?: string | null;
  bio?: string | null;
  origin_country_iso?: string | null;
  country_name?: string | null;
  is_verified?: boolean;
  is_official?: boolean;
  account_type?: string;
  mutual_count?: number;
  friends_count?: number;
  followers_count?: number;
  following_count?: number;
  messaging_permission?: string;
  relationship?: {
    state: string;
    isFollowing: boolean;
    isFollower?: boolean;
    friendshipStatus: string;
    isBlocked?: boolean;
  };
  recommendationReason?: string;
  badgeIcon?: string;
}

export interface DiscoverBusiness {
  id: string;
  name: string;
  slug: string;
  category: string;
  description?: string | null;
  is_verified?: boolean;
  country_iso?: string | null;
  phone?: string | null;
  website?: string | null;
  owner_id: string;
  relationship?: {
    state: string;
    isFollowing: boolean;
  };
}

export interface DiscoverCommunity {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  member_count: number;
  country_iso?: string | null;
  join_policy: string;
}

export interface DiscoverEvent {
  id: string;
  title: string;
  description?: string | null;
  event_kind: string;
  venue?: string | null;
  starts_at: string;
  capacity?: number | null;
  city_name?: string | null;
  country_iso?: string | null;
}

export interface DiscoverProduct {
  id: string;
  title: string;
  description?: string | null;
  price_minor: number;
  currency: string;
  product_kind: string;
  seller_id: string;
}

export interface DiscoverPost {
  id: string;
  author_id: string;
  content: string | null;
  created_at: string;
  media_urls?: string[] | null;
  likes_count: number;
  comments_count: number;
  profiles?: {
    display_name: string;
    username: string;
    avatar_url?: string | null;
    is_verified?: boolean;
  } | null;
}

export interface DiscoverReel {
  id: string;
  title: string;
  thumbnail_url?: string | null;
  views: number;
  likes: number;
  comments: number;
  aspect_ratio: string;
  creator: {
    display_name: string;
    username: string;
  };
}

export interface DiscoverSound {
  id: string;
  title: string;
  artist: string;
  genre: string;
  flag: string;
  country_name: string;
  usage_count: number;
  licensing_status: string;
}

export interface DiscoverLiveStream {
  id: string;
  title: string;
  state: string;
  peak_viewers: number;
  category: string;
  host: {
    display_name: string;
    username: string;
  };
}

export interface DiscoverPodcast {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  category: string;
  cover_path: string | null;
  follower_count: number;
  host: {
    display_name: string;
    username: string;
  };
}

/**
 * Safely resolves country information from profile database fields
 * Supports existing database columns (country, island, city) and future origin_country_iso
 */
function resolveProfileCountry(p: {
  country?: string | null;
  island?: string | null;
  city?: string | null;
  origin_country_iso?: string | null;
}): { iso: string | null; name: string | null } {
  if (p.origin_country_iso) {
    const info = CARIBBEAN_TERRITORIES_BY_ISO[p.origin_country_iso.toUpperCase()];
    return {
      iso: p.origin_country_iso.toUpperCase(),
      name: info?.name || p.origin_country_iso,
    };
  }

  const raw = (p.country || p.island || '').trim();
  if (!raw) return { iso: null, name: null };

  if (raw.length === 3 && CARIBBEAN_TERRITORIES_BY_ISO[raw.toUpperCase()]) {
    return {
      iso: raw.toUpperCase(),
      name: CARIBBEAN_TERRITORIES_BY_ISO[raw.toUpperCase()].name,
    };
  }

  const match = Object.values(CARIBBEAN_TERRITORIES_BY_ISO).find(
    (t) => t.name.toLowerCase() === raw.toLowerCase()
  );
  if (match) {
    return { iso: match.iso, name: match.name };
  }

  return { iso: null, name: raw };
}

/**
 * Universal multi-entity search across TUKUBI
 */
export async function universalSearchAction(params: {
  term: string;
  category?: string;
  countryIso?: string;
  page?: number;
  limit?: number;
}): Promise<UniversalSearchResults & {
  profilesData: DiscoverProfile[];
  businessesData: DiscoverBusiness[];
  communitiesData: DiscoverCommunity[];
  eventsData: DiscoverEvent[];
  productsData: DiscoverProduct[];
  postsData: DiscoverPost[];
  reelsData: DiscoverReel[];
  soundsData: DiscoverSound[];
  livestreamsData: DiscoverLiveStream[];
  podcastsData: DiscoverPodcast[];
}> {
  const query = sanitizeSearchTerm(params.term || '');
  const limit = Math.min(Math.max(params.limit || 20, 1), 50);
  const page = Math.max(params.page || 1, 1);
  const offset = (page - 1) * limit;

  const [user, supabase] = await Promise.all([
    getCurrentUser(),
    createSupabaseServerClient(),
  ]);

  const emptyResult = {
    query,
    totalHits: 0,
    hits: [],
    byEntity: {
      profiles: [],
      creators: [],
      businesses: [],
      merchants: [],
      pages: [],
      communities: [],
      events: [],
      posts: [],
    },
    profilesData: [],
    businessesData: [],
    communitiesData: [],
    eventsData: [],
    productsData: [],
    postsData: [],
    reelsData: [],
    soundsData: [],
    livestreamsData: [],
    podcastsData: [],
  };

  if (!supabase || !query) {
    return emptyResult;
  }

  try {
    const termFilter = `%${query.replace(/^@/, '')}%`;

    // 1. Profiles Search (People, Creators)
    let profileQuery = supabase
      .from('profiles')
      .select('id, display_name, username, avatar_url, bio, country, island, city, is_verified, account_type, status, is_private')
      .eq('is_private', false)
      .neq('status', 'suspended')
      .or(`display_name.ilike.${termFilter},username.ilike.${termFilter},first_name.ilike.${termFilter},last_name.ilike.${termFilter}`)
      .limit(limit);

    // 2. Businesses Search
    let businessQuery = supabase
      .from('businesses')
      .select('id, name, slug, category, description, is_verified, country_iso, phone, website, owner_id')
      .or(`name.ilike.${termFilter},description.ilike.${termFilter},category.ilike.${termFilter}`)
      .limit(limit);

    if (params.countryIso) {
      businessQuery = businessQuery.eq('country_iso', params.countryIso.toUpperCase());
    }

    // 3. Communities Search
    let communityQuery = supabase
      .from('communities')
      .select('id, name, slug, description, member_count, country_iso, join_policy')
      .or(`name.ilike.${termFilter},description.ilike.${termFilter},slug.ilike.${termFilter}`)
      .limit(limit);

    if (params.countryIso) {
      communityQuery = communityQuery.eq('country_iso', params.countryIso.toUpperCase());
    }

    // 4. Events Search
    let eventQuery = supabase
      .from('events')
      .select('id, title, description, event_kind, venue, starts_at, capacity, cities(name, country_iso)')
      .or(`title.ilike.${termFilter},description.ilike.${termFilter}`)
      .order('starts_at', { ascending: true })
      .limit(limit);

    // 5. Products / Merchants Search
    let productQuery = supabase
      .from('products')
      .select('id, title, description, price_minor, currency, product_kind, seller_id, is_active')
      .eq('is_active', true)
      .or(`title.ilike.${termFilter},description.ilike.${termFilter}`)
      .limit(limit);

    // 6. Posts Search
    let postQuery = supabase
      .from('posts')
      .select('id, author_id, content, created_at, media_urls, likes_count, comments_count, profiles:profiles!posts_author_id_fkey(display_name, username, avatar_url, is_verified)')
      .eq('visibility', 'public')
      .ilike('content', termFilter)
      .order('created_at', { ascending: false })
      .limit(limit);

    // 7. Reels Search
    let reelQuery = supabase
      .from('videos')
      .select('id, title, thumbnail_url, view_count, likes_count, comments_count, aspect_ratio, profiles:profiles!videos_creator_id_fkey(display_name, username)')
      .eq('video_kind', 'short')
      .eq('visibility', 'public')
      .or(`title.ilike.${termFilter},description.ilike.${termFilter}`)
      .limit(limit);

    // 8. Sounds Search
    let soundQuery = supabase
      .from('sounds')
      .select('id, title, artist, genre, country_iso, country_name, usage_count, licensing_status')
      .or(`title.ilike.${termFilter},artist.ilike.${termFilter},genre.ilike.${termFilter}`)
      .limit(limit);

    // 9. Live Streams Search
    let liveQuery = supabase
      .from('livestreams')
      .select('id, title, state, peak_viewers, category, profiles(display_name, username)')
      .in('state', ['live', 'scheduled'])
      .or(`title.ilike.${termFilter},category.ilike.${termFilter}`)
      .limit(limit);

    // 10. Podcasts Search
    let podcastQuery = supabase
      .from('podcasts')
      .select('id, title, slug, description, category, cover_path, follower_count, profiles:profiles!podcasts_creator_id_fkey(display_name, username)')
      .or(`title.ilike.${termFilter},description.ilike.${termFilter}`)
      .limit(limit);

    const [pRes, bRes, cRes, eRes, prodRes, postRes, rRes, sRes, lRes, podRes] = await Promise.all([
      profileQuery,
      businessQuery,
      communityQuery,
      eventQuery,
      productQuery,
      postQuery,
      reelQuery,
      soundQuery,
      liveQuery,
      podcastQuery,
    ]);

    const rawProfiles = pRes.data || [];
    const rawBusinesses = bRes.data || [];
    const rawCommunities = cRes.data || [];
    const rawEvents = eRes.data || [];
    const rawProducts = prodRes.data || [];
    const rawPosts = (postRes.data || []).map((p: any) => {
      const raw = p.profiles;
      const prof = Array.isArray(raw) ? raw[0] : raw;
      return { ...p, profiles: prof };
    });

    // Fetch relationship batch for profiles if user is signed in
    const profileIds = rawProfiles.map((p) => p.id);
    const relationshipMap = user ? await getRelationshipBatchAction(profileIds) : {};

    const profilesData: DiscoverProfile[] = rawProfiles.map((p) => {
      const countryInfo = resolveProfileCountry(p);
      return {
        id: p.id,
        display_name: p.display_name,
        username: p.username,
        avatar_url: p.avatar_url,
        bio: p.bio,
        origin_country_iso: countryInfo.iso,
        country_name: countryInfo.name,
        is_verified: !!p.is_verified,
        is_official: p.username?.toLowerCase() === 'tukubi' || !!(p as any).is_official,
        account_type: p.account_type,
        relationship: relationshipMap[p.id] || { state: 'none', isFollowing: false, friendshipStatus: 'none' },
      };
    });

    const businessesData: DiscoverBusiness[] = rawBusinesses.map((b) => ({
      id: b.id,
      name: b.name,
      slug: b.slug,
      category: b.category,
      description: b.description,
      is_verified: !!b.is_verified,
      country_iso: b.country_iso,
      phone: b.phone,
      website: b.website,
      owner_id: b.owner_id,
      relationship: { state: 'none', isFollowing: false },
    }));

    const communitiesData: DiscoverCommunity[] = rawCommunities.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      member_count: c.member_count || 0,
      country_iso: c.country_iso,
      join_policy: c.join_policy || 'public',
    }));

    const eventsData: DiscoverEvent[] = rawEvents.map((e: any) => ({
      id: e.id,
      title: e.title,
      description: e.description,
      event_kind: e.event_kind || 'cultural',
      venue: e.venue,
      starts_at: e.starts_at,
      capacity: e.capacity,
      city_name: e.cities?.name || null,
      country_iso: e.cities?.country_iso || null,
    }));

    const productsData: DiscoverProduct[] = rawProducts.map((pr) => ({
      id: pr.id,
      title: pr.title,
      description: pr.description,
      price_minor: pr.price_minor,
      currency: pr.currency || 'USD',
      product_kind: pr.product_kind || 'physical',
      seller_id: pr.seller_id,
    }));

    // Map into normalized SearchHit format for ranking & categorization
    const hits: SearchHit[] = [];

    profilesData.forEach((p) => {
      let score = Math.max(
        computeMatchScore(p.display_name, query, 1.2),
        computeMatchScore(p.username, query, 1.3)
      );
      const isOfficialAccount = p.is_official || p.username.toLowerCase() === 'tukubi';
      if (isOfficialAccount) {
        score = score * 1.5 + 5;
      }
      const isCreator = p.account_type === 'creator';
      hits.push({
        entityType: isCreator ? 'creators' : 'profiles',
        entityId: p.id,
        title: p.display_name,
        subtitle: isOfficialAccount
          ? `@${p.username} • Official TUKUBI Account`
          : `@${p.username}`,
        snippet: p.bio || undefined,
        avatarUrl: p.avatar_url,
        badge: isOfficialAccount ? 'OFFICIAL' : p.is_verified ? 'VERIFIED' : undefined,
        score,
        metadata: { ...p },
      });
    });

    businessesData.forEach((b) => {
      const score = computeMatchScore(b.name, query, 1.1);
      hits.push({
        entityType: 'businesses',
        entityId: b.id,
        title: b.name,
        subtitle: `${b.category} • Page`,
        snippet: b.description || undefined,
        badge: b.is_verified ? 'VERIFIED PAGE' : 'PAGE',
        score,
        metadata: { ...b },
      });
    });

    communitiesData.forEach((c) => {
      const score = computeMatchScore(c.name, query, 1.0);
      hits.push({
        entityType: 'communities',
        entityId: c.id,
        title: c.name,
        subtitle: `${c.member_count} members`,
        snippet: c.description || undefined,
        score,
        metadata: { ...c },
      });
    });

    eventsData.forEach((e) => {
      const score = computeMatchScore(e.title, query, 1.0);
      hits.push({
        entityType: 'events',
        entityId: e.id,
        title: e.title,
        subtitle: new Date(e.starts_at).toLocaleDateString(),
        snippet: e.description || undefined,
        score,
        metadata: { ...e },
      });
    });

    productsData.forEach((prod) => {
      const score = computeMatchScore(prod.title, query, 0.9);
      hits.push({
        entityType: 'products',
        entityId: prod.id,
        title: prod.title,
        subtitle: `$${(prod.price_minor / 100).toFixed(2)} ${prod.currency}`,
        snippet: prod.description || undefined,
        score,
        metadata: { ...prod },
      });
    });

    rawPosts.forEach((post) => {
      const score = computeMatchScore(post.content || '', query, 0.8);
      hits.push({
        entityType: 'posts',
        entityId: post.id,
        title: post.profiles?.display_name || 'Member',
        subtitle: `@${post.profiles?.username || 'member'}`,
        snippet: post.content || undefined,
        score,
        metadata: { ...post },
      });
    });

    const reelsData: DiscoverReel[] = (rRes.data || []).map((v: any) => {
      const raw = v.profiles;
      const p = Array.isArray(raw) ? raw[0] : raw;
      return {
        id: v.id,
        title: v.title,
        thumbnail_url: v.thumbnail_url,
        views: Number(v.view_count) || 0,
        likes: Number(v.likes_count) || 0,
        comments: Number(v.comments_count) || 0,
        aspect_ratio: v.aspect_ratio || '9:16',
        creator: {
          display_name: p?.display_name || 'Caribbean Creator',
          username: p?.username || 'creator',
        },
      };
    });

    const soundsData: DiscoverSound[] = (sRes.data || []).map((s: any) => ({
      id: s.id,
      title: s.title,
      artist: s.artist,
      genre: s.genre,
      flag: s.country_iso === 'JAM' ? '🇯🇲' : s.country_iso === 'TTO' ? '🇹🇹' : s.country_iso === 'BRB' ? '🇧🇧' : '🌴',
      country_name: s.country_name || 'Caribbean',
      usage_count: s.usage_count || 0,
      licensing_status: s.licensing_status || 'royalty_free',
    }));

    const livestreamsData: DiscoverLiveStream[] = (lRes.data || []).map((l: any) => {
      const raw = l.profiles;
      const p = Array.isArray(raw) ? raw[0] : raw;
      return {
        id: l.id,
        title: l.title,
        state: l.state,
        peak_viewers: l.peak_viewers || 0,
        category: l.category || 'Live Stream',
        host: {
          display_name: p?.display_name || 'Broadcaster',
          username: p?.username || 'host',
        },
      };
    });

    const podcastsData: DiscoverPodcast[] = (podRes.data || []).map((pod: any) => {
      const raw = pod.profiles;
      const p = Array.isArray(raw) ? raw[0] : raw;
      return {
        id: pod.id,
        title: pod.title,
        slug: pod.slug,
        description: pod.description,
        category: pod.category || 'Podcast',
        cover_path: pod.cover_path,
        follower_count: pod.follower_count || 0,
        host: {
          display_name: p?.display_name || 'Podcaster',
          username: p?.username || 'host',
        },
      };
    });

    reelsData.forEach((r) => {
      hits.push({
        entityType: 'reels' as any,
        entityId: r.id,
        title: r.title,
        subtitle: `Reel by @${r.creator.username}`,
        score: computeMatchScore(r.title, query, 1.1),
        metadata: { ...r },
      });
    });

    soundsData.forEach((s) => {
      hits.push({
        entityType: 'sounds' as any,
        entityId: s.id,
        title: s.title,
        subtitle: `${s.artist} • ${s.genre}`,
        score: computeMatchScore(s.title, query, 1.2),
        metadata: { ...s },
      });
    });

    livestreamsData.forEach((l) => {
      hits.push({
        entityType: 'live' as any,
        entityId: l.id,
        title: l.title,
        subtitle: `Live Broadcast by @${l.host.username}`,
        score: computeMatchScore(l.title, query, 1.3),
        metadata: { ...l },
      });
    });

    podcastsData.forEach((pod) => {
      hits.push({
        entityType: 'podcasts' as any,
        entityId: pod.id,
        title: pod.title,
        subtitle: `Podcast • ${pod.category}`,
        score: computeMatchScore(pod.title, query, 1.2),
        metadata: { ...pod },
      });
    });

    hits.sort((a, b) => b.score - a.score);

    const byEntity = {
      profiles: hits.filter((h) => h.entityType === 'profiles'),
      creators: hits.filter((h) => h.entityType === 'creators'),
      businesses: hits.filter((h) => h.entityType === 'businesses'),
      merchants: hits.filter((h) => h.entityType === 'products'),
      pages: hits.filter((h) => h.entityType === 'businesses' || h.entityType === 'pages'),
      communities: hits.filter((h) => h.entityType === 'communities'),
      events: hits.filter((h) => h.entityType === 'events'),
      posts: hits.filter((h) => h.entityType === 'posts'),
      reels: hits.filter((h) => (h.entityType as string) === 'reels'),
      sounds: hits.filter((h) => (h.entityType as string) === 'sounds'),
      live: hits.filter((h) => (h.entityType as string) === 'live'),
      podcasts: hits.filter((h) => (h.entityType as string) === 'podcasts'),
    };

    return {
      query,
      totalHits: hits.length,
      hits,
      byEntity,
      profilesData,
      businessesData,
      communitiesData,
      eventsData,
      productsData,
      postsData: rawPosts,
      reelsData,
      soundsData,
      livestreamsData,
      podcastsData,
    };
  } catch (err) {
    console.error('[universalSearchAction] Error:', err);
    return emptyResult;
  }
}

/**
 * Generates People You May Know and Recommended Members from real database signals
 */
export async function fetchPeopleYouMayKnowAction(params?: {
  limit?: number;
  countryIso?: string;
}): Promise<DiscoverProfile[]> {
  const limit = Math.min(Math.max(params?.limit || 12, 1), 30);
  const [user, supabase] = await Promise.all([
    getCurrentUser(),
    createSupabaseServerClient(),
  ]);

  if (!supabase) return [];

  try {
    // 1. Fetch user's dismissed/blocked profiles to exclude
    const dismissedIds = new Set<string>();
    const blockedIds = new Set<string>();
    const followingIds = new Set<string>();
    const friendIds = new Set<string>();

    if (user) {
      try {
        const [blockRes, followRes, friendRes] = await Promise.all([
          supabase.from('blocks').select('blocked_id').eq('blocker_id', user.id),
          supabase.from('follows').select('following_id').eq('follower_id', user.id),
          supabase.from('friendships').select('requester_id, addressee_id, status').or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`),
        ]);

        (blockRes.data || []).forEach((b) => blockedIds.add(b.blocked_id));
        (followRes.data || []).forEach((f) => followingIds.add(f.following_id));
        (friendRes.data || []).forEach((fr) => {
          if (fr.status === 'accepted') {
            friendIds.add(fr.requester_id === user.id ? fr.addressee_id : fr.requester_id);
          }
        });
      } catch {
        // Continue gracefully
      }
    }

    // 2. Query candidate profiles
    let query = supabase
      .from('profiles')
      .select('id, display_name, username, avatar_url, bio, country, island, city, is_verified, account_type, status, is_private')
      .eq('is_private', false)
      .neq('status', 'suspended')
      .limit(50);

    if (user) {
      query = query.neq('id', user.id);
    }

    const { data: candidates } = await query;
    if (!candidates || candidates.length === 0) return [];

    // Filter out blocked & dismissed
    const eligible = candidates.filter((c) => !blockedIds.has(c.id) && !dismissedIds.has(c.id));

    // Resolve relationship states
    const relationshipMap = user ? await getRelationshipBatchAction(eligible.map((e) => e.id)) : {};

    // Score and generate contextual reason for each candidate
    const scoredList: ScoredRecommendation<DiscoverProfile>[] = [];

    for (const c of eligible) {
      const countryInfo = resolveProfileCountry(c);
      const prof: DiscoverProfile = {
        id: c.id,
        display_name: c.display_name,
        username: c.username,
        avatar_url: c.avatar_url,
        bio: c.bio,
        origin_country_iso: countryInfo.iso,
        country_name: countryInfo.name,
        is_verified: !!c.is_verified,
        is_official: c.username?.toLowerCase() === 'tukubi' || !!(c as any).is_official,
        account_type: c.account_type,
        relationship: relationshipMap[c.id] || { state: 'none', isFollowing: false, friendshipStatus: 'none' },
      };

      const scored = scoreRecommendationCandidate(
        {
          id: c.id,
          entityType: c.account_type === 'creator' ? 'creator' : 'profile',
          data: prof,
          originCountryIso: countryInfo.iso || undefined,
          countryName: countryInfo.name || undefined,
          isVerified: !!c.is_verified,
          isOfficial: c.username?.toLowerCase() === 'tukubi' || !!(c as any).is_official,
        },
        {
          viewerId: user?.id,
          viewerCountryIso: (user as any)?.origin_country_iso || (user as any)?.country || null,
          blockedIds,
          dismissedIds,
          followingIds,
          friendIds,
        }
      );

      if (scored) {
        prof.recommendationReason = scored.reason;
        prof.badgeIcon = scored.badgeIcon;
        scoredList.push(scored as ScoredRecommendation<DiscoverProfile>);
      }
    }

    // Sort by score descending
    scoredList.sort((a, b) => b.score - a.score);

    return scoredList.slice(0, limit).map((s) => s.candidate.data);
  } catch (err) {
    console.error('[fetchPeopleYouMayKnowAction] Error:', err);
    return [];
  }
}

/**
 * Loads Relationship Center overview (Friends, Incoming Requests, Outgoing Requests, Following, Followers, PYMK)
 */
export async function fetchFriendsOverviewAction(params?: {
  tab?: 'discover' | 'friends' | 'requests' | 'pymk' | 'following' | 'followers';
  query?: string;
  page?: number;
  limit?: number;
}): Promise<{
  friends: DiscoverProfile[];
  incomingRequests: DiscoverProfile[];
  outgoingRequests: DiscoverProfile[];
  following: DiscoverProfile[];
  followers: DiscoverProfile[];
  pymk: DiscoverProfile[];
  counts: {
    friendsCount: number;
    incomingCount: number;
    outgoingCount: number;
    followingCount: number;
    followersCount: number;
  };
}> {
  const [user, supabase] = await Promise.all([
    getCurrentUser(),
    createSupabaseServerClient(),
  ]);

  const defaultResult = {
    friends: [],
    incomingRequests: [],
    outgoingRequests: [],
    following: [],
    followers: [],
    pymk: [],
    counts: {
      friendsCount: 0,
      incomingCount: 0,
      outgoingCount: 0,
      followingCount: 0,
      followersCount: 0,
    },
  };

  if (!user || !supabase) {
    const fallbackPymk = await fetchPeopleYouMayKnowAction({ limit: 12 });
    return { ...defaultResult, pymk: fallbackPymk };
  }

  try {
    // 1. Fetch Friendships
    const { data: friendships } = await supabase
      .from('friendships')
      .select('id, requester_id, addressee_id, status, is_close_friend, created_at, updated_at')
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

    // 2. Fetch Follows
    const [followingRes, followersRes] = await Promise.all([
      supabase.from('follows').select('following_id, created_at').eq('follower_id', user.id),
      supabase.from('follows').select('follower_id, created_at').eq('following_id', user.id),
    ]);

    const acceptedFriendIds: string[] = [];
    const incomingRequestIds: string[] = [];
    const outgoingRequestIds: string[] = [];

    (friendships || []).forEach((fr) => {
      if (fr.status === 'accepted') {
        acceptedFriendIds.push(fr.requester_id === user.id ? fr.addressee_id : fr.requester_id);
      } else if (fr.status === 'pending') {
        if (fr.requester_id === user.id) {
          outgoingRequestIds.push(fr.addressee_id);
        } else {
          incomingRequestIds.push(fr.requester_id);
        }
      }
    });

    const followingIds = (followingRes.data || []).map((f) => f.following_id);
    const followerIds = (followersRes.data || []).map((f) => f.follower_id);

    // Collect all profile IDs needed
    const allProfileIds = Array.from(
      new Set([
        ...acceptedFriendIds,
        ...incomingRequestIds,
        ...outgoingRequestIds,
        ...followingIds,
        ...followerIds,
      ])
    );

    let profilesMap: Record<string, DiscoverProfile> = {};

    if (allProfileIds.length > 0) {
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, display_name, username, avatar_url, bio, country, island, city, is_verified, account_type, messaging_permission')
        .in('id', allProfileIds);

      const relationshipBatch = await getRelationshipBatchAction(allProfileIds);

      (profilesData || []).forEach((p) => {
        const countryInfo = resolveProfileCountry(p);
        profilesMap[p.id] = {
          id: p.id,
          display_name: p.display_name,
          username: p.username,
          avatar_url: p.avatar_url,
          bio: p.bio,
          origin_country_iso: countryInfo.iso,
          country_name: countryInfo.name,
          is_verified: !!p.is_verified,
          is_official: p.username?.toLowerCase() === 'tukubi' || !!(p as any).is_official,
          account_type: p.account_type,
          messaging_permission: p.messaging_permission,
          relationship: relationshipBatch[p.id] || { state: 'none', isFollowing: false, isFollower: false, friendshipStatus: 'none', isBlocked: false },
        };
      });
    }

    const searchQuery = (params?.query || '').trim().toLowerCase();
    const filterBySearch = (list: DiscoverProfile[]) => {
      if (!searchQuery) return list;
      return list.filter(
        (p) =>
          p.display_name.toLowerCase().includes(searchQuery) ||
          p.username.toLowerCase().includes(searchQuery)
      );
    };

    const friendsList = filterBySearch(acceptedFriendIds.map((id) => profilesMap[id]).filter(Boolean));
    const incomingList = filterBySearch(incomingRequestIds.map((id) => profilesMap[id]).filter(Boolean));
    const outgoingList = filterBySearch(outgoingRequestIds.map((id) => profilesMap[id]).filter(Boolean));
    const followingList = filterBySearch(followingIds.map((id) => profilesMap[id]).filter(Boolean));
    const followersList = filterBySearch(followerIds.map((id) => profilesMap[id]).filter(Boolean));

    const pymk = await fetchPeopleYouMayKnowAction({ limit: 12 });

    return {
      friends: friendsList,
      incomingRequests: incomingList,
      outgoingRequests: outgoingList,
      following: followingList,
      followers: followersList,
      pymk,
      counts: {
        friendsCount: acceptedFriendIds.length,
        incomingCount: incomingRequestIds.length,
        outgoingCount: outgoingRequestIds.length,
        followingCount: followingIds.length,
        followersCount: followerIds.length,
      },
    };
  } catch (err) {
    console.error('[fetchFriendsOverviewAction] Error:', err);
    return defaultResult;
  }
}

/**
 * Loads Members Directory with territory filtering, search, and relationship status
 */
export async function fetchMembersDirectoryAction(params?: {
  countryIso?: string;
  category?: string;
  query?: string;
  page?: number;
  limit?: number;
}): Promise<{
  members: DiscoverProfile[];
  totalCount: number;
}> {
  const [user, supabase] = await Promise.all([
    getCurrentUser(),
    createSupabaseServerClient(),
  ]);

  if (!supabase) return { members: [], totalCount: 0 };

  const limit = Math.min(Math.max(params?.limit || 24, 1), 60);
  const page = Math.max(params?.page || 1, 1);
  const offset = (page - 1) * limit;

  try {
    let query = supabase
      .from('profiles')
      .select('id, display_name, username, avatar_url, bio, country, island, city, is_verified, account_type, messaging_permission, status, is_private, updated_at', { count: 'exact' })
      .eq('is_private', false)
      .neq('status', 'suspended')
      .order('is_verified', { ascending: false })
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (params?.countryIso && params.countryIso !== 'ALL') {
      const territory = CARIBBEAN_TERRITORIES_BY_ISO[params.countryIso.toUpperCase()];
      const territoryName = territory?.name || params.countryIso;
      query = query.or(`origin_country_iso.eq.${params.countryIso.toUpperCase()},country.ilike.%${territoryName}%,island.ilike.%${territoryName}%`);
    }

    if (params?.category && params.category !== 'all') {
      query = query.eq('account_type', params.category);
    }

    if (params?.query?.trim()) {
      const q = sanitizeSearchTerm(params.query.replace(/^@/, '').trim());
      query = query.or(`display_name.ilike.%${q}%,username.ilike.%${q}%,first_name.ilike.%${q}%,last_name.ilike.%${q}%`);
    }

    const { data, count, error } = await query;
    if (error || !data) return { members: [], totalCount: 0 };

    const memberIds = data.map((d) => d.id);
    const relationshipMap = user ? await getRelationshipBatchAction(memberIds) : {};

    const members: DiscoverProfile[] = data.map((d) => {
      const countryInfo = resolveProfileCountry(d);
      return {
        id: d.id,
        display_name: d.display_name,
        username: d.username,
        avatar_url: d.avatar_url,
        bio: d.bio,
        origin_country_iso: countryInfo.iso,
        country_name: countryInfo.name,
        is_verified: !!d.is_verified,
        is_official: d.username?.toLowerCase() === 'tukubi' || !!(d as any).is_official,
        account_type: d.account_type,
        messaging_permission: d.messaging_permission,
        relationship: relationshipMap[d.id] || { state: 'none', isFollowing: false, isFollower: false, friendshipStatus: 'none', isBlocked: false },
      };
    });

    return {
      members,
      totalCount: count || members.length,
    };
  } catch (err) {
    console.error('[fetchMembersDirectoryAction] Error:', err);
    return { members: [], totalCount: 0 };
  }
}
