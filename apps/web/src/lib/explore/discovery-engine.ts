import { createSupabaseServerClient } from '../supabase/server';
import {
  resolveGeography,
  type CanonicalGeography,
  GEOGRAPHIES_BY_ISO,
} from './canonical-geography';
import {
  VIBE_CATEGORIES,
  type VibeCategory,
  type ExploreQueryResult,
  type ExploreCounts,
} from './constants';
import { CARIBBEAN_TERRITORIES_BY_ISO } from '../constants/caribbean-territories';
import { DIASPORA_CITY_HUBS } from '../constants/diaspora-hubs';

export interface DiscoveryFilterParams {
  geo?: string | null;
  country?: string | null;
  vibe?: string | null;
  hub?: string | null;
  q?: string | null;
  contentType?: string | null;
  limit?: number;
}

/**
 * Universal Caribbean Discovery Engine
 *
 * Executes parallel, highly indexed PostgreSQL queries against real Supabase
 * tables for posts, creators, events, communities, businesses, marketplace,
 * reels, and podcasts with zero mock data.
 */
export async function executeDiscoveryQuery(
  params: DiscoveryFilterParams
): Promise<ExploreQueryResult> {
  const supabase = await createSupabaseServerClient();

  // 1. Normalize query parameters
  const rawGeo = params.geo || params.country || null;
  const selectedGeography: CanonicalGeography | null = resolveGeography(rawGeo);

  const vibeKey = params.vibe?.toLowerCase().trim() || null;
  const selectedVibe: VibeCategory | null =
    VIBE_CATEGORIES.find((v) => v.id === vibeKey) || null;

  const hubKey = params.hub?.toLowerCase().trim() || null;
  const selectedHubGeography = hubKey ? resolveGeography(hubKey) : null;
  const selectedHub =
    selectedHubGeography ||
    (hubKey
      ? DIASPORA_CITY_HUBS.find(
          (h) =>
            h.city.toLowerCase().includes(hubKey) ||
            h.id.toLowerCase().includes(hubKey) ||
            hubKey.includes(h.city.toLowerCase().split(' ')[0])
        ) || null
      : null);

  const queryText = params.q?.trim() || null;

  // Backward compatibility object for components expecting CARIBBEAN_TERRITORIES_BY_ISO shape
  const selectedCountry = selectedGeography
    ? CARIBBEAN_TERRITORIES_BY_ISO[selectedGeography.iso] || {
        iso: selectedGeography.iso,
        name: selectedGeography.name,
        flag: selectedGeography.flagEmoji,
        lang: selectedGeography.primaryLanguage as any,
        sovereign: selectedGeography.sovereign,
      }
    : null;

  const emptyCounts: ExploreCounts = {
    posts: 0,
    creators: 0,
    events: 0,
    communities: 0,
    products: 0,
    businesses: 0,
    reels: 0,
    podcasts: 0,
  };

  if (!supabase) {
    return {
      posts: [],
      creators: [],
      events: [],
      communities: [],
      products: [],
      businesses: [],
      reels: [],
      podcasts: [],
      selectedVibe,
      selectedCountry,
      selectedHub,
      selectedGeography,
      counts: emptyCounts,
      totalMatches: 0,
    };
  }

  try {
    // 2. Resolve Country UUID if a Caribbean country is selected
    let countryUuid: string | null = null;
    if (selectedGeography && !selectedGeography.isDiasporaHub) {
      const { data: cRow } = await supabase
        .from('countries')
        .select('id')
        .or(`iso_code.eq.${selectedGeography.iso},slug.eq.${selectedGeography.slug}`)
        .maybeSingle();
      if (cRow) {
        countryUuid = cRow.id;
      }
    }

    const geoIso = selectedGeography?.iso || null;
    const geoName = selectedGeography?.name || null;
    const hubCityName =
      (selectedHub as any)?.city ||
      selectedHubGeography?.capital ||
      (selectedGeography?.isDiasporaHub ? selectedGeography.capital : null) ||
      hubKey;

    const vibeTags = selectedVibe ? selectedVibe.tags : [];

    // ────────────────────────────────────────────────────────────
    // 3. POSTS QUERY
    // ────────────────────────────────────────────────────────────
    let postQuery = supabase
      .from('posts')
      .select(
        'id, content, media_urls, cultural_tags, likes_count, comments_count, shares_count, created_at, author_id, country_id, profiles:profiles!posts_author_id_fkey(id, display_name, username, avatar_url, is_verified, country, island, city)'
      )
      .eq('visibility', 'public')
      .order('created_at', { ascending: false })
      .limit(params.limit || 24);

    if (queryText) {
      postQuery = postQuery.ilike('content', `%${queryText}%`);
    }

    if (countryUuid) {
      if (geoName) {
        postQuery = postQuery.or(
          `country_id.eq.${countryUuid},content.ilike.%${geoName}%`
        );
      } else {
        postQuery = postQuery.eq('country_id', countryUuid);
      }
    } else if (geoName) {
      postQuery = postQuery.ilike('content', `%${geoName}%`);
    }

    if (hubCityName) {
      postQuery = postQuery.ilike('content', `%${hubCityName}%`);
    }

    if (vibeTags.length > 0) {
      // Check Postgres cultural_tags array overlap
      postQuery = postQuery.overlaps('cultural_tags', vibeTags);
    }

    // ────────────────────────────────────────────────────────────
    // 4. CREATORS & PROFILES QUERY
    // ────────────────────────────────────────────────────────────
    let profilesQuery = supabase
      .from('profiles')
      .select(
        'id, display_name, username, avatar_url, bio, country, island, city, origin_country_id, is_verified, account_type'
      )
      .eq('is_private', false)
      .neq('status', 'suspended')
      .order('is_verified', { ascending: false })
      .limit(16);

    if (queryText) {
      profilesQuery = profilesQuery.or(
        `display_name.ilike.%${queryText}%,username.ilike.%${queryText}%,bio.ilike.%${queryText}%`
      );
    }

    if (countryUuid) {
      if (geoName) {
        profilesQuery = profilesQuery.or(
          `origin_country_id.eq.${countryUuid},country.ilike.%${geoName}%,island.ilike.%${geoName}%`
        );
      } else {
        profilesQuery = profilesQuery.eq('origin_country_id', countryUuid);
      }
    } else if (geoName) {
      profilesQuery = profilesQuery.or(
        `country.ilike.%${geoName}%,island.ilike.%${geoName}%`
      );
    }

    if (hubCityName) {
      profilesQuery = profilesQuery.or(
        `city.ilike.%${hubCityName}%,bio.ilike.%${hubCityName}%`
      );
    }

    if (selectedVibe) {
      profilesQuery = profilesQuery.or(
        `bio.ilike.%${selectedVibe.id}%,account_type.eq.creator`
      );
    }

    // ────────────────────────────────────────────────────────────
    // 5. EVENTS QUERY
    // ────────────────────────────────────────────────────────────
    let eventsQuery = supabase
      .from('events')
      .select(
        'id, title, description, event_kind, venue, starts_at, capacity, country_iso, city_id, cities(name, country_iso)'
      )
      .order('starts_at', { ascending: true })
      .limit(12);

    if (queryText) {
      eventsQuery = eventsQuery.or(
        `title.ilike.%${queryText}%,description.ilike.%${queryText}%,venue.ilike.%${queryText}%`
      );
    }

    if (geoIso) {
      eventsQuery = eventsQuery.eq('country_iso', geoIso);
    }

    if (hubCityName) {
      eventsQuery = eventsQuery.or(
        `venue.ilike.%${hubCityName}%,description.ilike.%${hubCityName}%`
      );
    }

    if (selectedVibe) {
      eventsQuery = eventsQuery.or(
        `title.ilike.%${selectedVibe.id}%,description.ilike.%${selectedVibe.id}%`
      );
    }

    // ────────────────────────────────────────────────────────────
    // 6. COMMUNITIES QUERY
    // ────────────────────────────────────────────────────────────
    let communitiesQuery = supabase
      .from('communities')
      .select(
        'id, name, slug, description, join_policy, member_count, country_iso, city_id, cover_storage_path'
      )
      .eq('join_policy', 'public')
      .order('member_count', { ascending: false })
      .limit(12);

    if (queryText) {
      communitiesQuery = communitiesQuery.or(
        `name.ilike.%${queryText}%,description.ilike.%${queryText}%`
      );
    }

    if (geoIso) {
      communitiesQuery = communitiesQuery.eq('country_iso', geoIso);
    }

    if (hubCityName) {
      communitiesQuery = communitiesQuery.or(
        `name.ilike.%${hubCityName}%,description.ilike.%${hubCityName}%`
      );
    }

    if (selectedVibe) {
      communitiesQuery = communitiesQuery.or(
        `name.ilike.%${selectedVibe.id}%,description.ilike.%${selectedVibe.id}%`
      );
    }

    // ────────────────────────────────────────────────────────────
    // 7. BUSINESSES QUERY
    // ────────────────────────────────────────────────────────────
    let businessesQuery = supabase
      .from('businesses')
      .select('id, name, slug, category, description, is_verified, phone, website, country_iso')
      .order('is_verified', { ascending: false })
      .limit(12);

    if (queryText) {
      businessesQuery = businessesQuery.or(
        `name.ilike.%${queryText}%,description.ilike.%${queryText}%`
      );
    }

    if (geoIso) {
      businessesQuery = businessesQuery.eq('country_iso', geoIso);
    }

    if (selectedVibe) {
      businessesQuery = businessesQuery.ilike('category', `%${selectedVibe.id}%`);
    }

    // ────────────────────────────────────────────────────────────
    // 8. MARKETPLACE (PRODUCTS) QUERY
    // ────────────────────────────────────────────────────────────
    let productsQuery = supabase
      .from('products')
      .select('id, title, description, price_minor, currency, product_kind, is_active, created_at')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(12);

    if (queryText) {
      productsQuery = productsQuery.or(
        `title.ilike.%${queryText}%,description.ilike.%${queryText}%`
      );
    }

    if (selectedVibe) {
      productsQuery = productsQuery.or(
        `title.ilike.%${selectedVibe.id}%,description.ilike.%${selectedVibe.id}%`
      );
    }

    // ────────────────────────────────────────────────────────────
    // 9. REELS / VIDEOS QUERY
    // ────────────────────────────────────────────────────────────
    let reelsQuery = supabase
      .from('videos')
      .select(
        'id, title, video_kind, storage_path, thumbnail_path, duration_seconds, view_count, created_at, creator_id, profiles:profiles!videos_creator_id_fkey(id, display_name, username, avatar_url, is_verified, country)'
      )
      .eq('video_kind', 'reel')
      .eq('visibility', 'public')
      .order('created_at', { ascending: false })
      .limit(12);

    if (queryText) {
      reelsQuery = reelsQuery.ilike('title', `%${queryText}%`);
    }

    if (geoName) {
      reelsQuery = reelsQuery.ilike('title', `%${geoName}%`);
    }

    // ────────────────────────────────────────────────────────────
    // 10. PODCASTS QUERY
    // ────────────────────────────────────────────────────────────
    let podcastsQuery = supabase
      .from('podcasts')
      .select(
        'id, title, slug, description, cover_path, language, follower_count, creator_id, profiles:profiles!podcasts_creator_id_fkey(id, display_name, username, avatar_url, is_verified)'
      )
      .order('follower_count', { ascending: false })
      .limit(8);

    if (queryText) {
      podcastsQuery = podcastsQuery.or(
        `title.ilike.%${queryText}%,description.ilike.%${queryText}%`
      );
    }

    if (geoName) {
      podcastsQuery = podcastsQuery.or(
        `title.ilike.%${geoName}%,description.ilike.%${geoName}%`
      );
    }

    // Parallel Execution
    const [
      postsRes,
      profilesRes,
      eventsRes,
      communitiesRes,
      businessesRes,
      productsRes,
      reelsRes,
      podcastsRes,
    ] = await Promise.all([
      postQuery,
      profilesQuery,
      eventsQuery,
      communitiesQuery,
      businessesQuery,
      productsQuery,
      reelsQuery,
      podcastsQuery,
    ]);

    const posts = postsRes.data ?? [];
    const creators = profilesRes.data ?? [];
    const events = eventsRes.data ?? [];
    const communities = communitiesRes.data ?? [];
    const businesses = businessesRes.data ?? [];
    const products = productsRes.data ?? [];
    const reels = reelsRes.data ?? [];
    const podcasts = podcastsRes.data ?? [];

    const counts: ExploreCounts = {
      posts: posts.length,
      creators: creators.length,
      events: events.length,
      communities: communities.length,
      products: products.length,
      businesses: businesses.length,
      reels: reels.length,
      podcasts: podcasts.length,
    };

    const totalMatches =
      posts.length +
      creators.length +
      events.length +
      communities.length +
      businesses.length +
      products.length +
      reels.length +
      podcasts.length;

    return {
      posts,
      creators,
      events,
      communities,
      businesses,
      products,
      reels,
      podcasts,
      selectedVibe,
      selectedCountry,
      selectedHub,
      selectedGeography,
      counts,
      totalMatches,
    };
  } catch (err) {
    console.error('Discovery Engine query error:', err);
    return {
      posts: [],
      creators: [],
      events: [],
      communities: [],
      businesses: [],
      products: [],
      reels: [],
      podcasts: [],
      selectedVibe,
      selectedCountry,
      selectedHub,
      selectedGeography,
      counts: emptyCounts,
      totalMatches: 0,
    };
  }
}
