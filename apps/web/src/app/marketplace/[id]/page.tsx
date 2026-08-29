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
} from 'lucide-react';
import { Money } from '@caribbean/spotpay';
import { createSupabaseServerClient, getCurrentUser } from '../../../lib/supabase/server';
import OrderButton from '../../../components/order-button';

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

  let product: any = null;

  if (supabase) {
    const { data } = await supabase
      .from('products')
      .select('id, title, description, product_kind, price_minor, currency, inventory_count, is_active, seller_id, profiles(display_name, username), businesses(name, slug)')
      .eq('id', id)
      .maybeSingle();

    if (data) {
      product = data;
    }
  }

  if (!product) {
    notFound();
  }

  const price = new Money(product.price_minor, product.currency);
  const sellerName = product.businesses?.name ?? product.profiles?.display_name ?? 'Caribbean Merchant';
  const outOfStock = product.inventory_count !== null && product.inventory_count === 0;

  return (
    <div className="min-h-screen bg-[#090D16] text-brand-sandstone p-4 md:p-6 max-w-5xl mx-auto space-y-8 animate-fadeIn">
      {/* Top Breadcrumb Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-brand-sandstone transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Marketplace
        </Link>
        <span className="text-xs text-brand-sandstone/40 font-mono">
          ID: {product.id.slice(0, 12)}
        </span>
      </div>

      {/* Product Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column: Media & Showcase */}
        <div className="space-y-4">
          <div className="aspect-square bg-gradient-to-br from-slate-900 via-slate-900 to-orange-950/30 border border-slate-800 rounded-3xl flex flex-col items-center justify-center relative overflow-hidden shadow-2xl">
            <span className="text-7xl mb-2">📦</span>
            {product.origin && (
              <span className="absolute top-4 left-4 text-xs font-black px-3 py-1 rounded-full bg-brand-twilight/90 text-orange-400 border border-orange-500/30 backdrop-blur-md">
                {product.origin}
              </span>
            )}
            <span className={`absolute top-4 right-4 text-[10px] font-black px-2.5 py-1 rounded-full border ${
              product.product_kind === 'physical'
                ? 'bg-brand-sunriseCoral/10 text-brand-sunriseCoral border-brand-sunriseCoral/30'
                : product.product_kind === 'digital'
                ? 'bg-brand-caribbeanSea/10 text-brand-caribbeanSea border-brand-caribbeanSea/30'
                : 'bg-brand-goldenHour/10 text-brand-goldenHour border-brand-goldenHour/30'
            }`}>
              {product.product_kind.toUpperCase()}
            </span>
          </div>

          {/* Guarantees Box */}
          <div className="bg-brand-dusk/60 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-brand-sunriseCoral font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>SpotPay Buyer Protection (Beta)</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Payments are recorded via secure double-entry ledger and released to the merchant upon delivery confirmation. Dispute resolution backed by TUKUBI Trust &amp; Safety.
            </p>
          </div>
        </div>

        {/* Right Column: Details & Purchasing */}
        <div className="space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                {product.businesses?.slug ? (
                  <Link
                    href={`/pages/${product.businesses.slug}`}
                    className="text-xs font-extrabold text-orange-400 hover:underline flex items-center gap-1"
                  >
                    <Building2 className="w-3.5 h-3.5" /> {sellerName}
                  </Link>
                ) : (
                  <span className="text-xs font-extrabold text-brand-sandstone/60">{sellerName}</span>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-brand-sandstone leading-tight">
                {product.title}
              </h1>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black text-brand-sandstone">
                {price.format()}
              </span>
              <span className="text-xs font-bold text-brand-sandstone/60">{product.currency}</span>
              {product.inventory_count !== null && (
                <span className={`text-[11px] font-bold ml-auto ${
                  product.inventory_count > 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {product.inventory_count > 0 ? `${product.inventory_count} in stock` : 'Sold out'}
                </span>
              )}
            </div>

            {product.description && (
              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-brand-sandstone/60">
                  Description
                </h3>
                <p className="text-xs md:text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {product.description}
                </p>
              </div>
            )}
          </div>

          {/* Action & Checkout Box */}
          <div className="bg-brand-dusk/90 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
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
                origin: product.origin,
              }}
            />

            <div className="flex items-center justify-between text-[11px] text-brand-sandstone/50 pt-2 border-t border-slate-800">
              <span className="flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-brand-caribbeanSea" /> Global Caribbean Dispatch
              </span>
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-brand-sunriseCoral" /> 256-bit Encrypted Settlement
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
