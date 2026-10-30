import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons as ExpoIonicons } from '@expo/vector-icons';
import { TOKENS } from '../theme/tokens';
import { supabase } from '../lib/supabase';

type IoniconName = keyof typeof ExpoIonicons.glyphMap;
const Ionicons = ExpoIonicons as unknown as React.ComponentType<{
  name: IoniconName;
  size?: number;
  color?: string;
  style?: any;
}>;
const { width: screenWidth } = Dimensions.get('window');

type SearchTab = 'all' | 'people' | 'posts' | 'market' | 'sounds';

const CATEGORY_TILES: Array<{ key: SearchTab; label: string; icon: IoniconName }> = [
  { key: 'all', label: 'All', icon: 'apps-outline' },
  { key: 'people', label: 'Creators', icon: 'people-outline' },
  { key: 'posts', label: 'Posts', icon: 'newspaper-outline' },
  { key: 'market', label: 'Marketplace', icon: 'bag-handle-outline' },
  { key: 'sounds', label: 'Sounds', icon: 'musical-notes-outline' },
];

interface CountryItem {
  id: string;
  iso_code: string;
  iso2_code: string;
  name: string;
  flag_emoji: string;
  slug?: string;
}

interface ProfileResult {
  id: string;
  username: string;
  full_name: string;
  avatar_url?: string;
  country?: string;
  island?: string;
  headline?: string;
  is_verified?: boolean;
}

interface PostResult {
  id: string;
  content: string;
  media_urls?: string[];
  likes_count: number;
  comments_count: number;
  created_at: string;
  profiles?: {
    username?: string;
    full_name?: string;
    avatar_url?: string;
    is_verified?: boolean;
  } | null;
}

interface ProductResult {
  id: string;
  title: string;
  description?: string;
  price_amount: number;
  currency: string;
  media_urls?: string[];
  condition?: string;
  location_territory?: string;
}

interface SoundResult {
  id: string;
  title: string;
  artist_name: string;
  genre: string;
  duration_seconds: number;
  play_count: number;
}

