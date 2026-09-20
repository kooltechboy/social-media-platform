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

export function ReelsScreen({ navigation }: any) {
  const [reels, setReels] = useState<ReelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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

  const handleLike = async (reel: ReelItem) => {
    const isLiked = !reel.isLiked;
    const delta = isLiked ? 1 : -1;
    const newCount = Math.max(0, (reel.likes_count || 0) + delta);

    // Optimistic UI update
    setReels(current =>
      current.map(r =>
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
    setReels(current =>
      current.map(r =>
        r.id === reelId ? { ...r, isSaved: !r.isSaved } : r
      )
    );
  };

  const handleShare = async (reel: ReelItem) => {
    try {
      await Share.share({
        title: reel.title || 'TUKUBI Caribbean Reel',
        message: `Watch this Caribbean reel on TUKUBI 🌴: https://tukubi.com/reels/${reel.id}`,
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
      const { data: { user } } = await supabase.auth.getUser();
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
        setComments(prev => [...prev, data as unknown as CommentItem]);
        setNewComment('');
        // Increment comments count on reel optimistically & in db
        setReels(curr =>
          curr.map(r =>
            r.id === activeReelId
              ? { ...r, comments_count: (r.comments_count || 0) + 1 }
              : r
          )
        );
        await supabase
          .from('videos')
          .update({ comments_count: (reels.find(r => r.id === activeReelId)?.comments_count || 0) + 1 })
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

  const renderReel = ({ item }: { item: ReelItem }) => {
    const creator = item.profiles;
    const sound = item.sounds;
    const creatorHandle = creator?.username ? `@${creator.username}` : '@caribbean_creator';
    const soundTitle = sound ? `${sound.title} • ${sound.artist_name}` : (item.audio_track || 'Original Audio — Caribbean');
    const videoUri = item.resolvedVideoUrl || resolveReelMediaUrl(item.storage_path, 'videos');

    return (
      <View style={styles.reelContainer}>
        {videoUri ? (
          <Video
            ref={(ref: InstanceType<typeof ExpoVideo> | null) => { videoRefs.current[item.id] = ref; }}
            source={{ uri: videoUri }}
            style={StyleSheet.absoluteFill}
            resizeMode={ResizeMode.COVER}
            isLooping
            shouldPlay={item.id === currentlyPlayingId}
            isMuted={false}
          />
        ) : (
          <View style={styles.videoPlaceholder}>
            <Ionicons name="play-circle" size={64} color="rgba(255,255,255,0.4)" />
          </View>
        )}

        {/* Semi-transparent scrim at bottom for text contrast */}
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
                    {(creator?.full_name || creator?.username || 'C')[0].toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.creatorTextWrap}>
                <Text style={styles.creatorName}>{creatorHandle}</Text>
                {item.location_tag ? (
                  <View style={styles.locationBadge}>
                    <Ionicons name="location-sharp" size={10} color={TOKENS.action} />
                    <Text style={styles.locationText}>{item.location_tag}</Text>
                  </View>
                ) : null}
              </View>
            </View>

            <Text style={styles.description} numberOfLines={3}>
              {item.title || 'Vibing in the Caribbean 🌴'}
            </Text>

            <TouchableOpacity
              style={styles.soundRow}
              onPress={() => navigation?.navigate('Sounds', { soundId: item.sound_id })}
              accessibilityLabel={`Audio: ${soundTitle}`}
            >
              <View style={styles.soundIconBadge}>
                <Ionicons name="musical-notes" size={12} color="#FFF" />
              </View>
              <Text style={styles.soundName} numberOfLines={1}>
                {soundTitle}
              </Text>
              <Ionicons name="chevron-forward" size={12} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          </View>

          {/* Right Rail Actions */}
          <View style={styles.rightRail}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleLike(item)}
              accessibilityLabel={item.isLiked ? 'Unlike reel' : 'Like reel'}
            >
              <Ionicons
                name={item.isLiked ? 'heart' : 'heart-outline'}
                size={32}
                color={item.isLiked ? '#FF3366' : TOKENS.textPrimary}
              />
              <Text style={styles.actionText}>{item.likes_count || 0}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => openComments(item.id)}
              accessibilityLabel="View comments"
            >
              <Ionicons name="chatbubble-outline" size={28} color={TOKENS.textPrimary} />
              <Text style={styles.actionText}>{item.comments_count || 0}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleShare(item)}
              accessibilityLabel="Share reel"
            >
              <Ionicons name="paper-plane-outline" size={26} color={TOKENS.textPrimary} />
              <Text style={styles.actionText}>Share</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleSave(item.id)}
              accessibilityLabel="Save reel"
            >
              <Ionicons
                name={item.isSaved ? 'bookmark' : 'bookmark-outline'}
                size={26}
                color={item.isSaved ? TOKENS.accent : TOKENS.textPrimary}
              />
            </TouchableOpacity>

            {/* Sound Stem Shortcut */}
            {item.sound_id ? (
              <TouchableOpacity
                style={[styles.actionButton, styles.soundStemBtn]}
                onPress={() => navigation?.navigate('Sounds', { soundId: item.sound_id })}
                accessibilityLabel="Open Sound"
              >
                <Ionicons name="disc" size={24} color={TOKENS.action} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centerBox]}>
        <ActivityIndicator size="large" color={TOKENS.action} />
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={reels}
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={TOKENS.action} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="videocam-outline" size={64} color={TOKENS.textMuted} style={{ marginBottom: 16 }} />
            <Text style={styles.emptyTitle}>No Reels Yet</Text>
            <Text style={styles.emptyText}>Be the first to share vibrant Caribbean moments, rhythms, and culture 🌴</Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => navigation?.navigate('Create')}
            >
              <Ionicons name="add-circle" size={20} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.createButtonText}>Create Reel</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Comments Bottom Sheet Modal */}
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
            <View style={styles.commentsHeader}>
              <Text style={styles.commentsTitle}>Comments</Text>
              <TouchableOpacity
                onPress={() => setCommentsVisible(false)}
                accessibilityLabel="Close comments"
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons name="close" size={24} color={TOKENS.textPrimary} />
              </TouchableOpacity>
            </View>

            {loadingComments ? (
              <View style={styles.commentsLoading}>
                <ActivityIndicator size="small" color={TOKENS.action} />
              </View>
            ) : (
              <FlatList
                data={comments}
                keyExtractor={(item) => item.id}
                style={styles.commentsList}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <View style={styles.emptyCommentsBox}>
                    <Text style={styles.emptyCommentsText}>No comments yet. Start the conversation!</Text>
                  </View>
                }
                renderItem={({ item }) => {
                  const author = item.profiles;
                  const handle = author?.username ? `@${author.username}` : 'Island Member';
                  return (
                    <View style={styles.commentRow}>
                      {author?.avatar_url ? (
                        <Image source={{ uri: author.avatar_url }} style={styles.commentAvatar} />
                      ) : (
                        <View style={[styles.commentAvatar, styles.avatarFallback]}>
                          <Text style={styles.commentAvatarInitial}>
                            {(author?.full_name || author?.username || 'U')[0].toUpperCase()}
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
                placeholderTextColor={TOKENS.textMuted}
                value={newComment}
                onChangeText={setNewComment}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (!newComment.trim() || submittingComment) && styles.sendButtonDisabled,
                ]}
                disabled={!newComment.trim() || submittingComment}
                onPress={submitComment}
                accessibilityLabel="Post comment"
              >
                {submittingComment ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Ionicons name="arrow-up" size={18} color="#FFF" />
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
    backgroundColor: '#000',
  },
  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  reelContainer: {
    height: screenHeight,
    width: screenWidth,
    backgroundColor: '#000',
    position: 'relative',
  },
  videoPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: TOKENS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomScrim: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 320,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingBottom: 95,
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
    marginBottom: 8,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: TOKENS.action,
    marginRight: 10,
  },
  avatarFallback: {
    backgroundColor: TOKENS.surface,
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
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 3,
  },
  locationText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    fontWeight: '600',
  },
  description: {
    color: '#FFF',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  soundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignSelf: 'flex-start',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 16,
    gap: 6,
    maxWidth: '90%',
  },
  soundIconBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: TOKENS.action,
    alignItems: 'center',
    justifyContent: 'center',
  },
  soundName: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
    flexShrink: 1,
  },
  rightRail: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 10,
  },
  actionButton: {
    alignItems: 'center',
    marginBottom: 20,
  },
  soundStemBtn: {
    marginTop: 4,
    padding: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  actionText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  emptyContainer: {
    height: screenHeight - 150,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
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
    backgroundColor: TOKENS.action,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 24,
  },
  createButtonText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 15,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  commentsSheet: {
    backgroundColor: TOKENS.canvas,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: screenHeight * 0.65,
    minHeight: 350,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
  },
  commentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: TOKENS.border,
  },
  commentsTitle: {
    color: TOKENS.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  commentsLoading: {
    padding: 40,
    alignItems: 'center',
  },
  commentsList: {
    flex: 1,
    paddingHorizontal: 16,
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
    color: TOKENS.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: TOKENS.border,
    gap: 8,
  },
  commentInput: {
    flex: 1,
    backgroundColor: TOKENS.surface,
    color: TOKENS.textPrimary,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 80,
    fontSize: 14,
    borderWidth: 1,
    borderColor: TOKENS.border,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: TOKENS.action,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: TOKENS.surface,
    opacity: 0.5,
  },
});
