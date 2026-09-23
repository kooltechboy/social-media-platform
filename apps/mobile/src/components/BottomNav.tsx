import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { TOKENS } from '../theme/tokens';

export type MobileTab = 'home' | 'explore' | 'communities' | 'messages' | 'payments';

interface BottomNavProps {
  currentTab: MobileTab;
  onSelectTab: (tab: MobileTab) => void;
  onCreatePress?: () => void;
}

export function BottomNav({ currentTab, onSelectTab, onCreatePress }: BottomNavProps) {
  const tabs: Array<{ key: MobileTab; label: string; icon: string }> = [
    { key: 'home', label: 'Home', icon: '🏠' },
    { key: 'explore', label: 'Explore', icon: '🔍' },
    { key: 'communities', label: 'Hubs', icon: '🌴' },
    { key: 'messages', label: 'Chat', icon: '💬' },
    { key: 'payments', label: 'Payments', icon: '💳' },
  ];

  return (
    <View style={styles.bottomNav} accessibilityRole="tablist">
      {tabs.map((tab) => {
        const active = currentTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={tab.label}
            style={styles.navTab}
            onPress={() => onSelectTab(tab.key)}
          >
            <Text style={styles.navIcon}>{tab.icon}</Text>
            <Text style={active ? styles.navTabActiveText : styles.navTabText}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Create post"
        style={styles.createButton}
        onPress={onCreatePress}
      >
        <Text style={styles.createButtonText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    height: 68,
    backgroundColor: TOKENS.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: TOKENS.border,
    paddingBottom: 6,
  },
  navTab: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    minWidth: 52,
  },
  navIcon: {
    fontSize: 16,
    marginBottom: 2,
  },
  navTabText: {
    color: TOKENS.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  navTabActiveText: {
    color: TOKENS.action,
    fontSize: 11,
    fontWeight: '800',
  },
  createButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: TOKENS.action,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: TOKENS.action,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
});
