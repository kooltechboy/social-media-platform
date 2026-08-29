import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { TOKENS } from '../theme/tokens';

interface Conversation {
  id: string;
  name: string;
  preview: string;
  unread: number;
}

const INITIAL_CONVERSATIONS: Conversation[] = [
  { id: 'c1', name: 'Jamaicans in Toronto', preview: 'Kofi: Caribana tickets are live!', unread: 3 },
  { id: 'c2', name: 'Ana Rodríguez (Santo Domingo)', preview: 'The new menu photos are uploaded', unread: 0 },
  { id: 'c3', name: 'Tukubi Support', preview: 'Welcome to the digital home of the Caribbean!', unread: 0 },
];

export function MessagesScreen() {
  const [conversations] = useState<Conversation[]>(INITIAL_CONVERSATIONS);
  const [draft, setDraft] = useState('');

  return (
    <View style={styles.container}>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.chatCard}>
            <View style={styles.chatAvatar}>
              <Text style={styles.chatAvatarText}>{item.name.slice(0, 2).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={styles.chatName}>{item.name}</Text>
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
        )}
      />

      <View style={styles.composerBar}>
        <TextInput
          style={styles.input}
          placeholder="Write a message…"
          placeholderTextColor={TOKENS.textMuted}
          value={draft}
          onChangeText={setDraft}
        />
        <TouchableOpacity style={styles.sendBtn}>
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: TOKENS.canvas },
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
  chatAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(2,132,199,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatAvatarText: { color: TOKENS.action, fontWeight: '800', fontSize: 13 },
  chatName: { color: TOKENS.textPrimary, fontSize: 14, fontWeight: '800' },
  chatPreview: { color: TOKENS.textMuted, fontSize: 12, marginTop: 3 },
  unreadBadge: {
    backgroundColor: TOKENS.action,
    borderRadius: 999,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
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
