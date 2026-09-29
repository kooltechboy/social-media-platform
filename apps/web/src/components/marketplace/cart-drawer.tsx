'use client';
/* eslint-disable react-hooks/rules-of-hooks */

import React, { useState, useMemo } from 'react';
import {
  ShoppingBag,
  X,
  Plus,
  Minus,
  Trash2,
  Lock,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Store,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import {
  type CartLine,
  computeMultiSellerOrderTotals,
  groupCartBySeller,
} from '@caribbean/marketplace';
import { Money, isMarketplaceCommerceActive } from '@caribbean/payments';
import Link from 'next/link';
import { ComingSoonButton } from '../ui/coming-soon-badge';
import OrderEscrowBadge from '../commerce/order-escrow-badge';
import { placeOrderWithEscrowAction } from '../../lib/commerce/actions';
import { clearCart } from '../../lib/commerce/cart-store';

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

function useSafeMemo<T>(factory: () => T, deps: React.DependencyList): T {
  const internals =
    (React as any)?.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE ||
    (React as any)?.__SECRET_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
  const dispatcher = internals?.H || internals?.ReactCurrentDispatcher?.current;

  if (dispatcher) {
    return React.useMemo<T>(factory, deps);
  }
  return factory();
}

function useSafeEffect(effect: React.EffectCallback, deps?: React.DependencyList): void {
  const internals =
    (React as any)?.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE ||
    (React as any)?.__SECRET_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
  const dispatcher = internals?.H || internals?.ReactCurrentDispatcher?.current;

  if (dispatcher && typeof React.useEffect === 'function') {
    React.useEffect(effect, deps);
  }
}

export interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  lines: CartLine[];
  onUpdateQuantity: (productId: string, variantId: string | undefined, quantity: number) => void;
  onRemoveLine: (productId: string, variantId: string | undefined) => void;
  onProceedToCheckout?: () => void;
  onCheckoutSuccess?: (orderId: string) => void;
  buyerId?: string;
  shippingAddress?: Record<string, unknown>;
}

