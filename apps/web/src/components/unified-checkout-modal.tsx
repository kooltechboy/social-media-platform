'use client';

import React, { useState, useTransition } from 'react';
import {
  CreditCard,
  CheckCircle,
  X,
  ShieldCheck,
  Lock,
  Loader2,
  ArrowRight,
  Building2,
  Globe,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { Money, isMarketplaceCommerceActive } from '@caribbean/payments';
import { createOrderAction, type MarketplaceActionState } from '../lib/marketplace/actions';

export interface UnifiedCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: string;
    title: string;
    priceMinor: number;
    currency: string;
    sellerName: string;
    productKind: 'physical' | 'digital' | 'service';
    origin?: string;
  };
  creatorReferralCode?: string;
}

type PaymentMethodType = 'paypal' | 'card' | 'wipay' | 'cxpay' | 'apple_pay' | 'google_pay';

export default function UnifiedCheckoutModal({
  isOpen,
  onClose,
  product,
  creatorReferralCode,
}: UnifiedCheckoutModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>('paypal');
  const [quantity, setQuantity] = useState(1);
  const [shippingAddress, setShippingAddress] = useState({
    fullName: '',
    addressLine: '',
    city: '',
    country: '',
  });

  const [state, setState] = useState<MarketplaceActionState>({ error: null, success: null });
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  const canTransact = isMarketplaceCommerceActive();

  const unitPrice = new Money(product.priceMinor, product.currency);
  const subtotalMinor = product.priceMinor * quantity;
  const subtotal = new Money(subtotalMinor, product.currency);

  // Standard pass-through payment processing fee (2.9% + 30¢)
  const processingFeeMinor = Math.round((subtotalMinor * 290) / 10000) + 30;
  const processingFee = new Money(processingFeeMinor, product.currency);

  const totalMinor = subtotalMinor + processingFeeMinor;
  const total = new Money(totalMinor, product.currency);

  function handleCompletePayment(e: React.FormEvent) {
    e.preventDefault();
    if (!canTransact) {
      setState({
        error:
          'Marketplace transactions officially begin September 30, 2026. You can explore stores and products now. Purchasing will be available when marketplace commerce launches.',
        success: null,
      });
      return;
    }

    const formData = new FormData();
    formData.set('productId', product.id);
    formData.set('quantity', String(quantity));
    formData.set('paymentProvider', selectedMethod);
    if (creatorReferralCode) {
      formData.set('creatorReferralCode', creatorReferralCode);
    }
    if (product.productKind === 'physical') {
      formData.set('shippingAddress', JSON.stringify(shippingAddress));
    }

    startTransition(async () => {
      const res = await createOrderAction({ error: null, success: null }, formData);
      setState(res);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-twilight/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-brand-dusk border border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-6 relative max-h-[92vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {state.orderId ? (
          <div className="py-8 text-center space-y-4 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
              <CheckCircle className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-white">Order Placed Successfully!</h3>
              <p className="text-xs text-slate-300">
                Order <strong className="text-brand-sunriseCoral">#{state.orderId.slice(0, 8)}</strong> placed with TUKUBI buyer protection.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-2 text-left">
              <div className="flex justify-between">
                <span className="text-slate-400">Item:</span>
                <span className="font-bold text-white">{product.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total:</span>
                <span className="font-bold text-emerald-400">{total.format()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Payment Method:</span>
                <span className="capitalize font-bold text-brand-goldenHour">{selectedMethod.replace('_', ' ')}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="bg-brand-sunriseCoral hover:bg-brand-sunriseCoral/90 text-slate-950 font-black px-6 py-2.5 rounded-2xl text-xs transition-all shadow-md shadow-brand-sunriseCoral/20 cursor-pointer"
            >
              Done / Return to Marketplace
            </button>
          </div>
        ) : (
          <form onSubmit={handleCompletePayment} className="space-y-5">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-brand-sunriseCoral uppercase tracking-widest">
                  TUKUBI Marketplace
                </span>
                <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                  <Lock className="w-3 h-3 text-emerald-400" />
                  <span>256-bit Encrypted</span>
                </span>
              </div>
              <h2 className="text-xl font-black text-white mt-0.5">{product.title}</h2>
              <p className="text-xs text-slate-400">Sold by {product.sellerName} • {product.origin || 'Caribbean'}</p>
            </div>

            {/* Pre-launch notification banner (Directive 9, 10, 17) */}
            {!canTransact && (
              <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/30 text-orange-200 text-xs space-y-2">
                <div className="flex items-center gap-2 font-black text-orange-400 text-sm">
                  <Calendar className="w-4 h-4" />
                  <span>Marketplace Transactions Launch September 30, 2026</span>
                </div>
                <p className="text-[11px] leading-relaxed text-orange-200/90 font-medium">
                  Merchants can create their stores, add products and services, and prepare their businesses now. Buyer and seller transactions will officially begin September 30, 2026.
                </p>
                <p className="text-[11px] text-orange-300 font-semibold">
                  You can explore stores and products now. Purchasing will be available when marketplace commerce launches.
                </p>
              </div>
            )}

            {/* Order Summary Box */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">Quantity</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={!canTransact}
                    className="w-6 h-6 rounded bg-slate-800 text-white font-bold flex items-center justify-center hover:bg-slate-700 cursor-pointer disabled:opacity-50"
                  >
                    -
                  </button>
                  <span className="font-bold text-white w-4 text-center">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.min(10, quantity + 1))}
                    disabled={!canTransact}
                    className="w-6 h-6 rounded bg-slate-800 text-white font-bold flex items-center justify-center hover:bg-slate-700 cursor-pointer disabled:opacity-50"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 border-t border-slate-800/80 pt-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Product Subtotal ({quantity} item{quantity > 1 ? 's' : ''})</span>
                  <span className="text-white font-semibold">{subtotal.format()}</span>
                </div>
                {product.productKind === 'physical' && (
                  <div className="flex justify-between text-slate-400">
                    <span>Shipping &amp; Handling</span>
                    <span className="text-emerald-400 font-semibold">Free Caribbean Standard</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-400">
                  <span>Pass-Through Processing Fee</span>
                  <span className="text-slate-300 font-semibold">{processingFee.format()}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-white pt-1 border-t border-slate-800">
                  <span>Total at Checkout</span>
                  <span className="text-brand-sunriseCoral">{total.format()} {product.currency}</span>
                </div>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-200 block">Payment Method Options</label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* PayPal (Primary supported payment path) */}
                <div
                  onClick={() => setSelectedMethod('paypal')}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    selectedMethod === 'paypal'
                      ? 'bg-slate-800 border-blue-400 text-white shadow-md ring-1 ring-blue-400/50'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Globe className="w-4 h-4 text-blue-400" />
                    <div>
                      <div className="text-xs font-bold">PayPal</div>
                      <div className="text-[10px] text-slate-400">Primary Payment Path</div>
                    </div>
                  </div>
                  <span className="text-[10px] text-blue-400 font-bold bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/30">
                    Primary
                  </span>
                </div>

                {/* Credit / Debit Card (Stripe) */}
                <div
                  onClick={() => setSelectedMethod('card')}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    selectedMethod === 'card'
                      ? 'bg-slate-800 border-brand-sunriseCoral text-white shadow-md ring-1 ring-brand-sunriseCoral/50'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <CreditCard className="w-4 h-4 text-brand-sunriseCoral" />
                    <div>
                      <div className="text-xs font-bold">Credit / Debit Card</div>
                      <div className="text-[10px] text-slate-400">Visa, Mastercard</div>
                    </div>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-semibold">Active</span>
                </div>

                {/* Apple Pay (Coming Soon) */}
                <div className="p-3.5 rounded-2xl border border-slate-800/60 bg-slate-900/30 text-slate-500 flex items-center justify-between cursor-not-allowed opacity-60">
                  <div className="flex items-center gap-2.5">
                    <span className="text-base"></span>
                    <div>
                      <div className="text-xs font-bold">Apple Pay</div>
                      <div className="text-[10px] text-slate-500">Biometric Token</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                    Coming Soon
                  </span>
                </div>

                {/* Google Pay (Coming Soon) */}
                <div className="p-3.5 rounded-2xl border border-slate-800/60 bg-slate-900/30 text-slate-500 flex items-center justify-between cursor-not-allowed opacity-60">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-black text-slate-500">G Pay</span>
                    <div>
                      <div className="text-xs font-bold">Google Pay</div>
                      <div className="text-[10px] text-slate-500">Mobile Wallet</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                    Coming Soon
                  </span>
                </div>

                {/* WiPay (Coming Soon) */}
                <div className="p-3.5 rounded-2xl border border-slate-800/60 bg-slate-900/30 text-slate-500 flex items-center justify-between cursor-not-allowed opacity-60">
                  <div className="flex items-center gap-2.5">
                    <Building2 className="w-4 h-4 text-slate-500" />
                    <div>
                      <div className="text-xs font-bold">WiPay Caribbean</div>
                      <div className="text-[10px] text-slate-500">Localized Island Rails</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                    Coming Soon
                  </span>
                </div>

                {/* CX Pay (Coming Soon) */}
                <div className="p-3.5 rounded-2xl border border-slate-800/60 bg-slate-900/30 text-slate-500 flex items-center justify-between cursor-not-allowed opacity-60">
                  <div className="flex items-center gap-2.5">
                    <Building2 className="w-4 h-4 text-slate-500" />
                    <div>
                      <div className="text-xs font-bold">CX Pay Gateway</div>
                      <div className="text-[10px] text-slate-500">Regional Gateway</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                    Coming Soon
                  </span>
                </div>
              </div>
            </div>

            {state.error && (
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold text-center">
                {state.error}
              </div>
            )}

            <div className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-800/80 text-[10px] text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Escrow Guarantee: <strong>Fulfillment Protected</strong></span>
              </span>
              <span className="text-slate-500">Authorized Processor</span>
            </div>

            {canTransact ? (
              <button
                type="submit"
                disabled={isPending}
                className="w-full bg-gradient-to-r from-brand-sunriseCoral via-brand-goldenHour to-brand-sunriseCoral hover:opacity-95 text-slate-950 font-black py-3 rounded-2xl text-xs flex items-center justify-center gap-2 transition-all shadow-xl shadow-brand-sunriseCoral/20 disabled:opacity-50 cursor-pointer"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Authorizing Payment...
                  </>
                ) : (
                  <>
                    Pay {total.format()} via {selectedMethod.toUpperCase()} <ArrowRight className="w-4 h-4" />
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
                Transactions Begin September 30, 2026 — Close Preview
              </button>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
