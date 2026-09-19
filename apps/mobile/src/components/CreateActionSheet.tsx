import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import { TOKENS } from '../theme/tokens';

export interface CreateOption {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  badge?: string;
  onPress: () => void;
}

interface CreateActionSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelectOption: (route: string) => void;
}

export function CreateActionSheet({ visible, onClose, onSelectOption }: CreateActionSheetProps) {
  const options: CreateOption[] = [
    {
      id: 'post',
      title: 'Share Post or Moments',
      subtitle: 'Stories, cultural conversations, photos & diaspora updates',
      icon: '✍️',
      onPress: () => {
        onClose();
        onSelectOption('Create');
      },
    },
    {
      id: 'reel',
      title: 'Create Short Reel',
      subtitle: 'Vertical video with Caribbean rhythm stems & filters',
      icon: '🎬',
      badge: 'Trending',
      onPress: () => {
        onClose();
        onSelectOption('Reels');
      },
    },
    {
      id: 'sell',
      title: 'Sell on Marketplace',
      subtitle: 'List spices, mas costumes, art, phones, or handmade crafts',
      icon: '🛍️',
      badge: 'Zero Fee',
      onPress: () => {
        onClose();
        onSelectOption('SellProduct');
      },
    },
    {
      id: 'community',
      title: 'Diaspora Hub / Guild',
      subtitle: 'Create or join island communities, cultural groups & clubs',
      icon: '🌴',
      onPress: () => {
        onClose();
        onSelectOption('Communities');
      },
    },
    {
      id: 'sound',
      title: 'Caribbean Sounds & Stems',
      subtitle: 'Explore or upload reggae, soca, dancehall & kompa audio',
      icon: '🎵',
      onPress: () => {
        onClose();
        onSelectOption('Sounds');
      },
    },
    {
      id: 'live',
      title: 'Go Live Broadcast',
      subtitle: 'Stream real-time fete, talks, DJ sets with tipping & chat',
      icon: '🔴',
      onPress: () => {
        onClose();
        onSelectOption('Live');
      },
    },
    {
      id: 'podcast',
      title: 'Podcast Network',
      subtitle: 'Original Caribbean audio storytelling & diaspora episodes',
      icon: '🎙️',
      onPress: () => {
        onClose();
        onSelectOption('Podcasts');
      },
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.sheet}>
              {/* Handle Bar */}
              <View style={styles.handleContainer}>
                <View style={styles.handle} />
              </View>

              {/* Title Header */}
              <View style={styles.header}>
                <Text style={styles.title}>Create on TUKUBI 🌴</Text>
                <Text style={styles.subtitle}>
                  Connect your voice, craft, music, and community with the Caribbean diaspora.
                </Text>
              </View>

              {/* Options List */}
              <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
                {options.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={styles.optionCard}
                    onPress={option.onPress}
                    activeOpacity={0.75}
                  >
                    <View style={styles.iconContainer}>
                      <Text style={styles.icon}>{option.icon}</Text>
                    </View>
                    <View style={styles.optionInfo}>
                      <View style={styles.optionTitleRow}>
                        <Text style={styles.optionTitle}>{option.title}</Text>
                        {option.badge && (
                          <View style={styles.badge}>
                            <Text style={styles.badgeText}>{option.badge}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
                    </View>
                    <Text style={styles.chevron}>→</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Cancel Button */}
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.8}>
                <Text style={styles.cancelBtnText}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(9, 6, 15, 0.82)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: TOKENS.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: TOKENS.borderActive,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
    maxHeight: '85%',
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  handle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: TOKENS.border,
  },
  header: {
    marginVertical: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: TOKENS.textPrimary,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    color: TOKENS.textMuted,
    marginTop: 4,
    lineHeight: 18,
  },
  optionsList: {
    marginTop: 8,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: TOKENS.raised,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: TOKENS.border,
    padding: 14,
    marginBottom: 10,
    gap: 14,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 122, 89, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 122, 89, 0.3)',
  },
  icon: {
    fontSize: 22,
  },
  optionInfo: {
    flex: 1,
  },
  optionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: TOKENS.textPrimary,
  },
  badge: {
    backgroundColor: TOKENS.action + '25',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: TOKENS.action,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: TOKENS.action,
    textTransform: 'uppercase',
  },
  optionSubtitle: {
    fontSize: 11,
    color: TOKENS.textMuted,
    marginTop: 2,
    lineHeight: 15,
  },
  chevron: {
    color: TOKENS.action,
    fontSize: 18,
    fontWeight: '900',
  },
  cancelBtn: {
    marginTop: 10,
    paddingVertical: 14,
    backgroundColor: TOKENS.raised,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: TOKENS.border,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: TOKENS.textMuted,
    fontSize: 14,
    fontWeight: '700',
  },
});
