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
  MapPin,
  Store,
  ChevronUp,
} from 'lucide-react';
import {
  type TaggedProductSummary,
  formatProductPrice,
} from '@caribbean/marketplace';
import { DEFAULT_CARIBBEAN_PRODUCTS } from './product-tagging-tray';
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

export interface ShoppableReelBadgeProps {
  products?: TaggedProductSummary[];
  productIds?: string[];
  onAddToCart?: (product: TaggedProductSummary) => void;
  onBuyNow?: (product: TaggedProductSummary) => void;
  className?: string;
}

/**
 * Resolves tagged product summaries from either direct products array or product ID list.
 */
export function resolveReelProducts({
  products,
  productIds,
}: {
  products?: TaggedProductSummary[];
  productIds?: string[];
}): TaggedProductSummary[] {
  if (products && products.length > 0) {
    return products;
  }
  if (productIds && productIds.length > 0) {
    const list: TaggedProductSummary[] = [];
    for (const id of productIds) {
      const match = DEFAULT_CARIBBEAN_PRODUCTS.find((p) => p.id === id);
      if (match) {
        list.push(match);
      } else {
        list.push({
          id,
          title: `Featured Product (${id})`,
          priceMinor: 2500,
          currency: 'USD',
          originTerritory: 'Caribbean',
          originCountry: 'Caribbean',
          sellerName: 'Caribbean Artisan',
          isAvailable: true,
        });
      }
    }
    return list;
  }
  return [];
}

