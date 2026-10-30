import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { Ionicons as ExpoIonicons } from '@expo/vector-icons';
import { TOKENS } from '../theme/tokens';
import { supabase } from '../lib/supabase';

const Ionicons = ExpoIonicons as unknown as React.ComponentType<any>;

const MARKETPLACE_CATEGORIES = [
  { slug: 'food-spices', title: 'Food & Spices', icon: 'restaurant-outline' },
  { slug: 'carnival-mas', title: 'Carnival & Mas', icon: 'sparkles-outline' },
  { slug: 'art-decor', title: 'Art & Living', icon: 'color-palette-outline' },
  { slug: 'fashion-apparel', title: 'Fashion & Island Wear', icon: 'shirt-outline' },
  { slug: 'beauty-wellness', title: 'Beauty & Sea Moss', icon: 'leaf-outline' },
  { slug: 'digital-sounds', title: 'Digital Audio & Presets', icon: 'musical-notes-outline' },
  { slug: 'services-bookings', title: 'Services & Consultations', icon: 'briefcase-outline' },
  { slug: 'electronics-tech', title: 'Tech & Phones', icon: 'hardware-chip-outline' },
];

const CONDITIONS = [
  { value: 'new', label: 'Brand New' },
  { value: 'handmade', label: 'Handmade / Artisan' },
  { value: 'used_like_new', label: 'Like New' },
  { value: 'used_good', label: 'Good' },
  { value: 'refurbished', label: 'Refurbished' },
];

const TERRITORIES: Array<{ iso: string; name: string; flag?: string; icon?: string }> = [
  { iso: '', name: 'Optional / Unspecified', icon: 'earth-outline' },
  { iso: 'JAM', name: 'Jamaica', flag: '🇯🇲' },
  { iso: 'TTO', name: 'Trinidad & Tobago', flag: '🇹🇹' },
  { iso: 'BRB', name: 'Barbados', flag: '🇧🇧' },
  { iso: 'HTI', name: 'Haiti', flag: '🇭🇹' },
  { iso: 'DOM', name: 'Dominican Republic', flag: '🇩🇴' },
  { iso: 'BHS', name: 'Bahamas', flag: '🇧🇸' },
  { iso: 'GUY', name: 'Guyana', flag: '🇬🇾' },
  { iso: 'LCA', name: 'Saint Lucia', flag: '🇱🇨' },
  { iso: 'GRD', name: 'Grenada', flag: '🇬🇩' },
  { iso: 'USA', name: 'Diaspora (USA/UK/CAN)', icon: 'globe-outline' },
];

