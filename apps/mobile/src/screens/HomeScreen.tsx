import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  SafeAreaView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { TOKENS } from '../theme/tokens';
import { supabase, type MobilePost } from '../lib/supabase';

interface StoryItem {
  id: string;
  name: string;
  handle: string;
  hasUnseen: boolean;
}

interface ReelPreview {
  id: string;
  title: string;
  creator: string;
  views: string;
}

interface MarketPreview {
  id: string;
  title: string;
  price: string;
  country: string;
}

export function HomeScreen({ navigation }: any) {
  const [posts, setPosts] = useState<MobilePost[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [reels, setReels] = useState<ReelPreview[]>([]);
  const [products, setProducts] = useState<MarketPreview[]>([]);

  const sampleStories: StoryItem[] = [
    { id: '1', name: 'Your Moment', handle: 'you', hasUnseen: false },
    { id: '2', name: 'TUKUBI Live', handle: 'tukubi', hasUnseen: true },
    { id: '3', name: 'Soca Vibes', handle: 'soca', hasUnseen: true },
    { id: '4', name: 'Reggae Sun', handle: 'reggae', hasUnseen: true },
    { id: '5', name: 'Haiti Art', handle: 'ayiti', hasUnseen: true },
    { id: '6', name: 'Trini Carnival', handle: 'carnival', hasUnseen: true },
  ];

  const fetchDiscoveryData = async () => {
    try {
      const [postsRes, reelsRes, productsRes] = await Promise.all([
        supabase
          .from('posts')
          .select(`
            id,
            content,
            media_urls,
            created_at,
            likes_count,
            comments_count,
            location_name,
            profiles!author_id (
              id,
              display_name,
              username,
              avatar_url,
              is_verified
            )
          `)
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('videos')
          .select('id, title, view_count, profiles(display_name, username)')
          .eq('video_kind', 'reel')
          .eq('visibility', 'public')
          .order('view_count', { ascending: false })
          .limit(4),
        supabase
          .from('products')
          .select('id, title, price_minor, currency, businesses(name, country_iso)')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(3),
      ]);

      if (postsRes.data) {
        const formatted = postsRes.data.map((item: any) => {
          const p = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
          return {
            id: item.id,
            author: p?.display_name || p?.username || 'Caribbean Member',
            authorHandle: p?.username ? `@${p.username}` : '@member',
            authorAvatar: p?.avatar_url || null,
            isVerified: p?.is_verified || false,
            location: item.location_name || 'Caribbean 🌴',
            time: new Date(item.created_at).toLocaleDateString(),
            body: item.content || '',
            likes: item.likes_count || 0,
            comments: item.comments_count || 0,
            mediaUrls: item.media_urls || [],
          };
        });
        setPosts(formatted);
      }

      if (reelsRes.data) {
        setReels(
          reelsRes.data.map((r: any) => {
            const p = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
            return {
              id: r.id,
              title: r.title || 'Reel',
              creator: p?.display_name || p?.username || 'Creator',
              views: `${r.view_count || 0} views`,
            };
          })
        );
      }

      if (productsRes.data) {
        setProducts(
          productsRes.data.map((prod: any) => {
            const b = Array.isArray(prod.businesses) ? prod.businesses[0] : prod.businesses;
            return {
              id: prod.id,
              title: prod.title,
              price: `$${(prod.price_minor / 100).toFixed(2)} ${prod.currency || 'USD'}`,
              country: b?.country_iso || 'Caribbean',
            };
          })
        );
      }
    } catch (err) {
      console.warn('Discovery fetch error', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDiscoveryData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDiscoveryData();
  };

  const handleQuickPublish = async () => {
    if (!draft.trim()) return;
    const text = draft.trim();
    setDraft('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: newPost } = await supabase
          .from('posts')
          .insert({
            author_id: user.id,
            content: text,
            visibility: 'public',
            cultural_tags: ['mobile', 'discovery'],
          })
          .select('id, content, created_at, likes_count, comments_count')
          .single();

        if (newPost) {
          setPosts([
            {
              id: newPost.id,
              author: 'You',
              authorHandle: '@you',
              authorAvatar: null,
              isVerified: false,
              location: 'Caribbean',
              time: 'Just now',
              body: newPost.content || text,
              likes: 0,
              comments: 0,
            },
            ...posts,
          ]);
        }
      }
    } catch (err) {
      console.warn('Publish error', err);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 1. Top Discovery Navigation Header */}
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <Text style={styles.brandText}>TUKUBI</Text>
          <View style={styles.discoveryTag}>
            <Text style={styles.discoveryTagText}>DISCOVERY</Text>
          </View>
        </View>

        <View style={styles.topRightActions}>
          <TouchableOpacity
            style={styles.feedsToggle}
            onPress={() => navigation?.navigate('Feeds')}
            accessibilityRole="button"
            accessibilityLabel="Switch to Feeds"
          >
            <Text style={styles.feedsToggleText}>📑 Feeds</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.mainScroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={TOKENS.action} />
        }
      >
        {/* 2. Ephemeral Moments & Stories Rail */}
        <View style={styles.storiesContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storiesScroll}>
            {sampleStories.map((story) => (
              <TouchableOpacity key={story.id} style={styles.storyItem} activeOpacity={0.8}>
                <View style={[styles.storyRing, story.hasUnseen && styles.storyRingActive]}>
                  <View style={styles.storyInner}>
                    <Text style={styles.storyAvatarText}>
                      {story.id === '1' ? '+' : story.name.slice(0, 1)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.storyLabel} numberOfLines={1}>
                  {story.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* 3. Fast Creator Composer Strip ("What's happening?") */}
        <View style={styles.composerCard}>
          <View style={styles.composerInputRow}>
            <View style={styles.composerAvatar}>
              <Text style={styles.composerAvatarText}>🌴</Text>
            </View>
            <TextInput
              style={styles.composerInput}
              placeholder="What's happening in the Caribbean?"
              placeholderTextColor={TOKENS.textMuted}
              value={draft}
              onChangeText={setDraft}
              onSubmitEditing={handleQuickPublish}
              returnKeyType="send"
            />
            {draft.trim().length > 0 && (
              <TouchableOpacity style={styles.postBtn} onPress={handleQuickPublish}>
                <Text style={styles.postBtnText}>Post</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.composerShortcuts}>
            <TouchableOpacity
              style={styles.shortcutBtn}
              onPress={() => navigation?.navigate('Create')}
            >
              <Text style={styles.shortcutIcon}>📷</Text>
              <Text style={styles.shortcutLabel}>Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.shortcutBtn}
              onPress={() => navigation?.navigate('Reels')}
            >
              <Text style={styles.shortcutIcon}>🎬</Text>
              <Text style={styles.shortcutLabel}>Reel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.shortcutBtn}
              onPress={() => navigation?.navigate('Live')}
            >
              <Text style={styles.shortcutIcon}>🔴</Text>
              <Text style={styles.shortcutLabel}>Live</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.shortcutBtn}
              onPress={() => navigation?.navigate('SellProduct')}
            >
              <Text style={styles.shortcutIcon}>🛒</Text>
              <Text style={styles.shortcutLabel}>Sell</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 4. Trending Caribbean Reels Preview */}
        {reels.length > 0 && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🎬 Trending Caribbean Reels</Text>
              <TouchableOpacity onPress={() => navigation?.navigate('Reels')}>
                <Text style={styles.seeAllText}>See All →</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.reelsScroll}>
              {reels.map((reel) => (
                <TouchableOpacity
                  key={reel.id}
                  style={styles.reelCard}
                  onPress={() => navigation?.navigate('Reels')}
                >
                  <View style={styles.reelBadge}>
                    <Text style={styles.reelBadgeText}>▶ Play</Text>
                  </View>
                  <View style={styles.reelInfo}>
                    <Text style={styles.reelTitle} numberOfLines={1}>{reel.title}</Text>
                    <Text style={styles.reelCreator} numberOfLines={1}>{reel.creator}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* 5. Marketplace Discovery Horizon */}
        {products.length > 0 && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🛒 Marketplace Picks</Text>
              <TouchableOpacity onPress={() => navigation?.navigate('Marketplace')}>
                <Text style={styles.seeAllText}>Shop All →</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.marketScroll}>
              {products.map((prod) => (
                <TouchableOpacity
                  key={prod.id}
                  style={styles.productCard}
                  onPress={() => navigation?.navigate('Marketplace')}
                >
                  <Text style={styles.productTitle} numberOfLines={1}>{prod.title}</Text>
                  <Text style={styles.productPrice}>{prod.price}</Text>
                  <Text style={styles.productCountry}>{prod.country} 🌴</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* 6. Discovery Posts Feed Stream */}
        <View style={styles.feedHeader}>
          <Text style={styles.feedHeaderTitle}>✨ Caribbean Feed Stream</Text>
        </View>

        {loading && !refreshing ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={TOKENS.action} />
          </View>
        ) : (
          posts.map((post) => (
            <View key={post.id} style={styles.postCard}>
              <View style={styles.postHeader}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{post.author.slice(0, 1).toUpperCase()}</Text>
                </View>
                <View style={styles.authorMeta}>
                  <View style={styles.nameRow}>
                    <Text style={styles.authorName}>{post.author}</Text>
                    {post.isVerified && <Text style={styles.verifiedBadge}>✓</Text>}
                  </View>
                  <Text style={styles.authorHandle}>
                    {post.location} • {post.time}
                  </Text>
                </View>
              </View>

              <Text style={styles.postBody}>{post.body}</Text>

              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.actionBtn}>
                  <Text style={styles.actionBtnText}>❤️ {post.likes}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn}>
                  <Text style={styles.actionBtnText}>💬 {post.comments}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn}>
                  <Text style={styles.actionBtnText}>🔁 Share</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: TOKENS.canvas,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: TOKENS.border,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandText: {
    color: TOKENS.action,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1,
  },
  discoveryTag: {
    backgroundColor: 'rgba(0, 168, 150, 0.15)',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(0, 168, 150, 0.3)',
  },
  discoveryTagText: {
    color: TOKENS.action,
    fontSize: 9,
    fontWeight: '900',
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  feedsToggle: {
    backgroundColor: TOKENS.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: TOKENS.border,
  },
  feedsToggleText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  mainScroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  storiesContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: TOKENS.border,
  },
  storiesScroll: {
    paddingHorizontal: 12,
    gap: 12,
  },
  storyItem: {
    alignItems: 'center',
    width: 64,
  },
  storyRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    padding: 2,
    backgroundColor: TOKENS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyRingActive: {
    backgroundColor: TOKENS.action,
  },
  storyInner: {
    width: '100%',
    height: '100%',
    borderRadius: 26,
    backgroundColor: TOKENS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyAvatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  storyLabel: {
    color: TOKENS.textMuted,
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
  },
  composerCard: {
    margin: 12,
    backgroundColor: TOKENS.surface,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: TOKENS.border,
  },
  composerInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  composerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  composerAvatarText: {
    fontSize: 18,
  },
  composerInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
  },
  postBtn: {
    backgroundColor: TOKENS.action,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
  },
  postBtnText: {
    color: '#090D1A',
    fontWeight: '900',
    fontSize: 12,
  },
  composerShortcuts: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    marginTop: 10,
    paddingTop: 10,
  },
  shortcutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  shortcutIcon: {
    fontSize: 14,
  },
  shortcutLabel: {
    color: TOKENS.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  sectionContainer: {
    marginVertical: 8,
    paddingHorizontal: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  seeAllText: {
    color: TOKENS.action,
    fontSize: 11,
    fontWeight: '700',
  },
  reelsScroll: {
    gap: 8,
  },
  reelCard: {
    width: 110,
    height: 160,
    backgroundColor: '#1E142B',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: TOKENS.border,
    padding: 8,
    justifyContent: 'space-between',
  },
  reelBadge: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 10,
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  reelBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  reelInfo: {
    gap: 2,
  },
  reelTitle: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  reelCreator: {
    color: TOKENS.textMuted,
    fontSize: 9,
  },
  marketScroll: {
    gap: 8,
  },
  productCard: {
    width: 130,
    backgroundColor: TOKENS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: TOKENS.border,
    padding: 10,
    gap: 2,
  },
  productTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  productPrice: {
    color: '#FF6B6B',
    fontSize: 12,
    fontWeight: '900',
  },
  productCountry: {
    color: TOKENS.textMuted,
    fontSize: 10,
  },
  feedHeader: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 4,
  },
  feedHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  centerBox: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postCard: {
    backgroundColor: TOKENS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: TOKENS.border,
    padding: 16,
    marginHorizontal: 12,
    marginBottom: 12,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0, 168, 150, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(0, 168, 150, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: TOKENS.action,
    fontSize: 16,
    fontWeight: '900',
  },
  authorMeta: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    marginRight: 4,
  },
  verifiedBadge: {
    color: TOKENS.action,
    fontSize: 12,
    fontWeight: '900',
  },
  authorHandle: {
    color: TOKENS.textMuted,
    fontSize: 11,
    marginTop: 1,
  },
  postBody: {
    color: TOKENS.textPrimary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 10,
    justifyContent: 'space-around',
  },
  actionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  actionBtnText: {
    color: TOKENS.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
});
