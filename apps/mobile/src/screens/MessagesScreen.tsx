import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  SafeAreaView,
} from 'react-native';
import { TOKENS } from '../theme/tokens';
import { supabase } from '../lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ConversationItem {
  id: string;
  name: string;
  preview: string;
  unread: number;
  lastMessageAt?: string | null;
}

interface MessageItem {
  id: string;
  sender_id: string;
  body: string;
  content?: string;
  created_at: string;
  sequence_number?: number;
}

interface SearchProfileItem {
  id: string;
  display_name: string;
  username: string;
  avatar_url?: string | null;
  country?: string | null;
  is_verified?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateClientMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function formatTime(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function MessagesScreen({ route, navigation }: any) {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState<string>('');
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  // New Chat User Search state
  const [newChatModalOpen, setNewChatModalOpen] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchProfileItem[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [startingChatId, setStartingChatId] = useState<string | null>(null);

  const flatListRef = useRef<FlatList>(null);
  const realtimeChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ── Load current user ──────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    });
  }, []);

  // ── Check route params for direct conversation deep link ──────────────────
  useEffect(() => {
    if (route?.params?.conversationId) {
      handleSelectConversation({
        id: route.params.conversationId,
        name: route.params.targetName || 'Direct Message',
        preview: 'Conversation opened',
        unread: 0,
      });
    }
  }, [route?.params?.conversationId]);

  // ── Load conversations list ────────────────────────────────────────────────
  const loadConversations = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoadingConversations(false); return; }

      const { data: members, error } = await supabase
        .from('conversation_members')
        .select('conversation_id, last_read_sequence, conversations(id, kind, title, last_message_at, last_sequence_number)')
        .eq('profile_id', user.id)
        .is('left_at', null)
        .order('last_message_at', { ascending: false, foreignTable: 'conversations' });

      if (error) throw error;

      const items: ConversationItem[] = (members || []).map((m: any) => {
        const conv = m.conversations;
        const unread = Math.max(0, (conv?.last_sequence_number || 0) - (m.last_read_sequence || 0));
        return {
          id: conv?.id || m.conversation_id,
          name: conv?.title || (conv?.kind === 'group' ? 'Group Chat' : 'Direct Message'),
          preview: 'Tap to view messages',
          unread,
          lastMessageAt: conv?.last_message_at,
        };
      });
      setConversations(items);
    } catch (err) {
      console.warn('[MessagesScreen] loadConversations error:', err);
    } finally {
      setLoadingConversations(false);
    }
  }, []);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  // ── Load messages for selected conversation ───────────────────────────────
  const loadMessages = useCallback(async (conversationId: string) => {
    setLoadingMessages(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('id, sender_id, body, created_at, sequence_number')
        .eq('conversation_id', conversationId)
        .is('deleted_at', null)
        .order('sequence_number', { ascending: true })
        .limit(50);

      if (error) throw error;
      const normalized: MessageItem[] = (data || []).map((m: any) => ({
        ...m,
        body: m.body || m.content || '',
        content: m.body || m.content || '',
      }));
      setMessages(normalized);
      // Scroll to bottom
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100);
    } catch (err) {
      console.warn('[MessagesScreen] loadMessages error:', err);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  // ── Handle conversation selection ─────────────────────────────────────────
  const handleSelectConversation = useCallback((item: ConversationItem) => {
    // Unsubscribe from previous realtime channel
    if (realtimeChannelRef.current) {
      supabase.removeChannel(realtimeChannelRef.current);
      realtimeChannelRef.current = null;
    }
    setSelectedId(item.id);
    setSelectedName(item.name);
    setMessages([]);
    loadMessages(item.id);

    // Subscribe to realtime updates for this conversation
    const channel = supabase
      .channel(`conversation:${item.id}:messages`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${item.id}` },
        (payload) => {
          const newMsg = payload.new as MessageItem;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${item.id}` },
        (payload) => {
          const updated = payload.new as MessageItem;
          setMessages((prev) =>
            prev.map((m) => (m.id === updated.id ? { ...m, ...updated } : m))
          );
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${item.id}` },
        (payload) => {
          const deleted = payload.old as { id: string };
          setMessages((prev) =>
            prev.map((m) =>
              m.id === deleted.id
                ? { ...m, content: 'This message was deleted.', deleted_at: new Date().toISOString() } as any
                : m
            )
          );
        }
      )
      .on('broadcast', { event: 'typing' }, (payload) => {
        if (payload.payload?.userId !== currentUserId) {
          const name = payload.payload?.userName || item.name;
          setTypingUsers((prev) => (prev.includes(name) ? prev : [...prev, name]));
          setTimeout(() => {
            setTypingUsers((prev) => prev.filter((u) => u !== name));
          }, 3000);
        }
      })
      .subscribe();

    realtimeChannelRef.current = channel;

    // Mark conversation as read
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      Promise.resolve(supabase.rpc('mark_conversation_read', { conv_id: item.id })).catch(() => {});
    });
  }, [loadMessages]);

  // Cleanup realtime on unmount
  useEffect(() => {
    return () => {
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current);
      }
    };
  }, []);

  // ── Search users to start new conversation ────────────────────────────────
  const handleSearchUsers = async (query: string) => {
    setUserSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchingUsers(true);
    try {
      const sanitized = query.replace(/^@/, '').trim();
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, username, avatar_url, country, is_verified')
        .or(`display_name.ilike.%${sanitized}%,username.ilike.%${sanitized}%`)
        .limit(15);

      if (!error && data) {
        // Filter out self
        const filtered = data.filter((p: any) => p.id !== currentUserId);
        setSearchResults(filtered);
      }
    } catch (err) {
      console.warn('Error searching users:', err);
    } finally {
      setSearchingUsers(false);
    }
  };

  // ── Start conversation with a user ────────────────────────────────────────
  const handleStartChatWithUser = async (targetUser: SearchProfileItem) => {
    setStartingChatId(targetUser.id);
    try {
      const { data: convId, error } = await supabase.rpc('get_or_create_direct_conversation', {
        target_user_id: targetUser.id,
      });

      if (error) {
        Alert.alert('Could Not Start Chat', error.message);
        return;
      }

      setNewChatModalOpen(false);
      setUserSearchQuery('');
      setSearchResults([]);

      // Select and open thread
      handleSelectConversation({
        id: convId,
        name: targetUser.display_name || targetUser.username,
        preview: 'Conversation started',
        unread: 0,
      });

      // Reload conversations list in background
      loadConversations();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not start conversation');
    } finally {
      setStartingChatId(null);
    }
  };

  // ── Send message ──────────────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    const text = draft.trim();
    if (!text || !selectedId || !currentUserId || sending) return;

    const clientMessageId = generateClientMessageId();
    setDraft('');
    setSending(true);

    // Optimistic update
    const optimistic: MessageItem = {
      id: clientMessageId,
      sender_id: currentUserId,
      body: text,
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: selectedId,
          sender_id: currentUserId,
          body: text,
          client_message_id: clientMessageId,
        });

      if (error) {
        // Remove optimistic message on failure
        setMessages((prev) => prev.filter((m) => m.id !== clientMessageId));
        Alert.alert('Send Failed', error.message || 'Could not send message. Please try again.');
      }
    } catch (err: any) {
      setMessages((prev) => prev.filter((m) => m.id !== clientMessageId));
      Alert.alert('Send Failed', 'Could not send message. Please try again.');
    } finally {
      setSending(false);
    }
  }, [draft, selectedId, currentUserId, sending]);

  // ─── Render ────────────────────────────────────────────────────────────────

  if (loadingConversations) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={TOKENS.action} />
        <Text style={styles.loadingText}>Connecting to Caribbean Messages…</Text>
      </View>
    );
  }

  // ── Thread View ────────────────────────────────────────────────────────────
  if (selectedId) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        {/* Header */}
        <View style={styles.threadHeader}>
          <TouchableOpacity onPress={() => {
            setSelectedId(null);
            setSelectedName('');
            setMessages([]);
            if (realtimeChannelRef.current) {
              supabase.removeChannel(realtimeChannelRef.current);
              realtimeChannelRef.current = null;
            }
          }} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.threadTitle} numberOfLines={1}>{selectedName}</Text>
        </View>

        {/* Messages */}
        {loadingMessages ? (
          <View style={styles.centered}>
            <ActivityIndicator size="small" color={TOKENS.action} />
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.centered}>
            <Text style={styles.emptyTitle}>No messages yet</Text>
            <Text style={styles.emptySubtitle}>Say hello to start the conversation! 🌴</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messageListContent}
            renderItem={({ item }) => {
              const isMine = item.sender_id === currentUserId;
              return (
                <View style={[styles.bubbleRow, isMine && styles.bubbleRowMine]}>
                  <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
                    <Text style={[styles.bubbleText, isMine && styles.bubbleTextMine]}>
                      {item.body || item.content}
                    </Text>
                    <Text style={styles.bubbleTime}>{formatTime(item.created_at)}</Text>
                  </View>
                </View>
              );
            }}
          />
        )}

        {typingUsers.length > 0 && (
          <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
            <Text style={{ color: TOKENS.action, fontSize: 12, fontStyle: 'italic', fontWeight: 'bold' }}>
              {typingUsers.join(', ')} is typing…
            </Text>
          </View>
        )}

        {/* Composer */}
        <View style={styles.composerBar}>
          <TextInput
            style={styles.input}
            placeholder="Write a message…"
            placeholderTextColor={TOKENS.textMuted}
            value={draft}
            onChangeText={(text) => {
              setDraft(text);
              if (realtimeChannelRef.current && !typingTimeoutRef.current) {
                realtimeChannelRef.current.send({
                  type: 'broadcast',
                  event: 'typing',
                  payload: { userId: currentUserId, userName: 'User' },
                });
                typingTimeoutRef.current = setTimeout(() => {
                  typingTimeoutRef.current = null;
                }, 2500);
              }
            }}
            multiline
            maxLength={2000}
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!draft.trim() || sending) && { opacity: 0.5 }]}
            disabled={!draft.trim() || sending}
            onPress={handleSend}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.sendText}>Send</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // ── Conversation List ──────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* Header with New Chat Button */}
      <View style={styles.listHeader}>
        <Text style={styles.listHeaderTitle}>Messages</Text>
        <TouchableOpacity
          style={styles.newChatBtn}
          onPress={() => setNewChatModalOpen(true)}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Start a new message"
        >
          <Text style={styles.newChatBtnText}>+ New Chat</Text>
        </TouchableOpacity>
      </View>

      {conversations.length === 0 ? (
        <View style={styles.centered}>
          <View style={styles.emptyIconCircle}>
            <Text style={styles.emptyIconText}>💬</Text>
          </View>
          <Text style={styles.emptyTitle}>No Conversations Yet</Text>
          <Text style={styles.emptySubtitle}>
            Connect with friends, merchants, and creator communities across the Caribbean diaspora.
          </Text>
          <TouchableOpacity
            style={styles.findPeopleBtn}
            onPress={() => setNewChatModalOpen(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.findPeopleBtnText}>Find Members to Chat →</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.chatCard}
              onPress={() => handleSelectConversation(item)}
              activeOpacity={0.75}
            >
              <View style={styles.chatAvatar}>
                <Text style={styles.chatAvatarText}>{item.name.slice(0, 2).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.chatName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.chatTime}>{formatTime(item.lastMessageAt)}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 3 }}>
                  <Text style={styles.chatPreview} numberOfLines={1}>{item.preview}</Text>
                  {item.unread > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadText}>{item.unread > 99 ? '99+' : item.unread}</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* New Chat / User Search Modal */}
      <Modal
        visible={newChatModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setNewChatModalOpen(false)}
      >
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle}>Start Conversation 🌴</Text>
              <TouchableOpacity
                onPress={() => {
                  setNewChatModalOpen(false);
                  setUserSearchQuery('');
                  setSearchResults([]);
                }}
                style={styles.modalCloseBtn}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={styles.modalSearchBox}>
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Search by name or @username..."
                placeholderTextColor={TOKENS.textMuted}
                value={userSearchQuery}
                onChangeText={handleSearchUsers}
                autoFocus
                autoCapitalize="none"
              />
            </View>

            {/* Results */}
            {searchingUsers ? (
              <View style={styles.modalCentered}>
                <ActivityIndicator size="small" color={TOKENS.action} />
                <Text style={styles.searchStatusText}>Searching Caribbean members…</Text>
              </View>
            ) : searchResults.length === 0 ? (
              <View style={styles.modalCentered}>
                <Text style={styles.searchEmptyTitle}>
                  {userSearchQuery.trim() ? 'No members found' : 'Type to search members'}
                </Text>
                <Text style={styles.searchEmptySubtitle}>
                  {userSearchQuery.trim()
                    ? 'Check the spelling or try searching by username'
                    : 'Search anyone across the Caribbean network to message directly'}
                </Text>
              </View>
            ) : (
              <FlatList
                data={searchResults}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ padding: 16 }}
                renderItem={({ item }) => {
                  const isStarting = startingChatId === item.id;
                  return (
                    <TouchableOpacity
                      style={styles.userResultCard}
                      onPress={() => handleStartChatWithUser(item)}
                      disabled={isStarting}
                      activeOpacity={0.75}
                    >
                      <View style={styles.userResultAvatar}>
                        <Text style={styles.userResultAvatarText}>
                          {(item.display_name || item.username).slice(0, 2).toUpperCase()}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Text style={styles.userResultName}>{item.display_name || item.username}</Text>
                          {item.is_verified && <Text style={{ fontSize: 12 }}>✓</Text>}
                        </View>
                        <Text style={styles.userResultHandle}>@{item.username}</Text>
                        {item.country && <Text style={styles.userResultCountry}>📍 {item.country}</Text>}
                      </View>
                      {isStarting ? (
                        <ActivityIndicator size="small" color={TOKENS.action} />
                      ) : (
                        <Text style={styles.startChatAction}>Message →</Text>
                      )}
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: TOKENS.canvas },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  loadingText: { color: TOKENS.textMuted, fontSize: 13, marginTop: 12, fontWeight: '600' },

  // Conversation list
  listHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: TOKENS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  listHeaderTitle: { color: TOKENS.textPrimary, fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  newChatBtn: {
    backgroundColor: TOKENS.action,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  newChatBtnText: { color: '#090D1A', fontSize: 12, fontWeight: '900' },
  listContent: { padding: 16, paddingBottom: 32 },
  chatCard: {
    backgroundColor: TOKENS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: TOKENS.border,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  chatAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,180,216,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatAvatarText: { color: TOKENS.actionSecondary, fontWeight: '800', fontSize: 13 },
  chatName: { color: TOKENS.textPrimary, fontSize: 14, fontWeight: '800', flex: 1 },
  chatTime: { color: TOKENS.textMuted, fontSize: 10, fontWeight: '500' },
  chatPreview: { color: TOKENS.textMuted, fontSize: 12, flex: 1 },
  unreadBadge: {
    backgroundColor: TOKENS.action,
    borderRadius: 999,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  unreadText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0,180,216,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyIconText: { fontSize: 28 },
  emptyTitle: { color: TOKENS.textPrimary, fontSize: 16, fontWeight: '800', marginBottom: 6 },
  emptySubtitle: { color: TOKENS.textMuted, fontSize: 12, textAlign: 'center', lineHeight: 18, maxWidth: 280, marginBottom: 16 },
  findPeopleBtn: {
    backgroundColor: TOKENS.action,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
  },
  findPeopleBtnText: { color: '#090D1A', fontSize: 13, fontWeight: '900' },

  // Thread view
  threadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: TOKENS.border,
    backgroundColor: TOKENS.surface,
    gap: 12,
  },
  backBtn: { paddingVertical: 4, paddingRight: 8 },
  backBtnText: { color: TOKENS.action, fontWeight: '700', fontSize: 14 },
  threadTitle: { color: TOKENS.textPrimary, fontSize: 16, fontWeight: '800', flex: 1 },
  messageListContent: { padding: 16, paddingBottom: 8 },
  bubbleRow: { flexDirection: 'row', marginBottom: 8, justifyContent: 'flex-start' },
  bubbleRowMine: { justifyContent: 'flex-end' },
  bubble: {
    maxWidth: '78%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: TOKENS.raised,
    borderWidth: 1,
    borderColor: TOKENS.border,
  },
  bubbleMine: {
    backgroundColor: TOKENS.action,
    borderColor: 'transparent',
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    borderBottomLeftRadius: 4,
  },
  bubbleText: { color: TOKENS.textPrimary, fontSize: 14, lineHeight: 20 },
  bubbleTextMine: { color: '#090D1A', fontWeight: '600' },
  bubbleTime: { color: 'rgba(255,255,255,0.55)', fontSize: 10, marginTop: 4, textAlign: 'right' },

  // Composer
  composerBar: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: TOKENS.surface,
    borderTopWidth: 1,
    borderTopColor: TOKENS.border,
    gap: 10,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: TOKENS.canvas,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: TOKENS.border,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: TOKENS.textPrimary,
    fontSize: 14,
    maxHeight: 100,
  },
  sendBtn: {
    backgroundColor: TOKENS.action,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 10,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendText: { color: '#090D1A', fontSize: 13, fontWeight: '900' },

  // User Search Modal
  modalSafe: { flex: 1, backgroundColor: TOKENS.canvas },
  modalContent: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: TOKENS.border,
  },
  modalHeaderTitle: { color: TOKENS.textPrimary, fontSize: 18, fontWeight: '900' },
  modalCloseBtn: { padding: 4 },
  modalCloseText: { color: TOKENS.textMuted, fontSize: 18, fontWeight: '700' },
  modalSearchBox: { paddingHorizontal: 16, paddingVertical: 12 },
  modalSearchInput: {
    backgroundColor: TOKENS.surface,
    borderWidth: 1,
    borderColor: TOKENS.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: TOKENS.textPrimary,
    fontSize: 14,
  },
  modalCentered: { padding: 40, alignItems: 'center' },
  searchStatusText: { color: TOKENS.textMuted, fontSize: 13, marginTop: 10 },
  searchEmptyTitle: { color: TOKENS.textPrimary, fontSize: 15, fontWeight: '800' },
  searchEmptySubtitle: { color: TOKENS.textMuted, fontSize: 12, textAlign: 'center', marginTop: 4 },
  userResultCard: {
    backgroundColor: TOKENS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: TOKENS.border,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  userResultAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: TOKENS.raised,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: TOKENS.border,
  },
  userResultAvatarText: { color: TOKENS.action, fontSize: 14, fontWeight: '900' },
  userResultName: { color: TOKENS.textPrimary, fontSize: 14, fontWeight: '800' },
  userResultHandle: { color: TOKENS.textMuted, fontSize: 11 },
  userResultCountry: { color: TOKENS.action, fontSize: 10, marginTop: 2, fontWeight: '700' },
  startChatAction: { color: TOKENS.action, fontSize: 12, fontWeight: '800' },
});
