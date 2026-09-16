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
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { Video as ExpoVideo, ResizeMode } from 'expo-av';
import { TOKENS } from '../theme/tokens';
import { supabase } from '../lib/supabase';

const Video = ExpoVideo as unknown as React.ComponentType<any>;

interface StreamItem {
  id: string;
  title: string;
  creatorName: string;
  creatorHandle: string;
  creatorAvatar?: string | null;
  state: 'live' | 'scheduled' | 'ended';
  peakViewers: number;
  category: string;
  location: string;
  videoUrl?: string | null;
  startedAt?: string;
}

const LIVE_CATEGORIES = [
  'All Broadcasts',
  'Music & DJ Sets',
  'Carnival & Fetes',
  'Culture & Talk',
  'Food & Cooking',
  'News & Diaspora',
];

export function LiveScreen({ navigation }: any) {
  const [streams, setStreams] = useState<StreamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All Broadcasts');
  const [activeStream, setActiveStream] = useState<StreamItem | null>(null);

  // Broadcast modal state
  const [broadcastModalVisible, setBroadcastModalVisible] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastCategory, setBroadcastCategory] = useState('Music & DJ Sets');
  const [broadcasting, setBroadcasting] = useState(false);

  // Live Chat state
  const [chatMessages, setChatMessages] = useState<Array<{ id: string; user: string; text: string }>>([
    { id: '1', user: 'RasKofi', text: 'Big sound from Kingston! 🌴🔊' },
    { id: '2', user: 'SocaQueen_TT', text: 'Carnival vibes everywhere! 💃' },
  ]);
  const [chatInput, setChatInput] = useState('');

  const fetchStreams = async () => {
    try {
      let query = supabase
        .from('livestreams')
        .select(`
          id, title, state, peak_viewers, started_at, category, location_tag, stream_url,
          profiles:creator_id (id, display_name, username, avatar_url)
        `)
        .in('state', ['live', 'scheduled'])
        .order('started_at', { ascending: false })
        .limit(20);

      if (selectedCategory !== 'All Broadcasts') {
        query = query.eq('category', selectedCategory);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        const mapped: StreamItem[] = data.map((d: any) => {
          const p = d.profiles;
          return {
            id: d.id,
            title: d.title,
            creatorName: p?.display_name || p?.username || 'Caribbean Broadcaster',
            creatorHandle: p?.username ? `@${p.username}` : '@broadcaster',
            creatorAvatar: p?.avatar_url,
            state: d.state,
            peakViewers: d.peak_viewers || 1,
            category: d.category || 'Culture & Talk',
            location: d.location_tag || 'Caribbean',
            videoUrl: d.stream_url,
            startedAt: d.started_at,
          };
        });
        setStreams(mapped);
        if (!activeStream && mapped.length > 0) {
          setActiveStream(mapped[0]);
        }
      } else {
        setStreams([]);
      }
    } catch (err) {
      console.warn('Could not fetch live streams:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStreams();
  }, [selectedCategory]);

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    setChatMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), user: 'You', text: chatInput.trim() },
    ]);
    setChatInput('');
  };

  const handleStartBroadcast = async () => {
    if (!broadcastTitle.trim()) {
      Alert.alert('Title Required', 'Please enter a title for your live broadcast.');
      return;
    }

    setBroadcasting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Sign In Required', 'Please sign in to go live.');
        setBroadcasting(false);
        return;
      }

      const { data, error } = await supabase
        .from('livestreams')
        .insert({
          creator_id: user.id,
          title: broadcastTitle.trim(),
          category: broadcastCategory,
          state: 'live',
          started_at: new Date().toISOString(),
          location_tag: 'Caribbean Live',
        })
        .select()
        .single();

      if (error) throw error;

      Alert.alert('You Are Live! 🔴', 'Broadcast initialized. Your audience is joining!');
      setBroadcastModalVisible(false);
      setBroadcastTitle('');
      fetchStreams();
    } catch (err: any) {
      console.warn('Error starting broadcast:', err);
      Alert.alert('Broadcast Error', err.message || 'Could not start stream.');
    } finally {
      setBroadcasting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <View style={styles.liveBadgeRow}>
              <View style={styles.liveIndicator} />
              <Text style={styles.liveBadgeText}>LIVE NETWORK</Text>
            </View>
            <Text style={styles.headerTitle}>Caribbean Live Streams</Text>
          </View>
          <TouchableOpacity
            style={styles.goLiveBtn}
            onPress={() => setBroadcastModalVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.goLiveBtnText}>🔴 Go Live</Text>
          </TouchableOpacity>
        </View>

        {/* Category Filter Rail */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryRail}
          contentContainerStyle={styles.categoryRailContent}
        >
          {LIVE_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.chip, selectedCategory === cat && styles.chipActive]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={styles.chipText}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Active Stream Viewer or Empty */}
        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={TOKENS.action} />
          </View>
        ) : (
          <ScrollView
            style={styles.content}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  fetchStreams();
                }}
                tintColor={TOKENS.action}
              />
            }
          >
            {activeStream ? (
              <View style={styles.streamViewerCard}>
                {/* Video Player or Fallback */}
                <View style={styles.videoBox}>
                  {activeStream.videoUrl ? (
                    <Video
                      source={{ uri: activeStream.videoUrl }}
                      style={StyleSheet.absoluteFill}
                      resizeMode={ResizeMode.COVER}
                      shouldPlay
                      isLooping
                    />
                  ) : (
                    <View style={styles.videoPlaceholder}>
                      <Text style={styles.broadcastIcon}>📡</Text>
                      <Text style={styles.broadcastStatus}>Broadcasting Live from {activeStream.location}</Text>
                    </View>
                  )}

                  {/* Viewer Count Badge */}
                  <View style={styles.viewerBadge}>
                    <Text style={styles.viewerBadgeText}>👁️ {activeStream.peakViewers} watching</Text>
                  </View>
                </View>

                {/* Stream Info */}
                <View style={styles.streamDetails}>
                  <Text style={styles.streamTitle}>{activeStream.title}</Text>
                  <Text style={styles.streamHost}>
                    Hosted by {activeStream.creatorName} ({activeStream.creatorHandle})
                  </Text>
                </View>

                {/* Live Floating Chat */}
                <View style={styles.chatContainer}>
                  <Text style={styles.chatHeader}>Live Community Chat</Text>
                  <ScrollView style={styles.chatScroll} nestedScrollEnabled>
                    {chatMessages.map((msg) => (
                      <View key={msg.id} style={styles.chatMsg}>
                        <Text style={styles.chatUser}>{msg.user}: </Text>
                        <Text style={styles.chatText}>{msg.text}</Text>
                      </View>
                    ))}
                  </ScrollView>

                  {/* Chat Input */}
                  <View style={styles.chatInputRow}>
                    <TextInput
                      style={styles.chatInput}
                      placeholder="Send comment to broadcaster..."
                      placeholderTextColor={TOKENS.textMuted}
                      value={chatInput}
                      onChangeText={setChatInput}
                      onSubmitEditing={handleSendChat}
                    />
                    <TouchableOpacity style={styles.sendChatBtn} onPress={handleSendChat}>
                      <Text style={styles.sendChatBtnText}>Send</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>🎙️</Text>
                <Text style={styles.emptyTitle}>No live broadcasts right now</Text>
                <Text style={styles.emptySubtitle}>
                  Be the first Caribbean voice to go live and connect our global community!
                </Text>
                <TouchableOpacity
                  style={styles.emptyGoLiveBtn}
                  onPress={() => setBroadcastModalVisible(true)}
                >
                  <Text style={styles.emptyGoLiveText}>🔴 Start Broadcasting</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Other Streams */}
            {streams.length > 1 && (
              <View style={styles.otherStreamsSection}>
                <Text style={styles.sectionTitle}>More Live Streams</Text>
                {streams.filter((s) => s.id !== activeStream?.id).map((stream) => (
                  <TouchableOpacity
                    key={stream.id}
                    style={styles.streamRowCard}
                    onPress={() => setActiveStream(stream)}
                  >
                    <View style={styles.streamRowIcon}>
                      <Text style={{ fontSize: 20 }}>📺</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.streamRowTitle}>{stream.title}</Text>
                      <Text style={styles.streamRowMeta}>{stream.creatorName} • {stream.peakViewers} viewers</Text>
                    </View>
                    <Text style={styles.streamRowWatch}>Watch →</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>
        )}

        {/* Go Live Broadcaster Modal */}
        <Modal
          visible={broadcastModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setBroadcastModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <Text style={styles.modalTitle}>Start Live Broadcast 🔴</Text>
              <Text style={styles.modalSubtitle}>
                Stream directly to followers across the Caribbean and global diaspora.
              </Text>

              <Text style={styles.formLabel}>Stream Title *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. Kingston Dub Hour / Carnival Mas Preview"
                placeholderTextColor={TOKENS.textMuted}
                value={broadcastTitle}
                onChangeText={setBroadcastTitle}
              />

              <Text style={styles.formLabel}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 6 }}>
                {LIVE_CATEGORIES.filter((c) => c !== 'All Broadcasts').map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.chip, broadcastCategory === cat && styles.chipActive]}
                    onPress={() => setBroadcastCategory(cat)}
                  >
                    <Text style={styles.chipText}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TouchableOpacity
                style={[styles.startBroadcastBtn, broadcasting && { opacity: 0.6 }]}
                onPress={handleStartBroadcast}
                disabled={broadcasting}
              >
                {broadcasting ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.startBroadcastBtnText}>🔴 Go Live Now</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.closeModalBtn}
                onPress={() => setBroadcastModalVisible(false)}
              >
                <Text style={styles.closeModalText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: TOKENS.canvas },
  container: { flex: 1 },
  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  liveBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveIndicator: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444' },
  liveBadgeText: { fontSize: 10, fontWeight: '900', color: '#EF4444', letterSpacing: 0.8 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: TOKENS.textPrimary, marginTop: 2 },
  goLiveBtn: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  goLiveBtnText: { color: '#FFF', fontSize: 12, fontWeight: '900' },
  categoryRail: { maxHeight: 42, marginVertical: 4 },
  categoryRailContent: { paddingHorizontal: 16, gap: 8 },
  chip: {
    backgroundColor: TOKENS.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: TOKENS.border,
  },
  chipActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    borderColor: '#EF4444',
  },
  chipText: { color: TOKENS.textPrimary, fontSize: 11, fontWeight: '700' },
  content: { flex: 1, padding: 16 },
  streamViewerCard: {
    backgroundColor: TOKENS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: TOKENS.border,
    overflow: 'hidden',
    marginBottom: 20,
  },
  videoBox: {
    height: 220,
    backgroundColor: '#000',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlaceholder: { alignItems: 'center' },
  broadcastIcon: { fontSize: 44, marginBottom: 8 },
  broadcastStatus: { color: TOKENS.textMuted, fontSize: 12, fontWeight: '700' },
  viewerBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  viewerBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '800' },
  streamDetails: { padding: 14 },
  streamTitle: { color: TOKENS.textPrimary, fontSize: 16, fontWeight: '900' },
  streamHost: { color: TOKENS.textMuted, fontSize: 12, marginTop: 4 },
  chatContainer: {
    backgroundColor: TOKENS.raised,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: TOKENS.border,
  },
  chatHeader: { color: TOKENS.textMuted, fontSize: 11, fontWeight: '800', marginBottom: 8 },
  chatScroll: { maxHeight: 100, marginBottom: 10 },
  chatMsg: { flexDirection: 'row', marginBottom: 4 },
  chatUser: { color: TOKENS.action, fontSize: 11, fontWeight: '800' },
  chatText: { color: TOKENS.textPrimary, fontSize: 11, flex: 1 },
  chatInputRow: { flexDirection: 'row', gap: 8 },
  chatInput: {
    flex: 1,
    backgroundColor: TOKENS.surface,
    borderWidth: 1,
    borderColor: TOKENS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: TOKENS.textPrimary,
    fontSize: 12,
  },
  sendChatBtn: {
    backgroundColor: TOKENS.action,
    paddingHorizontal: 14,
    borderRadius: 12,
    justifyContent: 'center',
  },
  sendChatBtnText: { color: '#090D1A', fontSize: 12, fontWeight: '900' },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: TOKENS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: TOKENS.border,
  },
  emptyIcon: { fontSize: 44, marginBottom: 10 },
  emptyTitle: { color: TOKENS.textPrimary, fontSize: 16, fontWeight: '800' },
  emptySubtitle: {
    color: TOKENS.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  emptyGoLiveBtn: {
    marginTop: 16,
    backgroundColor: '#EF4444',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
  },
  emptyGoLiveText: { color: '#FFF', fontSize: 13, fontWeight: '900' },
  otherStreamsSection: { marginTop: 14 },
  sectionTitle: { color: TOKENS.textPrimary, fontSize: 14, fontWeight: '800', marginBottom: 10 },
  streamRowCard: {
    backgroundColor: TOKENS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: TOKENS.border,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  streamRowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  streamRowTitle: { color: TOKENS.textPrimary, fontSize: 13, fontWeight: '800' },
  streamRowMeta: { color: TOKENS.textMuted, fontSize: 11, marginTop: 2 },
  streamRowWatch: { color: TOKENS.action, fontSize: 12, fontWeight: '800' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: TOKENS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderTopWidth: 1,
    borderColor: TOKENS.border,
  },
  modalTitle: { color: TOKENS.textPrimary, fontSize: 18, fontWeight: '900' },
  modalSubtitle: { color: TOKENS.textMuted, fontSize: 12, marginTop: 4, marginBottom: 16 },
  formLabel: { color: TOKENS.textPrimary, fontSize: 12, fontWeight: '800', marginTop: 8, marginBottom: 6 },
  formInput: {
    backgroundColor: TOKENS.canvas,
    borderWidth: 1,
    borderColor: TOKENS.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: TOKENS.textPrimary,
    fontSize: 14,
  },
  startBroadcastBtn: {
    backgroundColor: '#EF4444',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  startBroadcastBtnText: { color: '#FFF', fontSize: 14, fontWeight: '900' },
  closeModalBtn: { paddingVertical: 12, alignItems: 'center', marginTop: 6 },
  closeModalText: { color: TOKENS.textMuted, fontSize: 13, fontWeight: '700' },
});
