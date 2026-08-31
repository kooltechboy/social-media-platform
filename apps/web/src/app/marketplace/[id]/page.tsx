import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ShoppingBag,
  ArrowLeft,
  ShieldCheck,
  Truck,
  CheckCircle,
  Star,
  Share2,
  Lock,
  Wallet,
  Building2,
  Calendar,
  Sparkles,
  Store,
  Clock,
  MessageCircle,
} from 'lucide-react';
import { Money, isMarketplaceCommerceActive } from '@caribbean/payments';
import { createSupabaseServerClient, getCurrentUser } from '../../../lib/supabase/server';
import OrderButton from '../../../components/order-button';
import VariantSelector from '../../../components/marketplace/variant-selector';
import { type ProductVariant } from '@caribbean/marketplace';

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
    .select('id, title, description, product_kind, price_minor, currency, inventory_count, is_active, seller_id, profiles(display_name, username), businesses(name, slug, category, country_iso)')
    .eq('id', id)
    .maybeSingle();

  if (prodErr || !product) {
    notFound();
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
    .limit(5);

  const reviews = (reviewsData ?? []) as any[];

  // 4. Fetch Related Products
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
  const outOfStock = prod.inventory_count !== null && prod.inventory_count === 0;
  const canTransact = isMarketplaceCommerceActive();

  // Review statistics calculation
  const totalReviews = reviews.length;
  const avgRating =
    totalReviews > 0
      ? (reviews.reduce((sum, r) => sum + (r.rating || 5), 0) / totalReviews).toFixed(1)
      : '5.0';

  return (
    <div className="min-h-screen bg-transparent text-brand-sandstone p-4 md:p-6 max-w-6xl mx-auto space-y-8 animate-fadeIn">
      {/* Top Breadcrumb Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Marketplace
        </Link>
        <div className="flex items-center gap-3">
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

      {/* Pre-launch Notification Banner */}
      {!canTransact && (
        <div className="p-4 rounded-3xl bg-orange-500/10 border border-orange-500/30 text-orange-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-4 h-4 text-orange-400 shrink-0" />
            <div>
              <strong className="text-white">Storefront Setup Phase:</strong> Marketplace transactions begin September 30, 2026.
              You can explore products and specifications now.
            </div>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-500/20 text-orange-400 border border-orange-500/40 shrink-0">
            Catalog Active
          </span>
        </div>
      )}

      {/* Main Product Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Media & Gallery (Col 6) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="aspect-square bg-gradient-to-br from-slate-900 via-slate-900 to-orange-950/30 border border-slate-800 rounded-3xl flex flex-col items-center justify-center relative overflow-hidden shadow-2xl">
            <span className="text-8xl mb-2 select-none">
              {product.product_kind === 'service' ? '🤝' : product.product_kind === 'digital' ? '🎧' : '📦'}
            </span>

            <span className={`absolute top-4 right-4 text-[10px] font-black px-3 py-1 rounded-full border uppercase tracking-wider ${
              product.product_kind === 'physical'
                ? 'bg-orange-500/10 text-orange-400 border-orange-500/30'
                : product.product_kind === 'digital'
                ? 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                : 'bg-purple-500/10 text-purple-400 border-purple-500/30'
            }`}>
              {product.product_kind}
            </span>

            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs text-brand-sandstone/60 px-2">
              <span className="flex items-center gap-1 font-semibold text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" /> Verified Product Listing
              </span>
              <span className="text-[10px] text-slate-400">TUKUBI Verified Catalog</span>
            </div>
          </div>

          {/* Guarantees Box */}
          <div className="bg-brand-dusk/60 border border-slate-800 rounded-3xl p-5 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-brand-sunriseCoral font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>TUKUBI Buyer &amp; Seller Protection (30-Day Guarantee)</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Payments are recorded via secure double-entry ledger escrow and released to the merchant upon verified delivery. Automated dispute resolution backed by TUKUBI Trust &amp; Safety.
            </p>
          </div>
        </div>

        {/* Right Column: Details, Options & Purchasing (Col 6) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="space-y-3">
            {/* Merchant Identification */}
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
                <span className="text-xs font-black text-slate-300">{sellerName}</span>
              )}
              <span className="text-slate-600">•</span>
              <span className="text-xs text-brand-sandstone/50">Caribbean Verified</span>
            </div>

            <h1 className="text-2xl md:text-3xl font-black text-white leading-tight">
              {product.title}
            </h1>

            {/* Price & Stock Badge */}
            <div className="flex items-baseline gap-3 pt-1">
              <span className="text-3xl font-black text-white">
                {price.format()}
              </span>
              <span className="text-xs font-bold text-brand-sandstone/60">{product.currency}</span>
              {product.inventory_count !== null && (
                <span className={`text-[11px] font-bold ml-auto px-2.5 py-0.5 rounded-full border ${
                  product.inventory_count > 0
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                }`}>
                  {product.inventory_count > 0 ? `${product.inventory_count} in stock` : 'Sold out'}
                </span>
              )}
            </div>
          </div>

          {/* Product Description */}
          {product.description && (
            <div className="space-y-1.5 pt-3 border-t border-slate-800/80">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-brand-sandstone/50">
                Description
              </h3>
              <p className="text-xs md:text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                {product.description}
              </p>
            </div>
          )}

          {/* Structured Variants Selector */}
          {variants.length > 0 && (
            <VariantSelector
              variants={variants}
              basePriceMinor={product.price_minor}
              currency={product.currency}
              onVariantChange={() => {}}
            />
          )}

          {/* Service Booking Specifications if service */}
          {product.product_kind === 'service' && (
            <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/30 text-xs space-y-2 text-purple-200">
              <div className="flex items-center gap-2 font-bold text-purple-300">
                <Clock className="w-4 h-4" />
                <span>Service Booking &amp; Deliverables</span>
              </div>
              <p className="text-[11px] text-purple-200/80 leading-relaxed">
                Direct booking with {sellerName}. Session coordination, timeline, and deliverables are managed through secure TUKUBI messaging.
              </p>
            </div>
          )}

          {/* Purchasing Box */}
          <div className="bg-brand-dusk border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
            <OrderButton
              productId={product.id}
              disabled={outOfStock || !user || user.id === product.seller_id}
              isAuthenticated={!!user}
              isSeller={user?.id === product.seller_id}
              productDetails={{
                title: product.title,
                priceMinor: product.price_minor,
                currency: product.currency,
                sellerName,
                productKind: product.product_kind,
              }}
            />

            <div className="flex items-center justify-between text-[11px] text-brand-sandstone/50 pt-2 border-t border-slate-800">
              <span className="flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-brand-caribbeanSea" /> Caribbean &amp; Global Shipping
              </span>
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-brand-sunriseCoral" /> 256-bit Encrypted Checkout
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Verified Reviews Section */}
      <div className="space-y-4 pt-4 border-t border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Star className="w-5 h-5 text-brand-goldenHour fill-brand-goldenHour" />
              <span>Customer Reviews</span>
              <span className="text-xs font-normal text-slate-400 ml-1">({reviews.length})</span>
            </h2>
            <p className="text-xs text-brand-sandstone/60 mt-0.5">
              Authentic feedback from verified Caribbean community buyers.
            </p>
          </div>
        </div>

        {reviews.length === 0 ? (
          <div className="p-8 rounded-3xl bg-brand-dusk/40 border border-slate-800 text-center space-y-2">
            <p className="text-xs text-brand-sandstone/60">
              No customer reviews yet for this listing. Verified buyers can submit reviews after order fulfillment.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className="p-4 rounded-2xl bg-brand-dusk/70 border border-slate-800 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: rev.rating }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 text-brand-goldenHour fill-brand-goldenHour" />
                    ))}
                  </div>
                  {rev.verified_purchase && (
                    <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Verified Purchase
                    </span>
                  )}
                </div>
                {rev.headline && <h4 className="font-bold text-white">{rev.headline}</h4>}
                <p className="text-slate-300 leading-relaxed">{rev.body}</p>
                <div className="text-[10px] text-slate-500 pt-1">
                  By {rev.profiles?.display_name || 'Community Member'} • {new Date(rev.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Related Products Carousel */}
      {relatedProducts.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-orange-400" />
              <span>More Caribbean Offerings</span>
            </h3>
            <Link href="/marketplace" className="text-xs text-orange-400 hover:text-orange-300 font-bold">
              Explore All →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {relatedProducts.map((rel) => {
              const relPrice = new Money(rel.price_minor, rel.currency);
              return (
                <Link
                  key={rel.id}
                  href={`/marketplace/${rel.id}`}
                  className="bg-brand-dusk border border-slate-800 hover:border-orange-500/40 rounded-2xl p-3.5 space-y-2 transition-all block group"
                >
                  <div className="aspect-square bg-slate-900 rounded-xl flex items-center justify-center text-3xl group-hover:scale-105 transition-transform">
                    {rel.product_kind === 'service' ? '🤝' : rel.product_kind === 'digital' ? '🎧' : '📦'}
                  </div>
                  <h4 className="text-xs font-bold text-white group-hover:text-orange-400 line-clamp-1 transition-colors">
                    {rel.title}
                  </h4>
                  <div className="text-xs font-black text-brand-sunriseCoral">
                    {relPrice.format()}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
