import React, { useState } from 'react';
import {
  StyleSheet, Text, View, SafeAreaView, ScrollView, TouchableOpacity, StatusBar,
  FlatList, TextInput,
} from 'react-native';

type Tab = 'home' | 'explore' | 'communities' | 'messages';

const TOKENS = {
  canvas: '#090D16',
  surface: '#0F172A',
  raised: '#1E293B',
  textPrimary: '#F8FAFC',
  textMuted: '#94A3B8',
  action: '#0284C7',
  success: '#34D399',
  accent: '#FBBF24',
  border: '#1E293B',
};

const FEED = [
  {
    id: 'p1', author: 'Dancehall Culture Hub', location: 'Kingston, Jamaica', time: '2h',
    body: 'Episode 14 of the podcast is live — the evolution of Reggae & Dancehall globally. Support via SpotPay!',
    likes: '1,240', comments: '84',
  },
  {
    id: 'p2', author: 'Ana\'s Kitchen RD', location: 'Santo Domingo, DR', time: '5h',
    body: 'New menu drop: mangú with los tres golpes. Delivery across the capital all weekend.',
    likes: '612', comments: '47',
  },
  {
    id: 'p3', author: 'Jamaicans in Toronto', location: 'Toronto, Canada', time: '8h',
    body: 'Caribana band launch tickets are live for members. Community presale ends Friday night.',
    likes: '308', comments: '52',
  },
];

const EXPLORE_SECTIONS = [
  { title: 'Trending in Jamaica', tags: ['#Caribana2026', '#DancehallFridays', '#KingstonEats'] },
  { title: 'Trending in Dominican Republic', tags: ['#TechCaribbean', '#SantoDomingo', '#Bachata'] },
  { title: 'Diaspora — Toronto', tags: ['#JamaicansInToronto', '#SocaNight', '#CaribbeanFood'] },
];

const COMMUNITIES = [
  { name: 'Jamaicans in Toronto', members: '12.4k members', policy: 'Public' },
  { name: 'Dominicans in New York', members: '9.1k members', policy: 'Public' },
  { name: 'Caribbean Entrepreneurs', members: '6.8k members', policy: 'Private' },
  { name: 'Soca & Carnival Lovers', members: '21.3k members', policy: 'Public' },
  { name: 'Caribbean Developers', members: '2.2k members', policy: 'Invite-only' },
];

const CONVERSATIONS = [
  { id: 'c1', name: 'Jamaicans in Toronto', preview: 'Kofi: tickets are live!', unread: 3 },
  { id: 'c2', name: 'Ana Rodríguez', preview: 'The menu photos are uploaded', unread: 0 },
  { id: 'c3', name: 'Dwayne Soca Nights', preview: 'Voice message • 0:42', unread: 1 },
];

function PostCard({ post }: { post: typeof FEED[number] }) {
  return (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{post.author.slice(0, 2).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.postAuthor}>{post.author}</Text>
          <Text style={styles.postMeta}>{post.location} • {post.time}</Text>
        </View>
      </View>
      <Text style={styles.postBody}>{post.body}</Text>
      <View style={styles.postActions}>
        <Text style={styles.postAction}>❤️ {post.likes}</Text>
        <Text style={styles.postAction}>💬 {post.comments}</Text>
        <Text style={styles.postActionTip}>Tip SpotPay</Text>
      </View>
    </View>
  );
}

