import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  SafeAreaView,
  ViewToken,
  Image,
  Modal,
  TextInput,
  Share,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Video as ExpoVideo, ResizeMode } from 'expo-av';
import { Ionicons as ExpoIonicons } from '@expo/vector-icons';
import { TOKENS } from '../theme/tokens';
import { supabase } from '../lib/supabase';
import { resolveReelMediaUrl } from '../lib/mediaUpload';
export { resolveReelMediaUrl };

const Video = ExpoVideo as unknown as React.ComponentType<any>;
const Ionicons = ExpoIonicons as unknown as React.ComponentType<any>;

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

type ShortsFeedTab = 'for_you' | 'following';

interface ReelItem {
  id: string;
  creator_id: string;
  title: string;
  storage_path: string;
  duration_seconds?: number;
  thumbnail_path?: string;
  resolvedVideoUrl?: string | null;
  resolvedThumbnailUrl?: string | null;
  likes_count: number;
  comments_count: number;
  audio_track?: string;
  sound_id?: string;
  location_tag?: string;
  country_id?: string;
  created_at: string;
  profiles?: {
    id: string;
    username: string;
    full_name: string;
    avatar_url?: string;
  } | null;
  sounds?: {
    id: string;
    title: string;
    artist_name: string;
  } | null;
  isLiked?: boolean;
  isSaved?: boolean;
}

interface CommentItem {
  id: string;
  video_id: string;
  author_id: string;
  content: string;
  created_at: string;
  profiles?: {
    username?: string;
    full_name?: string;
    avatar_url?: string;
  } | null;
}

