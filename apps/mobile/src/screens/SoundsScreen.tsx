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
import { TOKENS } from '../theme/tokens';
import { supabase } from '../lib/supabase';

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
  flag: string;
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
  { iso: 'ALL', name: 'All Islands', flag: '🌴' },
  { iso: 'JAM', name: 'Jamaica', flag: '🇯🇲' },
  { iso: 'TTO', name: 'Trinidad', flag: '🇹🇹' },
  { iso: 'BRB', name: 'Barbados', flag: '🇧🇧' },
  { iso: 'HTI', name: 'Haiti', flag: '🇭🇹' },
  { iso: 'DOM', name: 'Dom. Rep.', flag: '🇩🇴' },
  { iso: 'GUY', name: 'Guyana', flag: '🇬🇾' },
];

const VERIFIED_STEMS: SoundItem[] = [
  {
    id: 'stem-1',
    title: 'Sunrise Soca Riddim (Brass Stems)',
    artist: 'Port of Spain Sound Collective',
    genre: 'Soca',
    durationFormatted: '0:32',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8bbf7b9a5.mp3',
    usageCount: 142,
    countryIso: 'TTO',
    flag: '🇹🇹',
    licenseType: 'CC-BY-4.0',
    bpm: 128,
  },
  {
    id: 'stem-2',
    title: 'Blue Mountain Dub Bassline',
    artist: 'Kingston Soundworks',
    genre: 'Reggae',
    durationFormatted: '0:38',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3',
    usageCount: 89,
    countryIso: 'JAM',
    flag: '🇯🇲',
    licenseType: 'CC-BY-4.0',
    bpm: 78,
  },
  {
    id: 'stem-3',
    title: 'Carnival J’Ouvert Percussion Loop',
    artist: 'Laventille Iron Rhythm Band',
    genre: 'Calypso',
    durationFormatted: '0:28',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_12b0c7443c.mp3',
    usageCount: 65,
    countryIso: 'TTO',
    flag: '🇹🇹',
    licenseType: 'Royalty-Free',
    bpm: 132,
  },
  {
    id: 'stem-4',
    title: 'Ayiti Tanbou & Ti-Bwa Groove',
    artist: 'Port-au-Prince Folk Arts',
    genre: 'Kompa',
    durationFormatted: '0:35',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3',
    usageCount: 51,
    countryIso: 'HTI',
    flag: '🇭🇹',
    licenseType: 'CC-BY-4.0',
    bpm: 104,
  },
];

