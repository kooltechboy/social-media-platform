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

export function CommunitiesScreen({ navigation }: any) {
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
      const slug = hubName
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
        // Automatically add creator as member
        await supabase.from('community_members').insert({
          community_id: data.id,
          profile_id: userId,
          membership_status: 'active',
        });

        Alert.alert('Hub Created', `"${hubName}" has been successfully launched!`);
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
        <ActivityIndicator size="large" color={TOKENS.action} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.screenTitle}>🌴 Caribbean Hubs</Text>
          <Text style={styles.screenSubtitle}>Island circles, diaspora meetups & cultural guilds</Text>
        </View>
        <TouchableOpacity style={styles.createHubBtn} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={16} color="#FFF" style={{ marginRight: 4 }} />
          <Text style={styles.createHubText}>New Hub</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsBar}>
        <TouchableOpacity
          style={[styles.tabChip, filterTab === 'all' && styles.tabChipActive]}
          onPress={() => setFilterTab('all')}
        >
          <Text style={[styles.tabText, filterTab === 'all' && styles.tabTextActive]}>
            All Hubs ({communities.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabChip, filterTab === 'my' && styles.tabChipActive]}
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={TOKENS.action} />}
      >
        {displayedCommunities.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={54} color={TOKENS.textMuted} />
            <Text style={styles.emptyTitle}>
              {filterTab === 'my' ? "You Haven't Joined Any Hubs" : 'No Hubs Available Yet'}
            </Text>
            <Text style={styles.emptySub}>
              {filterTab === 'my'
                ? 'Explore all Caribbean hubs to connect with your island culture and diaspora circles.'
                : 'Be the first to launch a community hub for your island, diaspora city, or art movement!'}
            </Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => setModalVisible(true)}>
              <Text style={styles.emptyBtnText}>+ Launch First Hub</Text>
            </TouchableOpacity>
          </View>
        ) : (
          displayedCommunities.map((item) => {
            const isMember = joinedIds.has(item.id);
            return (
              <View key={item.id} style={styles.card}>
                <View style={styles.cardIconContainer}>
                  <Text style={styles.cardIcon}>🌴</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  {item.description ? (
                    <Text style={styles.cardDesc} numberOfLines={2}>
                      {item.description}
                    </Text>
                  ) : null}
                  <Text style={styles.cardMeta}>
                    {item.member_count} {item.member_count === 1 ? 'member' : 'members'} • {item.join_policy.toUpperCase()}
                    {item.country_iso ? ` • ${item.country_iso}` : ''}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.joinBtn, isMember ? styles.joinedBtn : styles.unjoinedBtn]}
                  onPress={() => toggleJoin(item)}
                >
                  <Text style={isMember ? styles.joinedBtnText : styles.joinBtnText}>
                    {isMember ? 'Joined ✓' : 'Join Hub'}
                  </Text>
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
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={TOKENS.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Hub Name</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Trinis in London, Soca Producers Guild"
              placeholderTextColor={TOKENS.textMuted}
              value={hubName}
              onChangeText={setHubName}
            />

            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.modalInput, { minHeight: 60, textAlignVertical: 'top' }]}
              placeholder="What brings your Caribbean community together?"
              placeholderTextColor={TOKENS.textMuted}
              value={hubDesc}
              onChangeText={setHubDesc}
              multiline
            />

            <Text style={styles.inputLabel}>Territory / Island Association</Text>
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
                <ActivityIndicator color="#FFF" />
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
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  screenTitle: { color: TOKENS.textPrimary, fontSize: 18, fontWeight: '900' },
  screenSubtitle: { color: TOKENS.textMuted, fontSize: 12, marginTop: 2 },
  createHubBtn: {
    backgroundColor: TOKENS.action,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  createHubText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },

  tabsBar: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: TOKENS.border,
  },
  tabChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: TOKENS.surface,
    borderWidth: 1,
    borderColor: TOKENS.border,
  },
  tabChipActive: {
    backgroundColor: TOKENS.action,
    borderColor: TOKENS.action,
  },
  tabText: { color: TOKENS.textMuted, fontSize: 12, fontWeight: '700' },
  tabTextActive: { color: '#FFF' },

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
    gap: 12,
  },
  cardIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 87, 34, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIcon: { fontSize: 20 },
  cardTitle: { color: TOKENS.textPrimary, fontSize: 15, fontWeight: '800' },
  cardDesc: { color: TOKENS.textMuted, fontSize: 12, lineHeight: 16, marginTop: 2 },
  cardMeta: { color: TOKENS.action, fontSize: 11, fontWeight: '700', marginTop: 4 },
  joinBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 },
  unjoinedBtn: { backgroundColor: TOKENS.action },
  joinedBtn: { backgroundColor: TOKENS.raised, borderWidth: 1, borderColor: TOKENS.border },
  joinBtnText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  joinedBtnText: { color: TOKENS.textMuted, fontSize: 11, fontWeight: '700' },

  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyTitle: { color: TOKENS.textPrimary, fontSize: 16, fontWeight: '800', marginTop: 12, marginBottom: 4 },
  emptySub: { color: TOKENS.textMuted, fontSize: 13, textAlign: 'center', lineHeight: 18, marginBottom: 18 },
  emptyBtn: {
    backgroundColor: TOKENS.action,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 16,
  },
  emptyBtnText: { color: '#FFF', fontSize: 13, fontWeight: '800' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: TOKENS.canvas,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { color: TOKENS.textPrimary, fontSize: 18, fontWeight: '800' },
  inputLabel: { color: TOKENS.textMuted, fontSize: 12, fontWeight: '700', marginBottom: 6, marginTop: 8 },
  modalInput: {
    backgroundColor: TOKENS.surface,
    borderWidth: 1,
    borderColor: TOKENS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: TOKENS.textPrimary,
    fontSize: 14,
    marginBottom: 10,
  },
  countryPicker: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 12 },
  countryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: TOKENS.surface,
    borderWidth: 1,
    borderColor: TOKENS.border,
  },
  countryBtnActive: {
    borderColor: TOKENS.action,
    backgroundColor: 'rgba(255, 87, 34, 0.15)',
  },
  countryBtnText: { color: TOKENS.textMuted, fontSize: 11, fontWeight: '700' },
  countryBtnTextActive: { color: TOKENS.action, fontWeight: '800' },
  submitBtn: {
    backgroundColor: TOKENS.action,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  submitBtnText: { color: '#FFF', fontSize: 14, fontWeight: '800' },
});
