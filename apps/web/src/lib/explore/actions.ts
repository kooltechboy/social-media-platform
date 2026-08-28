'use server';

import { createSupabaseServerClient } from '../supabase/server';
import { CARIBBEAN_TERRITORIES, CARIBBEAN_TERRITORIES_BY_ISO } from '../constants/caribbean-territories';
import { DIASPORA_CITY_HUBS } from '../constants/diaspora-hubs';

export interface VibeCategory {
  id: string;
  name: string;
  icon: string;
  desc: string;
  color: string;
  tags: string[];
}

export const VIBE_CATEGORIES: VibeCategory[] = [
  { id: 'music', name: 'Soca & Reggae', icon: '🎵', desc: 'Sound systems, soca, dancehall & dubplates', color: 'from-purple-500/20 to-purple-950/40 border-purple-500/30', tags: ['music', 'soca', 'reggae', 'dancehall', 'calypso', 'stems'] },
  { id: 'carnival', name: 'Carnival & Fetes', icon: '🎭', desc: 'Road marches, costumes, mas bands & J\'ouvert', color: 'from-rose-500/20 to-rose-950/40 border-rose-500/30', tags: ['carnival', 'fete', 'jouvert', 'mas', 'costume', 'band'] },
  { id: 'food', name: 'Food & Rum', icon: '🍛', desc: 'Authentic jerk, roti, aged rums & pepper sauces', color: 'from-amber-500/20 to-amber-950/40 border-amber-500/30', tags: ['food', 'jerk', 'rum', 'coffee', 'culinary', 'spices', 'roti'] },
  { id: 'tech', name: 'Tech & Business', icon: '🚀', desc: 'Founders, startups, fintech & remote work', color: 'from-brand-caribbeanSea/20 to-sky-950/40 border-brand-caribbeanSea/30', tags: ['tech', 'business', 'startups', 'fintech', 'spotpay', 'dev'] },
  { id: 'fashion', name: 'Fashion & Art', icon: '👗', desc: 'Caribbean designers, beaded jewelry & art', color: 'from-pink-500/20 to-pink-950/40 border-pink-500/30', tags: ['fashion', 'art', 'design', 'apparel', 'craft', 'jewelry'] },
  { id: 'nightlife', name: 'Nightlife & Sessions', icon: '🌙', desc: 'Clubs, soundclash, beach lounges & boat rides', color: 'from-indigo-500/20 to-indigo-950/40 border-indigo-500/30', tags: ['nightlife', 'party', 'lounge', 'soundclash', 'session', 'club'] },
  { id: 'sports', name: 'Cricket & Athletics', icon: '🏏', desc: 'Track champions, athletics, cricket & football', color: 'from-emerald-500/20 to-emerald-950/40 border-emerald-500/30', tags: ['sports', 'cricket', 'track', 'athletics', 'football', 'fitness'] },
  { id: 'travel', name: 'Islands & Resorts', icon: '🌴', desc: 'Hidden beaches, eco-resorts & island heritage', color: 'from-teal-500/20 to-teal-950/40 border-teal-500/30', tags: ['travel', 'islands', 'beach', 'resort', 'tourism', 'nature'] },
];

export interface ExploreQueryResult {
  posts: any[];
  creators: any[];
  events: any[];
  communities: any[];
  products: any[];
  selectedVibe: VibeCategory | null;
  selectedCountry: any | null;
  selectedHub: any | null;
  totalMatches: number;
}

