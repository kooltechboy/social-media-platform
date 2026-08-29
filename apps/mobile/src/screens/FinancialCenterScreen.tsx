import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { TOKENS } from '../theme/tokens';

export function FinancialCenterScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header / Brand */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Financial Center</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Provider-Neutral</Text>
          </View>
        </View>

        {/* Security & Overview Card */}
        <View style={styles.overviewCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardLabel}>TUKUBI FINANCIAL LAYER</Text>
            <Text style={styles.statusLabel}>SECURED</Text>
          </View>
          <Text style={styles.cardTitle}>Payment &amp; Commerce Controls</Text>
          <Text style={styles.cardSubtitle}>
            Transactions, tokenized payment methods, and creator payouts are processed through authorized payment institutions.
          </Text>

          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.btnPrimary} activeOpacity={0.8}>
              <Text style={styles.btnPrimaryText}>Manage Methods</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnSecondary} activeOpacity={0.8}>
              <Text style={styles.btnSecondaryText}>Connected Accounts</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Supported Caribbean & International Rails */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Supported Payment Rails</Text>
          </View>

          <View style={styles.methodCard}>
            <View style={styles.methodIconContainer}>
              <Text style={styles.methodIcon}>💳</Text>
            </View>
            <View style={styles.methodInfo}>
              <Text style={styles.methodTitle}>Credit &amp; Debit Cards</Text>
              <Text style={styles.methodSubtitle}>Visa, Mastercard, Amex</Text>
            </View>
            <Text style={styles.activeBadge}>Active</Text>
          </View>

          <View style={[styles.methodCard, { marginTop: 10 }]}>
            <View style={styles.methodIconContainer}>
              <Text style={styles.methodIcon}>🌐</Text>
            </View>
            <View style={styles.methodInfo}>
              <Text style={styles.methodTitle}>PayPal</Text>
              <Text style={styles.methodSubtitle}>International diaspora checkout</Text>
            </View>
            <Text style={styles.activeBadge}>Active</Text>
          </View>

          <View style={[styles.methodCard, { marginTop: 10 }]}>
            <View style={styles.methodIconContainer}>
              <Text style={styles.methodIcon}>🏝️</Text>
            </View>
            <View style={styles.methodInfo}>
              <Text style={styles.methodTitle}>Caribbean Gateways (CX Pay / WiPay)</Text>
              <Text style={styles.methodSubtitle}>Localized regional rails</Text>
            </View>
            <Text style={[styles.activeBadge, { color: TOKENS.action }]}>Integrated</Text>
          </View>
        </View>

        {/* Financial Protection Notice */}
        <View style={styles.protectionCard}>
          <Text style={styles.protectionTitle}>🔒 Buyer &amp; Seller Protection</Text>
          <Text style={styles.protectionText}>
            Every marketplace order and event ticket is covered by our 30-day fulfillment guarantee and double-entry cryptographic ledger.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: TOKENS.canvas },
  container: { padding: 20, paddingBottom: 40 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, marginTop: 10 },
  headerTitle: { color: TOKENS.textPrimary, fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  badge: { backgroundColor: TOKENS.action + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: TOKENS.action + '40' },
  badgeText: { color: TOKENS.action, fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },

  overviewCard: {
    backgroundColor: TOKENS.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: TOKENS.action + '50',
    padding: 20,
    marginBottom: 28,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardLabel: { color: TOKENS.textMuted, fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  statusLabel: { color: TOKENS.success, fontSize: 11, fontWeight: '800' },
  cardTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '900', marginBottom: 6 },
  cardSubtitle: { color: TOKENS.textMuted, fontSize: 12, lineHeight: 18, marginBottom: 20 },

  actionButtons: { flexDirection: 'row', gap: 10 },
  btnPrimary: {
    flex: 1,
    backgroundColor: TOKENS.action,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnPrimaryText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
  btnSecondary: {
    flex: 1,
    backgroundColor: TOKENS.raised,
    borderWidth: 1,
    borderColor: TOKENS.border,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnSecondaryText: { color: TOKENS.textPrimary, fontWeight: '800', fontSize: 13 },

  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { color: TOKENS.textPrimary, fontSize: 15, fontWeight: '800' },

  methodCard: {
    backgroundColor: TOKENS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: TOKENS.border,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  methodIconContainer: { width: 38, height: 38, borderRadius: 10, backgroundColor: TOKENS.raised, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  methodIcon: { fontSize: 18 },
  methodInfo: { flex: 1 },
  methodTitle: { color: TOKENS.textPrimary, fontSize: 14, fontWeight: '700', marginBottom: 2 },
  methodSubtitle: { color: TOKENS.textMuted, fontSize: 11 },
  activeBadge: { color: TOKENS.success, fontSize: 11, fontWeight: '800' },

  protectionCard: {
    backgroundColor: TOKENS.raised,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: TOKENS.border,
  },
  protectionTitle: { color: TOKENS.textPrimary, fontSize: 13, fontWeight: '800', marginBottom: 4 },
  protectionText: { color: TOKENS.textMuted, fontSize: 11, lineHeight: 16 },
});