export function ExploreScreen({ navigation }: any) {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<SearchTab>('all');
  const [countries, setCountries] = useState<CountryItem[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<CountryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [profiles, setProfiles] = useState<ProfileResult[]>([]);
  const [posts, setPosts] = useState<PostResult[]>([]);
  const [products, setProducts] = useState<ProductResult[]>([]);
  const [sounds, setSounds] = useState<SoundResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const fetchCountries = async () => {
    try {
      const { data, error } = await supabase
        .from('countries')
        .select('id, iso_code, iso2_code, name, flag_emoji, slug')
        .order('name', { ascending: true })
        .limit(30);

      if (!error && data) {
        setCountries(data);
      }
    } catch (err) {
      console.warn('Error fetching countries:', err);
    }
  };

  const fetchDiscoveryData = useCallback(async () => {
    setLoading(true);
    try {
      let profilesQuery = supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, country, island, headline, is_verified')
        .limit(10);
      if (selectedCountry) {
        profilesQuery = profilesQuery.or(
          `country.ilike.%${selectedCountry.name}%,island.ilike.%${selectedCountry.name}%`
        );
      }
      const { data: profData } = await profilesQuery;
      if (profData) setProfiles(profData);

      let postsQuery = supabase
        .from('posts')
        .select(`
          id,
          content,
          media_urls,
          likes_count,
          comments_count,
          created_at,
          profiles:author_id (
            username,
            full_name,
            avatar_url,
            is_verified
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10);
      if (selectedCountry) {
        postsQuery = postsQuery.eq('country_id', selectedCountry.id);
      }
      const { data: postData } = await postsQuery;
      if (postData) setPosts(postData as unknown as PostResult[]);

      let productsQuery = supabase
        .from('products')
        .select(
          'id, title, description, price_amount, currency, media_urls, condition, location_territory'
        )
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(6);
      if (selectedCountry) {
        productsQuery = productsQuery.or(
          `location_territory.ilike.%${selectedCountry.name}%,location_territory.ilike.%${selectedCountry.iso2_code}%`
        );
      }
      const { data: prodData } = await productsQuery;
      if (prodData) setProducts(prodData);

      const { data: soundData } = await supabase
        .from('sounds')
        .select('id, title, artist_name, genre, duration_seconds, play_count')
        .eq('status', 'approved')
        .order('play_count', { ascending: false })
        .limit(6);
      if (soundData) setSounds(soundData);
    } catch (err) {
      console.warn('Error loading discovery data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCountry]);

  const handleSearch = async (searchTerm: string, tabOverride?: SearchTab) => {
    const q = searchTerm.trim();
    const targetTab = tabOverride ?? activeTab;

    if (!q) {
      setIsSearching(false);
      fetchDiscoveryData();
      return;
    }

    setIsSearching(true);
    setLoading(true);

    try {
      if (targetTab === 'all' || targetTab === 'people') {
        const { data: profData } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url, country, island, headline, is_verified')
          .or(`username.ilike.%${q}%,full_name.ilike.%${q}%`)
          .limit(15);
        if (profData) setProfiles(profData);
      }

      if (targetTab === 'all' || targetTab === 'posts') {
        const { data: postData } = await supabase
          .from('posts')
          .select(`
            id,
            content,
            media_urls,
            likes_count,
            comments_count,
            created_at,
            profiles:author_id (
              username,
              full_name,
              avatar_url,
              is_verified
            )
          `)
          .ilike('content', `%${q}%`)
          .limit(15);
        if (postData) setPosts(postData as unknown as PostResult[]);
      }

      if (targetTab === 'all' || targetTab === 'market') {
        const { data: prodData } = await supabase
          .from('products')
          .select(
            'id, title, description, price_amount, currency, media_urls, condition, location_territory'
          )
          .or(`title.ilike.%${q}%,description.ilike.%${q}%`)
          .limit(15);
        if (prodData) setProducts(prodData);
      }

      if (targetTab === 'all' || targetTab === 'sounds') {
        const { data: sndData } = await supabase
          .from('sounds')
          .select('id, title, artist_name, genre, duration_seconds, play_count')
          .or(`title.ilike.%${q}%,artist_name.ilike.%${q}%,genre.ilike.%${q}%`)
          .limit(15);
        if (sndData) setSounds(sndData);
      }
    } catch (err) {
      console.warn('Search query error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCountries();
  }, []);

  useEffect(() => {
    if (!query) {
      fetchDiscoveryData();
    }
  }, [fetchDiscoveryData, query]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCountries();
    if (query) {
      handleSearch(query);
    } else {
      fetchDiscoveryData();
    }
  };

  const formatPrice = (cents: number, currency: string) => {
    return `${currency || 'USD'} $${((cents || 0) / 100).toFixed(2)}`;
  };

  return (
    <View style={styles.screen}>
      {/* Search & Discovery Header */}
      <View style={styles.header}>
        {/* Sleek Search Pill */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={TOKENS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search TUKUBI..."
            placeholderTextColor={TOKENS.textDim}
            value={query}
            onChangeText={(text) => {
              setQuery(text);
              handleSearch(text);
            }}
            returnKeyType="search"
            accessibilityLabel="Search TUKUBI"
          />
          {query.length > 0 && (
            <TouchableOpacity
              style={styles.clearBtn}
              onPress={() => {
                setQuery('');
                setIsSearching(false);
                fetchDiscoveryData();
              }}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
            >
              <Ionicons name="close-circle" size={18} color={TOKENS.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Horizontal Icon-Led Category Tiles */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryTilesRow}
          accessibilityRole="tablist"
        >
          {CATEGORY_TILES.map((tile) => {
            const isActive = activeTab === tile.key;
            return (
              <TouchableOpacity
                key={tile.key}
                style={[styles.categoryTile, isActive && styles.categoryTileActive]}
                onPress={() => {
                  setActiveTab(tile.key);
                  if (query) handleSearch(query, tile.key);
                }}
                activeOpacity={0.8}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
                accessibilityLabel={tile.label}
              >
                <Ionicons
                  name={tile.icon}
                  size={16}
                  color={isActive ? TOKENS.teal : TOKENS.textMuted}
                />
                <Text style={[styles.categoryTileText, isActive && styles.categoryTileTextActive]}>
                  {tile.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Caribbean Territory Filter Rail */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.countryRail}
        >
          <TouchableOpacity
            style={[styles.countryChip, !selectedCountry && styles.countryChipActive]}
            onPress={() => setSelectedCountry(null)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityState={{ selected: !selectedCountry }}
          >
            <Ionicons
              name="earth-outline"
              size={14}
              color={!selectedCountry ? TOKENS.teal : TOKENS.textMuted}
            />
            <Text style={[styles.countryName, !selectedCountry && styles.countryNameActive]}>
              All Caribbean
            </Text>
          </TouchableOpacity>

          {countries.map((c) => {
            const isSelected = selectedCountry?.id === c.id;
            return (
              <TouchableOpacity
                key={c.id}
                style={[styles.countryChip, isSelected && styles.countryChipActive]}
                onPress={() => setSelectedCountry(isSelected ? null : c)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
              >
                {c.flag_emoji ? (
                  <Text style={styles.countryEmoji}>{c.flag_emoji}</Text>
                ) : (
                  <Ionicons
                    name="flag-outline"
                    size={13}
                    color={isSelected ? TOKENS.teal : TOKENS.textMuted}
                  />
                )}
                <Text style={[styles.countryName, isSelected && styles.countryNameActive]}>
                  {c.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Discovery Stream */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={TOKENS.teal} />
        }
      >
        {loading && !refreshing ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color={TOKENS.teal} />
          </View>
        ) : (
          <>
            {/* Trending in the Caribbean Spotlight Banner */}
            <View style={styles.spotlightBanner}>
              <View style={styles.spotlightIconBox}>
                {selectedCountry?.flag_emoji ? (
                  <Text style={styles.bannerFlag}>{selectedCountry.flag_emoji}</Text>
                ) : (
                  <Ionicons name="trending-up-outline" size={22} color={TOKENS.teal} />
                )}
              </View>
              <View style={styles.spotlightTextCol}>
                <View style={styles.spotlightKickerRow}>
                  <Text style={styles.spotlightKicker}>
                    {selectedCountry ? `${selectedCountry.iso_code} SPOTLIGHT` : 'REGIONAL PULSE'}
                  </Text>
                </View>
                <Text style={styles.bannerTitle}>
                  {selectedCountry
                    ? `Trending in ${selectedCountry.name}`
                    : 'Trending in the Caribbean'}
                </Text>
                <Text style={styles.bannerSubtitle}>
                  {selectedCountry
                    ? `Active creators, verified trade listings, and conversations across ${selectedCountry.name}.`
                    : 'Discover creators, cultural discussions, rhythms, and regional commerce across TUKUBI.'}
                </Text>
              </View>
            </View>

            {/* SECTION 1: RECOMMENDED CREATORS */}
            {(activeTab === 'all' || activeTab === 'people') && profiles.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>
                    {isSearching ? 'Matching Creators' : 'Recommended Creators'}
                  </Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.creatorsRow}
                >
                  {profiles.map((p) => (
                    <TouchableOpacity
                      key={p.id}
                      style={styles.creatorCard}
                      onPress={() => navigation?.navigate('Messages', { targetUserId: p.id })}
                      activeOpacity={0.85}
                    >
                      {p.avatar_url ? (
                        <Image source={{ uri: p.avatar_url }} style={styles.creatorAvatar} />
                      ) : (
                        <View style={[styles.creatorAvatar, styles.avatarFallback]}>
                          <Text style={styles.avatarLetter}>
                            {(p.full_name || p.username || 'U')[0].toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <View style={styles.creatorNameRow}>
                        <Text style={styles.creatorName} numberOfLines={1}>
                          {p.full_name || p.username}
                        </Text>
                        {p.is_verified && (
                          <Ionicons name="checkmark-circle" size={13} color={TOKENS.teal} />
                        )}
                      </View>
                      <Text style={styles.creatorHandle} numberOfLines={1}>
                        @{p.username}
                      </Text>
                      {(p.island || p.country) ? (
                        <View style={styles.originBadge}>
                          <Ionicons name="location-outline" size={11} color={TOKENS.teal} />
                          <Text style={styles.originText} numberOfLines={1}>
                            {p.island || p.country}
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.originSpacer} />
                      )}
                      <View style={styles.connectPill}>
                        <Text style={styles.connectPillText}>Connect</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* SECTION 2: 2-COLUMN MARKETPLACE CARDS */}
            {(activeTab === 'all' || activeTab === 'market') && products.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>
                    {isSearching ? 'Marketplace Results' : 'Caribbean Trade & Listings'}
                  </Text>
                  <TouchableOpacity
                    style={styles.seeAllBtn}
                    onPress={() => navigation?.navigate('Marketplace')}
                  >
                    <Text style={styles.seeAllText}>Browse All</Text>
                    <Ionicons name="chevron-forward" size={13} color={TOKENS.action} />
                  </TouchableOpacity>
                </View>
                <View style={styles.productsGrid}>
                  {products.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.productCard}
                      onPress={() => navigation?.navigate('Marketplace')}
                      activeOpacity={0.85}
                    >
                      {item.media_urls && item.media_urls.length > 0 ? (
                        <Image source={{ uri: item.media_urls[0] }} style={styles.productImage} />
                      ) : (
                        <View style={styles.productPlaceholder}>
                          <Ionicons name="bag-handle-outline" size={26} color={TOKENS.textDim} />
                        </View>
                      )}
                      <View style={styles.productDetails}>
                        <Text style={styles.productPrice} numberOfLines={1}>
                          {formatPrice(item.price_amount, item.currency)}
                        </Text>
                        <Text style={styles.productTitle} numberOfLines={1}>
                          {item.title}
                        </Text>
                        {item.location_territory && (
                          <View style={styles.productTerritoryRow}>
                            <Ionicons name="location-outline" size={11} color={TOKENS.textMuted} />
                            <Text style={styles.productTerritory} numberOfLines={1}>
                              {item.location_territory}
                            </Text>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* SECTION 3: SOUND PREVIEW ROWS */}
            {(activeTab === 'all' || activeTab === 'sounds') && sounds.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>
                    {isSearching ? 'Matching Sounds' : 'Trending Sounds'}
                  </Text>
                  <TouchableOpacity
                    style={styles.seeAllBtn}
                    onPress={() => navigation?.navigate('Sounds')}
                  >
                    <Text style={styles.seeAllText}>Sound Library</Text>
                    <Ionicons name="chevron-forward" size={13} color={TOKENS.action} />
                  </TouchableOpacity>
                </View>
                {sounds.map((sound) => (
                  <TouchableOpacity
                    key={sound.id}
                    style={styles.soundCard}
                    onPress={() => navigation?.navigate('Sounds', { soundId: sound.id })}
                    activeOpacity={0.85}
                  >
                    <View style={styles.soundIconContainer}>
                      <Ionicons name="musical-notes-outline" size={19} color={TOKENS.teal} />
                    </View>
                    <View style={styles.soundInfoCol}>
                      <Text style={styles.soundCardTitle} numberOfLines={1}>
                        {sound.title}
                      </Text>
                      <Text style={styles.soundCardMeta} numberOfLines={1}>
                        {sound.artist_name} · {(sound.genre || 'Caribbean').toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.soundPlayBadge}>
                      <Ionicons name="play" size={13} color={TOKENS.actionText} />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* SECTION 4: COMMUNITY POSTS */}
            {(activeTab === 'all' || activeTab === 'posts') && posts.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>
                    {isSearching ? 'Matching Posts' : 'Conversations'}
                  </Text>
                </View>
                {posts.map((post) => {
                  const author = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles;
                  const formattedDate = new Date(post.created_at).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  });

                  return (
                    <View key={post.id} style={styles.postCard}>
                      <View style={styles.postAuthorRow}>
                        {author?.avatar_url ? (
                          <Image source={{ uri: author.avatar_url }} style={styles.postAvatar} />
                        ) : (
                          <View style={[styles.postAvatar, styles.avatarFallback]}>
                            <Text style={styles.postAvatarLetter}>
                              {(author?.full_name || author?.username || 'C')[0].toUpperCase()}
                            </Text>
                          </View>
                        )}
                        <View style={styles.postAuthorMeta}>
                          <View style={styles.postNameRow}>
                            <Text style={styles.postAuthorName} numberOfLines={1}>
                              {author?.full_name || author?.username || 'Caribbean Member'}
                            </Text>
                            {author?.is_verified && (
                              <Ionicons name="checkmark-circle" size={14} color={TOKENS.teal} />
                            )}
                          </View>
                          <Text style={styles.postAuthorHandle} numberOfLines={1}>
                            @{author?.username || 'member'} · {formattedDate}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.postContent}>{post.content}</Text>
                      {post.media_urls && post.media_urls.length > 0 && (
                        <Image
                          source={{ uri: post.media_urls[0] }}
                          style={styles.postMedia}
                          resizeMode="cover"
                        />
                      )}
                      <View style={styles.postStats}>
                        <View style={styles.postStatItem}>
                          <Ionicons name="heart-outline" size={16} color={TOKENS.textMuted} />
                          <Text style={styles.postStatText}>{post.likes_count || 0}</Text>
                        </View>
                        <View style={styles.postStatItem}>
                          <Ionicons name="chatbubble-outline" size={15} color={TOKENS.textMuted} />
                          <Text style={styles.postStatText}>{post.comments_count || 0}</Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* EMPTY STATE */}
            {profiles.length === 0 &&
              posts.length === 0 &&
              products.length === 0 &&
              sounds.length === 0 && (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIconCircle}>
                    <Ionicons name="compass-outline" size={30} color={TOKENS.teal} />
                  </View>
                  <Text style={styles.emptyStateTitle}>No discovery matches</Text>
                  <Text style={styles.emptyStateText}>
                    {query
                      ? `No results found for "${query}". Try another search term or category.`
                      : 'Select another territory or browse all Caribbean regions.'}
                  </Text>
                </View>
              )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: TOKENS.canvas,
  },
  header: {
    paddingTop: 12,
    paddingHorizontal: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: TOKENS.border,
    backgroundColor: TOKENS.canvas,
  },
  searchBar: {
    backgroundColor: TOKENS.raised,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: TOKENS.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    minHeight: 44,
    gap: 9,
    marginBottom: 11,
  },
  searchInput: {
    flex: 1,
    color: TOKENS.textPrimary,
    fontSize: 14,
    paddingVertical: 8,
  },
  clearBtn: {
    minWidth: 32,
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryTilesRow: {
    gap: 8,
    paddingBottom: 10,
  },
  categoryTile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    minHeight: 38,
    borderRadius: 12,
    backgroundColor: TOKENS.surface,
    borderWidth: 1,
    borderColor: TOKENS.border,
  },
  categoryTileActive: {
    backgroundColor: TOKENS.tealSoft,
    borderColor: TOKENS.borderActive,
  },
  categoryTileText: {
    color: TOKENS.textMuted,
    fontSize: 12.5,
    fontWeight: '600',
  },
  categoryTileTextActive: {
    color: TOKENS.teal,
    fontWeight: '700',
  },
  countryRail: {
    gap: 8,
    paddingVertical: 2,
  },
  countryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: TOKENS.surface,
    paddingHorizontal: 11,
    minHeight: 34,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: TOKENS.border,
    gap: 6,
  },
  countryChipActive: {
    backgroundColor: TOKENS.tealSoft,
    borderColor: TOKENS.borderActive,
  },
  countryEmoji: {
    fontSize: 13,
  },
  countryName: {
    color: TOKENS.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  countryNameActive: {
    color: TOKENS.teal,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 14,
    paddingBottom: 52,
  },
  centerLoading: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  spotlightBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: TOKENS.oceanDepth,
    borderWidth: 1,
    borderColor: TOKENS.borderActive,
    borderRadius: 16,
    padding: 15,
    marginBottom: 22,
    gap: 13,
  },
  spotlightIconBox: {
    width: 46,
    height: 46,
    borderRadius: 13,
    backgroundColor: TOKENS.tealSoft,
    borderWidth: 1,
    borderColor: TOKENS.borderActive,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerFlag: {
    fontSize: 22,
  },
  spotlightTextCol: {
    flex: 1,
  },
  spotlightKickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  spotlightKicker: {
    color: TOKENS.teal,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.9,
  },
  bannerTitle: {
    color: TOKENS.textPrimary,
    fontSize: 15.5,
    fontWeight: '800',
  },
  bannerSubtitle: {
    color: TOKENS.textMuted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 11,
  },
  sectionTitle: {
    color: TOKENS.textPrimary,
    fontSize: 15.5,
    fontWeight: '700',
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 4,
  },
  seeAllText: {
    color: TOKENS.action,
    fontSize: 12.5,
    fontWeight: '600',
  },
  creatorsRow: {
    gap: 11,
    paddingRight: 8,
  },
  creatorCard: {
    backgroundColor: TOKENS.surface,
    borderWidth: 1,
    borderColor: TOKENS.border,
    borderRadius: 16,
    padding: 13,
    alignItems: 'center',
    width: 138,
  },
  creatorAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: TOKENS.borderActive,
  },
  avatarFallback: {
    backgroundColor: TOKENS.oceanDepth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: TOKENS.teal,
    fontWeight: '800',
    fontSize: 18,
  },
  creatorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: '100%',
  },
  creatorName: {
    color: TOKENS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    flexShrink: 1,
  },
  creatorHandle: {
    color: TOKENS.textMuted,
    fontSize: 11.5,
    marginTop: 1,
    marginBottom: 5,
    textAlign: 'center',
  },
  originBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 10,
    maxWidth: '100%',
  },
  originSpacer: {
    height: 23,
  },
  originText: {
    color: TOKENS.textSecondary,
    fontSize: 10.5,
    fontWeight: '600',
    flexShrink: 1,
  },
  connectPill: {
    backgroundColor: TOKENS.action,
    borderRadius: 999,
    minHeight: 32,
    paddingHorizontal: 14,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectPillText: {
    color: TOKENS.actionText,
    fontSize: 12,
    fontWeight: '800',
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  productCard: {
    width: (screenWidth - 40) / 2,
    backgroundColor: TOKENS.surface,
    borderWidth: 1,
    borderColor: TOKENS.border,
    borderRadius: 15,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: 124,
    backgroundColor: TOKENS.raised,
  },
  productPlaceholder: {
    width: '100%',
    height: 124,
    backgroundColor: TOKENS.raised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productDetails: {
    padding: 11,
  },
  productPrice: {
    color: TOKENS.teal,
    fontSize: 13.5,
    fontWeight: '800',
  },
  productTitle: {
    color: TOKENS.textPrimary,
    fontSize: 12.5,
    fontWeight: '600',
    marginTop: 3,
  },
  productTerritoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 5,
  },
  productTerritory: {
    color: TOKENS.textMuted,
    fontSize: 11,
    flexShrink: 1,
  },
  soundCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: TOKENS.surface,
    borderWidth: 1,
    borderColor: TOKENS.border,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  soundIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: TOKENS.tealSoft,
    borderWidth: 1,
    borderColor: TOKENS.borderActive,
    alignItems: 'center',
    justifyContent: 'center',
  },
  soundInfoCol: {
    flex: 1,
  },
  soundCardTitle: {
    color: TOKENS.textPrimary,
    fontSize: 13.5,
    fontWeight: '700',
  },
  soundCardMeta: {
    color: TOKENS.textMuted,
    fontSize: 11.5,
    marginTop: 2,
  },
  soundPlayBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: TOKENS.action,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postCard: {
    backgroundColor: TOKENS.surface,
    borderWidth: 1,
    borderColor: TOKENS.border,
    borderRadius: 16,
    padding: 14,
    marginBottom: 11,
  },
  postAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  postAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: TOKENS.borderActive,
  },
  postAvatarLetter: {
    color: TOKENS.teal,
    fontWeight: '800',
    fontSize: 15,
  },
  postAuthorMeta: {
    flex: 1,
  },
  postNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  postAuthorName: {
    color: TOKENS.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    flexShrink: 1,
  },
  postAuthorHandle: {
    color: TOKENS.textMuted,
    fontSize: 12,
    marginTop: 1,
  },
  postContent: {
    color: TOKENS.textPrimary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  postMedia: {
    width: '100%',
    height: 184,
    borderRadius: 12,
    backgroundColor: TOKENS.raised,
    marginBottom: 10,
  },
  postStats: {
    flexDirection: 'row',
    gap: 18,
    paddingTop: 9,
    borderTopWidth: 1,
    borderTopColor: TOKENS.border,
  },
  postStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  postStatText: {
    color: TOKENS.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    paddingVertical: 56,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: TOKENS.tealSoft,
    borderWidth: 1,
    borderColor: TOKENS.borderActive,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyStateTitle: {
    color: TOKENS.textPrimary,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptyStateText: {
    color: TOKENS.textMuted,
    fontSize: 13.5,
    textAlign: 'center',
    lineHeight: 19,
  },
});
