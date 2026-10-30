import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  ActivityIndicator,
  Image,
  Share,
  Alert,
} from 'react-native';
import { Ionicons as ExpoIonicons } from '@expo/vector-icons';
import { TOKENS } from '../theme/tokens';
import { supabase, type MobilePost } from '../lib/supabase';

type IoniconName = keyof typeof ExpoIonicons.glyphMap;
const Ionicons = ExpoIonicons as unknown as React.ComponentType<{
  name: IoniconName;
  size?: number;
  color?: string;
  style?: any;
}>;

type FeedFilter = 'all' | 'following' | 'friends' | 'favorites' | 'communities' | 'caribbean';

const FILTERS: Array<{ id: FeedFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'following', label: 'Following' },
  { id: 'friends', label: 'Friends' },
  { id: 'favorites', label: 'Favorites' },
  { id: 'communities', label: 'Communities' },
  { id: 'caribbean', label: 'Caribbean' },
];

export function FeedsScreen({ navigation }: any) {
  const [activeFilter, setActiveFilter] = useState<FeedFilter>('all');
  const [posts, setPosts] = useState<MobilePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  const [savedPosts, setSavedPosts] = useState<Record<string, boolean>>({});

  const fetchFeedPosts = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const currentUserId = user?.id;

      let query = supabase
        .from('posts')
        .select(`
          id,
          content,
          media_urls,
          created_at,
          likes_count,
          comments_count,
          author_id,
          location_name,
          country_id,
          community_id,
          profiles!author_id (
            id,
            display_name,
            username,
            avatar_url,
            is_verified
          )
        `)
        .order('created_at', { ascending: false })
        .limit(30);

      if (activeFilter === 'following' && currentUserId) {
        const { data: follows } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', currentUserId);
        const ids = (follows || []).map((f: any) => f.following_id);
        if (ids.length > 0) {
          query = query.in('author_id', ids);
        } else {
          query = query.in('author_id', ['00000000-0000-0000-0000-000000000000']);
        }
      } else if (activeFilter === 'friends' && currentUserId) {
        const { data: f1 } = await supabase
          .from('friendships')
          .select('addressee_id')
          .eq('requester_id', currentUserId)
          .eq('status', 'accepted');
        const { data: f2 } = await supabase
          .from('friendships')
          .select('requester_id')
          .eq('addressee_id', currentUserId)
          .eq('status', 'accepted');
        const friendIds = [
          ...(f1?.map((f: any) => f.addressee_id) || []),
          ...(f2?.map((f: any) => f.requester_id) || []),
        ];
        if (friendIds.length > 0) {
          query = query.in('author_id', friendIds);
        } else {
          query = query.in('author_id', ['00000000-0000-0000-0000-000000000000']);
        }
      } else if (activeFilter === 'favorites' && currentUserId) {
        const { data: favs } = await supabase
          .from('user_favorites')
          .select('target_id')
          .eq('user_id', currentUserId);
        const favIds = (favs || []).map((f: any) => f.target_id);
        if (favIds.length > 0) {
          query = query.in('author_id', favIds);
        } else {
          query = query.in('author_id', ['00000000-0000-0000-0000-000000000000']);
        }
      } else if (activeFilter === 'communities' && currentUserId) {
        const { data: members } = await supabase
          .from('community_members')
          .select('community_id')
          .eq('profile_id', currentUserId);
        const cIds = (members || []).map((m: any) => m.community_id).filter(Boolean);
        if (cIds.length > 0) {
          query = query.in('community_id', cIds);
        } else {
          query = query.not('community_id', 'is', null);
        }
      } else if (activeFilter === 'caribbean') {
        query = query.not('country_id', 'is', null);
      }

      const { data, error } = await query;

      if (!error && data) {
        const formatted: MobilePost[] = data.map((item: any) => {
          const profile = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
          return {
            id: item.id,
            author: profile?.display_name || profile?.username || 'Caribbean Member',
            authorHandle: profile?.username ? `@${profile.username}` : '@member',
            authorAvatar: profile?.avatar_url || null,
            isVerified: Boolean(profile?.is_verified),
            location: item.location_name || 'Caribbean',
            time: new Date(item.created_at).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            }),
            body: item.content || '',
            likes: item.likes_count || 0,
            comments: item.comments_count || 0,
            mediaUrls: item.media_urls || [],
          };
        });
        setPosts(formatted);
      }
    } catch (err) {
      console.warn('Could not fetch feeds', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeFilter]);

  useEffect(() => {
    setLoading(true);
    fetchFeedPosts();
  }, [fetchFeedPosts]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchFeedPosts();
  };

  const handleToggleLike = async (postId: string) => {
    const isCurrentlyLiked = Boolean(likedPosts[postId]);
    setLikedPosts((prev) => ({ ...prev, [postId]: !isCurrentlyLiked }));
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, likes: Math.max(0, isCurrentlyLiked ? p.likes - 1 : p.likes + 1) }
          : p
      )
    );

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) {
        if (!isCurrentlyLiked) {
          await supabase.from('post_reactions').insert({
            post_id: postId,
            profile_id: userData.user.id,
            reaction_type: 'like',
          });
        } else {
          await supabase
            .from('post_reactions')
            .delete()
            .eq('post_id', postId)
            .eq('profile_id', userData.user.id);
        }
      }
    } catch {
      // Non-blocking optimistic sync
    }
  };

  const handleToggleSave = (postId: string) => {
    setSavedPosts((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  const handleSharePost = async (post: MobilePost) => {
    try {
      await Share.share({
        message: `${post.author} on TUKUBI: "${post.body}"\nhttps://tukubi.com/post/${post.id}`,
      });
    } catch {
      // Cancelled
    }
  };

  const isFavoritesActive = activeFilter === 'favorites';

  return (
    <SafeAreaView style={styles.container}>
      {/* Clean Midnight Reef Header */}
      <View style={styles.header}>
        <View style={styles.headerTextBlock}>
          <Text style={styles.headerTitle}>Your Feeds</Text>
          <Text style={styles.headerSubtitle}>
            Chronological stream of creators and communities you follow
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.favoritesToggle, isFavoritesActive && styles.favoritesToggleActive]}
          onPress={() => setActiveFilter(isFavoritesActive ? 'all' : 'favorites')}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityState={{ selected: isFavoritesActive }}
          accessibilityLabel="Toggle Favorites filter"
        >
          <Ionicons
            name={isFavoritesActive ? 'star' : 'star-outline'}
            size={15}
            color={isFavoritesActive ? TOKENS.accent : TOKENS.textSecondary}
          />
          <Text
            style={[
              styles.favoritesToggleText,
              isFavoritesActive && styles.favoritesToggleTextActive,
            ]}
          >
            Favorites
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sleek Underline Mode Tabs */}
      <View style={styles.tabsBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScroll}
          accessibilityRole="tablist"
        >
          {FILTERS.map((item) => {
            const isActive = activeFilter === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.modeTab, isActive && styles.modeTabActive]}
                onPress={() => setActiveFilter(item.id)}
                activeOpacity={0.75}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
                accessibilityLabel={item.label}
              >
                <Text style={[styles.modeTabText, isActive && styles.modeTabTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Editorial Feed Stream */}
      <ScrollView
        style={styles.feedScroll}
        contentContainerStyle={styles.feedContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={TOKENS.teal} />
        }
      >
        {loading && !refreshing ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={TOKENS.teal} />
          </View>
        ) : posts.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="newspaper-outline" size={26} color={TOKENS.teal} />
            </View>
            <Text style={styles.emptyTitle}>No updates in this feed</Text>
            <Text style={styles.emptyText}>
              {activeFilter === 'friends'
                ? 'You have not connected with mutual friends yet, or they have not posted recently.'
                : activeFilter === 'favorites'
                ? 'No favorited creators yet. Star creators across TUKUBI to prioritize them here.'
                : 'No recent posts match this filter.'}
            </Text>
            <TouchableOpacity
              style={styles.discoverButton}
              onPress={() => navigation?.navigate('Explore')}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Explore Creators and Communities"
            >
              <Ionicons name="compass-outline" size={16} color={TOKENS.actionText} />
              <Text style={styles.discoverButtonText}>Discover Creators</Text>
            </TouchableOpacity>
          </View>
        ) : (
          posts.map((post) => {
            const isLiked = Boolean(likedPosts[post.id]);
            const isSaved = Boolean(savedPosts[post.id]);

            return (
              <View key={post.id} style={styles.postCard}>
                {/* 2-Line Editorial Author Header */}
                <View style={styles.postHeader}>
                  {post.authorAvatar ? (
                    <Image source={{ uri: post.authorAvatar }} style={styles.avatarImg} />
                  ) : (
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {post.author.slice(0, 1).toUpperCase()}
                      </Text>
                    </View>
                  )}

                  <View style={styles.authorMeta}>
                    <View style={styles.nameRow}>
                      <Text style={styles.authorName} numberOfLines={1}>
                        {post.author}
                      </Text>
                      {post.isVerified && (
                        <Ionicons name="checkmark-circle" size={15} color={TOKENS.teal} />
                      )}
                    </View>
                    <Text style={styles.authorSubline} numberOfLines={1}>
                      {post.authorHandle || '@member'} · {post.time} · {post.location}
                    </Text>
                  </View>
                </View>

                {/* Post Body */}
                {Boolean(post.body) && <Text style={styles.postBody}>{post.body}</Text>}

                {/* Media Attachment */}
                {post.mediaUrls && post.mediaUrls.length > 0 && (
                  <Image
                    source={{ uri: post.mediaUrls[0] }}
                    style={styles.postMedia}
                    resizeMode="cover"
                  />
                )}

                {/* Crisp Ionicons Engagement Bar */}
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleToggleLike(post.id)}
                    activeOpacity={0.75}
                    accessibilityRole="button"
                    accessibilityLabel="Like post"
                  >
                    <Ionicons
                      name={isLiked ? 'heart' : 'heart-outline'}
                      size={18}
                      color={isLiked ? TOKENS.danger : TOKENS.textMuted}
                    />
                    <Text
                      style={[
                        styles.actionText,
                        isLiked && { color: TOKENS.danger, fontWeight: '700' },
                      ]}
                    >
                      {post.likes}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() =>
                      Alert.alert('Comments', `Discussion on post by ${post.author}`)
                    }
                    activeOpacity={0.75}
                    accessibilityRole="button"
                    accessibilityLabel="Comment on post"
                  >
                    <Ionicons name="chatbubble-outline" size={17} color={TOKENS.textMuted} />
                    <Text style={styles.actionText}>{post.comments}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleSharePost(post)}
                    activeOpacity={0.75}
                    accessibilityRole="button"
                    accessibilityLabel="Share post"
                  >
                    <Ionicons name="arrow-redo-outline" size={18} color={TOKENS.textMuted} />
                    <Text style={styles.actionText}>Share</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.bookmarkBtn}
                    onPress={() => handleToggleSave(post.id)}
                    activeOpacity={0.75}
                    accessibilityRole="button"
                    accessibilityLabel={isSaved ? 'Remove bookmark' : 'Bookmark post'}
                  >
                    <Ionicons
                      name={isSaved ? 'bookmark' : 'bookmark-outline'}
                      size={18}
                      color={isSaved ? TOKENS.teal : TOKENS.textMuted}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    gap: 12,
  },
  headerTextBlock: {
    flex: 1,
  },
  headerTitle: {
    color: TOKENS.textPrimary,
    fontSize: 19,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: TOKENS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  favoritesToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: TOKENS.raised,
    borderWidth: 1,
    borderColor: TOKENS.border,
    borderRadius: 11,
    paddingHorizontal: 12,
    minHeight: 38,
  },
  favoritesToggleActive: {
    backgroundColor: TOKENS.amberSoft,
    borderColor: TOKENS.accent,
  },
  favoritesToggleText: {
    color: TOKENS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  favoritesToggleTextActive: {
    color: TOKENS.accent,
    fontWeight: '800',
  },
  tabsBar: {
    borderBottomWidth: 1,
    borderBottomColor: TOKENS.border,
    backgroundColor: TOKENS.canvas,
  },
  tabsScroll: {
    paddingHorizontal: 16,
    gap: 20,
  },
  modeTab: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 2,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  modeTabActive: {
    borderBottomColor: TOKENS.teal,
  },
  modeTabText: {
    color: TOKENS.textMuted,
    fontSize: 13.5,
    fontWeight: '600',
  },
  modeTabTextActive: {
    color: TOKENS.textPrimary,
    fontWeight: '700',
  },
  feedScroll: {
    flex: 1,
  },
  feedContent: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 40,
  },
  centerBox: {
    paddingVertical: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCard: {
    backgroundColor: TOKENS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: TOKENS.border,
    padding: 26,
    alignItems: 'center',
    marginTop: 12,
  },
  emptyIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: TOKENS.tealSoft,
    borderWidth: 1,
    borderColor: TOKENS.borderActive,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    color: TOKENS.textPrimary,
    fontSize: 16.5,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptyText: {
    color: TOKENS.textMuted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 18,
  },
  discoverButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: TOKENS.teal,
    borderRadius: 12,
    paddingHorizontal: 16,
    minHeight: 42,
  },
  discoverButtonText: {
    color: TOKENS.actionText,
    fontSize: 13,
    fontWeight: '800',
  },
  postCard: {
    backgroundColor: TOKENS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: TOKENS.border,
    padding: 15,
    marginBottom: 12,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 11,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: TOKENS.oceanDepth,
    borderWidth: 1,
    borderColor: TOKENS.borderActive,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },
  avatarImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: TOKENS.border,
    marginRight: 11,
  },
  avatarText: {
    color: TOKENS.teal,
    fontSize: 15,
    fontWeight: '800',
  },
  authorMeta: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  authorName: {
    color: TOKENS.textPrimary,
    fontSize: 14.5,
    fontWeight: '700',
    flexShrink: 1,
  },
  authorSubline: {
    color: TOKENS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  postBody: {
    color: TOKENS.textPrimary,
    fontSize: 14.5,
    lineHeight: 21,
    marginBottom: 12,
  },
  postMedia: {
    width: '100%',
    height: 210,
    borderRadius: 12,
    backgroundColor: TOKENS.raised,
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: TOKENS.border,
    paddingTop: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 36,
    paddingRight: 20,
  },
  actionText: {
    color: TOKENS.textMuted,
    fontSize: 12.5,
    fontWeight: '600',
  },
  bookmarkBtn: {
    marginLeft: 'auto',
    minWidth: 36,
    minHeight: 36,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
});
