import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from 'react-native';
import { TOKENS } from '../theme/tokens';
import { INITIAL_POSTS, type MobilePost } from '../lib/supabase';

export function HomeScreen() {
  const [posts, setPosts] = useState<MobilePost[]>(INITIAL_POSTS);
  const [refreshing, setRefreshing] = useState(false);
  const [draft, setDraft] = useState('');
  const [activeTab, setActiveTab] = useState('For You');

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 800);
  };

  const handlePublish = () => {
    if (!draft.trim()) return;
    const newPost: MobilePost = {
      id: `p_${Date.now()}`,
      author: 'You (Caribbean Member)',
      location: 'Kingston, Jamaica',
      time: 'Just now',
      body: draft.trim(),
      likes: 0,
      comments: 0,
    };
    setPosts([newPost, ...posts]);
    setDraft('');
  };

  const toggleLike = (id: string) => {
    setPosts(
      posts.map((p) => {
        if (p.id === id) {
          const isLiked = !p.isLiked;
          return {
            ...p,
            isLiked,
            likes: isLiked ? p.likes + 1 : Math.max(0, p.likes - 1),
          };
        }
        return p;
      }),
    );
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={TOKENS.action} />}
    >
      {/* Moments Stories Rail */}
      <View style={styles.storiesRail}>
        {[
          { city: 'Kingston', flag: '🇯🇲' },
          { city: 'Santo Domingo', flag: '🇩🇴' },
          { city: 'Port of Spain', flag: '🇹🇹' },
          { city: 'Brooklyn', flag: '🗽' },
          { city: 'Toronto', flag: '🇨🇦' },
        ].map((item) => (
          <View key={item.city} style={styles.storyTile}>
            <Text style={styles.storyFlag}>{item.flag}</Text>
            <Text style={styles.storyCity}>{item.city}</Text>
          </View>
        ))}
      </View>

      {/* Composer Card */}
      <View style={styles.composerCard}>
        <TextInput
          style={styles.composerInput}
          placeholder="What's happening in your Caribbean world?"
          placeholderTextColor={TOKENS.textMuted}
          value={draft}
          onChangeText={setDraft}
          multiline
        />
        <View style={styles.composerFooter}>
          <View style={styles.composerActions}>
            <Text style={styles.composerActionText}>📷 Photo</Text>
            <Text style={styles.composerActionText}>🎥 Reel</Text>
            <Text style={styles.composerActionText}>📍 Tag</Text>
          </View>
          <TouchableOpacity
            style={[styles.publishButton, !draft.trim() && styles.publishButtonDisabled]}
            onPress={handlePublish}
            disabled={!draft.trim()}
          >
            <Text style={styles.publishText}>Publish</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Timeline Filter Tabs */}
      <View style={styles.feedTabs}>
        {['For You', 'Following', 'Caribbean Wide', 'Latest'].map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={activeTab === tab ? styles.feedTabActive : styles.feedTab}
          >
            <Text style={activeTab === tab ? styles.feedTabActiveText : styles.feedTabText}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Posts Stream */}
      {posts.map((post) => (
        <View key={post.id} style={styles.postCard}>
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
            <TouchableOpacity onPress={() => toggleLike(post.id)} style={styles.actionBtn}>
              <Text style={post.isLiked ? styles.likedText : styles.actionText}>
                {post.isLiked ? '❤️' : '🤍'} {post.likes}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn}>
              <Text style={styles.actionText}>💬 {post.comments}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn}>
              <Text style={styles.actionText}>🔁 Repost</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.tipBtn}>
              <Text style={styles.tipText}>⚡ Tip SpotPay</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: TOKENS.canvas },
  storiesRail: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  storyTile: {
    width: 86,
    height: 120,
    borderRadius: 14,
    backgroundColor: TOKENS.surface,
    borderWidth: 1,
    borderColor: TOKENS.border,
    padding: 10,
    justifyContent: 'space-between',
  },
  storyFlag: { fontSize: 20 },
  storyCity: { color: TOKENS.textPrimary, fontSize: 11, fontWeight: '700' },
  composerCard: {
    backgroundColor: TOKENS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: TOKENS.border,
    padding: 14,
    marginBottom: 16,
  },
  composerInput: {
    color: TOKENS.textPrimary,
    fontSize: 14,
    minHeight: 50,
    textAlignVertical: 'top',
  },
  composerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: TOKENS.border,
    marginTop: 6,
  },
  composerActions: { flexDirection: 'row', gap: 12 },
  composerActionText: { color: TOKENS.textMuted, fontSize: 12, fontWeight: '600' },
  publishButton: {
    backgroundColor: TOKENS.action,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
  },
  publishButtonDisabled: { opacity: 0.5 },
  publishText: { color: '#FFFFFF', fontWeight: '800', fontSize: 12 },
  feedTabs: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  feedTab: {
    backgroundColor: TOKENS.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  feedTabActive: {
    backgroundColor: 'rgba(2,132,199,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: TOKENS.action,
  },
  feedTabText: { color: TOKENS.textMuted, fontSize: 12, fontWeight: '600' },
  feedTabActiveText: { color: TOKENS.action, fontSize: 12, fontWeight: '800' },
  postCard: {
    backgroundColor: TOKENS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: TOKENS.border,
    padding: 16,
    marginBottom: 12,
  },
  postHeader: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(2,132,199,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: TOKENS.action, fontWeight: '800', fontSize: 12 },
  postAuthor: { color: TOKENS.textPrimary, fontSize: 13, fontWeight: '800' },
  postMeta: { color: TOKENS.textMuted, fontSize: 11, marginTop: 2 },
  postBody: { color: '#E2E8F0', fontSize: 13, lineHeight: 20 },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: TOKENS.border,
  },
  actionBtn: { flexDirection: 'row', alignItems: 'center' },
  actionText: { color: TOKENS.textMuted, fontSize: 11, fontWeight: '600' },
  likedText: { color: '#F43F5E', fontSize: 11, fontWeight: '700' },
  tipBtn: { marginLeft: 'auto' },
  tipText: { color: TOKENS.success, fontSize: 11, fontWeight: '700' },
});
