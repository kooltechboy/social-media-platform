'use client';
/* eslint-disable react-hooks/rules-of-hooks */

import React from 'react';
import {
  ShoppingBag,
  Sparkles,
  X,
  ShieldCheck,
  CheckCircle,
  Loader2,
  Check,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Store,
} from 'lucide-react';
import {
  type TaggedProductSummary,
  formatProductPrice,
} from '@caribbean/marketplace';
import { createOrderAction, type MarketplaceActionState } from '../../lib/marketplace/actions';

function useSafeState<T>(initialValue: T | (() => T)): [T, React.Dispatch<React.SetStateAction<T>>] {
  const internals =
    (React as any)?.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE ||
    (React as any)?.__SECRET_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
  const dispatcher = internals?.H || internals?.ReactCurrentDispatcher?.current;

  if (dispatcher) {
    return React.useState<T>(initialValue);
  }
  const val = typeof initialValue === 'function' ? (initialValue as () => T)() : initialValue;
  return [val, () => {}];
}

function useSafeEffect(effect: React.EffectCallback, deps?: React.DependencyList): void {
  const internals =
    (React as any)?.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE ||
    (React as any)?.__SECRET_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
  const dispatcher = internals?.H || internals?.ReactCurrentDispatcher?.current;

  if (dispatcher) {
    React.useEffect(effect, deps);
  }
}

export interface ShoppablePostWidgetProps {
  products?: TaggedProductSummary[] | TaggedProductSummary;
  product?: TaggedProductSummary | any; // Backwards compatibility for single product prop
  onAddToCart?: (product: TaggedProductSummary) => void;
  onBuyNow?: (product: TaggedProductSummary) => void;
  className?: string;
}

/**
 * Normalizes a single product or array into a uniform TaggedProductSummary array.
 */
export function normalizeTaggedProducts(
  input?: TaggedProductSummary[] | TaggedProductSummary | any
): TaggedProductSummary[] {
  if (!input) return [];
  const rawList = Array.isArray(input) ? input : [input];
  return rawList
    .filter(Boolean)
    .map((item) => {
      // Map any legacy or missing fields
      return {
        id: item.id || `prod-${Math.random().toString(36).substring(2, 9)}`,
        title: item.title || 'Featured Product',
        priceMinor: typeof item.priceMinor === 'number' ? item.priceMinor : 0,
        currency: item.currency || 'USD',
        thumbnailUrl: item.thumbnailUrl || item.imageUrl || item.image,
        sellerId: item.sellerId,
        sellerName: item.sellerName || 'Caribbean Artisan',
        sellerAvatar: item.sellerAvatar,
        originCountry: item.originCountry || item.origin,
        originTerritory: item.originTerritory || item.origin || 'Caribbean',
        inventoryCount: typeof item.inventoryCount === 'number' ? item.inventoryCount : 10,
        isAvailable: item.isAvailable !== false,
      };
    });
}

