import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import { TOKENS } from '../theme/tokens';

const { width } = Dimensions.get('window');

export function SpotPayScreen() {
  const [balance] = useState('$240.50');
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* Header / Brand */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>SpotPay</Text>
          <View style={styles.aiBadge}>
            <Text style={styles.aiBadgeText}>AI Powered</Text>
          </View>
        </View>

        {/* Primary Wallet Card */}
        <View style={styles.walletCard}>
          <View style={styles.walletHeader}>
            <Text style={styles.walletLabel}>TOTAL BALANCE</Text>
            <Text style={styles.currencyLabel}>USD</Text>
          </View>
          <Text style={styles.walletBalance}>{balance}</Text>
          <Text style={styles.walletStatus}>✓ FDIC Insured • Bank-Partnered Ledger</Text>

          <View style={styles.walletActions}>
            <TouchableOpacity style={styles.walletBtnPrimary} activeOpacity={0.8}>
              <Text style={styles.walletBtnPrimaryText}>Send Money</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.walletBtnSecondary} activeOpacity={0.8}>
              <Text style={styles.walletBtnSecondaryText}>Add Funds</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Linked Methods */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Payment Methods</Text>
            <TouchableOpacity><Text style={styles.linkText}>Edit</Text></TouchableOpacity>
          </View>
          
          <View style={styles.methodCard}>
            <View style={styles.methodIconContainer}>
              <Text style={styles.methodIcon}>🏦</Text>
            </View>
            <View style={styles.methodInfo}>
              <Text style={styles.methodTitle}>SpotPay Wallet</Text>
              <Text style={styles.methodSubtitle}>Primary Account</Text>
            </View>
            <Text style={styles.verifiedBadge}>Default</Text>
          </View>

          <View style={[styles.methodCard, { marginTop: 10 }]}>
            <View style={styles.methodIconContainer}>
              <Text style={styles.methodIcon}>💳</Text>
            </View>
            <View style={styles.methodInfo}>
              <Text style={styles.methodTitle}>PayPal Account</Text>
              <Text style={styles.methodSubtitle}>daniel.w@example.com</Text>
            </View>
            <Text style={[styles.verifiedBadge, { color: TOKENS.textMuted }]}>Backup</Text>
          </View>
        </View>

        {/* Transaction History */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity><Text style={styles.linkText}>See All</Text></TouchableOpacity>
          </View>
          
          <View style={styles.txContainer}>
            {[
              { title: 'Creator Tip: Reggae Hub', date: 'Today, 2:15 PM', amount: '-$5.00', type: 'debit' },
              { title: 'Marketplace: Rum Cake Box', date: 'Yesterday', amount: '-$24.00', type: 'debit' },
              { title: 'Creator Subscription Earning', date: 'Aug 18', amount: '+$49.90', type: 'credit' },
            ].map((tx, idx) => (
              <View key={idx} style={[styles.txRow, idx === 2 && { borderBottomWidth: 0 }]}>
                <View style={styles.txLeft}>
                  <View style={[styles.txIcon, tx.type === 'credit' ? styles.txIconCredit : styles.txIconDebit]}>
                    <Text style={styles.txIconText}>{tx.type === 'credit' ? '↓' : '↑'}</Text>
                  </View>
                  <View>
                    <Text style={styles.txTitle}>{tx.title}</Text>
                    <Text style={styles.txDate}>{tx.date}</Text>
                  </View>
                </View>
                <Text style={[styles.txAmount, { color: tx.type === 'credit' ? TOKENS.success : TOKENS.textPrimary }]}>
                  {tx.amount}
                </Text>
              </View>
            ))}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: TOKENS.canvas },
  container: { padding: 20, paddingBottom: 40 },
  
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, marginTop: 10 },
  headerTitle: { color: TOKENS.textPrimary, fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  aiBadge: { backgroundColor: TOKENS.action + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: TOKENS.action + '40' },
  aiBadgeText: { color: TOKENS.action, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },

  walletCard: {
    backgroundColor: TOKENS.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: TOKENS.action + '50',
    padding: 24,
    marginBottom: 32,
    shadowColor: TOKENS.action,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  walletHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  walletLabel: { color: TOKENS.textMuted, fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  currencyLabel: { color: TOKENS.action, fontSize: 11, fontWeight: '800' },
  walletBalance: { color: '#FFFFFF', fontSize: 44, fontWeight: '900', letterSpacing: -1.5 },
  walletStatus: { color: TOKENS.success, fontSize: 12, fontWeight: '600', marginTop: 12, marginBottom: 24 },
  
  walletActions: { flexDirection: 'row', gap: 12 },
  walletBtnPrimary: {
    flex: 1,
    backgroundColor: TOKENS.action,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: TOKENS.action,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  walletBtnPrimaryText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
  walletBtnSecondary: {
    flex: 1,
    backgroundColor: TOKENS.raised,
    borderWidth: 1,
    borderColor: TOKENS.border,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  walletBtnSecondaryText: { color: TOKENS.textPrimary, fontWeight: '800', fontSize: 14 },

  section: { marginBottom: 32 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { color: TOKENS.textPrimary, fontSize: 16, fontWeight: '800' },
  linkText: { color: TOKENS.action, fontSize: 13, fontWeight: '700' },

  methodCard: {
    backgroundColor: TOKENS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: TOKENS.border,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  methodIconContainer: { width: 40, height: 40, borderRadius: 10, backgroundColor: TOKENS.raised, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  methodIcon: { fontSize: 20 },
  methodInfo: { flex: 1 },
  methodTitle: { color: TOKENS.textPrimary, fontSize: 15, fontWeight: '700', marginBottom: 2 },
  methodSubtitle: { color: TOKENS.textMuted, fontSize: 12, fontWeight: '500' },
  verifiedBadge: { color: TOKENS.success, fontSize: 12, fontWeight: '800' },

  txContainer: { backgroundColor: TOKENS.surface, borderRadius: 16, borderWidth: 1, borderColor: TOKENS.border, paddingHorizontal: 16 },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: TOKENS.border,
  },
  txLeft: { flexDirection: 'row', alignItems: 'center' },
  txIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  txIconCredit: { backgroundColor: TOKENS.success + '20' },
  txIconDebit: { backgroundColor: TOKENS.raised },
  txIconText: { fontSize: 14, fontWeight: '900', color: TOKENS.textPrimary },
  txTitle: { color: TOKENS.textPrimary, fontSize: 14, fontWeight: '700', marginBottom: 2 },
  txDate: { color: TOKENS.textMuted, fontSize: 12 },
  txAmount: { fontSize: 15, fontWeight: '800' },
});