export function SellProductScreen({ navigation }: any) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [categorySlug, setCategorySlug] = useState('food-spices');
  const [condition, setCondition] = useState('new');
  const [territoryIso, setTerritoryIso] = useState('');
  const [city, setCity] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [mediaList, setMediaList] = useState<string[]>([]);
  const [pickupAvailable, setPickupAvailable] = useState(true);
  const [shippingAvailable, setShippingAvailable] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleAddImage = () => {
    if (!imageUrl.trim()) {
      Alert.prompt
        ? Alert.prompt('Add Photo URL', 'Enter direct image URL for your product:', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Add',
              onPress: (url) => {
                if (url && url.trim()) setMediaList((prev) => [...prev, url.trim()]);
              },
            },
          ])
        : Alert.alert('Add Photo', 'Please paste an image URL in the photo field below.');
      return;
    }

    setMediaList((prev) => [...prev, imageUrl.trim()]);
    setImageUrl('');
  };

  const handleRemoveImage = (index: number) => {
    setMediaList((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePublishListing = async () => {
    if (!title.trim()) {
      Alert.alert('Missing Title', 'Please enter a title for your product listing.');
      return;
    }
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      Alert.alert('Invalid Price', 'Please enter a valid price greater than $0.00.');
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Sign In Required', 'Please sign in to publish products on Marketplace.');
        setSubmitting(false);
        return;
      }

      const priceMinor = Math.round(numPrice * 100);

      let categoryId: string | null = null;
      try {
        const { data: catData } = await supabase
          .from('marketplace_categories')
          .select('id')
          .eq('slug', categorySlug)
          .maybeSingle();
        if (catData) categoryId = catData.id;
      } catch (err) {
        console.warn('Could not query marketplace_categories:', err);
      }

      const { data: product, error: prodError } = await supabase
        .from('products')
        .insert({
          seller_id: user.id,
          title: title.trim(),
          description: description.trim() || 'Authentic Caribbean goods.',
          price_minor: priceMinor,
          currency: 'USD',
          condition,
          category_id: categoryId,
          location_country_iso: territoryIso || null,
          location_city: city.trim() || null,
          pickup_available: pickupAvailable,
          shipping_available: shippingAvailable,
          is_active: true,
          status: 'active',
          product_kind:
            categorySlug === 'digital-sounds'
              ? 'digital'
              : categorySlug === 'services-bookings'
              ? 'service'
              : 'physical',
          media_urls: mediaList.length > 0 ? mediaList : [],
        })
        .select()
        .single();

      if (prodError) {
        throw prodError;
      }

      if (product && mediaList.length > 0) {
        try {
          const mediaRows = mediaList.map((url, idx) => ({
            product_id: product.id,
            media_url: url,
            media_type: 'image',
            display_order: idx,
          }));
          await supabase.from('marketplace_product_media').insert(mediaRows);
        } catch (mErr) {
          console.warn('Could not insert marketplace_product_media:', mErr);
        }
      }

      Alert.alert('Listing Published', 'Your product is now live on the TUKUBI Marketplace.');
      navigation.goBack();
    } catch (err: any) {
      console.error('Error publishing product:', err);
      Alert.alert('Publish Failed', err.message || 'Could not publish product.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.closeBtn}
          accessibilityRole="button"
          accessibilityLabel="Close listing form"
        >
          <Ionicons name="close" size={20} color={TOKENS.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Marketplace Listing</Text>
        <TouchableOpacity
          style={[styles.publishBtn, submitting && { opacity: 0.6 }]}
          onPress={handlePublishListing}
          disabled={submitting}
          accessibilityRole="button"
          accessibilityLabel="Publish listing"
        >
          {submitting ? (
            <ActivityIndicator size="small" color={TOKENS.actionText} />
          ) : (
            <Text style={styles.publishText}>Publish</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Escrow Notice */}
        <View style={styles.escrowNotice}>
          <Ionicons name="shield-checkmark-outline" size={16} color={TOKENS.teal} />
          <Text style={styles.escrowNoticeText}>
            Listings are protected by TUKUBI escrow verification and settled directly to your connected rails.
          </Text>
        </View>

        {/* Title */}
        <Text style={styles.label}>Product Title *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Jamaican Blue Mountain Coffee 16oz"
          placeholderTextColor={TOKENS.textDim}
          value={title}
          onChangeText={setTitle}
          maxLength={100}
        />

        {/* Price */}
        <Text style={styles.label}>Price (USD) *</Text>
        <TextInput
          style={styles.input}
          placeholder="25.00"
          placeholderTextColor={TOKENS.textDim}
          value={price}
          onChangeText={setPrice}
          keyboardType="decimal-pad"
        />

        {/* Optional Heritage / Territory Selector */}
        <View style={styles.labelRow}>
          <Text style={styles.labelInline}>Heritage / Origin Territory</Text>
          <Text style={styles.optionalTag}>Optional</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          {TERRITORIES.map((t) => {
            const active = territoryIso === t.iso;
            return (
              <TouchableOpacity
                key={t.iso || 'OPTIONAL'}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setTerritoryIso(t.iso)}
              >
                {t.flag ? (
                  <Text style={styles.flagText}>{t.flag}</Text>
                ) : (
                  <Ionicons
                    name={t.icon || 'earth-outline'}
                    size={13}
                    color={active ? TOKENS.teal : TOKENS.textMuted}
                  />
                )}
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{t.name}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* City */}
        <View style={styles.labelRow}>
          <Text style={styles.labelInline}>City / Parish / District</Text>
          <Text style={styles.optionalTag}>Optional</Text>
        </View>
        <TextInput
          style={styles.input}
          placeholder="e.g. Kingston, Port of Spain, Bridgetown"
          placeholderTextColor={TOKENS.textDim}
          value={city}
          onChangeText={setCity}
        />

        {/* Category Picker */}
        <Text style={styles.label}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          {MARKETPLACE_CATEGORIES.map((c) => {
            const active = categorySlug === c.slug;
            return (
              <TouchableOpacity
                key={c.slug}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setCategorySlug(c.slug)}
              >
                <Ionicons
                  name={c.icon}
                  size={14}
                  color={active ? TOKENS.teal : TOKENS.textMuted}
                />
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{c.title}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Condition Picker */}
        <Text style={styles.label}>Condition</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          {CONDITIONS.map((cond) => {
            const active = condition === cond.value;
            return (
              <TouchableOpacity
                key={cond.value}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setCondition(cond.value)}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{cond.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Description */}
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="Describe craftsmanship, materials, sizing, or specifications…"
          placeholderTextColor={TOKENS.textDim}
          value={description}
          onChangeText={setDescription}
          multiline
          maxLength={1000}
        />

        {/* Photos & Media URL */}
        <Text style={styles.label}>Photos &amp; Media</Text>
        <View style={styles.mediaInputRow}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Paste image URL (https://…)"
            placeholderTextColor={TOKENS.textDim}
            value={imageUrl}
            onChangeText={setImageUrl}
            autoCapitalize="none"
          />
          <TouchableOpacity style={styles.addImageBtn} onPress={handleAddImage}>
            <Ionicons name="image-outline" size={16} color={TOKENS.teal} />
            <Text style={styles.addImageBtnText}>Add</Text>
          </TouchableOpacity>
        </View>

        {/* Media Preview Thumbnails */}
        {mediaList.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbnailRow}>
            {mediaList.map((url, index) => (
              <View key={index} style={styles.thumbnailBox}>
                <Image source={{ uri: url }} style={styles.thumbnail} />
                <TouchableOpacity
                  style={styles.removeThumbnail}
                  onPress={() => handleRemoveImage(index)}
                  accessibilityRole="button"
                  accessibilityLabel="Remove photo"
                >
                  <Ionicons name="close" size={12} color={TOKENS.textPrimary} />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}

        {/* Delivery / Fulfillment */}
        <Text style={styles.label}>Fulfillment Options</Text>
        <View style={styles.switchRow}>
          <TouchableOpacity
            style={[styles.switchChip, pickupAvailable && styles.switchChipActive]}
            onPress={() => setPickupAvailable(!pickupAvailable)}
          >
            <Ionicons
              name={pickupAvailable ? 'checkmark-circle' : 'location-outline'}
              size={15}
              color={pickupAvailable ? TOKENS.teal : TOKENS.textMuted}
            />
            <Text style={[styles.switchChipText, pickupAvailable && styles.switchChipTextActive]}>
              Local Pickup
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.switchChip, shippingAvailable && styles.switchChipActive]}
            onPress={() => setShippingAvailable(!shippingAvailable)}
          >
            <Ionicons
              name={shippingAvailable ? 'checkmark-circle' : 'cube-outline'}
              size={15}
              color={shippingAvailable ? TOKENS.teal : TOKENS.textMuted}
            />
            <Text style={[styles.switchChipText, shippingAvailable && styles.switchChipTextActive]}>
              Shipping
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: TOKENS.canvas },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { color: TOKENS.textPrimary, fontSize: 16, fontWeight: '800' },
  publishBtn: {
    backgroundColor: TOKENS.teal,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 999,
  },
  publishText: { color: TOKENS.actionText, fontSize: 13, fontWeight: '800' },
  content: { padding: 18, paddingBottom: 44 },
  escrowNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: TOKENS.oceanDepth,
    borderWidth: 1,
    borderColor: TOKENS.borderActive,
    borderRadius: 14,
    padding: 12,
    marginBottom: 4,
  },
  escrowNoticeText: {
    flex: 1,
    color: TOKENS.textSecondary,
    fontSize: 11,
    lineHeight: 16,
  },
  label: {
    color: TOKENS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 14,
    marginBottom: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    marginBottom: 6,
  },
  labelInline: {
    color: TOKENS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  optionalTag: {
    color: TOKENS.textDim,
    fontSize: 11,
    fontWeight: '600',
  },
  input: {
    backgroundColor: TOKENS.surface,
    borderWidth: 1,
    borderColor: TOKENS.borderStrong,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: TOKENS.textPrimary,
    fontSize: 14,
  },
  textarea: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  chipRow: { flexDirection: 'row', marginVertical: 4 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: TOKENS.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: TOKENS.border,
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: TOKENS.tealSoft,
    borderColor: TOKENS.borderActive,
  },
  flagText: { fontSize: 13 },
  chipText: { color: TOKENS.textMuted, fontSize: 12, fontWeight: '700' },
  chipTextActive: { color: TOKENS.teal, fontWeight: '800' },
  mediaInputRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  addImageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: TOKENS.raised,
    borderWidth: 1,
    borderColor: TOKENS.borderActive,
    borderRadius: 14,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  addImageBtnText: { color: TOKENS.teal, fontSize: 13, fontWeight: '800' },
  thumbnailRow: { flexDirection: 'row', marginTop: 10 },
  thumbnailBox: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 10,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: TOKENS.borderStrong,
  },
  thumbnail: { width: '100%', height: '100%' },
  removeThumbnail: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: TOKENS.scrim,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  switchChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: TOKENS.surface,
    borderWidth: 1,
    borderColor: TOKENS.border,
    borderRadius: 12,
    paddingVertical: 12,
  },
  switchChipActive: {
    backgroundColor: TOKENS.tealSoft,
    borderColor: TOKENS.borderActive,
  },
  switchChipText: { color: TOKENS.textMuted, fontSize: 12, fontWeight: '700' },
  switchChipTextActive: { color: TOKENS.teal, fontWeight: '800' },
});
