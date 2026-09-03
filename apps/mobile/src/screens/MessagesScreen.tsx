import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { TOKENS } from '../theme/tokens';
import { supabase } from '../lib/supabase';

interface ConversationItem {
  id: string;
  name: string;
  preview: string;
  unread: number;
  lastMessageAt?: string | null;
}

export function MessagesScreen() {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    async function loadConversations() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        const { data: members } = await supabase
          .from('conversation_members')
          .select('conversation_id, last_read_sequence, conversations(id, kind, title, last_message_at, last_sequence_number)')
          .eq('profile_id', user.id)
          .is('left_at', null)
          .order('last_message_at', { ascending: false, foreignTable: 'conversations' });

        if (members && members.length > 0) {
          const items: ConversationItem[] = members.map((m: any) => {
            const conv = m.conversations;
            const unread = Math.max(0, (conv?.last_sequence_number || 0) - (m.last_read_sequence || 0));
            return {
              id: conv?.id || m.conversation_id,
              name: conv?.title || (conv?.kind === 'group' ? 'Caribbean Group' : 'Direct Conversation'),
              preview: 'Tap to view conversation…',
              unread,
              lastMessageAt: conv?.last_message_at,
            };
          });
          setConversations(items);
        } else {
          setConversations([]);
        }
      } catch (err) {
        console.warn('[MessagesScreen] Failed to load conversations:', err);
      } finally {
        setLoading(false);
      }
    }

    loadConversations();
  }, []);

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={TOKENS.action} />
          <Text style={styles.loadingText}>Connecting to Caribbean Messages…</Text>
        </View>
      ) : conversations.length === 0 ? (
        <View style={styles.centered}>
          <View style={styles.emptyIconCircle}>
            <Text style={styles.emptyIconText}>💬</Text>
          </View>
          <Text style={styles.emptyTitle}>No Conversations Yet</Text>
          <Text style={styles.emptySubtitle}>
            Connect with friends, businesses, and creator communities across the Caribbean diaspora.
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const isSelected = item.id === selectedId;
            return (
              <TouchableOpacity
                style={[styles.chatCard, isSelected && styles.chatCardSelected]}
                onPress={() => setSelectedId(item.id)}
              >
                <View style={styles.chatAvatar}>
                  <Text style={styles.chatAvatarText}>{item.name.slice(0, 2).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={styles.chatName} numberOfLines={1}>{item.name}</Text>
                    {item.unread > 0 && (
                      <View style={styles.unreadBadge}>
                        <Text style={styles.unreadText}>{item.unread}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.chatPreview} numberOfLines={1}>
                    {item.preview}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      <View style={styles.composerBar}>
        <TextInput
          style={styles.input}
          placeholder="Write a message…"
          placeholderTextColor={TOKENS.textMuted}
          value={draft}
          onChangeText={setDraft}
        />
        <TouchableOpacity
          style={[styles.sendBtn, !draft.trim() && { opacity: 0.5 }]}
          disabled={!draft.trim()}
          onPress={() => {
            setDraft('');
          }}
        >
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: TOKENS.canvas },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  loadingText: { color: TOKENS.textMuted, fontSize: 13, marginTop: 12, fontWeight: '600' },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(2,132,199,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyIconText: { fontSize: 28 },
  emptyTitle: { color: TOKENS.textPrimary, fontSize: 16, fontWeight: '800', marginBottom: 6 },
  emptySubtitle: { color: TOKENS.textMuted, fontSize: 12, textAlign: 'center', lineHeight: 18, maxWidth: 280 },
  listContent: { padding: 16 },
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
  chatCardSelected: {
    borderColor: TOKENS.action,
    backgroundColor: 'rgba(2,132,199,0.08)',
  },
  chatAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(2,132,199,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatAvatarText: { color: TOKENS.action, fontWeight: '800', fontSize: 13 },
  chatName: { color: TOKENS.textPrimary, fontSize: 14, fontWeight: '800', flex: 1 },
  chatPreview: { color: TOKENS.textMuted, fontSize: 12, marginTop: 3 },
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
  composerBar: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: TOKENS.surface,
    borderTopWidth: 1,
    borderTopColor: TOKENS.border,
    gap: 10,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: TOKENS.canvas,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: TOKENS.border,
    paddingHorizontal: 16,
    paddingVertical: 8,
    color: TOKENS.textPrimary,
    fontSize: 13,
  },
  sendBtn: {
    backgroundColor: TOKENS.action,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sendText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
});
