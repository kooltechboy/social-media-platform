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
  Image,
  ActivityIndicator,
  Alert,
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
  imageUrl?: string | null;
  categoryTitle?: string | null;
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
  { code: 'BHS', flag: '🇧🇸', name: 'Bahamas' },
  { code: 'GUY', flag: '🇬🇾', name: 'Guyana' },
];

export function MarketplaceScreen({ navigation }: any) {
  const [products, setProducts] = useState<MobileProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeTerritory, setActiveTerritory] = useState('ALL');
  const [selectedProduct, setSelectedProduct] = useState<MobileProduct | null>(null);
  const [offerPriceInput, setOfferPriceInput] = useState('');
  const [offerSubmitting, setOfferSubmitting] = useState(false);
  const [offerSuccessMsg, setOfferSuccessMsg] = useState<string | null>(null);
  const [connectingSeller, setConnectingSeller] = useState(false);

  const fetchProducts = async () => {
    try {
      let query = supabase
        .from('products')
        .select(`
          id, title, description, price_minor, currency, product_kind,
          condition, location_city, location_country_iso, inventory_count, seller_id, media_urls,
          marketplace_categories(title, slug),
          profiles(display_name, username),
          businesses(name)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(40);

      if (searchQuery.trim()) {
        query = query.ilike('title', `%${searchQuery.trim()}%`);
      }

      if (activeTerritory !== 'ALL') {
        query = query.eq('location_country_iso', activeTerritory);
      }

      if (activeCategory !== 'All') {
        if (activeCategory === 'Digital') {
          query = query.eq('product_kind', 'digital');
        } else if (activeCategory === 'Services') {
          query = query.eq('product_kind', 'service');
        } else if (activeCategory === 'Food & Spices') {
          query = query.or('title.ilike.%coffee%,title.ilike.%spice%,title.ilike.%sauce%,title.ilike.%food%');
        } else if (activeCategory === 'Carnival & Mas') {
          query = query.or('title.ilike.%carnival%,title.ilike.%mas%,title.ilike.%costume%');
        } else if (activeCategory === 'Art & Decor') {
          query = query.or('title.ilike.%art%,title.ilike.%craft%,title.ilike.%decor%,title.ilike.%painting%');
        } else if (activeCategory === 'Fashion') {
          query = query.or('title.ilike.%wear%,title.ilike.%fashion%,title.ilike.%shirt%,title.ilike.%dress%');
        } else if (activeCategory === 'Tech') {
          query = query.or('title.ilike.%phone%,title.ilike.%laptop%,title.ilike.%audio%,title.ilike.%tech%');
        }
      }

      const { data, error } = await query;
      if (data && !error) {
        const mapped: MobileProduct[] = data.map((item: any) => {
          const media = item.media_urls;
          const firstImage = Array.isArray(media) && media.length > 0 ? media[0] : null;

          return {
            id: item.id,
            title: item.title,
            description: item.description || 'Authentic Caribbean listing with buyer protection.',
            priceMinor: item.price_minor,
            priceFormatted: `$${(item.price_minor / 100).toFixed(2)} ${item.currency || 'USD'}`,
            currency: item.currency || 'USD',
            productKind: item.product_kind || 'physical',
            condition: (item.condition || 'new').replace('_', ' '),
            sellerName: item.businesses?.name || item.profiles?.display_name || item.profiles?.username || 'Merchant',
            sellerId: item.seller_id,
            location: [item.location_city, item.location_country_iso].filter(Boolean).join(', ') || 'Caribbean',
            inventoryCount: item.inventory_count,
            imageUrl: firstImage,
            categoryTitle: item.marketplace_categories?.title,
          };
        });
        setProducts(mapped);
      }
    } catch (err) {
      console.warn('Could not fetch marketplace products', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [activeTerritory, activeCategory, searchQuery]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProducts();
  };

  const handleMakeOffer = async () => {
    if (!offerPriceInput || !selectedProduct) return;
    const numPrice = parseFloat(offerPriceInput);
    if (isNaN(numPrice) || numPrice <= 0) {
      Alert.alert('Invalid Price', 'Please enter a valid offer amount.');
      return;
    }

    setOfferSubmitting(true);
    try {
      const priceMinor = Math.round(numPrice * 100);
      const { data, error } = await supabase.rpc('submit_marketplace_offer', {
        p_product_id: selectedProduct.id,
        p_offered_price_minor: priceMinor,
        p_quantity: 1,
        p_message: 'Offer submitted via TUKUBI mobile app.',
      });

      if (error) {
        // If RPC throws authentication error
        if (error.message.includes('Authentication required')) {
          Alert.alert('Sign In Required', 'Please sign in to make an offer to the seller.');
        } else {
          Alert.alert('Offer Notice', error.message);
        }
      } else {
        setOfferSuccessMsg('Offer submitted! Seller has 48 hours to review.');
        setTimeout(() => {
          setOfferSuccessMsg(null);
          setSelectedProduct(null);
          setOfferPriceInput('');
        }, 2200);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not submit offer.');
    } finally {
      setOfferSubmitting(false);
    }
  };

  const handleContactSeller = async () => {
    if (!selectedProduct?.sellerId) return;
    setConnectingSeller(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Sign In Required', 'Please sign in to message this merchant.');
        setConnectingSeller(false);
        return;
      }

      if (user.id === selectedProduct.sellerId) {
        Alert.alert('Seller Notice', 'This is your own listing.');
        setConnectingSeller(false);
        return;
      }

      const { data: convId, error } = await supabase.rpc('get_or_create_direct_conversation', {
        target_user_id: selectedProduct.sellerId,
      });

      if (error) {
        Alert.alert('Message Error', error.message);
      } else {
        setSelectedProduct(null);
        if (navigation) {
          navigation.navigate('Messages', {
            conversationId: convId,
            targetName: selectedProduct.sellerName,
          });
        }
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not initiate conversation with seller.');
    } finally {
      setConnectingSeller(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header with Sell Button */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Caribbean Marketplace</Text>
            <Text style={styles.headerSubtitle}>
              Verified island crafts, spices, mas, and digital assets with buyer protection.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.sellBtn}
            onPress={() => navigation && navigation.navigate('SellProduct')}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Sell an item on Caribbean Marketplace"
          >
            <Text style={styles.sellBtnText}>+ Sell Item</Text>
          </TouchableOpacity>
        </View>

        {/* Search Input */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search goods (e.g. coffee, mas, art, phone)..."
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
        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={TOKENS.action} />
          </View>
        ) : (
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
                  No items match this filter. Be the first to list authentic goods from this territory!
                </Text>
                <TouchableOpacity
                  style={styles.emptySellBtn}
                  onPress={() => navigation && navigation.navigate('SellProduct')}
                >
                  <Text style={styles.emptySellBtnText}>+ List First Product</Text>
                </TouchableOpacity>
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
                    {/* Real Product Image or Styled Badge */}
                    <View style={styles.cardImageContainer}>
                      {item.imageUrl ? (
                        <Image
                          source={{ uri: item.imageUrl }}
                          style={styles.cardImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.cardImagePlaceholder}>
                          <Text style={styles.cardImageEmoji}>
                            {item.productKind === 'service' ? '🤝' : item.productKind === 'digital' ? '🎧' : '📦'}
                          </Text>
                        </View>
                      )}
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
        )}

        {/* Product Detail & Real Offer Modal */}
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
                  {selectedProduct.imageUrl && (
                    <Image
                      source={{ uri: selectedProduct.imageUrl }}
                      style={styles.modalHeroImage}
                      resizeMode="cover"
                    />
                  )}

                  <Text style={styles.modalTitle}>{selectedProduct.title}</Text>
                  <Text style={styles.modalSeller}>
                    Sold by {selectedProduct.sellerName} • {selectedProduct.location}
                  </Text>
                  <Text style={styles.modalPrice}>{selectedProduct.priceFormatted}</Text>
                  <Text style={styles.modalDescription}>{selectedProduct.description}</Text>

                  {/* Actions Row: Message Seller & Make Offer */}
                  <View style={styles.modalActionButtons}>
                    <TouchableOpacity
                      style={[styles.messageSellerBtn, connectingSeller && { opacity: 0.6 }]}
                      onPress={handleContactSeller}
                      disabled={connectingSeller}
                      activeOpacity={0.8}
                    >
                      {connectingSeller ? (
                        <ActivityIndicator size="small" color="#FFF" />
                      ) : (
                        <Text style={styles.messageSellerBtnText}>💬 Message Seller</Text>
                      )}
                    </TouchableOpacity>
                  </View>

                  {offerSuccessMsg ? (
                    <View style={styles.successBanner}>
                      <Text style={styles.successBannerText}>
                        ✅ {offerSuccessMsg}
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
                        style={[styles.makeOfferButton, offerSubmitting && { opacity: 0.6 }]}
                        onPress={handleMakeOffer}
                        disabled={offerSubmitting}
                        activeOpacity={0.8}
                      >
                        {offerSubmitting ? (
                          <ActivityIndicator size="small" color="#090D1A" />
                        ) : (
                          <Text style={styles.makeOfferButtonText}>Submit Offer via Escrow</Text>
                        )}
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
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: TOKENS.textPrimary,
  },
  headerSubtitle: {
    fontSize: 11,
    color: TOKENS.textMuted,
    marginTop: 2,
    lineHeight: 15,
  },
  sellBtn: {
    backgroundColor: TOKENS.action,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    marginLeft: 8,
  },
  sellBtnText: {
    color: '#090D1A',
    fontSize: 12,
    fontWeight: '900',
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
    paddingVertical: 10,
    fontSize: 14,
    color: TOKENS.textPrimary,
    minHeight: 44,
  },
  territoryRail: {
    maxHeight: 46,
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
    paddingVertical: 6,
    minHeight: 38,
  },
  territoryChipActive: {
    backgroundColor: TOKENS.action,
    borderColor: TOKENS.action,
  },
  territoryFlag: {
    fontSize: 13,
  },
  territoryText: {
    fontSize: 11,
    fontWeight: '700',
    color: TOKENS.textMuted,
  },
  territoryTextActive: {
    color: '#090D1A',
    fontWeight: '900',
  },
  categoryRail: {
    maxHeight: 44,
    marginTop: 4,
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
    minHeight: 38,
    justifyContent: 'center',
  },
  categoryChipActive: {
    backgroundColor: 'rgba(255, 122, 89, 0.2)',
    borderColor: TOKENS.action,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700',
    color: TOKENS.textMuted,
  },
  categoryTextActive: {
    color: TOKENS.action,
    fontWeight: '900',
  },
  scrollView: {
    flex: 1,
    marginTop: 6,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
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
  emptySellBtn: {
    marginTop: 16,
    backgroundColor: TOKENS.action,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
  },
  emptySellBtnText: {
    color: '#090D1A',
    fontSize: 13,
    fontWeight: '900',
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
    marginBottom: 6,
  },
  cardImageContainer: {
    height: 120,
    backgroundColor: TOKENS.canvas,
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardImagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImageEmoji: {
    fontSize: 40,
  },
  kindBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(9, 6, 15, 0.75)',
    borderWidth: 1,
    borderColor: TOKENS.action,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  kindBadgeText: {
    fontSize: 9,
    fontWeight: '900',
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
    color: TOKENS.sea,
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
    textTransform: 'capitalize',
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
    padding: 22,
    borderTopWidth: 1,
    borderColor: TOKENS.borderActive,
    gap: 8,
    maxHeight: '90%',
  },
  modalHeroImage: {
    width: '100%',
    height: 160,
    borderRadius: 16,
    marginBottom: 8,
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
  modalActionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  messageSellerBtn: {
    flex: 1,
    backgroundColor: TOKENS.raised,
    borderWidth: 1,
    borderColor: TOKENS.sea,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  messageSellerBtnText: {
    color: TOKENS.sea,
    fontSize: 13,
    fontWeight: '900',
  },
  offerForm: {
    marginTop: 8,
    gap: 8,
  },
  offerLabel: {
    fontSize: 12,
    fontWeight: '800',
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
    color: '#090D1A',
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
    padding: 10,
    alignItems: 'center',
  },
  closeModalButtonText: {
    color: TOKENS.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
});