function HomeScreen() {
  return (
    <ScrollView contentContainerStyle={styles.screenContent}>
      <View style={styles.storiesRail}>
        {['Kingston', 'Santo Domingo', 'Port of Spain', 'Brooklyn', 'Toronto'].map((city) => (
          <View key={city} style={styles.storyTile}>
            <Text style={styles.storyCity}>{city}</Text>
          </View>
        ))}
      </View>
      <View style={styles.composerCard}>
        <Text style={styles.composerPlaceholder}>What&apos;s happening in your Caribbean world?</Text>
        <View style={styles.composerRow}>
          <Text style={styles.composerAction}>📷 Photo</Text>
          <Text style={styles.composerAction}>🎥 Video</Text>
          <Text style={styles.composerAction}>🔴 Live</Text>
        </View>
      </View>
      <View style={styles.feedTabs}>
        {['For You', 'Following', 'Caribbean', 'Latest'].map((tab, index) => (
          <Text key={tab} style={index === 0 ? styles.feedTabActive : styles.feedTab}>{tab}</Text>
        ))}
      </View>
      {FEED.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </ScrollView>
  );
}

function ExploreScreen() {
  return (
    <ScrollView contentContainerStyle={styles.screenContent}>
      <View style={styles.searchBar}>
        <Text style={styles.searchPlaceholder}>Ask Caribbean… (e.g. events in Miami)</Text>
      </View>
      {EXPLORE_SECTIONS.map((section) => (
        <View key={section.title} style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <View style={styles.tagRow}>
            {section.tags.map((tag) => (
              <View key={tag} style={styles.tagChip}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

function CommunitiesScreen() {
  return (
    <ScrollView contentContainerStyle={styles.screenContent}>
      {COMMUNITIES.map((community) => (
        <View key={community.name} style={styles.sectionCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>{community.name}</Text>
              <Text style={styles.postMeta}>{community.members}</Text>
            </View>
            <View style={styles.joinBadge}>
              <Text style={styles.joinText}>{community.policy}</Text>
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

function MessagesScreen() {
  const [draft, setDraft] = useState('');
  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={CONVERSATIONS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.screenContent}
        renderItem={({ item }) => (
          <View style={styles.sectionCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>{item.name}</Text>
                <Text style={styles.postMeta} numberOfLines={1}>{item.preview}</Text>
              </View>
              {item.unread > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>{item.unread}</Text>
                </View>
              )}
            </View>
          </View>
        )}
        ListFooterComponent={
          <View style={styles.composerCard}>
            <TextInput
              style={styles.messageInput}
              placeholder="Write a message…"
              placeholderTextColor={TOKENS.textMuted}
              value={draft}
              onChangeText={setDraft}
              accessibilityLabel="Message input"
            />
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Send message"
              style={styles.sendButton}
            >
              <Text style={styles.sendText}>Send</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const SCREENS: Record<Tab, { title: string; render: () => React.JSX.Element }> = {
  home: { title: 'Home', render: () => <HomeScreen /> },
  explore: { title: 'Explore', render: () => <ExploreScreen /> },
  communities: { title: 'Communities', render: () => <CommunitiesScreen /> },
  messages: { title: 'Messages', render: () => <MessagesScreen /> },
};

export default function App() {
  const [tab, setTab] = useState<Tab>('home');
  const screen = SCREENS[tab];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={TOKENS.canvas} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>CARIBBEAN ONE</Text>
        <View style={styles.walletBadge}>
          <Text style={styles.walletText}>SpotPay $240.50</Text>
        </View>
      </View>

      <View style={{ flex: 1 }}>{screen.render()}</View>

      <View
        style={styles.bottomNav}
        accessibilityRole="tablist"
      >
        {(['home', 'explore', 'communities', 'messages'] as Tab[]).map((key) => (
          <TouchableOpacity
            key={key}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === key }}
            accessibilityLabel={SCREENS[key].title}
            style={styles.navTab}
            onPress={() => setTab(key)}
          >
            <Text style={tab === key ? styles.navTabActiveText : styles.navTabText}>
              {SCREENS[key].title}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Create post"
          style={styles.createButton}
        >
          <Text style={styles.createButtonText}>+</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: TOKENS.canvas },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: TOKENS.border,
    backgroundColor: TOKENS.surface,
  },
  headerTitle: { fontSize: 18, fontWeight: '900', color: TOKENS.action, letterSpacing: 0.5 },
  walletBadge: {
    backgroundColor: '#064E3B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#059669',
  },
  walletText: { color: TOKENS.success, fontSize: 12, fontWeight: '700' },
  screenContent: { padding: 16 },
  storiesRail: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  storyTile: {
    width: 84, height: 120, borderRadius: 12, backgroundColor: TOKENS.raised,
    borderWidth: 1, borderColor: TOKENS.border, padding: 8, justifyContent: 'flex-end',
  },
  storyCity: { color: TOKENS.textPrimary, fontSize: 11, fontWeight: '700' },
  composerCard: {
    backgroundColor: TOKENS.surface, borderRadius: 16, borderWidth: 1,
    borderColor: TOKENS.border, padding: 16, marginBottom: 16, gap: 12,
  },
  composerPlaceholder: { color: TOKENS.textMuted, fontSize: 13 },
  composerRow: { flexDirection: 'row', gap: 16 },
  composerAction: { color: TOKENS.textMuted, fontSize: 12, fontWeight: '600' },
  feedTabs: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  feedTabActive: {
    color: TOKENS.action, fontSize: 12, fontWeight: '800',
    backgroundColor: 'rgba(2,132,199,0.15)', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 999, overflow: 'hidden',
  },
  feedTab: {
    color: TOKENS.textMuted, fontSize: 12, fontWeight: '600',
    backgroundColor: TOKENS.surface, paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 999, overflow: 'hidden',
  },
  postCard: {
    backgroundColor: TOKENS.surface, borderRadius: 16, borderWidth: 1,
    borderColor: TOKENS.border, padding: 16, marginBottom: 12,
  },
  postHeader: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  avatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(2,132,199,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: TOKENS.action, fontWeight: '800', fontSize: 12 },
  postAuthor: { color: TOKENS.textPrimary, fontSize: 13, fontWeight: '800' },
  postMeta: { color: TOKENS.textMuted, fontSize: 11, marginTop: 2 },
  postBody: { color: '#E2E8F0', fontSize: 13, lineHeight: 20 },
  postActions: { flexDirection: 'row', gap: 20, marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: TOKENS.border },
  postAction: { color: TOKENS.textMuted, fontSize: 11, fontWeight: '600' },
  postActionTip: { color: TOKENS.success, fontSize: 11, fontWeight: '700', marginLeft: 'auto' },
  searchBar: {
    backgroundColor: TOKENS.surface, borderRadius: 999, borderWidth: 1,
    borderColor: TOKENS.border, paddingHorizontal: 16, paddingVertical: 10, marginBottom: 16,
  },
  searchPlaceholder: { color: TOKENS.textMuted, fontSize: 13 },
  sectionCard: {
    backgroundColor: TOKENS.surface, borderRadius: 16, borderWidth: 1,
    borderColor: TOKENS.border, padding: 16, marginBottom: 12,
  },
  sectionTitle: { color: TOKENS.textPrimary, fontSize: 14, fontWeight: '800' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  tagChip: {
    backgroundColor: 'rgba(251,191,36,0.12)', borderRadius: 999, paddingHorizontal: 10,
    paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(251,191,36,0.3)',
  },
  tagText: { color: TOKENS.accent, fontSize: 11, fontWeight: '700' },
  joinBadge: {
    backgroundColor: TOKENS.raised, borderRadius: 999, paddingHorizontal: 10,
    paddingVertical: 5, borderWidth: 1, borderColor: TOKENS.border,
  },
  joinText: { color: TOKENS.textMuted, fontSize: 10, fontWeight: '700' },
  unreadBadge: {
    backgroundColor: TOKENS.action, borderRadius: 999, minWidth: 22, height: 22,
    paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center',
  },
  unreadText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  messageInput: {
    backgroundColor: TOKENS.canvas, borderRadius: 999, borderWidth: 1,
    borderColor: TOKENS.border, paddingHorizontal: 16, paddingVertical: 10,
    color: TOKENS.textPrimary, fontSize: 13,
  },
  sendButton: {
    backgroundColor: TOKENS.action, borderRadius: 999, paddingHorizontal: 20,
    paddingVertical: 10, alignItems: 'center',
  },
  sendText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
  bottomNav: {
    height: 64, backgroundColor: TOKENS.surface, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-around', borderTopWidth: 1,
    borderTopColor: TOKENS.border,
  },
  navTab: { alignItems: 'center', padding: 8 },
  navTabText: { color: TOKENS.textMuted, fontSize: 12, fontWeight: '600' },
  navTabActiveText: { color: TOKENS.action, fontSize: 12, fontWeight: '800' },
  createButton: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: TOKENS.action,
    alignItems: 'center', justifyContent: 'center',
  },
  createButtonText: { color: '#FFFFFF', fontSize: 24, fontWeight: '700' },
});
