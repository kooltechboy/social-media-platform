import React from 'react';
import {
  ShoppingBag,
  Star,
  Plus,
  ShieldCheck,
  Sparkles,
  Truck,
  CheckCircle,
  Search,
  SlidersHorizontal,
  Store,
  Compass,
  MapPin,
  Heart,
  Tag,
  ArrowRight,
  Filter,
} from 'lucide-react';
import Link from 'next/link';
import { createSupabaseServerClient, getCurrentUser } from '../../lib/supabase/server';
import { Money, getMarketplaceLaunchMessaging } from '@caribbean/payments';
import {
  CANONICAL_CARIBBEAN_CATEGORIES,
  PRODUCT_CONDITION_METADATA,
  type ProductCondition,
} from '@caribbean/marketplace';
import OrderButton from '../../components/order-button';
import WishlistButton from '../../components/marketplace/wishlist-button';
import AiShoppingAssistant from '../../components/marketplace/ai-shopping-assistant';

export const dynamic = 'force-dynamic';

interface ProductRecord {
  id: string;
  title: string;
  description: string | null;
  product_kind: 'physical' | 'digital' | 'service';
  price_minor: number;
  currency: string;
  inventory_count: number | null;
  is_active: boolean;
  seller_id: string;
  condition?: ProductCondition;
  location_city?: string | null;
  location_country_iso?: string | null;
  pickup_available?: boolean;
  shipping_available?: boolean;
  delivery_available?: boolean;
  profiles: { display_name: string; username: string } | null;
  businesses: { name: string; slug?: string; is_verified?: boolean } | null;
  marketplace_product_media?: Array<{ media_url: string; media_type: string; thumbnail_url?: string }> | null;
}

