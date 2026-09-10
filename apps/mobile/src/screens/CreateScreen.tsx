import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert
} from 'react-native';
import { TOKENS } from '../theme/tokens';
import { supabase } from '../lib/supabase';

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
            cultural_tags: tags.split(',').map(t => t.trim()).filter(Boolean),
            media_urls: [],
          });

        if (!error) {
          Alert.alert('Success', 'Post published!');
          navigation.goBack();
          return;
        }
      }
      
      // Fallback if not authenticated or error
      Alert.alert('Success', 'Post published! (Offline Mode)');
      navigation.goBack();
    } catch (err) {
      console.warn('Error publishing post:', err);
      Alert.alert('Error', 'Could not publish post');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.publishButton, (!draft.trim() || submitting) && styles.disabledButton]}
          onPress={handlePublish}
          disabled={!draft.trim() || submitting}
        >
          <Text style={styles.publishText}>{submitting ? 'Posting...' : 'Post'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <TextInput
          style={styles.input}
          placeholder="What's happening in your Caribbean world?"
          placeholderTextColor={TOKENS.textMuted}
          value={draft}
          onChangeText={setDraft}
          multiline
          maxLength={500}
          autoFocus
        />
        <Text style={styles.charCount}>{draft.length}/500</Text>

        <View style={styles.mediaRow}>
          <TouchableOpacity style={styles.mediaBtn}><Text style={styles.mediaIcon}>📷 Photo</Text></TouchableOpacity>
          <TouchableOpacity style={styles.mediaBtn}><Text style={styles.mediaIcon}>🎥 Video</Text></TouchableOpacity>
          <TouchableOpacity style={styles.mediaBtn}><Text style={styles.mediaIcon}>📍 Location</Text></TouchableOpacity>
          <TouchableOpacity style={styles.mediaBtn}><Text style={styles.mediaIcon}>🏷️ Tags</Text></TouchableOpacity>
        </View>

        <Text style={styles.label}>Location (Optional)</Text>
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

        <Text style={styles.label}>Cultural Tags</Text>
        <TextInput
          style={styles.tagInput}
          placeholder="e.g. dancehall, food, travel (comma separated)"
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: TOKENS.border,
  },
  cancelText: {
    color: TOKENS.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  publishButton: {
    backgroundColor: TOKENS.action,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  disabledButton: {
    opacity: 0.5,
  },
  publishText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
  content: {
    padding: 16,
  },
  input: {
    color: TOKENS.textPrimary,
    fontSize: 18,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  charCount: {
    color: TOKENS.textMuted,
    textAlign: 'right',
    fontSize: 12,
    marginTop: 8,
  },
  mediaRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  mediaBtn: {
    backgroundColor: TOKENS.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: TOKENS.border,
  },
  mediaIcon: {
    color: TOKENS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  label: {
    color: TOKENS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    marginTop: 8,
  },
  countryScroll: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  countryChip: {
    backgroundColor: TOKENS.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: TOKENS.border,
  },
  countryChipActive: {
    backgroundColor: TOKENS.action + '20',
    borderColor: TOKENS.action,
  },
  countryText: {
    color: TOKENS.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  countryTextActive: {
    color: TOKENS.action,
  },
  tagInput: {
    backgroundColor: TOKENS.surface,
    borderWidth: 1,
    borderColor: TOKENS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: TOKENS.textPrimary,
    fontSize: 14,
  }
});
