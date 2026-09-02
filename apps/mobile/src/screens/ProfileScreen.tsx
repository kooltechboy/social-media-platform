import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { TOKENS } from '../theme/tokens';
import { supabase } from '../lib/supabase';

interface ProfileScreenProps {
  onLogout: () => void;
}

export function ProfileScreen({ onLogout }: ProfileScreenProps) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [updating, setUpdating] = useState(false);

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

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (data && !error) {
        setProfile(data);
        setDisplayName(data.display_name || '');
        setBio(data.bio || '');
        setCountry(data.country || 'Jamaica');
        setCity(data.city || '');
      }
    } catch (err) {
      console.warn('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserProfile();
  }, []);

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
      }
    } catch (err) {
      console.warn('Error updating profile:', err);
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
          <Text style={styles.loadingText}>Loading Profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Cover Banner */}
        <View style={styles.banner}>
          <View style={styles.bannerGradient} />
        </View>

        {/* Profile Card Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(profile?.display_name || profile?.username || 'TK').slice(0, 2).toUpperCase()}
            </Text>
          </View>

          <View style={styles.nameRow}>
            <Text style={styles.displayName}>{profile?.display_name || 'Caribbean Member'}</Text>
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
            <Text style={styles.locationText}>
              📍 {[profile?.city, profile?.country].filter(Boolean).join(', ') || 'Caribbean'}
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
        </View>

        {/* Edit Form Modal/Drawer in-place */}
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

            <Text style={styles.label}>Country Selector (Never default locked)</Text>
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

            <Text style={styles.label}>City / District</Text>
            <TextInput
              style={styles.input}
              value={city}
              onChangeText={setCity}
              placeholder="e.g. Kingston, Port of Spain, Bridgetown"
              placeholderTextColor={TOKENS.textMuted}
            />

            <TouchableOpacity
              style={[styles.saveButton, updating && { opacity: 0.6 }]}
              onPress={handleSaveProfile}
              disabled={updating}
            >
              {updating ? (
                <ActivityIndicator color="#090D1A" />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Ecosystem Badges & Stats */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>1</Text>
            <Text style={styles.statLabel}>Post</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
        </View>

        {/* Island Vibes Info */}
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>🌴 TUKUBI Island Vibes</Text>
          <Text style={styles.infoText}>
            Your digital identity is protected by end-to-end cryptographic row-level security and privacy controls.
          </Text>
        </View>
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
    marginBottom: 20,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
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
  locationRow: { marginTop: 10 },
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
  saveButtonText: { color: '#090D1A', fontSize: 14, fontWeight: '900' },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: TOKENS.surface,
    marginHorizontal: 20,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: TOKENS.border,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statItem: { alignItems: 'center' },
  statNumber: { color: TOKENS.textPrimary, fontSize: 18, fontWeight: '900' },
  statLabel: { color: TOKENS.textMuted, fontSize: 11, fontWeight: '600', marginTop: 2 },
  statDivider: { width: 1, height: 28, backgroundColor: TOKENS.border },
  infoBox: {
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 18,
    backgroundColor: TOKENS.action + '10',
    borderColor: TOKENS.action + '30',
    borderWidth: 1,
  },
  infoTitle: { color: TOKENS.action, fontSize: 12, fontWeight: '800', marginBottom: 4 },
  infoText: { color: TOKENS.textMuted, fontSize: 11, lineHeight: 16, fontWeight: '500' },
});
