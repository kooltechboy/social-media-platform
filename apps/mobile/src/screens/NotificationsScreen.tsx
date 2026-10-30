import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  Image,
} from 'react-native';
import { Ionicons as ExpoIonicons } from '@expo/vector-icons';
import { TOKENS } from '../theme/tokens';
import { supabase } from '../lib/supabase';

const Ionicons = ExpoIonicons as unknown as React.ComponentType<any>;

interface NotificationItem {
  id: string;
  recipient_id: string;
  kind: string;
  actor_id?: string;
  entity_type?: string;
  entity_id?: string;
  payload?: any;
  read_at?: string | null;
  is_read?: boolean;
  created_at: string;
  profiles?: {
    username?: string;
    full_name?: string;
    avatar_url?: string;
  } | null;
}

type NotificationTab = 'all' | 'social' | 'marketplace' | 'system';

export function NotificationsScreen({ navigation }: any) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [activeTab, setActiveTab] = useState<NotificationTab>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const { data, error } = await supabase
        .from('notifications')
        .select(`
          id,
          recipient_id,
          kind,
          actor_id,
          entity_type,
          entity_id,
          payload,
          read_at,
          created_at,
          profiles:actor_id (
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (data && !error) {
        setNotifications(data as unknown as NotificationItem[]);
      }
    } catch (err) {
      console.warn('Could not fetch notifications:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const markAllRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const now = new Date().toISOString();
      await supabase
        .from('notifications')
        .update({ read_at: now, is_read: true } as any)
        .eq('recipient_id', user.id)
        .is('read_at', null);

      setNotifications((curr) => curr.map((n) => ({ ...n, read_at: now, is_read: true })));
    } catch (err) {
      console.warn('Error marking notifications read:', err);
    }
  };

  const handleNotificationPress = async (item: NotificationItem) => {
    if (!item.read_at) {
      const now = new Date().toISOString();
      setNotifications((curr) =>
        curr.map((n) => (n.id === item.id ? { ...n, read_at: now, is_read: true } : n))
      );
      try {
        await supabase
          .from('notifications')
          .update({ read_at: now, is_read: true } as any)
          .eq('id', item.id);
      } catch (err) {
        console.warn('Error marking read:', err);
      }
    }

    const kind = item.kind?.toLowerCase() || '';
    if (kind.includes('market') || kind.includes('offer') || kind.includes('order')) {
      navigation?.navigate('Marketplace');
    } else if (kind.includes('sound') || kind.includes('music')) {
      navigation?.navigate('Sounds', { soundId: item.entity_id });
    } else if (kind.includes('message') || kind.includes('chat')) {
      navigation?.navigate('Messages', { conversationId: item.entity_id });
    } else if (kind.includes('live')) {
      navigation?.navigate('Live');
    } else if (kind.includes('podcast')) {
      navigation?.navigate('Podcasts');
    } else if (kind.includes('friend_request') || kind.includes('friend')) {
      navigation?.navigate('Friends');
    } else if (kind.includes('follow') && item.actor_id) {
      navigation?.navigate('Profile', { userId: item.actor_id });
    } else {
      navigation?.navigate('Home');
    }
  };

  const getNotificationDetails = (item: NotificationItem) => {
    const actor = item.profiles;
    const actorName = actor?.full_name || (actor?.username ? `@${actor.username}` : 'TUKUBI member');
    const kind = item.kind?.toLowerCase() || '';

    let iconName = 'notifications-outline';
    let iconColor = TOKENS.teal;
    let iconBg = TOKENS.tealSoft;
    let title = 'Activity Update';
    let message = item.payload?.message || item.payload?.body || 'You have a new update.';

    if (kind.includes('like')) {
      iconName = 'heart';
      iconColor = TOKENS.danger;
      iconBg = TOKENS.oceanSoft;
      title = `${actorName} liked your post`;
      message = 'Your content is resonating across the network.';
    } else if (kind.includes('comment')) {
      iconName = 'chatbubble-ellipses-outline';
      iconColor = TOKENS.action;
      iconBg = TOKENS.oceanSoft;
      title = `${actorName} commented`;
      message = item.payload?.content || 'Shared a perspective on your discussion.';
    } else if (kind.includes('follow')) {
      iconName = 'person-add-outline';
      iconColor = TOKENS.teal;
      iconBg = TOKENS.tealSoft;
      title = `${actorName} followed you`;
      message = 'Started following your creator updates.';
    } else if (kind.includes('friend_request')) {
      iconName = 'people-outline';
      iconColor = TOKENS.teal;
      iconBg = TOKENS.tealSoft;
      title = `${actorName} sent a friend request`;
      message = 'Wants to connect with you on TUKUBI.';
    } else if (kind.includes('friend_accepted')) {
      iconName = 'checkmark-circle-outline';
      iconColor = TOKENS.success;
      iconBg = TOKENS.tealSoft;
      title = `${actorName} accepted your friend request`;
      message = 'You are now connected as friends.';
    } else if (kind.includes('marketplace') || kind.includes('offer')) {
      iconName = 'bag-handle-outline';
      iconColor = TOKENS.accent;
      iconBg = TOKENS.amberSoft;
      title = `Marketplace: ${item.payload?.title || 'Offer Received'}`;
      message = item.payload?.message || 'New offer or status update on your listing.';
    } else if (kind.includes('sound')) {
      iconName = 'musical-notes-outline';
      iconColor = TOKENS.purple;
      iconBg = TOKENS.violetSoft;
      title = 'Sound Royalty Credit';
      message = 'Your audio track was featured in a creator reel.';
    }

    return { iconName, iconColor, iconBg, title, message };
  };

  const filteredNotifications = notifications.filter((n) => {
    const kind = n.kind?.toLowerCase() || '';
    if (activeTab === 'social') {
      return kind.includes('like') || kind.includes('comment') || kind.includes('follow') || kind.includes('friend');
    }
    if (activeTab === 'marketplace') {
      return kind.includes('market') || kind.includes('offer') || kind.includes('order');
    }
    if (activeTab === 'system') {
      return kind.includes('system') || kind.includes('ledger') || kind.includes('payout');
    }
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centerBox]}>
        <ActivityIndicator size="large" color={TOKENS.teal} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadCountBadge}>
              <Text style={styles.unreadCountText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllRead} style={styles.markReadBtn}>
            <Ionicons name="checkmark-done-outline" size={15} color={TOKENS.teal} />
            <Text style={styles.markReadText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* High-Contrast Filter Chips */}
      <View style={styles.tabsRow}>
        {(
          [
            { key: 'all', label: 'All' },
            { key: 'social', label: 'Social' },
            { key: 'marketplace', label: 'Market' },
            { key: 'system', label: 'System' },
          ] as const
        ).map((tab) => {
          const active = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabChip, active && styles.tabChipActive]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.82}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Notifications List */}
      <FlatList
        data={filteredNotifications}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={TOKENS.teal} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="notifications-off-outline" size={28} color={TOKENS.teal} />
            </View>
            <Text style={styles.emptyTitle}>You are all caught up</Text>
            <Text style={styles.emptySubtitle}>
              New social interactions, marketplace escrow offers, and ledger settlements will appear here.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const isUnread = !item.read_at;
          const { iconName, iconColor, iconBg, title, message } = getNotificationDetails(item);
          const actor = item.profiles;

          return (
            <TouchableOpacity
              style={[styles.notificationCard, isUnread && styles.unreadCard]}
              onPress={() => handleNotificationPress(item)}
              activeOpacity={0.82}
            >
              {actor?.avatar_url ? (
                <Image source={{ uri: actor.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
                  <Ionicons name={iconName} size={20} color={iconColor} />
                </View>
              )}

              <View style={styles.contentContainer}>
                <Text style={styles.title} numberOfLines={1}>
                  {title}
                </Text>
                <Text style={styles.body} numberOfLines={2}>
                  {message}
                </Text>
                <Text style={styles.timestamp}>
                  {new Date(item.created_at).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>

              {isUnread && <View style={styles.unreadDot} />}
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: TOKENS.canvas,
  },
  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 13,
    backgroundColor: TOKENS.surface,
    borderBottomWidth: 1,
    borderBottomColor: TOKENS.border,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    color: TOKENS.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  unreadCountBadge: {
    backgroundColor: TOKENS.teal,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  unreadCountText: {
    color: TOKENS.actionText,
    fontSize: 11,
    fontWeight: '800',
  },
  markReadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: TOKENS.tealSoft,
    borderWidth: 1,
    borderColor: TOKENS.borderActive,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  markReadText: {
    color: TOKENS.teal,
    fontSize: 12,
    fontWeight: '700',
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: TOKENS.surface,
    borderBottomWidth: 1,
    borderBottomColor: TOKENS.border,
  },
  tabChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: TOKENS.raised,
    borderWidth: 1,
    borderColor: TOKENS.border,
  },
  tabChipActive: {
    backgroundColor: TOKENS.teal,
    borderColor: TOKENS.teal,
  },
  tabText: {
    color: TOKENS.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  tabTextActive: {
    color: TOKENS.actionText,
    fontWeight: '800',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  notificationCard: {
    flexDirection: 'row',
    padding: 14,
    backgroundColor: TOKENS.surface,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: TOKENS.border,
    alignItems: 'center',
    gap: 12,
  },
  unreadCard: {
    backgroundColor: TOKENS.oceanDepth,
    borderColor: TOKENS.borderActive,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: TOKENS.raised,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: TOKENS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    color: TOKENS.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  body: {
    color: TOKENS.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 4,
  },
  timestamp: {
    color: TOKENS.textDim,
    fontSize: 11,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: TOKENS.teal,
  },
  emptyBox: {
    paddingVertical: 72,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: TOKENS.tealSoft,
    borderWidth: 1,
    borderColor: TOKENS.borderActive,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    color: TOKENS.textPrimary,
    fontSize: 17,
    fontWeight: '800',
    marginTop: 14,
    marginBottom: 6,
  },
  emptySubtitle: {
    color: TOKENS.textMuted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
});
