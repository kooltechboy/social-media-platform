import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ShoppingBag,
  Store,
  MapPin,
  ShieldCheck,
  Star,
  Sparkles,
  ArrowLeft,
  Search,
  Filter,
  CheckCircle,
  Package,
  Clock,
  ChevronRight,
  Share2,
  Calendar,
} from 'lucide-react';
import { createSupabaseServerClient, getCurrentUser } from '../../../lib/supabase/server';
import { Money, isMarketplaceCommerceActive } from '@caribbean/payments';
import {
  DEFAULT_STOREFRONT_SECTIONS,
  SELLER_TYPE_REGISTRY,
  type SellerType,
  type StorefrontSection,
} from '@caribbean/marketplace';
import OrderButton from '../../../components/order-button';
import VerificationBadge from '../../../components/verification-badge';

export const dynamic = 'force-dynamic';

export default async function BespokeStorefrontPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ category?: string; q?: string }>;
}) {
  const { slug } = await params;
  const { category: filterCategory, q: searchQuery } = (await searchParams) || {};
  const [user, supabase] = await Promise.all([
    getCurrentUser(),
    createSupabaseServerClient(),
  ]);

  if (!supabase) notFound();

  // 1. Fetch business by slug
  const { data: business } = await supabase
    .from('businesses')
    .select('id, name, slug, category, description, is_verified, country_iso, website, phone, owner_id, owner:profiles!businesses_owner_id_fkey(username, display_name)')
    .eq('slug', slug)
    .maybeSingle();

  let sellerId: string | null = business?.owner_id || null;
  let sellerUsername: string = (business?.owner as any)?.username || slug;
  let storeName: string = business?.name || '';
  let storeCategory: string = business?.category || 'Caribbean Merchant';
  let storeDescription: string = business?.description || 'Authentic Caribbean store on TUKUBI.';
  let isVerified: boolean = business?.is_verified ?? false;
  let countryIso: string = business?.country_iso || 'JM';

  // Fallback: If not found in businesses, search in profiles by username
  if (!business) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, username, display_name, bio, is_verified, country_iso')
      .eq('username', slug)
      .maybeSingle();

    if (!profile) {
      notFound();
    }

    sellerId = profile.id;
    sellerUsername = profile.username;
    storeName = profile.display_name;
    storeCategory = 'Creator & Artisan Store';
    storeDescription = profile.bio || 'Creator merchandise and digital assets on TUKUBI.';
    isVerified = profile.is_verified ?? false;
    countryIso = profile.country_iso || 'JM';
  }

  // 2. Query products for this store
  let query = supabase
    .from('products')
    .select('id, title, description, price_minor, currency, product_kind, inventory_count, is_active, seller_id')
    .eq('seller_id', sellerId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (filterCategory && filterCategory !== 'All') {
    if (['physical', 'digital', 'service'].includes(filterCategory.toLowerCase())) {
      query = query.eq('product_kind', filterCategory.toLowerCase());
    }
  }

  const { data: productsData } = await query;
  let products = productsData || [];

  if (searchQuery && searchQuery.trim().length > 0) {
    const term = searchQuery.toLowerCase().trim();
    products = products.filter(
      (p) =>
        p.title.toLowerCase().includes(term) ||
        (p.description && p.description.toLowerCase().includes(term))
    );
  }

  // 3. Query storefront configuration
  const { data: storeConfig } = await supabase
    .from('storefront_configs')
    .select('*')
    .eq('seller_id', sellerId)
    .maybeSingle();

  const sections: StorefrontSection[] =
    storeConfig?.sections && Array.isArray(storeConfig.sections) && storeConfig.sections.length > 0
      ? storeConfig.sections
      : DEFAULT_STOREFRONT_SECTIONS;

  const sellerType: SellerType = (storeConfig?.seller_type as SellerType) || 'merchant';
  const sellerInfo = SELLER_TYPE_REGISTRY[sellerType] || SELLER_TYPE_REGISTRY.merchant;
  const canTransact = isMarketplaceCommerceActive();

  const physicalCount = products.filter((p) => p.product_kind === 'physical').length;
  const digitalCount = products.filter((p) => p.product_kind === 'digital').length;
  const serviceCount = products.filter((p) => p.product_kind === 'service').length;

  return (
    <div className="min-h-screen bg-transparent text-brand-sandstone p-4 md:p-6 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Top Breadcrumb Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Marketplace
        </Link>
        <div className="flex items-center gap-3">
          {business && (
            <Link
              href={`/pages/${business.slug}`}
              className="text-xs text-brand-sandstone/60 hover:text-brand-sandstone font-medium"
            >
              View TUKUBI Page →
            </Link>
          )}
        </div>
      </div>

      {/* Pre-launch Notification Banner if applicable */}
      {!canTransact && (
        <div className="p-4 rounded-3xl bg-orange-500/10 border border-orange-500/30 text-orange-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-4 h-4 text-orange-400 shrink-0" />
            <div>
              <strong className="text-white">Storefront Setup Phase:</strong> Transactions officially launch September 30, 2026.
              You can explore products and view catalogs now.
            </div>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-500/20 text-orange-400 border border-orange-500/40 shrink-0">
            Catalog Active
          </span>
        </div>
      )}

      {/* Bespoke Storefront Header */}
      <div className="bg-brand-dusk border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative">
        {/* Cover Hero Banner */}
        <div className="h-44 md:h-60 bg-gradient-to-r from-orange-950/60 via-slate-900 to-amber-950/40 relative">
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-brand-twilight/80 text-orange-300 border border-orange-500/30 backdrop-blur-md">
              {sellerInfo.title}
            </span>
          </div>
        </div>

        {/* Storefront Identity Bar */}
        <div className="p-6 pt-0 relative flex flex-col md:flex-row items-start md:items-end justify-between gap-6 -mt-16">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-5">
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-3xl bg-brand-twilight border-4 border-slate-900 flex items-center justify-center text-4xl shadow-2xl shrink-0">
              🏪
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl md:text-3xl font-black text-white">{storeName}</h1>
                {isVerified && <VerificationBadge level="business_verified" showLabel={false} />}
              </div>
              <p className="text-xs font-bold text-brand-sandstone/60">{storeCategory}</p>
              <p className="text-xs text-brand-sunriseCoral font-semibold flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> Caribbean ({countryIso.toUpperCase()}) • Verified Island Store
              </p>
            </div>
          </div>

          {/* Quick Metrics & Actions */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl px-4 py-2 text-center shrink-0">
              <div className="text-xs font-bold text-slate-400">Catalog</div>
              <div className="text-base font-black text-white">{products.length} Items</div>
            </div>
            <Link
              href={`/messages?u=${encodeURIComponent(sellerUsername)}`}
              className="bg-brand-dusk hover:bg-slate-800 border border-slate-700 text-brand-sandstone font-bold px-4 py-2.5 rounded-2xl text-xs transition-colors"
            >
              Contact Merchant
            </Link>
          </div>
        </div>

        {/* Store Description & Policy Bar */}
        <div className="px-6 py-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-400">
          <p className="max-w-3xl leading-relaxed">{storeDescription}</p>
          <div className="flex items-center gap-4 shrink-0 text-[11px]">
            <span className="flex items-center gap-1 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" /> Escrow Protected
            </span>
            <span className="flex items-center gap-1 text-slate-300">
              <CheckCircle className="w-3.5 h-3.5 text-brand-caribbeanSea" /> Verified Delivery
            </span>
          </div>
        </div>
      </div>

      {/* In-Store Merchandising Search & Filter Rail */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { label: 'All Items', val: 'All', count: productsData?.length ?? 0 },
            { label: 'Physical Products', val: 'physical', count: physicalCount },
            { label: 'Digital Assets', val: 'digital', count: digitalCount },
            { label: 'Services & Bookings', val: 'service', count: serviceCount },
          ].map((tab) => {
            const isActive = (filterCategory || 'All').toLowerCase() === tab.val.toLowerCase();
            return (
              <Link
                key={tab.val}
                href={`/store/${slug}${tab.val === 'All' ? '' : `?category=${tab.val}`}`}
                className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-orange-500 text-slate-950 shadow-md shadow-orange-500/20 font-black'
                    : 'bg-brand-dusk text-brand-sandstone/60 hover:text-white border border-slate-800'
                }`}
              >
                <span>{tab.label}</span>
                <span className="text-[10px] opacity-70">({tab.count})</span>
              </Link>
            );
          })}
        </div>

        {/* Search Bar */}
        <form className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            name="q"
            defaultValue={searchQuery || ''}
            placeholder="Search this store..."
            className="w-full bg-brand-dusk border border-slate-800 rounded-2xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
          />
        </form>
      </div>

      {/* Product & Service Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
            <Package className="w-4 h-4 text-orange-400" />
            <span>Store Offerings ({products.length})</span>
          </h2>
          <span className="text-xs text-brand-sandstone/50">Direct from Island Creator</span>
        </div>

        {products.length === 0 ? (
          <div className="p-12 rounded-3xl bg-brand-dusk/60 border border-dashed border-slate-800 text-center space-y-3">
            <Package className="w-8 h-8 text-slate-600 mx-auto" />
            <h3 className="text-sm font-bold text-white">No items found in this section</h3>
            <p className="text-xs text-brand-sandstone/60 max-w-sm mx-auto">
              This merchant has not published items matching your criteria yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {products.map((p) => {
              const price = new Money(p.price_minor, p.currency);
              return (
                <div
                  key={p.id}
                  className="bg-brand-dusk border border-slate-800/80 hover:border-orange-500/40 rounded-3xl p-4 flex flex-col justify-between transition-all group shadow-lg"
                >
                  <div className="space-y-3">
                    <Link
                      href={`/marketplace/${p.id}`}
                      className="aspect-square bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center relative overflow-hidden group-hover:scale-[1.02] transition-transform"
                    >
                      <span className="text-5xl">
                        {p.product_kind === 'service' ? '🤝' : p.product_kind === 'digital' ? '🎧' : '📦'}
                      </span>
                      <span className={`absolute top-2.5 right-2.5 text-[9px] font-black px-2 py-0.5 rounded-full border uppercase ${
                        p.product_kind === 'physical'
                          ? 'bg-orange-500/10 text-orange-400 border-orange-500/30'
                          : p.product_kind === 'digital'
                          ? 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                          : 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                      }`}>
                        {p.product_kind}
                      </span>
                    </Link>

                    <div>
                      <Link
                        href={`/marketplace/${p.id}`}
                        className="font-bold text-sm text-white hover:text-orange-400 line-clamp-1 transition-colors"
                      >
                        {p.title}
                      </Link>
                      <p className="text-xs text-brand-sandstone/60 line-clamp-2 mt-1 min-h-[32px]">
                        {p.description || 'Authentic Caribbean offering with guaranteed fulfillment.'}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
                      <span className="text-base font-black text-white">{price.format()}</span>
                      {p.inventory_count !== null && (
                        <span className="text-[10px] text-brand-sandstone/50">
                          {p.inventory_count > 0 ? `${p.inventory_count} in stock` : 'Out of stock'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-3">
                    <OrderButton
                      productId={p.id}
                      isAuthenticated={!!user}
                      disabled={!user || p.inventory_count === 0}
                      isSeller={user?.id === p.seller_id}
                      productDetails={{
                        title: p.title,
                        priceMinor: p.price_minor,
                        currency: p.currency,
                        sellerName: storeName,
                        productKind: p.product_kind,
                        origin: `Caribbean (${countryIso.toUpperCase()})`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Trust & Guarantee Box */}
      <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-brand-sunriseCoral shrink-0" />
          <div>
            <div className="font-bold text-white">TUKUBI Verified Caribbean Merchant Guarantee</div>
            <div className="text-slate-400 text-[11px] mt-0.5">
              Fulfillment protected by double-entry ledger escrow. Direct payouts upon delivery.
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 text-slate-400 text-xs shrink-0">
          <span>Official Storefront</span>
          <span>•</span>
          <span>Caribbean Connected</span>
        </div>
      </div>
    </div>
  );
}
