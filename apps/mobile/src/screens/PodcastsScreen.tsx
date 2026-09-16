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
} from 'react-native';
import { Audio } from 'expo-av';
import { TOKENS } from '../theme/tokens';
import { supabase } from '../lib/supabase';

interface EpisodeItem {
  id: string;
  title: string;
  durationFormatted: string;
  audioUrl?: string | null;
  showNotes?: string | null;
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
];

const TERRITORIES = [
  { iso: 'ALL', name: 'All Islands', flag: '🌴' },
  { iso: 'TTO', name: 'Trinidad & Tobago', flag: '🇹🇹' },
  { iso: 'JAM', name: 'Jamaica', flag: '🇯🇲' },
  { iso: 'BRB', name: 'Barbados', flag: '🇧🇧' },
  { iso: 'HTI', name: 'Haiti', flag: '🇭🇹' },
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
  const [isPlaying, setIsPlaying] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  const fetchPodcasts = async () => {
    try {
      let query = supabase
        .from('podcasts')
        .select(`
          id, title, description, category, country_iso, cover_path, follower_count,
          profiles:creator_id (display_name, username),
          podcast_episodes (id, title, duration_seconds, audio_path, show_notes)
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
          const eps = (d.podcast_episodes || []).map((ep: any) => ({
            id: ep.id,
            title: ep.title,
            durationFormatted: `${Math.floor((ep.duration_seconds || 1800) / 60)} mins`,
            audioUrl: ep.audio_path?.startsWith('http')
              ? ep.audio_path
              : 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3',
            showNotes: ep.show_notes,
          }));

          return {
            id: d.id,
            title: d.title,
            description: d.description || 'Caribbean audio documentary and cultural talk.',
            author: d.profiles?.display_name || d.profiles?.username || 'Caribbean Host',
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
      setIsPlaying(true);

      const targetUrl = ep.audioUrl || 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3';
      const { sound } = await Audio.Sound.createAsync(
        { uri: targetUrl },
        { shouldPlay: true }
      );
      soundRef.current = sound;

      // Persist progress to DB if authenticated
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('podcast_progress').upsert({
            user_id: user.id,
            episode_id: ep.id,
            current_position_seconds: 1,
            completed: false,
            updated_at: new Date().toISOString(),
          });
        }
      } catch (pErr) {
        // Non-blocking
      }
    } catch (err) {
      console.warn('Podcast audio error:', err);
      setIsPlaying(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Caribbean Podcast Network</Text>
          <Text style={styles.headerSubtitle}>
            Voices, history, sound system culture, and authentic island discussions.
          </Text>
        </View>

        {/* Categories Rail */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.rail}
          contentContainerStyle={styles.railContent}
        >
          {PODCAST_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.chip, activeCategory === cat && styles.chipActive]}
              onPress={() => setActiveCategory(cat)}
            >
              <Text style={styles.chipText}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Territory Rail */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.rail}
          contentContainerStyle={styles.railContent}
        >
          {TERRITORIES.map((t) => (
            <TouchableOpacity
              key={t.iso}
              style={[styles.chip, activeTerritory === t.iso && styles.chipActive]}
              onPress={() => setActiveTerritory(t.iso)}
            >
              <Text style={styles.chipText}>{t.flag} {t.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Shows Feed */}
        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={TOKENS.action} />
          </View>
        ) : (
          <ScrollView
            style={styles.content}
            contentContainerStyle={{ paddingBottom: 100 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  fetchPodcasts();
                }}
                tintColor={TOKENS.action}
              />
            }
          >
            {podcasts.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={{ fontSize: 44, marginBottom: 10 }}>🎙️</Text>
                <Text style={styles.emptyTitle}>No podcasts in this category</Text>
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
                        <Image source={{ uri: show.coverUrl }} style={styles.coverImage} />
                      ) : (
                        <Text style={{ fontSize: 28 }}>🎙️</Text>
                      )}
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.showTitle}>{show.title}</Text>
                      <Text style={styles.showAuthor}>By {show.author} • {show.category}</Text>
                      <Text style={styles.showFollowers}>👥 {show.followerCount} listeners</Text>
                    </View>
                  </View>

                  <Text style={styles.showDesc} numberOfLines={2}>{show.description}</Text>

                  {/* Episodes List */}
                  {show.episodes.length > 0 && (
                    <View style={styles.episodesList}>
                      <Text style={styles.episodesHeader}>Episodes</Text>
                      {show.episodes.map((ep) => {
                        const isThisPlaying = playingEpisodeId === ep.id && isPlaying;
                        return (
                          <View key={ep.id} style={styles.episodeRow}>
                            <TouchableOpacity
                              style={[styles.epPlayBtn, isThisPlaying && styles.epPlayBtnActive]}
                              onPress={() => handleTogglePlay(ep, show.title)}
                            >
                              <Text style={styles.epPlayBtnText}>{isThisPlaying ? '⏸' : '▶'}</Text>
                            </TouchableOpacity>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.epTitle} numberOfLines={1}>{ep.title}</Text>
                              <Text style={styles.epDuration}>{ep.durationFormatted}</Text>
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

        {/* Floating Mini Player */}
        {playingEpisodeId && (
          <View style={styles.miniPlayer}>
            <View style={{ flex: 1 }}>
              <Text style={styles.miniPlayingLabel}>NOW PLAYING</Text>
              <Text style={styles.miniPlayingTitle} numberOfLines={1}>{playingTitle}</Text>
            </View>
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
            >
              <Text style={styles.miniPlayControlText}>{isPlaying ? '⏸' : '▶'}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: TOKENS.canvas },
  container: { flex: 1 },
  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: TOKENS.textPrimary },
  headerSubtitle: { fontSize: 12, color: TOKENS.textMuted, marginTop: 2 },
  rail: { maxHeight: 42, marginVertical: 3 },
  railContent: { paddingHorizontal: 16, gap: 8 },
  chip: {
    backgroundColor: TOKENS.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: TOKENS.border,
  },
  chipActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.25)',
    borderColor: TOKENS.purple,
  },
  chipText: { color: TOKENS.textPrimary, fontSize: 11, fontWeight: '700' },
  content: { flex: 1, padding: 16 },
  emptyCard: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: TOKENS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: TOKENS.border,
  },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: TOKENS.textPrimary },
  emptySubtitle: { fontSize: 12, color: TOKENS.textMuted, textAlign: 'center', marginTop: 6 },
  showCard: {
    backgroundColor: TOKENS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: TOKENS.border,
    padding: 16,
    marginBottom: 14,
  },
  showTopRow: { flexDirection: 'row', alignItems: 'center' },
  coverBox: {
    width: 60,
    height: 60,
    borderRadius: 14,
    backgroundColor: TOKENS.raised,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: TOKENS.border,
  },
  coverImage: { width: '100%', height: '100%' },
  showTitle: { color: TOKENS.textPrimary, fontSize: 15, fontWeight: '900' },
  showAuthor: { color: TOKENS.textMuted, fontSize: 11, marginTop: 2 },
  showFollowers: { color: TOKENS.purple, fontSize: 11, fontWeight: '700', marginTop: 3 },
  showDesc: { color: TOKENS.textMuted, fontSize: 12, marginTop: 10, lineHeight: 16 },
  episodesList: { marginTop: 14, paddingTop: 10, borderTopWidth: 1, borderTopColor: TOKENS.border },
  episodesHeader: { color: TOKENS.textPrimary, fontSize: 12, fontWeight: '800', marginBottom: 8 },
  episodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  epPlayBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  epPlayBtnActive: { backgroundColor: TOKENS.purple },
  epPlayBtnText: { color: '#FFF', fontSize: 12, fontWeight: '900' },
  epTitle: { color: TOKENS.textPrimary, fontSize: 12, fontWeight: '700' },
  epDuration: { color: TOKENS.textMuted, fontSize: 10, marginTop: 2 },
  miniPlayer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: TOKENS.raised,
    borderTopWidth: 1,
    borderTopColor: TOKENS.borderActive,
    paddingHorizontal: 18,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniPlayingLabel: { color: TOKENS.action, fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  miniPlayingTitle: { color: TOKENS.textPrimary, fontSize: 13, fontWeight: '800', marginTop: 1 },
  miniPlayControl: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: TOKENS.action,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  miniPlayControlText: { color: '#090D1A', fontSize: 14, fontWeight: '900' },
});
