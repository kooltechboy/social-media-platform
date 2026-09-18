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
import { TOKENS } from '../theme/tokens';
import { supabase } from '../lib/supabase';

const MARKETPLACE_CATEGORIES = [
  { slug: 'food-spices', title: 'Food & Spices', icon: '🌶️' },
  { slug: 'carnival-mas', title: 'Carnival & Mas', icon: '✨' },
  { slug: 'art-decor', title: 'Art & Living', icon: '🎨' },
  { slug: 'fashion-apparel', title: 'Fashion & Island Wear', icon: '👗' },
  { slug: 'beauty-wellness', title: 'Beauty & Sea Moss', icon: '🌿' },
  { slug: 'digital-sounds', title: 'Digital Audio & Presets', icon: '🎧' },
  { slug: 'services-bookings', title: 'Services & Consultations', icon: '💼' },
  { slug: 'electronics-tech', title: 'Tech & Phones', icon: '📱' },
];

const CONDITIONS = [
  { value: 'new', label: 'Brand New' },
  { value: 'handmade', label: 'Handmade / Artisan' },
  { value: 'used_like_new', label: 'Like New' },
  { value: 'used_good', label: 'Good' },
  { value: 'refurbished', label: 'Refurbished' },
];

const TERRITORIES = [
  { iso: 'JAM', name: 'Jamaica', flag: '🇯🇲' },
  { iso: 'TTO', name: 'Trinidad & Tobago', flag: '🇹🇹' },
  { iso: 'BRB', name: 'Barbados', flag: '🇧🇧' },
  { iso: 'HTI', name: 'Haiti', flag: '🇭🇹' },
  { iso: 'DOM', name: 'Dominican Republic', flag: '🇩🇴' },
  { iso: 'BHS', name: 'Bahamas', flag: '🇧🇸' },
  { iso: 'GUY', name: 'Guyana', flag: '🇬🇾' },
  { iso: 'LCA', name: 'Saint Lucia', flag: '🇱🇨' },
  { iso: 'GRD', name: 'Grenada', flag: '🇬🇩' },
  { iso: 'USA', name: 'Diaspora (USA/UK/CAN)', flag: '🌴' },
];

