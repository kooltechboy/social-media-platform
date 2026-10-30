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

type IoniconName = keyof typeof ExpoIonicons.glyphMap;
const Ionicons = ExpoIonicons as unknown as React.ComponentType<{
  name: IoniconName;
  size?: number;
  color?: string;
  style?: any;
}>;
const { width: screenWidth } = Dimensions.get('window');

interface ProfileScreenProps {
  onLogout: () => void;
  navigation: any;
}

type ProfileTab = 'posts' | 'reels' | 'listings';

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
  const [friendsCount, setFriendsCount] = useState(0);

  // Tabbed Content
  const [activeTab, setActiveTab] = useState<ProfileTab>('posts');
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [userReels, setUserReels] = useState<any[]>([]);
  const [userProducts, setUserProducts] = useState<any[]>([]);

  const loadUserProfile = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
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
        setCountry(profData.country || '');
        setCity(profData.city || '');
      }

      // 2. Fetch Verified Counters from profile_counts
      const { data: countData } = await supabase
        .from('profile_counts')
        .select(
          'posts_count, followers_count, following_count, likes_received_count, friends_count'
        )
        .eq('profile_id', user.id)
        .maybeSingle();

      if (countData) {
        setPostsCount(countData.posts_count || 0);
        setFollowersCount(countData.followers_count || 0);
        setFollowingCount(countData.following_count || 0);
        setFriendsCount(countData.friends_count || 0);
      } else {
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

      // 4. Fetch User's Shorts / Reels
      const { data: reelsData } = await supabase
        .from('videos')
        .select(
          'id, title, storage_path, thumbnail_path, likes_count, comments_count, created_at'
        )
        .eq('creator_id', user.id)
        .eq('video_kind', 'reel')
        .order('created_at', { ascending: false })
        .limit(20);
      if (reelsData) setUserReels(reelsData);

      // 5. Fetch User's Marketplace Listings
      const { data: prodsData } = await supabase
        .from('products')
        .select(
          'id, title, price_amount, currency, media_urls, status, condition, created_at'
        )
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
      const nextCountry = country.trim() || null;
      const nextCity = city.trim() || null;
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: displayName.trim(),
          bio: bio.trim(),
          country: nextCountry,
          city: nextCity,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (!error) {
        setProfile({
          ...profile,
          display_name: displayName.trim(),
          bio: bio.trim(),
          country: nextCountry,
          city: nextCity,
        });
        setIsEditing(false);
        Alert.alert('Profile Updated', 'Your TUKUBI profile changes have been saved.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Unable to update profile.');
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
          <ActivityIndicator size="large" color={TOKENS.teal} />
          <Text style={styles.loadingText}>Loading Profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const locationSummary = [profile?.city, profile?.country].filter(Boolean).join(', ');
  const joinedLabel = profile?.created_at
    ? `Joined ${new Date(profile.created_at).toLocaleDateString(undefined, {
        month: 'short',
        year: 'numeric',
      })}`
    : 'Member on TUKUBI';
  const isVerifiedProfile = Boolean(profile?.is_verified || profile?.is_official);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={TOKENS.teal} />
        }
      >
        {/* Deep Navy Cover Banner with Teal/Ocean Accent Bar */}
        <View style={styles.banner}>
          <View style={styles.bannerOceanGlow} />
          <View style={styles.bannerAccentBar}>
            <View style={styles.bannerAccentTeal} />
            <View style={styles.bannerAccentOcean} />
          </View>
        </View>

        {/* Overlapping Avatar & Right-Aligned Actions */}
        <View style={styles.profileHeaderSection}>
          <View style={styles.avatarAndActionsRow}>
            <View style={styles.avatarRingWrap}>
              {profile?.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={styles.avatarImg} />
              ) : (
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {(profile?.display_name || profile?.username || 'TK')
                      .slice(0, 2)
                      .toUpperCase()}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.topRightActions}>
              <TouchableOpacity
                style={[styles.editButton, isEditing && styles.editButtonActive]}
                onPress={() => setIsEditing(!isEditing)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={isEditing ? 'Cancel editing profile' : 'Edit Profile'}
              >
                <Ionicons
                  name={isEditing ? 'close-circle' : 'create-outline'}
                  size={15}
                  color={isEditing ? TOKENS.teal : TOKENS.textPrimary}
                />
                <Text style={[styles.editButtonText, isEditing && styles.editButtonTextActive]}>
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogoutPress}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Sign Out"
              >
                <Ionicons name="log-out-outline" size={16} color={TOKENS.danger} />
                <Text style={styles.logoutButtonText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Identity Block */}
          <View style={styles.identityBlock}>
            <View style={styles.nameRow}>
              <Text style={styles.displayName} numberOfLines={1}>
                {profile?.display_name || profile?.full_name || 'Caribbean Member'}
              </Text>
              {isVerifiedProfile && (
                <Ionicons name="checkmark-circle" size={18} color={TOKENS.teal} />
              )}
            </View>
            <Text style={styles.username}>@{profile?.username || 'member'}</Text>

            {profile?.bio ? (
              <Text style={styles.bio}>{profile.bio}</Text>
            ) : (
              <Text style={styles.bioEmpty}>
                Add a bio to share your perspective, craft, or interests on TUKUBI.
              </Text>
            )}

            {/* Single-Line Metadata */}
            <View style={styles.metadataRow}>
              <View style={styles.metaItem}>
                <Ionicons name="location-outline" size={14} color={TOKENS.teal} />
                <Text style={styles.metaText}>
                  {locationSummary || 'Private location'}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="calendar-outline" size={14} color={TOKENS.textMuted} />
                <Text style={styles.metaTextMuted}>{joinedLabel}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Inline Edit Profile Card (Midnight Reef) */}
        {isEditing && (
          <View style={styles.editCard}>
            <View style={styles.editHeaderRow}>
              <Ionicons name="create-outline" size={17} color={TOKENS.teal} />
              <Text style={styles.editTitle}>Edit Profile</Text>
            </View>

            <Text style={styles.label}>Display Name</Text>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Display Name"
              placeholderTextColor={TOKENS.textDim}
            />

            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.bioInput]}
              value={bio}
              onChangeText={setBio}
              placeholder="Share your story..."
              placeholderTextColor={TOKENS.textDim}
              multiline
            />

            <View style={styles.countryHeaderRow}>
              <Text style={styles.labelInline}>Cultural Heritage / Country (Optional)</Text>
              {country !== '' && (
                <TouchableOpacity onPress={() => setCountry('')}>
                  <Text style={styles.clearCountryText}>Set Private</Text>
                </TouchableOpacity>
              )}
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.countryScroll}
            >
              {CARIBBEAN_COUNTRIES.map((c) => {
                const selected = country === c;
                return (
                  <TouchableOpacity
                    key={c}
                    style={[styles.countryChip, selected && styles.countryChipActive]}
                    onPress={() => setCountry(selected ? '' : c)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.countryText, selected && styles.countryTextActive]}>
                      {c}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={styles.label}>City / Parish / District (Optional)</Text>
            <TextInput
              style={styles.input}
              value={city}
              onChangeText={setCity}
              placeholder="Kingston, Port of Spain, Bridgetown..."
              placeholderTextColor={TOKENS.textDim}
            />

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveProfile}
              disabled={updating}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Save Profile Changes"
            >
              {updating ? (
                <ActivityIndicator size="small" color={TOKENS.actionText} />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Clean 4-Column Stat Bar: Posts · Followers · Following · Friends */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{postsCount}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
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
          <View style={styles.statDivider} />
          <TouchableOpacity
            style={styles.statItem}
            onPress={() => navigation?.navigate('Friends')}
            activeOpacity={0.75}
          >
            <Text style={[styles.statNumber, { color: TOKENS.teal }]}>{friendsCount}</Text>
            <Text style={styles.statLabel}>Friends</Text>
          </TouchableOpacity>
        </View>

        {/* 3 Ionicons Ecosystem Quick Cards */}
        <View style={styles.quickCardsRow}>
          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => navigation?.navigate('Friends')}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Friends"
          >
            <View style={[styles.quickIconBadge, { backgroundColor: TOKENS.tealSoft }]}>
              <Ionicons name="people-outline" size={18} color={TOKENS.teal} />
            </View>
            <Text style={styles.quickCardLabel} numberOfLines={1}>
              Friends
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => navigation?.navigate('Communities')}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Communities"
          >
            <View style={[styles.quickIconBadge, { backgroundColor: TOKENS.oceanSoft }]}>
              <Ionicons name="layers-outline" size={18} color={TOKENS.action} />
            </View>
            <Text style={styles.quickCardLabel} numberOfLines={1}>
              Communities
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => navigation?.navigate('Finance')}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Financial Center"
          >
            <View style={[styles.quickIconBadge, { backgroundColor: TOKENS.amberSoft }]}>
              <Ionicons name="wallet-outline" size={18} color={TOKENS.accent} />
            </View>
            <Text style={styles.quickCardLabel} numberOfLines={1}>
              Financial Center
            </Text>
          </TouchableOpacity>
        </View>

        {/* Clean Underline Content Tabs: Posts · Shorts · Trade */}
        <View style={styles.tabsContainer} accessibilityRole="tablist">
          <TouchableOpacity
            style={[styles.contentTab, activeTab === 'posts' && styles.contentTabActive]}
            onPress={() => setActiveTab('posts')}
            activeOpacity={0.75}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'posts' }}
          >
            <Ionicons
              name="grid-outline"
              size={16}
              color={activeTab === 'posts' ? TOKENS.teal : TOKENS.textMuted}
            />
            <Text
              style={[
                styles.contentTabText,
                activeTab === 'posts' && styles.contentTabTextActive,
              ]}
            >
              Posts ({userPosts.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.contentTab, activeTab === 'reels' && styles.contentTabActive]}
            onPress={() => setActiveTab('reels')}
            activeOpacity={0.75}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'reels' }}
          >
            <Ionicons
              name="film-outline"
              size={16}
              color={activeTab === 'reels' ? TOKENS.teal : TOKENS.textMuted}
            />
            <Text
              style={[
                styles.contentTabText,
                activeTab === 'reels' && styles.contentTabTextActive,
              ]}
            >
              Shorts ({userReels.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.contentTab, activeTab === 'listings' && styles.contentTabActive]}
            onPress={() => setActiveTab('listings')}
            activeOpacity={0.75}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'listings' }}
          >
            <Ionicons
              name="bag-handle-outline"
              size={16}
              color={activeTab === 'listings' ? TOKENS.teal : TOKENS.textMuted}
            />
            <Text
              style={[
                styles.contentTabText,
                activeTab === 'listings' && styles.contentTabTextActive,
              ]}
            >
              Trade ({userProducts.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* TAB CONTENT: POSTS */}
        {activeTab === 'posts' && (
          <View style={styles.tabContent}>
            {userPosts.length === 0 ? (
              <View style={styles.emptyTabBox}>
                <View style={styles.emptyIconCircle}>
                  <Ionicons name="newspaper-outline" size={26} color={TOKENS.teal} />
                </View>
                <Text style={styles.emptyTabText}>No posts published yet</Text>
                <TouchableOpacity
                  style={styles.createShortcutBtn}
                  onPress={() => navigation?.navigate('Create')}
                  activeOpacity={0.85}
                >
                  <Ionicons name="add" size={16} color={TOKENS.actionText} />
                  <Text style={styles.createShortcutText}>Create Post</Text>
                </TouchableOpacity>
              </View>
            ) : (
              userPosts.map((post) => (
                <View key={post.id} style={styles.postItem}>
                  <Text style={styles.postText}>{post.content}</Text>
                  {post.media_urls && post.media_urls.length > 0 && (
                    <Image
                      source={{ uri: post.media_urls[0] }}
                      style={styles.postImg}
                      resizeMode="cover"
                    />
                  )}
                  <View style={styles.postMeta}>
                    <Text style={styles.postDate}>
                      {new Date(post.created_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </Text>
                    <View style={styles.postStats}>
                      <View style={styles.postStatPair}>
                        <Ionicons name="heart-outline" size={14} color={TOKENS.textMuted} />
                        <Text style={styles.postStat}>{post.likes_count || 0}</Text>
                      </View>
                      <View style={styles.postStatPair}>
                        <Ionicons name="chatbubble-outline" size={14} color={TOKENS.textMuted} />
                        <Text style={styles.postStat}>{post.comments_count || 0}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* TAB CONTENT: SHORTS */}
        {activeTab === 'reels' && (
          <View style={styles.tabContent}>
            {userReels.length === 0 ? (
              <View style={styles.emptyTabBox}>
                <View style={styles.emptyIconCircle}>
                  <Ionicons name="film-outline" size={26} color={TOKENS.teal} />
                </View>
                <Text style={styles.emptyTabText}>No Shorts published yet</Text>
                <TouchableOpacity
                  style={styles.createShortcutBtn}
                  onPress={() => navigation?.navigate('Create')}
                  activeOpacity={0.85}
                >
                  <Ionicons name="add" size={16} color={TOKENS.actionText} />
                  <Text style={styles.createShortcutText}>Upload Short</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.reelsGrid}>
                {userReels.map((reel) => (
                  <TouchableOpacity
                    key={reel.id}
                    style={styles.reelThumb}
                    onPress={() => navigation?.navigate('Shorts')}
                    activeOpacity={0.85}
                  >
                    {reel.thumbnail_path ? (
                      <Image source={{ uri: reel.thumbnail_path }} style={styles.reelThumbImg} />
                    ) : (
                      <View style={styles.reelThumbFallback}>
                        <Ionicons name="play" size={22} color={TOKENS.teal} />
                      </View>
                    )}
                    <View style={styles.reelOverlay}>
                      <Ionicons name="heart" size={11} color={TOKENS.textPrimary} />
                      <Text style={styles.reelLikes}>{reel.likes_count || 0}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* TAB CONTENT: TRADE */}
        {activeTab === 'listings' && (
          <View style={styles.tabContent}>
            {userProducts.length === 0 ? (
              <View style={styles.emptyTabBox}>
                <View style={styles.emptyIconCircle}>
                  <Ionicons name="pricetag-outline" size={26} color={TOKENS.teal} />
                </View>
                <Text style={styles.emptyTabText}>No active trade listings</Text>
                <TouchableOpacity
                  style={styles.createShortcutBtn}
                  onPress={() => navigation?.navigate('SellProduct')}
                  activeOpacity={0.85}
                >
                  <Ionicons name="add" size={16} color={TOKENS.actionText} />
                  <Text style={styles.createShortcutText}>List an Item</Text>
                </TouchableOpacity>
              </View>
            ) : (
              userProducts.map((prod) => (
                <TouchableOpacity
                  key={prod.id}
                  style={styles.prodRow}
                  onPress={() => navigation?.navigate('Marketplace')}
                  activeOpacity={0.85}
                >
                  {prod.media_urls && prod.media_urls.length > 0 ? (
                    <Image source={{ uri: prod.media_urls[0] }} style={styles.prodImg} />
                  ) : (
                    <View style={styles.prodImgPlaceholder}>
                      <Ionicons name="bag-handle-outline" size={20} color={TOKENS.textMuted} />
                    </View>
                  )}
                  <View style={styles.prodInfoCol}>
                    <Text style={styles.prodTitle} numberOfLines={1}>
                      {prod.title}
                    </Text>
                    <Text style={styles.prodPrice}>
                      {prod.currency || 'USD'} ${((prod.price_amount || 0) / 100).toFixed(2)} ·{' '}
                      {(prod.status || 'active').toUpperCase()}
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
  safeArea: {
    flex: 1,
    backgroundColor: TOKENS.canvas,
  },
  container: {
    paddingBottom: 44,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: TOKENS.textMuted,
    fontSize: 13,
    marginTop: 10,
    fontWeight: '600',
  },
  banner: {
    height: 112,
    backgroundColor: TOKENS.oceanDepth,
    justifyContent: 'flex-end',
    position: 'relative',
  },
  bannerOceanGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: TOKENS.oceanSoft,
  },
  bannerAccentBar: {
    flexDirection: 'row',
    height: 3,
    width: '100%',
  },
  bannerAccentTeal: {
    flex: 3,
    backgroundColor: TOKENS.teal,
  },
  bannerAccentOcean: {
    flex: 2,
    backgroundColor: TOKENS.action,
  },
  profileHeaderSection: {
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  avatarAndActionsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: -40,
    marginBottom: 12,
  },
  avatarRingWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    padding: 3,
    backgroundColor: TOKENS.canvas,
    borderWidth: 2.5,
    borderColor: TOKENS.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 38,
    backgroundColor: TOKENS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 38,
  },
  avatarText: {
    color: TOKENS.teal,
    fontSize: 23,
    fontWeight: '800',
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 2,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: TOKENS.raised,
    borderColor: TOKENS.borderStrong,
    borderWidth: 1,
    minHeight: 38,
    paddingHorizontal: 13,
    borderRadius: 11,
  },
  editButtonActive: {
    backgroundColor: TOKENS.tealSoft,
    borderColor: TOKENS.borderActive,
  },
  editButtonText: {
    color: TOKENS.textPrimary,
    fontSize: 12.5,
    fontWeight: '700',
  },
  editButtonTextActive: {
    color: TOKENS.teal,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: TOKENS.surface,
    borderColor: TOKENS.border,
    borderWidth: 1,
    minHeight: 38,
    paddingHorizontal: 12,
    borderRadius: 11,
  },
  logoutButtonText: {
    color: TOKENS.danger,
    fontSize: 12.5,
    fontWeight: '700',
  },
  identityBlock: {
    alignItems: 'flex-start',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  displayName: {
    color: TOKENS.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    flexShrink: 1,
  },
  username: {
    color: TOKENS.textMuted,
    fontSize: 13.5,
    fontWeight: '500',
    marginTop: 2,
  },
  bio: {
    color: TOKENS.textSecondary,
    fontSize: 14,
    marginTop: 10,
    lineHeight: 20,
  },
  bioEmpty: {
    color: TOKENS.textDim,
    fontSize: 13,
    marginTop: 10,
    lineHeight: 19,
  },
  metadataRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 14,
    marginTop: 11,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    color: TOKENS.textSecondary,
    fontSize: 12.5,
    fontWeight: '600',
  },
  metaTextMuted: {
    color: TOKENS.textMuted,
    fontSize: 12.5,
    fontWeight: '500',
  },
  editCard: {
    backgroundColor: TOKENS.surface,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: TOKENS.border,
    marginBottom: 16,
  },
  editHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 10,
  },
  editTitle: {
    color: TOKENS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  label: {
    color: TOKENS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 5,
    marginTop: 10,
  },
  countryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 5,
  },
  labelInline: {
    color: TOKENS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  clearCountryText: {
    color: TOKENS.teal,
    fontSize: 11.5,
    fontWeight: '700',
  },
  input: {
    backgroundColor: TOKENS.raised,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: TOKENS.border,
    paddingHorizontal: 13,
    paddingVertical: 10,
    color: TOKENS.textPrimary,
    fontSize: 13.5,
  },
  bioInput: {
    minHeight: 74,
    textAlignVertical: 'top',
  },
  countryScroll: {
    paddingVertical: 4,
    gap: 8,
  },
  countryChip: {
    backgroundColor: TOKENS.raised,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: TOKENS.border,
  },
  countryChipActive: {
    backgroundColor: TOKENS.tealSoft,
    borderColor: TOKENS.borderActive,
  },
  countryText: {
    color: TOKENS.textMuted,
    fontSize: 11.5,
    fontWeight: '600',
  },
  countryTextActive: {
    color: TOKENS.teal,
    fontWeight: '700',
  },
  saveButton: {
    backgroundColor: TOKENS.teal,
    borderRadius: 12,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    color: TOKENS.actionText,
    fontSize: 14,
    fontWeight: '800',
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: TOKENS.surface,
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: TOKENS.border,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    color: TOKENS.textPrimary,
    fontSize: 17,
    fontWeight: '800',
  },
  statLabel: {
    color: TOKENS.textMuted,
    fontSize: 11.5,
    fontWeight: '500',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 26,
    backgroundColor: TOKENS.border,
  },
  quickCardsRow: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  quickCard: {
    flex: 1,
    backgroundColor: TOKENS.surface,
    borderColor: TOKENS.border,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 14,
    alignItems: 'center',
    gap: 7,
  },
  quickIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickCardLabel: {
    color: TOKENS.textPrimary,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: TOKENS.border,
    marginBottom: 14,
    paddingHorizontal: 16,
  },
  contentTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  contentTabActive: {
    borderBottomColor: TOKENS.teal,
  },
  contentTabText: {
    color: TOKENS.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  contentTabTextActive: {
    color: TOKENS.teal,
    fontWeight: '700',
  },
  tabContent: {
    paddingHorizontal: 16,
  },
  emptyTabBox: {
    paddingVertical: 40,
    alignItems: 'center',
    backgroundColor: TOKENS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: TOKENS.border,
  },
  emptyIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: TOKENS.tealSoft,
    borderWidth: 1,
    borderColor: TOKENS.borderActive,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emptyTabText: {
    color: TOKENS.textMuted,
    fontSize: 13.5,
    fontWeight: '600',
    marginBottom: 14,
  },
  createShortcutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: TOKENS.teal,
    paddingHorizontal: 16,
    minHeight: 40,
    borderRadius: 11,
  },
  createShortcutText: {
    color: TOKENS.actionText,
    fontSize: 12.5,
    fontWeight: '800',
  },
  postItem: {
    backgroundColor: TOKENS.surface,
    borderWidth: 1,
    borderColor: TOKENS.border,
    borderRadius: 15,
    padding: 14,
    marginBottom: 10,
  },
  postText: {
    color: TOKENS.textPrimary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  postImg: {
    width: '100%',
    height: 170,
    borderRadius: 11,
    backgroundColor: TOKENS.raised,
    marginBottom: 10,
  },
  postMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: TOKENS.border,
    paddingTop: 9,
  },
  postDate: {
    color: TOKENS.textMuted,
    fontSize: 11.5,
  },
  postStats: {
    flexDirection: 'row',
    gap: 14,
  },
  postStatPair: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  postStat: {
    color: TOKENS.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  reelsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  reelThumb: {
    width: (screenWidth - 48) / 3,
    height: 148,
    borderRadius: 12,
    backgroundColor: TOKENS.oceanDepth,
    borderWidth: 1,
    borderColor: TOKENS.border,
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
    backgroundColor: TOKENS.oceanDepth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reelOverlay: {
    position: 'absolute',
    bottom: 7,
    left: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: TOKENS.scrim,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  reelLikes: {
    color: TOKENS.textPrimary,
    fontSize: 10.5,
    fontWeight: '700',
  },
  prodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: TOKENS.surface,
    borderWidth: 1,
    borderColor: TOKENS.border,
    borderRadius: 14,
    padding: 11,
    marginBottom: 9,
    gap: 12,
  },
  prodImg: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: TOKENS.raised,
  },
  prodImgPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: TOKENS.raised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prodInfoCol: {
    flex: 1,
  },
  prodTitle: {
    color: TOKENS.textPrimary,
    fontSize: 13.5,
    fontWeight: '700',
  },
  prodPrice: {
    color: TOKENS.teal,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
});
