'use client';

import React, { useState } from 'react';
import { Building2, Sparkles, X, Check, ShieldCheck, Zap, Bot, Star, CreditCard, Loader2 } from 'lucide-react';

interface BusinessTierModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessName: string;
}

const TIERS = [
  {
    id: 'free',
    name: 'Antilia Standard',
    price: '$0',
    period: 'forever',
    description: 'Essential public presence for Caribbean local businesses.',
    features: ['Public Business Profile & Posts', 'Community Reviews & Ratings', 'Direct Messaging with Customers', 'Standard Map Pin'],
    highlight: false,
    cta: 'Current Plan',
  },
  {
    id: 'business',
    name: 'Antilia Business',
    price: '$19.99',
    period: '/month',
    description: 'Turn your page into a fully transactional Caribbean storefront.',
    features: [
      'SpotPay Point-of-Sale & Storefront',
      'Verified Caribbean Business Badge 🏅',
      'Menu & Digital Catalog Ordering',
      'Table & Appointment Bookings',
      'Advanced Customer Analytics',
    ],
    highlight: true,
    cta: 'Upgrade to Business',
  },
  {
    id: 'pro',
    name: 'Antilia Business Pro',
    price: '$49.99',
    period: '/month',
    description: 'Complete AI automation and diaspora growth engine.',
    features: [
      'Everything in Business Plan',
      '"Ask Business" 24/7 AI Concierge Bot 🤖',
      '$25 Monthly SpotPay Ads Credit',
      'Diaspora Customer Targeting (NYC/MIA/TOR)',
      'Multi-Location & VIP Concierge Support',
    ],
    highlight: false,
    cta: 'Upgrade to Pro',
  },
];

export default function BusinessTierModal({ isOpen, onClose, businessName }: BusinessTierModalProps) {
  const [selectedTier, setSelectedTier] = useState('business');
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [successTier, setSuccessTier] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleUpgrade(tierId: string) {
    if (tierId === 'free') {
      onClose();
      return;
    }
    setIsUpgrading(true);
    setTimeout(() => {
      setIsUpgrading(false);
      setSuccessTier(tierId);
      setTimeout(() => {
        setSuccessTier(null);
        onClose();
      }, 2500);
    }, 1200);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-twilight/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-brand-dusk border border-slate-800 rounded-3xl p-6 max-w-3xl w-full shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-sunriseCoral/20 border border-brand-sunriseCoral/30 text-brand-sunriseCoral text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Antilia Merchant Growth Suite
          </div>
          <h3 className="text-2xl font-black text-white">Monetize & Scale {businessName}</h3>
          <p className="text-xs text-slate-400 max-w-lg mx-auto">
            Choose the subscription tier that powers your Caribbean storefront, AI customer support, and diaspora customer acquisition.
          </p>
        </div>

        {successTier ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
              <Check className="w-8 h-8" />
            </div>
            <h4 className="text-xl font-black text-white">Subscription Activated!</h4>
            <p className="text-xs text-slate-300">
              {businessName} is now upgraded to <strong className="text-brand-sunriseCoral">{TIERS.find((t) => t.id === successTier)?.name}</strong>.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {TIERS.map((tier) => (
              <div
                key={tier.id}
                className={`rounded-2xl p-5 border flex flex-col justify-between transition-all ${
                  tier.highlight
                    ? 'border-brand-sunriseCoral bg-slate-900/90 shadow-xl shadow-brand-sunriseCoral/10 relative scale-105'
                    : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
                }`}
              >
                {tier.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-brand-sunriseCoral to-brand-goldenHour text-white text-[10px] font-black uppercase px-3 py-0.5 rounded-full shadow-md">
                    Most Popular
                  </span>
                )}

                <div className="space-y-4">
                  <div>
                    <h4 className="font-black text-base text-white">{tier.name}</h4>
                    <p className="text-[11px] text-slate-400 mt-1 min-h-[32px]">{tier.description}</p>
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
                  onClick={() => handleUpgrade(tier.id)}
                  className={`mt-6 w-full py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                    tier.highlight
                      ? 'bg-gradient-to-r from-brand-sunriseCoral to-brand-goldenHour text-white shadow-lg shadow-brand-sunriseCoral/20 hover:opacity-90'
                      : tier.id === 'free'
                      ? 'bg-slate-800 text-slate-400 cursor-default'
                      : 'bg-slate-800 hover:bg-slate-700 text-white'
                  }`}
                >
                  {isUpgrading && selectedTier === tier.id ? (
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
          <span className="flex items-center gap-1.5"><CreditCard className="w-4 h-4 text-brand-goldenHour" /> Billed via SpotPay or Card</span>
        </div>
      </div>
    </div>
  );
}
