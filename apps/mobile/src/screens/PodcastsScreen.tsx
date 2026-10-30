import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
  Image,
  Alert,
} from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons as ExpoIonicons } from '@expo/vector-icons';
import { TOKENS } from '../theme/tokens';
import { supabase } from '../lib/supabase';

const Ionicons = ExpoIonicons as unknown as React.ComponentType<any>;

interface EpisodeItem {
  id: string;
  title: string;
  durationFormatted: string;
  audioUrl?: string | null;
  videoUrl?: string | null;
  hasVideo?: boolean;
  showNotes?: string | null;
  seasonNumber?: number;
  episodeNumber?: number;
  episodeType?: string;
}

interface PodcastShow {
  id: string;
  title: string;
  description: string;
  author: string;
  category: string;
  countryIso: string;
  coverUrl?: string | null;
  followerCount: number;
  episodes: EpisodeItem[];
}

const PODCAST_CATEGORIES = [
  'All Shows',
  'Culture & History',
  'Music & Sound Systems',
  'Business & Tech',
  'Food & Culinary',
  'Diaspora Life',
  'News & Politics',
  'Comedy & Storytelling',
  'Sports & Cricket',
];

const TERRITORIES = [
  { iso: 'ALL', name: 'All Islands' },
  { iso: 'TTO', name: 'Trinidad & Tobago' },
  { iso: 'JAM', name: 'Jamaica' },
  { iso: 'BRB', name: 'Barbados' },
  { iso: 'GUY', name: 'Guyana' },
  { iso: 'HTI', name: 'Haiti' },
  { iso: 'BHS', name: 'Bahamas' },
  { iso: 'DMA', name: 'Dominica' },
  { iso: 'LCA', name: 'Saint Lucia' },
  { iso: 'GRD', name: 'Grenada' },
  { iso: 'ATG', name: 'Antigua & Barbuda' },
  { iso: 'PRI', name: 'Puerto Rico' },
  { iso: 'CUB', name: 'Cuba' },
];

