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

const Ionicons = ExpoIonicons as unknown as React.ComponentType<any>;
const { width: screenWidth } = Dimensions.get('window');

type SearchTab = 'all' | 'people' | 'posts' | 'market' | 'sounds';

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

  // Search Results & Feed Data
  const [profiles, setProfiles] = useState<ProfileResult[]>([]);
  const [posts, setPosts] = useState<PostResult[]>([]);
  const [products, setProducts] = useState<ProductResult[]>([]);
  const [sounds, setSounds] = useState<SoundResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // 1. Fetch Caribbean Countries for Filter Rail
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

  // 2. Fetch Discovery Feed (Unfiltered or Country-Filtered)
  const fetchDiscoveryData = useCallback(async () => {
    setLoading(true);
    try {
      // 2a. Fetch Profiles
      let profilesQuery = supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, country, island, headline')
        .limit(10);
      if (selectedCountry) {
        profilesQuery = profilesQuery.or(`country.ilike.%${selectedCountry.name}%,island.ilike.%${selectedCountry.name}%`);
      }
      const { data: profData } = await profilesQuery;
      if (profData) setProfiles(profData);

      // 2b. Fetch Posts
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
            avatar_url
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10);
      if (selectedCountry) {
        postsQuery = postsQuery.eq('country_id', selectedCountry.id);
      }
      const { data: postData } = await postsQuery;
      if (postData) setPosts(postData as unknown as PostResult[]);

      // 2c. Fetch Marketplace Products
      let productsQuery = supabase
        .from('products')
        .select('id, title, description, price_amount, currency, media_urls, condition, location_territory')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(6);
      if (selectedCountry) {
        productsQuery = productsQuery.or(`location_territory.ilike.%${selectedCountry.name}%,location_territory.ilike.%${selectedCountry.iso2_code}%`);
      }
      const { data: prodData } = await productsQuery;
      if (prodData) setProducts(prodData);

      // 2d. Fetch Sounds
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

  // 3. Search Handler Across Entities
  const handleSearch = async (searchTerm: string) => {
    const q = searchTerm.trim();
    if (!q) {
      setIsSearching(false);
      fetchDiscoveryData();
      return;
    }

    setIsSearching(true);
    setLoading(true);

    try {
      // Search Profiles
      if (activeTab === 'all' || activeTab === 'people') {
        const { data: profData } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url, country, island, headline')
          .or(`username.ilike.%${q}%,full_name.ilike.%${q}%`)
          .limit(15);
        if (profData) setProfiles(profData);
      }

      // Search Posts
      if (activeTab === 'all' || activeTab === 'posts') {
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
              avatar_url
            )
          `)
          .ilike('content', `%${q}%`)
          .limit(15);
        if (postData) setPosts(postData as unknown as PostResult[]);
      }

      // Search Products
      if (activeTab === 'all' || activeTab === 'market') {
        const { data: prodData } = await supabase
          .from('products')
          .select('id, title, description, price_amount, currency, media_urls, condition, location_territory')
          .or(`title.ilike.%${q}%,description.ilike.%${q}%`)
          .limit(15);
        if (prodData) setProducts(prodData);
      }

      // Search Sounds
      if (activeTab === 'all' || activeTab === 'sounds') {
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
    return `${currency} $${(cents / 100).toFixed(2)}`;
  };

  return (
    <View style={styles.screen}>
      {/* Search Header */}
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={TOKENS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search Caribbean creators, posts, items, rhythms..."
            placeholderTextColor={TOKENS.textMuted}
            value={query}
            onChangeText={(text) => {
              setQuery(text);
              handleSearch(text);
            }}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); setIsSearching(false); fetchDiscoveryData(); }}>
              <Ionicons name="close-circle" size={18} color={TOKENS.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Tab Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
          {(
            [
              { key: 'all', label: 'All' },
              { key: 'people', label: 'People' },
              { key: 'posts', label: 'Posts' },
              { key: 'market', label: 'Marketplace' },
              { key: 'sounds', label: 'Sounds' },
            ] as { key: SearchTab; label: string }[]
          ).map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabChip, activeTab === tab.key && styles.tabChipActive]}
              onPress={() => {
                setActiveTab(tab.key);
                if (query) handleSearch(query);
              }}
            >
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Caribbean Territory Switcher Rail */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.countryRail}>
          <TouchableOpacity
            style={[styles.countryChip, !selectedCountry && styles.countryChipActive]}
            onPress={() => setSelectedCountry(null)}
          >
            <Text style={styles.countryEmoji}>🌴</Text>
            <Text style={[styles.countryName, !selectedCountry && styles.countryNameActive]}>All Caribbean</Text>
          </TouchableOpacity>

          {countries.map((c) => {
            const isSelected = selectedCountry?.id === c.id;
            return (
              <TouchableOpacity
                key={c.id}
                style={[styles.countryChip, isSelected && styles.countryChipActive]}
                onPress={() => setSelectedCountry(isSelected ? null : c)}
              >
                <Text style={styles.countryEmoji}>{c.flag_emoji || '🏝️'}</Text>
                <Text style={[styles.countryName, isSelected && styles.countryNameActive]}>
                  {c.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={TOKENS.action} />}
      >
        {loading && !refreshing ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color={TOKENS.action} />
          </View>
        ) : (
          <>
            {/* Territory Spotlight Banner */}
            {selectedCountry && (
              <View style={styles.territoryBanner}>
                <Text style={styles.bannerEmoji}>{selectedCountry.flag_emoji || '🏝️'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.bannerTitle}>Spotlight: {selectedCountry.name}</Text>
                  <Text style={styles.bannerSubtitle}>
                    Showing active creators, community discussions, and trade in {selectedCountry.iso_code}
                  </Text>
                </View>
              </View>
            )}

            {/* SECTION 1: PEOPLE / CREATORS */}
            {(activeTab === 'all' || activeTab === 'people') && profiles.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>
                    {isSearching ? 'Matching People' : 'Featured Island Members'}
                  </Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.creatorsRow}>
                  {profiles.map((p) => (
                    <TouchableOpacity
                      key={p.id}
                      style={styles.creatorCard}
                      onPress={() => navigation?.navigate('Messages', { targetUserId: p.id })}
                    >
                      {p.avatar_url ? (
                        <Image source={{ uri: p.avatar_url }} style={styles.creatorAvatar} />
                      ) : (
                        <View style={[styles.creatorAvatar, styles.avatarFallback]}>
                          <Text style={styles.avatarLetter}>{(p.full_name || p.username || 'U')[0].toUpperCase()}</Text>
                        </View>
                      )}
                      <Text style={styles.creatorName} numberOfLines={1}>
                        {p.full_name || p.username}
                      </Text>
                      <Text style={styles.creatorHandle} numberOfLines={1}>
                        @{p.username}
                      </Text>
                      {(p.island || p.country) && (
                        <View style={styles.originBadge}>
                          <Ionicons name="location-sharp" size={10} color={TOKENS.action} />
                          <Text style={styles.originText} numberOfLines={1}>
                            {p.island || p.country}
                          </Text>
                        </View>
                      )}
                      <View style={styles.connectButton}>
                        <Text style={styles.connectText}>Connect</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* SECTION 2: MARKETPLACE DISCOVERIES */}
            {(activeTab === 'all' || activeTab === 'market') && products.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>
                    {isSearching ? 'Marketplace Products' : 'Caribbean Trade & Listings'}
                  </Text>
                  <TouchableOpacity onPress={() => navigation?.navigate('Marketplace')}>
                    <Text style={styles.seeAllText}>Browse All</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.productsGrid}>
                  {products.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.productCard}
                      onPress={() => navigation?.navigate('Marketplace')}
                    >
                      {item.media_urls && item.media_urls.length > 0 ? (
                        <Image source={{ uri: item.media_urls[0] }} style={styles.productImage} />
                      ) : (
                        <View style={styles.productPlaceholder}>
                          <Ionicons name="cart-outline" size={28} color={TOKENS.textMuted} />
                        </View>
                      )}
                      <View style={styles.productDetails}>
                        <Text style={styles.productPrice}>
                          {formatPrice(item.price_amount, item.currency)}
                        </Text>
                        <Text style={styles.productTitle} numberOfLines={1}>
                          {item.title}
                        </Text>
                        {item.location_territory && (
                          <Text style={styles.productTerritory} numberOfLines={1}>
                            📍 {item.location_territory}
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* SECTION 3: CARIBBEAN SOUNDS & RHYTHMS */}
            {(activeTab === 'all' || activeTab === 'sounds') && sounds.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>
                    {isSearching ? 'Matching Sounds' : 'Trending Caribbean Sounds'}
                  </Text>
                  <TouchableOpacity onPress={() => navigation?.navigate('Sounds')}>
                    <Text style={styles.seeAllText}>Sound Library</Text>
                  </TouchableOpacity>
                </View>
                {sounds.map((sound) => (
                  <TouchableOpacity
                    key={sound.id}
                    style={styles.soundCard}
                    onPress={() => navigation?.navigate('Sounds', { soundId: sound.id })}
                  >
                    <View style={styles.soundIconContainer}>
                      <Ionicons name="musical-notes" size={20} color={TOKENS.action} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.soundCardTitle} numberOfLines={1}>{sound.title}</Text>
                      <Text style={styles.soundCardMeta} numberOfLines={1}>
                        {sound.artist_name} • {sound.genre.toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.soundPlayBadge}>
                      <Ionicons name="play" size={14} color="#FFF" />
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
                    {isSearching ? 'Community Posts' : 'Island Conversations'}
                  </Text>
                </View>
                {posts.map((post) => {
                  const author = post.profiles;
                  return (
                    <View key={post.id} style={styles.postCard}>
                      <View style={styles.postAuthorRow}>
                        {author?.avatar_url ? (
                          <Image source={{ uri: author.avatar_url }} style={styles.postAvatar} />
                        ) : (
                          <View style={[styles.postAvatar, styles.avatarFallback]}>
                            <Text style={styles.avatarLetter}>
                              {(author?.full_name || author?.username || 'C')[0].toUpperCase()}
                            </Text>
                          </View>
                        )}
                        <View>
                          <Text style={styles.postAuthorName}>{author?.full_name || author?.username || 'Caribbean Voice'}</Text>
                          <Text style={styles.postAuthorHandle}>@{author?.username || 'member'}</Text>
                        </View>
                      </View>
                      <Text style={styles.postContent}>{post.content}</Text>
                      {post.media_urls && post.media_urls.length > 0 && (
                        <Image source={{ uri: post.media_urls[0] }} style={styles.postMedia} resizeMode="cover" />
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
            {profiles.length === 0 && posts.length === 0 && products.length === 0 && sounds.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="compass-outline" size={56} color={TOKENS.textMuted} />
                <Text style={styles.emptyStateTitle}>No Discovery Matches</Text>
                <Text style={styles.emptyStateText}>
                  {query
                    ? `No results found for "${query}". Try another island term or category.`
                    : 'Select another territory or explore all Caribbean regions.'}
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
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: TOKENS.border,
    backgroundColor: TOKENS.canvas,
  },
  searchBar: {
    backgroundColor: TOKENS.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: TOKENS.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    gap: 10,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    color: TOKENS.textPrimary,
    fontSize: 14,
    paddingVertical: 0,
  },
  tabsRow: {
    gap: 8,
    paddingBottom: 8,
  },
  tabChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: TOKENS.surface,
    borderWidth: 1,
    borderColor: TOKENS.border,
  },
  tabChipActive: {
    backgroundColor: TOKENS.action,
    borderColor: TOKENS.action,
  },
  tabText: {
    color: TOKENS.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#FFF',
  },
  countryRail: {
    gap: 8,
    paddingVertical: 6,
  },
  countryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: TOKENS.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: TOKENS.border,
    gap: 6,
  },
  countryChipActive: {
    borderColor: TOKENS.action,
    backgroundColor: 'rgba(255, 87, 34, 0.1)',
  },
  countryEmoji: {
    fontSize: 14,
  },
  countryName: {
    color: TOKENS.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  countryNameActive: {
    color: TOKENS.textPrimary,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 60,
  },
  centerLoading: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  territoryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: TOKENS.surface,
    borderWidth: 1,
    borderColor: TOKENS.action,
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    gap: 12,
  },
  bannerEmoji: {
    fontSize: 32,
  },
  bannerTitle: {
    color: TOKENS.textPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
  bannerSubtitle: {
    color: TOKENS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  section: {
    marginBottom: 26,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: TOKENS.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  seeAllText: {
    color: TOKENS.action,
    fontSize: 13,
    fontWeight: '700',
  },
  creatorsRow: {
    gap: 12,
    paddingRight: 16,
  },
  creatorCard: {
    backgroundColor: TOKENS.surface,
    borderWidth: 1,
    borderColor: TOKENS.border,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    width: 130,
  },
  creatorAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginBottom: 8,
  },
  avatarFallback: {
    backgroundColor: TOKENS.raised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: TOKENS.textPrimary,
    fontWeight: '800',
    fontSize: 18,
  },
  creatorName: {
    color: TOKENS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  creatorHandle: {
    color: TOKENS.textMuted,
    fontSize: 11,
    marginBottom: 4,
    textAlign: 'center',
  },
  originBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 8,
  },
  originText: {
    color: TOKENS.action,
    fontSize: 10,
    fontWeight: '600',
  },
  connectButton: {
    backgroundColor: TOKENS.raised,
    borderRadius: 12,
    paddingVertical: 5,
    paddingHorizontal: 12,
    width: '100%',
    alignItems: 'center',
  },
  connectText: {
    color: TOKENS.textPrimary,
    fontSize: 11,
    fontWeight: '700',
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  productCard: {
    width: (screenWidth - 44) / 2,
    backgroundColor: TOKENS.surface,
    borderWidth: 1,
    borderColor: TOKENS.border,
    borderRadius: 14,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: 120,
    backgroundColor: TOKENS.raised,
  },
  productPlaceholder: {
    width: '100%',
    height: 120,
    backgroundColor: TOKENS.raised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productDetails: {
    padding: 10,
  },
  productPrice: {
    color: TOKENS.action,
    fontSize: 14,
    fontWeight: '800',
  },
  productTitle: {
    color: TOKENS.textPrimary,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  productTerritory: {
    color: TOKENS.textMuted,
    fontSize: 10,
    marginTop: 4,
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
    borderRadius: 20,
    backgroundColor: 'rgba(255, 87, 34, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  soundCardTitle: {
    color: TOKENS.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  soundCardMeta: {
    color: TOKENS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  soundPlayBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: TOKENS.action,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postCard: {
    backgroundColor: TOKENS.surface,
    borderWidth: 1,
    borderColor: TOKENS.border,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  postAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  postAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  postAuthorName: {
    color: TOKENS.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  postAuthorHandle: {
    color: TOKENS.textMuted,
    fontSize: 12,
  },
  postContent: {
    color: TOKENS.textPrimary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  postMedia: {
    width: '100%',
    height: 180,
    borderRadius: 10,
    marginBottom: 10,
  },
  postStats: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: TOKENS.border,
  },
  postStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  postStatText: {
    color: TOKENS.textMuted,
    fontSize: 12,
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyStateTitle: {
    color: TOKENS.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 14,
    marginBottom: 6,
  },
  emptyStateText: {
    color: TOKENS.textMuted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});
