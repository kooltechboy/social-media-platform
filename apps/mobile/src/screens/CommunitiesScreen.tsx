import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons as ExpoIonicons } from '@expo/vector-icons';
import { TOKENS } from '../theme/tokens';
import { supabase } from '../lib/supabase';

const Ionicons = ExpoIonicons as unknown as React.ComponentType<any>;

interface CommunityItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  join_policy: string;
  is_paid: boolean;
  country_iso?: string;
  member_count: number;
  created_by?: string;
}

function getHubIconName(policy: string): string {
  if (policy === 'private') return 'lock-closed-outline';
  if (policy === 'invite_only') return 'people-outline';
  return 'earth-outline';
}

export function CommunitiesScreen({ navigation: _navigation }: any) {
  const [communities, setCommunities] = useState<CommunityItem[]>([]);
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<'all' | 'my'>('all');

  // Create Hub Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [hubName, setHubName] = useState('');
  const [hubDesc, setHubDesc] = useState('');
  const [hubCountry, setHubCountry] = useState('JAM');
  const [hubPolicy, setHubPolicy] = useState<'public' | 'private' | 'invite_only'>('public');
  const [creatingHub, setCreatingHub] = useState(false);

  const fetchCommunities = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data: memberRows } = await supabase
          .from('community_members')
          .select('community_id')
          .eq('profile_id', user.id)
          .eq('membership_status', 'active');

        if (memberRows) {
          setJoinedIds(new Set(memberRows.map((m) => m.community_id)));
        }
      }

      const { data, error } = await supabase
        .from('communities')
        .select('id, name, slug, description, join_policy, is_paid, country_iso, member_count, created_by')
        .order('member_count', { ascending: false })
        .limit(50);

      if (!error && data) {
        setCommunities(data);
      }
    } catch (err) {
      console.warn('Error fetching communities:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCommunities();
  }, [fetchCommunities]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCommunities();
  };

  const toggleJoin = async (community: CommunityItem) => {
    if (!userId) {
      Alert.alert('Authentication Required', 'Please sign in to join Caribbean hubs.');
      return;
    }

    const isJoined = joinedIds.has(community.id);
    const newJoined = new Set(joinedIds);

    if (isJoined) {
      newJoined.delete(community.id);
      setJoinedIds(newJoined);
      setCommunities((curr) =>
        curr.map((c) =>
          c.id === community.id ? { ...c, member_count: Math.max(0, c.member_count - 1) } : c
        )
      );

      try {
        await supabase
          .from('community_members')
          .delete()
          .eq('community_id', community.id)
          .eq('profile_id', userId);
      } catch (err) {
        console.warn('Error leaving community:', err);
      }
    } else {
      newJoined.add(community.id);
      setJoinedIds(newJoined);
      setCommunities((curr) =>
        curr.map((c) =>
          c.id === community.id ? { ...c, member_count: c.member_count + 1 } : c
        )
      );

      try {
        await supabase.from('community_members').insert({
          community_id: community.id,
          profile_id: userId,
          membership_status: 'active',
        });
      } catch (err) {
        console.warn('Error joining community:', err);
      }
    }
  };

  const handleCreateHub = async () => {
    if (!hubName.trim()) {
      Alert.alert('Validation Error', 'Please enter a name for your Hub.');
      return;
    }
    if (!userId) {
      Alert.alert('Authentication Required', 'Please sign in to create a Caribbean hub.');
      return;
    }

    setCreatingHub(true);
    try {
      const slug =
        hubName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '') + `-${Date.now().toString(36)}`;

      const { data, error } = await supabase
        .from('communities')
        .insert({
          name: hubName.trim(),
          slug,
          description: hubDesc.trim(),
          join_policy: hubPolicy,
          country_iso: hubCountry,
          member_count: 1,
          created_by: userId,
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        await supabase.from('community_members').insert({
          community_id: data.id,
          profile_id: userId,
          membership_status: 'active',
        });

        Alert.alert('Hub Created', `"${hubName}" has been launched.`);
        setModalVisible(false);
        setHubName('');
        setHubDesc('');
        fetchCommunities();
      }
    } catch (err: any) {
      Alert.alert('Hub Creation Failed', err.message || 'Unable to create hub.');
    } finally {
      setCreatingHub(false);
    }
  };

  const displayedCommunities = communities.filter((c) => {
    if (filterTab === 'my') {
      return joinedIds.has(c.id);
    }
    return true;
  });

  if (loading) {
    return (
      <View style={[styles.screen, styles.centerBox]}>
        <ActivityIndicator size="large" color={TOKENS.teal} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleBlock}>
          <Text style={styles.screenTitle}>Caribbean Hubs</Text>
          <Text style={styles.screenSubtitle}>Regional circles, diaspora networks &amp; creator guilds</Text>
        </View>
        <TouchableOpacity
          style={styles.createHubBtn}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Create a new community hub"
        >
          <Text style={styles.createHubText}>+ New Hub</Text>
        </TouchableOpacity>
      </View>

      {/* Segmented Underline Tabs */}
      <View style={styles.tabsBar}>
        <TouchableOpacity
          style={[styles.tabItem, filterTab === 'all' && styles.tabItemActive]}
          onPress={() => setFilterTab('all')}
        >
          <Text style={[styles.tabText, filterTab === 'all' && styles.tabTextActive]}>
            All Hubs ({communities.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, filterTab === 'my' && styles.tabItemActive]}
          onPress={() => setFilterTab('my')}
        >
          <Text style={[styles.tabText, filterTab === 'my' && styles.tabTextActive]}>
            My Hubs ({joinedIds.size})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Hubs List */}
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={TOKENS.teal} />}
      >
        {displayedCommunities.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyBadge}>
              <Ionicons name="people-outline" size={30} color={TOKENS.teal} />
            </View>
            <Text style={styles.emptyTitle}>
              {filterTab === 'my' ? "You Haven't Joined Any Hubs" : 'No Hubs Available Yet'}
            </Text>
            <Text style={styles.emptySub}>
              {filterTab === 'my'
                ? 'Explore all Caribbean hubs to connect with regional networks and diaspora circles.'
                : 'Launch the first community hub for your territory, diaspora city, or creative discipline.'}
            </Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => setModalVisible(true)}>
              <Text style={styles.emptyBtnText}>+ Launch First Hub</Text>
            </TouchableOpacity>
          </View>
        ) : (
          displayedCommunities.map((item) => {
            const isMember = joinedIds.has(item.id);
            const iconName = getHubIconName(item.join_policy);
            return (
              <View key={item.id} style={styles.card}>
                <View style={styles.cardIconContainer}>
                  <Ionicons name={iconName} size={20} color={TOKENS.teal} />
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
                  {item.description ? (
                    <Text style={styles.cardDesc} numberOfLines={2}>
                      {item.description}
                    </Text>
                  ) : null}
                  <View style={styles.cardMetaRow}>
                    <Text style={styles.cardMeta}>
                      {item.member_count} {item.member_count === 1 ? 'member' : 'members'}
                    </Text>
                    <Text style={styles.cardMetaDivider}>•</Text>
                    <Text style={styles.cardPolicyTag}>
                      {item.join_policy.replace('_', ' ').toUpperCase()}
                    </Text>
                    {item.country_iso ? (
                      <>
                        <Text style={styles.cardMetaDivider}>•</Text>
                        <Text style={styles.cardTerritoryTag}>{item.country_iso}</Text>
                      </>
                    ) : null}
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.joinBtn, isMember ? styles.joinedBtn : styles.unjoinedBtn]}
                  onPress={() => toggleJoin(item)}
                  activeOpacity={0.82}
                >
                  {isMember ? (
                    <View style={styles.joinedInner}>
                      <Ionicons name="checkmark-circle" size={14} color={TOKENS.teal} />
                      <Text style={styles.joinedBtnText}>Joined</Text>
                    </View>
                  ) : (
                    <Text style={styles.joinBtnText}>Join Hub</Text>
                  )}
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* CREATE HUB MODAL */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Launch a Caribbean Hub</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.modalCloseBtn}
                accessibilityRole="button"
                accessibilityLabel="Close hub creation modal"
              >
                <Ionicons name="close" size={20} color={TOKENS.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Hub Name</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Trinis in London, Soca Producers Guild"
              placeholderTextColor={TOKENS.textDim}
              value={hubName}
              onChangeText={setHubName}
            />

            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.modalInput, styles.modalTextarea]}
              placeholder="What brings your community together?"
              placeholderTextColor={TOKENS.textDim}
              value={hubDesc}
              onChangeText={setHubDesc}
              multiline
            />

            <Text style={styles.inputLabel}>Territory / Regional Focus</Text>
            <View style={styles.countryPicker}>
              {(['JAM', 'TTO', 'HTI', 'DOM', 'BRB', 'BHS', 'GUY'] as const).map((iso) => (
                <TouchableOpacity
                  key={iso}
                  style={[styles.countryBtn, hubCountry === iso && styles.countryBtnActive]}
                  onPress={() => setHubCountry(iso)}
                >
                  <Text style={[styles.countryBtnText, hubCountry === iso && styles.countryBtnTextActive]}>
                    {iso}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Membership Policy</Text>
            <View style={styles.countryPicker}>
              {(['public', 'private', 'invite_only'] as const).map((pol) => (
                <TouchableOpacity
                  key={pol}
                  style={[styles.countryBtn, hubPolicy === pol && styles.countryBtnActive]}
                  onPress={() => setHubPolicy(pol)}
                >
                  <Ionicons
                    name={getHubIconName(pol)}
                    size={13}
                    color={hubPolicy === pol ? TOKENS.teal : TOKENS.textMuted}
                  />
                  <Text style={[styles.countryBtnText, hubPolicy === pol && styles.countryBtnTextActive]}>
                    {pol.replace('_', ' ').toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, creatingHub && { opacity: 0.6 }]}
              disabled={creatingHub}
              onPress={handleCreateHub}
            >
              {creatingHub ? (
                <ActivityIndicator color={TOKENS.actionText} />
              ) : (
                <Text style={styles.submitBtnText}>Create Community Hub</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
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
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 12,
    backgroundColor: TOKENS.surface,
    gap: 12,
  },
  headerTitleBlock: { flex: 1 },
  screenTitle: { color: TOKENS.textPrimary, fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  screenSubtitle: { color: TOKENS.textMuted, fontSize: 12, marginTop: 2 },
  createHubBtn: {
    backgroundColor: TOKENS.teal,
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
  },
  createHubText: { color: TOKENS.actionText, fontSize: 12, fontWeight: '800' },

  tabsBar: {
    flexDirection: 'row',
    paddingHorizontal: 18,
    backgroundColor: TOKENS.surface,
    borderBottomWidth: 1,
    borderBottomColor: TOKENS.border,
    gap: 20,
  },
  tabItem: {
    paddingVertical: 11,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: TOKENS.teal,
  },
  tabText: { color: TOKENS.textMuted, fontSize: 13, fontWeight: '700' },
  tabTextActive: { color: TOKENS.teal, fontWeight: '800' },

  container: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: TOKENS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: TOKENS.border,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  cardIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: TOKENS.tealSoft,
    borderWidth: 1,
    borderColor: TOKENS.borderActive,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: { flex: 1 },
  cardTitle: { color: TOKENS.textPrimary, fontSize: 15, fontWeight: '700' },
  cardDesc: { color: TOKENS.textSecondary, fontSize: 12, lineHeight: 17, marginTop: 3 },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    flexWrap: 'wrap',
    gap: 5,
  },
  cardMeta: { color: TOKENS.teal, fontSize: 11, fontWeight: '700' },
  cardMetaDivider: { color: TOKENS.textDim, fontSize: 11 },
  cardPolicyTag: { color: TOKENS.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 0.4 },
  cardTerritoryTag: { color: TOKENS.action, fontSize: 11, fontWeight: '700' },

  joinBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 },
  unjoinedBtn: { backgroundColor: TOKENS.teal },
  joinedBtn: {
    backgroundColor: TOKENS.raised,
    borderWidth: 1,
    borderColor: TOKENS.borderActive,
  },
  joinedInner: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  joinBtnText: { color: TOKENS.actionText, fontSize: 12, fontWeight: '800' },
  joinedBtnText: { color: TOKENS.teal, fontSize: 12, fontWeight: '700' },

  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 56,
    paddingHorizontal: 24,
  },
  emptyBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: TOKENS.tealSoft,
    borderWidth: 1,
    borderColor: TOKENS.borderActive,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { color: TOKENS.textPrimary, fontSize: 16, fontWeight: '800', marginTop: 14, marginBottom: 6 },
  emptySub: { color: TOKENS.textMuted, fontSize: 13, textAlign: 'center', lineHeight: 19, marginBottom: 20 },
  emptyBtn: {
    backgroundColor: TOKENS.teal,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 999,
  },
  emptyBtnText: { color: TOKENS.actionText, fontSize: 13, fontWeight: '800' },

  modalOverlay: {
    flex: 1,
    backgroundColor: TOKENS.scrim,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: TOKENS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: TOKENS.borderStrong,
    padding: 20,
    paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: { color: TOKENS.textPrimary, fontSize: 18, fontWeight: '800' },
  modalCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: TOKENS.raised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputLabel: { color: TOKENS.textSecondary, fontSize: 12, fontWeight: '700', marginBottom: 6, marginTop: 8 },
  modalInput: {
    backgroundColor: TOKENS.raised,
    borderWidth: 1,
    borderColor: TOKENS.borderStrong,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    color: TOKENS.textPrimary,
    fontSize: 14,
    marginBottom: 8,
  },
  modalTextarea: {
    minHeight: 68,
    textAlignVertical: 'top',
  },
  countryPicker: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 12 },
  countryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: TOKENS.raised,
    borderWidth: 1,
    borderColor: TOKENS.border,
  },
  countryBtnActive: {
    borderColor: TOKENS.borderActive,
    backgroundColor: TOKENS.tealSoft,
  },
  countryBtnText: { color: TOKENS.textMuted, fontSize: 11, fontWeight: '700' },
  countryBtnTextActive: { color: TOKENS.teal, fontWeight: '800' },
  submitBtn: {
    backgroundColor: TOKENS.teal,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  submitBtnText: { color: TOKENS.actionText, fontSize: 14, fontWeight: '800' },
});
