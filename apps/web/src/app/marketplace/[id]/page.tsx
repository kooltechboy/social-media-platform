import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  ShieldCheck,
  Truck,
  CheckCircle,
  Star,
  MapPin,
  Store,
  Clock,
  MessageCircle,
  Heart,
  Package,
} from 'lucide-react';
import { Money } from '@caribbean/payments';
import {
  PRODUCT_CONDITION_METADATA,
  type ProductVariant,
  type ProductCondition,
} from '@caribbean/marketplace';
import { createSupabaseServerClient, getCurrentUser } from '../../../lib/supabase/server';
import ProductGallery from '../../../components/marketplace/product-gallery';
import ProductDetailActions from '../../../components/marketplace/product-detail-actions';
import WishlistButton from '../../../components/marketplace/wishlist-button';
import VariantSelector from '../../../components/marketplace/variant-selector';
import AiShoppingAssistant from '../../../components/marketplace/ai-shopping-assistant';
import { CustomsDutyEstimator } from '../../../components/marketplace/customs-duty-estimator';

export const dynamic = 'force-dynamic';

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [user, supabase] = await Promise.all([
    getCurrentUser(),
    createSupabaseServerClient(),
  ]);

  if (!supabase) notFound();

  // 1. Fetch Product with seller and business profiles
  const { data: product, error: prodErr } = await supabase
    .from('products')
    .select(`
      id, title, description, product_kind, price_minor, currency, inventory_count, is_active, seller_id,
      condition, location_city, location_country_iso, pickup_available, shipping_available, delivery_available,
      shipping_cost_minor, brand, model,
      profiles(display_name, username, is_verified),
      businesses(name, slug, category, country_iso, is_verified),
      marketplace_product_media(id, media_url, media_type, thumbnail_url, alt_text, display_order)
    `)
    .eq('id', id)
    .maybeSingle();

  if (prodErr || !product) {
    notFound();
  }

  // Increment views in background
  try {
    await supabase.rpc('increment_product_views', { p_product_id: id });
  } catch {
    // Non-blocking view tracking
  }

  // 2. Fetch Product Variants
  const { data: variantsData } = await supabase
    .from('product_variants')
    .select('*')
    .eq('product_id', id)
    .eq('is_active', true);

  const variants: ProductVariant[] = (variantsData ?? []).map((v) => ({
    id: v.id,
    productId: v.product_id,
    sku: v.sku,
    title: v.title,
    options: (v.options as Record<string, string>) || {},
    priceMinor: v.price_minor,
    compareAtPriceMinor: v.compare_at_price_minor ?? undefined,
    inventoryCount: v.inventory_count,
    imageUrl: v.image_url ?? undefined,
    isActive: v.is_active,
  }));

  // 3. Fetch Product Reviews
  const { data: reviewsData } = await supabase
    .from('product_reviews')
    .select('id, rating, headline, body, verified_purchase, created_at, profiles(display_name, username)')
    .eq('product_id', id)
    .order('created_at', { ascending: false })
    .limit(6);

  const reviews = (reviewsData ?? []) as any[];

  // 4. Check if current user has saved this product to wishlist
  let isSaved = false;
  if (user) {
    const { data: wish } = await supabase
      .from('marketplace_wishlists')
      .select('id')
      .eq('user_id', user.id)
      .eq('product_id', id)
      .maybeSingle();
    isSaved = !!wish;
  }

  // 5. Fetch Related Products
  const { data: relatedData } = await supabase
    .from('products')
    .select('id, title, price_minor, currency, product_kind, inventory_count')
    .eq('is_active', true)
    .neq('id', id)
    .limit(4);

  const relatedProducts = relatedData ?? [];

  const prod = product as any;
  const price = new Money(prod.price_minor, prod.currency);
  const sellerName = prod.businesses?.name ?? prod.profiles?.display_name ?? 'Caribbean Merchant';
  const sellerSlug = prod.businesses?.slug ?? prod.profiles?.username;
  const isSellerVerified = prod.businesses?.is_verified ?? prod.profiles?.is_verified ?? false;
  const conditionKey = (prod.condition as ProductCondition) || 'new';
  const condMeta = PRODUCT_CONDITION_METADATA[conditionKey];

  // Format media items for gallery
  const mediaList = (prod.marketplace_product_media ?? [])
    .sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0))
    .map((m: any) => ({
      id: m.id,
      mediaUrl: m.media_url,
      mediaType: (m.media_type as 'image' | 'video') || 'image',
      thumbnailUrl: m.thumbnail_url,
      altText: m.alt_text || prod.title,
    }));

  return (
    <div className="min-h-screen bg-transparent text-brand-sandstone p-4 sm:p-6 max-w-6xl mx-auto space-y-8 animate-fadeIn">
      {/* Top Header & Breadcrumbs */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-2 text-xs font-bold text-brand-sandstone/80 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Marketplace
        </Link>
        <div className="flex items-center gap-3">
          <AiShoppingAssistant
            productContext={{
              title: prod.title,
              description: prod.description,
              priceFormatted: price.format(),
              condition: condMeta?.label,
              sellerName,
              location: prod.location_city,
            }}
          />
          {sellerSlug && (
            <Link
              href={`/store/${sellerSlug}`}
              className="text-xs font-bold text-orange-400 hover:text-orange-300 transition-colors flex items-center gap-1.5"
            >
              <Store className="w-3.5 h-3.5" /> Visit Storefront →
            </Link>
          )}
        </div>
      </div>

      {/* Main Product Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Media Gallery & Trust Badges (Col 6) */}
        <div className="lg:col-span-6 space-y-4">
          <ProductGallery
            media={mediaList}
            title={prod.title}
            productKind={prod.product_kind}
            conditionBadge={condMeta ? { label: condMeta.label, badgeClass: condMeta.badgeClass } : undefined}
          />

          {/* Guarantees Box */}
          <div className="surface-card border border-white/10 rounded-3xl p-5 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-brand-sunriseCoral font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>TUKUBI Buyer Protection Guarantee</span>
            </div>
            <p className="text-brand-sandstone/70 text-[11px] leading-relaxed">
              Payments are secured via double-entry escrow records and held until verified delivery. Protected with full 30-day dispute settlement and mediation.
            </p>
          </div>
        </div>

        {/* Right Column: Listing Details, Pricing & Actions (Col 6) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="space-y-3">
            {/* Merchant Identification & Wishlist */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {sellerSlug ? (
                  <Link
                    href={`/store/${sellerSlug}`}
                    className="text-xs font-black text-orange-400 hover:text-orange-300 flex items-center gap-1.5 transition-colors"
                  >
                    <Store className="w-3.5 h-3.5" />
                    <span>{sellerName}</span>
                  </Link>
                ) : (
                  <span className="text-xs font-black text-white">{sellerName}</span>
                )}
                {isSellerVerified && (
                  <span className="flex items-center gap-1 text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    <CheckCircle className="w-3 h-3" /> Verified Seller
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/messages?u=${prod.seller_id}`}
                  className="text-xs font-bold text-brand-caribbeanSea hover:text-white px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors flex items-center gap-1.5"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Message Seller</span>
                </Link>
                <WishlistButton productId={prod.id} initialSaved={isSaved} size="md" />
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
              {prod.title}
            </h1>

            {/* Price & Stock Badge */}
            <div className="flex items-baseline gap-3 pt-1">
              <span className="text-3xl sm:text-4xl font-black text-white">
                {price.format()}
              </span>
              <span className="text-xs font-bold text-brand-sandstone/60">{prod.currency}</span>
              {prod.inventory_count !== null && (
                <span
                  className={`text-[11px] font-bold ml-auto px-2.5 py-0.5 rounded-full border ${
                    prod.inventory_count > 0
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                  }`}
                >
                  {prod.inventory_count > 0 ? `${prod.inventory_count} in stock` : 'Sold out'}
                </span>
              )}
            </div>

            {/* Condition Pill & Description */}
            {condMeta && (
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-white flex items-center gap-1.5">
                    Condition: <strong className="text-orange-400">{condMeta.label}</strong>
                  </span>
                </div>
                <p className="text-[11px] text-brand-sandstone/70">{condMeta.description}</p>
              </div>
            )}
          </div>

          {/* Fulfillment & Delivery Options */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-2.5">
              <MapPin className="w-4 h-4 text-orange-400 shrink-0" />
              <div>
                <p className="font-bold text-white">Local Island Pickup</p>
                <p className="text-[10px] text-brand-sandstone/60">
                  {prod.pickup_available ? `${prod.location_city || 'Island Hub'} Available` : 'Not available'}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-2.5">
              <Truck className="w-4 h-4 text-brand-caribbeanSea shrink-0" />
              <div>
                <p className="font-bold text-white">Regional Shipping</p>
                <p className="text-[10px] text-brand-sandstone/60">
                  {prod.shipping_available ? 'Inter-island tracked' : 'Pickup only'}
                </p>
              </div>
            </div>
          </div>

          {/* Product Description */}
          {prod.description && (
            <div className="space-y-1.5 pt-3 border-t border-white/10">
              <h3 className="text-xs font-black uppercase tracking-wider text-brand-sandstone/60">
                Description &amp; Specifications
              </h3>
              <p className="text-xs sm:text-sm text-brand-sandstone/90 leading-relaxed whitespace-pre-wrap font-medium">
                {prod.description}
              </p>
            </div>
          )}

          {/* Variants Selector */}
          {variants.length > 0 && (
            <VariantSelector
              variants={variants}
              basePriceMinor={prod.price_minor}
              currency={prod.currency}
              onVariantChange={() => {}}
            />
          )}

          {/* Client Interactive Actions: Buy, Make Offer, Message, Share, Report */}
          <ProductDetailActions
            productId={prod.id}
            productTitle={prod.title}
            priceMinor={prod.price_minor}
            currency={prod.currency}
            sellerId={prod.seller_id}
            sellerName={sellerName}
            productKind={prod.product_kind}
            isAuthenticated={!!user}
            isSeller={user?.id === prod.seller_id}
            inventoryCount={prod.inventory_count}
          />

          {/* Cross-Border Caribbean & Diaspora Customs Duty Estimator */}
          {prod.product_kind === 'physical' && (
            <CustomsDutyEstimator
              itemValueMinor={prod.price_minor}
              currency={prod.currency}
              categorySlug={prod.category_slug || 'fashion-apparel'}
            />
          )}
        </div>
      </div>

      {/* Customer Reviews Section */}
      <div className="pt-8 border-t border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <Star className="w-5 h-5 text-brand-goldenHour fill-brand-goldenHour" />
            <span>Verified Customer Reviews</span>
            <span className="text-xs font-normal text-brand-sandstone/60">
              ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
            </span>
          </h3>
        </div>

        {reviews.length === 0 ? (
          <div className="surface-card rounded-2xl p-6 text-center space-y-1 border border-white/10">
            <p className="text-xs font-bold text-white">No reviews yet for this listing</p>
            <p className="text-[11px] text-brand-sandstone/60">
              Be the first verified purchaser to share feedback on this Caribbean merchandise.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map((r) => (
              <div
                key={r.id}
                className="surface-card rounded-2xl p-4 space-y-2 border border-white/10"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white">
                    {r.profiles?.display_name || 'Verified Buyer'}
                  </span>
                  <div className="flex items-center gap-1 text-brand-goldenHour">
                    {Array.from({ length: r.rating || 5 }).map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-brand-goldenHour" />
                    ))}
                  </div>
                </div>
                {r.headline && <h4 className="text-xs font-black text-white">{r.headline}</h4>}
                {r.body && <p className="text-xs text-brand-sandstone/80 leading-relaxed">{r.body}</p>}
                <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold pt-1">
                  <CheckCircle className="w-3 h-3" /> Verified TUKUBI Purchase
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Related Products Carousel */}
      {relatedProducts.length > 0 && (
        <div className="pt-8 border-t border-white/10 space-y-4">
          <h3 className="text-base sm:text-lg font-black text-white">More Caribbean Discoveries</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {relatedProducts.map((rel: any) => {
              const relPrice = new Money(rel.price_minor, rel.currency);
              return (
                <Link
                  key={rel.id}
                  href={`/marketplace/${rel.id}`}
                  className="surface-card rounded-2xl p-3 border border-white/10 hover:border-orange-500/40 transition-all space-y-2 group"
                >
                  <div className="aspect-square bg-slate-950 rounded-xl flex items-center justify-center text-3xl group-hover:scale-105 transition-transform">
                    {rel.product_kind === 'service' ? '🤝' : rel.product_kind === 'digital' ? '🎧' : '📦'}
                  </div>
                  <h4 className="text-xs font-bold text-white truncate group-hover:text-orange-400 transition-colors">
                    {rel.title}
                  </h4>
                  <p className="text-xs font-black text-brand-goldenHour">{relPrice.format()}</p>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
