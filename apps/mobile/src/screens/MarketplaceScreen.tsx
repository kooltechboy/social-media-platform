import React, { useState, useEffect, useCallback } from 'react';
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
import { Ionicons as ExpoIonicons } from '@expo/vector-icons';
import { TOKENS } from '../theme/tokens';
import { supabase } from '../lib/supabase';

const Ionicons = ExpoIonicons as unknown as React.ComponentType<any>;

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

const TERRITORIES: Array<{ code: string; flag?: string; name: string }> = [
  { code: 'ALL', name: 'All' },
  { code: 'JAM', flag: '🇯🇲', name: 'Jamaica' },
  { code: 'DOM', flag: '🇩🇴', name: 'Dom. Rep.' },
  { code: 'TTO', flag: '🇹🇹', name: 'Trinidad' },
  { code: 'HTI', flag: '🇭🇹', name: 'Haiti' },
  { code: 'BRB', flag: '🇧🇧', name: 'Barbados' },
  { code: 'BHS', flag: '🇧🇸', name: 'Bahamas' },
  { code: 'GUY', flag: '🇬🇾', name: 'Guyana' },
];

function getProductKindIcon(kind: string): string {
  if (kind === 'service') return 'shield-checkmark-outline';
  if (kind === 'digital') return 'layers-outline';
  return 'cube-outline';
}

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

  const fetchProducts = useCallback(async () => {
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
            description: item.description || 'Authentic Caribbean listing with escrow buyer protection.',
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
  }, [activeTerritory, activeCategory, searchQuery]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

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
      const { error } = await supabase.rpc('submit_marketplace_offer', {
        p_product_id: selectedProduct.id,
        p_offered_price_minor: priceMinor,
        p_quantity: 1,
        p_message: 'Offer submitted via TUKUBI mobile app.',
      });

      if (error) {
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
        {/* Header with Sell Button & Escrow Trust Pill */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.headerTitleRow}>
              <Text style={styles.headerTitle}>Marketplace</Text>
              <View style={styles.escrowTrustPill}>
                <Ionicons name="shield-checkmark-outline" size={11} color={TOKENS.teal} />
                <Text style={styles.escrowTrustText}>ESCROW</Text>
              </View>
            </View>
            <Text style={styles.headerSubtitle}>
              Verified crafts, culinary goods &amp; digital assets with buyer protection.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.sellBtn}
            onPress={() => navigation && navigation.navigate('SellProduct')}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Sell an item on Caribbean Marketplace"
          >
            <Ionicons name="add" size={15} color={TOKENS.actionText} />
            <Text style={styles.sellBtnText}>Sell Item</Text>
          </TouchableOpacity>
        </View>

        {/* Search Input */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputWrap}>
            <Ionicons name="search-outline" size={17} color={TOKENS.textDim} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search goods (coffee, mas, art, audio)…"
              placeholderTextColor={TOKENS.textDim}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={16} color={TOKENS.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Territory Filter Rail */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.territoryRail}
          contentContainerStyle={styles.territoryRailContent}
        >
          {TERRITORIES.map((t) => {
            const active = activeTerritory === t.code;
            return (
              <TouchableOpacity
                key={t.code}
                onPress={() => setActiveTerritory(t.code)}
                style={[styles.territoryChip, active && styles.territoryChipActive]}
              >
                {t.flag ? (
                  <Text style={styles.territoryFlag}>{t.flag}</Text>
                ) : (
                  <Ionicons
                    name="earth-outline"
                    size={13}
                    color={active ? TOKENS.actionText : TOKENS.teal}
                  />
                )}
                <Text style={[styles.territoryText, active && styles.territoryTextActive]}>
                  {t.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Categories Rail */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryRail}
          contentContainerStyle={styles.categoryRailContent}
        >
          {CATEGORIES.map((c) => {
            const active = activeCategory === c;
            return (
              <TouchableOpacity
                key={c}
                onPress={() => setActiveCategory(c)}
                style={[styles.categoryChip, active && styles.categoryChipActive]}
              >
                <Text style={[styles.categoryText, active && styles.categoryTextActive]}>
                  {c}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Product Grid List */}
        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={TOKENS.teal} />
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={TOKENS.teal}
              />
            }
          >
            {products.length === 0 ? (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconBadge}>
                  <Ionicons name="bag-handle-outline" size={30} color={TOKENS.teal} />
                </View>
                <Text style={styles.emptyTitle}>No Products Found</Text>
                <Text style={styles.emptyText}>
                  No listings match this filter yet. Be the first merchant to list authentic goods for this category.
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
                      setOfferPriceInput(((item.priceMinor * 0.9) / 100).toFixed(2));
                    }}
                    activeOpacity={0.82}
                  >
                    {/* Product Image or Midnight Reef Icon Placeholder */}
                    <View style={styles.cardImageContainer}>
                      {item.imageUrl ? (
                        <Image
                          source={{ uri: item.imageUrl }}
                          style={styles.cardImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.cardImagePlaceholder}>
                          <Ionicons
                            name={getProductKindIcon(item.productKind)}
                            size={30}
                            color={TOKENS.teal}
                          />
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
                      <View style={styles.cardEscrowRow}>
                        <Ionicons name="shield-checkmark-outline" size={11} color={TOKENS.teal} />
                        <Text style={styles.cardEscrowText}>Protected</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>
        )}

        {/* Product Detail & Escrow Offer Modal */}
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
                  <View style={styles.modalTopRow}>
                    <View style={styles.escrowTrustPill}>
                      <Ionicons name="shield-checkmark-outline" size={12} color={TOKENS.teal} />
                      <Text style={styles.escrowTrustText}>ESCROW PROTECTED</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => setSelectedProduct(null)}
                      style={styles.modalCloseIconBtn}
                      accessibilityRole="button"
                      accessibilityLabel="Close product details"
                    >
                      <Ionicons name="close" size={18} color={TOKENS.textMuted} />
                    </TouchableOpacity>
                  </View>

                  {selectedProduct.imageUrl ? (
                    <Image
                      source={{ uri: selectedProduct.imageUrl }}
                      style={styles.modalHeroImage}
                      resizeMode="cover"
                    />
                  ) : null}

                  <Text style={styles.modalTitle}>{selectedProduct.title}</Text>
                  <Text style={styles.modalSeller}>
                    Sold by {selectedProduct.sellerName} • {selectedProduct.location}
                  </Text>
                  <Text style={styles.modalPrice}>{selectedProduct.priceFormatted}</Text>
                  <Text style={styles.modalDescription}>{selectedProduct.description}</Text>

                  {/* Actions Row: Message Seller */}
                  <View style={styles.modalActionButtons}>
                    <TouchableOpacity
                      style={[styles.messageSellerBtn, connectingSeller && { opacity: 0.6 }]}
                      onPress={handleContactSeller}
                      disabled={connectingSeller}
                      activeOpacity={0.82}
                    >
                      {connectingSeller ? (
                        <ActivityIndicator size="small" color={TOKENS.action} />
                      ) : (
                        <>
                          <Ionicons name="chatbubble-ellipses-outline" size={16} color={TOKENS.action} />
                          <Text style={styles.messageSellerBtnText}>Message Seller</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>

                  {offerSuccessMsg ? (
                    <View style={styles.successBanner}>
                      <Ionicons name="checkmark-circle" size={16} color={TOKENS.success} />
                      <Text style={styles.successBannerText}>{offerSuccessMsg}</Text>
                    </View>
                  ) : (
                    <View style={styles.offerForm}>
                      <Text style={styles.offerLabel}>Make an Offer (USD)</Text>
                      <TextInput
                        style={styles.offerInput}
                        keyboardType="decimal-pad"
                        value={offerPriceInput}
                        onChangeText={setOfferPriceInput}
                        placeholder="Offer price"
                        placeholderTextColor={TOKENS.textDim}
                      />
                      <TouchableOpacity
                        style={[styles.makeOfferButton, offerSubmitting && { opacity: 0.6 }]}
                        onPress={handleMakeOffer}
                        disabled={offerSubmitting}
                        activeOpacity={0.85}
                      >
                        {offerSubmitting ? (
                          <ActivityIndicator size="small" color={TOKENS.actionText} />
                        ) : (
                          <>
                            <Ionicons name="shield-checkmark-outline" size={16} color={TOKENS.actionText} />
                            <Text style={styles.makeOfferButtonText}>Submit Offer via Escrow</Text>
                          </>
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
    paddingBottom: 12,
    backgroundColor: TOKENS.surface,
    borderBottomWidth: 1,
    borderBottomColor: TOKENS.border,
  },
  headerLeft: {
    flex: 1,
    paddingRight: 10,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: TOKENS.textPrimary,
    letterSpacing: -0.3,
  },
  escrowTrustPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: TOKENS.tealSoft,
    borderWidth: 1,
    borderColor: TOKENS.borderActive,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
  },
  escrowTrustText: {
    fontSize: 9,
    fontWeight: '800',
    color: TOKENS.teal,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 11,
    color: TOKENS.textMuted,
    marginTop: 3,
    lineHeight: 15,
  },
  sellBtn: {
    backgroundColor: TOKENS.teal,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sellBtnText: {
    color: TOKENS.actionText,
    fontSize: 12,
    fontWeight: '800',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
  },
  searchInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: TOKENS.surface,
    borderWidth: 1,
    borderColor: TOKENS.borderStrong,
    borderRadius: 14,
    paddingHorizontal: 14,
    minHeight: 44,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 9,
    fontSize: 14,
    color: TOKENS.textPrimary,
  },
  territoryRail: {
    maxHeight: 46,
    marginTop: 2,
  },
  territoryRailContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  territoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: TOKENS.surface,
    borderWidth: 1,
    borderColor: TOKENS.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 38,
  },
  territoryChipActive: {
    backgroundColor: TOKENS.teal,
    borderColor: TOKENS.teal,
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
    color: TOKENS.actionText,
    fontWeight: '800',
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
    minHeight: 36,
    justifyContent: 'center',
  },
  categoryChipActive: {
    backgroundColor: TOKENS.tealSoft,
    borderColor: TOKENS.borderActive,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700',
    color: TOKENS.textMuted,
  },
  categoryTextActive: {
    color: TOKENS.teal,
    fontWeight: '800',
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
  emptyIconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: TOKENS.tealSoft,
    borderWidth: 1,
    borderColor: TOKENS.borderActive,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
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
    marginTop: 18,
    backgroundColor: TOKENS.teal,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 999,
  },
  emptySellBtnText: {
    color: TOKENS.actionText,
    fontSize: 13,
    fontWeight: '800',
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
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 6,
  },
  cardImageContainer: {
    height: 122,
    backgroundColor: TOKENS.oceanDepth,
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
    backgroundColor: TOKENS.oceanDepth,
  },
  kindBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: TOKENS.surface,
    borderWidth: 1,
    borderColor: TOKENS.borderActive,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  kindBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: TOKENS.teal,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  cardBody: {
    padding: 11,
    gap: 3,
  },
  cardSeller: {
    fontSize: 10,
    fontWeight: '700',
    color: TOKENS.action,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
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
    fontWeight: '800',
    color: TOKENS.teal,
  },
  cardCondition: {
    fontSize: 10,
    color: TOKENS.textMuted,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  cardEscrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  cardEscrowText: {
    fontSize: 10,
    color: TOKENS.textMuted,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: TOKENS.scrim,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: TOKENS.surface,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    padding: 22,
    borderTopWidth: 1,
    borderColor: TOKENS.borderActive,
    gap: 8,
    maxHeight: '90%',
  },
  modalTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  modalCloseIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: TOKENS.raised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalHeroImage: {
    width: '100%',
    height: 160,
    borderRadius: 16,
    marginBottom: 6,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: TOKENS.textPrimary,
  },
  modalSeller: {
    fontSize: 12,
    color: TOKENS.textMuted,
  },
  modalPrice: {
    fontSize: 22,
    fontWeight: '900',
    color: TOKENS.teal,
    marginVertical: 2,
  },
  modalDescription: {
    fontSize: 13,
    color: TOKENS.textSecondary,
    lineHeight: 19,
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
    borderColor: TOKENS.borderStrong,
    paddingVertical: 12,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  messageSellerBtnText: {
    color: TOKENS.action,
    fontSize: 13,
    fontWeight: '800',
  },
  offerForm: {
    marginTop: 8,
    gap: 8,
  },
  offerLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: TOKENS.textSecondary,
  },
  offerInput: {
    backgroundColor: TOKENS.raised,
    borderWidth: 1,
    borderColor: TOKENS.borderStrong,
    borderRadius: 14,
    padding: 12,
    fontSize: 16,
    fontWeight: '800',
    color: TOKENS.textPrimary,
    minHeight: 44,
  },
  makeOfferButton: {
    backgroundColor: TOKENS.teal,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    minHeight: 46,
  },
  makeOfferButtonText: {
    color: TOKENS.actionText,
    fontSize: 14,
    fontWeight: '800',
  },
  successBanner: {
    backgroundColor: TOKENS.tealSoft,
    borderWidth: 1,
    borderColor: TOKENS.borderActive,
    padding: 12,
    borderRadius: 14,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  successBannerText: {
    color: TOKENS.success,
    fontSize: 12,
    fontWeight: '800',
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
