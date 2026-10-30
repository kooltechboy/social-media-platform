import React, { useState, useEffect } from 'react';
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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Video as ExpoVideo, ResizeMode } from 'expo-av';
import { Ionicons as ExpoIonicons } from '@expo/vector-icons';
import { TOKENS } from '../theme/tokens';
import { supabase } from '../lib/supabase';

const Video = ExpoVideo as unknown as React.ComponentType<any>;
const Ionicons = ExpoIonicons as unknown as React.ComponentType<any>;

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
  playbackHlsUrl?: string | null;
  rtmpsUrl?: string | null;
  webrtcUrl?: string | null;
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

export function LiveScreen({ navigation }: any = {}) {
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
  const [chatMessages, setChatMessages] = useState<
    Array<{ id: string; user: string; text: string }>
  >([]);
  const [chatInput, setChatInput] = useState('');

  const handleBack = () => {
    if (navigation?.canGoBack && !navigation.canGoBack()) {
      navigation?.navigate?.('Home');
      return;
    }
    navigation?.goBack?.();
  };

  const fetchStreams = async () => {
    try {
      let query = supabase
        .from('livestreams')
        .select(`
          id, title, state, peak_viewers, started_at, category, location_tag,
          playback_hls_url, playback_dash_url, webrtc_url, rtmps_url,
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
          const livePlaybackUrl = d.playback_hls_url || d.webrtc_url || d.playback_dash_url || null;
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
            videoUrl: livePlaybackUrl,
            playbackHlsUrl: d.playback_hls_url,
            rtmpsUrl: d.rtmps_url,
            webrtcUrl: d.webrtc_url,
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

  useEffect(() => {
    if (!activeStream?.id) {
      setChatMessages([]);
      return;
    }
    const fetchChat = async () => {
      const { data } = await supabase
        .from('live_messages')
        .select(`
          id,
          body,
          sender_id,
          profiles:sender_id (display_name, username)
        `)
        .eq('livestream_id', activeStream.id)
        .order('created_at', { ascending: true })
        .limit(50);

      if (data) {
        setChatMessages(
          data.map((m: any) => ({
            id: String(m.id),
            user: m.profiles?.display_name || m.profiles?.username || 'Viewer',
            text: m.body,
          }))
        );
      }
    };
    fetchChat();

    const channel = supabase
      .channel(`live_chat_${activeStream.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'live_messages',
          filter: `livestream_id=eq.${activeStream.id}`,
        },
        (payload) => {
          setChatMessages((prev) => [
            ...prev,
            {
              id: String(payload.new.id),
              user: 'Viewer',
              text: payload.new.body,
            },
          ]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeStream?.id]);

  const handleSendChat = async () => {
    if (!chatInput.trim() || !activeStream) return;
    const text = chatInput.trim();
    setChatInput('');
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('live_messages').insert({
          livestream_id: activeStream.id,
          sender_id: user.id,
          body: text,
        });
      } else {
        setChatMessages((prev) => [
          ...prev,
          { id: Date.now().toString(), user: 'You (Guest)', text },
        ]);
      }
    } catch {
      // Non-blocking
    }
  };

  const handleStartBroadcast = async () => {
    if (!broadcastTitle.trim()) {
      Alert.alert(
        'Title Required',
        'Please enter a title for your live broadcast.'
      );
      return;
    }

    setBroadcasting(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Sign In Required', 'Please sign in to go live.');
        setBroadcasting(false);
        return;
      }

      const { error } = await supabase
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

      Alert.alert(
        'You Are Live',
        'Broadcast initialized. Your audience is joining!'
      );
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
        {/* Executive Midnight Reef Header with Back Escape */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={handleBack}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Exit Live"
            >
              <Ionicons
                name="chevron-back"
                size={21}
                color={TOKENS.textPrimary}
              />
            </TouchableOpacity>
            <View>
              <View style={styles.liveBadgeRow}>
                <View style={styles.liveIndicator} />
                <Text style={styles.liveBadgeText}>LIVE NETWORK</Text>
              </View>
              <Text style={styles.headerTitle}>Caribbean Live</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.goLiveBtn}
            onPress={() => setBroadcastModalVisible(true)}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Start a live broadcast"
          >
            <Ionicons name="radio" size={14} color={TOKENS.textPrimary} />
            <Text style={styles.goLiveBtnText}>Go Live</Text>
          </TouchableOpacity>
        </View>

        {/* Category Filter Rail */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryRail}
          contentContainerStyle={styles.categoryRailContent}
        >
          {LIVE_CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.chip, isActive && styles.chipActive]}
                onPress={() => setSelectedCategory(cat)}
                activeOpacity={0.8}
              >
                <Text
                  style={[styles.chipText, isActive && styles.chipTextActive]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Active Stream Viewer or Empty */}
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
                  fetchStreams();
                }}
                tintColor={TOKENS.teal}
              />
            }
          >
            {activeStream ? (
              <View style={styles.streamViewerCard}>
                {/* Video Player or Midnight Reef Broadcast Stage */}
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
                      <View style={styles.broadcastSignalCircle}>
                        <Ionicons name="radio" size={32} color={TOKENS.teal} />
                      </View>
                      <Text style={styles.broadcastStatus}>
                        Broadcasting Live from {activeStream.location}
                      </Text>
                    </View>
                  )}

                  {/* Top-Left Live Tag */}
                  <View style={styles.stageLivePill}>
                    <View style={styles.stageLiveDot} />
                    <Text style={styles.stageLiveText}>LIVE</Text>
                  </View>

                  {/* Top-Right Viewer Count Badge */}
                  <View style={styles.viewerBadge}>
                    <Ionicons
                      name="eye-outline"
                      size={13}
                      color={TOKENS.teal}
                    />
                    <Text style={styles.viewerBadgeText}>
                      {activeStream.peakViewers} watching
                    </Text>
                  </View>
                </View>

                {/* Stream Info */}
                <View style={styles.streamDetails}>
                  <View style={styles.streamCategoryRow}>
                    <View style={styles.categoryPill}>
                      <Text style={styles.categoryPillText}>
                        {activeStream.category}
                      </Text>
                    </View>
                    <Text style={styles.locationMeta}>
                      {activeStream.location}
                    </Text>
                  </View>
                  <Text style={styles.streamTitle}>{activeStream.title}</Text>
                  <View style={styles.hostRow}>
                    <View style={styles.hostAvatarBadge}>
                      <Text style={styles.hostAvatarInitial}>
                        {activeStream.creatorName[0]?.toUpperCase() || 'C'}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.streamHostName}>
                        {activeStream.creatorName}
                      </Text>
                      <Text style={styles.streamHostHandle}>
                        {activeStream.creatorHandle}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Live Community Chat */}
                <View style={styles.chatContainer}>
                  <View style={styles.chatHeaderRow}>
                    <Ionicons
                      name="flame-outline"
                      size={14}
                      color={TOKENS.teal}
                    />
                    <Text style={styles.chatHeader}>Live Community Chat</Text>
                  </View>

                  <ScrollView style={styles.chatScroll} nestedScrollEnabled>
                    {chatMessages.length === 0 ? (
                      <Text style={styles.chatEmptyHint}>
                        Say hello to {activeStream.creatorName} and the live room.
                      </Text>
                    ) : (
                      chatMessages.map((msg) => (
                        <View key={msg.id} style={styles.chatMsg}>
                          <Text style={styles.chatUser}>{msg.user}: </Text>
                          <Text style={styles.chatText}>{msg.text}</Text>
                        </View>
                      ))
                    )}
                  </ScrollView>

                  {/* Chat Input */}
                  <View style={styles.chatInputRow}>
                    <TextInput
                      style={styles.chatInput}
                      placeholder="Send message to broadcaster..."
                      placeholderTextColor={TOKENS.textDim}
                      value={chatInput}
                      onChangeText={setChatInput}
                      onSubmitEditing={handleSendChat}
                    />
                    <TouchableOpacity
                      style={[
                        styles.sendChatBtn,
                        !chatInput.trim() && styles.sendChatBtnDisabled,
                      ]}
                      onPress={handleSendChat}
                      activeOpacity={0.85}
                      accessibilityRole="button"
                      accessibilityLabel="Send chat message"
                    >
                      <Text style={styles.sendChatBtnText}>Send</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconCircle}>
                  <Ionicons
                    name="mic-outline"
                    size={34}
                    color={TOKENS.teal}
                  />
                </View>
                <Text style={styles.emptyTitle}>
                  No live broadcasts right now
                </Text>
                <Text style={styles.emptySubtitle}>
                  Be the first voice to go live and connect creators across the Caribbean and global diaspora.
                </Text>
                <TouchableOpacity
                  style={styles.emptyGoLiveBtn}
                  onPress={() => setBroadcastModalVisible(true)}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name="radio"
                    size={16}
                    color={TOKENS.actionText}
                  />
                  <Text style={styles.emptyGoLiveText}>Start Broadcasting</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Other Streams */}
            {streams.length > 1 && (
              <View style={styles.otherStreamsSection}>
                <Text style={styles.sectionTitle}>More Live Streams</Text>
                {streams
                  .filter((s) => s.id !== activeStream?.id)
                  .map((stream) => (
                    <TouchableOpacity
                      key={stream.id}
                      style={styles.streamRowCard}
                      onPress={() => setActiveStream(stream)}
                      activeOpacity={0.85}
                    >
                      <View style={styles.streamRowIcon}>
                        <Ionicons
                          name="tv-outline"
                          size={19}
                          color={TOKENS.action}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.streamRowTitle} numberOfLines={1}>
                          {stream.title}
                        </Text>
                        <Text style={styles.streamRowMeta} numberOfLines={1}>
                          {stream.creatorName} • {stream.peakViewers} viewers
                        </Text>
                      </View>
                      <View style={styles.watchActionWrap}>
                        <Text style={styles.streamRowWatch}>Watch</Text>
                        <Ionicons
                          name="chevron-forward"
                          size={14}
                          color={TOKENS.teal}
                        />
                      </View>
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
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalOverlay}
          >
            <View style={styles.modalSheet}>
              <View style={styles.modalHeaderRow}>
                <View style={styles.modalTitleGroup}>
                  <View style={styles.modalIconBadge}>
                    <Ionicons name="radio" size={18} color={TOKENS.danger} />
                  </View>
                  <Text style={styles.modalTitle}>Start Live Broadcast</Text>
                </View>
                <TouchableOpacity
                  style={styles.modalCloseIconBtn}
                  onPress={() => setBroadcastModalVisible(false)}
                  accessibilityLabel="Close broadcast modal"
                >
                  <Ionicons
                    name="close"
                    size={18}
                    color={TOKENS.textPrimary}
                  />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSubtitle}>
                Stream directly to followers across the Caribbean and global diaspora.
              </Text>

              <Text style={styles.formLabel}>Stream Title *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. Kingston Dub Session / Carnival Mas Preview"
                placeholderTextColor={TOKENS.textDim}
                value={broadcastTitle}
                onChangeText={setBroadcastTitle}
              />

              <Text style={styles.formLabel}>Category</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginVertical: 6 }}
                contentContainerStyle={{ gap: 8 }}
              >
                {LIVE_CATEGORIES.filter((c) => c !== 'All Broadcasts').map(
                  (cat) => {
                    const isActive = broadcastCategory === cat;
                    return (
                      <TouchableOpacity
                        key={cat}
                        style={[styles.chip, isActive && styles.chipActive]}
                        onPress={() => setBroadcastCategory(cat)}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            isActive && styles.chipTextActive,
                          ]}
                        >
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    );
                  }
                )}
              </ScrollView>

              <TouchableOpacity
                style={[
                  styles.startBroadcastBtn,
                  broadcasting && { opacity: 0.6 },
                ]}
                onPress={handleStartBroadcast}
                disabled={broadcasting}
                activeOpacity={0.85}
              >
                {broadcasting ? (
                  <ActivityIndicator color={TOKENS.actionText} />
                ) : (
                  <View style={styles.startBtnInner}>
                    <Ionicons
                      name="radio"
                      size={16}
                      color={TOKENS.actionText}
                    />
                    <Text style={styles.startBroadcastBtnText}>
                      Go Live Now
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.closeModalBtn}
                onPress={() => setBroadcastModalVisible(false)}
              >
                <Text style={styles.closeModalText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Modal>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: TOKENS.surface,
    borderBottomWidth: 1,
    borderBottomColor: TOKENS.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: TOKENS.raised,
    borderWidth: 1,
    borderColor: TOKENS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveIndicator: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: TOKENS.danger,
  },
  liveBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: TOKENS.danger,
    letterSpacing: 0.9,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: TOKENS.textPrimary,
    marginTop: 1,
  },
  goLiveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: TOKENS.danger,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
  },
  goLiveBtnText: {
    color: TOKENS.textPrimary,
    fontSize: 12,
    fontWeight: '800',
  },
  categoryRail: {
    maxHeight: 48,
    marginTop: 8,
  },
  categoryRailContent: {
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 8,
  },
  chip: {
    backgroundColor: TOKENS.surface,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: TOKENS.border,
  },
  chipActive: {
    backgroundColor: TOKENS.tealSoft,
    borderColor: TOKENS.borderActive,
  },
  chipText: {
    color: TOKENS.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  chipTextActive: {
    color: TOKENS.teal,
    fontWeight: '800',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  streamViewerCard: {
    backgroundColor: TOKENS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: TOKENS.border,
    overflow: 'hidden',
    marginBottom: 20,
  },
  videoBox: {
    height: 224,
    backgroundColor: TOKENS.oceanDepth,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlaceholder: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  broadcastSignalCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: TOKENS.tealSoft,
    borderWidth: 1,
    borderColor: TOKENS.borderActive,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  broadcastStatus: {
    color: TOKENS.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  stageLivePill: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: TOKENS.scrim,
    borderWidth: 1,
    borderColor: TOKENS.borderStrong,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  stageLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: TOKENS.danger,
  },
  stageLiveText: {
    color: TOKENS.textPrimary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  viewerBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: TOKENS.scrim,
    borderWidth: 1,
    borderColor: TOKENS.borderStrong,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  viewerBadgeText: {
    color: TOKENS.textPrimary,
    fontSize: 11,
    fontWeight: '700',
  },
  streamDetails: {
    padding: 16,
  },
  streamCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  categoryPill: {
    backgroundColor: TOKENS.oceanSoft,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryPillText: {
    color: TOKENS.action,
    fontSize: 10,
    fontWeight: '800',
  },
  locationMeta: {
    color: TOKENS.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  streamTitle: {
    color: TOKENS.textPrimary,
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 22,
  },
  hostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
  },
  hostAvatarBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: TOKENS.raised,
    borderWidth: 1,
    borderColor: TOKENS.borderActive,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hostAvatarInitial: {
    color: TOKENS.teal,
    fontSize: 14,
    fontWeight: '800',
  },
  streamHostName: {
    color: TOKENS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  streamHostHandle: {
    color: TOKENS.textMuted,
    fontSize: 11,
  },
  chatContainer: {
    backgroundColor: TOKENS.raised,
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: TOKENS.border,
  },
  chatHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  chatHeader: {
    color: TOKENS.textSecondary,
    fontSize: 12,
    fontWeight: '800',
  },
  chatScroll: {
    maxHeight: 110,
    marginBottom: 10,
  },
  chatEmptyHint: {
    color: TOKENS.textDim,
    fontSize: 12,
    paddingVertical: 6,
  },
  chatMsg: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  chatUser: {
    color: TOKENS.teal,
    fontSize: 12,
    fontWeight: '800',
  },
  chatText: {
    color: TOKENS.textPrimary,
    fontSize: 12,
    flex: 1,
  },
  chatInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chatInput: {
    flex: 1,
    backgroundColor: TOKENS.surface,
    borderWidth: 1,
    borderColor: TOKENS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: TOKENS.textPrimary,
    fontSize: 13,
  },
  sendChatBtn: {
    backgroundColor: TOKENS.teal,
    paddingHorizontal: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendChatBtnDisabled: {
    opacity: 0.55,
  },
  sendChatBtnText: {
    color: TOKENS.actionText,
    fontSize: 12,
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
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: TOKENS.tealSoft,
    borderWidth: 1,
    borderColor: TOKENS.borderActive,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    color: TOKENS.textPrimary,
    fontSize: 17,
    fontWeight: '800',
  },
  emptySubtitle: {
    color: TOKENS.textMuted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 19,
  },
  emptyGoLiveBtn: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: TOKENS.teal,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 999,
  },
  emptyGoLiveText: {
    color: TOKENS.actionText,
    fontSize: 13,
    fontWeight: '800',
  },
  otherStreamsSection: {
    marginTop: 8,
  },
  sectionTitle: {
    color: TOKENS.textPrimary,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 10,
  },
  streamRowCard: {
    backgroundColor: TOKENS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: TOKENS.border,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  streamRowIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: TOKENS.oceanSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streamRowTitle: {
    color: TOKENS.textPrimary,
    fontSize: 13,
    fontWeight: '800',
  },
  streamRowMeta: {
    color: TOKENS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  watchActionWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  streamRowWatch: {
    color: TOKENS.teal,
    fontSize: 12,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: TOKENS.scrim,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: TOKENS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderTopWidth: 1,
    borderColor: TOKENS.borderStrong,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: TOKENS.raised,
    borderWidth: 1,
    borderColor: TOKENS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: TOKENS.raised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    color: TOKENS.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  modalSubtitle: {
    color: TOKENS.textMuted,
    fontSize: 13,
    marginTop: 8,
    marginBottom: 16,
    lineHeight: 18,
  },
  formLabel: {
    color: TOKENS.textSecondary,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 8,
    marginBottom: 6,
  },
  formInput: {
    backgroundColor: TOKENS.raised,
    borderWidth: 1,
    borderColor: TOKENS.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: TOKENS.textPrimary,
    fontSize: 14,
  },
  startBroadcastBtn: {
    backgroundColor: TOKENS.teal,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 22,
  },
  startBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  startBroadcastBtnText: {
    color: TOKENS.actionText,
    fontSize: 14,
    fontWeight: '800',
  },
  closeModalBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  closeModalText: {
    color: TOKENS.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
});
