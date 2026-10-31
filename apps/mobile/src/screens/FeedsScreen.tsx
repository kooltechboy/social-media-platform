import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  ActivityIndicator,
  Image,
  Share,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { TOKENS } from '../theme/tokens';
import { Ionicons } from '../components/Icon';
import {
  profileLabel,
  profileHandle,
  timeAgo,
  firstRelation,
  initialsOf,
} from '../lib/format';
import { supabase, getCurrentUserId, type MobilePost } from '../lib/supabase';

type FeedFilter = 'all' | 'following' | 'friends' | 'favorites' | 'communities' | 'caribbean';

const FILTERS: Array<{ id: FeedFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'following', label: 'Following' },
  { id: 'friends', label: 'Friends' },
  { id: 'favorites', label: 'Favorites' },
  { id: 'communities', label: 'Communities' },
  { id: 'caribbean', label: 'Caribbean' },
];

interface PostComment {
  id: string;
  content: string;
  created_at: string;
  profiles?: {
    display_name?: string;
    username?: string;
    avatar_url?: string;
  } | Array<{
    display_name?: string;
    username?: string;
    avatar_url?: string;
  }> | null;
}

export function FeedsScreen({ navigation }: any) {
  const [activeFilter, setActiveFilter] = useState<FeedFilter>('all');
  const [posts, setPosts] = useState<MobilePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  const [savedPosts, setSavedPosts] = useState<Record<string, boolean>>({});

  // Real Comments Bottom Sheet State
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [activeCommentPost, setActiveCommentPost] = useState<MobilePost | null>(null);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const fetchFeedPosts = useCallback(async () => {
    try {
      const currentUserId = await getCurrentUserId();

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
          const profile = firstRelation(item.profiles);
          const authorName = profileLabel(profile) || 'Member';
          const authorHandle = profileHandle(profile);

          return {
            id: item.id,
            author: authorName,
            authorHandle: authorHandle || undefined,
            authorAvatar: profile?.avatar_url || null,
            isVerified: Boolean(profile?.is_verified),
            location: item.location_name || '',
            time: timeAgo(item.created_at),
            body: item.content || '',
            likes: item.likes_count || 0,
            comments: item.comments_count || 0,
            mediaUrls: item.media_urls || [],
          };
        });
        setPosts(formatted);

        // Fetch user reactions and saved posts
        if (currentUserId && data.length > 0) {
          const postIds = data.map((p: any) => p.id);
          const [likesRes, savesRes] = await Promise.all([
            supabase
              .from('post_reactions')
              .select('post_id')
              .eq('user_id', currentUserId)
              .in('post_id', postIds),
            supabase
              .from('saved_posts')
              .select('post_id')
              .eq('profile_id', currentUserId)
              .in('post_id', postIds),
          ]);
          if (likesRes.data) {
            const lMap: Record<string, boolean> = {};
            likesRes.data.forEach((r: any) => {
              lMap[r.post_id] = true;
            });
            setLikedPosts(lMap);
          }
          if (savesRes.data) {
            const sMap: Record<string, boolean> = {};
            savesRes.data.forEach((s: any) => {
              sMap[s.post_id] = true;
            });
            setSavedPosts(sMap);
          }
        }
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
      const userId = await getCurrentUserId();
      if (userId) {
        if (!isCurrentlyLiked) {
          await supabase.from('post_reactions').insert({
            post_id: postId,
            user_id: userId,
            profile_id: userId,
            reaction_type: 'like',
          });
        } else {
          await supabase
            .from('post_reactions')
            .delete()
            .eq('post_id', postId)
            .eq('user_id', userId);
        }
      }
    } catch {
      // Non-blocking optimistic sync rollback
      setLikedPosts((prev) => ({ ...prev, [postId]: isCurrentlyLiked }));
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, likes: Math.max(0, isCurrentlyLiked ? p.likes + 1 : p.likes - 1) }
            : p
        )
      );
    }
  };

  const handleToggleSave = async (postId: string) => {
    const isCurrentlySaved = Boolean(savedPosts[postId]);
    setSavedPosts((prev) => ({ ...prev, [postId]: !isCurrentlySaved }));

    try {
      const userId = await getCurrentUserId();
      if (userId) {
        if (!isCurrentlySaved) {
          await supabase.from('saved_posts').insert({
            post_id: postId,
            profile_id: userId,
          });
        } else {
          await supabase
            .from('saved_posts')
            .delete()
            .eq('post_id', postId)
            .eq('profile_id', userId);
        }
      }
    } catch {
      setSavedPosts((prev) => ({ ...prev, [postId]: isCurrentlySaved }));
    }
  };

  const openComments = async (post: MobilePost) => {
    setActiveCommentPost(post);
    setCommentsVisible(true);
    setLoadingComments(true);
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id,
          content,
          created_at,
          profiles:author_id (
            display_name,
            username,
            avatar_url
          )
        `)
        .eq('post_id', post.id)
        .order('created_at', { ascending: true })
        .limit(50);
      if (data && !error) {
        setComments(data as unknown as PostComment[]);
      } else {
        setComments([]);
      }
    } catch {
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async () => {
    if (!commentInput.trim() || !activeCommentPost || submittingComment) return;
    const content = commentInput.trim();
    const userId = await getCurrentUserId();
    if (!userId) {
      Alert.alert('Sign In Required', 'Please sign in to join the discussion.');
      return;
    }

    setSubmittingComment(true);
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id: activeCommentPost.id,
          author_id: userId,
          content,
        })
        .select(`
          id,
          content,
          created_at,
          profiles:author_id (
            display_name,
            username,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;

      if (data) {
        setComments((prev) => [...prev, data as unknown as PostComment]);
        setCommentInput('');
        setPosts((prev) =>
          prev.map((p) =>
            p.id === activeCommentPost.id
              ? { ...p, comments: (p.comments || 0) + 1 }
              : p
          )
        );
      }
    } catch (err: any) {
      Alert.alert('Comment Failed', err.message || 'Could not post comment.');
    } finally {
      setSubmittingComment(false);
    }
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
                        {initialsOf(post.author)}
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
                      {post.authorHandle ? `${post.authorHandle} · ` : ''}{post.time}{post.location ? ` · ${post.location}` : ''}
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
                    onPress={() => openComments(post)}
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

      {/* Real Comments Bottom Sheet Modal */}
      <Modal
        visible={commentsVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setCommentsVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <View style={styles.commentsSheet}>
            <View style={styles.sheetHandleWrap}>
              <View style={styles.sheetHandle} />
            </View>

            <View style={styles.commentsHeader}>
              <Text style={styles.commentsTitle}>Comments</Text>
              <TouchableOpacity
                style={styles.closeCommentsBtn}
                onPress={() => setCommentsVisible(false)}
                accessibilityRole="button"
                accessibilityLabel="Close comments"
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons name="close" size={20} color={TOKENS.textPrimary} />
              </TouchableOpacity>
            </View>

            {loadingComments ? (
              <View style={styles.commentsLoading}>
                <ActivityIndicator size="small" color={TOKENS.teal} />
              </View>
            ) : (
              <FlatList
                data={comments}
                keyExtractor={(item) => item.id}
                style={styles.commentsList}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <View style={styles.emptyCommentsBox}>
                    <Ionicons
                      name="chatbubble-ellipses-outline"
                      size={28}
                      color={TOKENS.textDim}
                      style={{ marginBottom: 8 }}
                    />
                    <Text style={styles.emptyCommentsText}>
                      No comments yet. Start the conversation.
                    </Text>
                  </View>
                }
                renderItem={({ item }) => {
                  const author = firstRelation(item.profiles);
                  const authorName = profileLabel(author) || 'Member';
                  return (
                    <View style={styles.commentItem}>
                      {author?.avatar_url ? (
                        <Image
                          source={{ uri: author.avatar_url }}
                          style={styles.commentAvatar}
                        />
                      ) : (
                        <View style={[styles.commentAvatar, styles.commentAvatarFallback]}>
                          <Text style={styles.commentAvatarLetter}>
                            {initialsOf(authorName)}
                          </Text>
                        </View>
                      )}
                      <View style={styles.commentContentCol}>
                        <View style={styles.commentUserRow}>
                          <Text style={styles.commentUserName}>{authorName}</Text>
                          <Text style={styles.commentTime}>{timeAgo(item.created_at)}</Text>
                        </View>
                        <Text style={styles.commentBody}>{item.content}</Text>
                      </View>
                    </View>
                  );
                }}
              />
            )}

            {/* Comment Composer */}
            <View style={styles.commentInputRow}>
              <TextInput
                style={styles.commentInput}
                placeholder="Write a comment..."
                placeholderTextColor={TOKENS.textDim}
                value={commentInput}
                onChangeText={setCommentInput}
                maxLength={500}
                returnKeyType="send"
                onSubmitEditing={handleAddComment}
              />
              <TouchableOpacity
                style={[
                  styles.sendCommentBtn,
                  (!commentInput.trim() || submittingComment) && styles.sendCommentDisabled,
                ]}
                onPress={handleAddComment}
                disabled={!commentInput.trim() || submittingComment}
                accessibilityRole="button"
                accessibilityLabel="Send comment"
              >
                {submittingComment ? (
                  <ActivityIndicator size="small" color={TOKENS.actionText} />
                ) : (
                  <Ionicons name="send" size={16} color={TOKENS.actionText} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'flex-end',
  },
  commentsSheet: {
    backgroundColor: TOKENS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '75%',
    minHeight: '40%',
    paddingBottom: 24,
    borderTopWidth: 1,
    borderColor: TOKENS.border,
  },
  sheetHandleWrap: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  sheetHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: TOKENS.border,
  },
  commentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: TOKENS.border,
  },
  commentsTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: TOKENS.textPrimary,
  },
  closeCommentsBtn: {
    padding: 6,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentsLoading: {
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentsList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  emptyCommentsBox: {
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCommentsText: {
    color: TOKENS.textDim,
    fontSize: 13,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 14,
    alignItems: 'flex-start',
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
  },
  commentAvatarFallback: {
    backgroundColor: TOKENS.raised,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: TOKENS.border,
  },
  commentAvatarLetter: {
    color: TOKENS.teal,
    fontWeight: '700',
    fontSize: 12,
  },
  commentContentCol: {
    flex: 1,
    backgroundColor: TOKENS.raised,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: TOKENS.border,
  },
  commentUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  commentUserName: {
    fontSize: 12.5,
    fontWeight: '700',
    color: TOKENS.textPrimary,
  },
  commentTime: {
    fontSize: 10.5,
    color: TOKENS.textDim,
  },
  commentBody: {
    fontSize: 13,
    color: TOKENS.textSecondary,
    lineHeight: 18,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: TOKENS.border,
    gap: 8,
  },
  commentInput: {
    flex: 1,
    minHeight: 42,
    backgroundColor: TOKENS.raised,
    borderRadius: 21,
    paddingHorizontal: 14,
    color: TOKENS.textPrimary,
    fontSize: 13.5,
    borderWidth: 1,
    borderColor: TOKENS.border,
  },
  sendCommentBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: TOKENS.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendCommentDisabled: {
    opacity: 0.4,
  },
});
