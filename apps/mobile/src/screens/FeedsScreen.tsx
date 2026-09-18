import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { TOKENS } from '../theme/tokens';
import { supabase, type MobilePost } from '../lib/supabase';

type FeedFilter = 'all' | 'friends' | 'following' | 'favorites' | 'communities' | 'caribbean';

const FILTERS: Array<{ id: FeedFilter; label: string; icon: string }> = [
  { id: 'all', label: 'All Feeds', icon: '📑' },
  { id: 'friends', label: 'Friends', icon: '👥' },
  { id: 'following', label: 'Following', icon: '⭐' },
  { id: 'favorites', label: 'Favorites', icon: '🌟' },
  { id: 'communities', label: 'Hubs', icon: '🌴' },
  { id: 'caribbean', label: 'Islands', icon: '🌊' },
];

export function FeedsScreen({ navigation }: any) {
  const [activeFilter, setActiveFilter] = useState<FeedFilter>('all');
  const [posts, setPosts] = useState<MobilePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFeedPosts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
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
        const { data: f1 } = await supabase.from('friendships').select('addressee_id').eq('requester_id', currentUserId).eq('status', 'accepted');
        const { data: f2 } = await supabase.from('friendships').select('requester_id').eq('addressee_id', currentUserId).eq('status', 'accepted');
        const friendIds = [...(f1?.map((f: any) => f.addressee_id) || []), ...(f2?.map((f: any) => f.requester_id) || [])];
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
        const formatted = data.map((item: any) => {
          const profile = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
          return {
            id: item.id,
            author: profile?.display_name || profile?.username || 'Caribbean Member',
            authorHandle: profile?.username ? `@${profile.username}` : '@member',
            authorAvatar: profile?.avatar_url || null,
            isVerified: profile?.is_verified || false,
            location: item.location_name || 'Caribbean',
            time: new Date(item.created_at).toLocaleDateString(),
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
  };

  useEffect(() => {
    setLoading(true);
    fetchFeedPosts();
  }, [activeFilter]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchFeedPosts();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Feeds Subheader */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Your Feeds</Text>
          <Text style={styles.headerSubtitle}>Pure timeline of people and hubs you follow</Text>
        </View>
        <TouchableOpacity
          style={styles.favoritesButton}
          onPress={() => setActiveFilter('favorites')}
          accessibilityRole="button"
          accessibilityLabel="Filter by Favorites"
        >
          <Text style={styles.favoritesButtonText}>⭐ Favorites</Text>
        </TouchableOpacity>
      </View>

      {/* Horizontal Filter Pill Bar */}
      <View style={styles.filterBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {FILTERS.map((item) => {
            const isActive = activeFilter === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.filterPill, isActive && styles.filterPillActive]}
                onPress={() => setActiveFilter(item.id)}
                accessibilityRole="button"
                accessibilityLabel={item.label}
              >
                <Text style={styles.filterIcon}>{item.icon}</Text>
                <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Feed Posts Stream */}
      <ScrollView
        style={styles.feedScroll}
        contentContainerStyle={styles.feedContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={TOKENS.action} />
        }
      >
        {loading && !refreshing ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={TOKENS.action} />
          </View>
        ) : posts.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>🏝️</Text>
            <Text style={styles.emptyTitle}>No Posts in this Feed</Text>
            <Text style={styles.emptyText}>
              {activeFilter === 'friends'
                ? 'You have not added any mutual friends yet, or they have not posted recently.'
                : activeFilter === 'favorites'
                ? 'You have no favorited creators or pages yet. Tap the star on any profile to add them.'
                : 'No recent updates available for this filter.'}
            </Text>
            <TouchableOpacity
              style={styles.discoverButton}
              onPress={() => navigation?.navigate('Explore')}
            >
              <Text style={styles.discoverButtonText}>Discover People &amp; Creators</Text>
            </TouchableOpacity>
          </View>
        ) : (
          posts.map((post) => (
            <View key={post.id} style={styles.postCard}>
              {/* Post Header */}
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
                    {post.authorHandle} • {post.time}
                  </Text>
                </View>
              </View>

              {/* Post Body */}
              <Text style={styles.postBody}>{post.body}</Text>

              {/* Action Strip */}
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.actionButton}>
                  <Text style={styles.actionIcon}>❤️</Text>
                  <Text style={styles.actionText}>{post.likes}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <Text style={styles.actionIcon}>💬</Text>
                  <Text style={styles.actionText}>{post.comments}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <Text style={styles.actionIcon}>🔁</Text>
                  <Text style={styles.actionText}>Share</Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },
  headerSubtitle: {
    color: TOKENS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  favoritesButton: {
    backgroundColor: 'rgba(255, 180, 0, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 180, 0, 0.3)',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  favoritesButtonText: {
    color: '#FFB400',
    fontSize: 11,
    fontWeight: '800',
  },
  filterBar: {
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: TOKENS.border,
  },
  filterScroll: {
    paddingHorizontal: 12,
    gap: 6,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: TOKENS.surface,
    borderWidth: 1,
    borderColor: TOKENS.border,
  },
  filterPillActive: {
    backgroundColor: TOKENS.action,
    borderColor: TOKENS.action,
  },
  filterIcon: {
    fontSize: 12,
    marginRight: 6,
  },
  filterText: {
    color: TOKENS.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  filterTextActive: {
    color: '#090D1A',
    fontWeight: '900',
  },
  feedScroll: {
    flex: 1,
  },
  feedContent: {
    padding: 12,
    paddingBottom: 40,
  },
  centerBox: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCard: {
    backgroundColor: TOKENS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: TOKENS.border,
    padding: 24,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 10,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptyText: {
    color: TOKENS.textMuted,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  discoverButton: {
    backgroundColor: TOKENS.action,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  discoverButtonText: {
    color: '#090D1A',
    fontSize: 12,
    fontWeight: '800',
  },
  postCard: {
    backgroundColor: TOKENS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: TOKENS.border,
    padding: 16,
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
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  actionIcon: {
    fontSize: 14,
  },
  actionText: {
    color: TOKENS.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
});