export async function fetchExploreDataAction(params: {
  vibe?: string;
  country?: string;
  hub?: string;
  q?: string;
}): Promise<ExploreQueryResult> {
  const supabase = await createSupabaseServerClient();
  const vibeKey = params.vibe?.toLowerCase().trim() || null;
  const countryKey = params.country?.toUpperCase().trim() || null;
  const hubKey = params.hub?.toLowerCase().trim() || null;
  const queryText = params.q?.toLowerCase().trim() || null;

  const selectedVibe = VIBE_CATEGORIES.find((v) => v.id === vibeKey) || null;
  const selectedCountry = countryKey ? CARIBBEAN_TERRITORIES_BY_ISO[countryKey] || null : null;
  const selectedHub = hubKey
    ? DIASPORA_CITY_HUBS.find(
        (h) =>
          h.city.toLowerCase().includes(hubKey) ||
          h.id.toLowerCase().includes(hubKey) ||
          hubKey.includes(h.city.toLowerCase().split(' ')[0])
      ) || null
    : null;

  if (!supabase) {
    return {
      posts: [],
      creators: [],
      events: [],
      communities: [],
      products: [],
      selectedVibe,
      selectedCountry,
      selectedHub,
      totalMatches: 0,
    };
  }

  try {
    // 1. Fetch Posts with filtering
    let postQuery = supabase
      .from('posts')
      .select('id, content, media_urls, cultural_tags, likes_count, comments_count, shares_count, created_at, author_id, profiles(id, display_name, username, avatar_url, is_verified, origin_country_iso)')
      .eq('visibility', 'public')
      .order('created_at', { ascending: false })
      .limit(20);

    if (queryText) {
      postQuery = postQuery.ilike('content', `%${queryText}%`);
    }

    // 2. Fetch Creators / Profiles
    let profilesQuery = supabase
      .from('profiles')
      .select('id, display_name, username, avatar_url, bio, origin_country_iso, is_verified, account_type')
      .order('is_verified', { ascending: false })
      .limit(12);

    if (countryKey) {
      profilesQuery = profilesQuery.eq('origin_country_iso', countryKey);
    } else if (queryText) {
      profilesQuery = profilesQuery.or(`display_name.ilike.%${queryText}%,username.ilike.%${queryText}%`);
    }

    // 3. Fetch Events
    let eventsQuery = supabase
      .from('events')
      .select('id, title, description, event_kind, venue, starts_at, capacity, cities(name, country_iso)')
      .order('starts_at', { ascending: true })
      .limit(10);

    if (queryText) {
      eventsQuery = eventsQuery.ilike('title', `%${queryText}%`);
    }

    // 4. Fetch Communities
    let communitiesQuery = supabase
      .from('communities')
      .select('id, name, slug, description, join_policy, member_count, country_iso')
      .order('member_count', { ascending: false })
      .limit(10);

    if (countryKey) {
      communitiesQuery = communitiesQuery.eq('country_iso', countryKey);
    } else if (queryText) {
      communitiesQuery = communitiesQuery.ilike('name', `%${queryText}%`);
    }

    // 5. Fetch Products
    let productsQuery = supabase
      .from('products')
      .select('id, title, description, price_minor, currency, product_kind, is_active')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(10);

    if (queryText) {
      productsQuery = productsQuery.ilike('title', `%${queryText}%`);
    }

    const [postsRes, profilesRes, eventsRes, communitiesRes, productsRes] = await Promise.all([
      postQuery,
      profilesQuery,
      eventsQuery,
      communitiesQuery,
      productsQuery,
    ]);

    let rawPosts = postsRes.data ?? [];

    // Filter posts by vibe tags if selected
    if (selectedVibe) {
      const vTags = selectedVibe.tags;
      rawPosts = rawPosts.filter((p) => {
        const text = (p.content || '').toLowerCase();
        const tags = Array.isArray(p.cultural_tags) ? p.cultural_tags.map((t: string) => t.toLowerCase()) : [];
        return vTags.some((tag) => text.includes(tag) || tags.includes(tag));
      });
    }

    // Filter posts by country if selected
    if (selectedCountry) {
      const cName = selectedCountry.name.toLowerCase();
      const cIso = selectedCountry.iso.toLowerCase();
      rawPosts = rawPosts.filter((p: any) => {
        const text = (p.content || '').toLowerCase();
        const profileData = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles;
        const profileIso = (profileData?.origin_country_iso || '').toLowerCase();
        return text.includes(cName) || text.includes(cIso) || profileIso === cIso;
      });
    }

    const totalMatches =
      rawPosts.length +
      (profilesRes.data?.length ?? 0) +
      (eventsRes.data?.length ?? 0) +
      (communitiesRes.data?.length ?? 0) +
      (productsRes.data?.length ?? 0);

    return {
      posts: rawPosts,
      creators: profilesRes.data ?? [],
      events: eventsRes.data ?? [],
      communities: communitiesRes.data ?? [],
      products: productsRes.data ?? [],
      selectedVibe,
      selectedCountry,
      selectedHub,
      totalMatches,
    };
  } catch (err) {
    console.error('Explore query error:', err);
    return {
      posts: [],
      creators: [],
      events: [],
      communities: [],
      products: [],
      selectedVibe,
      selectedCountry,
      selectedHub,
      totalMatches: 0,
    };
  }
}
