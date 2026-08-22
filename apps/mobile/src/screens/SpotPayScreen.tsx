import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { TOKENS } from '../theme/tokens';

export function SpotPayScreen() {
  const [balance] = useState('$240.50 USD');

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Wallet Card */}
      <View style={styles.walletCard}>
        <Text style={styles.walletLabel}>SPOTPAY LEDGER WALLET</Text>
        <Text style={styles.walletBalance}>{balance}</Text>
        <Text style={styles.walletStatus}>✓ FDIC / Bank-partnered double-entry ledger</Text>

        <View style={styles.walletActions}>
          <TouchableOpacity style={styles.walletBtnPrimary}>
            <Text style={styles.walletBtnPrimaryText}>⚡ Send P2P</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.walletBtnSecondary}>
            <Text style={styles.walletBtnSecondaryText}>+ Add Funds</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Linked Methods */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Methods</Text>
        <View style={styles.methodCard}>
          <Text style={styles.methodIcon}>💳</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.methodTitle}>Visa ending in 4242</Text>
            <Text style={styles.methodSubtitle}>Expires 08/29 · Default</Text>
          </View>
          <Text style={styles.verifiedBadge}>Verified</Text>
        </View>
      </View>

      {/* Transaction History */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        {[
          { title: 'Creator Tip: Reggae Hub', date: 'Today, 2:15 PM', amount: '-$5.00', color: TOKENS.danger },
          { title: 'Marketplace: Rum Cake Box', date: 'Yesterday', amount: '-$24.00', color: TOKENS.danger },
          { title: 'Creator Subscription Earning', date: 'Aug 18', amount: '+$49.90', color: TOKENS.success },
        ].map((tx, idx) => (
          <View key={idx} style={styles.txRow}>
            <View>
              <Text style={styles.txTitle}>{tx.title}</Text>
              <Text style={styles.txDate}>{tx.date}</Text>
            </View>
            <Text style={[styles.txAmount, { color: tx.color }]}>{tx.amount}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: TOKENS.canvas },
  walletCard: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#0284C7',
    padding: 20,
    marginBottom: 20,
  },
  walletLabel: { color: TOKENS.action, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  walletBalance: { color: '#FFFFFF', fontSize: 32, fontWeight: '900', marginVertical: 8 },
  walletStatus: { color: TOKENS.success, fontSize: 11, fontWeight: '600', marginBottom: 16 },
  walletActions: { flexDirection: 'row', gap: 10 },
  walletBtnPrimary: {
    flex: 1,
    backgroundColor: TOKENS.action,
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: 'center',
  },
  walletBtnPrimaryText: { color: '#FFFFFF', fontWeight: '800', fontSize: 12 },
  walletBtnSecondary: {
    flex: 1,
    backgroundColor: TOKENS.raised,
    borderWidth: 1,
    borderColor: TOKENS.border,
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: 'center',
  },
  walletBtnSecondaryText: { color: TOKENS.textPrimary, fontWeight: '800', fontSize: 12 },
  section: { marginBottom: 20 },
  sectionTitle: { color: TOKENS.textPrimary, fontSize: 14, fontWeight: '800', marginBottom: 10 },
  methodCard: {
    backgroundColor: TOKENS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: TOKENS.border,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  methodIcon: { fontSize: 20 },
  methodTitle: { color: TOKENS.textPrimary, fontSize: 13, fontWeight: '700' },
  methodSubtitle: { color: TOKENS.textMuted, fontSize: 11, marginTop: 2 },
  verifiedBadge: { color: TOKENS.success, fontSize: 11, fontWeight: '700' },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: TOKENS.border,
  },
  txTitle: { color: TOKENS.textPrimary, fontSize: 13, fontWeight: '700' },
  txDate: { color: TOKENS.textMuted, fontSize: 11, marginTop: 2 },
  txAmount: { fontSize: 13, fontWeight: '800' },
});
