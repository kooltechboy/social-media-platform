import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons as ExpoIonicons } from '@expo/vector-icons';
import { TOKENS } from '../theme/tokens';
import { supabase } from '../lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import { uploadMedia } from '../lib/mediaUpload';

const Ionicons = ExpoIonicons as unknown as React.ComponentType<any>;

const CARIBBEAN_COUNTRIES = [
  'Jamaica',
  'Trinidad and Tobago',
  'Barbados',
  'Bahamas',
  'Dominican Republic',
  'Guyana',
  'Haiti',
  'Antigua and Barbuda',
  'Saint Lucia',
  'Grenada',
  'Saint Vincent and the Grenadines',
  'Belize',
  'Suriname',
  'Diaspora',
];

export function CreateScreen({ navigation }: any = {}) {
  const [draft, setDraft] = useState('');
  const [country, setCountry] = useState('');
  const [tags, setTags] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [photoUrlInput, setPhotoUrlInput] = useState('');
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);

  const scrollViewRef = useRef<ScrollView>(null);
  const tagsInputRef = useRef<TextInput>(null);

  const handleClose = () => {
    if (navigation?.canGoBack && !navigation.canGoBack()) {
      navigation?.navigate?.('Home');
      return;
    }
    navigation?.goBack?.();
  };

  const handlePickImage = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(
          'Permission Required',
          'Camera roll permissions are needed to select photos from your device.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setUploadingMedia(true);

        const response = await fetch(asset.uri);
        const blob = await response.blob();
        const fileName = asset.fileName || `mobile_post_${Date.now()}.jpg`;

        const uploadRes = await uploadMedia(blob, fileName, {
          bucket: 'post-media',
          folder: 'posts',
          contentType: asset.mimeType || 'image/jpeg',
        });

        if (uploadRes.url) {
          setMediaUrls((prev) => [...prev, uploadRes.url]);
        } else if (uploadRes.error) {
          Alert.alert('Upload Error', uploadRes.error);
        }
      }
    } catch (err: any) {
      console.warn('Image picker error:', err);
      // Fallback to URL prompt if native picker is unavailable
      handleAddPhotoUrl();
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleAddPhotoUrl = () => {
    if (!photoUrlInput.trim()) {
      Alert.prompt
        ? Alert.prompt(
            'Add Photo URL',
            'Enter direct image URL for your post:',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Add',
                onPress: (url) => {
                  if (url && url.trim())
                    setMediaUrls((prev) => [...prev, url.trim()]);
                },
              },
            ]
          )
        : Alert.alert(
            'Add Photo',
            'Please paste a valid image URL in the field below.'
          );
      return;
    }

    setMediaUrls((prev) => [...prev, photoUrlInput.trim()]);
    setPhotoUrlInput('');
  };

  const handleRemoveMedia = (index: number) => {
    setMediaUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePublish = async () => {
    if (!draft.trim()) return;
    setSubmitting(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { error } = await supabase.from('posts').insert({
          author_id: user.id,
          content: draft.trim(),
          visibility: 'public',
          cultural_tags: tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean),
          media_urls: mediaUrls,
          location_name: country || null,
        });

        if (!error) {
          Alert.alert('Success', 'Post published to TUKUBI network.');
          handleClose();
          return;
        } else {
          Alert.alert('Publish Error', error.message);
        }
      } else {
        Alert.alert(
          'Sign In Required',
          'Please sign in to publish to TUKUBI.'
        );
      }
    } catch (err: any) {
      console.warn('Error publishing post:', err);
      Alert.alert('Error', err.message || 'Could not publish post');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Fullscreen Midnight Reef Composer Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleClose}
          style={styles.closeBtn}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Close composer"
        >
          <Ionicons name="close" size={20} color={TOKENS.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.screenHeaderTitle}>Create Post</Text>

        <TouchableOpacity
          style={[
            styles.publishButton,
            (!draft.trim() || submitting) && styles.disabledButton,
          ]}
          onPress={handlePublish}
          disabled={!draft.trim() || submitting}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Publish post"
        >
          {submitting ? (
            <ActivityIndicator size="small" color={TOKENS.actionText} />
          ) : (
            <Text style={styles.publishText}>Publish</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Post Body Card */}
        <View style={styles.composerCard}>
          <TextInput
            style={styles.input}
            placeholder="Share an update, story, or perspective..."
            placeholderTextColor={TOKENS.textDim}
            value={draft}
            onChangeText={setDraft}
            multiline
            maxLength={1000}
            autoFocus
          />
          <View style={styles.composerFooter}>
            <Text style={styles.privacyHint}>Public to TUKUBI feed</Text>
            <Text style={styles.charCount}>{draft.length}/1000</Text>
          </View>
        </View>

        {/* Quick Cross-Create Shortcuts */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.shortcutsScroll}
          contentContainerStyle={styles.shortcutsRow}
        >
          <TouchableOpacity
            style={styles.shortcutBtn}
            onPress={() => {
              handleClose();
              navigation?.navigate?.('Reels');
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="film-outline" size={16} color={TOKENS.teal} />
            <Text style={styles.shortcutText}>Create Reel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shortcutBtn}
            onPress={() => {
              handleClose();
              navigation?.navigate?.('SellProduct');
            }}
            activeOpacity={0.8}
          >
            <Ionicons
              name="bag-handle-outline"
              size={16}
              color={TOKENS.accent}
            />
            <Text style={styles.shortcutText}>Sell Item</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shortcutBtn}
            onPress={() => {
              handleClose();
              navigation?.navigate?.('Sounds');
            }}
            activeOpacity={0.8}
          >
            <Ionicons
              name="musical-notes-outline"
              size={16}
              color={TOKENS.purple}
            />
            <Text style={styles.shortcutText}>Use Sound</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Media Attach Input */}
        <Text style={styles.label}>Photos &amp; Visuals</Text>
        <View style={styles.mediaActionsRow}>
          <TouchableOpacity
            style={styles.pickImageBtn}
            onPress={handlePickImage}
            disabled={uploadingMedia}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Choose photo from camera roll"
          >
            {uploadingMedia ? (
              <ActivityIndicator size="small" color={TOKENS.actionText} />
            ) : (
              <View style={styles.pickImageInner}>
                <Ionicons
                  name="images-outline"
                  size={18}
                  color={TOKENS.actionText}
                />
                <Text style={styles.pickImageBtnText}>
                  Choose from Camera Roll
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.mediaRow}>
          <TextInput
            style={[styles.tagInput, { flex: 1 }]}
            placeholder="Or paste photo URL (https://...)"
            placeholderTextColor={TOKENS.textDim}
            value={photoUrlInput}
            onChangeText={setPhotoUrlInput}
          />
          <TouchableOpacity
            style={styles.addMediaBtn}
            onPress={handleAddPhotoUrl}
            activeOpacity={0.8}
          >
            <Text style={styles.addMediaBtnText}>Attach</Text>
          </TouchableOpacity>
        </View>

        {/* Media Thumbnails */}
        {mediaUrls.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.thumbnailRail}
          >
            {mediaUrls.map((url, idx) => (
              <View key={idx} style={styles.thumbnailBox}>
                <Image source={{ uri: url }} style={styles.thumbnailImage} />
                <TouchableOpacity
                  style={styles.removeMediaBtn}
                  onPress={() => handleRemoveMedia(idx)}
                  accessibilityLabel="Remove attached image"
                >
                  <Ionicons name="close" size={14} color={TOKENS.textPrimary} />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}

        {/* Territory (Optional & Private by Default per AGENTS.md Rule #8) */}
        <View style={styles.labelRow}>
          <Text style={styles.labelInline}>Location / Territory</Text>
          <Text style={styles.optionalTag}>
            {country ? country : 'Optional • Off by default'}
          </Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.countryScroll}
        >
          {CARIBBEAN_COUNTRIES.map((c) => {
            const isSelected = country === c;
            return (
              <TouchableOpacity
                key={c}
                style={[
                  styles.countryChip,
                  isSelected && styles.countryChipActive,
                ]}
                onPress={() => setCountry((prev) => (prev === c ? '' : c))}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.countryText,
                    isSelected && styles.countryTextActive,
                  ]}
                >
                  {c}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Cultural Tags */}
        <Text style={styles.label}>Topics &amp; Tags (Optional)</Text>
        <TextInput
          ref={tagsInputRef}
          style={styles.tagInput}
          placeholder="e.g. dancehall, soca, culinary, carnival, tech"
          placeholderTextColor={TOKENS.textDim}
          value={tags}
          onChangeText={setTags}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: TOKENS.canvas,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: TOKENS.border,
    backgroundColor: TOKENS.surface,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: TOKENS.raised,
    borderWidth: 1,
    borderColor: TOKENS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenHeaderTitle: {
    color: TOKENS.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  publishButton: {
    backgroundColor: TOKENS.teal,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 999,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.45,
  },
  publishText: {
    color: TOKENS.actionText,
    fontWeight: '800',
    fontSize: 13,
  },
  content: {
    padding: 16,
    paddingBottom: 44,
  },
  composerCard: {
    backgroundColor: TOKENS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: TOKENS.border,
    padding: 14,
  },
  input: {
    color: TOKENS.textPrimary,
    fontSize: 16,
    minHeight: 124,
    textAlignVertical: 'top',
    lineHeight: 23,
  },
  composerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: TOKENS.border,
    marginTop: 6,
  },
  privacyHint: {
    color: TOKENS.textDim,
    fontSize: 11,
    fontWeight: '600',
  },
  charCount: {
    color: TOKENS.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  shortcutsScroll: {
    marginVertical: 14,
  },
  shortcutsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  shortcutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: TOKENS.surface,
    borderWidth: 1,
    borderColor: TOKENS.border,
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  shortcutText: {
    color: TOKENS.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    marginBottom: 8,
  },
  labelInline: {
    color: TOKENS.textPrimary,
    fontSize: 13,
    fontWeight: '800',
  },
  optionalTag: {
    color: TOKENS.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  label: {
    color: TOKENS.textPrimary,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 8,
    marginTop: 12,
  },
  mediaActionsRow: {
    marginBottom: 10,
  },
  pickImageBtn: {
    backgroundColor: TOKENS.teal,
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickImageInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pickImageBtnText: {
    color: TOKENS.actionText,
    fontSize: 14,
    fontWeight: '800',
  },
  mediaRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  addMediaBtn: {
    backgroundColor: TOKENS.raised,
    borderWidth: 1,
    borderColor: TOKENS.borderStrong,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  addMediaBtnText: {
    color: TOKENS.teal,
    fontSize: 13,
    fontWeight: '800',
  },
  thumbnailRail: {
    flexDirection: 'row',
    marginTop: 12,
  },
  thumbnailBox: {
    width: 84,
    height: 84,
    borderRadius: 14,
    marginRight: 10,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: TOKENS.borderStrong,
    backgroundColor: TOKENS.surface,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  removeMediaBtn: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: TOKENS.scrim,
    borderWidth: 1,
    borderColor: TOKENS.borderStrong,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countryScroll: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  countryChip: {
    backgroundColor: TOKENS.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    marginRight: 8,
    borderWidth: 1,
    borderColor: TOKENS.border,
  },
  countryChipActive: {
    backgroundColor: TOKENS.tealSoft,
    borderColor: TOKENS.borderActive,
  },
  countryText: {
    color: TOKENS.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  countryTextActive: {
    color: TOKENS.teal,
    fontWeight: '800',
  },
  tagInput: {
    backgroundColor: TOKENS.surface,
    borderWidth: 1,
    borderColor: TOKENS.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: TOKENS.textPrimary,
    fontSize: 14,
  },
});
