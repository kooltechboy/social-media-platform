import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native';
import { TOKENS } from '../theme/tokens';

export function Header({ onWalletPress }: { onWalletPress?: () => void }) {
  return (
    <View style={styles.header}>
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
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Financial Center"
        style={styles.walletBadge}
        onPress={onWalletPress}
      >
        <Text style={styles.walletText}>Financial Center</Text>
      </TouchableOpacity>
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
  walletBadge: {
    backgroundColor: 'rgba(255, 122, 89, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 122, 89, 0.40)',
  },
  walletText: {
    color: TOKENS.action,
    fontSize: 12,
    fontWeight: '800',
  },
});
