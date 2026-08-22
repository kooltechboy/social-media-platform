import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { TOKENS } from '../theme/tokens';

export function Header({ onWalletPress }: { onWalletPress?: () => void }) {
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>CARIBBEAN ONE</Text>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="SpotPay Wallet Balance $240.50"
        style={styles.walletBadge}
        onPress={onWalletPress}
      >
        <Text style={styles.walletText}>SpotPay $240.50</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: TOKENS.border,
    backgroundColor: TOKENS.surface,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: TOKENS.action,
    letterSpacing: 0.5,
  },
  walletBadge: {
    backgroundColor: '#064E3B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#059669',
  },
  walletText: {
    color: TOKENS.success,
    fontSize: 12,
    fontWeight: '700',
  },
});