export function SellProductScreen({ navigation }: any) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [categorySlug, setCategorySlug] = useState('food-spices');
  const [condition, setCondition] = useState('new');
  const [territoryIso, setTerritoryIso] = useState('JAM');
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

      // Find category UUID if available
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

      // Insert product
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
          location_country_iso: territoryIso,
          location_city: city.trim() || 'Caribbean',
          pickup_available: pickupAvailable,
          shipping_available: shippingAvailable,
          is_active: true,
          status: 'active',
          product_kind: categorySlug === 'digital-sounds' ? 'digital' : categorySlug === 'services-bookings' ? 'service' : 'physical',
          media_urls: mediaList.length > 0 ? mediaList : [],
        })
        .select()
        .single();

      if (prodError) {
        throw prodError;
      }

      // If media attached, insert into marketplace_product_media
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

      Alert.alert('Success! 🛍️', 'Your product has been published to TUKUBI Caribbean Marketplace!');
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
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.cancelBtn}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sell on Marketplace</Text>
        <TouchableOpacity
          style={[styles.publishBtn, submitting && { opacity: 0.6 }]}
          onPress={handlePublishListing}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#090D1A" />
          ) : (
            <Text style={styles.publishText}>Publish</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Title */}
        <Text style={styles.label}>Product Title *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Jamaican Blue Mountain Coffee 16oz"
          placeholderTextColor={TOKENS.textMuted}
          value={title}
          onChangeText={setTitle}
          maxLength={100}
        />

        {/* Price & Currency */}
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Price ($USD) *</Text>
            <TextInput
              style={styles.input}
              placeholder="25.00"
              placeholderTextColor={TOKENS.textMuted}
              value={price}
              onChangeText={setPrice}
              keyboardType="decimal-pad"
            />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.label}>Territory *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {TERRITORIES.map((t) => (
                <TouchableOpacity
                  key={t.iso}
                  style={[styles.chip, territoryIso === t.iso && styles.chipActive]}
                  onPress={() => setTerritoryIso(t.iso)}
                >
                  <Text style={styles.chipText}>{t.flag} {t.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* City */}
        <Text style={styles.label}>City / Parish / District</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Kingston, Port of Spain, Bridgetown"
          placeholderTextColor={TOKENS.textMuted}
          value={city}
          onChangeText={setCity}
        />

        {/* Category Picker */}
        <Text style={styles.label}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          {MARKETPLACE_CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c.slug}
              style={[styles.chip, categorySlug === c.slug && styles.chipActive]}
              onPress={() => setCategorySlug(c.slug)}
            >
              <Text style={styles.chipText}>{c.icon} {c.title}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Condition Picker */}
        <Text style={styles.label}>Condition</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          {CONDITIONS.map((cond) => (
            <TouchableOpacity
              key={cond.value}
              style={[styles.chip, condition === cond.value && styles.chipActive]}
              onPress={() => setCondition(cond.value)}
            >
              <Text style={styles.chipText}>{cond.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Description */}
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, { minHeight: 90, textAlignVertical: 'top' }]}
          placeholder="Describe your craft, origin, ingredients, size, or authenticity..."
          placeholderTextColor={TOKENS.textMuted}
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
            placeholder="Paste Image URL (https://...)"
            placeholderTextColor={TOKENS.textMuted}
            value={imageUrl}
            onChangeText={setImageUrl}
          />
          <TouchableOpacity style={styles.addImageBtn} onPress={handleAddImage}>
            <Text style={styles.addImageBtnText}>+ Add</Text>
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
                >
                  <Text style={styles.removeThumbnailText}>✕</Text>
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
            <Text style={styles.switchChipText}>📍 Local Pickup {pickupAvailable ? '✓' : ''}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.switchChip, shippingAvailable && styles.switchChipActive]}
            onPress={() => setShippingAvailable(!shippingAvailable)}
          >
            <Text style={styles.switchChipText}>📦 Island / Diaspora Shipping {shippingAvailable ? '✓' : ''}</Text>
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
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: TOKENS.border,
    backgroundColor: TOKENS.surface,
  },
  cancelBtn: { padding: 4 },
  cancelText: { color: TOKENS.textMuted, fontSize: 14, fontWeight: '700' },
  headerTitle: { color: TOKENS.textPrimary, fontSize: 16, fontWeight: '900' },
  publishBtn: {
    backgroundColor: TOKENS.action,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 999,
  },
  publishText: { color: '#090D1A', fontSize: 13, fontWeight: '900' },
  content: { padding: 18, paddingBottom: 40 },
  label: { color: TOKENS.textPrimary, fontSize: 12, fontWeight: '800', marginTop: 14, marginBottom: 6 },
  input: {
    backgroundColor: TOKENS.surface,
    borderWidth: 1,
    borderColor: TOKENS.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: TOKENS.textPrimary,
    fontSize: 14,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  chipRow: { flexDirection: 'row', marginVertical: 4 },
  chip: {
    backgroundColor: TOKENS.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: TOKENS.border,
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: TOKENS.action + '25',
    borderColor: TOKENS.action,
  },
  chipText: { color: TOKENS.textPrimary, fontSize: 11, fontWeight: '700' },
  mediaInputRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  addImageBtn: {
    backgroundColor: TOKENS.raised,
    borderWidth: 1,
    borderColor: TOKENS.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  addImageBtnText: { color: TOKENS.action, fontSize: 13, fontWeight: '800' },
  thumbnailRow: { flexDirection: 'row', marginTop: 10 },
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
  thumbnail: { width: '100%', height: '100%' },
  removeThumbnail: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.7)',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeThumbnailText: { color: '#FFF', fontSize: 10, fontWeight: '900' },
  switchRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  switchChip: {
    flex: 1,
    backgroundColor: TOKENS.surface,
    borderWidth: 1,
    borderColor: TOKENS.border,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  switchChipActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: TOKENS.success,
  },
  switchChipText: { color: TOKENS.textPrimary, fontSize: 12, fontWeight: '700' },
});
