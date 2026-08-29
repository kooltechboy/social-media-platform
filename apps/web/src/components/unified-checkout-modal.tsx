'use client';

import React, { useState, useTransition } from 'react';
import {
  Wallet,
  CreditCard,
  CheckCircle,
  X,
  ShieldCheck,
  Lock,
  Sparkles,
  Loader2,
  ArrowRight,
  Zap,
  HelpCircle,
} from 'lucide-react';
import { Money } from '@caribbean/spotpay';
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
  userWalletBalanceMinor?: number;
}

type PaymentMethodType = 'spotpay_wallet' | 'apple_pay' | 'google_pay' | 'paypal' | 'card';

export default function UnifiedCheckoutModal({
  isOpen,
  onClose,
  product,
  creatorReferralCode,
  userWalletBalanceMinor = 5000,
}: UnifiedCheckoutModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>('spotpay_wallet');
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

  // Processing pass-through fee (e.g. 2.9% + 30 cents on external cards/rails; $0 on SpotPay promotional internal wallet)
  const processingFeeMinor = selectedMethod === 'spotpay_wallet' ? 0 : Math.round((subtotalMinor * 290) / 10000) + 30;
  const processingFee = new Money(processingFeeMinor, product.currency);

  const totalMinor = subtotalMinor + processingFeeMinor;
  const total = new Money(totalMinor, product.currency);

  const walletBalance = new Money(userWalletBalanceMinor, product.currency);
  const hasEnoughWalletBalance = userWalletBalanceMinor >= totalMinor;

  function handleCompletePayment(e: React.FormEvent) {
    e.preventDefault();
    const formData = new FormData();
    formData.set('productId', product.id);
    formData.set('quantity', String(quantity));
    formData.set('paymentProvider', selectedMethod === 'spotpay_wallet' ? 'spotpay' : selectedMethod);
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
              <h3 className="text-2xl font-black text-white">Payment Confirmed!</h3>
              <p className="text-xs text-slate-300">
                Order <strong className="text-brand-sunriseCoral">#{state.orderId.slice(0, 8)}</strong> settled via SpotPay double-entry escrow.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-2 text-left">
              <div className="flex justify-between">
                <span className="text-slate-400">Item:</span>
                <span className="font-bold text-white">{product.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Settled:</span>
                <span className="font-bold text-emerald-400">{total.format()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Payment Rail:</span>
                <span className="capitalize font-bold text-brand-goldenHour">{selectedMethod.replace('_', ' ')}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="bg-brand-sunriseCoral hover:bg-brand-sunriseCoral text-slate-950 font-black px-6 py-2.5 rounded-2xl text-xs transition-all shadow-md shadow-brand-sunriseCoral/20 cursor-pointer"
            >
              Done / Return to Feed &amp; Store
            </button>
          </div>
        ) : (
          <form onSubmit={handleCompletePayment} className="space-y-5">
            {/* Header & Tukubi x SpotPay Brand Tag */}
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-brand-sunriseCoral uppercase tracking-widest">
                  Tukubi Unified Checkout
                </span>
                <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                  Powered by <span className="text-brand-goldenHour font-bold">SpotPay</span>
                  <span className="ml-1 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[8px] font-black uppercase">Early Access</span>
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
                  <span>Subtotal ({quantity} item{quantity > 1 ? 's' : ''})</span>
                  <span className="text-white font-semibold">{subtotal.format()}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Payment Processing Pass-Through</span>
                  <span className="text-slate-300 font-semibold">
                    {selectedMethod === 'spotpay_wallet' ? 'Free ($0.00)' : processingFee.format()}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-black text-white pt-1 border-t border-slate-800">
                  <span>Total Amount</span>
                  <span className="text-brand-sunriseCoral">{total.format()} {product.currency}</span>
                </div>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200">Choose how you want to pay</label>
                <span className="text-[10px] text-slate-400">Secure 256-bit encryption</span>
              </div>

              {/* 1. Preferred Option: SpotPay Wallet */}
              <div
                onClick={() => setSelectedMethod('spotpay_wallet')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  selectedMethod === 'spotpay_wallet'
                    ? 'bg-purple-950/30 border-purple-500 shadow-lg shadow-purple-500/10 ring-1 ring-purple-500/50'
                    : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-2xl bg-purple-600 text-white font-black shrink-0 mt-0.5">
                      <Wallet className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-white">🟣 Pay with SpotPay</span>
                        <span className="text-[9px] font-black px-2 py-0.5 bg-brand-goldenHour text-slate-950 rounded-full uppercase">
                          Fastest • Recommended
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1">
                        Pay instantly from your SpotPay balance ({walletBalance.format()}). Funds settle immediately with zero FX markups.
                      </p>
                      <p className="text-[10px] text-purple-300/80 mt-1 flex items-center gap-1">
                        <Zap className="w-3 h-3 text-brand-goldenHour" /> Keep funds in the ecosystem to send to friends, tip creators, or buy next!
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Or: Multimodal Payment Rails */}
              <div className="space-y-1.5 pt-1">
                <p className="text-[11px] font-semibold text-slate-400">Or choose another supported payment method:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* Apple Pay */}
                  <div
                    onClick={() => setSelectedMethod('apple_pay')}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      selectedMethod === 'apple_pay'
                        ? 'bg-slate-800 border-white text-white shadow-md'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg"></span>
                      <span className="text-xs font-bold">Apple Pay</span>
                    </div>
                    <span className="text-[10px] text-slate-400">Biometric</span>
                  </div>

                  {/* Google Pay */}
                  <div
                    onClick={() => setSelectedMethod('google_pay')}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      selectedMethod === 'google_pay'
                        ? 'bg-slate-800 border-sky-400 text-white shadow-md'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-sky-400">G Pay</span>
                      <span className="text-xs font-bold">Google Pay</span>
                    </div>
                    <span className="text-[10px] text-slate-400">CIBC &amp; DB Cards</span>
                  </div>

                  {/* Credit / Debit Card (Stripe) */}
                  <div
                    onClick={() => setSelectedMethod('card')}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      selectedMethod === 'card'
                        ? 'bg-slate-800 border-brand-sunriseCoral text-white shadow-md'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-brand-sunriseCoral" />
                      <span className="text-xs font-bold">Card (Visa/MC)</span>
                    </div>
                    <span className="text-[10px] text-slate-400">Direct PSP</span>
                  </div>

                  {/* PayPal */}
                  <div
                    onClick={() => setSelectedMethod('paypal')}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      selectedMethod === 'paypal'
                        ? 'bg-slate-800 border-blue-400 text-white shadow-md'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-blue-400">PayPal</span>
                      <span className="text-xs font-bold">PayPal</span>
                    </div>
                    <span className="text-[10px] text-slate-400">International</span>
                  </div>
                </div>
              </div>
            </div>

            {state.error && (
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold text-center">
                {state.error}
              </div>
            )}

            {/* Transparent Seller Policy Guarantee */}
            <div className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-800/80 text-[10px] text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Seller Plan: <strong>0% TUKUBI Sales Cut</strong></span>
              </span>
              <span className="text-slate-400">SpotPay Protection</span>
            </div>

            {/* Pay Button */}
            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-gradient-to-r from-brand-sunriseCoral via-brand-goldenHour to-brand-sunriseCoral hover:opacity-95 text-slate-950 font-black py-3 rounded-2xl text-xs flex items-center justify-center gap-2 transition-all shadow-xl shadow-brand-sunriseCoral/20 disabled:opacity-50 cursor-pointer"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Processing SpotPay Escrow...
                </>
              ) : (
                <>
                  Pay {total.format()} via {selectedMethod === 'spotpay_wallet' ? 'SpotPay' : 'Checkout'} <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
