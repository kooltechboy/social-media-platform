import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  TextInput,
  Image,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons as ExpoIonicons } from '@expo/vector-icons';
import { TOKENS } from '../theme/tokens';
import { supabase } from '../lib/supabase';

const Ionicons = ExpoIonicons as unknown as React.ComponentType<any>;

export interface FriendProfile {
  id: string;
  display_name: string;
  username: string;
  avatar_url?: string | null;
  bio?: string | null;
  country?: string | null;
  is_verified?: boolean;
  is_official?: boolean;
  mutual_count?: number;
  friendship_id?: string;
  created_at?: string;
}

type TabMode = 'friends' | 'requests' | 'discover';
type RequestsSubTab = 'incoming' | 'sent';

export function FriendsScreen({ navigation }: any) {
  const [activeTab, setActiveTab] = useState<TabMode>('friends');
  const [requestsSubTab, setRequestsSubTab] = useState<RequestsSubTab>('incoming');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data collections
  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendProfile[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendProfile[]>([]);
  const [discoverMembers, setDiscoverMembers] = useState<FriendProfile[]>([]);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [actionPendingId, setActionPendingId] = useState<string | null>(null);

  const fetchRelationshipData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        setRefreshing(false);
        return;
      }
      setCurrentUserId(user.id);

      // 1. Fetch Accepted Friends
      const { data: frData } = await supabase
        .from('friendships')
        .select('id, requester_id, addressee_id, updated_at')
        .eq('status', 'accepted')
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
        .order('updated_at', { ascending: false });

      if (frData && frData.length > 0) {
        const friendIds = frData.map((f) => (f.requester_id === user.id ? f.addressee_id : f.requester_id));
        const { data: profs } = await supabase
          .from('profiles')
          .select('id, display_name, username, avatar_url, bio, country, is_verified, is_official')
          .in('id', friendIds);

        const profMap = new Map((profs || []).map((p) => [p.id, p]));
        const mappedFriends: FriendProfile[] = frData.map((f) => {
          const friendId = f.requester_id === user.id ? f.addressee_id : f.requester_id;
          const p = profMap.get(friendId);
          return {
            id: friendId,
            friendship_id: f.id,
            display_name: p?.display_name || p?.username || 'Caribbean Member',
            username: p?.username || friendId.slice(0, 8),
            avatar_url: p?.avatar_url,
            bio: p?.bio,
            country: p?.country,
            is_verified: !!p?.is_verified,
            is_official: !!p?.is_official,
          };
        });
        setFriends(mappedFriends);
      } else {
        setFriends([]);
      }

      // 2. Fetch Incoming Requests (status = pending, addressee_id = current user)
      const { data: inData } = await supabase
        .from('friendships')
        .select('id, requester_id, created_at')
        .eq('status', 'pending')
        .eq('addressee_id', user.id)
        .order('created_at', { ascending: false });

      if (inData && inData.length > 0) {
        const requesterIds = inData.map((r) => r.requester_id);
        const { data: reqProfs } = await supabase
          .from('profiles')
          .select('id, display_name, username, avatar_url, bio, country, is_verified')
          .in('id', requesterIds);

        const reqMap = new Map((reqProfs || []).map((p) => [p.id, p]));
        const mappedIncoming: FriendProfile[] = inData.map((r) => {
          const p = reqMap.get(r.requester_id);
          return {
            id: r.requester_id,
            friendship_id: r.id,
            display_name: p?.display_name || p?.username || 'Caribbean Member',
            username: p?.username || r.requester_id.slice(0, 8),
            avatar_url: p?.avatar_url,
            bio: p?.bio,
            country: p?.country,
            is_verified: !!p?.is_verified,
            created_at: r.created_at,
          };
        });
        setIncomingRequests(mappedIncoming);
      } else {
        setIncomingRequests([]);
      }

      // 3. Fetch Outgoing/Sent Requests (status = pending, requester_id = current user)
      const { data: outData } = await supabase
        .from('friendships')
        .select('id, addressee_id, created_at')
        .eq('status', 'pending')
        .eq('requester_id', user.id)
        .order('created_at', { ascending: false });

      if (outData && outData.length > 0) {
        const targetIds = outData.map((r) => r.addressee_id);
        const { data: outProfs } = await supabase
          .from('profiles')
          .select('id, display_name, username, avatar_url, bio, country, is_verified')
          .in('id', targetIds);

        const outMap = new Map((outProfs || []).map((p) => [p.id, p]));
        const mappedOutgoing: FriendProfile[] = outData.map((r) => {
          const p = outMap.get(r.addressee_id);
          return {
            id: r.addressee_id,
            friendship_id: r.id,
            display_name: p?.display_name || p?.username || 'Caribbean Member',
            username: p?.username || r.addressee_id.slice(0, 8),
            avatar_url: p?.avatar_url,
            bio: p?.bio,
            country: p?.country,
            is_verified: !!p?.is_verified,
            created_at: r.created_at,
          };
        });
        setOutgoingRequests(mappedOutgoing);
      } else {
        setOutgoingRequests([]);
      }

      // 4. Fetch Discoverable Members (excluding self)
      const { data: discData } = await supabase
        .from('profiles')
        .select('id, display_name, username, avatar_url, bio, country, is_verified, is_official')
        .neq('id', user.id)
        .eq('is_private', false)
        .limit(25);

      if (discData) {
        setDiscoverMembers(
          discData.map((p) => ({
            id: p.id,
            display_name: p.display_name || p.username || 'Caribbean Member',
            username: p.username || p.id.slice(0, 8),
            avatar_url: p.avatar_url,
            bio: p.bio,
            country: p.country,
            is_verified: !!p.is_verified,
            is_official: !!p.is_official,
          }))
        );
      }
    } catch (err) {
      console.warn('[FriendsScreen] Fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRelationshipData();
  }, [fetchRelationshipData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRelationshipData();
  };

  // Actions
  const handleAcceptRequest = async (item: FriendProfile) => {
    if (!currentUserId || !item.friendship_id) return;
    setActionPendingId(item.id);
    try {
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('id', item.friendship_id)
        .eq('addressee_id', currentUserId);

      if (error) throw error;

      // Update local state
      setIncomingRequests((prev) => prev.filter((r) => r.id !== item.id));
      setFriends((prev) => [item, ...prev]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not accept friend request.');
    } finally {
      setActionPendingId(null);
    }
  };

  const handleDeclineRequest = async (item: FriendProfile) => {
    if (!currentUserId || !item.friendship_id) return;
    setActionPendingId(item.id);
    try {
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'declined', updated_at: new Date().toISOString() })
        .eq('id', item.friendship_id)
        .eq('addressee_id', currentUserId);

      if (error) throw error;
      setIncomingRequests((prev) => prev.filter((r) => r.id !== item.id));
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not decline friend request.');
    } finally {
      setActionPendingId(null);
    }
  };

  const handleCancelRequest = async (item: FriendProfile) => {
    if (!currentUserId || !item.friendship_id) return;
    setActionPendingId(item.id);
    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', item.friendship_id)
        .eq('requester_id', currentUserId);

      if (error) throw error;
      setOutgoingRequests((prev) => prev.filter((r) => r.id !== item.id));
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not cancel friend request.');
    } finally {
      setActionPendingId(null);
    }
  };

  const handleUnfriend = (item: FriendProfile) => {
    Alert.alert(
      'Remove Friend',
      `Are you sure you want to remove ${item.display_name} as a friend? You will remain members of TUKUBI.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unfriend',
          style: 'destructive',
          onPress: async () => {
            if (!currentUserId) return;
            setActionPendingId(item.id);
            try {
              const { error } = await supabase
                .from('friendships')
                .delete()
                .or(
                  `and(requester_id.eq.${currentUserId},addressee_id.eq.${item.id}),and(requester_id.eq.${item.id},addressee_id.eq.${currentUserId})`
                );

              if (error) throw error;
              setFriends((prev) => prev.filter((f) => f.id !== item.id));
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Could not remove friend.');
            } finally {
              setActionPendingId(null);
            }
          },
        },
      ]
    );
  };

  const handleSendFriendRequest = async (item: FriendProfile) => {
    if (!currentUserId) return;
    if (item.is_official || item.username?.toLowerCase() === 'tukubi') {
      Alert.alert('Official Account', 'Official TUKUBI accounts are follow-only.');
      return;
    }

    setActionPendingId(item.id);
    try {
      const { data, error } = await supabase
        .from('friendships')
        .insert({
          requester_id: currentUserId,
          addressee_id: item.id,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      setOutgoingRequests((prev) => [{ ...item, friendship_id: data.id }, ...prev]);
      Alert.alert('Request Sent', `Friend request sent to ${item.display_name}.`);
    } catch (err: any) {
      Alert.alert('Notice', err.message || 'Friend request could not be sent.');
    } finally {
      setActionPendingId(null);
    }
  };

  // Filter list by search query
  const filterByQuery = (list: FriendProfile[]) => {
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (p) =>
        p.display_name.toLowerCase().includes(q) ||
        p.username.toLowerCase().includes(q) ||
        (p.country && p.country.toLowerCase().includes(q))
    );
  };

  const currentList =
    activeTab === 'friends'
      ? filterByQuery(friends)
      : activeTab === 'requests'
      ? requestsSubTab === 'incoming'
        ? incomingRequests
        : outgoingRequests
      : filterByQuery(discoverMembers);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centerBox]}>
        <ActivityIndicator size="large" color={TOKENS.action} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation?.goBack()}
          style={styles.backBtn}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={22} color={TOKENS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Friends & Relationships</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Main Tabs */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'friends' && styles.tabBtnActive]}
          onPress={() => setActiveTab('friends')}
        >
          <Text style={[styles.tabText, activeTab === 'friends' && styles.tabTextActive]}>
            Friends ({friends.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'requests' && styles.tabBtnActive]}
          onPress={() => setActiveTab('requests')}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={[styles.tabText, activeTab === 'requests' && styles.tabTextActive]}>
              Requests
            </Text>
            {incomingRequests.length > 0 && (
              <View style={styles.requestsBadge}>
                <Text style={styles.requestsBadgeText}>{incomingRequests.length}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'discover' && styles.tabBtnActive]}
          onPress={() => setActiveTab('discover')}
        >
          <Text style={[styles.tabText, activeTab === 'discover' && styles.tabTextActive]}>
            Discover
          </Text>
        </TouchableOpacity>
      </View>

      {/* Requests Sub-tabs */}
      {activeTab === 'requests' && (
        <View style={styles.subTabsRow}>
          <TouchableOpacity
            style={[styles.subTabBtn, requestsSubTab === 'incoming' && styles.subTabBtnActive]}
            onPress={() => setRequestsSubTab('incoming')}
          >
            <Text
              style={[
                styles.subTabText,
                requestsSubTab === 'incoming' && styles.subTabTextActive,
              ]}
            >
              Incoming ({incomingRequests.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.subTabBtn, requestsSubTab === 'sent' && styles.subTabBtnActive]}
            onPress={() => setRequestsSubTab('sent')}
          >
            <Text
              style={[
                styles.subTabText,
                requestsSubTab === 'sent' && styles.subTabTextActive,
              ]}
            >
              Sent ({outgoingRequests.length})
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Search Input for Friends and Discover tabs */}
      {activeTab !== 'requests' && (
        <View style={styles.searchBar}>
          <Ionicons name="search" size={16} color={TOKENS.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder={
              activeTab === 'friends' ? 'Search friends...' : 'Search Caribbean diaspora...'
            }
            placeholderTextColor={TOKENS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color={TOKENS.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* List Content */}
      <FlatList
        data={currentList}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={TOKENS.action} />
        }
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name={
                activeTab === 'friends'
                  ? 'people-outline'
                  : activeTab === 'requests'
                  ? 'mail-open-outline'
                  : 'compass-outline'
              }
              size={54}
              color={TOKENS.action}
            />
            <Text style={styles.emptyTitle}>
              {activeTab === 'friends'
                ? searchQuery
                  ? 'No matching friends found'
                  : 'No friends added yet'
                : activeTab === 'requests'
                ? requestsSubTab === 'incoming'
                  ? 'No incoming requests'
                  : 'No sent requests'
                : 'No members found'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'friends'
                ? 'Friends on TUKUBI are mutual, accepted connections. Switch to Discover to connect with Caribbean diaspora members.'
                : activeTab === 'requests'
                ? requestsSubTab === 'incoming'
                  ? "You're all caught up on friend requests!"
                  : 'You have no pending outgoing friend requests.'
                : 'Check your search query or explore other Caribbean islands.'}
            </Text>
            {activeTab === 'friends' && !searchQuery && (
              <TouchableOpacity
                style={styles.emptyActionBtn}
                onPress={() => setActiveTab('discover')}
              >
                <Text style={styles.emptyActionText}>Discover People</Text>
              </TouchableOpacity>
            )}
          </View>
        }
        renderItem={({ item }) => {
          const isFriend = friends.some((f) => f.id === item.id);
          const isPendingSent = outgoingRequests.some((r) => r.id === item.id);
          const isPendingReceived = incomingRequests.some((r) => r.id === item.id);
          const isBusy = actionPendingId === item.id;

          return (
            <View style={styles.card}>
              <TouchableOpacity
                style={styles.cardLeft}
                onPress={() => navigation?.navigate('Profile', { userId: item.id })}
                activeOpacity={0.8}
              >
                {item.avatar_url ? (
                  <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarFallbackText}>
                      {(item.display_name || item.username).slice(0, 2).toUpperCase()}
                    </Text>
                  </View>
                )}

                <View style={styles.cardMeta}>
                  <View style={styles.nameRow}>
                    <Text style={styles.cardName} numberOfLines={1}>
                      {item.display_name}
                    </Text>
                    {item.is_verified && (
                      <Ionicons name="checkmark-circle" size={14} color={TOKENS.action} />
                    )}
                    <View
                      style={[
                        styles.badge,
                        isFriend ? styles.badgeFriend : styles.badgeMember,
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          isFriend ? styles.badgeTextFriend : styles.badgeTextMember,
                        ]}
                      >
                        {isFriend ? 'Friend' : 'Member'}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.cardUsername}>@{item.username}</Text>
                  {item.country && (
                    <Text style={styles.cardCountry}>🌴 {item.country}</Text>
                  )}
                  {item.bio && (
                    <Text style={styles.cardBio} numberOfLines={1}>
                      {item.bio}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>

              {/* Action Buttons based on context */}
              <View style={styles.cardActions}>
                {activeTab === 'friends' && (
                  <TouchableOpacity
                    style={styles.unfriendBtn}
                    onPress={() => handleUnfriend(item)}
                    disabled={isBusy}
                  >
                    <Ionicons name="person-remove-outline" size={16} color="#F43F5E" />
                  </TouchableOpacity>
                )}

                {activeTab === 'requests' && requestsSubTab === 'incoming' && (
                  <View style={styles.requestsActionGroup}>
                    <TouchableOpacity
                      style={styles.acceptBtn}
                      onPress={() => handleAcceptRequest(item)}
                      disabled={isBusy}
                    >
                      {isBusy ? (
                        <ActivityIndicator size="small" color="#090D1A" />
                      ) : (
                        <Text style={styles.acceptBtnText}>Accept</Text>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.declineBtn}
                      onPress={() => handleDeclineRequest(item)}
                      disabled={isBusy}
                    >
                      <Text style={styles.declineBtnText}>Decline</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {activeTab === 'requests' && requestsSubTab === 'sent' && (
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => handleCancelRequest(item)}
                    disabled={isBusy}
                  >
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                )}

                {activeTab === 'discover' && (
                  <>
                    {isFriend ? (
                      <View style={styles.friendsTag}>
                        <Ionicons name="checkmark" size={12} color="#10B981" />
                        <Text style={styles.friendsTagText}>Friends</Text>
                      </View>
                    ) : isPendingSent ? (
                      <View style={styles.sentTag}>
                        <Text style={styles.sentTagText}>Sent</Text>
                      </View>
                    ) : isPendingReceived ? (
                      <TouchableOpacity
                        style={styles.acceptBtn}
                        onPress={() => {
                          const req = incomingRequests.find((r) => r.id === item.id);
                          if (req) handleAcceptRequest(req);
                        }}
                        disabled={isBusy}
                      >
                        <Text style={styles.acceptBtnText}>Accept</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={styles.addFriendBtn}
                        onPress={() => handleSendFriendRequest(item)}
                        disabled={isBusy}
                      >
                        <Ionicons name="person-add" size={14} color="#090D1A" />
                        <Text style={styles.addFriendBtnText}>Add</Text>
                      </TouchableOpacity>
                    )}
                  </>
                )}
              </View>
            </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: TOKENS.border,
    backgroundColor: TOKENS.surface,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: TOKENS.textPrimary,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: TOKENS.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: TOKENS.border,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 12,
  },
  tabBtnActive: {
    backgroundColor: TOKENS.action,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '800',
    color: TOKENS.textMuted,
  },
  tabTextActive: {
    color: '#090D1A',
  },
  requestsBadge: {
    marginLeft: 6,
    backgroundColor: '#F43F5E',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  requestsBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  subTabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: TOKENS.canvas,
    gap: 8,
  },
  subTabBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: TOKENS.surface,
    borderWidth: 1,
    borderColor: TOKENS.border,
  },
  subTabBtnActive: {
    backgroundColor: TOKENS.sea,
    borderColor: TOKENS.sea,
  },
  subTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: TOKENS.textMuted,
  },
  subTabTextActive: {
    color: '#090D1A',
    fontWeight: '900',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: TOKENS.surface,
    marginHorizontal: 16,
    marginVertical: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: TOKENS.border,
  },
  searchInput: {
    flex: 1,
    color: TOKENS.textPrimary,
    fontSize: 13,
    padding: 0,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: TOKENS.surface,
    padding: 12,
    borderRadius: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: TOKENS.border,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: TOKENS.canvas,
  },
  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: TOKENS.canvas,
    borderWidth: 1,
    borderColor: TOKENS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    fontSize: 15,
    fontWeight: '900',
    color: TOKENS.action,
  },
  cardMeta: {
    marginLeft: 12,
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  cardName: {
    fontSize: 14,
    fontWeight: '800',
    color: TOKENS.textPrimary,
    maxWidth: 130,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 8,
  },
  badgeFriend: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  badgeMember: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  badgeTextFriend: {
    color: '#10B981',
  },
  badgeTextMember: {
    color: TOKENS.textMuted,
  },
  cardUsername: {
    fontSize: 11,
    color: TOKENS.textMuted,
    marginTop: 1,
  },
  cardCountry: {
    fontSize: 11,
    color: TOKENS.action,
    marginTop: 2,
  },
  cardBio: {
    fontSize: 11,
    color: TOKENS.textMuted,
    marginTop: 2,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unfriendBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
  },
  requestsActionGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  acceptBtn: {
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  acceptBtnText: {
    color: '#090D1A',
    fontWeight: '900',
    fontSize: 12,
  },
  declineBtn: {
    backgroundColor: TOKENS.canvas,
    borderWidth: 1,
    borderColor: TOKENS.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  declineBtnText: {
    color: TOKENS.textMuted,
    fontWeight: '700',
    fontSize: 12,
  },
  cancelBtn: {
    backgroundColor: TOKENS.canvas,
    borderWidth: 1,
    borderColor: TOKENS.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  cancelBtnText: {
    color: TOKENS.textMuted,
    fontWeight: '700',
    fontSize: 12,
  },
  friendsTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  friendsTagText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '800',
  },
  sentTag: {
    backgroundColor: TOKENS.canvas,
    borderWidth: 1,
    borderColor: TOKENS.border,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sentTagText: {
    color: TOKENS.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  addFriendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: TOKENS.action,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  addFriendBtnText: {
    color: '#090D1A',
    fontWeight: '900',
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: TOKENS.textPrimary,
    marginTop: 14,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 12,
    color: TOKENS.textMuted,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyActionBtn: {
    marginTop: 16,
    backgroundColor: TOKENS.action,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  emptyActionText: {
    color: '#090D1A',
    fontWeight: '900',
    fontSize: 13,
  },
});
