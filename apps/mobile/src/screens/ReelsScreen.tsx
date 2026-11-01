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
import { Ionicons } from '../components/Icon';
import { TOKENS } from '../theme/tokens';
import { supabase, getCurrentUserId } from '../lib/supabase';
import {
  firstRelation,
  formatCompactNumber,
  initialsOf,
  profileHandle,
  profileLabel,
  timeAgo,
} from '../lib/format';
import { resolveReelMediaUrl } from '../lib/mediaUpload';
export { resolveReelMediaUrl };

const Video = ExpoVideo as unknown as React.ComponentType<any>;

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

type ShortsFeedTab = 'for_you' | 'following';

interface ReelProfile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url?: string | null;
  is_verified?: boolean | null;
}

interface ReelSound {
  id: string;
  title: string;
  artist: string;
  artist_handle?: string | null;
}

interface ReelItem {
  id: string;
  creator_id: string;
  title: string;
  storage_path: string;
  duration_seconds?: number | null;
  thumbnail_path?: string | null;
  resolvedVideoUrl?: string | null;
  resolvedThumbnailUrl?: string | null;
  view_count: number;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  audio_track?: string | null;
  sound_id?: string | null;
  location_tag?: string | null;
  country_id?: string | null;
  created_at: string;
  profiles?: ReelProfile | null;
  sounds?: ReelSound | null;
  isLiked: boolean;
  isSaved: boolean;
}

interface CommentItem {
  id: string;
  video_id: string;
  author_id: string;
  content: string;
  created_at: string;
  profiles?: {
    id?: string;
    username?: string | null;
    display_name?: string | null;
    avatar_url?: string | null;
  } | null;
}

