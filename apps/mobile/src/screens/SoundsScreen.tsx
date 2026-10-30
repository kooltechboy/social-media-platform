import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons as ExpoIonicons } from '@expo/vector-icons';
import { TOKENS } from '../theme/tokens';
import { supabase } from '../lib/supabase';

const Ionicons = ExpoIonicons as unknown as React.ComponentType<any>;

interface SoundItem {
  id: string;
  title: string;
  artist: string;
  artistHandle?: string;
  genre: string;
  durationFormatted: string;
  audioUrl: string;
  usageCount: number;
  countryIso: string;
  licenseType: string;
  bpm?: number;
}

const GENRES = [
  'All Genres',
  'Reggae',
  'Soca',
  'Dancehall',
  'Kompa',
  'Calypso',
  'Zouk',
  'Afro-Caribbean',
  'Chutney',
];

const TERRITORIES = [
  { iso: 'ALL', name: 'All Islands' },
  { iso: 'JAM', name: 'Jamaica' },
  { iso: 'TTO', name: 'Trinidad & Tobago' },
  { iso: 'BRB', name: 'Barbados' },
  { iso: 'HTI', name: 'Haiti' },
  { iso: 'DOM', name: 'Dom. Rep.' },
  { iso: 'GUY', name: 'Guyana' },
];

