'use client';

import React, { useState } from 'react';
import { Building2, Sparkles, X, Check, ShieldCheck, Zap, Bot, Star, CreditCard, Loader2 } from 'lucide-react';
import { SELLER_PLANS, type SellerPlan } from '@caribbean/spotpay';
import { upgradeSellerPlanAction } from '../lib/business/actions';

interface BusinessTierModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessName: string;
  businessSlug?: string;
}

const UI_PLANS = [
  {
    planKey: 'business_free' as const,
    name: 'Business Free',
    price: '$0',
    period: 'forever',
    description: 'Essential public presence for Caribbean local businesses.',
    features: [
      'Verified Caribbean Business Profile & Posts',
      'Community Discovery & Customer Reviews',
      'Direct Messaging with Customers',
      'Up to 5 Marketplace Listings',
      '0% ANTILIA Sales Commission',
    ],
    highlight: false,
    cta: 'Select Free Plan',
  },
  {
    planKey: 'seller_pro' as const,
    name: 'Seller Pro',
    price: '$14.99',
    period: '/month',
    description: 'Turn your page into a fully transactional Caribbean storefront.',
    features: [
      'Unlimited Marketplace & Service Listings',
      'SpotPay Escrow & Multimodal Checkout',
      '0% ANTILIA Percentage on Product Sales',
      'AI Business Assistant ("Ask This Business") 🤖',
      'Real-Time Orders & Revenue Analytics',
      'Verified Caribbean Seller Badge 🏅',
    ],
    highlight: true,
    cta: 'Upgrade to Seller Pro',
  },
  {
    planKey: 'business_plus' as const,
    name: 'Business+',
    price: '$39.99',
    period: '/month',
    description: 'Complete AI automation and diaspora growth engine.',
    features: [
      'Everything in Seller Pro',
      'Advanced CRM & Multi-Staff Access (5 seats)',
      'AI Marketing & Caption Automation',
      'Diaspora Priority Search Placement (NYC/MIA/TOR/LON)',
      'Priority VIP Support & Custom Invoicing',
    ],
    highlight: false,
    cta: 'Upgrade to Business+',
  },
];

export default function BusinessTierModal({ isOpen, onClose, businessName, businessSlug }: BusinessTierModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<'business_free' | 'seller_pro' | 'business_plus'>('seller_pro');
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [successPlan, setSuccessPlan] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleUpgrade(planId: 'business_free' | 'seller_pro' | 'business_plus') {
    if (!businessSlug) {
      onClose();
      return;
    }

    setIsUpgrading(true);
    setErrorMessage(null);

    try {
      const res = await upgradeSellerPlanAction(businessSlug, planId);
      if (res.error) {
        setErrorMessage(res.error);
        setIsUpgrading(false);
        return;
      }

      setSuccessPlan(planId);
      setIsUpgrading(false);
      setTimeout(() => {
        setSuccessPlan(null);
        onClose();
      }, 2000);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to update seller subscription.');
      setIsUpgrading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-twilight/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-brand-dusk border border-slate-800 rounded-3xl p-6 max-w-4xl w-full shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-sunriseCoral/20 border border-brand-sunriseCoral/30 text-brand-sunriseCoral text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Antilia Seller Subscription Engine
          </div>
          <h3 className="text-2xl font-black text-white">Monetize &amp; Scale {businessName}</h3>
          <p className="text-xs text-slate-300 max-w-lg mx-auto leading-relaxed">
            <strong className="text-brand-sunriseCoral">&quot;ANTILIA doesn&apos;t take a percentage of your sales on eligible Seller plans.&quot;</strong> Keep your revenue subject only to transparent payment processing.
          </p>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold text-center">
            {errorMessage}
          </div>
        )}

        {successPlan ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
              <Check className="w-8 h-8" />
            </div>
            <h4 className="text-xl font-black text-white">Seller Subscription Activated!</h4>
            <p className="text-xs text-slate-300">
              {businessName} is now active on the <strong className="text-brand-sunriseCoral">{UI_PLANS.find((t) => t.planKey === successPlan)?.name}</strong> tier.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {UI_PLANS.map((tier) => (
              <div
                key={tier.planKey}
                className={`rounded-2xl p-5 border flex flex-col justify-between transition-all ${
                  tier.highlight
                    ? 'border-brand-sunriseCoral bg-slate-900/90 shadow-xl shadow-brand-sunriseCoral/10 relative scale-105'
                    : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
                }`}
              >
                {tier.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-brand-sunriseCoral to-brand-goldenHour text-slate-950 text-[10px] font-black uppercase px-3 py-0.5 rounded-full shadow-md">
                    Recommended
                  </span>
                )}

                <div className="space-y-4">
                  <div>
                    <h4 className="font-black text-base text-white">{tier.name}</h4>
                    <p className="text-[11px] text-slate-400 mt-1 min-h-[32px] leading-snug">{tier.description}</p>
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-white">{tier.price}</span>
                    <span className="text-xs text-slate-400 font-medium">{tier.period}</span>
                  </div>

                  <ul className="space-y-2 border-t border-slate-800 pt-3 text-xs text-slate-300">
                    {tier.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-[11px]">
                        <Check className="w-3.5 h-3.5 text-brand-sunriseCoral shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  disabled={isUpgrading}
                  onClick={() => handleUpgrade(tier.planKey)}
                  className={`mt-6 w-full py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    tier.highlight
                      ? 'bg-gradient-to-r from-brand-sunriseCoral to-brand-goldenHour text-slate-950 shadow-lg shadow-brand-sunriseCoral/20 hover:opacity-90 font-black'
                      : 'bg-slate-800 hover:bg-slate-700 text-white'
                  }`}
                >
                  {isUpgrading && selectedPlan === tier.planKey ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    tier.cta
                  )}
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-400" /> Cancel anytime</span>
          <span>&bull;</span>
          <span className="flex items-center gap-1.5"><CreditCard className="w-4 h-4 text-brand-goldenHour" /> Billed securely via SpotPay or Card</span>
        </div>
      </div>
    </div>
  );
}