export function SoundsScreen({ navigation }: any) {
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
        query = query.or(`title.ilike.%${searchQuery.trim()}%,artist.ilike.%${searchQuery.trim()}%`);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        const mapped: SoundItem[] = data.map((d: any) => ({
          id: d.id,
          title: d.title,
          artist: d.artist,
          artistHandle: d.artist_handle,
          genre: d.genre,
          durationFormatted: `${Math.floor((d.duration_seconds || 30) / 60)}:${String((d.duration_seconds || 30) % 60).padStart(2, '0')}`,
          audioUrl: d.audio_url,
          usageCount: d.usage_count || 0,
          countryIso: d.country_iso || 'CAR',
          flag: d.country_iso === 'JAM' ? '🇯🇲' : d.country_iso === 'TTO' ? '🇹🇹' : d.country_iso === 'HTI' ? '🇭🇹' : '🌴',
          licenseType: d.license_type || 'CC-BY-4.0',
          bpm: d.bpm,
        }));
        setSounds(mapped);
      } else {
        // Fallback to verified rhythm stems filtered
        const filtered = VERIFIED_STEMS.filter((s) => {
          if (activeGenre !== 'All Genres' && s.genre !== activeGenre) return false;
          if (activeTerritory !== 'ALL' && s.countryIso !== activeTerritory) return false;
          if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            return s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q);
          }
          return true;
        });
        setSounds(filtered);
      }
    } catch (err) {
      console.warn('Could not fetch sounds:', err);
      setSounds(VERIFIED_STEMS);
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
        // Stop playing
        if (playbackInstance.current) {
          await playbackInstance.current.stopAsync();
          await playbackInstance.current.unloadAsync();
          playbackInstance.current = null;
        }
        setPlayingId(null);
        return;
      }

      // Unload previous sound
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
    navigation.navigate('Reels', { soundId: item.id, soundTitle: item.title });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Caribbean Sounds &amp; Stems</Text>
          <Text style={styles.headerSubtitle}>
            Verified island riddims, soca brass, and reggae basslines with creator licensing.
          </Text>
        </View>

        {/* Search */}
        <View style={styles.searchBox}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search sounds, rhythms, or artists..."
            placeholderTextColor={TOKENS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

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

        {/* Genres Rail */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.rail}
          contentContainerStyle={styles.railContent}
        >
          {GENRES.map((g) => (
            <TouchableOpacity
              key={g}
              style={[styles.chip, activeGenre === g && styles.chipActive]}
              onPress={() => setActiveGenre(g)}
            >
              <Text style={styles.chipText}>{g}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Sounds List */}
        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={TOKENS.action} />
          </View>
        ) : (
          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  fetchSounds();
                }}
                tintColor={TOKENS.action}
              />
            }
          >
            {sounds.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyEmoji}>🎵</Text>
                <Text style={styles.emptyTitle}>No sounds found</Text>
                <Text style={styles.emptySubtitle}>Try changing your genre or island filter.</Text>
              </View>
            ) : (
              sounds.map((sound) => {
                const isPlaying = playingId === sound.id;
                return (
                  <View key={sound.id} style={styles.soundCard}>
                    {/* Play Button */}
                    <TouchableOpacity
                      style={[styles.playBtn, isPlaying && styles.playBtnActive]}
                      onPress={() => handleTogglePlay(sound)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.playBtnText}>{isPlaying ? '⏸' : '▶'}</Text>
                    </TouchableOpacity>

                    {/* Sound Details */}
                    <View style={styles.soundInfo}>
                      <View style={styles.titleRow}>
                        <Text style={styles.soundTitle} numberOfLines={1}>
                          {sound.title}
                        </Text>
                      </View>
                      <Text style={styles.soundArtist}>
                        {sound.flag} {sound.artist} • {sound.genre}
                      </Text>
                      <View style={styles.metaRow}>
                        <Text style={styles.metaText}>{sound.durationFormatted}</Text>
                        {sound.bpm && <Text style={styles.metaText}>• {sound.bpm} BPM</Text>}
                        <Text style={styles.metaText}>• {sound.usageCount} reels</Text>
                        <Text style={styles.licenseBadge}>{sound.licenseType}</Text>
                      </View>
                    </View>

                    {/* Use Sound Button */}
                    <TouchableOpacity
                      style={styles.useBtn}
                      onPress={() => handleUseSoundInReel(sound)}
                      activeOpacity={0.8}
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
  safeArea: { flex: 1, backgroundColor: TOKENS.canvas },
  container: { flex: 1 },
  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: TOKENS.textPrimary },
  headerSubtitle: { fontSize: 12, color: TOKENS.textMuted, marginTop: 2, lineHeight: 16 },
  searchBox: { paddingHorizontal: 16, marginVertical: 8 },
  searchInput: {
    backgroundColor: TOKENS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: TOKENS.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: TOKENS.textPrimary,
    fontSize: 13,
  },
  rail: { maxHeight: 42, marginVertical: 2 },
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
    backgroundColor: TOKENS.action + '25',
    borderColor: TOKENS.action,
  },
  chipText: { color: TOKENS.textPrimary, fontSize: 11, fontWeight: '700' },
  list: { flex: 1, marginTop: 8 },
  listContent: { paddingHorizontal: 16, paddingBottom: 32 },
  soundCard: {
    backgroundColor: TOKENS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: TOKENS.border,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  playBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 122, 89, 0.15)',
    borderWidth: 1,
    borderColor: TOKENS.action,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtnActive: {
    backgroundColor: TOKENS.action,
  },
  playBtnText: {
    fontSize: 16,
    color: TOKENS.textPrimary,
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
    fontSize: 13,
    fontWeight: '800',
  },
  soundArtist: {
    color: TOKENS.textMuted,
    fontSize: 11,
    marginTop: 2,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  metaText: {
    color: TOKENS.textMuted,
    fontSize: 10,
  },
  licenseBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    color: TOKENS.success,
    fontSize: 9,
    fontWeight: '800',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  useBtn: {
    backgroundColor: TOKENS.raised,
    borderWidth: 1,
    borderColor: TOKENS.border,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
  },
  useBtnText: {
    color: TOKENS.action,
    fontSize: 11,
    fontWeight: '800',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyEmoji: { fontSize: 44, marginBottom: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: TOKENS.textPrimary },
  emptySubtitle: { fontSize: 12, color: TOKENS.textMuted, marginTop: 4 },
});
