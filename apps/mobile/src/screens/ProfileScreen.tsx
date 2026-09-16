import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Ionicons as ExpoIonicons } from '@expo/vector-icons';
import { TOKENS } from '../theme/tokens';
import { supabase } from '../lib/supabase';

const Ionicons = ExpoIonicons as unknown as React.ComponentType<any>;
const { width: screenWidth } = Dimensions.get('window');

interface ProfileScreenProps {
  onLogout: () => void;
  navigation: any;
}

type ProfileTab = 'posts' | 'reels' | 'listings';

export function ProfileScreen({ onLogout, navigation }: ProfileScreenProps) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [updating, setUpdating] = useState(false);

  // Live Stats
  const [postsCount, setPostsCount] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [likesReceived, setLikesReceived] = useState(0);
  const [friendsCount, setFriendsCount] = useState(0);

  // Tabbed Content
  const [activeTab, setActiveTab] = useState<ProfileTab>('posts');
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [userReels, setUserReels] = useState<any[]>([]);
  const [userProducts, setUserProducts] = useState<any[]>([]);

  const CARIBBEAN_COUNTRIES = [
    'Jamaica',
    'Trinidad and Tobago',
    'Barbados',
    'Bahamas',
    'Dominican Republic',
    'Guyana',
    'Haiti',
    'Antigua and Barbuda',
    'Saint Lucia',
    'Grenada',
    'Saint Vincent and the Grenadines',
    'Belize',
    'Suriname',
    'Diaspora (USA/UK/Canada)',
  ];

  const loadUserProfile = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // 1. Fetch Profile
      const { data: profData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profData) {
        setProfile(profData);
        setDisplayName(profData.display_name || profData.full_name || '');
        setBio(profData.bio || '');
        setCountry(profData.country || 'Jamaica');
        setCity(profData.city || '');
      }

      // 2. Fetch Verified Counters from profile_counts (NASA-grade integrity)
      const { data: countData } = await supabase
        .from('profile_counts')
        .select('posts_count, followers_count, following_count, likes_received_count, friends_count')
        .eq('profile_id', user.id)
        .maybeSingle();

      if (countData) {
        setPostsCount(countData.posts_count || 0);
        setFollowersCount(countData.followers_count || 0);
        setFollowingCount(countData.following_count || 0);
        setLikesReceived(countData.likes_received_count || 0);
        setFriendsCount(countData.friends_count || 0);
      } else {
        // Fallback count queries
        const { count: pCount } = await supabase
          .from('posts')
          .select('id', { count: 'exact', head: true })
          .eq('author_id', user.id);
        setPostsCount(pCount || 0);
      }

      // 3. Fetch User's Posts
      const { data: postsData } = await supabase
        .from('posts')
        .select('id, content, media_urls, likes_count, comments_count, created_at')
        .eq('author_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (postsData) setUserPosts(postsData);

      // 4. Fetch User's Reels
      const { data: reelsData } = await supabase
        .from('videos')
        .select('id, title, storage_path, thumbnail_path, likes_count, comments_count, created_at')
        .eq('creator_id', user.id)
        .eq('video_kind', 'reel')
        .order('created_at', { ascending: false })
        .limit(20);
      if (reelsData) setUserReels(reelsData);

      // 5. Fetch User's Marketplace Listings
      const { data: prodsData } = await supabase
        .from('products')
        .select('id, title, price_amount, currency, media_urls, status, condition, created_at')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (prodsData) setUserProducts(prodsData);

    } catch (err) {
      console.warn('Error loading profile:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadUserProfile();
  }, [loadUserProfile]);

  const onRefresh = () => {
    setRefreshing(true);
    loadUserProfile();
  };

  const handleSaveProfile = async () => {
    if (!profile?.id) return;
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: displayName.trim(),
          bio: bio.trim(),
          country: country,
          city: city.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (!error) {
        setProfile({
          ...profile,
          display_name: displayName.trim(),
          bio: bio.trim(),
          country: country,
          city: city.trim(),
        });
        setIsEditing(false);
        Alert.alert('Profile Saved', 'Your island profile has been updated.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Error updating profile.');
    } finally {
      setUpdating(false);
    }
  };

  const handleLogoutPress = async () => {
    await supabase.auth.signOut();
    onLogout();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={TOKENS.action} />
          <Text style={styles.loadingText}>Loading Caribbean Profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={TOKENS.action} />}
      >
        {/* Cover Banner */}
        <View style={styles.banner}>
          <View style={styles.bannerGradient} />
        </View>

        {/* Profile Card Header */}
        <View style={styles.profileHeader}>
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatarImg} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(profile?.display_name || profile?.username || 'TK').slice(0, 2).toUpperCase()}
              </Text>
            </View>
          )}

          <View style={styles.nameRow}>
            <Text style={styles.displayName}>{profile?.display_name || profile?.full_name || 'Caribbean Member'}</Text>
            {profile?.is_official && (
              <View style={styles.officialBadge}>
                <Text style={styles.officialBadgeText}>OFFICIAL</Text>
              </View>
            )}
          </View>
          <Text style={styles.username}>@{profile?.username || 'member'}</Text>

          {profile?.bio ? (
            <Text style={styles.bio}>{profile.bio}</Text>
          ) : (
            <Text style={styles.bioEmpty}>Connect with your Caribbean roots, culture, and friends.</Text>
          )}

          <View style={styles.locationRow}>
            <Ionicons name="location-sharp" size={13} color={TOKENS.action} style={{ marginRight: 4 }} />
            <Text style={styles.locationText}>
              {[profile?.city, profile?.country].filter(Boolean).join(', ') || 'Caribbean'}
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setIsEditing(!isEditing)}
              activeOpacity={0.8}
            >
              <Text style={styles.editButtonText}>{isEditing ? 'Cancel' : 'Edit Profile'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogoutPress}
              activeOpacity={0.8}
            >
              <Text style={styles.logoutButtonText}>Sign Out</Text>
            </TouchableOpacity>
          </View>

          {/* App Navigation Shortcuts */}
          <View style={styles.navLinksRow}>
            <TouchableOpacity
              style={styles.navLinkBtn}
              onPress={() => navigation?.navigate('Friends')}
            >
              <Text style={styles.navLinkIcon}>👥</Text>
              <Text style={styles.navLinkText}>Friends</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navLinkBtn}
              onPress={() => navigation?.navigate('Communities')}
            >
              <Text style={styles.navLinkIcon}>🌴</Text>
              <Text style={styles.navLinkText}>Hubs & Circles</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navLinkBtn}
              onPress={() => navigation?.navigate('Finance')}
            >
              <Text style={styles.navLinkIcon}>💰</Text>
              <Text style={styles.navLinkText}>Financial Center</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Edit Form Modal in-place */}
        {isEditing && (
          <View style={styles.editCard}>
            <Text style={styles.editTitle}>Edit Caribbean Profile</Text>

            <Text style={styles.label}>Display Name</Text>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Display Name"
              placeholderTextColor={TOKENS.textMuted}
            />

            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, { minHeight: 70, textAlignVertical: 'top' }]}
              value={bio}
              onChangeText={setBio}
              placeholder="Share your Caribbean story..."
              placeholderTextColor={TOKENS.textMuted}
              multiline
            />

            <Text style={styles.label}>Country</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.countryScroll}>
              {CARIBBEAN_COUNTRIES.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.countryChip, country === c && styles.countryChipActive]}
                  onPress={() => setCountry(c)}
                >
                  <Text style={[styles.countryText, country === c && styles.countryTextActive]}>
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>City / Parish / District</Text>
            <TextInput
              style={styles.input}
              value={city}
              onChangeText={setCity}
              placeholder="e.g. Kingston, Port of Spain, Bridgetown"
              placeholderTextColor={TOKENS.textMuted}
            />

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveProfile}
              disabled={updating}
              activeOpacity={0.8}
            >
              {updating ? (
                <ActivityIndicator size="small" color="#090D1A" />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Live Ecosystem Counters */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{postsCount}</Text>
            <Text style={styles.statLabel}>{postsCount === 1 ? 'Post' : 'Posts'}</Text>
          </View>
          <View style={styles.statDivider} />
          <TouchableOpacity
            style={styles.statItem}
            onPress={() => navigation?.navigate('Friends')}
            activeOpacity={0.7}
          >
            <Text style={[styles.statNumber, { color: '#10B981' }]}>{friendsCount}</Text>
            <Text style={styles.statLabel}>Friends</Text>
          </TouchableOpacity>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{followersCount}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{followingCount}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
        </View>

        {/* CONTENT TABS: POSTS, REELS, MARKETPLACE */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.contentTab, activeTab === 'posts' && styles.contentTabActive]}
            onPress={() => setActiveTab('posts')}
          >
            <Ionicons
              name="grid-outline"
              size={18}
              color={activeTab === 'posts' ? TOKENS.action : TOKENS.textMuted}
            />
            <Text style={[styles.contentTabText, activeTab === 'posts' && styles.contentTabTextActive]}>
              Posts ({userPosts.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.contentTab, activeTab === 'reels' && styles.contentTabActive]}
            onPress={() => setActiveTab('reels')}
          >
            <Ionicons
              name="videocam-outline"
              size={18}
              color={activeTab === 'reels' ? TOKENS.action : TOKENS.textMuted}
            />
            <Text style={[styles.contentTabText, activeTab === 'reels' && styles.contentTabTextActive]}>
              Reels ({userReels.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.contentTab, activeTab === 'listings' && styles.contentTabActive]}
            onPress={() => setActiveTab('listings')}
          >
            <Ionicons
              name="cart-outline"
              size={18}
              color={activeTab === 'listings' ? TOKENS.action : TOKENS.textMuted}
            />
            <Text style={[styles.contentTabText, activeTab === 'listings' && styles.contentTabTextActive]}>
              Trade ({userProducts.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* TAB CONTENT: POSTS */}
        {activeTab === 'posts' && (
          <View style={styles.tabContent}>
            {userPosts.length === 0 ? (
              <View style={styles.emptyTabBox}>
                <Ionicons name="chatbubbles-outline" size={40} color={TOKENS.textMuted} />
                <Text style={styles.emptyTabText}>No posts shared yet</Text>
                <TouchableOpacity
                  style={styles.createShortcutBtn}
                  onPress={() => navigation?.navigate('Create')}
                >
                  <Text style={styles.createShortcutText}>+ Create Post</Text>
                </TouchableOpacity>
              </View>
            ) : (
              userPosts.map((post) => (
                <View key={post.id} style={styles.postItem}>
                  <Text style={styles.postText}>{post.content}</Text>
                  {post.media_urls && post.media_urls.length > 0 && (
                    <Image source={{ uri: post.media_urls[0] }} style={styles.postImg} resizeMode="cover" />
                  )}
                  <View style={styles.postMeta}>
                    <Text style={styles.postDate}>{new Date(post.created_at).toLocaleDateString()}</Text>
                    <View style={styles.postStats}>
                      <Text style={styles.postStat}>❤️ {post.likes_count || 0}</Text>
                      <Text style={styles.postStat}>💬 {post.comments_count || 0}</Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* TAB CONTENT: REELS */}
        {activeTab === 'reels' && (
          <View style={styles.tabContent}>
            {userReels.length === 0 ? (
              <View style={styles.emptyTabBox}>
                <Ionicons name="videocam-outline" size={40} color={TOKENS.textMuted} />
                <Text style={styles.emptyTabText}>No reels published yet</Text>
                <TouchableOpacity
                  style={styles.createShortcutBtn}
                  onPress={() => navigation?.navigate('Create')}
                >
                  <Text style={styles.createShortcutText}>+ Upload Reel</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.reelsGrid}>
                {userReels.map((reel) => (
                  <TouchableOpacity
                    key={reel.id}
                    style={styles.reelThumb}
                    onPress={() => navigation?.navigate('Reels')}
                  >
                    {reel.thumbnail_path ? (
                      <Image source={{ uri: reel.thumbnail_path }} style={styles.reelThumbImg} />
                    ) : (
                      <View style={styles.reelThumbFallback}>
                        <Ionicons name="play" size={24} color="#FFF" />
                      </View>
                    )}
                    <View style={styles.reelOverlay}>
                      <Text style={styles.reelLikes}>❤️ {reel.likes_count || 0}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* TAB CONTENT: LISTINGS */}
        {activeTab === 'listings' && (
          <View style={styles.tabContent}>
            {userProducts.length === 0 ? (
              <View style={styles.emptyTabBox}>
                <Ionicons name="pricetag-outline" size={40} color={TOKENS.textMuted} />
                <Text style={styles.emptyTabText}>No active trade listings</Text>
                <TouchableOpacity
                  style={styles.createShortcutBtn}
                  onPress={() => navigation?.navigate('SellProduct')}
                >
                  <Text style={styles.createShortcutText}>+ Sell an Item</Text>
                </TouchableOpacity>
              </View>
            ) : (
              userProducts.map((prod) => (
                <TouchableOpacity
                  key={prod.id}
                  style={styles.prodRow}
                  onPress={() => navigation?.navigate('Marketplace')}
                >
                  {prod.media_urls && prod.media_urls.length > 0 ? (
                    <Image source={{ uri: prod.media_urls[0] }} style={styles.prodImg} />
                  ) : (
                    <View style={styles.prodImgPlaceholder}>
                      <Ionicons name="cart-outline" size={20} color={TOKENS.textMuted} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.prodTitle} numberOfLines={1}>{prod.title}</Text>
                    <Text style={styles.prodPrice}>
                      {prod.currency} ${(prod.price_amount / 100).toFixed(2)} • {prod.status.toUpperCase()}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={TOKENS.textMuted} />
                </TouchableOpacity>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: TOKENS.canvas },
  container: { paddingBottom: 40 },
  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: TOKENS.textMuted, fontSize: 13, marginTop: 10, fontWeight: '600' },
  banner: { height: 120, backgroundColor: '#0F1E36', position: 'relative' },
  bannerGradient: { flex: 1, backgroundColor: TOKENS.action + '20' },
  profileHeader: {
    paddingHorizontal: 20,
    marginTop: -40,
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: TOKENS.surface,
    borderWidth: 3,
    borderColor: TOKENS.action,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: TOKENS.action,
  },
  avatarText: { color: TOKENS.action, fontSize: 24, fontWeight: '900' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  displayName: { color: TOKENS.textPrimary, fontSize: 20, fontWeight: '900' },
  officialBadge: {
    backgroundColor: TOKENS.action + '25',
    borderColor: TOKENS.action,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  officialBadgeText: { color: TOKENS.action, fontSize: 9, fontWeight: '900' },
  username: { color: TOKENS.textMuted, fontSize: 13, fontWeight: '600', marginTop: 2 },
  bio: { color: '#CBD5E1', fontSize: 13, textAlign: 'center', marginTop: 10, lineHeight: 20 },
  bioEmpty: { color: TOKENS.textMuted, fontSize: 12, textAlign: 'center', marginTop: 8, fontStyle: 'italic' },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  locationText: { color: TOKENS.action, fontSize: 12, fontWeight: '700' },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 18, width: '100%' },
  editButton: {
    flex: 1,
    backgroundColor: TOKENS.raised,
    borderColor: TOKENS.border,
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  editButtonText: { color: TOKENS.textPrimary, fontSize: 13, fontWeight: '800' },
  logoutButton: {
    backgroundColor: TOKENS.danger + '20',
    borderColor: TOKENS.danger,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
    alignItems: 'center',
  },
  logoutButtonText: { color: TOKENS.danger, fontSize: 13, fontWeight: '800' },
  navLinksRow: { flexDirection: 'row', gap: 12, marginTop: 14, width: '100%' },
  navLinkBtn: {
    flex: 1,
    backgroundColor: TOKENS.surface,
    borderColor: TOKENS.border,
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  navLinkIcon: { fontSize: 16 },
  navLinkText: { color: TOKENS.textPrimary, fontSize: 13, fontWeight: '700' },
  editCard: {
    backgroundColor: TOKENS.surface,
    marginHorizontal: 20,
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: TOKENS.border,
    marginBottom: 20,
  },
  editTitle: { color: TOKENS.textPrimary, fontSize: 15, fontWeight: '800', marginBottom: 12 },
  label: { color: TOKENS.textMuted, fontSize: 11, fontWeight: '700', marginBottom: 4, marginTop: 8 },
  input: {
    backgroundColor: TOKENS.raised,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: TOKENS.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: TOKENS.textPrimary,
    fontSize: 13,
  },
  countryScroll: { flexDirection: 'row', marginVertical: 6 },
  countryChip: {
    backgroundColor: TOKENS.raised,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginRight: 8,
    borderWidth: 1,
    borderColor: TOKENS.border,
  },
  countryChipActive: { backgroundColor: TOKENS.action + '25', borderColor: TOKENS.action },
  countryText: { color: TOKENS.textMuted, fontSize: 11, fontWeight: '600' },
  countryTextActive: { color: TOKENS.action, fontWeight: '800' },
  saveButton: {
    backgroundColor: TOKENS.action,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonText: { color: '#FFF', fontSize: 14, fontWeight: '900' },

  statsCard: {
    flexDirection: 'row',
    backgroundColor: TOKENS.surface,
    marginHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: TOKENS.border,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: { alignItems: 'center' },
  statNumber: { color: TOKENS.textPrimary, fontSize: 17, fontWeight: '900' },
  statLabel: { color: TOKENS.textMuted, fontSize: 11, fontWeight: '600', marginTop: 2 },
  statDivider: { width: 1, height: 26, backgroundColor: TOKENS.border },

  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: TOKENS.border,
    marginBottom: 12,
  },
  contentTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  contentTabActive: {
    borderBottomColor: TOKENS.action,
  },
  contentTabText: {
    color: TOKENS.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  contentTabTextActive: {
    color: TOKENS.action,
  },
  tabContent: {
    paddingHorizontal: 16,
  },
  emptyTabBox: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyTabText: {
    color: TOKENS.textMuted,
    fontSize: 14,
    marginTop: 8,
    marginBottom: 14,
  },
  createShortcutBtn: {
    backgroundColor: TOKENS.action,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
  },
  createShortcutText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  postItem: {
    backgroundColor: TOKENS.surface,
    borderWidth: 1,
    borderColor: TOKENS.border,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  postText: {
    color: TOKENS.textPrimary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  postImg: {
    width: '100%',
    height: 160,
    borderRadius: 10,
    marginBottom: 8,
  },
  postMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: TOKENS.border,
    paddingTop: 8,
  },
  postDate: {
    color: TOKENS.textMuted,
    fontSize: 11,
  },
  postStats: {
    flexDirection: 'row',
    gap: 12,
  },
  postStat: {
    color: TOKENS.textMuted,
    fontSize: 11,
  },
  reelsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  reelThumb: {
    width: (screenWidth - 48) / 3,
    height: 140,
    borderRadius: 10,
    backgroundColor: TOKENS.surface,
    overflow: 'hidden',
    position: 'relative',
  },
  reelThumbImg: {
    width: '100%',
    height: '100%',
  },
  reelThumbFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: TOKENS.raised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reelOverlay: {
    position: 'absolute',
    bottom: 6,
    left: 6,
  },
  reelLikes: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
  prodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: TOKENS.surface,
    borderWidth: 1,
    borderColor: TOKENS.border,
    borderRadius: 14,
    padding: 10,
    marginBottom: 8,
    gap: 12,
  },
  prodImg: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  prodImgPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: TOKENS.raised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prodTitle: {
    color: TOKENS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  prodPrice: {
    color: TOKENS.action,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },
});