const CARIBBEAN_ISLAND_TERRITORIES = [
  { code: 'ALL', name: 'All Territories', flag: '🌴' },
  { code: 'JAM', name: 'Jamaica', flag: '🇯🇲' },
  { code: 'DOM', name: 'Dominican Republic', flag: '🇩🇴' },
  { code: 'TTO', name: 'Trinidad & Tobago', flag: '🇹🇹' },
  { code: 'HTI', name: 'Haiti', flag: '🇭🇹' },
  { code: 'BRB', name: 'Barbados', flag: '🇧🇧' },
  { code: 'BHS', name: 'Bahamas', flag: '🇧🇸' },
  { code: 'GUY', name: 'Guyana', flag: '🇬🇾' },
  { code: 'PRI', name: 'Puerto Rico', flag: '🇵🇷' },
  { code: 'USA', name: 'Diaspora (US/NY/FL)', flag: '🗽' },
  { code: 'CAN', name: 'Diaspora (Canada)', flag: '🍁' },
  { code: 'GBR', name: 'Diaspora (UK/London)', flag: '🇬🇧' },
];

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams?: Promise<{
    category?: string;
    q?: string;
    kind?: string;
    territory?: string;
    condition?: string;
    sort?: string;
    pickup?: string;
    shipping?: string;
  }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const activeCategorySlug = resolvedParams.category || 'all';
  const queryText = resolvedParams.q || '';
  const filterKind = resolvedParams.kind || 'all';
  const selectedTerritory = resolvedParams.territory || 'ALL';
  const selectedCondition = resolvedParams.condition || 'all';
  const sortOption = resolvedParams.sort || 'newest';
  const pickupOnly = resolvedParams.pickup === 'true';
  const shippingOnly = resolvedParams.shipping === 'true';

  const [user, supabase] = await Promise.all([getCurrentUser(), createSupabaseServerClient()]);

  let products: ProductRecord[] = [];
  let userWishlistProductIds = new Set<string>();

  if (supabase) {
    // 1. Query Products with Media & Profiles
    let query = supabase
      .from('products')
      .select(`
        id, title, description, product_kind, price_minor, currency, inventory_count, is_active, seller_id,
        condition, location_city, location_country_iso, pickup_available, shipping_available, delivery_available,
        profiles(display_name, username),
        businesses(name, slug, is_verified),
        marketplace_product_media(media_url, media_type, thumbnail_url)
      `)
      .eq('is_active', true);

    // Text search filter
    if (queryText) {
      query = query.or(`title.ilike.%${queryText}%,description.ilike.%${queryText}%`);
    }

    // Product kind filter
    if (filterKind !== 'all') {
      query = query.eq('product_kind', filterKind);
    }

    // Territory filter
    if (selectedTerritory !== 'ALL') {
      query = query.eq('location_country_iso', selectedTerritory);
    }

    // Condition filter
    if (selectedCondition !== 'all') {
      query = query.eq('condition', selectedCondition);
    }

    // Pickup & Shipping filters
    if (pickupOnly) {
      query = query.eq('pickup_available', true);
    }
    if (shippingOnly) {
      query = query.eq('shipping_available', true);
    }

    // Category filter matching
    if (activeCategorySlug !== 'all') {
      const cat = CANONICAL_CARIBBEAN_CATEGORIES.find((c) => c.slug === activeCategorySlug);
      if (cat && cat.culturalTags && cat.culturalTags.length > 0) {
        const tagMatchers = cat.culturalTags.map((t) => `title.ilike.%${t}%,description.ilike.%${t}%`).join(',');
        query = query.or(tagMatchers);
      }
    }

    // Sorting
    if (sortOption === 'price_asc') {
      query = query.order('price_minor', { ascending: true });
    } else if (sortOption === 'price_desc') {
      query = query.order('price_minor', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    query = query.limit(32);

    const { data } = await query;
    if (data && data.length > 0) {
      products = data as unknown as ProductRecord[];
    }

    // 2. Fetch User Wishlist IDs if logged in
    if (user) {
      const { data: wishlistData } = await supabase
        .from('marketplace_wishlists')
        .select('product_id')
        .eq('user_id', user.id);
      if (wishlistData) {
        userWishlistProductIds = new Set(wishlistData.map((w) => w.product_id));
      }
    }
  }

  const launchMessaging = getMarketplaceLaunchMessaging();

  return (
    <div className="w-full space-y-8 animate-fadeIn">
      {/* Top Header Banner */}
      <div className="surface-header rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-orange-500/30 shadow-xl relative overflow-hidden">
        <div className="space-y-1 max-w-2xl">
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-orange-500 animate-ping" />
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white flex items-center gap-3">
              <ShoppingBag className="w-7 h-7 sm:w-8 sm:h-8 text-orange-400" /> TUKUBI Caribbean Marketplace
            </h1>
          </div>
          <p className="text-xs sm:text-sm md:text-base text-brand-sandstone/80 leading-relaxed font-medium">
            Discover verified authentic island crafts, coffee, carnival apparel, electronics, and digital creator goods — backed by 30-day double-entry escrow buyer protection.
          </p>
        </div>

        {/* Action Buttons & AI Assistant Trigger */}
        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
          <AiShoppingAssistant />

          {user ? (
            <>
              <Link
                href="/marketplace/seller-center"
                className="bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold px-4 py-2.5 rounded-xl text-xs md:text-sm flex items-center justify-center gap-2 transition-all min-h-[42px]"
              >
                <Store className="w-4 h-4 text-brand-goldenHour" /> Seller Center
              </Link>
              <Link
                href="/marketplace/offers"
                className="bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold px-4 py-2.5 rounded-xl text-xs md:text-sm flex items-center justify-center gap-2 transition-all min-h-[42px]"
              >
                <Tag className="w-4 h-4 text-orange-400" /> Offers
              </Link>
              <Link
                href="/marketplace/wishlist"
                className="bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold px-3 py-2.5 rounded-xl text-xs md:text-sm flex items-center justify-center gap-1.5 transition-all min-h-[42px]"
                title="Saved Items"
              >
                <Heart className="w-4 h-4 text-rose-400 fill-rose-400/30" />
              </Link>
              <Link
                href="/marketplace/seller-center/create"
                className="bg-orange-500 hover:bg-orange-400 text-slate-950 font-black px-5 py-2.5 rounded-xl text-xs md:text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-orange-500/20 min-h-[42px]"
              >
                <Plus className="w-4 h-4 stroke-[3]" /> Create Listing
              </Link>
            </>
          ) : (
            <Link
              href="/login?next=/marketplace"
              className="bg-orange-500 hover:bg-orange-400 text-slate-950 font-black px-5 py-2.5 rounded-xl text-xs md:text-sm flex items-center justify-center gap-2 transition-all shadow-md min-h-[42px]"
            >
              Sign in to Sell or Buy
            </Link>
          )}
        </div>
      </div>

      {/* Caribbean Island / Territory Rail */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-brand-sandstone/70">
          <span className="flex items-center gap-1.5 uppercase tracking-wider">
            <MapPin className="w-3.5 h-3.5 text-orange-400" /> Shop by Territory &amp; Diaspora
          </span>
          <Link href="/map" className="text-orange-400 hover:underline">
            View Caribbean Map →
          </Link>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CARIBBEAN_ISLAND_TERRITORIES.map((t) => {
            const isSelected = selectedTerritory === t.code;
            return (
              <Link
                key={t.code}
                href={`/marketplace?territory=${t.code}${queryText ? `&q=${encodeURIComponent(queryText)}` : ''}${activeCategorySlug !== 'all' ? `&category=${activeCategorySlug}` : ''}`}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 border min-h-[38px] ${
                  isSelected
                    ? 'bg-orange-500 text-slate-950 border-orange-500 shadow-md shadow-orange-500/20 font-black'
                    : 'bg-white/5 text-brand-sandstone/80 hover:text-white hover:bg-white/10 border-white/10'
                }`}
              >
                <span>{t.flag}</span>
                <span>{t.name}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Search & Faceted Filter Bar */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <form className="relative flex-1 max-w-xl">
            <Search className="w-4 h-4 md:w-5 md:h-5 text-brand-caribbeanSea absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              name="q"
              defaultValue={queryText}
              placeholder="Search Caribbean goods (e.g. Blue Mountain coffee, carnival mas, phones)..."
              className="w-full bg-slate-950/80 border border-white/20 rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-brand-sandstone/50 focus:outline-none focus:border-orange-500 min-h-[44px]"
            />
          </form>

          {/* Sort & Kind Selectors */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
            <Link
              href={`/marketplace?kind=all${queryText ? `&q=${encodeURIComponent(queryText)}` : ''}${selectedTerritory !== 'ALL' ? `&territory=${selectedTerritory}` : ''}`}
              className={`px-3 py-2 rounded-xl font-bold transition-colors whitespace-nowrap ${
                filterKind === 'all'
                  ? 'bg-orange-500/20 text-orange-300 border border-orange-500/50'
                  : 'bg-white/5 text-brand-sandstone/80 hover:text-white border border-white/10'
              }`}
            >
              All Types
            </Link>
            <Link
              href={`/marketplace?kind=physical${queryText ? `&q=${encodeURIComponent(queryText)}` : ''}${selectedTerritory !== 'ALL' ? `&territory=${selectedTerritory}` : ''}`}
              className={`px-3 py-2 rounded-xl font-bold transition-colors whitespace-nowrap ${
                filterKind === 'physical'
                  ? 'bg-orange-500/20 text-orange-300 border border-orange-500/50'
                  : 'bg-white/5 text-brand-sandstone/80 hover:text-white border border-white/10'
              }`}
            >
              Physical
            </Link>
            <Link
              href={`/marketplace?kind=digital${queryText ? `&q=${encodeURIComponent(queryText)}` : ''}${selectedTerritory !== 'ALL' ? `&territory=${selectedTerritory}` : ''}`}
              className={`px-3 py-2 rounded-xl font-bold transition-colors whitespace-nowrap ${
                filterKind === 'digital'
                  ? 'bg-orange-500/20 text-orange-300 border border-orange-500/50'
                  : 'bg-white/5 text-brand-sandstone/80 hover:text-white border border-white/10'
              }`}
            >
              Digital Stems
            </Link>
            <Link
              href={`/marketplace?kind=service${queryText ? `&q=${encodeURIComponent(queryText)}` : ''}${selectedTerritory !== 'ALL' ? `&territory=${selectedTerritory}` : ''}`}
              className={`px-3 py-2 rounded-xl font-bold transition-colors whitespace-nowrap ${
                filterKind === 'service'
                  ? 'bg-orange-500/20 text-orange-300 border border-orange-500/50'
                  : 'bg-white/5 text-brand-sandstone/80 hover:text-white border border-white/10'
              }`}
            >
              Services
            </Link>
          </div>
        </div>

        {/* Categories Tab Rail */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <Link
            href="/marketplace"
            className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border min-h-[38px] flex items-center ${
              activeCategorySlug === 'all'
                ? 'bg-orange-500 text-slate-950 border-orange-500 shadow-md shadow-orange-500/20 font-black'
                : 'bg-white/5 text-brand-sandstone/80 hover:text-white hover:bg-white/10 border-white/10'
            }`}
          >
            All Island Goods
          </Link>
          {CANONICAL_CARIBBEAN_CATEGORIES.map((c) => {
            const isActive = activeCategorySlug === c.slug;
            return (
              <Link
                key={c.slug}
                href={`/marketplace?category=${c.slug}${queryText ? `&q=${encodeURIComponent(queryText)}` : ''}`}
                className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border min-h-[38px] flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-orange-500 text-slate-950 border-orange-500 shadow-md shadow-orange-500/20 font-black'
                    : 'bg-white/5 text-brand-sandstone/80 hover:text-white hover:bg-white/10 border-white/10'
                }`}
              >
                <span>{c.title}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Trust & Escrow Guarantee Box */}
      <div className="surface-card border border-white/10 rounded-3xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg text-xs md:text-sm">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-brand-sunriseCoral shrink-0" />
          <p className="text-brand-sandstone/90 leading-relaxed">
            <strong className="text-white font-bold">TUKUBI Buyer &amp; Seller Protection:</strong> Every purchase is backed by automated dispute settlement and escrow resolution via authorized Caribbean and international payment processors.
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs text-brand-sandstone/70 shrink-0">
          <span className="flex items-center gap-1.5">
            <Truck className="w-4 h-4 text-brand-caribbeanSea" /> Inter-Island Logistics
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-brand-sunriseCoral" /> Verified Sellers
          </span>
        </div>
      </div>

      {/* Products Catalog Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg md:text-xl font-black text-white flex items-center gap-2">
            <Compass className="w-4 h-4 md:w-5 md:h-5 text-orange-400" />
            <span>
              {activeCategorySlug !== 'all'
                ? CANONICAL_CARIBBEAN_CATEGORIES.find((c) => c.slug === activeCategorySlug)?.title || 'Category'
                : 'All Caribbean Listings'}
            </span>
            <span className="text-xs font-normal text-brand-sandstone/60">
              ({products.length} {products.length === 1 ? 'item' : 'items'})
            </span>
          </h2>
        </div>

        {products.length === 0 ? (
          <div className="surface-card rounded-3xl p-12 text-center space-y-3 border border-white/10 max-w-md mx-auto">
            <ShoppingBag className="w-12 h-12 text-white/30 mx-auto" />
            <h3 className="text-base md:text-lg font-black text-white">No products found</h3>
            <p className="text-xs text-brand-sandstone/70 max-w-sm mx-auto leading-relaxed">
              No Caribbean merchandise matches your current filter criteria. Try adjusting your search keywords or clearing filters.
            </p>
            <Link
              href="/marketplace"
              className="inline-block px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-black text-xs transition-all shadow-md"
            >
              Reset All Filters
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 3xl:grid-cols-5 4xl:grid-cols-6 gap-5">
            {products.map((p) => {
              const price = new Money(p.price_minor, p.currency);
              const sellerName = p.businesses?.name || p.profiles?.display_name || 'Caribbean Merchant';
              const sellerSlug = p.businesses?.slug || p.profiles?.username;
              const primaryMedia = p.marketplace_product_media?.[0]?.media_url;
              const cond = p.condition ? PRODUCT_CONDITION_METADATA[p.condition] : null;

              return (
                <div
                  key={p.id}
                  className="surface-card surface-card-interactive border border-white/10 rounded-3xl p-4 sm:p-5 flex flex-col justify-between transition-all group shadow-lg"
                >
                  <div className="space-y-3">
                    {/* Media Image or Fallback */}
                    <div className="aspect-square bg-slate-950 border border-white/10 rounded-2xl relative overflow-hidden flex items-center justify-center group-hover:scale-[1.02] transition-transform">
                      {primaryMedia ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={primaryMedia}
                          alt={p.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-5xl select-none">
                          {p.product_kind === 'service' ? '🤝' : p.product_kind === 'digital' ? '🎧' : '📦'}
                        </span>
                      )}

                      {/* Overlaid Badges */}
                      <span
                        className={`absolute top-2.5 left-2.5 text-[10px] font-black px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                          p.product_kind === 'physical'
                            ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                            : p.product_kind === 'digital'
                            ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                            : 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                        }`}
                      >
                        {p.product_kind}
                      </span>

                      {/* Wishlist Heart Toggle */}
                      <div className="absolute top-2.5 right-2.5">
                        <WishlistButton
                          productId={p.id}
                          initialSaved={userWishlistProductIds.has(p.id)}
                          size="sm"
                        />
                      </div>

                      {/* Location Badge */}
                      {p.location_city && (
                        <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-lg text-[10px] text-white">
                          <MapPin className="w-3 h-3 text-orange-400" />
                          <span>{p.location_city}</span>
                        </div>
                      )}
                    </div>

                    {/* Listing Info */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        {sellerSlug ? (
                          <Link
                            href={`/store/${sellerSlug}`}
                            className="font-black text-orange-400 hover:underline truncate max-w-[70%]"
                          >
                            {sellerName}
                          </Link>
                        ) : (
                          <span className="font-bold text-brand-sandstone/70 truncate">{sellerName}</span>
                        )}
                        {cond && (
                          <span className="text-[10px] text-brand-sandstone/60 truncate font-semibold">
                            {cond.label}
                          </span>
                        )}
                      </div>

                      <Link
                        href={`/marketplace/${p.id}`}
                        className="font-black text-sm sm:text-base text-white hover:text-orange-400 line-clamp-1 transition-colors block"
                      >
                        {p.title}
                      </Link>

                      <p className="text-xs text-brand-sandstone/80 line-clamp-2 min-h-[32px] leading-relaxed">
                        {p.description || 'Authentic Caribbean offering with guaranteed buyer protection.'}
                      </p>
                    </div>

                    {/* Price & Stock */}
                    <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                      <span className="text-lg font-black text-brand-goldenHour">{price.format()}</span>
                      {p.inventory_count !== null && (
                        <span className="text-[11px] text-brand-sandstone/60">
                          {p.inventory_count > 0 ? `${p.inventory_count} in stock` : 'Sold out'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="pt-3 space-y-2">
                    <OrderButton
                      productId={p.id}
                      isAuthenticated={!!user}
                      disabled={!user || p.inventory_count === 0}
                      isSeller={user?.id === p.seller_id}
                      productDetails={{
                        title: p.title,
                        priceMinor: p.price_minor,
                        currency: p.currency,
                        sellerName,
                        productKind: p.product_kind,
                      }}
                    />
                    <Link
                      href={`/marketplace/${p.id}`}
                      className="w-full py-2 px-3 rounded-xl border border-white/15 hover:bg-white/5 text-brand-sandstone hover:text-white text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                    >
                      <span>View Listing &amp; Offers</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
