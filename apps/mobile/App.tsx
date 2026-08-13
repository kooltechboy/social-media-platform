import React from 'react';
import { StyleSheet, Text, View, SafeAreaView, ScrollView, TouchableOpacity, StatusBar } from 'react-native';

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#090D16" />
      
      {/* Mobile Top App Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>CARIBBEAN ONE</Text>
        <TouchableOpacity style={styles.walletBadge}>
          <Text style={styles.walletText}>SpotPay: $240 text</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Geographic Diaspora Header Card */}
        <View style={styles.heroCard}>
          <Text style={styles.heroFlag}>🇯🇲 🇩🇴 🇹🇹 🇭🇹 🇧🇸 🇧🇧 🇵🇷</Text>
          <Text style={styles.heroTitle}>Caribbean Digital Ecosystem</Text>
          <Text style={styles.heroSubtitle}>
            Universal iOS & Android App for the Caribbean & Diaspora Worldwide.
          </Text>
        </View>

        {/* Action Grid */}
        <View style={styles.actionGrid}>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionIcon}>🔥</Text>
            <Text style={styles.actionText}>For You Feed</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionIcon}>🎙️</Text>
            <Text style={styles.actionText}>Podcasts</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionIcon}>🔴</Text>
            <Text style={styles.actionText}>Live Streams</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionIcon}>💳</Text>
            <Text style={styles.actionText}>SpotPay Wallet</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navTab}>
          <Text style={styles.navTabActiveText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navTab}>
          <Text style={styles.navTabText}>Explore</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.createButton}>
          <Text style={styles.createButtonText}>+</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navTab}>
          <Text style={styles.navTabText}>SpotPay</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navTab}>
          <Text style={styles.navTabText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090D16',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0284C7',
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
    color: '#34D399',
    fontSize: 12,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
  },
  heroCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  heroFlag: {
    fontSize: 24,
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    width: '48%',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  actionText: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
  },
  bottomNav: {
    height: 64,
    backgroundColor: '#0F172A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  navTab: {
    alignItems: 'center',
  },
  navTabText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },
  navTabActiveText: {
    color: '#0284C7',
    fontSize: 12,
    fontWeight: '800',
  },
  createButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
});