export default function ShoppablePostWidget({
  products,
  product,
  onAddToCart,
  onBuyNow,
  className = '',
}: ShoppablePostWidgetProps) {
  const normalizedProducts = normalizeTaggedProducts(products || product);

  const [activeCheckoutProduct, setActiveCheckoutProduct] = useSafeState<TaggedProductSummary | null>(null);
  const [quantity, setQuantity] = useSafeState<number>(1);
  const [shippingAddress, setShippingAddress] = useSafeState<string>('');
  const [isSubmitting, setIsSubmitting] = useSafeState<boolean>(false);
  const [actionState, setActionState] = useSafeState<MarketplaceActionState>({ error: null, success: null });
  const [addedIds, setAddedIds] = useSafeState<Record<string, boolean>>({});
  const [carouselIndex, setCarouselIndex] = useSafeState<number>(0);

  // Keyboard navigation for checkout modal (Escape to dismiss)
  useSafeEffect(() => {
    if (!activeCheckoutProduct) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveCheckoutProduct(null);
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [activeCheckoutProduct]);

  if (normalizedProducts.length === 0) {
    return null;
  }

  const handleAddToCartClick = (p: TaggedProductSummary, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setAddedIds((prev) => ({ ...prev, [p.id]: true }));

    // Dispatch event and store in client cart for global listeners
    if (typeof window !== 'undefined') {
      try {
        const existing = JSON.parse(window.localStorage.getItem('tukubi_cart') || '[]');
        const updated = [...existing.filter((i: any) => i.id !== p.id), { ...p, quantity: 1 }];
        window.localStorage.setItem('tukubi_cart', JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('tukubi:cart:add', { detail: { product: p } }));
      } catch {
        // LocalStorage fallback
      }
    }

    if (onAddToCart) {
      onAddToCart(p);
    }

    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [p.id]: false }));
    }, 2000);
  };

  const handleBuyNowClick = (p: TaggedProductSummary, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveCheckoutProduct(p);
    setQuantity(1);
    setActionState({ error: null, success: null });
    if (onBuyNow) {
      onBuyNow(p);
    }
  };

  const handleExecuteCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCheckoutProduct) return;
    setIsSubmitting(true);
    setActionState({ error: null, success: null });

    const formData = new FormData();
    formData.append('productId', activeCheckoutProduct.id);
    formData.append('quantity', String(quantity));
    if (shippingAddress.trim()) {
      formData.append('shippingAddress', JSON.stringify({ raw: shippingAddress.trim() }));
    }

    try {
      const res = await createOrderAction({ error: null, success: null }, formData);
      setActionState(res);
      if (res.success) {
        setTimeout(() => {
          setActiveCheckoutProduct(null);
          setActionState({ error: null, success: null });
        }, 3000);
      }
    } catch (err: any) {
      setActionState({
        error: err?.message || 'Order failed. Please verify connection and retry.',
        success: null,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isMulti = normalizedProducts.length > 1;

  // Checkout modal calculations
  const unitPriceMinor = activeCheckoutProduct?.priceMinor || 0;
  const currency = activeCheckoutProduct?.currency || 'USD';
  const subtotalMinor = unitPriceMinor * quantity;
  const escrowFeeMinor = Math.round(subtotalMinor * 0.08); // 8% escrow & logistics guarantee fee
  const grandTotalMinor = subtotalMinor + escrowFeeMinor;

  return (
    <div
      role="region"
      aria-label="Shoppable Post Widget"
      className={`mt-3 w-full rounded-2xl bg-gradient-to-r from-brand-dusk/95 via-slate-900/95 to-brand-dusk/95 border border-brand-sunriseCoral/30 shadow-lg p-3 sm:p-4 text-white ${className}`}
    >
      {/* Top Header Badge */}
      <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-brand-sunriseCoral/20 text-brand-sunriseCoral border border-brand-sunriseCoral/30 flex items-center justify-center">
            <ShoppingBag className="w-3.5 h-3.5" />
          </div>
          <span className="text-[11px] font-black uppercase text-brand-goldenHour tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-brand-sunriseCoral" />
            {isMulti ? `Tagged Goods (${normalizedProducts.length})` : 'Shoppable Post'}
          </span>
        </div>

        {isMulti && (
          <div className="flex items-center gap-1.5 text-xs text-brand-sandstone/80">
            <span>
              {carouselIndex + 1} / {normalizedProducts.length}
            </span>
            <div className="flex items-center gap-1 ml-1">
              <button
                type="button"
                onClick={() => setCarouselIndex((prev) => Math.max(0, prev - 1))}
                disabled={carouselIndex === 0}
                aria-label="Previous tagged product"
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 flex items-center justify-center text-white min-h-[44px] min-w-[44px]"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setCarouselIndex((prev) => Math.min(normalizedProducts.length - 1, prev + 1))}
                disabled={carouselIndex === normalizedProducts.length - 1}
                aria-label="Next tagged product"
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 flex items-center justify-center text-white min-h-[44px] min-w-[44px]"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Product Content: Single Card vs Multi-Card Carousel */}
      {!isMulti ? (
        // Single Product View
        (() => {
          const item = normalizedProducts[0];
          const isAdded = Boolean(addedIds[item.id]);
          return (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {item.thumbnailUrl ? (
                  <img
                    src={item.thumbnailUrl}
                    alt={item.title}
                    className="w-14 h-14 rounded-xl object-cover border border-white/10 shrink-0 bg-slate-800"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-brand-sunriseCoral/10 border border-brand-sunriseCoral/20 flex items-center justify-center text-brand-sunriseCoral shrink-0">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                )}
                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-black text-white truncate max-w-[200px] sm:max-w-xs">
                      {item.title}
                    </span>
                    {(item.originTerritory || item.originCountry) && (
                      <span className="px-2 py-0.5 rounded-full bg-brand-caribbeanSea/20 border border-brand-caribbeanSea/30 text-[10px] font-bold text-brand-caribbeanSea flex items-center gap-0.5">
                        <MapPin className="w-2.5 h-2.5" />
                        {item.originTerritory || item.originCountry}
                      </span>
                    )}
                  </div>
                  {item.sellerName && (
                    <div className="text-[11px] text-brand-sandstone/70 flex items-center gap-1">
                      <Store className="w-3 h-3 text-slate-400" />
                      <span>{item.sellerName}</span>
                    </div>
                  )}
                  <div className="text-sm font-black text-brand-sunriseCoral">
                    {formatProductPrice(item.priceMinor, item.currency)}
                  </div>
                </div>
              </div>

              {/* Dual Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0">
                <button
                  type="button"
                  onClick={(e) => handleAddToCartClick(item, e)}
                  aria-label={`Add ${item.title} to Cart`}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 min-h-[44px] min-w-[44px] cursor-pointer ${
                    isAdded
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-white/10 hover:bg-white/15 text-white border border-white/15'
                  }`}
                >
                  {isAdded ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Added!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4" />
                      <span>Add to Cart</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={(e) => handleBuyNowClick(item, e)}
                  aria-label={`Buy Now: ${item.title}`}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-sunriseCoral to-brand-goldenHour hover:brightness-110 text-slate-950 font-black text-xs transition-all shadow-md active:scale-95 min-h-[44px] min-w-[44px] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Buy Now</span>
                </button>
              </div>
            </div>
          );
        })()
      ) : (
        // Multi-Product Carousel View
        <div className="space-y-3">
          <div
            className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory"
            tabIndex={0}
            aria-label="Tagged Products Carousel"
          >
            {normalizedProducts.map((item, idx) => {
              const isAdded = Boolean(addedIds[item.id]);
              return (
                <div
                  key={item.id}
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${item.title} (${idx + 1} of ${normalizedProducts.length})`}
                  className="min-w-[260px] sm:min-w-[280px] p-3 rounded-xl bg-slate-900/80 border border-white/10 flex flex-col justify-between gap-3 snap-start shrink-0"
                >
                  <div className="flex items-start gap-2.5">
                    {item.thumbnailUrl ? (
                      <img
                        src={item.thumbnailUrl}
                        alt={item.title}
                        className="w-12 h-12 rounded-lg object-cover border border-white/10 shrink-0 bg-slate-800"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-brand-sunriseCoral/10 border border-brand-sunriseCoral/20 flex items-center justify-center text-brand-sunriseCoral shrink-0">
                        <ShoppingBag className="w-5 h-5" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-black text-white truncate">{item.title}</div>
                      <div className="text-[10px] text-brand-sandstone/70 truncate">{item.sellerName}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs font-black text-brand-sunriseCoral">
                          {formatProductPrice(item.priceMinor, item.currency)}
                        </span>
                        {(item.originTerritory || item.originCountry) && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-brand-caribbeanSea/20 text-brand-caribbeanSea font-bold">
                            {item.originTerritory || item.originCountry}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                    <button
                      type="button"
                      onClick={(e) => handleAddToCartClick(item, e)}
                      aria-label={`Add ${item.title} to Cart`}
                      className={`flex-1 py-2 px-2.5 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 min-h-[44px] cursor-pointer ${
                        isAdded
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-white/10 hover:bg-white/15 text-white border border-white/10'
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Added!</span>
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>Add to Cart</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleBuyNowClick(item, e)}
                      aria-label={`Buy Now: ${item.title}`}
                      className="flex-1 py-2 px-2.5 rounded-lg bg-gradient-to-r from-brand-sunriseCoral to-brand-goldenHour hover:brightness-110 text-slate-950 font-black text-[11px] transition-all shadow min-h-[44px] flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Buy Now</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 1-Click Instant Checkout Modal */}
      {activeCheckoutProduct && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="instant-checkout-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-twilight/80 backdrop-blur-md animate-fadeIn"
          onClick={() => setActiveCheckoutProduct(null)}
        >
          <div
            className="bg-brand-dusk border border-slate-800 rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-4 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setActiveCheckoutProduct(null)}
              aria-label="Close instant checkout"
              className="absolute top-4 right-4 p-2 rounded-full text-brand-sandstone/60 hover:text-white hover:bg-slate-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="p-2.5 rounded-2xl bg-brand-sunriseCoral/20 text-brand-sunriseCoral border border-brand-sunriseCoral/30">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h3 id="instant-checkout-title" className="font-black text-base text-white">
                  Tukubi Instant Checkout
                </h3>
                <p className="text-xs text-brand-sandstone/70">
                  Sold by {activeCheckoutProduct.sellerName || 'Caribbean Artisan'}
                </p>
              </div>
            </div>

            {actionState.success ? (
              <div className="py-6 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-7 h-7" />
                </div>
                <h4 className="text-lg font-black text-white">Order Confirmed!</h4>
                <p className="text-xs text-slate-300">{actionState.success}</p>
                <div className="text-[11px] text-emerald-400 font-bold bg-emerald-950/40 border border-emerald-800/40 px-3 py-1.5 rounded-full inline-block">
                  Protected by TUKUBI 30-Day Escrow Guarantee
                </div>
              </div>
            ) : (
              <form onSubmit={handleExecuteCheckout} className="space-y-4">
                {actionState.error && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
                    {actionState.error}
                  </div>
                )}

                {/* Product Summary & Quantity Selector */}
                <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-black text-white truncate max-w-[240px]">
                      {activeCheckoutProduct.title}
                    </div>
                    <div className="text-sm font-black text-brand-sunriseCoral">
                      {formatProductPrice(unitPriceMinor, currency)}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-300 pt-2 border-t border-slate-800">
                    <span className="font-bold">Quantity</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        aria-label="Decrease quantity"
                        className="w-8 h-8 rounded-lg bg-slate-800 text-white font-bold hover:bg-slate-700 flex items-center justify-center min-h-[44px] min-w-[44px]"
                      >
                        -
                      </button>
                      <span className="w-6 text-center font-black text-white text-sm">{quantity}</span>
                      <button
                        type="button"
                        onClick={() => setQuantity(Math.min(10, quantity + 1))}
                        aria-label="Increase quantity"
                        className="w-8 h-8 rounded-lg bg-slate-800 text-white font-bold hover:bg-slate-700 flex items-center justify-center min-h-[44px] min-w-[44px]"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Shipping Address Entry */}
                <div className="space-y-1.5">
                  <label htmlFor="checkout-shipping" className="text-xs font-bold text-brand-sandstone">
                    Shipping Address / Delivery Island
                  </label>
                  <input
                    id="checkout-shipping"
                    type="text"
                    required
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    placeholder="e.g. 12 Hope Road, Kingston, Jamaica"
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-sunriseCoral min-h-[44px]"
                  />
                </div>

                {/* Escrow Notice */}
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-bold block text-amber-300">TUKUBI 30-Day Escrow Guarantee</span>
                    <p className="text-[11px] text-amber-200/80 leading-relaxed">
                      Your payment is held in escrow until delivery is verified or confirmed. 100% dispute protection.
                    </p>
                  </div>
                </div>

                {/* Total Calculation */}
                <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal ({quantity} items):</span>
                    <span className="font-bold text-white">
                      {formatProductPrice(subtotalMinor, currency)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Escrow & Logistics Fee (8%):</span>
                    <span className="font-bold text-slate-300">
                      {formatProductPrice(escrowFeeMinor, currency)}
                    </span>
                  </div>
                  <div className="border-t border-slate-800 pt-1.5 flex justify-between font-black text-sm text-white">
                    <span>Total via Instant Escrow:</span>
                    <span className="text-brand-sunriseCoral">
                      {formatProductPrice(grandTotalMinor, currency)}
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-brand-sunriseCoral to-brand-goldenHour font-black text-slate-950 text-xs uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-brand-sunriseCoral/20 min-h-[44px] cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Authorizing Escrow Settlement...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" /> 1-Click Pay{' '}
                      {formatProductPrice(grandTotalMinor, currency)}
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