export function ReelsScreen({ navigation, route }: any = {}) {
  const [reels, setReels] = useState<ReelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ShortsFeedTab>('for_you');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [followedCreatorIds, setFollowedCreatorIds] = useState<Set<string>>(new Set());
  const [followPendingIds, setFollowPendingIds] = useState<Set<string>>(new Set());
  const [likePendingIds, setLikePendingIds] = useState<Set<string>>(new Set());
  const [savePendingIds, setSavePendingIds] = useState<Set<string>>(new Set());
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState<string | null>(null);

  const [filterSoundId, setFilterSoundId] = useState<string | null>(
    route?.params?.soundId ?? null
  );
  const [filterSoundTitle, setFilterSoundTitle] = useState<string | null>(
    route?.params?.soundTitle ?? null
  );

  const videoRefs = useRef<Record<string, InstanceType<typeof ExpoVideo> | null>>({});
  const viewedIdsRef = useRef<Set<string>>(new Set());
  const isMountedRef = useRef(true);

  // Comments modal state
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [activeReelId, setActiveReelId] = useState<string | null>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    if (route?.params?.soundId !== undefined) {
      setFilterSoundId(route.params.soundId || null);
      setFilterSoundTitle(route.params.soundTitle || null);
    }
  }, [route?.params?.soundId, route?.params?.soundTitle]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      Object.values(videoRefs.current).forEach((ref) => {
        if (ref) {
          ref.stopAsync().catch(() => {});
          ref.unloadAsync().catch(() => {});
        }
      });
      videoRefs.current = {};
    };
  }, []);

  const fetchReels = useCallback(async () => {
    try {
      setErrorMessage(null);
      const userId = await getCurrentUserId();
      if (!isMountedRef.current) return;
      setCurrentUserId(userId);

      let followingIds: string[] = [];
      if (userId) {
        const { data: followRows, error: followErr } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', userId);
        if (!followErr && followRows) {
          followingIds = followRows.map((row: any) => String(row.following_id));
        }
      }
      if (!isMountedRef.current) return;
      setFollowedCreatorIds(new Set(followingIds));

      if (activeTab === 'following' && (!userId || followingIds.length === 0)) {
        setReels([]);
        setCurrentlyPlayingId(null);
        return;
      }

      let query = supabase
        .from('videos')
        .select(`
          id,
          creator_id,
          title,
          storage_path,
          duration_seconds,
          thumbnail_path,
          view_count,
          likes_count,
          comments_count,
          shares_count,
          audio_track,
          sound_id,
          location_tag,
          country_id,
          created_at,
          profiles:creator_id (
            id,
            username,
            display_name,
            avatar_url,
            is_verified
          ),
          sounds:sound_id (
            id,
            title,
            artist,
            artist_handle
          )
        `)
        .in('video_kind', ['reel', 'short'])
        .eq('visibility', 'public')
        .eq('moderation_status', 'approved')
        .order('created_at', { ascending: false })
        .limit(25);

      if (activeTab === 'following') {
        query = query.in('creator_id', followingIds);
      }

      if (filterSoundId) {
        query = query.eq('sound_id', filterSoundId);
      }

      const { data, error } = await query;
      if (error) throw error;
      if (!isMountedRef.current) return;

      const rows = (data || []) as any[];
      const videoIds = rows.map((r) => String(r.id));

      let likedSet = new Set<string>();
      let savedSet = new Set<string>();

      if (userId && videoIds.length > 0) {
        const [likedRes, savedRes] = await Promise.all([
          supabase
            .from('video_views')
            .select('video_id')
            .eq('viewer_id', userId)
            .eq('completed', true)
            .in('video_id', videoIds),
          supabase
            .from('video_saves')
            .select('video_id')
            .eq('profile_id', userId)
            .in('video_id', videoIds),
        ]);

        if (!likedRes.error && likedRes.data) {
          likedSet = new Set(likedRes.data.map((r: any) => String(r.video_id)));
        }
        if (!savedRes.error && savedRes.data) {
          savedSet = new Set(savedRes.data.map((r: any) => String(r.video_id)));
        }
      }

      if (!isMountedRef.current) return;

      const mapped: ReelItem[] = rows.map((r) => {
        const prof = firstRelation<ReelProfile>(r.profiles);
        const snd = firstRelation<ReelSound>(r.sounds);
        return {
          id: String(r.id),
          creator_id: String(r.creator_id),
          title: r.title ?? '',
          storage_path: r.storage_path ?? '',
          duration_seconds: r.duration_seconds ?? null,
          thumbnail_path: r.thumbnail_path ?? null,
          resolvedVideoUrl: resolveReelMediaUrl(r.storage_path, 'videos'),
          resolvedThumbnailUrl: resolveReelMediaUrl(r.thumbnail_path, 'videos'),
          view_count: Number(r.view_count) || 0,
          likes_count: Number(r.likes_count) || 0,
          comments_count: Number(r.comments_count) || 0,
          shares_count: Number(r.shares_count) || 0,
          audio_track: r.audio_track ?? null,
          sound_id: r.sound_id ?? null,
          location_tag: r.location_tag ?? null,
          country_id: r.country_id ?? null,
          created_at: r.created_at,
          profiles: prof,
          sounds: snd,
          isLiked: likedSet.has(String(r.id)),
          isSaved: savedSet.has(String(r.id)),
        };
      });

      setReels(mapped);
      setCurrentlyPlayingId((prev) => {
        if (mapped.length === 0) return null;
        if (prev && mapped.some((item) => item.id === prev)) return prev;
        return mapped[0].id;
      });
    } catch (err: any) {
      if (isMountedRef.current) {
        setErrorMessage(err?.message || 'Could not load Shorts right now.');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [activeTab, filterSoundId]);

  useEffect(() => {
    setLoading(true);
    fetchReels();
  }, [fetchReels]);

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
    if (likePendingIds.has(reel.id)) return;
    const userId = currentUserId || (await getCurrentUserId());
    if (!userId) {
      Alert.alert('Sign In Required', 'Please sign in to like Shorts.');
      return;
    }
    setCurrentUserId(userId);

    const prevLiked = reel.isLiked;
    const prevCount = reel.likes_count;
    const nextLiked = !prevLiked;
    const delta = nextLiked ? 1 : -1;
    const nextCount = Math.max(0, prevCount + delta);

    setLikePendingIds((prev) => new Set(prev).add(reel.id));
    setReels((current) =>
      current.map((r) =>
        r.id === reel.id ? { ...r, isLiked: nextLiked, likes_count: nextCount } : r
      )
    );

    try {
      const { error: rpcError } = await supabase.rpc('increment_video_counter', {
        p_video_id: reel.id,
        p_column: 'likes_count',
        p_delta: delta,
      });
      if (rpcError) throw rpcError;

      // Persist per-viewer like marker in video_views
      const { data: existingView } = await supabase
        .from('video_views')
        .select('video_id')
        .eq('video_id', reel.id)
        .eq('viewer_id', userId)
        .maybeSingle();

      if (existingView) {
        await supabase
          .from('video_views')
          .update({ completed: nextLiked })
          .eq('video_id', reel.id)
          .eq('viewer_id', userId);
      } else if (nextLiked) {
        await supabase.from('video_views').insert({
          video_id: reel.id,
          viewer_id: userId,
          watched_seconds: 5,
          completed: true,
        });
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        setReels((current) =>
          current.map((r) =>
            r.id === reel.id ? { ...r, isLiked: prevLiked, likes_count: prevCount } : r
          )
        );
        Alert.alert('Like Failed', err?.message || 'Could not update like state.');
      }
    } finally {
      if (isMountedRef.current) {
        setLikePendingIds((prev) => {
          const next = new Set(prev);
          next.delete(reel.id);
          return next;
        });
      }
    }
  };

  const handleSave = async (reel: ReelItem) => {
    if (savePendingIds.has(reel.id)) return;
    const userId = currentUserId || (await getCurrentUserId());
    if (!userId) {
      Alert.alert('Sign In Required', 'Please sign in to save Shorts.');
      return;
    }
    setCurrentUserId(userId);

    const prevSaved = reel.isSaved;
    const nextSaved = !prevSaved;

    setSavePendingIds((prev) => new Set(prev).add(reel.id));
    setReels((current) =>
      current.map((r) => (r.id === reel.id ? { ...r, isSaved: nextSaved } : r))
    );

    try {
      if (nextSaved) {
        const { error } = await supabase
          .from('video_saves')
          .upsert(
            { profile_id: userId, video_id: reel.id },
            { onConflict: 'profile_id,video_id' }
          );
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('video_saves')
          .delete()
          .eq('profile_id', userId)
          .eq('video_id', reel.id);
        if (error) throw error;
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        setReels((current) =>
          current.map((r) => (r.id === reel.id ? { ...r, isSaved: prevSaved } : r))
        );
        Alert.alert('Save Failed', err?.message || 'Could not update saved state.');
      }
    } finally {
      if (isMountedRef.current) {
        setSavePendingIds((prev) => {
          const next = new Set(prev);
          next.delete(reel.id);
          return next;
        });
      }
    }
  };

  const handleToggleFollow = async (creatorId: string) => {
    if (!creatorId || followPendingIds.has(creatorId)) return;
    const userId = currentUserId || (await getCurrentUserId());
    if (!userId) {
      Alert.alert('Sign In Required', 'Please sign in to follow creators.');
      return;
    }
    if (userId === creatorId) return;
    setCurrentUserId(userId);

    const wasFollowing = followedCreatorIds.has(creatorId);
    const nextFollowing = !wasFollowing;

    setFollowPendingIds((prev) => new Set(prev).add(creatorId));
    setFollowedCreatorIds((prev) => {
      const next = new Set(prev);
      if (nextFollowing) next.add(creatorId);
      else next.delete(creatorId);
      return next;
    });

    try {
      if (nextFollowing) {
        const { error } = await supabase.from('follows').insert({
          follower_id: userId,
          following_id: creatorId,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', userId)
          .eq('following_id', creatorId);
        if (error) throw error;
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        setFollowedCreatorIds((prev) => {
          const rollback = new Set(prev);
          if (wasFollowing) rollback.add(creatorId);
          else rollback.delete(creatorId);
          return rollback;
        });
        Alert.alert('Follow Failed', err?.message || 'Could not update follow status.');
      }
    } finally {
      if (isMountedRef.current) {
        setFollowPendingIds((prev) => {
          const next = new Set(prev);
          next.delete(creatorId);
          return next;
        });
      }
    }
  };

  const handleShare = async (reel: ReelItem) => {
    try {
      const result = await Share.share({
        title: reel.title || 'TUKUBI Shorts',
        message: `Watch on TUKUBI: https://tukubi.com/shorts?id=${reel.id}`,
      });
      if (result.action === Share.sharedAction) {
        setReels((current) =>
          current.map((r) =>
            r.id === reel.id ? { ...r, shares_count: (r.shares_count || 0) + 1 } : r
          )
        );
        await supabase.rpc('increment_video_counter', {
          p_video_id: reel.id,
          p_column: 'shares_count',
          p_delta: 1,
        });
        const userId = currentUserId || (await getCurrentUserId());
        if (userId) {
          await supabase.from('video_shares').insert({
            video_id: reel.id,
            shared_by_profile_id: userId,
            share_channel: 'native_share',
          });
        }
      }
    } catch {
      // User cancelled or share sheet failed
    }
  };

  const loadComments = useCallback(async (reelId: string) => {
    setLoadingComments(true);
    setCommentsError(null);
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
            id,
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('video_id', reelId)
        .order('created_at', { ascending: true })
        .limit(50);

      if (error) throw error;
      if (!isMountedRef.current) return;

      const mapped: CommentItem[] = (data || []).map((c: any) => ({
        id: String(c.id),
        video_id: String(c.video_id),
        author_id: String(c.author_id),
        content: c.content,
        created_at: c.created_at,
        profiles: firstRelation(c.profiles),
      }));
      setComments(mapped);
    } catch (err: any) {
      if (isMountedRef.current) {
        setCommentsError(err?.message || 'Could not load comments.');
      }
    } finally {
      if (isMountedRef.current) {
        setLoadingComments(false);
      }
    }
  }, []);

  const openComments = (reelId: string) => {
    setActiveReelId(reelId);
    setComments([]);
    setCommentsVisible(true);
    loadComments(reelId);
  };

  const submitComment = async () => {
    const trimmed = newComment.trim();
    if (!trimmed || !activeReelId || submittingComment) return;
    setSubmittingComment(true);

    try {
      const userId = currentUserId || (await getCurrentUserId());
      if (!userId) {
        Alert.alert('Sign In Required', 'Please sign in to comment.');
        return;
      }
      setCurrentUserId(userId);

      const { data, error } = await supabase
        .from('comments')
        .insert({
          video_id: activeReelId,
          author_id: userId,
          content: trimmed,
        })
        .select(`
          id,
          video_id,
          author_id,
          content,
          created_at,
          profiles:author_id (
            id,
            username,
            display_name,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;

      if (data && isMountedRef.current) {
        const createdComment: CommentItem = {
          id: String((data as any).id),
          video_id: String((data as any).video_id),
          author_id: String((data as any).author_id),
          content: (data as any).content,
          created_at: (data as any).created_at,
          profiles: firstRelation((data as any).profiles),
        };
        setComments((prev) => [...prev, createdComment]);
        setNewComment('');
        setReels((curr) =>
          curr.map((r) =>
            r.id === activeReelId
              ? { ...r, comments_count: (r.comments_count || 0) + 1 }
              : r
          )
        );
        await supabase.rpc('increment_video_counter', {
          p_video_id: activeReelId,
          p_column: 'comments_count',
          p_delta: 1,
        });
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to post comment.');
    } finally {
      if (isMountedRef.current) {
        setSubmittingComment(false);
      }
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
    const activeIds = new Set(reels.map((r) => r.id));
    Object.entries(videoRefs.current).forEach(([id, ref]) => {
      if (!ref) return;
      if (!activeIds.has(id)) {
        ref.stopAsync().catch(() => {});
        ref.unloadAsync().catch(() => {});
        delete videoRefs.current[id];
        return;
      }
      if (id === currentlyPlayingId) {
        ref.playAsync().catch(() => {});
      } else {
        ref.pauseAsync().catch(() => {});
      }
    });

    if (currentlyPlayingId && !viewedIdsRef.current.has(currentlyPlayingId)) {
      viewedIdsRef.current.add(currentlyPlayingId);
      setReels((curr) =>
        curr.map((r) =>
          r.id === currentlyPlayingId
            ? { ...r, view_count: (r.view_count || 0) + 1 }
            : r
        )
      );
      supabase
        .rpc('increment_video_counter', {
          p_video_id: currentlyPlayingId,
          p_column: 'view_count',
          p_delta: 1,
        })
        .then(() => {}, () => {});
    }
  }, [currentlyPlayingId, reels]);

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
          accessibilityLabel="For You feed"
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
          accessibilityLabel="Following feed"
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

  const renderSoundFilterBanner = () => {
    if (!filterSoundId) return null;
    return (
      <View style={styles.soundFilterBanner}>
        <Ionicons name="musical-notes" size={14} color={TOKENS.teal} />
        <Text style={styles.soundFilterText} numberOfLines={1}>
          {filterSoundTitle ? `Sound: ${filterSoundTitle}` : 'Filtered by Sound'}
        </Text>
        <TouchableOpacity
          style={styles.clearFilterBtn}
          onPress={() => {
            setFilterSoundId(null);
            setFilterSoundTitle(null);
          }}
          accessibilityRole="button"
          accessibilityLabel="Clear sound filter"
        >
          <Ionicons name="close-circle" size={18} color={TOKENS.textPrimary} />
        </TouchableOpacity>
      </View>
    );
  };

  const renderReel = ({ item }: { item: ReelItem }) => {
    const creator = item.profiles;
    const sound = item.sounds;
    const creatorName = profileLabel(creator) || 'Unknown user';
    const creatorHandleText = profileHandle(creator);
    const initials = initialsOf(creatorName) || '?';
    const soundTitle = sound
      ? `${sound.title}${sound.artist ? ` • ${sound.artist}` : ''}`
      : item.audio_track || null;
    const videoUri = item.resolvedVideoUrl || resolveReelMediaUrl(item.storage_path, 'videos');
    const isFollowingCreator = followedCreatorIds.has(item.creator_id);
    const showFollowBtn = Boolean(
      item.creator_id && item.creator_id !== currentUserId
    );

    return (
      <View style={styles.reelContainer}>
        {videoUri ? (
          <Video
            ref={(ref: InstanceType<typeof ExpoVideo> | null) => {
              if (ref) {
                videoRefs.current[item.id] = ref;
              } else {
                delete videoRefs.current[item.id];
              }
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
              <Ionicons name="videocam-off-outline" size={30} color={TOKENS.teal} />
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
                  <Text style={styles.avatarInitial}>{initials}</Text>
                </View>
              )}
              <View style={styles.creatorTextWrap}>
                <View style={styles.creatorNameRow}>
                  <Text style={styles.creatorName} numberOfLines={1}>
                    {creatorHandleText || creatorName}
                  </Text>
                  {creator?.is_verified ? (
                    <Ionicons
                      name="checkmark-circle"
                      size={14}
                      color={TOKENS.teal}
                    />
                  ) : null}
                </View>
                {item.location_tag ? (
                  <View style={styles.locationBadge}>
                    <Ionicons name="location-sharp" size={11} color={TOKENS.teal} />
                    <Text style={styles.locationText}>{item.location_tag}</Text>
                  </View>
                ) : null}
              </View>

              {showFollowBtn && (
                <TouchableOpacity
                  style={[
                    styles.followPill,
                    isFollowingCreator && styles.followPillActive,
                  ]}
                  onPress={() => handleToggleFollow(item.creator_id)}
                  disabled={followPendingIds.has(item.creator_id)}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel={
                    isFollowingCreator
                      ? `Unfollow ${creatorName}`
                      : `Follow ${creatorName}`
                  }
                >
                  <Text
                    style={[
                      styles.followPillText,
                      isFollowingCreator && styles.followPillTextActive,
                    ]}
                  >
                    {isFollowingCreator ? 'Following' : 'Follow'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {item.title ? (
              <Text style={styles.description} numberOfLines={3}>
                {item.title}
              </Text>
            ) : null}

            <View style={styles.metaStatsRow}>
              <Ionicons name="eye-outline" size={13} color={TOKENS.textMuted} />
              <Text style={styles.metaStatsText}>
                {formatCompactNumber(item.view_count)} views
              </Text>
              {item.created_at ? (
                <Text style={styles.metaStatsText}>• {timeAgo(item.created_at)}</Text>
              ) : null}
            </View>

            {soundTitle ? (
              <TouchableOpacity
                style={styles.soundRow}
                onPress={() =>
                  navigation?.navigate?.('Sounds', {
                    soundId: item.sound_id || undefined,
                  })
                }
                activeOpacity={0.85}
                accessibilityRole="button"
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
            ) : null}
          </View>

          {/* Right Vertical Engagement Stack */}
          <View style={styles.rightRail}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleLike(item)}
              activeOpacity={0.8}
              accessibilityRole="button"
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
              <Text style={styles.actionText}>
                {formatCompactNumber(item.likes_count)}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => openComments(item.id)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="View comments"
            >
              <View style={styles.railIconCircle}>
                <Ionicons
                  name="chatbubble-ellipses"
                  size={24}
                  color={TOKENS.textPrimary}
                />
              </View>
              <Text style={styles.actionText}>
                {formatCompactNumber(item.comments_count)}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleShare(item)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Share short"
            >
              <View style={styles.railIconCircle}>
                <Ionicons
                  name="arrow-redo"
                  size={24}
                  color={TOKENS.textPrimary}
                />
              </View>
              <Text style={styles.actionText}>
                {item.shares_count > 0
                  ? formatCompactNumber(item.shares_count)
                  : 'Share'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleSave(item)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={item.isSaved ? 'Unsave short' : 'Save short'}
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
            {item.sound_id ? (
              <TouchableOpacity
                style={styles.soundDiscBtn}
                onPress={() =>
                  navigation?.navigate?.('Sounds', { soundId: item.sound_id })
                }
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Open Sound"
              >
                <View style={styles.soundDiscInner}>
                  <Ionicons name="musical-notes" size={16} color={TOKENS.teal} />
                </View>
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
        {renderTopOverlay()}
        {renderSoundFilterBanner()}
        <ActivityIndicator size="large" color={TOKENS.teal} />
      </SafeAreaView>
    );
  }

  if (errorMessage) {
    return (
      <SafeAreaView style={[styles.container, styles.centerBox]}>
        {renderTopOverlay()}
        {renderSoundFilterBanner()}
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="alert-circle-outline" size={38} color={TOKENS.danger} />
          </View>
          <Text style={styles.emptyTitle}>Could not load Shorts</Text>
          <Text style={styles.emptyText}>{errorMessage}</Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => {
              setLoading(true);
              fetchReels();
            }}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Retry loading Shorts"
          >
            <Ionicons
              name="refresh"
              size={18}
              color={TOKENS.actionText}
              style={{ marginRight: 6 }}
            />
            <Text style={styles.createButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {renderTopOverlay()}
      {renderSoundFilterBanner()}

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
            <Text style={styles.emptyTitle}>
              {activeTab === 'following'
                ? !currentUserId
                  ? 'Sign In to See Following'
                  : followedCreatorIds.size === 0
                  ? 'Not Following Anyone Yet'
                  : 'No Shorts From Followed Creators'
                : 'No Shorts Yet'}
            </Text>
            <Text style={styles.emptyText}>
              {activeTab === 'following'
                ? !currentUserId
                  ? 'Sign in to watch Shorts published by creators you follow.'
                  : followedCreatorIds.size === 0
                  ? 'Follow creators on TUKUBI to see their latest Shorts here.'
                  : 'Creators you follow have not published any public Shorts yet.'
                : 'Share vibrant Caribbean stories, rhythms, and visual moments with the global community.'}
            </Text>
            {activeTab === 'following' ? (
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => setActiveTab('for_you')}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Explore For You feed"
              >
                <Text style={styles.createButtonText}>Explore For You</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => navigation?.navigate?.('Create')}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Create Short"
              >
                <Ionicons
                  name="add"
                  size={20}
                  color={TOKENS.actionText}
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.createButtonText}>Create Short</Text>
              </TouchableOpacity>
            )}
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
            ) : commentsError ? (
              <View style={styles.emptyCommentsBox}>
                <Ionicons
                  name="alert-circle-outline"
                  size={28}
                  color={TOKENS.danger}
                  style={{ marginBottom: 8 }}
                />
                <Text style={styles.emptyCommentsText}>{commentsError}</Text>
                {activeReelId ? (
                  <TouchableOpacity
                    style={styles.retryCommentsBtn}
                    onPress={() => loadComments(activeReelId)}
                    accessibilityRole="button"
                    accessibilityLabel="Retry loading comments"
                  >
                    <Text style={styles.retryCommentsText}>Retry</Text>
                  </TouchableOpacity>
                ) : null}
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
                  const label =
                    profileLabel(author) ||
                    profileHandle(author) ||
                    'Unknown user';
                  const handle = profileHandle(author);
                  const initial = initialsOf(label) || '?';
                  const relativeTime = timeAgo(item.created_at);

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
                            {initial}
                          </Text>
                        </View>
                      )}
                      <View style={styles.commentBody}>
                        <View style={styles.commentMetaRow}>
                          <Text style={styles.commentAuthor}>{label}</Text>
                          {handle && handle !== label ? (
                            <Text style={styles.commentHandle}>{handle}</Text>
                          ) : null}
                          {relativeTime ? (
                            <Text style={styles.commentTime}>
                              • {relativeTime}
                            </Text>
                          ) : null}
                        </View>
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
                accessibilityRole="button"
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
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: TOKENS.scrim,
    borderWidth: 1,
    borderColor: TOKENS.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: TOKENS.scrim,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: TOKENS.border,
    gap: 12,
    minHeight: 44,
  },
  topTabBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    minHeight: 36,
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
  soundFilterBanner: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 106 : 76,
    left: 16,
    right: 16,
    zIndex: 25,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: TOKENS.scrim,
    borderWidth: 1,
    borderColor: TOKENS.borderActive,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  soundFilterText: {
    flex: 1,
    color: TOKENS.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  clearFilterBtn: {
    minWidth: 32,
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: TOKENS.scrim,
    opacity: 0.45,
  },
  bottomScrim: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 320,
    backgroundColor: TOKENS.scrim,
    opacity: 0.72,
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
    flexShrink: 1,
    justifyContent: 'center',
    marginRight: 10,
  },
  creatorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  creatorName: {
    color: TOKENS.textPrimary,
    fontSize: 15,
    fontWeight: '800',
    flexShrink: 1,
  },
  followPill: {
    backgroundColor: TOKENS.teal,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  followPillActive: {
    backgroundColor: TOKENS.scrim,
    borderWidth: 1,
    borderColor: TOKENS.borderStrong,
  },
  followPillText: {
    color: TOKENS.actionText,
    fontSize: 11,
    fontWeight: '800',
  },
  followPillTextActive: {
    color: TOKENS.textPrimary,
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
    marginBottom: 8,
  },
  metaStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 10,
  },
  metaStatsText: {
    color: TOKENS.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  soundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: TOKENS.scrim,
    borderWidth: 1,
    borderColor: TOKENS.borderStrong,
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    gap: 7,
    maxWidth: '92%',
    minHeight: 36,
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
    minWidth: 44,
    minHeight: 44,
  },
  railIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: TOKENS.scrim,
    borderWidth: 1,
    borderColor: TOKENS.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  railIconCircleLiked: {
    borderColor: TOKENS.danger,
    backgroundColor: TOKENS.surfaceInteractive,
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
    textAlign: 'center',
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
    minHeight: 44,
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
    width: 36,
    height: 36,
    borderRadius: 18,
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
    textAlign: 'center',
  },
  retryCommentsBtn: {
    marginTop: 12,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: TOKENS.teal,
    minHeight: 36,
    justifyContent: 'center',
  },
  retryCommentsText: {
    color: TOKENS.actionText,
    fontSize: 13,
    fontWeight: '800',
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
  commentMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  commentAuthor: {
    color: TOKENS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  commentHandle: {
    color: TOKENS.textMuted,
    fontSize: 12,
  },
  commentTime: {
    color: TOKENS.textDim,
    fontSize: 11,
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
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: TOKENS.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: TOKENS.raised,
    opacity: 0.5,
  },
});