export default function CartDrawer({
  isOpen,
  onClose,
  lines,
  onUpdateQuantity,
  onRemoveLine,
  onProceedToCheckout,
  onCheckoutSuccess,
  buyerId,
  shippingAddress,
}: CartDrawerProps) {
  const canTransact = isMarketplaceCommerceActive();
  const [isSubmitting, setIsSubmitting] = useSafeState(false);
  const [checkoutError, setCheckoutError] = useSafeState<string | null>(null);
  const [successOrderId, setSuccessOrderId] = useSafeState<string | null>(null);

  const { grandTotal, sellerBreakdown } = useSafeMemo(() => {
    return computeMultiSellerOrderTotals(lines, {
      processingFeeBps: 290,
      processingFixedMinor: 30,
    });
  }, [lines]);

  const currency = lines[0]?.productKind ? 'USD' : 'USD';
  const totalMoney = new Money(grandTotal.totalMinor, currency);
  const subtotalMoney = new Money(grandTotal.subtotalMinor, currency);
  const feeMoney = new Money(grandTotal.processingFeeMinor || 0, currency);

  const handleCheckoutClick = async () => {
    if (onProceedToCheckout) {
      onProceedToCheckout();
      return;
    }

    if (lines.length === 0) return;

    setIsSubmitting(true);
    setCheckoutError(null);

    try {
      const firstSellerId = Object.keys(sellerBreakdown)[0];
      const res = await placeOrderWithEscrowAction({
        sellerId: firstSellerId,
        items: lines.map((l) => ({
          productId: l.productId,
          variantId: l.variantId,
          quantity: l.quantity,
          unitPriceMinor: l.unitPriceMinor,
          lineTotalMinor: l.unitPriceMinor * l.quantity,
        })),
        subtotalMinor: grandTotal.subtotalMinor,
        platformFeeMinor: grandTotal.platformFeeMinor,
        totalMinor: grandTotal.totalMinor,
        currency: 'USD',
        shippingAddress,
      });

      if (res.success && res.orderId) {
        setSuccessOrderId(res.orderId);
        clearCart();
        if (onCheckoutSuccess) {
          onCheckoutSuccess(res.orderId);
        }
      } else {
        setCheckoutError(res.error || 'Failed to place escrow order.');
      }
    } catch (err: any) {
      setCheckoutError(err?.message || 'An unexpected error occurred during escrow checkout.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Escape key and modal accessibility
  useSafeEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cart-drawer-title"
      className="fixed inset-0 z-50 overflow-hidden animate-fadeIn"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-brand-twilight/80 backdrop-blur-sm transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-brand-dusk border-l border-slate-800 shadow-2xl p-6 flex flex-col justify-between relative">
          {/* Header */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="w-5 h-5 text-orange-400" />
                <h2 id="cart-drawer-title" className="text-base font-black text-white">Your Shopping Cart</h2>
                <span className="text-xs text-slate-400 font-semibold">({lines.length})</span>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close shopping cart"
                className="min-h-[44px] min-w-[44px] p-2.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Pre-launch Notification */}
            {!canTransact && (
              <div className="p-3.5 rounded-2xl bg-orange-500/10 border border-orange-500/30 text-orange-200 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-orange-300">
                  <Calendar className="w-3.5 h-3.5 text-orange-400" />
                  <span>Marketplace Launch: September 30, 2026</span>
                </div>
                <p className="text-[11px] text-orange-200/80 leading-relaxed">
                  Transactions begin September 30. Your selections are preserved for launch day.
                </p>
              </div>
            )}
          </div>

          {/* Cart Items List or Success State */}
          <div className="flex-1 overflow-y-auto py-4 space-y-5 scrollbar-none">
            {successOrderId ? (
              <div role="status" aria-live="polite" className="py-12 px-2 text-center space-y-4 animate-fadeIn">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-black text-white">Order Confirmed!</h3>
                  <p className="text-xs text-slate-400">
                    Order ID: <span className="font-mono text-amber-400">{successOrderId}</span>
                  </p>
                </div>
                <div className="text-left pt-2">
                  <OrderEscrowBadge status="held" variant="card" createdAt={new Date().toISOString()} />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSuccessOrderId(null);
                    onClose();
                  }}
                  className="w-full mt-4 min-h-[44px] min-w-[44px] py-3 rounded-2xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-black text-xs transition-colors cursor-pointer"
                >
                  Continue Shopping
                </button>
              </div>
            ) : lines.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <ShoppingBag className="w-12 h-12 text-slate-600 mx-auto" />
                <h3 className="text-sm font-bold text-white">Your cart is currently empty</h3>
                <p className="text-xs text-brand-sandstone/60 max-w-xs mx-auto">
                  Explore Caribbean craft, music, fashion, and artisanal food to add items to your cart.
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-2 min-h-[44px] min-w-[44px] px-4 py-2 rounded-xl bg-orange-500 text-slate-950 font-black text-xs cursor-pointer"
                >
                  Explore Marketplace
                </button>
              </div>
            ) : (
              Object.entries(sellerBreakdown).map(([sellerId, { lines: sellerLines, totals }]) => (
                <div
                  key={sellerId}
                  className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 space-y-3"
                >
                  {/* Seller Header */}
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800/60">
                    <span className="font-bold text-slate-300 flex items-center gap-1.5">
                      <Store className="w-3.5 h-3.5 text-orange-400" />
                      <span>{sellerLines[0]?.sellerName || 'Caribbean Merchant'}</span>
                    </span>
                    <span className="text-[10px] text-emerald-400 font-semibold">Verified Seller</span>
                  </div>

                  {/* Lines for this seller */}
                  <div className="space-y-3">
                    {sellerLines.map((line) => {
                      const linePrice = new Money(line.unitPriceMinor * line.quantity, currency);
                      return (
                        <div
                          key={`${line.productId}-${line.variantId || 'base'}`}
                          className="flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-white truncate">
                              {line.productTitle || 'Caribbean Product'}
                            </h4>
                            {line.variantTitle && (
                              <p className="text-[10px] text-brand-sunriseCoral truncate">
                                Option: {line.variantTitle}
                              </p>
                            )}
                            <div className="text-[11px] font-semibold text-slate-400 mt-0.5">
                              {linePrice.format()}
                            </div>
                          </div>

                          {/* Quantity Selector */}
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              aria-label={`Decrease quantity of ${line.productTitle || 'item'}`}
                              onClick={() =>
                                onUpdateQuantity(
                                  line.productId,
                                  line.variantId,
                                  Math.max(1, line.quantity - 1)
                                )
                              }
                              className="min-h-[44px] min-w-[44px] rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center cursor-pointer"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="font-bold text-white w-4 text-center">
                              {line.quantity}
                            </span>
                            <button
                              type="button"
                              aria-label={`Increase quantity of ${line.productTitle || 'item'}`}
                              onClick={() =>
                                onUpdateQuantity(line.productId, line.variantId, line.quantity + 1)
                              }
                              className="min-h-[44px] min-w-[44px] rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              aria-label={`Remove ${line.productTitle || 'item'} from cart`}
                              onClick={() => onRemoveLine(line.productId, line.variantId)}
                              className="min-h-[44px] min-w-[44px] p-2.5 text-slate-500 hover:text-rose-400 transition-colors ml-1 flex items-center justify-center cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Totals */}
          {lines.length > 0 && !successOrderId && (
            <div className="pt-4 border-t border-slate-800 space-y-4">
              <div className="space-y-1.5 text-xs text-slate-400">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-white font-semibold">{subtotalMoney.format()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Processing Fee</span>
                  <span className="text-slate-300">{feeMoney.format()}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-white pt-2 border-t border-slate-800">
                  <span>Grand Total</span>
                  <span className="text-brand-sunriseCoral">{totalMoney.format()} USD</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Backed by TUKUBI 30-Day Escrow Guarantee</span>
                </div>
                <OrderEscrowBadge status="held" variant="pill" />
              </div>

              {checkoutError && (
                <div role="status" aria-live="polite" className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                  {checkoutError}
                </div>
              )}

              {canTransact || onProceedToCheckout ? (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleCheckoutClick}
                  className="w-full bg-gradient-to-r from-brand-sunriseCoral via-orange-500 to-brand-goldenHour hover:brightness-110 active:scale-[0.98] text-slate-950 font-black py-3 px-4 rounded-2xl text-xs sm:text-sm min-h-[44px] flex items-center justify-center gap-2 transition-all shadow-md shadow-brand-sunriseCoral/20 disabled:opacity-60 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 text-slate-950 animate-spin" />
                      <span>Securing Escrow...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 text-slate-950" />
                      <span>Proceed to Secure Checkout</span>
                      <ArrowRight className="w-4 h-4 text-slate-950" />
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-orange-400 border border-orange-500/30 font-black py-3 rounded-2xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Calendar className="w-4 h-4" />
                  Transactions Begin Sept 30 — Close Cart
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
