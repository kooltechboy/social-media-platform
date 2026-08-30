'use client';

import React, { useState } from 'react';
import { ShoppingBag, Sparkles, X, ShieldCheck, CheckCircle, Loader2, ArrowRight, Star } from 'lucide-react';
import { createOrderAction, type MarketplaceActionState } from '../lib/marketplace/actions';

export interface TaggedProduct {
  id: string;
  title: string;
  priceMinor: number;
  currency: string;
  sellerName: string;
  sellerAvatar?: string;
  origin?: string;
  rating?: number;
  image?: string;
}

interface ShoppablePostWidgetProps {
  product: TaggedProduct;
}

export default function ShoppablePostWidget({ product }: ShoppablePostWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [state, setState] = useState<MarketplaceActionState>({ error: null, success: null });

  const priceDecimal = product.priceMinor / 100;
  const subtotal = priceDecimal * quantity;
  const platformFee = Math.round(subtotal * 0.08 * 100) / 100; // 8% marketplace fee
  const total = (subtotal + platformFee).toFixed(2);

  async function handleBuy(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setState({ error: null, success: null });

    const formData = new FormData();
    formData.append('productId', product.id);
    formData.append('quantity', String(quantity));

    try {
      const res = await createOrderAction({ error: null, success: null }, formData);
      setState(res);
      if (res.success) {
        setTimeout(() => {
          setIsOpen(false);
          setState({ error: null, success: null });
        }, 3000);
      }
    } catch (err: any) {
      setState({ error: err.message || 'Order failed', success: null });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      {/* Embedded Shoppable Pill on Feed Post */}
      <div className="mt-3 p-3 rounded-2xl bg-gradient-to-r from-brand-dusk/90 via-slate-900/90 to-brand-dusk/90 border border-brand-sunriseCoral/30 shadow-md flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-brand-sunriseCoral/20 text-brand-sunriseCoral border border-brand-sunriseCoral/30 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase text-brand-goldenHour tracking-wider flex items-center gap-0.5">
                <Sparkles className="w-2.5 h-2.5" /> Shoppable Post
              </span>
              {product.origin && (
                <span className="text-[10px] text-slate-400">&bull; {product.origin}</span>
              )}
            </div>
            <div className="text-xs font-black text-white truncate">{product.title}</div>
            <div className="text-[11px] text-slate-300 font-bold">
              ${priceDecimal.toFixed(2)} {product.currency}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="shrink-0 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-brand-sunriseCoral to-brand-goldenHour hover:opacity-90 font-black text-white text-xs shadow-md shadow-brand-sunriseCoral/20 transition-all hover:scale-105 flex items-center gap-1"
        >
          <span>Buy Now</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 1-Click Instant Checkout Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-twilight/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-brand-dusk border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 relative">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-brand-sandstone/60 hover:text-brand-sandstone hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="p-2.5 rounded-2xl bg-brand-sunriseCoral/20 text-brand-sunriseCoral border border-brand-sunriseCoral/30">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-base text-white">Instant Tukubi Checkout</h3>
                <p className="text-xs text-slate-400">Sold by {product.sellerName}</p>
              </div>
            </div>

            {state.success ? (
              <div className="py-6 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-7 h-7" />
                </div>
                <h4 className="text-lg font-black text-white">Order Confirmed!</h4>
                <p className="text-xs text-slate-300">{state.success}</p>
                <div className="text-[10px] text-emerald-400 font-bold bg-emerald-950/40 border border-emerald-800/40 px-3 py-1.5 rounded-full inline-block">
                  Escrow Secured &bull; Seller Dispatched via Secure Logistics
                </div>
              </div>
            ) : (
              <form onSubmit={handleBuy} className="space-y-4">
                {state.error && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
                    {state.error}
                  </div>
                )}

                <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <div className="text-sm font-black text-white">{product.title}</div>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Unit Price:</span>
                    <span className="font-bold text-white">${priceDecimal.toFixed(2)} {product.currency}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-300 pt-2 border-t border-slate-800">
                    <span className="font-bold">Quantity:</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-7 h-7 rounded-lg bg-slate-800 text-white font-bold hover:bg-slate-700 flex items-center justify-center"
                      >
                        -
                      </button>
                      <span className="w-6 text-center font-black text-white">{quantity}</span>
                      <button
                        type="button"
                        onClick={() => setQuantity(Math.min(10, quantity + 1))}
                        className="w-7 h-7 rounded-lg bg-slate-800 text-white font-bold hover:bg-slate-700 flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal ({quantity} items):</span>
                    <span className="font-bold text-white">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Marketplace Guarantee & Escrow (8%):</span>
                    <span className="font-bold text-slate-300">${platformFee.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-slate-800 pt-1.5 flex justify-between font-black text-white">
                    <span>Total via Secure Checkout:</span>
                    <span className="text-brand-sunriseCoral">${total} {product.currency}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-brand-sunriseCoral to-brand-goldenHour font-black text-white text-xs uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-brand-sunriseCoral/20"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Authorizing Escrow Settlement...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" /> 1-Click Pay ${total} {product.currency}
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
