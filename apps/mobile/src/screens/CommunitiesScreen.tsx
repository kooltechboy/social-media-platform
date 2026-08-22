import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { TOKENS } from '../theme/tokens';

interface CommunityItem {
  id: string;
  name: string;
  members: string;
  policy: string;
  isMember?: boolean;
}

const INITIAL_COMMUNITIES: CommunityItem[] = [
  { id: '1', name: 'Jamaicans in Toronto', members: '12.4k members', policy: 'Public', isMember: true },
  { id: '2', name: 'Dominicans in New York', members: '9.1k members', policy: 'Public', isMember: false },
  { id: '3', name: 'Caribbean Entrepreneurs', members: '6.8k members', policy: 'Private', isMember: false },
  { id: '4', name: 'Soca & Carnival Lovers', members: '21.3k members', policy: 'Public', isMember: true },
  { id: '5', name: 'Caribbean Developers', members: '2.2k members', policy: 'Invite-only', isMember: false },
];

export function CommunitiesScreen() {
  const [communities, setCommunities] = useState<CommunityItem[]>(INITIAL_COMMUNITIES);

  const toggleJoin = (id: string) => {
    setCommunities(
      communities.map((c) => (c.id === id ? { ...c, isMember: !c.isMember } : c)),
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.screenTitle}>🌴 Caribbean Hubs</Text>
        <TouchableOpacity style={styles.createHubBtn}>
          <Text style={styles.createHubText}>+ New Hub</Text>
        </TouchableOpacity>
      </View>

      {communities.map((item) => (
        <View key={item.id} style={styles.card}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.cardMeta}>{item.members} • {item.policy}</Text>
          </View>
          <TouchableOpacity
            style={[styles.joinBtn, item.isMember ? styles.joinedBtn : styles.unjoinedBtn]}
            onPress={() => toggleJoin(item.id)}
          >
            <Text style={item.isMember ? styles.joinedBtnText : styles.joinBtnText}>
              {item.isMember ? 'Joined ✓' : 'Join Hub'}
            </Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: TOKENS.canvas },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  screenTitle: { color: TOKENS.textPrimary, fontSize: 16, fontWeight: '800' },
  createHubBtn: {
    backgroundColor: TOKENS.action,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  createHubText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  card: {
    backgroundColor: TOKENS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: TOKENS.border,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardTitle: { color: TOKENS.textPrimary, fontSize: 14, fontWeight: '800' },
  cardMeta: { color: TOKENS.textMuted, fontSize: 11, marginTop: 4 },
  joinBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 },
  unjoinedBtn: { backgroundColor: TOKENS.action },
  joinedBtn: { backgroundColor: TOKENS.raised, borderWidth: 1, borderColor: TOKENS.border },
  joinBtnText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  joinedBtnText: { color: TOKENS.textMuted, fontSize: 11, fontWeight: '700' },
});
