import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native';
import { Ionicons as ExpoIonicons } from '@expo/vector-icons';
import { TOKENS } from '../theme/tokens';

const Ionicons = ExpoIonicons as unknown as React.ComponentType<{
  name: keyof typeof ExpoIonicons.glyphMap;
  size?: number;
  color?: string;
}>;
import { supabase } from '../lib/supabase';

export interface HeaderProps {
  onWalletPress?: () => void;
  onNotificationsPress?: () => void;
  onMessagesPress?: () => void;
  onMarketplacePress?: () => void;
  onSearchPress?: () => void;
}

export function Header({
  onWalletPress,
  onNotificationsPress,
  onMessagesPress,
  onMarketplacePress,
  onSearchPress,
}: HeaderProps) {
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    async function loadUnreadCount() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { count, error } = await supabase
            .from('notifications')
            .select('id', { count: 'exact', head: true })
            .eq('recipient_id', user.id)
            .eq('is_read', false);

          if (!error && typeof count === 'number') {
            setUnreadCount(count);
          }
        }
      } catch {
        // Non-blocking
      }
    }

    loadUnreadCount();
  }, []);

  return (
    <View style={styles.header}>
      {/* Official Brand Lockup */}
      <View style={styles.brandContainer}>
        <Image
          source={require('../../assets/tukubi-emblem.png')}
          style={styles.logoEmblem}
          resizeMode="contain"
        />
        <View>
          <Text style={styles.headerTitle}>TUKUBI</Text>
          <Text style={styles.headerTagline}>The Caribbean Connected.</Text>
        </View>
      </View>

      {/* Clean Midnight Reef Quick Actions (Search · Market · Messages · Notifications 🔔 · Financial Center) */}
      <View style={styles.rightActions}>
        {onSearchPress && (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Search TUKUBI"
            style={styles.iconButton}
            onPress={onSearchPress}
            activeOpacity={0.75}
          >
            <Ionicons name="search-outline" size={20} color={TOKENS.textSecondary} />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Caribbean Marketplace"
          style={styles.iconButton}
          onPress={onMarketplacePress}
          activeOpacity={0.75}
        >
          <Ionicons name="bag-handle-outline" size={20} color={TOKENS.textSecondary} />
        </TouchableOpacity>

        {onMessagesPress && (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Messages"
            style={styles.notifBadge}
            onPress={onMessagesPress}
            activeOpacity={0.75}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={20} color={TOKENS.textSecondary} />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Notifications"
          style={styles.notifBadge}
          onPress={onNotificationsPress}
          activeOpacity={0.75}
        >
          <Ionicons name="notifications-outline" size={20} color={TOKENS.textSecondary} />
          {unreadCount > 0 && (
            <View style={styles.unreadPill}>
              <Text style={styles.unreadPillText}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Financial Center"
          style={styles.walletBadge}
          onPress={onWalletPress}
          activeOpacity={0.75}
        >
          <Ionicons name="wallet-outline" size={18} color={TOKENS.teal} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: TOKENS.border,
    backgroundColor: TOKENS.canvas,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  logoEmblem: {
    width: 30,
    height: 30,
  },
  headerTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: 0.4,
    lineHeight: 19,
  },
  headerTagline: {
    fontSize: 9.5,
    fontWeight: '600',
    color: TOKENS.textMuted,
    letterSpacing: 0.15,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  iconButton: {
    minWidth: 40,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifBadge: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  unreadPill: {
    position: 'absolute',
    top: 7,
    right: 6,
    backgroundColor: TOKENS.teal,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: TOKENS.canvas,
  },
  unreadPillText: {
    color: TOKENS.actionText,
    fontSize: 9,
    fontWeight: '800',
  },
  walletBadge: {
    backgroundColor: TOKENS.tealSoft,
    width: 36,
    height: 36,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: TOKENS.borderActive,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
});
