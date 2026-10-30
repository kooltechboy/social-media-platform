import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  ActivityIndicator,
  Image,
  Share,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons as ExpoIonicons } from '@expo/vector-icons';
import { TOKENS } from '../theme/tokens';
import { supabase, type MobilePost } from '../lib/supabase';

type IoniconName = keyof typeof ExpoIonicons.glyphMap;
const Ionicons = ExpoIonicons as unknown as React.ComponentType<{
  name: IoniconName;
  size?: number;
  color?: string;
  style?: any;
}>;

interface StoryItem {
  id: string;
  name: string;
  handle: string;
  avatarUrl?: string | null;
  hasUnseen: boolean;
  kind: 'self' | 'story' | 'channel';
  icon?: IoniconName;
  targetRoute?: string;
}

interface ReelPreview {
  id: string;
  title: string;
  creator: string;
  views: string;
}

interface MarketPreview {
  id: string;
  title: string;
  price: string;
  country: string;
}

type HomeFeedMode = 'for_you' | 'following' | 'communities' | 'caribbean' | 'live';

const FEED_TABS: Array<{ key: HomeFeedMode; label: string }> = [
  { key: 'for_you', label: 'For You' },
  { key: 'following', label: 'Following' },
  { key: 'communities', label: 'Communities' },
  { key: 'caribbean', label: 'Caribbean' },
  { key: 'live', label: 'Live' },
];

const DISCOVERY_CHANNELS: StoryItem[] = [
  {
    id: 'channel_pulse',
    name: 'Discover',
    handle: 'explore',
    hasUnseen: true,
    kind: 'channel',
    icon: 'compass-outline',
    targetRoute: 'Explore',
  },
  {
    id: 'channel_creators',
    name: 'Creators',
    handle: 'creators',
    hasUnseen: true,
    kind: 'channel',
    icon: 'people-outline',
    targetRoute: 'Explore',
  },
  {
    id: 'channel_sounds',
    name: 'Sounds',
    handle: 'sounds',
    hasUnseen: true,
    kind: 'channel',
    icon: 'musical-notes-outline',
    targetRoute: 'Explore',
  },
  {
    id: 'channel_trade',
    name: 'Market',
    handle: 'market',
    hasUnseen: true,
    kind: 'channel',
    icon: 'bag-handle-outline',
    targetRoute: 'Explore',
  },
];

