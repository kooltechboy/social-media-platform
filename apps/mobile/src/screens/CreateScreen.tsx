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
import { TOKENS } from '../theme/tokens';
import { supabase } from '../lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import { uploadMedia } from '../lib/mediaUpload';

const CARIBBEAN_COUNTRIES = [
  'Jamaica', 'Trinidad and Tobago', 'Barbados', 'Bahamas', 
  'Dominican Republic', 'Guyana', 'Haiti', 'Antigua and Barbuda', 
  'Saint Lucia', 'Grenada', 'Saint Vincent and the Grenadines', 
  'Belize', 'Suriname', 'Diaspora'
];

export function CreateScreen({ navigation }: any) {
  const [draft, setDraft] = useState('');
  const [country, setCountry] = useState('Jamaica');
  const [tags, setTags] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [photoUrlInput, setPhotoUrlInput] = useState('');
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);

  const scrollViewRef = useRef<ScrollView>(null);
  const tagsInputRef = useRef<TextInput>(null);

  const handlePickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
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
        ? Alert.prompt('Add Photo URL', 'Enter direct image URL for your post:', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Add',
              onPress: (url) => {
                if (url && url.trim()) setMediaUrls((prev) => [...prev, url.trim()]);
              },
            },
          ])
        : Alert.alert('Add Photo', 'Please paste a valid image URL in the field below.');
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
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { error } = await supabase
          .from('posts')
          .insert({
            author_id: user.id,
            content: draft.trim(),
            visibility: 'public',
            cultural_tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
            media_urls: mediaUrls,
            location_name: country,
          });

        if (!error) {
          Alert.alert('Success', 'Post published to TUKUBI network! 🌴');
          navigation.goBack();
          return;
        } else {
          Alert.alert('Publish Error', error.message);
        }
      } else {
        Alert.alert('Sign In Required', 'Please sign in to publish to TUKUBI.');
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.cancelBtn}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.screenHeaderTitle}>New Caribbean Post</Text>
        <TouchableOpacity 
          style={[styles.publishButton, (!draft.trim() || submitting) && styles.disabledButton]}
          onPress={handlePublish}
          disabled={!draft.trim() || submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#090D1A" />
          ) : (
            <Text style={styles.publishText}>Post</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView ref={scrollViewRef} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Post body */}
        <TextInput
          style={styles.input}
          placeholder="What's happening in your Caribbean world?"
          placeholderTextColor={TOKENS.textMuted}
          value={draft}
          onChangeText={setDraft}
          multiline
          maxLength={1000}
          autoFocus
        />
        <Text style={styles.charCount}>{draft.length}/1000</Text>

        {/* Quick Cross-Create Shortcuts */}
        <View style={styles.shortcutsRow}>
          <TouchableOpacity
            style={styles.shortcutBtn}
            onPress={() => {
              navigation.goBack();
              navigation.navigate('Reels');
            }}
          >
            <Text style={styles.shortcutText}>🎬 Create Reel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.shortcutBtn}
            onPress={() => {
              navigation.goBack();
              navigation.navigate('SellProduct');
            }}
          >
            <Text style={styles.shortcutText}>🛍️ Sell Item</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.shortcutBtn}
            onPress={() => {
              navigation.goBack();
              navigation.navigate('Sounds');
            }}
          >
            <Text style={styles.shortcutText}>🎵 Use Sound</Text>
          </TouchableOpacity>
        </View>

        {/* Media Attach Input */}
        <Text style={styles.label}>Attached Photos &amp; Visuals</Text>
        <View style={styles.mediaActionsRow}>
          <TouchableOpacity
            style={styles.pickImageBtn}
            onPress={handlePickImage}
            disabled={uploadingMedia}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Choose photo from camera roll"
          >
            {uploadingMedia ? (
              <ActivityIndicator size="small" color="#090D1A" />
            ) : (
              <Text style={styles.pickImageBtnText}>📸 Choose from Camera Roll</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.mediaRow}>
          <TextInput
            style={[styles.tagInput, { flex: 1 }]}
            placeholder="Or paste photo URL (https://...)"
            placeholderTextColor={TOKENS.textMuted}
            value={photoUrlInput}
            onChangeText={setPhotoUrlInput}
          />
          <TouchableOpacity style={styles.addMediaBtn} onPress={handleAddPhotoUrl}>
            <Text style={styles.addMediaBtnText}>+ Attach</Text>
          </TouchableOpacity>
        </View>

        {/* Media Thumbnails */}
        {mediaUrls.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbnailRail}>
            {mediaUrls.map((url, idx) => (
              <View key={idx} style={styles.thumbnailBox}>
                <Image source={{ uri: url }} style={styles.thumbnailImage} />
                <TouchableOpacity
                  style={styles.removeMediaBtn}
                  onPress={() => handleRemoveMedia(idx)}
                >
                  <Text style={styles.removeMediaText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}

        {/* Territory */}
        <Text style={styles.label}>Location / Territory</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.countryScroll}>
          {CARIBBEAN_COUNTRIES.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.countryChip, country === c && styles.countryChipActive]}
              onPress={() => setCountry(c)}
            >
              <Text style={[styles.countryText, country === c && styles.countryTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Cultural Tags */}
        <Text style={styles.label}>Cultural Tags</Text>
        <TextInput
          ref={tagsInputRef}
          style={styles.tagInput}
          placeholder="e.g. dancehall, soca, food, carnival, reggae"
          placeholderTextColor={TOKENS.textMuted}
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
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: TOKENS.border,
    backgroundColor: TOKENS.surface,
  },
  cancelBtn: { padding: 4 },
  cancelText: {
    color: TOKENS.textMuted,
    fontSize: 14,
    fontWeight: '700',
  },
  screenHeaderTitle: {
    color: TOKENS.textPrimary,
    fontSize: 15,
    fontWeight: '900',
  },
  publishButton: {
    backgroundColor: TOKENS.action,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 999,
  },
  disabledButton: {
    opacity: 0.5,
  },
  publishText: {
    color: '#090D1A',
    fontWeight: '900',
    fontSize: 13,
  },
  content: {
    padding: 18,
    paddingBottom: 40,
  },
  input: {
    color: TOKENS.textPrimary,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    lineHeight: 24,
  },
  charCount: {
    color: TOKENS.textMuted,
    textAlign: 'right',
    fontSize: 11,
    marginTop: 4,
    fontWeight: '600',
  },
  shortcutsRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 14,
  },
  shortcutBtn: {
    backgroundColor: TOKENS.raised,
    borderWidth: 1,
    borderColor: TOKENS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  shortcutText: {
    color: TOKENS.textPrimary,
    fontSize: 11,
    fontWeight: '700',
  },
  label: {
    color: TOKENS.textPrimary,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 8,
    marginTop: 14,
  },
  mediaActionsRow: {
    marginBottom: 10,
  },
  pickImageBtn: {
    backgroundColor: TOKENS.action,
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: TOKENS.action,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  pickImageBtnText: {
    color: '#090D1A',
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
    borderColor: TOKENS.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  addMediaBtnText: {
    color: TOKENS.action,
    fontSize: 13,
    fontWeight: '800',
  },
  thumbnailRail: {
    flexDirection: 'row',
    marginTop: 10,
  },
  thumbnailBox: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 10,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: TOKENS.border,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  removeMediaBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.75)',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeMediaText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
  },
  countryScroll: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  countryChip: {
    backgroundColor: TOKENS.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: TOKENS.border,
  },
  countryChipActive: {
    backgroundColor: TOKENS.action + '25',
    borderColor: TOKENS.action,
  },
  countryText: {
    color: TOKENS.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  countryTextActive: {
    color: TOKENS.action,
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
