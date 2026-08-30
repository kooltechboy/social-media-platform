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
} from 'lucide-react';
import { Money } from '@caribbean/payments';
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

type PaymentMethodType = 'card' | 'paypal' | 'wipay' | 'cxpay' | 'apple_pay' | 'google_pay';

export default function UnifiedCheckoutModal({
  isOpen,
  onClose,
  product,
  creatorReferralCode,
}: UnifiedCheckoutModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>('card');
  const [quantity, setQuantity] = useState(1);
  const [shippingAddress, setShippingAddress] = useState({
    fullName: '',
    addressLine: '',
    city: '',
    country: 'Jamaica 🇯🇲',
  });

  const [state, setState] = useState<MarketplaceActionState>({ error: null, success: null });
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

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
              <h3 className="text-2xl font-black text-white">Payment Authorized!</h3>
              <p className="text-xs text-slate-300">
                Order <strong className="text-brand-sunriseCoral">#{state.orderId.slice(0, 8)}</strong> confirmed and submitted for fulfillment.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-2 text-left">
              <div className="flex justify-between">
                <span className="text-slate-400">Item:</span>
                <span className="font-bold text-white">{product.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Charged:</span>
                <span className="font-bold text-emerald-400">{total.format()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Payment Processor:</span>
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
                  TUKUBI Unified Checkout
                </span>
                <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                  <Lock className="w-3 h-3 text-emerald-400" />
                  <span>256-bit Encrypted</span>
                </span>
              </div>
              <h2 className="text-xl font-black text-white mt-0.5">{product.title}</h2>
              <p className="text-xs text-slate-400">Sold by {product.sellerName} • {product.origin || 'Caribbean'}</p>
            </div>

            {/* Order Summary Box */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">Quantity</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-6 h-6 rounded bg-slate-800 text-white font-bold flex items-center justify-center hover:bg-slate-700 cursor-pointer"
                  >
                    -
                  </button>
                  <span className="font-bold text-white w-4 text-center">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.min(10, quantity + 1))}
                    className="w-6 h-6 rounded bg-slate-800 text-white font-bold flex items-center justify-center hover:bg-slate-700 cursor-pointer"
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
              <label className="text-xs font-bold text-slate-200 block">Select Payment Method</label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Credit / Debit Card (Stripe / CX Pay) */}
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
                      <div className="text-[10px] text-slate-400">Visa, Mastercard, Amex</div>
                    </div>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-semibold">Instant</span>
                </div>

                {/* PayPal */}
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
                      <div className="text-[10px] text-slate-400">International Checkout</div>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400">Global</span>
                </div>

                {/* Apple Pay */}
                <div
                  onClick={() => setSelectedMethod('apple_pay')}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    selectedMethod === 'apple_pay'
                      ? 'bg-slate-800 border-white text-white shadow-md ring-1 ring-white/50'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base"></span>
                    <div>
                      <div className="text-xs font-bold">Apple Pay</div>
                      <div className="text-[10px] text-slate-400">Biometric Token</div>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400">1-Tap</span>
                </div>

                {/* Google Pay */}
                <div
                  onClick={() => setSelectedMethod('google_pay')}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    selectedMethod === 'google_pay'
                      ? 'bg-slate-800 border-sky-400 text-white shadow-md ring-1 ring-sky-400/50'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-black text-sky-400">G Pay</span>
                    <div>
                      <div className="text-xs font-bold">Google Pay</div>
                      <div className="text-[10px] text-slate-400">Caribbean &amp; Diaspora</div>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400">1-Tap</span>
                </div>

                {/* WiPay (Caribbean) */}
                <div
                  onClick={() => setSelectedMethod('wipay')}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    selectedMethod === 'wipay'
                      ? 'bg-slate-800 border-amber-400 text-white shadow-md ring-1 ring-amber-400/50'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Building2 className="w-4 h-4 text-amber-400" />
                    <div>
                      <div className="text-xs font-bold">WiPay Caribbean</div>
                      <div className="text-[10px] text-slate-400">TTD, JMD, BBD rails</div>
                    </div>
                  </div>
                  <span className="text-[10px] text-amber-400 font-semibold">Local</span>
                </div>

                {/* CX Pay (Caribbean) */}
                <div
                  onClick={() => setSelectedMethod('cxpay')}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    selectedMethod === 'cxpay'
                      ? 'bg-slate-800 border-purple-400 text-white shadow-md ring-1 ring-purple-400/50'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Building2 className="w-4 h-4 text-purple-400" />
                    <div>
                      <div className="text-xs font-bold">CX Pay Gateway</div>
                      <div className="text-[10px] text-slate-400">Dutch &amp; English Caribbean</div>
                    </div>
                  </div>
                  <span className="text-[10px] text-purple-400 font-semibold">Local</span>
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
          </form>
        )}
      </div>
    </div>
  );
}
