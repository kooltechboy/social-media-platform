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
import { Ionicons as ExpoIonicons } from '@expo/vector-icons';
import { TOKENS } from '../theme/tokens';

const Ionicons = ExpoIonicons as unknown as React.ComponentType<{
  name: keyof typeof ExpoIonicons.glyphMap;
  size?: number;
  color?: string;
}>;

export interface CreateOption {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof ExpoIonicons.glyphMap;
  iconColor: string;
  iconBg: string;
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
      title: 'Share Post or Moment',
      subtitle: 'Stories, cultural conversations, photos & diaspora updates',
      icon: 'create-outline',
      iconColor: TOKENS.teal,
      iconBg: TOKENS.tealSoft,
      onPress: () => {
        onClose();
        onSelectOption('Create');
      },
    },
    {
      id: 'reel',
      title: 'Create TUKUBI Short',
      subtitle: 'Vertical 9:16 video with Caribbean rhythm stems',
      icon: 'film-outline',
      iconColor: TOKENS.action,
      iconBg: TOKENS.oceanSoft,
      badge: 'Shorts',
      onPress: () => {
        onClose();
        onSelectOption('Reels');
      },
    },
    {
      id: 'sell',
      title: 'List on Marketplace',
      subtitle: 'List island crafts, fashion, culinary goods, or services',
      icon: 'bag-handle-outline',
      iconColor: TOKENS.accent,
      iconBg: TOKENS.amberSoft,
      badge: 'Escrow',
      onPress: () => {
        onClose();
        onSelectOption('SellProduct');
      },
    },
    {
      id: 'community',
      title: 'Diaspora Hub or Guild',
      subtitle: 'Launch or join island communities & professional circles',
      icon: 'people-outline',
      iconColor: TOKENS.teal,
      iconBg: TOKENS.tealSoft,
      onPress: () => {
        onClose();
        onSelectOption('Communities');
      },
    },
    {
      id: 'sound',
      title: 'Caribbean Sounds & Stems',
      subtitle: 'Explore or publish reggae, soca, dancehall & kompa audio',
      icon: 'musical-notes-outline',
      iconColor: TOKENS.purple,
      iconBg: TOKENS.violetSoft,
      onPress: () => {
        onClose();
        onSelectOption('Sounds');
      },
    },
    {
      id: 'live',
      title: 'Go Live Broadcast',
      subtitle: 'Stream live conversations, DJ sets & cultural events',
      icon: 'radio-outline',
      iconColor: TOKENS.danger,
      iconBg: 'rgba(244, 63, 94, 0.14)',
      onPress: () => {
        onClose();
        onSelectOption('Live');
      },
    },
    {
      id: 'podcast',
      title: 'Podcast Network',
      subtitle: 'Original Caribbean audio storytelling & diaspora shows',
      icon: 'mic-outline',
      iconColor: TOKENS.purple,
      iconBg: TOKENS.violetSoft,
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
              <View style={styles.handleContainer}>
                <View style={styles.handle} />
              </View>

              <View style={styles.headerRow}>
                <View style={styles.headerCopy}>
                  <Text style={styles.title}>Create on TUKUBI</Text>
                  <Text style={styles.subtitle}>
                    Publish across the Caribbean and global diaspora
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.closeIconBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Close creation menu"
                >
                  <Ionicons name="close" size={20} color={TOKENS.textMuted} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
                {options.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={styles.optionCard}
                    onPress={option.onPress}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.iconContainer, { backgroundColor: option.iconBg }]}>
                      <Ionicons name={option.icon} size={20} color={option.iconColor} />
                    </View>
                    <View style={styles.optionInfo}>
                      <View style={styles.optionTitleRow}>
                        <Text style={styles.optionTitle}>{option.title}</Text>
                        {option.badge ? (
                          <View style={styles.badge}>
                            <Text style={styles.badgeText}>{option.badge}</Text>
                          </View>
                        ) : null}
                      </View>
                      <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={TOKENS.textDim} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
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
    backgroundColor: TOKENS.scrim,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: TOKENS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: TOKENS.borderStrong,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 28,
    maxHeight: '84%',
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: TOKENS.border,
    marginBottom: 10,
  },
  headerCopy: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    color: TOKENS.textMuted,
    marginTop: 2,
  },
  closeIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: TOKENS.raised,
    borderWidth: 1,
    borderColor: TOKENS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionsList: {
    marginTop: 2,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: TOKENS.raised,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: TOKENS.border,
    paddingVertical: 12,
    paddingHorizontal: 13,
    marginBottom: 8,
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: TOKENS.border,
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
    fontWeight: '700',
    color: '#F8FAFC',
  },
  badge: {
    backgroundColor: TOKENS.tealSoft,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: TOKENS.borderActive,
  },
  badgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: TOKENS.teal,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  optionSubtitle: {
    fontSize: 11.5,
    color: TOKENS.textMuted,
    marginTop: 2,
    lineHeight: 16,
  },
});
