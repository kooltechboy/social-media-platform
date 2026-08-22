import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { TOKENS } from '../theme/tokens';

const TRENDING_TOPICS = [
  { rank: '01', title: '#Caribana2026', location: 'Toronto', posts: '14.2k' },
  { rank: '02', title: '#SocaFestival', location: 'Miami', posts: '22.1k' },
  { rank: '03', title: '#TechCaribbean', location: 'Santo Domingo', posts: '8.9k' },
  { rank: '04', title: '#ReggaeSumfest', location: 'Montego Bay', posts: '31.4k' },
  { rank: '05', title: '#CarnivalTT', location: 'Port of Spain', posts: '45.0k' },
];

export function ExploreScreen() {
  const [query, setQuery] = useState('');

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Ask Caribbean AI Search Bar */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>✨</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Ask Caribbean… (e.g. food in Brooklyn, events in Kingston)"
          placeholderTextColor={TOKENS.textMuted}
          value={query}
          onChangeText={setQuery}
        />
      </View>

      {/* Cultural Categories Rail */}
      <View style={styles.categoriesRail}>
        {['Carnival & Fetes', 'Music & Reggae', 'Food & Dining', 'Tech & Business', 'Diaspora Hubs'].map((cat) => (
          <TouchableOpacity key={cat} style={styles.categoryChip}>
            <Text style={styles.categoryText}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Trending Topics */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>🔥 Trending in the Caribbean</Text>
      </View>

      {TRENDING_TOPICS.map((item) => (
        <TouchableOpacity key={item.rank} style={styles.trendCard}>
          <Text style={styles.trendRank}>{item.rank}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.trendLocation}>{item.location.toUpperCase()}</Text>
            <Text style={styles.trendTitle}>{item.title}</Text>
            <Text style={styles.trendMeta}>{item.posts} conversations</Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: TOKENS.canvas },
  searchBar: {
    backgroundColor: TOKENS.surface,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: TOKENS.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
    gap: 8,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, color: TOKENS.textPrimary, fontSize: 13 },
  categoriesRail: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 20 },
  categoryChip: {
    backgroundColor: TOKENS.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: TOKENS.border,
  },
  categoryText: { color: TOKENS.textMuted, fontSize: 11, fontWeight: '700' },
  sectionHeader: { marginBottom: 12 },
  sectionTitle: { color: TOKENS.textPrimary, fontSize: 15, fontWeight: '800' },
  trendCard: {
    backgroundColor: TOKENS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: TOKENS.border,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  trendRank: { color: TOKENS.action, fontSize: 16, fontWeight: '900', width: 24 },
  trendLocation: { color: TOKENS.accent, fontSize: 10, fontWeight: '800' },
  trendTitle: { color: TOKENS.textPrimary, fontSize: 14, fontWeight: '800', marginTop: 1 },
  trendMeta: { color: TOKENS.textMuted, fontSize: 11, marginTop: 2 },
});