export function PodcastsScreen() {
  const [podcasts, setPodcasts] = useState<PodcastShow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All Shows');
  const [activeTerritory, setActiveTerritory] = useState('ALL');

  // Player state
  const [playingEpisodeId, setPlayingEpisodeId] = useState<string | null>(null);
  const [playingTitle, setPlayingTitle] = useState<string>('');
  const [playingHasVideo, setPlayingHasVideo] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const soundRef = useRef<Audio.Sound | null>(null);

  const fetchPodcasts = async () => {
    try {
      let query = supabase
        .from('podcasts')
        .select(`
          id, title, description, category, country_iso, cover_path, follower_count,
          profiles:creator_id (display_name, username),
          podcast_episodes (
            id, title, duration_seconds, audio_path, video_path, has_video,
            show_notes, season_number, episode_number, episode_type
          )
        `)
        .order('follower_count', { ascending: false })
        .limit(20);

      if (activeCategory !== 'All Shows') {
        query = query.eq('category', activeCategory);
      }
      if (activeTerritory !== 'ALL') {
        query = query.eq('country_iso', activeTerritory);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        const mapped: PodcastShow[] = data.map((d: any) => {
          const eps = (d.podcast_episodes || []).map((ep: any) => {
            let resolvedUrl = '';
            if (ep.audio_path) {
              if (ep.audio_path.startsWith('http')) {
                resolvedUrl = ep.audio_path;
              } else {
                resolvedUrl = supabase.storage
                  .from('podcast-audio')
                  .getPublicUrl(ep.audio_path).data.publicUrl;
              }
            }
            let resolvedVideo = '';
            if (ep.video_path) {
              if (ep.video_path.startsWith('http')) {
                resolvedVideo = ep.video_path;
              } else {
                resolvedVideo = supabase.storage
                  .from('podcast-video')
                  .getPublicUrl(ep.video_path).data.publicUrl;
              }
            }
            return {
              id: ep.id,
              title: ep.title,
              durationFormatted: `${Math.floor((ep.duration_seconds || 1800) / 60)} mins`,
              audioUrl: resolvedUrl,
              videoUrl: resolvedVideo || null,
              hasVideo: Boolean(ep.has_video || resolvedVideo),
              showNotes: ep.show_notes,
              seasonNumber: ep.season_number,
              episodeNumber: ep.episode_number,
              episodeType: ep.episode_type,
            };
          });

          return {
            id: d.id,
            title: d.title,
            description:
              d.description ||
              'Caribbean audio documentary and cultural talk.',
            author:
              d.profiles?.display_name ||
              d.profiles?.username ||
              'Caribbean Host',
            category: d.category || 'Culture & History',
            countryIso: d.country_iso || 'CAR',
            coverUrl: d.cover_path,
            followerCount: d.follower_count || 0,
            episodes: eps,
          };
        });
        setPodcasts(mapped);
      } else {
        setPodcasts([]);
      }
    } catch (err) {
      console.warn('Could not fetch podcasts:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPodcasts();
  }, [activeCategory, activeTerritory]);

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
      }
    };
  }, []);

  const handleTogglePlay = async (ep: EpisodeItem, showTitle: string) => {
    try {
      if (playingEpisodeId === ep.id && isPlaying) {
        if (soundRef.current) {
          await soundRef.current.pauseAsync();
        }
        setIsPlaying(false);
        return;
      }

      if (playingEpisodeId === ep.id && !isPlaying) {
        if (soundRef.current) {
          await soundRef.current.playAsync();
        }
        setIsPlaying(true);
        return;
      }

      // Switching episode
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      setPlayingEpisodeId(ep.id);
      setPlayingTitle(`${showTitle} • ${ep.title}`);
      setPlayingHasVideo(Boolean(ep.hasVideo));
      setIsPlaying(true);

      if (!ep.audioUrl && !ep.videoUrl) {
        Alert.alert(
          'Media Unavailable',
          'This episode does not have an audio or video track attached yet.'
        );
        setIsPlaying(false);
        return;
      }

      const mediaUri = ep.audioUrl || ep.videoUrl!;
      const { sound } = await Audio.Sound.createAsync(
        { uri: mediaUri },
        { shouldPlay: true, rate: playbackRate, shouldCorrectPitch: true }
      );
      soundRef.current = sound;

      // Persist progress to DB if authenticated
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('podcast_progress').upsert({
            user_id: user.id,
            episode_id: ep.id,
            current_position_seconds: 1,
            completed: false,
            updated_at: new Date().toISOString(),
          });
        }
      } catch {
        // Non-blocking
      }
    } catch (err) {
      console.warn('Podcast audio error:', err);
      setIsPlaying(false);
    }
  };

  const handleCycleRate = async () => {
    const rates = [1.0, 1.25, 1.5, 2.0];
    const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
    const nextRate = rates[nextIdx];
    setPlaybackRate(nextRate);
    if (soundRef.current) {
      await soundRef.current.setRateAsync(nextRate, true);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Executive Midnight Reef Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={styles.headerIconBadge}>
              <Ionicons
                name="headset-outline"
                size={20}
                color={TOKENS.purple}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Caribbean Podcast Network</Text>
              <Text style={styles.headerSubtitle}>
                Voices, history, sound system culture, and authentic island discussions.
              </Text>
            </View>
          </View>
        </View>

        {/* Categories Rail */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.rail}
          contentContainerStyle={styles.railContent}
        >
          {PODCAST_CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.chip, isActive && styles.chipActivePurple]}
                onPress={() => setActiveCategory(cat)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.chipText,
                    isActive && styles.chipTextActivePurple,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Territory Rail */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.rail}
          contentContainerStyle={styles.railContent}
        >
          {TERRITORIES.map((t) => {
            const isActive = activeTerritory === t.iso;
            return (
              <TouchableOpacity
                key={t.iso}
                style={[styles.chip, isActive && styles.chipActiveTeal]}
                onPress={() => setActiveTerritory(t.iso)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.chipText,
                    isActive && styles.chipTextActiveTeal,
                  ]}
                >
                  {t.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Shows Feed */}
        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={TOKENS.teal} />
          </View>
        ) : (
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  fetchPodcasts();
                }}
                tintColor={TOKENS.teal}
              />
            }
          >
            {podcasts.length === 0 ? (
              <View style={styles.emptyCard}>
                <View style={styles.emptyIconCircle}>
                  <Ionicons
                    name="headset-outline"
                    size={34}
                    color={TOKENS.purple}
                  />
                </View>
                <Text style={styles.emptyTitle}>
                  No podcasts in this category
                </Text>
                <Text style={styles.emptySubtitle}>
                  Tune into all shows or switch territory filters to explore island audio stories.
                </Text>
              </View>
            ) : (
              podcasts.map((show) => (
                <View key={show.id} style={styles.showCard}>
                  {/* Show Header */}
                  <View style={styles.showTopRow}>
                    <View style={styles.coverBox}>
                      {show.coverUrl ? (
                        <Image
                          source={{ uri: show.coverUrl }}
                          style={styles.coverImage}
                        />
                      ) : (
                        <Ionicons name="mic" size={26} color={TOKENS.purple} />
                      )}
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.showTitle}>{show.title}</Text>
                      <Text style={styles.showAuthor}>
                        By {show.author} • {show.category}
                      </Text>
                      <View style={styles.followersRow}>
                        <Ionicons
                          name="people-outline"
                          size={13}
                          color={TOKENS.teal}
                        />
                        <Text style={styles.showFollowers}>
                          {show.followerCount} listeners
                        </Text>
                      </View>
                    </View>
                  </View>

                  <Text style={styles.showDesc} numberOfLines={2}>
                    {show.description}
                  </Text>

                  {/* Episodes List */}
                  {show.episodes.length > 0 && (
                    <View style={styles.episodesList}>
                      <Text style={styles.episodesHeader}>Episodes</Text>
                      {show.episodes.map((ep) => {
                        const isThisPlaying =
                          playingEpisodeId === ep.id && isPlaying;
                        return (
                          <View
                            key={ep.id}
                            style={[
                              styles.episodeRow,
                              isThisPlaying && styles.episodeRowActive,
                            ]}
                          >
                            <TouchableOpacity
                              style={[
                                styles.epPlayBtn,
                                isThisPlaying && styles.epPlayBtnActive,
                              ]}
                              onPress={() => handleTogglePlay(ep, show.title)}
                              activeOpacity={0.85}
                              accessibilityRole="button"
                              accessibilityLabel={
                                isThisPlaying
                                  ? `Pause ${ep.title}`
                                  : `Play ${ep.title}`
                              }
                            >
                              <Ionicons
                                name={isThisPlaying ? 'pause' : 'play'}
                                size={15}
                                color={
                                  isThisPlaying
                                    ? TOKENS.actionText
                                    : TOKENS.purple
                                }
                                style={
                                  !isThisPlaying ? { marginLeft: 1 } : undefined
                                }
                              />
                            </TouchableOpacity>
                            <View style={{ flex: 1 }}>
                              <View style={styles.epTitleRow}>
                                <Text style={styles.epTitle} numberOfLines={1}>
                                  {ep.seasonNumber && ep.episodeNumber
                                    ? `S${ep.seasonNumber}E${ep.episodeNumber}: `
                                    : ''}
                                  {ep.title}
                                </Text>
                                {ep.hasVideo && (
                                  <View style={styles.videoBadge}>
                                    <Text style={styles.videoBadgeText}>
                                      VIDEO
                                    </Text>
                                  </View>
                                )}
                              </View>
                              <Text style={styles.epDuration}>
                                {ep.durationFormatted}
                              </Text>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
              ))
            )}
          </ScrollView>
        )}

        {/* Sticky Midnight Reef Mini-Player (TOKENS.oceanDepth #0B1B3B) */}
        {playingEpisodeId && (
          <View style={styles.miniPlayer}>
            <View style={styles.miniIconBadge}>
              <Ionicons
                name="headset-outline"
                size={18}
                color={TOKENS.teal}
              />
            </View>

            <View style={styles.miniTextCol}>
              <View style={styles.miniLabelRow}>
                <Text style={styles.miniPlayingLabel}>NOW PLAYING</Text>
                {playingHasVideo && (
                  <View style={styles.videoBadge}>
                    <Text style={styles.videoBadgeText}>VIDEO</Text>
                  </View>
                )}
              </View>
              <Text style={styles.miniPlayingTitle} numberOfLines={1}>
                {playingTitle}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.rateBtn}
              onPress={handleCycleRate}
              activeOpacity={0.8}
              accessibilityLabel={`Playback speed ${playbackRate}x`}
            >
              <Text style={styles.rateBtnText}>{playbackRate}x</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.miniPlayControl}
              onPress={() => {
                if (soundRef.current) {
                  if (isPlaying) {
                    soundRef.current.pauseAsync();
                    setIsPlaying(false);
                  } else {
                    soundRef.current.playAsync();
                    setIsPlaying(true);
                  }
                }
              }}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={isPlaying ? 'Pause episode' : 'Play episode'}
            >
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={18}
                color={TOKENS.actionText}
                style={!isPlaying ? { marginLeft: 1 } : undefined}
              />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: TOKENS.canvas,
  },
  container: {
    flex: 1,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  headerIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: TOKENS.violetSoft,
    borderWidth: 1,
    borderColor: TOKENS.purple,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: TOKENS.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: TOKENS.textMuted,
    marginTop: 3,
    lineHeight: 17,
  },
  rail: {
    maxHeight: 42,
    marginVertical: 3,
  },
  railContent: {
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 8,
  },
  chip: {
    backgroundColor: TOKENS.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: TOKENS.border,
  },
  chipActivePurple: {
    backgroundColor: TOKENS.violetSoft,
    borderColor: TOKENS.purple,
  },
  chipActiveTeal: {
    backgroundColor: TOKENS.tealSoft,
    borderColor: TOKENS.borderActive,
  },
  chipText: {
    color: TOKENS.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  chipTextActivePurple: {
    color: TOKENS.purple,
    fontWeight: '800',
  },
  chipTextActiveTeal: {
    color: TOKENS.teal,
    fontWeight: '800',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 120,
  },
  emptyCard: {
    paddingVertical: 44,
    paddingHorizontal: 28,
    alignItems: 'center',
    backgroundColor: TOKENS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: TOKENS.border,
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: TOKENS.violetSoft,
    borderWidth: 1,
    borderColor: TOKENS.purple,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: TOKENS.textPrimary,
  },
  emptySubtitle: {
    fontSize: 12,
    color: TOKENS.textMuted,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  showCard: {
    backgroundColor: TOKENS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: TOKENS.border,
    padding: 16,
    marginBottom: 14,
  },
  showTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coverBox: {
    width: 62,
    height: 62,
    borderRadius: 14,
    backgroundColor: TOKENS.violetSoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: TOKENS.borderStrong,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  showTitle: {
    color: TOKENS.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  showAuthor: {
    color: TOKENS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  followersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 5,
  },
  showFollowers: {
    color: TOKENS.teal,
    fontSize: 11,
    fontWeight: '700',
  },
  showDesc: {
    color: TOKENS.textSecondary,
    fontSize: 12,
    marginTop: 12,
    lineHeight: 18,
  },
  episodesList: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: TOKENS.border,
  },
  episodesHeader: {
    color: TOKENS.textMuted,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 8,
  },
  episodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 12,
    marginBottom: 4,
  },
  episodeRowActive: {
    backgroundColor: TOKENS.raised,
  },
  epPlayBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: TOKENS.violetSoft,
    borderWidth: 1,
    borderColor: TOKENS.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  epPlayBtnActive: {
    backgroundColor: TOKENS.teal,
    borderColor: TOKENS.teal,
  },
  epTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  epTitle: {
    color: TOKENS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    flexShrink: 1,
  },
  epDuration: {
    color: TOKENS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  miniPlayer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: TOKENS.oceanDepth,
    borderTopWidth: 1,
    borderTopColor: TOKENS.borderActive,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  miniIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: TOKENS.tealSoft,
    borderWidth: 1,
    borderColor: TOKENS.borderActive,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniTextCol: {
    flex: 1,
  },
  miniLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  miniPlayingLabel: {
    color: TOKENS.teal,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.9,
  },
  miniPlayingTitle: {
    color: TOKENS.textPrimary,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  miniPlayControl: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: TOKENS.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoBadge: {
    backgroundColor: TOKENS.violetSoft,
    borderWidth: 1,
    borderColor: TOKENS.purple,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 5,
  },
  videoBadgeText: {
    color: TOKENS.purple,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  rateBtn: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: TOKENS.raised,
    borderWidth: 1,
    borderColor: TOKENS.border,
  },
  rateBtnText: {
    color: TOKENS.textPrimary,
    fontSize: 11,
    fontWeight: '800',
  },
});