export function SoundsScreen({ navigation }: any = {}) {
  const [sounds, setSounds] = useState<SoundItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeGenre, setActiveGenre] = useState('All Genres');
  const [activeTerritory, setActiveTerritory] = useState('ALL');
  const [playingId, setPlayingId] = useState<string | null>(null);

  const playbackInstance = useRef<Audio.Sound | null>(null);

  const fetchSounds = async () => {
    try {
      let query = supabase
        .from('sounds')
        .select('*')
        .order('usage_count', { ascending: false })
        .limit(30);

      if (activeGenre !== 'All Genres') {
        query = query.eq('genre', activeGenre);
      }
      if (activeTerritory !== 'ALL') {
        query = query.eq('country_iso', activeTerritory);
      }
      if (searchQuery.trim()) {
        query = query.or(
          `title.ilike.%${searchQuery.trim()}%,artist.ilike.%${searchQuery.trim()}%`
        );
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        const mapped: SoundItem[] = data.map((d: any) => ({
          id: d.id,
          title: d.title,
          artist: d.artist,
          artistHandle: d.artist_handle,
          genre: d.genre || 'Caribbean',
          durationFormatted: `${Math.floor((d.duration_seconds || 30) / 60)}:${String((d.duration_seconds || 30) % 60).padStart(2, '0')}`,
          audioUrl: d.audio_url,
          usageCount: d.usage_count || 0,
          countryIso: d.country_iso || 'CAR',
          licenseType: d.license_type || 'CC-BY-4.0',
          bpm: d.bpm,
        }));
        setSounds(mapped);
      } else {
        setSounds([]);
      }
    } catch (err) {
      console.warn('Could not fetch sounds:', err);
      setSounds([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSounds();
  }, [activeGenre, activeTerritory, searchQuery]);

  useEffect(() => {
    return () => {
      if (playbackInstance.current) {
        playbackInstance.current.unloadAsync().catch(() => {});
      }
    };
  }, []);

  const handleTogglePlay = async (item: SoundItem) => {
    try {
      if (playingId === item.id) {
        if (playbackInstance.current) {
          await playbackInstance.current.stopAsync();
          await playbackInstance.current.unloadAsync();
          playbackInstance.current = null;
        }
        setPlayingId(null);
        return;
      }

      if (playbackInstance.current) {
        await playbackInstance.current.stopAsync();
        await playbackInstance.current.unloadAsync();
        playbackInstance.current = null;
      }

      setPlayingId(item.id);
      const { sound } = await Audio.Sound.createAsync(
        { uri: item.audioUrl },
        { shouldPlay: true }
      );
      playbackInstance.current = sound;

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setPlayingId(null);
        }
      });
    } catch (err) {
      console.warn('Audio playback error:', err);
      setPlayingId(null);
    }
  };

  const handleUseSoundInReel = (item: SoundItem) => {
    navigation?.navigate?.('Reels', {
      soundId: item.id,
      soundTitle: item.title,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Executive Midnight Reef Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <View style={styles.headerDiscBadge}>
              <Ionicons name="musical-notes" size={18} color={TOKENS.teal} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Caribbean Sounds &amp; Stems</Text>
              <Text style={styles.headerSubtitle}>
                Verified island riddims, soca brass, and reggae basslines with creator licensing.
              </Text>
            </View>
          </View>
        </View>

        {/* Search Input */}
        <View style={styles.searchBox}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={18} color={TOKENS.textDim} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search sounds, rhythms, or artists..."
              placeholderTextColor={TOKENS.textDim}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                accessibilityLabel="Clear search"
              >
                <Ionicons
                  name="close-circle"
                  size={17}
                  color={TOKENS.textMuted}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

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
                style={[styles.chip, isActive && styles.chipActiveOcean]}
                onPress={() => setActiveTerritory(t.iso)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.chipText,
                    isActive && styles.chipTextActiveOcean,
                  ]}
                >
                  {t.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Genres Rail */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.rail}
          contentContainerStyle={styles.railContent}
        >
          {GENRES.map((g) => {
            const isActive = activeGenre === g;
            return (
              <TouchableOpacity
                key={g}
                style={[styles.chip, isActive && styles.chipActive]}
                onPress={() => setActiveGenre(g)}
                activeOpacity={0.8}
              >
                <Text
                  style={[styles.chipText, isActive && styles.chipTextActive]}
                >
                  {g}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Sounds List */}
        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={TOKENS.teal} />
          </View>
        ) : (
          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  fetchSounds();
                }}
                tintColor={TOKENS.teal}
              />
            }
          >
            {sounds.length === 0 ? (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyDiscCircle}>
                  <Ionicons
                    name="musical-notes"
                    size={32}
                    color={TOKENS.teal}
                  />
                </View>
                <Text style={styles.emptyTitle}>No sounds found</Text>
                <Text style={styles.emptySubtitle}>
                  Try adjusting your genre, search term, or island filter.
                </Text>
              </View>
            ) : (
              sounds.map((sound) => {
                const isPlaying = playingId === sound.id;
                return (
                  <View
                    key={sound.id}
                    style={[
                      styles.soundCard,
                      isPlaying && styles.soundCardPlaying,
                    ]}
                  >
                    {/* Play / Pause Disc Badge */}
                    <TouchableOpacity
                      style={[
                        styles.playBtn,
                        isPlaying && styles.playBtnActive,
                      ]}
                      onPress={() => handleTogglePlay(sound)}
                      activeOpacity={0.85}
                      accessibilityRole="button"
                      accessibilityLabel={
                        isPlaying
                          ? `Pause ${sound.title}`
                          : `Play ${sound.title}`
                      }
                    >
                      <Ionicons
                        name={isPlaying ? 'pause' : 'play'}
                        size={18}
                        color={isPlaying ? TOKENS.actionText : TOKENS.teal}
                        style={!isPlaying ? { marginLeft: 2 } : undefined}
                      />
                    </TouchableOpacity>

                    {/* Sound Details */}
                    <View style={styles.soundInfo}>
                      <View style={styles.titleRow}>
                        <Text style={styles.soundTitle} numberOfLines={1}>
                          {sound.title}
                        </Text>
                      </View>
                      <View style={styles.artistRow}>
                        <View style={styles.isoBadge}>
                          <Text style={styles.isoBadgeText}>
                            {sound.countryIso}
                          </Text>
                        </View>
                        <Text style={styles.soundArtist} numberOfLines={1}>
                          {sound.artist} • {sound.genre}
                        </Text>
                      </View>
                      <View style={styles.metaRow}>
                        <Text style={styles.metaText}>
                          {sound.durationFormatted}
                        </Text>
                        {sound.bpm ? (
                          <Text style={styles.metaText}>
                            • {sound.bpm} BPM
                          </Text>
                        ) : null}
                        <Text style={styles.metaText}>
                          • {sound.usageCount} shorts
                        </Text>
                        <View style={styles.licenseBadgeWrap}>
                          <Text style={styles.licenseBadge}>
                            {sound.licenseType}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Use Sound Pill CTA */}
                    <TouchableOpacity
                      style={styles.useBtn}
                      onPress={() => handleUseSoundInReel(sound)}
                      activeOpacity={0.85}
                      accessibilityRole="button"
                      accessibilityLabel={`Use sound ${sound.title}`}
                    >
                      <Text style={styles.useBtnText}>Use Sound</Text>
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </ScrollView>
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
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  headerDiscBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: TOKENS.tealSoft,
    borderWidth: 1,
    borderColor: TOKENS.borderActive,
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
  searchBox: {
    paddingHorizontal: 16,
    marginVertical: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: TOKENS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: TOKENS.border,
    paddingHorizontal: 14,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 11,
    color: TOKENS.textPrimary,
    fontSize: 13,
  },
  rail: {
    maxHeight: 42,
    marginVertical: 2,
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
  chipActive: {
    backgroundColor: TOKENS.tealSoft,
    borderColor: TOKENS.borderActive,
  },
  chipActiveOcean: {
    backgroundColor: TOKENS.oceanSoft,
    borderColor: TOKENS.action,
  },
  chipText: {
    color: TOKENS.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  chipTextActive: {
    color: TOKENS.teal,
    fontWeight: '800',
  },
  chipTextActiveOcean: {
    color: TOKENS.action,
    fontWeight: '800',
  },
  list: {
    flex: 1,
    marginTop: 8,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  soundCard: {
    backgroundColor: TOKENS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: TOKENS.border,
    padding: 13,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  soundCardPlaying: {
    borderColor: TOKENS.borderActive,
    backgroundColor: TOKENS.raised,
  },
  playBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: TOKENS.tealSoft,
    borderWidth: 1,
    borderColor: TOKENS.borderActive,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtnActive: {
    backgroundColor: TOKENS.teal,
    borderColor: TOKENS.teal,
  },
  soundInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  soundTitle: {
    color: TOKENS.textPrimary,
    fontSize: 14,
    fontWeight: '800',
  },
  artistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  isoBadge: {
    backgroundColor: TOKENS.oceanSoft,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 5,
  },
  isoBadgeText: {
    color: TOKENS.action,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  soundArtist: {
    color: TOKENS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 5,
  },
  metaText: {
    color: TOKENS.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },
  licenseBadgeWrap: {
    backgroundColor: TOKENS.tealSoft,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 5,
  },
  licenseBadge: {
    color: TOKENS.teal,
    fontSize: 9,
    fontWeight: '800',
  },
  useBtn: {
    backgroundColor: TOKENS.teal,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 999,
  },
  useBtnText: {
    color: TOKENS.actionText,
    fontSize: 11,
    fontWeight: '800',
  },
  emptyContainer: {
    paddingVertical: 44,
    paddingHorizontal: 28,
    alignItems: 'center',
    backgroundColor: TOKENS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: TOKENS.border,
  },
  emptyDiscCircle: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: TOKENS.oceanSoft,
    borderWidth: 1,
    borderColor: TOKENS.borderStrong,
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
    marginTop: 5,
    textAlign: 'center',
    lineHeight: 18,
  },
});