export function HomeScreen({ navigation }: any) {
  const [posts, setPosts] = useState<MobilePost[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reels, setReels] = useState<ReelPreview[]>([]);
  const [products, setProducts] = useState<MarketPreview[]>([]);
  const [feedMode, setFeedMode] = useState<HomeFeedMode>('for_you');

  const [stories, setStories] = useState<StoryItem[]>([
    { id: 'add_story', name: 'Your Story', handle: 'you', hasUnseen: false, kind: 'self' },
    ...DISCOVERY_CHANNELS,
  ]);
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  const [savedPosts, setSavedPosts] = useState<Record<string, boolean>>({});

  const fetchDiscoveryData = useCallback(async (mode: HomeFeedMode = 'for_you') => {
    try {
      let postsQuery = supabase
        .from('posts')
        .select(`
          id,
          content,
          media_urls,
          link_preview,
          link_previews,
          created_at,
          likes_count,
          comments_count,
          location_name,
          visibility,
          cultural_tags,
          profiles!author_id (
            id,
            display_name,
            username,
            avatar_url,
            is_verified
          )
        `)
        .eq('post_status', 'published')
        .order('created_at', { ascending: false })
        .limit(20);

      if (mode === 'caribbean') {
        postsQuery = postsQuery.contains('cultural_tags', ['caribbean']);
      } else if (mode === 'communities') {
        postsQuery = postsQuery.not('community_id', 'is', null);
      } else if (mode === 'live') {
        postsQuery = postsQuery.contains('cultural_tags', ['live']);
      } else if (mode === 'following') {
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user) {
          const { data: follows } = await supabase
            .from('follows')
            .select('following_id')
            .eq('follower_id', authData.user.id);
          const ids = (follows || []).map((f: any) => f.following_id);
          if (ids.length > 0) {
            postsQuery = postsQuery.in('author_id', ids);
          }
        }
      }

      const [postsRes, reelsRes, productsRes, storiesRes] = await Promise.all([
        postsQuery,
        supabase
          .from('videos')
          .select('id, title, view_count, profiles(display_name, username)')
          .eq('video_kind', 'reel')
          .eq('visibility', 'public')
          .order('view_count', { ascending: false })
          .limit(5),
        supabase
          .from('products')
          .select('id, title, price_minor, currency, businesses(name, country_iso)')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('stories')
          .select('id, profiles(display_name, username, avatar_url)')
          .gt('expires_at', new Date().toISOString())
          .limit(10),
      ]);

      if (postsRes.data) {
        const formatted: MobilePost[] = postsRes.data.map((item: any) => {
          const p = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
          return {
            id: item.id,
            author: p?.display_name || p?.username || 'Caribbean Member',
            authorHandle: p?.username ? `@${p.username}` : '@member',
            authorAvatar: p?.avatar_url || null,
            isVerified: Boolean(p?.is_verified),
            location: item.location_name || 'Caribbean',
            time: new Date(item.created_at).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            }),
            body: item.content || '',
            likes: item.likes_count || 0,
            comments: item.comments_count || 0,
            mediaUrls: item.media_urls || [],
            linkPreview: item.link_preview,
            linkPreviews: item.link_previews,
          };
        });
        setPosts(formatted);
      }

      if (reelsRes.data) {
        setReels(
          reelsRes.data.map((r: any) => {
            const p = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
            return {
              id: r.id,
              title: r.title || 'Short',
              creator: p?.display_name || p?.username || 'Creator',
              views: `${r.view_count || 0} views`,
            };
          })
        );
      }

      if (productsRes.data) {
        setProducts(
          productsRes.data.map((prod: any) => {
            const b = Array.isArray(prod.businesses) ? prod.businesses[0] : prod.businesses;
            return {
              id: prod.id,
              title: prod.title,
              price: `${prod.currency || 'USD'} $${((prod.price_minor || 0) / 100).toFixed(2)}`,
              country: b?.country_iso || 'Caribbean',
            };
          })
        );
      }

      const nextStories: StoryItem[] = [
        { id: 'add_story', name: 'Your Story', handle: 'you', hasUnseen: false, kind: 'self' },
      ];
      if (storiesRes.data && storiesRes.data.length > 0) {
        storiesRes.data.forEach((s: any) => {
          const p = Array.isArray(s.profiles) ? s.profiles[0] : s.profiles;
          nextStories.push({
            id: s.id,
            name: p?.display_name || p?.username || 'Creator',
            handle: p?.username || 'creator',
            avatarUrl: p?.avatar_url || null,
            hasUnseen: true,
            kind: 'story',
          });
        });
      } else {
        nextStories.push(...DISCOVERY_CHANNELS);
      }
      setStories(nextStories);
    } catch (err) {
      console.warn('Discovery fetch error', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchDiscoveryData(feedMode);
  }, [feedMode, fetchDiscoveryData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDiscoveryData(feedMode);
  };

  const handleToggleLike = async (postId: string) => {
    const isCurrentlyLiked = Boolean(likedPosts[postId]);
    setLikedPosts((prev) => ({ ...prev, [postId]: !isCurrentlyLiked }));
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, likes: Math.max(0, isCurrentlyLiked ? p.likes - 1 : p.likes + 1) }
          : p
      )
    );

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) {
        if (!isCurrentlyLiked) {
          await supabase.from('post_reactions').insert({
            post_id: postId,
            profile_id: userData.user.id,
            reaction_type: 'like',
          });
        } else {
          await supabase
            .from('post_reactions')
            .delete()
            .eq('post_id', postId)
            .eq('profile_id', userData.user.id);
        }
      }
    } catch {
      // Non-blocking optimistic sync
    }
  };

  const handleToggleSave = (postId: string) => {
    setSavedPosts((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  const handleSharePost = async (post: MobilePost) => {
    try {
      await Share.share({
        message: `${post.author} on TUKUBI: "${post.body}"\nhttps://tukubi.com/post/${post.id}`,
      });
    } catch {
      // Cancelled
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Clean Edge-to-Edge Underline Feed Tabs */}
      <View style={styles.tabsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.feedTabsContent}
          accessibilityRole="tablist"
        >
          {FEED_TABS.map((tab) => {
            const active = feedMode === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.feedTab, active && styles.feedTabActive]}
                onPress={() => setFeedMode(tab.key)}
                activeOpacity={0.75}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                accessibilityLabel={tab.label}
              >
                <View style={styles.feedTabLabelRow}>
                  {tab.key === 'live' && (
                    <View
                      style={[
                        styles.liveDot,
                        { backgroundColor: active ? TOKENS.teal : TOKENS.danger },
                      ]}
                    />
                  )}
                  <Text style={[styles.feedTabText, active && styles.feedTabTextActive]}>
                    {tab.label}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.mainScroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={TOKENS.teal} />
        }
      >
        {/* 1. Circular Ringed Stories & Cultural Moments Bar */}
        <View style={styles.storiesContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.storiesScroll}
          >
            {stories.map((story, idx) => {
              const isSelf = story.kind === 'self';
              const ringColor = isSelf
                ? TOKENS.borderStrong
                : idx % 2 === 1
                ? TOKENS.teal
                : TOKENS.action;

              return (
                <TouchableOpacity
                  key={story.id}
                  style={styles.storyItem}
                  activeOpacity={0.8}
                  onPress={() => {
                    if (isSelf) {
                      navigation?.navigate('Create');
                    } else if (story.kind === 'channel') {
                      navigation?.navigate(story.targetRoute || 'Explore');
                    } else {
                      Alert.alert('Moment', `${story.name}'s story`);
                    }
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={story.name}
                >
                  <View style={[styles.storyOuterRing, { borderColor: ringColor }]}>
                    <View style={styles.storyInnerCircle}>
                      {story.avatarUrl ? (
                        <Image source={{ uri: story.avatarUrl }} style={styles.storyAvatarImg} />
                      ) : story.kind === 'channel' && story.icon ? (
                        <Ionicons
                          name={story.icon}
                          size={22}
                          color={idx % 2 === 1 ? TOKENS.teal : TOKENS.action}
                        />
                      ) : isSelf ? (
                        <Ionicons name="person-outline" size={22} color={TOKENS.textSecondary} />
                      ) : (
                        <Text style={styles.storyAvatarText}>
                          {story.name.slice(0, 1).toUpperCase()}
                        </Text>
                      )}
                    </View>

                    {isSelf && (
                      <View style={styles.storyAddBadge}>
                        <Ionicons name="add" size={13} color={TOKENS.actionText} />
                      </View>
                    )}
                  </View>
                  <Text
                    style={[styles.storyLabel, !isSelf && styles.storyLabelActive]}
                    numberOfLines={1}
                  >
                    {story.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* 2. Executive Mobile Composer Card */}
        <View style={styles.composerCard}>
          <View style={styles.composerTopRow}>
            <View style={styles.composerAvatar}>
              <Ionicons name="person-outline" size={18} color={TOKENS.teal} />
            </View>
            <TouchableOpacity
              style={styles.composerTriggerPill}
              onPress={() => navigation?.navigate('Create')}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Create a new post"
            >
              <Text style={styles.composerTriggerText}>What&apos;s on your mind?</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.composerFooter}>
            <TouchableOpacity
              style={styles.shortcutBtn}
              onPress={() => navigation?.navigate('Create')}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="Share Photo"
            >
              <Ionicons name="image-outline" size={17} color={TOKENS.teal} />
              <Text style={styles.shortcutLabel}>Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shortcutBtn}
              onPress={() => navigation?.navigate('Shorts')}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="Open Shorts"
            >
              <Ionicons name="film-outline" size={17} color={TOKENS.action} />
              <Text style={styles.shortcutLabel}>Shorts</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shortcutBtn}
              onPress={() => navigation?.navigate('Live')}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="Go Live"
            >
              <Ionicons name="radio-outline" size={17} color={TOKENS.accent} />
              <Text style={styles.shortcutLabel}>Live</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shortcutBtn}
              onPress={() => navigation?.navigate('Marketplace')}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="Open Marketplace"
            >
              <Ionicons name="bag-handle-outline" size={17} color={TOKENS.purple} />
              <Text style={styles.shortcutLabel}>Market</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Live Lounge Banner when on Live Tab */}
        {feedMode === 'live' && (
          <TouchableOpacity
            style={styles.liveBannerCard}
            onPress={() => navigation?.navigate('Live')}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Open Live Broadcast Lounge"
          >
            <View style={styles.liveBannerIconWrap}>
              <Ionicons name="radio-outline" size={20} color={TOKENS.teal} />
            </View>
            <View style={styles.liveBannerBody}>
              <Text style={styles.liveBannerTitle}>Live Broadcast Lounge</Text>
              <Text style={styles.liveBannerSubtitle}>
                Watch active streams or start a live session across the Caribbean
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={TOKENS.teal} />
          </TouchableOpacity>
        )}

        {/* 3. Trending Shorts Rail */}
        {reels.length > 0 && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="film-outline" size={16} color={TOKENS.teal} />
                <Text style={styles.sectionTitle}>Trending Shorts</Text>
              </View>
              <TouchableOpacity
                style={styles.seeAllBtn}
                onPress={() => navigation?.navigate('Shorts')}
                accessibilityRole="button"
              >
                <Text style={styles.seeAllText}>See All</Text>
                <Ionicons name="chevron-forward" size={13} color={TOKENS.action} />
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.railScroll}
            >
              {reels.map((reel) => (
                <TouchableOpacity
                  key={reel.id}
                  style={styles.reelCard}
                  onPress={() => navigation?.navigate('Shorts')}
                  activeOpacity={0.85}
                >
                  <View style={styles.reelBadge}>
                    <Ionicons name="play" size={10} color={TOKENS.teal} />
                    <Text style={styles.reelBadgeText}>Short</Text>
                  </View>
                  <View style={styles.reelInfo}>
                    <Text style={styles.reelTitle} numberOfLines={2}>
                      {reel.title}
                    </Text>
                    <Text style={styles.reelCreator} numberOfLines={1}>
                      {reel.creator}
                    </Text>
                    <Text style={styles.reelViews} numberOfLines={1}>
                      {reel.views}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* 4. Marketplace Picks Rail */}
        {products.length > 0 && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="bag-handle-outline" size={16} color={TOKENS.action} />
                <Text style={styles.sectionTitle}>Marketplace Picks</Text>
              </View>
              <TouchableOpacity
                style={styles.seeAllBtn}
                onPress={() => navigation?.navigate('Marketplace')}
                accessibilityRole="button"
              >
                <Text style={styles.seeAllText}>Browse</Text>
                <Ionicons name="chevron-forward" size={13} color={TOKENS.action} />
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.railScroll}
            >
              {products.map((prod) => (
                <TouchableOpacity
                  key={prod.id}
                  style={styles.productCard}
                  onPress={() => navigation?.navigate('Marketplace')}
                  activeOpacity={0.85}
                >
                  <View style={styles.productIconRow}>
                    <View style={styles.productIconBadge}>
                      <Ionicons name="bag-handle-outline" size={14} color={TOKENS.teal} />
                    </View>
                    <Text style={styles.productPrice} numberOfLines={1}>
                      {prod.price}
                    </Text>
                  </View>
                  <Text style={styles.productTitle} numberOfLines={1}>
                    {prod.title}
                  </Text>
                  <View style={styles.productCountryRow}>
                    <Ionicons name="location-outline" size={11} color={TOKENS.textMuted} />
                    <Text style={styles.productCountry} numberOfLines={1}>
                      {prod.country}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* 5. Editorial Feed Stream */}
        {loading && !refreshing ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={TOKENS.teal} />
          </View>
        ) : posts.length === 0 ? (
          <View style={styles.emptyStateBox}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="newspaper-outline" size={28} color={TOKENS.teal} />
            </View>
            <Text style={styles.emptyStateTitle}>No posts in this feed yet</Text>
            <Text style={styles.emptyStateSubtitle}>
              {feedMode === 'caribbean'
                ? 'No regional posts match this view yet. Share the first update with the network.'
                : feedMode === 'communities'
                ? 'Join a community hub or publish a discussion to start the conversation.'
                : feedMode === 'following'
                ? 'Follow creators across TUKUBI to see their updates here.'
                : 'Be the first to share a perspective, photo, or update with the community.'}
            </Text>
            <TouchableOpacity
              style={styles.emptyStateBtn}
              onPress={() =>
                navigation?.navigate(feedMode === 'following' ? 'Explore' : 'Create')
              }
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={
                feedMode === 'following' ? 'Explore creators' : 'Create first post'
              }
            >
              <Ionicons
                name={feedMode === 'following' ? 'compass-outline' : 'add'}
                size={17}
                color={TOKENS.actionText}
              />
              <Text style={styles.emptyStateBtnText}>
                {feedMode === 'following' ? 'Discover Creators' : 'Create Post'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          posts.map((post) => {
            const isLiked = Boolean(likedPosts[post.id]);
            const isSaved = Boolean(savedPosts[post.id]);

            return (
              <View key={post.id} style={styles.postCard}>
                {/* 2-Line Editorial Author Header */}
                <View style={styles.postHeader}>
                  {post.authorAvatar ? (
                    <Image source={{ uri: post.authorAvatar }} style={styles.avatarImg} />
                  ) : (
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {post.author.slice(0, 1).toUpperCase()}
                      </Text>
                    </View>
                  )}

                  <View style={styles.authorMeta}>
                    <View style={styles.nameRow}>
                      <Text style={styles.authorName} numberOfLines={1}>
                        {post.author}
                      </Text>
                      {post.isVerified && (
                        <Ionicons name="checkmark-circle" size={15} color={TOKENS.teal} />
                      )}
                    </View>
                    <Text style={styles.authorSubline} numberOfLines={1}>
                      {post.authorHandle || '@member'} · {post.time} · {post.location}
                    </Text>
                  </View>
                </View>

                {/* Post Body */}
                {Boolean(post.body) && <Text style={styles.postBody}>{post.body}</Text>}

                {/* Media Attachment */}
                {post.mediaUrls && post.mediaUrls.length > 0 && (
                  <Image
                    source={{ uri: post.mediaUrls[0] }}
                    style={styles.postMedia}
                    resizeMode="cover"
                  />
                )}

                {/* Link Preview Card */}
                {post.linkPreview && (
                  <TouchableOpacity
                    style={styles.linkPreviewCard}
                    onPress={() => {
                      const target = post.linkPreview.original_url || post.linkPreview.url;
                      if (target) Linking.openURL(target).catch(() => {});
                    }}
                    activeOpacity={0.85}
                    accessibilityRole="link"
                    accessibilityLabel={`Link: ${post.linkPreview.title || post.linkPreview.url}`}
                  >
                    {post.linkPreview.thumbnail_url && (
                      <Image
                        source={{ uri: post.linkPreview.thumbnail_url }}
                        style={styles.linkPreviewThumb}
                        resizeMode="cover"
                      />
                    )}
                    <View style={styles.linkPreviewMeta}>
                      <View style={styles.linkDomainRow}>
                        <Ionicons name="link-outline" size={12} color={TOKENS.teal} />
                        <Text style={styles.linkPreviewDomain} numberOfLines={1}>
                          {(post.linkPreview.provider_name || 'External Link').toUpperCase()}
                        </Text>
                      </View>
                      <Text style={styles.linkPreviewTitle} numberOfLines={2}>
                        {post.linkPreview.title || post.linkPreview.url}
                      </Text>
                      {post.linkPreview.description && (
                        <Text style={styles.linkPreviewDesc} numberOfLines={2}>
                          {post.linkPreview.description}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                )}

                {/* Crisp Ionicons Engagement Bar */}
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleToggleLike(post.id)}
                    activeOpacity={0.75}
                    accessibilityRole="button"
                    accessibilityLabel="Like post"
                  >
                    <Ionicons
                      name={isLiked ? 'heart' : 'heart-outline'}
                      size={18}
                      color={isLiked ? TOKENS.danger : TOKENS.textMuted}
                    />
                    <Text
                      style={[
                        styles.actionBtnText,
                        isLiked && { color: TOKENS.danger, fontWeight: '700' },
                      ]}
                    >
                      {post.likes}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() =>
                      Alert.alert('Comments', `Discussion on post by ${post.author}`)
                    }
                    activeOpacity={0.75}
                    accessibilityRole="button"
                    accessibilityLabel="Comment on post"
                  >
                    <Ionicons name="chatbubble-outline" size={17} color={TOKENS.textMuted} />
                    <Text style={styles.actionBtnText}>{post.comments}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleSharePost(post)}
                    activeOpacity={0.75}
                    accessibilityRole="button"
                    accessibilityLabel="Share post"
                  >
                    <Ionicons name="arrow-redo-outline" size={18} color={TOKENS.textMuted} />
                    <Text style={styles.actionBtnText}>Share</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.bookmarkBtn}
                    onPress={() => handleToggleSave(post.id)}
                    activeOpacity={0.75}
                    accessibilityRole="button"
                    accessibilityLabel={isSaved ? 'Remove bookmark' : 'Bookmark post'}
                  >
                    <Ionicons
                      name={isSaved ? 'bookmark' : 'bookmark-outline'}
                      size={18}
                      color={isSaved ? TOKENS.teal : TOKENS.textMuted}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: TOKENS.canvas,
  },
  tabsWrapper: {
    backgroundColor: TOKENS.canvas,
    borderBottomWidth: 1,
    borderBottomColor: TOKENS.border,
  },
  feedTabsContent: {
    paddingHorizontal: 14,
    gap: 20,
  },
  feedTab: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 2,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  feedTabActive: {
    borderBottomColor: TOKENS.teal,
  },
  feedTabLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  feedTabText: {
    color: TOKENS.textMuted,
    fontSize: 13.5,
    fontWeight: '600',
  },
  feedTabTextActive: {
    color: TOKENS.textPrimary,
    fontWeight: '700',
  },
  mainScroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  storiesContainer: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: TOKENS.border,
  },
  storiesScroll: {
    paddingHorizontal: 14,
    gap: 14,
  },
  storyItem: {
    alignItems: 'center',
    width: 68,
  },
  storyOuterRing: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 2,
    padding: 2.5,
    backgroundColor: TOKENS.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  storyInnerCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 27,
    backgroundColor: TOKENS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  storyAvatarImg: {
    width: '100%',
    height: '100%',
  },
  storyAvatarText: {
    color: TOKENS.textPrimary,
    fontSize: 17,
    fontWeight: '800',
  },
  storyAddBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: TOKENS.teal,
    borderWidth: 2,
    borderColor: TOKENS.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyLabel: {
    color: TOKENS.textMuted,
    fontSize: 11,
    fontWeight: '500',
    marginTop: 6,
    textAlign: 'center',
  },
  storyLabelActive: {
    color: TOKENS.textSecondary,
    fontWeight: '600',
  },
  composerCard: {
    marginHorizontal: 14,
    marginTop: 14,
    marginBottom: 10,
    backgroundColor: TOKENS.surface,
    borderRadius: 16,
    padding: 13,
    borderWidth: 1,
    borderColor: TOKENS.border,
  },
  composerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  composerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: TOKENS.oceanDepth,
    borderWidth: 1,
    borderColor: TOKENS.borderActive,
    alignItems: 'center',
    justifyContent: 'center',
  },
  composerTriggerPill: {
    flex: 1,
    minHeight: 40,
    borderRadius: 999,
    backgroundColor: TOKENS.raised,
    borderWidth: 1,
    borderColor: TOKENS.border,
    paddingHorizontal: 15,
    justifyContent: 'center',
  },
  composerTriggerText: {
    color: TOKENS.textMuted,
    fontSize: 13.5,
    fontWeight: '500',
  },
  composerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: TOKENS.border,
    marginTop: 12,
    paddingTop: 10,
  },
  shortcutBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
    gap: 6,
  },
  shortcutLabel: {
    color: TOKENS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  liveBannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: TOKENS.oceanDepth,
    borderWidth: 1,
    borderColor: TOKENS.borderActive,
    borderRadius: 16,
    marginHorizontal: 14,
    marginVertical: 8,
    padding: 14,
    gap: 12,
  },
  liveBannerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: TOKENS.tealSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveBannerBody: {
    flex: 1,
  },
  liveBannerTitle: {
    color: TOKENS.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  liveBannerSubtitle: {
    color: TOKENS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  sectionContainer: {
    marginTop: 10,
    marginBottom: 6,
    paddingHorizontal: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  sectionTitle: {
    color: TOKENS.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 4,
  },
  seeAllText: {
    color: TOKENS.action,
    fontSize: 12,
    fontWeight: '600',
  },
  railScroll: {
    gap: 10,
    paddingRight: 4,
  },
  reelCard: {
    width: 126,
    height: 164,
    backgroundColor: TOKENS.oceanDepth,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: TOKENS.border,
    padding: 11,
    justifyContent: 'space-between',
  },
  reelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: TOKENS.tealSoft,
    borderWidth: 1,
    borderColor: TOKENS.borderActive,
    borderRadius: 999,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  reelBadgeText: {
    color: TOKENS.teal,
    fontSize: 10,
    fontWeight: '700',
  },
  reelInfo: {
    gap: 2,
  },
  reelTitle: {
    color: TOKENS.textPrimary,
    fontSize: 12.5,
    fontWeight: '700',
    lineHeight: 16,
  },
  reelCreator: {
    color: TOKENS.textSecondary,
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  reelViews: {
    color: TOKENS.textMuted,
    fontSize: 10,
  },
  productCard: {
    width: 156,
    backgroundColor: TOKENS.surface,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: TOKENS.border,
    padding: 12,
    gap: 6,
  },
  productIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  productIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: TOKENS.tealSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productPrice: {
    color: TOKENS.teal,
    fontSize: 12.5,
    fontWeight: '800',
  },
  productTitle: {
    color: TOKENS.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  productCountryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  productCountry: {
    color: TOKENS.textMuted,
    fontSize: 11,
  },
  centerBox: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postCard: {
    backgroundColor: TOKENS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: TOKENS.border,
    padding: 15,
    marginHorizontal: 14,
    marginTop: 10,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 11,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: TOKENS.oceanDepth,
    borderWidth: 1,
    borderColor: TOKENS.borderActive,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },
  avatarImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: TOKENS.border,
    marginRight: 11,
  },
  avatarText: {
    color: TOKENS.teal,
    fontSize: 15,
    fontWeight: '800',
  },
  authorMeta: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  authorName: {
    color: TOKENS.textPrimary,
    fontSize: 14.5,
    fontWeight: '700',
    flexShrink: 1,
  },
  authorSubline: {
    color: TOKENS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  postBody: {
    color: TOKENS.textPrimary,
    fontSize: 14.5,
    lineHeight: 21,
    marginBottom: 12,
  },
  postMedia: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    backgroundColor: TOKENS.raised,
    marginBottom: 12,
  },
  linkPreviewCard: {
    backgroundColor: TOKENS.raised,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: TOKENS.border,
    overflow: 'hidden',
    marginBottom: 12,
  },
  linkPreviewThumb: {
    width: '100%',
    height: 156,
    backgroundColor: TOKENS.oceanDepth,
  },
  linkPreviewMeta: {
    padding: 12,
  },
  linkDomainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  linkPreviewDomain: {
    color: TOKENS.teal,
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  linkPreviewTitle: {
    color: TOKENS.textPrimary,
    fontSize: 13.5,
    fontWeight: '700',
    lineHeight: 18,
    marginBottom: 3,
  },
  linkPreviewDesc: {
    color: TOKENS.textMuted,
    fontSize: 12,
    lineHeight: 16,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: TOKENS.border,
    paddingTop: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 36,
    paddingRight: 20,
  },
  actionBtnText: {
    color: TOKENS.textMuted,
    fontSize: 12.5,
    fontWeight: '600',
  },
  bookmarkBtn: {
    marginLeft: 'auto',
    minWidth: 36,
    minHeight: 36,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  emptyStateBox: {
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: TOKENS.surface,
    borderRadius: 16,
    marginHorizontal: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: TOKENS.border,
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: TOKENS.tealSoft,
    borderWidth: 1,
    borderColor: TOKENS.borderActive,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyStateTitle: {
    color: TOKENS.textPrimary,
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  emptyStateSubtitle: {
    color: TOKENS.textMuted,
    fontSize: 13.5,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 18,
  },
  emptyStateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: TOKENS.teal,
    paddingHorizontal: 18,
    minHeight: 42,
    borderRadius: 12,
  },
  emptyStateBtnText: {
    color: TOKENS.actionText,
    fontSize: 13.5,
    fontWeight: '800',
  },
});