export function ReelsScreen({ navigation }: any = {}) {
  const [reels, setReels] = useState<ReelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<ShortsFeedTab>('for_you');
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState<string | null>(null);
  const videoRefs = useRef<Record<string, InstanceType<typeof ExpoVideo> | null>>({});

  // Comments modal state
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [activeReelId, setActiveReelId] = useState<string | null>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const fetchReels = async () => {
    try {
      const { data, error } = await supabase
        .from('videos')
        .select(`
          id,
          creator_id,
          title,
          storage_path,
          duration_seconds,
          thumbnail_path,
          likes_count,
          comments_count,
          audio_track,
          sound_id,
          location_tag,
          country_id,
          created_at,
          profiles:creator_id (
            id,
            username,
            full_name,
            avatar_url
          ),
          sounds:sound_id (
            id,
            title,
            artist_name
          )
        `)
        .eq('video_kind', 'reel')
        .order('created_at', { ascending: false })
        .limit(25);

      if (!error && data) {
        const mapped = (data as any[]).map((r) => ({
          ...r,
          resolvedVideoUrl: resolveReelMediaUrl(r.storage_path, 'videos'),
          resolvedThumbnailUrl: resolveReelMediaUrl(r.thumbnail_path, 'videos'),
        }));
        setReels(mapped as unknown as ReelItem[]);
        if (mapped.length > 0 && !currentlyPlayingId) {
          setCurrentlyPlayingId(mapped[0].id);
        }
      }
    } catch (err) {
      console.warn('Could not fetch reels', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReels();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReels();
  };

  const handleBack = () => {
    if (navigation?.canGoBack && !navigation.canGoBack()) {
      navigation?.navigate?.('Home');
      return;
    }
    navigation?.goBack?.();
  };

  const handleLike = async (reel: ReelItem) => {
    const isLiked = !reel.isLiked;
    const delta = isLiked ? 1 : -1;
    const newCount = Math.max(0, (reel.likes_count || 0) + delta);

    setReels((current) =>
      current.map((r) =>
        r.id === reel.id ? { ...r, isLiked, likes_count: newCount } : r
      )
    );

    try {
      await supabase
        .from('videos')
        .update({ likes_count: newCount })
        .eq('id', reel.id);
    } catch (error) {
      console.warn('Error updating reel like count:', error);
    }
  };

  const handleSave = (reelId: string) => {
    setReels((current) =>
      current.map((r) =>
        r.id === reelId ? { ...r, isSaved: !r.isSaved } : r
      )
    );
  };

  const handleShare = async (reel: ReelItem) => {
    try {
      await Share.share({
        title: reel.title || 'TUKUBI Shorts',
        message: `Watch this Caribbean Short on TUKUBI: https://tukubi.com/reels/${reel.id}`,
      });
    } catch (err) {
      console.warn('Error sharing reel:', err);
    }
  };

  const openComments = async (reelId: string) => {
    setActiveReelId(reelId);
    setCommentsVisible(true);
    setLoadingComments(true);
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id,
          video_id,
          author_id,
          content,
          created_at,
          profiles:author_id (
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('video_id', reelId)
        .order('created_at', { ascending: true })
        .limit(50);

      if (!error && data) {
        setComments(data as unknown as CommentItem[]);
      }
    } catch (err) {
      console.warn('Error fetching comments:', err);
    } finally {
      setLoadingComments(false);
    }
  };

  const submitComment = async () => {
    if (!newComment.trim() || !activeReelId) return;
    setSubmittingComment(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Authentication Required', 'Please sign in to comment.');
        return;
      }

      const { data, error } = await supabase
        .from('comments')
        .insert({
          video_id: activeReelId,
          author_id: user.id,
          content: newComment.trim(),
        })
        .select(`
          id,
          video_id,
          author_id,
          content,
          created_at,
          profiles:author_id (
            username,
            full_name,
            avatar_url
          )
        `)
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        setComments((prev) => [...prev, data as unknown as CommentItem]);
        setNewComment('');
        setReels((curr) =>
          curr.map((r) =>
            r.id === activeReelId
              ? { ...r, comments_count: (r.comments_count || 0) + 1 }
              : r
          )
        );
        await supabase
          .from('videos')
          .update({
            comments_count:
              (reels.find((r) => r.id === activeReelId)?.comments_count || 0) + 1,
          })
          .eq('id', activeReelId);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to post comment.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0) {
        const visibleId = viewableItems[0].item?.id;
        setCurrentlyPlayingId(visibleId ?? null);
      }
    },
    []
  );

  useEffect(() => {
    Object.entries(videoRefs.current).forEach(([id, ref]) => {
      if (!ref) return;
      if (id === currentlyPlayingId) {
        ref.playAsync().catch(() => {});
      } else {
        ref.pauseAsync().catch(() => {});
      }
    });
  }, [currentlyPlayingId]);

  const displayedReels =
    activeTab === 'following'
      ? reels.filter((r) => Boolean(r.profiles?.username))
      : reels;

  const renderTopOverlay = () => (
    <View style={styles.topOverlayBar} pointerEvents="box-none">
      <TouchableOpacity
        style={styles.topCircleBtn}
        onPress={handleBack}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Ionicons name="chevron-back" size={22} color={TOKENS.textPrimary} />
      </TouchableOpacity>

      <View style={styles.topTabsRow}>
        <TouchableOpacity
          style={styles.topTabBtn}
          onPress={() => setActiveTab('for_you')}
          activeOpacity={0.85}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'for_you' }}
        >
          <Text
            style={[
              styles.topTabText,
              activeTab === 'for_you' && styles.topTabTextActive,
            ]}
          >
            For You
          </Text>
          {activeTab === 'for_you' && <View style={styles.topTabIndicator} />}
        </TouchableOpacity>

        <View style={styles.topTabDivider} />

        <TouchableOpacity
          style={styles.topTabBtn}
          onPress={() => setActiveTab('following')}
          activeOpacity={0.85}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'following' }}
        >
          <Text
            style={[
              styles.topTabText,
              activeTab === 'following' && styles.topTabTextActive,
            ]}
          >
            Following
          </Text>
          {activeTab === 'following' && <View style={styles.topTabIndicator} />}
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.topCircleBtn}
        onPress={() => navigation?.navigate?.('Create')}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Create Short"
      >
        <Ionicons name="videocam-outline" size={21} color={TOKENS.textPrimary} />
      </TouchableOpacity>
    </View>
  );

  const renderReel = ({ item }: { item: ReelItem }) => {
    const creator = item.profiles;
    const sound = item.sounds;
    const creatorHandle = creator?.username
      ? `@${creator.username}`
      : '@caribbean_creator';
    const soundTitle = sound
      ? `${sound.title} • ${sound.artist_name}`
      : item.audio_track || 'Original Audio — TUKUBI';
    const videoUri = item.resolvedVideoUrl || resolveReelMediaUrl(item.storage_path, 'videos');

    return (
      <View style={styles.reelContainer}>
        {videoUri ? (
          <Video
            ref={(ref: InstanceType<typeof ExpoVideo> | null) => {
              videoRefs.current[item.id] = ref;
            }}
            source={{ uri: videoUri }}
            style={StyleSheet.absoluteFill}
            resizeMode={ResizeMode.COVER}
            isLooping
            shouldPlay={item.id === currentlyPlayingId}
            isMuted={false}
          />
        ) : (
          <View style={styles.videoPlaceholder}>
            <View style={styles.placeholderPlayRing}>
              <Ionicons name="play" size={32} color={TOKENS.teal} />
            </View>
          </View>
        )}

        {/* Top & Bottom Contrast Scrims */}
        <View style={styles.topScrim} pointerEvents="none" />
        <View style={styles.bottomScrim} pointerEvents="none" />

        {/* Content & Action Overlays */}
        <View style={styles.overlayContainer}>
          {/* Creator Info & Sound */}
          <View style={styles.bottomInfo}>
            <View style={styles.creatorHeader}>
              {creator?.avatar_url ? (
                <Image source={{ uri: creator.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <Text style={styles.avatarInitial}>
                    {(creator?.full_name || creator?.username || 'T')[0].toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.creatorTextWrap}>
                <Text style={styles.creatorName}>{creatorHandle}</Text>
                {item.location_tag ? (
                  <View style={styles.locationBadge}>
                    <Ionicons name="location-sharp" size={11} color={TOKENS.teal} />
                    <Text style={styles.locationText}>{item.location_tag}</Text>
                  </View>
                ) : null}
              </View>
            </View>

            <Text style={styles.description} numberOfLines={3}>
              {item.title || 'Island energy in motion'}
            </Text>

            <TouchableOpacity
              style={styles.soundRow}
              onPress={() =>
                navigation?.navigate?.('Sounds', { soundId: item.sound_id })
              }
              activeOpacity={0.85}
              accessibilityLabel={`Audio: ${soundTitle}`}
            >
              <View style={styles.soundIconBadge}>
                <Ionicons
                  name="musical-notes"
                  size={12}
                  color={TOKENS.actionText}
                />
              </View>
              <Text style={styles.soundName} numberOfLines={1}>
                {soundTitle}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={12}
                color={TOKENS.textSecondary}
              />
            </TouchableOpacity>
          </View>

          {/* Right Vertical Engagement Stack */}
          <View style={styles.rightRail}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleLike(item)}
              activeOpacity={0.8}
              accessibilityLabel={item.isLiked ? 'Unlike short' : 'Like short'}
            >
              <View
                style={[
                  styles.railIconCircle,
                  item.isLiked && styles.railIconCircleLiked,
                ]}
              >
                <Ionicons
                  name={item.isLiked ? 'heart' : 'heart-outline'}
                  size={26}
                  color={item.isLiked ? TOKENS.danger : TOKENS.textPrimary}
                />
              </View>
              <Text style={styles.actionText}>{item.likes_count || 0}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => openComments(item.id)}
              activeOpacity={0.8}
              accessibilityLabel="View comments"
            >
              <View style={styles.railIconCircle}>
                <Ionicons
                  name="chatbubble-ellipses"
                  size={24}
                  color={TOKENS.textPrimary}
                />
              </View>
              <Text style={styles.actionText}>{item.comments_count || 0}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleShare(item)}
              activeOpacity={0.8}
              accessibilityLabel="Share short"
            >
              <View style={styles.railIconCircle}>
                <Ionicons
                  name="arrow-redo"
                  size={24}
                  color={TOKENS.textPrimary}
                />
              </View>
              <Text style={styles.actionText}>Share</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleSave(item.id)}
              activeOpacity={0.8}
              accessibilityLabel="Save short"
            >
              <View
                style={[
                  styles.railIconCircle,
                  item.isSaved && styles.railIconCircleSaved,
                ]}
              >
                <Ionicons
                  name={item.isSaved ? 'bookmark' : 'bookmark-outline'}
                  size={22}
                  color={item.isSaved ? TOKENS.accent : TOKENS.textPrimary}
                />
              </View>
            </TouchableOpacity>

            {/* Sound Disc Shortcut */}
            <TouchableOpacity
              style={styles.soundDiscBtn}
              onPress={() =>
                navigation?.navigate?.('Sounds', { soundId: item.sound_id })
              }
              activeOpacity={0.85}
              accessibilityLabel="Open Sound"
            >
              <View style={styles.soundDiscInner}>
                <Ionicons name="musical-notes" size={16} color={TOKENS.teal} />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centerBox]}>
        {renderTopOverlay()}
        <ActivityIndicator size="large" color={TOKENS.teal} />
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {renderTopOverlay()}

      <FlatList
        data={displayedReels}
        keyExtractor={(item) => item.id}
        renderItem={renderReel}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={screenHeight}
        snapToAlignment="start"
        decelerationRate="fast"
        viewabilityConfig={{ itemVisiblePercentThreshold: 75 }}
        onViewableItemsChanged={handleViewableItemsChanged}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={TOKENS.teal}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="videocam-outline" size={38} color={TOKENS.teal} />
            </View>
            <Text style={styles.emptyTitle}>No Shorts Yet</Text>
            <Text style={styles.emptyText}>
              Share vibrant Caribbean stories, rhythms, and visual moments with the global community.
            </Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => navigation?.navigate?.('Create')}
              activeOpacity={0.85}
            >
              <Ionicons
                name="add"
                size={20}
                color={TOKENS.actionText}
                style={{ marginRight: 6 }}
              />
              <Text style={styles.createButtonText}>Create Short</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Midnight Reef Comments Bottom Sheet Modal */}
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
                  const author = item.profiles;
                  const handle = author?.username
                    ? `@${author.username}`
                    : 'Community Member';
                  return (
                    <View style={styles.commentRow}>
                      {author?.avatar_url ? (
                        <Image
                          source={{ uri: author.avatar_url }}
                          style={styles.commentAvatar}
                        />
                      ) : (
                        <View
                          style={[styles.commentAvatar, styles.avatarFallback]}
                        >
                          <Text style={styles.commentAvatarInitial}>
                            {(
                              author?.full_name ||
                              author?.username ||
                              'U'
                            )[0].toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <View style={styles.commentBody}>
                        <Text style={styles.commentAuthor}>{handle}</Text>
                        <Text style={styles.commentContent}>{item.content}</Text>
                      </View>
                    </View>
                  );
                }}
              />
            )}

            {/* Comment Input Bar */}
            <View style={styles.inputBar}>
              <TextInput
                style={styles.commentInput}
                placeholder="Add a comment..."
                placeholderTextColor={TOKENS.textDim}
                value={newComment}
                onChangeText={setNewComment}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (!newComment.trim() || submittingComment) &&
                    styles.sendButtonDisabled,
                ]}
                disabled={!newComment.trim() || submittingComment}
                onPress={submitComment}
                accessibilityLabel="Post comment"
              >
                {submittingComment ? (
                  <ActivityIndicator size="small" color={TOKENS.actionText} />
                ) : (
                  <Ionicons
                    name="arrow-up"
                    size={18}
                    color={TOKENS.actionText}
                  />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: TOKENS.canvas,
  },
  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  topOverlayBar: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : 24,
    left: 16,
    right: 16,
    zIndex: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(13, 22, 40, 0.72)',
    borderWidth: 1,
    borderColor: TOKENS.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(7, 13, 26, 0.58)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: TOKENS.border,
    gap: 12,
  },
  topTabBtn: {
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  topTabDivider: {
    width: 1,
    height: 12,
    backgroundColor: TOKENS.borderStrong,
  },
  topTabText: {
    color: TOKENS.textMuted,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  topTabTextActive: {
    color: TOKENS.textPrimary,
    fontWeight: '800',
  },
  topTabIndicator: {
    marginTop: 4,
    width: 22,
    height: 2,
    borderRadius: 1,
    backgroundColor: TOKENS.teal,
  },
  reelContainer: {
    height: screenHeight,
    width: screenWidth,
    backgroundColor: TOKENS.canvas,
    position: 'relative',
  },
  videoPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: TOKENS.oceanDepth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderPlayRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: TOKENS.tealSoft,
    borderWidth: 1,
    borderColor: TOKENS.borderActive,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: 'rgba(7, 13, 26, 0.34)',
  },
  bottomScrim: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 320,
    backgroundColor: 'rgba(7, 13, 26, 0.56)',
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingBottom: Platform.OS === 'ios' ? 48 : 32,
    paddingHorizontal: 16,
  },
  bottomInfo: {
    flex: 1,
    marginRight: 16,
    justifyContent: 'flex-end',
  },
  creatorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: TOKENS.teal,
    marginRight: 10,
  },
  avatarFallback: {
    backgroundColor: TOKENS.raised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: TOKENS.textPrimary,
    fontWeight: '800',
    fontSize: 15,
  },
  creatorTextWrap: {
    justifyContent: 'center',
  },
  creatorName: {
    color: TOKENS.textPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 3,
  },
  locationText: {
    color: TOKENS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  description: {
    color: TOKENS.textPrimary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  soundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(13, 22, 40, 0.82)',
    borderWidth: 1,
    borderColor: TOKENS.borderStrong,
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    gap: 7,
    maxWidth: '92%',
  },
  soundIconBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: TOKENS.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  soundName: {
    color: TOKENS.textPrimary,
    fontSize: 12,
    fontWeight: '600',
    flexShrink: 1,
  },
  rightRail: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 4,
  },
  actionButton: {
    alignItems: 'center',
    marginBottom: 16,
  },
  railIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(13, 22, 40, 0.68)',
    borderWidth: 1,
    borderColor: TOKENS.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  railIconCircleLiked: {
    borderColor: TOKENS.danger,
    backgroundColor: 'rgba(244, 63, 94, 0.16)',
  },
  railIconCircleSaved: {
    borderColor: TOKENS.accent,
    backgroundColor: TOKENS.amberSoft,
  },
  soundDiscBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: TOKENS.oceanDepth,
    borderWidth: 1.5,
    borderColor: TOKENS.borderActive,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  soundDiscInner: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: TOKENS.tealSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    color: TOKENS.textPrimary,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },
  emptyContainer: {
    height: screenHeight,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: TOKENS.tealSoft,
    borderWidth: 1,
    borderColor: TOKENS.borderActive,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  emptyTitle: {
    color: TOKENS.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },
  emptyText: {
    color: TOKENS.textMuted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: TOKENS.teal,
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: 999,
  },
  createButtonText: {
    color: TOKENS.actionText,
    fontWeight: '800',
    fontSize: 15,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: TOKENS.scrim,
    justifyContent: 'flex-end',
  },
  commentsSheet: {
    backgroundColor: TOKENS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: TOKENS.borderStrong,
    maxHeight: screenHeight * 0.68,
    minHeight: 360,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
  },
  sheetHandleWrap: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 2,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: TOKENS.borderStrong,
  },
  commentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: TOKENS.border,
  },
  commentsTitle: {
    color: TOKENS.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  closeCommentsBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: TOKENS.raised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentsLoading: {
    padding: 40,
    alignItems: 'center',
  },
  commentsList: {
    flex: 1,
    paddingHorizontal: 18,
  },
  emptyCommentsBox: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyCommentsText: {
    color: TOKENS.textMuted,
    fontSize: 14,
  },
  commentRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: TOKENS.border,
  },
  commentAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    marginRight: 10,
    borderWidth: 1,
    borderColor: TOKENS.border,
  },
  commentAvatarInitial: {
    color: TOKENS.textPrimary,
    fontWeight: '700',
    fontSize: 13,
  },
  commentBody: {
    flex: 1,
  },
  commentAuthor: {
    color: TOKENS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  commentContent: {
    color: TOKENS.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: TOKENS.border,
    gap: 10,
  },
  commentInput: {
    flex: 1,
    backgroundColor: TOKENS.raised,
    color: TOKENS.textPrimary,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 9,
    maxHeight: 80,
    fontSize: 14,
    borderWidth: 1,
    borderColor: TOKENS.border,
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: TOKENS.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: TOKENS.raised,
    opacity: 0.5,
  },
});