export default function ShoppableReelBadge({
  products,
  productIds,
  onAddToCart,
  onBuyNow,
  className = '',
}: ShoppableReelBadgeProps) {
  const resolvedProducts = resolveReelProducts({ products, productIds });

  const [isDrawerOpen, setIsDrawerOpen] = useSafeState<boolean>(false);
  const [activeCheckoutProduct, setActiveCheckoutProduct] = useSafeState<TaggedProductSummary | null>(null);
  const [quantity, setQuantity] = useSafeState<number>(1);
  const [shippingAddress, setShippingAddress] = useSafeState<string>('');
  const [isSubmitting, setIsSubmitting] = useSafeState<boolean>(false);
  const [actionState, setActionState] = useSafeState<MarketplaceActionState>({ error: null, success: null });
  const [addedIds, setAddedIds] = useSafeState<Record<string, boolean>>({});

  // Escape key closes drawer or checkout modal
  useSafeEffect(() => {
    if (!isDrawerOpen && !activeCheckoutProduct) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activeCheckoutProduct) {
          setActiveCheckoutProduct(null);
        } else {
          setIsDrawerOpen(false);
        }
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isDrawerOpen, activeCheckoutProduct]);

  if (resolvedProducts.length === 0) {
    return null;
  }

  // Calculate lowest price for badge display
  const lowestPriceMinor = Math.min(...resolvedProducts.map((p) => p.priceMinor));
  const primaryCurrency = resolvedProducts[0]?.currency || 'USD';
  const formattedLowestPrice = formatProductPrice(lowestPriceMinor, primaryCurrency);

  const handleAddToCart = (p: TaggedProductSummary, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setAddedIds((prev) => ({ ...prev, [p.id]: true }));

    if (typeof window !== 'undefined') {
      try {
        const existing = JSON.parse(window.localStorage.getItem('tukubi_cart') || '[]');
        const updated = [...existing.filter((i: any) => i.id !== p.id), { ...p, quantity: 1 }];
        window.localStorage.setItem('tukubi_cart', JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('tukubi:cart:add', { detail: { product: p } }));
      } catch {
        // Fallback
      }
    }

    if (onAddToCart) {
      onAddToCart(p);
    }

    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [p.id]: false }));
    }, 2000);
  };

  const handleOpenBuyNow = (p: TaggedProductSummary, e?: React.MouseEvent) => {
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
        error: err?.message || 'Order failed. Please retry.',
        success: null,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Checkout modal calculations
  const unitPriceMinor = activeCheckoutProduct?.priceMinor || 0;
  const currency = activeCheckoutProduct?.currency || 'USD';
  const subtotalMinor = unitPriceMinor * quantity;
  const escrowFeeMinor = Math.round(subtotalMinor * 0.08);
  const grandTotalMinor = subtotalMinor + escrowFeeMinor;

  return (
    <>
      {/* Floating Pill Badge positioned at bottom-left */}
      <div className={`relative z-20 ${className}`}>
        <button
          type="button"
          onClick={() => setIsDrawerOpen(true)}
          aria-label={`Featured Goods (${resolvedProducts.length}) • From ${formattedLowestPrice}. Click to view products`}
          className="group flex items-center gap-2 px-3.5 py-2 rounded-full bg-black/75 hover:bg-black/90 backdrop-blur-md border border-white/20 hover:border-brand-sunriseCoral/60 text-white shadow-xl transition-all active:scale-95 min-h-[44px] cursor-pointer"
        >
          <div className="w-6 h-6 rounded-full bg-brand-sunriseCoral/20 text-brand-sunriseCoral border border-brand-sunriseCoral/40 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-3.5 h-3.5" />
          </div>
          <div className="text-xs font-black tracking-wide flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-brand-sandstone">Featured Goods ({resolvedProducts.length})</span>
            <span className="text-white/40">•</span>
            <span className="text-brand-sunriseCoral">From {formattedLowestPrice}</span>
          </div>
          <ChevronUp className="w-3.5 h-3.5 text-white/60 group-hover:text-white transition-transform group-hover:-translate-y-0.5" />
        </button>
      </div>

      {/* Animated Bottom Sheet Drawer */}
      {isDrawerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Shoppable Reel Products"
          className="fixed inset-0 z-50 flex flex-col justify-end bg-black/70 backdrop-blur-sm animate-fadeIn"
          onClick={() => setIsDrawerOpen(false)}
        >
          <div
            className="w-full max-w-lg mx-auto bg-[#0D1322] border-t border-slate-800 rounded-t-3xl p-5 sm:p-6 shadow-2xl max-h-[85vh] flex flex-col relative text-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Handle & Header */}
            <div className="flex flex-col items-center pb-3 border-b border-slate-800">
              <div className="w-12 h-1.5 rounded-full bg-slate-700 mb-3" />
              <div className="w-full flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-brand-sunriseCoral/20 text-brand-sunriseCoral border border-brand-sunriseCoral/30 flex items-center justify-center">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white flex items-center gap-1.5">
                      <span>Featured Goods</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-brand-sandstone font-bold">
                        {resolvedProducts.length}
                      </span>
                    </h3>
                    <p className="text-[11px] text-brand-sandstone/70">
                      Authentic items tagged in this Caribbean Reel
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  aria-label="Close products drawer"
                  className="p-2 rounded-full text-brand-sandstone/60 hover:text-white hover:bg-slate-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Tagged Goods List */}
            <div className="flex-1 overflow-y-auto py-4 space-y-3.5 scrollbar-none">
              {resolvedProducts.map((item) => {
                const isAdded = Boolean(addedIds[item.id]);
                return (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl bg-brand-dusk/90 border border-slate-800 hover:border-brand-sunriseCoral/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md"
                  >
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
                        <div className="text-sm font-black text-white truncate max-w-[200px] sm:max-w-xs">
                          {item.title}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {item.sellerName && (
                            <span className="text-[11px] text-brand-sandstone/70 flex items-center gap-1">
                              <Store className="w-3 h-3 text-slate-400" />
                              {item.sellerName}
                            </span>
                          )}
                          {(item.originTerritory || item.originCountry) && (
                            <span className="px-2 py-0.5 rounded-full bg-brand-caribbeanSea/20 border border-brand-caribbeanSea/30 text-[10px] font-bold text-brand-caribbeanSea flex items-center gap-0.5">
                              <MapPin className="w-2.5 h-2.5" />
                              {item.originTerritory || item.originCountry}
                            </span>
                          )}
                        </div>
                        <div className="text-sm font-black text-brand-sunriseCoral">
                          {formatProductPrice(item.priceMinor, item.currency)}
                        </div>
                      </div>
                    </div>

                    {/* Dual Action Buttons */}
                    <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0">
                      <button
                        type="button"
                        onClick={(e) => handleAddToCart(item, e)}
                        aria-label={`Add ${item.title} to Cart`}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 min-h-[44px] min-w-[44px] cursor-pointer ${
                          isAdded
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-white/10 hover:bg-white/15 text-white border border-white/10'
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
                        onClick={(e) => handleOpenBuyNow(item, e)}
                        aria-label={`Buy Now: ${item.title}`}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-sunriseCoral to-brand-goldenHour hover:brightness-110 text-slate-950 font-black text-xs transition-all shadow-md active:scale-95 min-h-[44px] min-w-[44px] flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Buy Now</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Escrow Banner inside Drawer */}
            <div className="pt-3 border-t border-slate-800 text-[11px] text-brand-sandstone/70 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-amber-300 font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                TUKUBI 30-Day Escrow Guarantee
              </span>
              <span>Secure Cross-Island Settlement</span>
            </div>
          </div>
        </div>
      )}

      {/* 1-Click Instant Checkout Modal from Drawer */}
      {activeCheckoutProduct && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="reel-instant-checkout-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-twilight/80 backdrop-blur-md animate-fadeIn"
          onClick={() => setActiveCheckoutProduct(null)}
        >
          <div
            className="bg-brand-dusk border border-slate-800 rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-4 relative text-white"
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
                <h3 id="reel-instant-checkout-title" className="font-black text-base text-white">
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
                  <label htmlFor="reel-checkout-shipping" className="text-xs font-bold text-brand-sandstone">
                    Shipping Address / Delivery Island
                  </label>
                  <input
                    id="reel-checkout-shipping"
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
    </>
  );
}
