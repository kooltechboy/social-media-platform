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
} from 'react-native';
import { Video as ExpoVideo, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Ionicons as ExpoIonicons } from '@expo/vector-icons';
import { TOKENS } from '../theme/tokens';
import { supabase } from '../lib/supabase';

// Type-cast to avoid expo-av/vector-icons JSX type incompatibilities with @types/react 18.3
// These packages export classes that predate the newer ComponentType constraint
const Video = ExpoVideo as unknown as React.ComponentType<any>;
const Ionicons = ExpoIonicons as unknown as React.ComponentType<any>;

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

export function ReelsScreen() {
  const [reels, setReels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReels = async () => {
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('video_kind', 'reel')
        .order('created_at', { ascending: false })
        .limit(20);

      if (data && !error) {
        setReels(data);
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

  const handleLike = async (reelId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      // Optimistic update
      setReels(current => 
        current.map(r => 
          r.id === reelId ? { ...r, likes_count: (r.likes_count || 0) + 1, isLiked: true } : r
        )
      );

      await supabase.from('post_reactions').insert({
        post_id: reelId,
        user_id: user.id,
        reaction_type: 'like'
      });
    } catch (error) {
      console.warn('Error liking reel', error);
    }
  };

  const videoRefs = useRef<Record<string, InstanceType<typeof ExpoVideo> | null>>({});
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState<string | null>(null);

  const handleViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0) {
        const visibleId = viewableItems[0].item?.id;
        setCurrentlyPlayingId(visibleId ?? null);
      }
    },
    []
  );

  // Play/pause based on which reel is in view
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

  const renderReel = ({ item }: { item: any }) => (
    <View style={styles.reelContainer}>
      {/* Video Player or Gradient Fallback */}
      {item.storage_path ? (
        <Video
          ref={(ref: InstanceType<typeof ExpoVideo> | null) => { videoRefs.current[item.id] = ref; }}
          source={{ uri: item.storage_path }}
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

      {/* Dark gradient overlay for legibility */}
      <View style={styles.gradientOverlay} pointerEvents="none" />

      {/* Overlays */}
      <View style={styles.overlayContainer}>
        {/* Creator Info — bottom left */}
        <View style={styles.bottomInfo}>
          <Text style={styles.creatorName}>@{item.creator_id || 'caribbean_creator'}</Text>
          <Text style={styles.description} numberOfLines={2}>
            {item.description || 'Vibing in the Caribbean 🌴'}
          </Text>
          <View style={styles.soundRow}>
            <Ionicons name="musical-notes" size={12} color={TOKENS.textPrimary} />
            <Text style={styles.soundName}> {item.audio_track || 'Original Audio — Caribbean'}</Text>
          </View>
        </View>

        {/* Right Rail Actions */}
        <View style={styles.rightRail}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleLike(item.id)}
            accessibilityLabel={item.isLiked ? 'Unlike reel' : 'Like reel'}
          >
            <Ionicons
              name={item.isLiked ? 'heart' : 'heart-outline'}
              size={32}
              color={item.isLiked ? '#FF3366' : TOKENS.textPrimary}
            />
            <Text style={styles.actionText}>{item.likes_count || 0}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} accessibilityLabel="Comments">
            <Ionicons name="chatbubble-outline" size={28} color={TOKENS.textPrimary} />
            <Text style={styles.actionText}>{item.comments_count || 0}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} accessibilityLabel="Share reel">
            <Ionicons name="arrow-redo-outline" size={28} color={TOKENS.textPrimary} />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} accessibilityLabel="Save reel">
            <Ionicons name="bookmark-outline" size={28} color={TOKENS.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );


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
        keyExtractor={(item) => item.id.toString()}
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
            <Text style={styles.emptyText}>No Reels yet! Be the first Caribbean creator 🌴</Text>
            <TouchableOpacity style={styles.createButton} onPress={() => {}}>
              <Text style={styles.createButtonText}>Create Reel</Text>
            </TouchableOpacity>
          </View>
        }
      />
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
  reelContainer: {
    height: screenHeight,
    width: screenWidth,
    backgroundColor: TOKENS.canvas,
    position: 'relative',
  },
  videoPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: TOKENS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    // Bottom-darkening effect rendered via JSX LinearGradient when expo-linear-gradient is added
    // For now: transparent so video shows through
    backgroundColor: 'transparent',
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingBottom: 100, // accommodate bottom tab
    paddingHorizontal: 16,
  },
  bottomInfo: {
    flex: 1,
    marginRight: 20,
    justifyContent: 'flex-end',
  },
  creatorName: {
    color: TOKENS.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
  },
  description: {
    color: TOKENS.textPrimary,
    fontSize: 14,
    marginBottom: 12,
  },
  soundName: {
    color: TOKENS.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  rightRail: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 20,
  },
  actionButton: {
    alignItems: 'center',
    marginBottom: 24,
  },
  soundRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    color: TOKENS.textPrimary,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  emptyContainer: {
    height: screenHeight - 150,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyText: {
    color: TOKENS.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
  },
  createButton: {
    backgroundColor: TOKENS.action,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  createButtonText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 16,
  }
});
