import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Ionicons as ExpoIonicons } from '@expo/vector-icons';
import { TOKENS } from '../theme/tokens';

const Ionicons = ExpoIonicons as unknown as React.ComponentType<{
  name: keyof typeof ExpoIonicons.glyphMap;
  size?: number;
  color?: string;
}>;

export type MobileTab = 'home' | 'shorts' | 'explore' | 'communities' | 'messages' | 'payments';

interface BottomNavProps {
  currentTab: MobileTab;
  onSelectTab: (tab: MobileTab) => void;
  onCreatePress?: () => void;
}

export function BottomNav({ currentTab, onSelectTab, onCreatePress }: BottomNavProps) {
  const tabs: Array<{
    key: MobileTab;
    label: string;
    icon: keyof typeof ExpoIonicons.glyphMap;
    activeIcon: keyof typeof ExpoIonicons.glyphMap;
  }> = [
    { key: 'home', label: 'Home', icon: 'home-outline', activeIcon: 'home' },
    { key: 'shorts', label: 'Shorts', icon: 'film-outline', activeIcon: 'film' },
    { key: 'explore', label: 'Explore', icon: 'compass-outline', activeIcon: 'compass' },
    { key: 'communities', label: 'Hubs', icon: 'people-outline', activeIcon: 'people' },
    { key: 'messages', label: 'Chat', icon: 'chatbubble-ellipses-outline', activeIcon: 'chatbubble-ellipses' },
    { key: 'payments', label: 'Wallet', icon: 'wallet-outline', activeIcon: 'wallet' },
  ];

  return (
    <View style={styles.bottomNav} accessibilityRole="tablist">
      {tabs.slice(0, 3).map((tab) => {
        const active = currentTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={tab.label}
            style={styles.navTab}
            onPress={() => onSelectTab(tab.key)}
            activeOpacity={0.75}
          >
            <Ionicons
              name={active ? tab.activeIcon : tab.icon}
              size={20}
              color={active ? TOKENS.teal : TOKENS.textMuted}
            />
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
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={22} color={TOKENS.actionText} />
      </TouchableOpacity>

      {tabs.slice(3, 5).map((tab) => {
        const active = currentTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={tab.label}
            style={styles.navTab}
            onPress={() => onSelectTab(tab.key)}
            activeOpacity={0.75}
          >
            <Ionicons
              name={active ? tab.activeIcon : tab.icon}
              size={20}
              color={active ? TOKENS.teal : TOKENS.textMuted}
            />
            <Text style={active ? styles.navTabActiveText : styles.navTabText}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    height: 64,
    backgroundColor: TOKENS.canvas,
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
    paddingVertical: 6,
    paddingHorizontal: 8,
    minWidth: 48,
    minHeight: 48,
    gap: 3,
  },
  navTabText: {
    color: TOKENS.textMuted,
    fontSize: 10.5,
    fontWeight: '500',
  },
  navTabActiveText: {
    color: TOKENS.teal,
    fontSize: 10.5,
    fontWeight: '700',
  },
  createButton: {
    width: 44,
    height: 34,
    borderRadius: 12,
    backgroundColor: TOKENS.teal,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: TOKENS.teal,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
});
