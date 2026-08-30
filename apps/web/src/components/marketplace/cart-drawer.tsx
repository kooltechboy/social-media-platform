'use client';

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
} from 'lucide-react';
import {
  type CartLine,
  computeMultiSellerOrderTotals,
  groupCartBySeller,
} from '@caribbean/marketplace';
import { Money, isMarketplaceCommerceActive } from '@caribbean/payments';
import Link from 'next/link';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  lines: CartLine[];
  onUpdateQuantity: (productId: string, variantId: string | undefined, quantity: number) => void;
  onRemoveLine: (productId: string, variantId: string | undefined) => void;
  onProceedToCheckout?: () => void;
}

export default function CartDrawer({
  isOpen,
  onClose,
  lines,
  onUpdateQuantity,
  onRemoveLine,
  onProceedToCheckout,
}: CartDrawerProps) {
  const canTransact = isMarketplaceCommerceActive();

  const { grandTotal, sellerBreakdown } = useMemo(() => {
    return computeMultiSellerOrderTotals(lines, {
      processingFeeBps: 290,
      processingFixedMinor: 30,
    });
  }, [lines]);

  const currency = lines[0]?.productKind ? 'USD' : 'USD';
  const totalMoney = new Money(grandTotal.totalMinor, currency);
  const subtotalMoney = new Money(grandTotal.subtotalMinor, currency);
  const feeMoney = new Money(grandTotal.processingFeeMinor || 0, currency);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fadeIn">
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
                <h2 className="text-base font-black text-white">Your Shopping Cart</h2>
                <span className="text-xs text-slate-400 font-semibold">({lines.length})</span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
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

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto py-4 space-y-5 scrollbar-none">
            {lines.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <ShoppingBag className="w-12 h-12 text-slate-600 mx-auto" />
                <h3 className="text-sm font-bold text-white">Your cart is currently empty</h3>
                <p className="text-xs text-brand-sandstone/60 max-w-xs mx-auto">
                  Explore Caribbean craft, music, fashion, and artisanal food to add items to your cart.
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-2 px-4 py-2 rounded-xl bg-orange-500 text-slate-950 font-black text-xs cursor-pointer"
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
                              onClick={() =>
                                onUpdateQuantity(
                                  line.productId,
                                  line.variantId,
                                  Math.max(1, line.quantity - 1)
                                )
                              }
                              className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="font-bold text-white w-4 text-center">
                              {line.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                onUpdateQuantity(line.productId, line.variantId, line.quantity + 1)
                              }
                              className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onRemoveLine(line.productId, line.variantId)}
                              className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors ml-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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
          {lines.length > 0 && (
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

              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 justify-center">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Backed by TUKUBI 30-Day Escrow Guarantee</span>
              </div>

              {canTransact ? (
                <button
                  type="button"
                  onClick={onProceedToCheckout}
                  className="w-full bg-gradient-to-r from-orange-500 to-brand-goldenHour hover:from-orange-400 hover:to-brand-goldenHour text-slate-950 font-black py-3 rounded-2xl text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-orange-500/20 cursor-pointer"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
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
