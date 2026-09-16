import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native';
import { TOKENS } from '../theme/tokens';
import { supabase } from '../lib/supabase';

export interface HeaderProps {
  onWalletPress?: () => void;
  onNotificationsPress?: () => void;
  onMarketplacePress?: () => void;
  onSearchPress?: () => void;
}

export function Header({
  onWalletPress,
  onNotificationsPress,
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
      } catch (err) {
        // Non-blocking
      }
    }

    loadUnreadCount();
  }, []);

  return (
    <View style={styles.header}>
      {/* Brand & Tagline */}
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

      {/* Right Quick Actions */}
      <View style={styles.rightActions}>
        {/* Marketplace Shortcut */}
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Caribbean Marketplace"
          style={styles.marketBadge}
          onPress={onMarketplacePress}
          activeOpacity={0.8}
        >
          <Text style={styles.marketText}>🛍️ Market</Text>
        </TouchableOpacity>

        {/* Notifications Icon with Badge */}
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Notifications"
          style={styles.notifBadge}
          onPress={onNotificationsPress}
          activeOpacity={0.8}
        >
          <Text style={styles.notifText}>🔔</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadPill}>
              <Text style={styles.unreadPillText}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Financial Center Badge */}
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Financial Center"
          style={styles.walletBadge}
          onPress={onWalletPress}
          activeOpacity={0.8}
        >
          <Text style={styles.walletText}>💰</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: TOKENS.border,
    backgroundColor: TOKENS.surface,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoEmblem: {
    width: 32,
    height: 32,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: TOKENS.action,
    letterSpacing: 0.5,
    lineHeight: 18,
  },
  headerTagline: {
    fontSize: 9,
    fontWeight: '700',
    color: TOKENS.textMuted,
    letterSpacing: 0.2,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  marketBadge: {
    backgroundColor: 'rgba(0, 180, 216, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 180, 216, 0.35)',
    minHeight: 36,
    justifyContent: 'center',
  },
  marketText: {
    color: TOKENS.sea,
    fontSize: 11,
    fontWeight: '800',
  },
  notifBadge: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notifText: {
    fontSize: 18,
  },
  unreadPill: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: TOKENS.action,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  unreadPillText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '900',
  },
  walletBadge: {
    backgroundColor: 'rgba(255, 122, 89, 0.15)',
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 122, 89, 0.40)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletText: {
    fontSize: 15,
  },
});
