'use client';

import React, { useState, useTransition } from 'react';
import { CreditCard, Plus, Trash2, CheckCircle2, ShieldCheck, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';

export interface TokenizedPaymentMethod {
  id: string;
  provider: string;
  method_kind: string;
  brand: string | null;
  last4: string | null;
  expiry_month: number | null;
  expiry_year: number | null;
  is_default: boolean;
}

interface PaymentMethodsListProps {
  initialMethods: TokenizedPaymentMethod[];
}

export default function PaymentMethodsList({ initialMethods }: PaymentMethodsListProps) {
  const [methods, setMethods] = useState(initialMethods);
  const [isAdding, setIsAdding] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function getBrandBadge(method: TokenizedPaymentMethod) {
    if (method.method_kind === 'apple_pay') return ' Apple Pay';
    if (method.method_kind === 'google_pay') return 'G Pay';
    if (method.method_kind === 'paypal') return 'PayPal';
    return method.brand ? method.brand.toUpperCase() : 'CARD';
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-white">Payment Methods</h2>
          <p className="text-xs text-slate-400">
            Secure tokenized payment credentials. Raw card data is never stored on TUKUBI servers.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsAdding(!isAdding)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-sunriseCoral to-brand-goldenHour text-slate-950 font-black text-xs flex items-center gap-2 shadow-md shadow-brand-sunriseCoral/20 hover:opacity-95 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Payment Method</span>
        </button>
      </div>

      {isAdding && (
        <div className="p-5 rounded-2xl bg-brand-dusk/80 border border-brand-sunriseCoral/40 space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-brand-goldenHour" /> Secure Tokenized Card Checkout
            </h4>
            <span className="text-[10px] text-slate-400">PCI-DSS Tokenization Rail</span>
          </div>
          <p className="text-xs text-slate-300">
            Payment instruments are securely attached during checkout via our authorized Caribbean and international payment processors (Stripe, CX Pay, WiPay, PayPal).
          </p>
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
            <span>To add a new card or method, complete any purchase or transaction on TUKUBI.</span>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-brand-goldenHour hover:underline font-bold"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {methods.length === 0 ? (
        <div className="text-center py-12 bg-brand-dusk/40 border border-slate-800 rounded-2xl space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-800/80 text-slate-400 flex items-center justify-center mx-auto">
            <CreditCard className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white">No Saved Payment Methods</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Add a payment method during checkout to enable 1-click purchases for events, marketplace orders, and creator fan memberships.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {methods.map((method) => (
            <div
              key={method.id}
              className="p-5 rounded-2xl bg-brand-dusk/60 border border-slate-800 space-y-4 hover:border-slate-700 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-800 text-white font-bold text-xs">
                    <CreditCard className="w-5 h-5 text-brand-sunriseCoral" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      <span>{getBrandBadge(method)}</span>
                      {method.last4 && <span>•••• {method.last4}</span>}
                    </div>
                    <span className="text-[11px] text-slate-400 capitalize">
                      Provider: {method.provider}
                    </span>
                  </div>
                </div>
                {method.is_default && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Default
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs">
                <span className="text-slate-400">
                  {method.expiry_month && method.expiry_year
                    ? `Expires ${String(method.expiry_month).padStart(2, '0')}/${method.expiry_year}`
                    : 'Verified Instrument'}
                </span>
                <span className="text-[10px] text-slate-500 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Tokenized
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
