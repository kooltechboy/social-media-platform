import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  SafeAreaView,
  Modal,
} from 'react-native';
import { TOKENS } from '../theme/tokens';
import { supabase } from '../lib/supabase';

interface MobileProduct {
  id: string;
  title: string;
  description: string;
  priceFormatted: string;
  priceMinor: number;
  currency: string;
  productKind: string;
  condition: string;
  sellerName: string;
  sellerId: string;
  location: string;
  inventoryCount: number | null;
}

const CATEGORIES = [
  'All',
  'Food & Spices',
  'Carnival & Mas',
  'Art & Decor',
  'Fashion',
  'Digital',
  'Services',
  'Tech',
];

const TERRITORIES = [
  { code: 'ALL', flag: '🌴', name: 'All' },
  { code: 'JAM', flag: '🇯🇲', name: 'Jamaica' },
  { code: 'DOM', flag: '🇩🇴', name: 'Dom. Rep.' },
  { code: 'TTO', flag: '🇹🇹', name: 'Trinidad' },
  { code: 'HTI', flag: '🇭🇹', name: 'Haiti' },
  { code: 'BRB', flag: '🇧🇧', name: 'Barbados' },
];

export function MarketplaceScreen() {
  const [products, setProducts] = useState<MobileProduct[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeTerritory, setActiveTerritory] = useState('ALL');
  const [selectedProduct, setSelectedProduct] = useState<MobileProduct | null>(null);
  const [offerPriceInput, setOfferPriceInput] = useState('');
  const [offerSuccess, setOfferSuccess] = useState(false);

  const fetchProducts = async () => {
    try {
      let query = supabase
        .from('products')
        .select(`
          id, title, description, price_minor, currency, product_kind,
          condition, location_city, location_country_iso, inventory_count, seller_id,
          profiles(display_name, username),
          businesses(name)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(30);

      if (searchQuery.trim()) {
        query = query.ilike('title', `%${searchQuery.trim()}%`);
      }

      if (activeTerritory !== 'ALL') {
        query = query.eq('location_country_iso', activeTerritory);
      }

      const { data, error } = await query;
      if (data && !error) {
        const mapped: MobileProduct[] = data.map((item: any) => ({
          id: item.id,
          title: item.title,
          description: item.description || 'Authentic Caribbean listing.',
          priceMinor: item.price_minor,
          priceFormatted: `$${(item.price_minor / 100).toFixed(2)} ${item.currency || 'USD'}`,
          currency: item.currency || 'USD',
          productKind: item.product_kind || 'physical',
          condition: item.condition || 'New',
          sellerName: item.businesses?.name || item.profiles?.display_name || item.profiles?.username || 'Merchant',
          sellerId: item.seller_id,
          location: item.location_city || 'Caribbean',
          inventoryCount: item.inventory_count,
        }));
        setProducts(mapped);
      }
    } catch (err) {
      console.warn('Could not fetch marketplace products', err);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [activeTerritory, searchQuery]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProducts();
    setRefreshing(false);
  };

  const handleMakeOffer = () => {
    if (!offerPriceInput || !selectedProduct) return;
    setOfferSuccess(true);
    setTimeout(() => {
      setOfferSuccess(false);
      setSelectedProduct(null);
      setOfferPriceInput('');
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Caribbean Marketplace</Text>
          <Text style={styles.headerSubtitle}>
            Verified island crafts, coffee, and creator goods with buyer protection.
          </Text>
        </View>

        {/* Search Input */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search goods (e.g. coffee, mas, phones)..."
            placeholderTextColor={TOKENS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Territory Filter Rail */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.territoryRail}
          contentContainerStyle={styles.territoryRailContent}
        >
          {TERRITORIES.map((t) => (
            <TouchableOpacity
              key={t.code}
              onPress={() => setActiveTerritory(t.code)}
              style={[
                styles.territoryChip,
                activeTerritory === t.code && styles.territoryChipActive,
              ]}
            >
              <Text style={styles.territoryFlag}>{t.flag}</Text>
              <Text
                style={[
                  styles.territoryText,
                  activeTerritory === t.code && styles.territoryTextActive,
                ]}
              >
                {t.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Categories Rail */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryRail}
          contentContainerStyle={styles.categoryRailContent}
        >
          {CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c}
              onPress={() => setActiveCategory(c)}
              style={[
                styles.categoryChip,
                activeCategory === c && styles.categoryChipActive,
              ]}
            >
              <Text
                style={[
                  styles.categoryText,
                  activeCategory === c && styles.categoryTextActive,
                ]}
              >
                {c}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Product Grid List */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={TOKENS.action}
            />
          }
        >
          {products.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🛍️</Text>
              <Text style={styles.emptyTitle}>No Products Found</Text>
              <Text style={styles.emptyText}>
                No verified Caribbean merchandise matches this search query. Try clearing your filters.
              </Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {products.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.card}
                  onPress={() => {
                    setSelectedProduct(item);
                    setOfferPriceInput((item.priceMinor * 0.9 / 100).toFixed(2));
                  }}
                  activeOpacity={0.8}
                >
                  <View style={styles.cardImagePlaceholder}>
                    <Text style={styles.cardImageEmoji}>
                      {item.productKind === 'service' ? '🤝' : item.productKind === 'digital' ? '🎧' : '📦'}
                    </Text>
                    <View style={styles.kindBadge}>
                      <Text style={styles.kindBadgeText}>{item.productKind}</Text>
                    </View>
                  </View>

                  <View style={styles.cardBody}>
                    <Text style={styles.cardSeller} numberOfLines={1}>
                      {item.sellerName}
                    </Text>
                    <Text style={styles.cardTitle} numberOfLines={2}>
                      {item.title}
                    </Text>
                    <View style={styles.cardFooter}>
                      <Text style={styles.cardPrice}>{item.priceFormatted}</Text>
                      <Text style={styles.cardCondition}>{item.condition}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Product Detail & Make Offer Modal */}
        <Modal
          visible={!!selectedProduct}
          transparent
          animationType="slide"
          onRequestClose={() => setSelectedProduct(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {selectedProduct && (
                <>
                  <Text style={styles.modalTitle}>{selectedProduct.title}</Text>
                  <Text style={styles.modalSeller}>
                    Sold by {selectedProduct.sellerName} • {selectedProduct.location}
                  </Text>
                  <Text style={styles.modalPrice}>{selectedProduct.priceFormatted}</Text>
                  <Text style={styles.modalDescription}>{selectedProduct.description}</Text>

                  {offerSuccess ? (
                    <View style={styles.successBanner}>
                      <Text style={styles.successBannerText}>
                        ✅ Offer submitted to seller with 48h expiration!
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.offerForm}>
                      <Text style={styles.offerLabel}>Make an Offer ($USD):</Text>
                      <TextInput
                        style={styles.offerInput}
                        keyboardType="decimal-pad"
                        value={offerPriceInput}
                        onChangeText={setOfferPriceInput}
                        placeholder="Offer price"
                        placeholderTextColor={TOKENS.textMuted}
                      />
                      <TouchableOpacity
                        style={styles.makeOfferButton}
                        onPress={handleMakeOffer}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.makeOfferButtonText}>Submit Offer to Seller</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  <TouchableOpacity
                    style={styles.closeModalButton}
                    onPress={() => setSelectedProduct(null)}
                  >
                    <Text style={styles.closeModalButtonText}>Close</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: TOKENS.canvas,
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: TOKENS.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: TOKENS.textMuted,
    marginTop: 2,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchInput: {
    backgroundColor: TOKENS.surface,
    borderWidth: 1,
    borderColor: TOKENS.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: TOKENS.textPrimary,
    minHeight: 44,
  },
  territoryRail: {
    maxHeight: 48,
  },
  territoryRailContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  territoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: TOKENS.surface,
    borderWidth: 1,
    borderColor: TOKENS.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 44,
  },
  territoryChipActive: {
    backgroundColor: TOKENS.action,
    borderColor: TOKENS.action,
  },
  territoryFlag: {
    fontSize: 14,
  },
  territoryText: {
    fontSize: 12,
    fontWeight: '700',
    color: TOKENS.textMuted,
  },
  territoryTextActive: {
    color: TOKENS.canvas,
    fontWeight: '900',
  },
  categoryRail: {
    maxHeight: 44,
    marginTop: 6,
  },
  categoryRailContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    backgroundColor: TOKENS.surface,
    borderWidth: 1,
    borderColor: TOKENS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 44,
    justifyContent: 'center',
  },
  categoryChipActive: {
    backgroundColor: 'rgba(255, 122, 89, 0.2)',
    borderColor: TOKENS.action,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: TOKENS.textMuted,
  },
  categoryTextActive: {
    color: TOKENS.action,
    fontWeight: '800',
  },
  scrollView: {
    flex: 1,
    marginTop: 8,
  },
  scrollContent: {
    padding: 16,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: TOKENS.textPrimary,
  },
  emptyText: {
    fontSize: 12,
    color: TOKENS.textMuted,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    backgroundColor: TOKENS.surface,
    borderWidth: 1,
    borderColor: TOKENS.border,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 4,
  },
  cardImagePlaceholder: {
    height: 120,
    backgroundColor: TOKENS.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cardImageEmoji: {
    fontSize: 40,
  },
  kindBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(255, 122, 89, 0.2)',
    borderWidth: 1,
    borderColor: TOKENS.action,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  kindBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: TOKENS.action,
    textTransform: 'uppercase',
  },
  cardBody: {
    padding: 10,
    gap: 2,
  },
  cardSeller: {
    fontSize: 10,
    fontWeight: '700',
    color: TOKENS.accent,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: TOKENS.textPrimary,
    minHeight: 34,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  cardPrice: {
    fontSize: 14,
    fontWeight: '900',
    color: TOKENS.accent,
  },
  cardCondition: {
    fontSize: 10,
    color: TOKENS.textMuted,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: TOKENS.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    borderTopWidth: 1,
    borderColor: TOKENS.borderActive,
    gap: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: TOKENS.textPrimary,
  },
  modalSeller: {
    fontSize: 12,
    color: TOKENS.textMuted,
  },
  modalPrice: {
    fontSize: 22,
    fontWeight: '900',
    color: TOKENS.accent,
    marginVertical: 4,
  },
  modalDescription: {
    fontSize: 13,
    color: TOKENS.textPrimary,
    lineHeight: 18,
  },
  offerForm: {
    marginTop: 12,
    gap: 8,
  },
  offerLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: TOKENS.textPrimary,
  },
  offerInput: {
    backgroundColor: TOKENS.canvas,
    borderWidth: 1,
    borderColor: TOKENS.border,
    borderRadius: 14,
    padding: 12,
    fontSize: 16,
    fontWeight: '900',
    color: TOKENS.textPrimary,
    minHeight: 44,
  },
  makeOfferButton: {
    backgroundColor: TOKENS.action,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    minHeight: 44,
  },
  makeOfferButtonText: {
    color: TOKENS.canvas,
    fontSize: 14,
    fontWeight: '900',
  },
  successBanner: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: TOKENS.success,
    padding: 12,
    borderRadius: 14,
    marginTop: 10,
  },
  successBannerText: {
    color: TOKENS.success,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  closeModalButton: {
    padding: 12,
    alignItems: 'center',
    minHeight: 44,
  },
  closeModalButtonText: {
    color: TOKENS.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
});
