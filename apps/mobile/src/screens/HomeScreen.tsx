import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  SafeAreaView
} from 'react-native';
import { TOKENS } from '../theme/tokens';
import { supabase, type MobilePost } from '../lib/supabase';

export function HomeScreen() {
  const [posts, setPosts] = useState<MobilePost[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [draft, setDraft] = useState('');
  const [activeTab, setActiveTab] = useState('For You');

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (data && !error) {
        const formatted = data.map((item: any) => ({
          id: item.id,
          author: item.profiles?.display_name || 'Caribbean Member',
          location: item.profiles?.home_location || 'Caribbean',
          time: new Date(item.created_at).toLocaleDateString(),
          body: item.content || '',
          likes: item.likes_count || 0,
          comments: item.comments_count || 0,
        }));
        setPosts(formatted);
      }
    } catch (err) {
      console.warn('Could not fetch posts', err);
    }
  };

  React.useEffect(() => {
    fetchPosts();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
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
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={TOKENS.action} />}
      >
        {/* Moments Stories Rail */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.storiesContainer} contentContainerStyle={styles.storiesRail}>
          {[
            { city: 'Kingston', flag: '🇯🇲' },
            { city: 'Santo Domingo', flag: '🇩🇴' },
            { city: 'Port of Spain', flag: '🇹🇹' },
            { city: 'Brooklyn', flag: '🗽' },
            { city: 'Toronto', flag: '🇨🇦' },
          ].map((item, idx) => (
            <View key={item.city} style={[styles.storyTile, idx === 0 && styles.storyTileActive]}>
              <View style={styles.storyImagePlaceholder}>
                <Text style={styles.storyFlag}>{item.flag}</Text>
              </View>
              <Text style={styles.storyCity}>{item.city}</Text>
            </View>
          ))}
        </ScrollView>

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
              <TouchableOpacity style={styles.composerIcon}><Text style={styles.composerIconText}>📷</Text></TouchableOpacity>
              <TouchableOpacity style={styles.composerIcon}><Text style={styles.composerIconText}>🎥</Text></TouchableOpacity>
              <TouchableOpacity style={styles.composerIcon}><Text style={styles.composerIconText}>📍</Text></TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.publishButton, !draft.trim() && styles.publishButtonDisabled]}
              onPress={handlePublish}
              disabled={!draft.trim()}
              activeOpacity={0.8}
            >
              <Text style={styles.publishText}>Publish</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Timeline Filter Tabs */}
        <View style={styles.feedTabs}>
          {['For You', 'Following', 'Caribbean Wide'].map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={activeTab === tab ? styles.feedTabActive : styles.feedTab}
              activeOpacity={0.7}
            >
              <Text style={activeTab === tab ? styles.feedTabActiveText : styles.feedTabText}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Posts Stream */}
        <View style={styles.feedContainer}>
          {posts.map((post) => (
            <View key={post.id} style={styles.postCard}>
              <View style={styles.postHeader}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{post.author.slice(0, 2).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.postAuthor}>{post.author}</Text>
                  <Text style={styles.postMeta}>{post.location} • {post.time}</Text>
                </View>
                <TouchableOpacity><Text style={styles.postOptions}>•••</Text></TouchableOpacity>
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
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: TOKENS.canvas },
  container: { paddingVertical: 16 },
  
  storiesContainer: { marginBottom: 24 },
  storiesRail: { paddingHorizontal: 20, gap: 12 },
  storyTile: {
    width: 90,
    alignItems: 'center',
  },
  storyImagePlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: TOKENS.raised,
    borderWidth: 2,
    borderColor: TOKENS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  storyTileActive: {
    opacity: 1,
  },
  storyFlag: { fontSize: 28 },
  storyCity: { color: TOKENS.textPrimary, fontSize: 12, fontWeight: '700', textAlign: 'center' },
  
  composerCard: {
    backgroundColor: TOKENS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: TOKENS.border,
    padding: 18,
    marginHorizontal: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  composerInput: {
    color: TOKENS.textPrimary,
    fontSize: 16,
    minHeight: 60,
    textAlignVertical: 'top',
    fontWeight: '500',
  },
  composerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: TOKENS.border,
    marginTop: 8,
  },
  composerActions: { flexDirection: 'row', gap: 16 },
  composerIcon: { backgroundColor: TOKENS.raised, padding: 8, borderRadius: 12 },
  composerIconText: { fontSize: 16 },
  publishButton: {
    backgroundColor: TOKENS.action,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
  },
  publishButtonDisabled: { opacity: 0.5, backgroundColor: TOKENS.raised },
  publishText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
  
  feedTabs: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginBottom: 20 },
  feedTab: {
    backgroundColor: TOKENS.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: TOKENS.border,
  },
  feedTabActive: {
    backgroundColor: TOKENS.action + '20',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: TOKENS.action,
  },
  feedTabText: { color: TOKENS.textMuted, fontSize: 14, fontWeight: '700' },
  feedTabActiveText: { color: TOKENS.action, fontSize: 14, fontWeight: '800' },
  
  feedContainer: { paddingHorizontal: 20, paddingBottom: 40 },
  postCard: {
    backgroundColor: TOKENS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: TOKENS.border,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: TOKENS.action + '30',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: TOKENS.action + '60',
  },
  avatarText: { color: TOKENS.action, fontWeight: '900', fontSize: 14 },
  postAuthor: { color: TOKENS.textPrimary, fontSize: 15, fontWeight: '800' },
  postMeta: { color: TOKENS.textMuted, fontSize: 12, marginTop: 3, fontWeight: '500' },
  postOptions: { color: TOKENS.textMuted, fontSize: 18, fontWeight: '900', letterSpacing: 2 },
  
  postBody: { color: '#F1F5F9', fontSize: 15, lineHeight: 24, fontWeight: '400' },
  
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: TOKENS.border,
  },
  actionBtn: { flexDirection: 'row', alignItems: 'center' },
  actionText: { color: TOKENS.textMuted, fontSize: 13, fontWeight: '700' },
  likedText: { color: TOKENS.danger, fontSize: 13, fontWeight: '800' },
  
  tipBtn: { marginLeft: 'auto', backgroundColor: TOKENS.success + '20', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  tipText: { color: TOKENS.success, fontSize: 12, fontWeight: '800' },
});
