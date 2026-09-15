'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ShoppingBag,
  Flame,
  Tag,
  Pin,
  PinOff,
  Check,
  AlertCircle,
  Loader2,
  ExternalLink,
  Package,
} from 'lucide-react';
import { calculateLiveDiscountPrice } from '@caribbean/live';
import { createSupabaseBrowserClient } from '../../lib/supabase/browser';
import {
  pinLivestreamProductAction,
  unpinLivestreamProductAction,
  getLivestreamProductsAction,
} from '../../lib/marketplace/actions';

interface ProductItem {
  id: string;
  title: string;
  price_minor: number;
  currency: string;
  inventory_count: number | null;
  product_kind: string;
  is_active: boolean;
  image_url?: string;
}

interface PinnedItem {
  id: string;
  productId: string;
  flashDiscountBps: number;
  product: ProductItem;
  pinnedAt: string | null;
}

interface LiveShoppingControlsProps {
  livestreamId: string;
  hostId: string;
}

export function LiveShoppingControls({ livestreamId, hostId }: LiveShoppingControlsProps) {
  const [pinnedItem, setPinnedItem] = useState<PinnedItem | null>(null);
  const [availableProducts, setAvailableProducts] = useState<ProductItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [discountPercent, setDiscountPercent] = useState<number>(10);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPinning, setIsPinning] = useState<boolean>(false);
  const [isUnpinning, setIsUnpinning] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchStreamProducts = useCallback(async () => {
    try {
      const res = await getLivestreamProductsAction(livestreamId);
      if (res.products && res.products.length > 0) {
        const pinned = res.products.find((p: any) => p.is_pinned);
        if (pinned && pinned.products) {
          const media = pinned.products.marketplace_product_media;
          const img = Array.isArray(media) && media.length > 0 ? media[0].url : undefined;
          setPinnedItem({
            id: pinned.id,
            productId: pinned.product_id,
            flashDiscountBps: pinned.flash_discount_bps,
            pinnedAt: pinned.pinned_at,
            product: {
              ...pinned.products,
              image_url: img,
            },
          });
        } else {
          setPinnedItem(null);
        }
      } else {
        setPinnedItem(null);
      }
    } catch {
      // Non-blocking initial fetch
    }
  }, [livestreamId]);

  const fetchHostProducts = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    const { data } = await supabase
      .from('products')
      .select(`
        id,
        title,
        price_minor,
        currency,
        inventory_count,
        product_kind,
        is_active,
        marketplace_product_media (url, is_primary)
      `)
      .eq('seller_id', hostId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(30);

    if (data) {
      const formatted: ProductItem[] = data.map((item: any) => {
        const media = item.marketplace_product_media;
        const img = Array.isArray(media) && media.length > 0 ? media[0].url : undefined;
        return {
          id: item.id,
          title: item.title,
          price_minor: item.price_minor,
          currency: item.currency || 'USD',
          inventory_count: item.inventory_count,
          product_kind: item.product_kind,
          is_active: item.is_active,
          image_url: img,
        };
      });
      setAvailableProducts(formatted);
      if (formatted.length > 0 && !selectedProductId) {
        setSelectedProductId(formatted[0].id);
      }
    }
  }, [hostId, selectedProductId]);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([fetchStreamProducts(), fetchHostProducts()]).finally(() => {
      setIsLoading(false);
    });
  }, [fetchStreamProducts, fetchHostProducts]);

  // Realtime subscription for pinned product changes
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase || !livestreamId) return;

    const channel = supabase
      .channel(`live-shopping-${livestreamId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'livestream_products',
          filter: `livestream_id=eq.${livestreamId}`,
        },
        () => {
          void fetchStreamProducts();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [livestreamId, fetchStreamProducts]);

  const handlePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) return;

    setIsPinning(true);
    setStatusMessage(null);

    const flashDiscountBps = Math.round(discountPercent * 100);
    const result = await pinLivestreamProductAction(livestreamId, selectedProductId, flashDiscountBps);

    setIsPinning(false);
    if (result.success) {
      setStatusMessage({ text: 'Product pinned live! Viewers can now buy instantly with flash drop pricing.', type: 'success' });
      await fetchStreamProducts();
    } else {
      setStatusMessage({ text: result.error || 'Failed to pin product.', type: 'error' });
    }
  };

  const handleUnpin = async () => {
    setIsUnpinning(true);
    setStatusMessage(null);

    const result = await unpinLivestreamProductAction(livestreamId);
    setIsUnpinning(false);

    if (result.success) {
      setPinnedItem(null);
      setStatusMessage({ text: 'Live product drop unpinned.', type: 'success' });
    } else {
      setStatusMessage({ text: result.error || 'Failed to unpin product.', type: 'error' });
    }
  };

  const selectedProduct = availableProducts.find((p) => p.id === selectedProductId);
  const flashDiscountBps = Math.round(discountPercent * 100);
  const pricingPreview = selectedProduct
    ? calculateLiveDiscountPrice(selectedProduct.price_minor, flashDiscountBps)
    : null;

  return (
    <div className="surface-card border border-white/10 rounded-3xl p-5 space-y-5 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-hibiscus to-brand-goldenHour flex items-center justify-center text-slate-950 font-black shadow-md">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              Live Shopping &amp; Flash Drops
            </h3>
            <p className="text-[11px] text-brand-sandstone/70">
              Pin listings with limited-time live broadcast discounts to drive viral sales.
            </p>
          </div>
        </div>

        {pinnedItem && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
            <Flame className="w-3.5 h-3.5 fill-current" />
            DROP LIVE
          </span>
        )}
      </div>

      {statusMessage && (
        <div
          className={`p-3 rounded-2xl text-xs flex items-start gap-2.5 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <Check className="w-4 h-4 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          )}
          <span className="leading-relaxed">{statusMessage.text}</span>
        </div>
      )}

      {/* Currently Pinned Product Card */}
      {pinnedItem ? (
        <div className="bg-gradient-to-r from-red-950/40 via-brand-twilight to-slate-900 border border-red-500/40 rounded-2xl p-4 space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase text-red-400 tracking-wider flex items-center gap-1.5">
              <Pin className="w-3.5 h-3.5 fill-current" /> Currently Pinned on Broadcast
            </span>
            <button
              type="button"
              onClick={handleUnpin}
              disabled={isUnpinning}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white border border-slate-600 transition-colors cursor-pointer min-h-[36px] disabled:opacity-50"
            >
              {isUnpinning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PinOff className="w-3.5 h-3.5" />}
              Unpin Drop
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0">
              {pinnedItem.product.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={pinnedItem.product.image_url}
                  alt={pinnedItem.product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Package className="w-6 h-6 text-slate-500" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-black text-white truncate">{pinnedItem.product.title}</h4>
              <div className="flex items-baseline gap-2 mt-0.5">
                {pinnedItem.flashDiscountBps > 0 ? (
                  <>
                    <span className="text-sm font-black text-brand-caribbeanSea">
                      ${(
                        calculateLiveDiscountPrice(pinnedItem.product.price_minor, pinnedItem.flashDiscountBps)
                          .discountedMinor / 100
                      ).toFixed(2)}{' '}
                      {pinnedItem.product.currency}
                    </span>
                    <span className="text-xs text-brand-sandstone/50 line-through">
                      ${(pinnedItem.product.price_minor / 100).toFixed(2)}
                    </span>
                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-red-600 text-white">
                      -{pinnedItem.flashDiscountBps / 100}%
                    </span>
                  </>
                ) : (
                  <span className="text-sm font-black text-white">
                    ${(pinnedItem.product.price_minor / 100).toFixed(2)} {pinnedItem.product.currency}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-4 text-center space-y-1 text-xs text-brand-sandstone/60">
          <p className="font-semibold text-white">No product currently pinned</p>
          <p>Choose an active store listing below to feature live for all viewers.</p>
        </div>
      )}

      {/* Pin Control Form */}
      {availableProducts.length === 0 && !isLoading ? (
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center space-y-2">
          <Package className="w-8 h-8 text-brand-sandstone/40 mx-auto" />
          <p className="text-xs font-bold text-white">No Active Products Found</p>
          <p className="text-[11px] text-brand-sandstone/70">
            Create items in your Seller Center to feature them live during broadcasts.
          </p>
          <a
            href="/marketplace/seller-center/create"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-caribbeanSea text-slate-950 font-black text-xs hover:brightness-110 transition-all cursor-pointer min-h-[44px]"
          >
            Create Marketplace Listing <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      ) : (
        <form onSubmit={handlePin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-brand-sandstone/80">Select Product to Feature</label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              disabled={isPinning}
              className="w-full bg-slate-950/80 border border-white/20 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-caribbeanSea cursor-pointer min-h-[44px]"
            >
              {availableProducts.map((prod) => (
                <option key={prod.id} value={prod.id}>
                  {prod.title} — ${(prod.price_minor / 100).toFixed(2)} {prod.currency} (Stock: {prod.inventory_count ?? '∞'})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-brand-sandstone/80 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-brand-goldenHour" /> Live Flash Drop Discount
              </label>
              <span className="text-xs font-black text-brand-caribbeanSea">{discountPercent}% OFF</span>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {[0, 5, 10, 15, 20].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setDiscountPercent(pct)}
                  className={`py-2 rounded-xl text-xs font-black border transition-all cursor-pointer min-h-[44px] flex items-center justify-center ${
                    discountPercent === pct
                      ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white border-red-500 shadow-md'
                      : 'bg-white/5 border-white/10 text-brand-sandstone/80 hover:bg-white/10'
                  }`}
                >
                  {pct === 0 ? 'Regular' : `-${pct}%`}
                </button>
              ))}
            </div>
          </div>

          {/* Pricing Preview */}
          {selectedProduct && pricingPreview && discountPercent > 0 && (
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
              <span className="text-brand-sandstone/70">Flash Drop Price:</span>
              <div className="flex items-center gap-2">
                <span className="line-through text-brand-sandstone/50">
                  ${(selectedProduct.price_minor / 100).toFixed(2)}
                </span>
                <span className="font-black text-emerald-400 text-sm">
                  ${(pricingPreview.discountedMinor / 100).toFixed(2)} {selectedProduct.currency}
                </span>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isPinning || !selectedProductId}
            className="w-full bg-gradient-to-r from-red-600 via-rose-600 to-brand-hibiscus hover:brightness-110 text-white font-black py-3 rounded-xl text-xs transition-all shadow-lg shadow-red-600/20 cursor-pointer min-h-[44px] flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isPinning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Pinning Product…
              </>
            ) : (
              <>
                <Pin className="w-4 h-4 fill-current" />
                {pinnedItem ? 'Update Pinned Product' : 'Pin Drop to Live Broadcast'}
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
