'use client';

import React, { useState } from 'react';
import { Radio, Sparkles, X, Check, ShieldCheck, DollarSign, Users, Award, Loader2 } from 'lucide-react';
import { applyFees, DEFAULT_FEES } from '@caribbean/creator';

interface CreatorTierModalProps {
  isOpen: boolean;
  onClose: () => void;
  creatorName: string;
}

export default function CreatorTierModal({ isOpen, onClose, creatorName }: CreatorTierModalProps) {
  const [tierPrice, setTierPrice] = useState(499); // $4.99 in minor units
  const [tierName, setTierName] = useState('VIP Patron Circle');
  const [perks, setPerks] = useState<string>('Exclusive behind-the-scenes streams\nEarly access to music & carnival riddims\nSpotPay subscriber badge & VIP chat');
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const breakdown = applyFees(tierPrice, DEFAULT_FEES);
  const gross = (breakdown.grossMinor / 100).toFixed(2);
  const platformFee = (breakdown.platformFeeMinor / 100).toFixed(2);
  const pspFee = (breakdown.processingFeeMinor / 100).toFixed(2);
  const net = (breakdown.netToCreatorMinor / 100).toFixed(2);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setIsSaved(true);
      setTimeout(() => {
        setIsSaved(false);
        onClose();
      }, 2000);
    }, 1000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-twilight/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-brand-dusk border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5 relative max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-brand-caribbeanSea to-brand-sunriseCoral text-white">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-base text-white">Creator Membership Tier</h3>
            <p className="text-xs text-slate-400">Configure monthly patronage for your fans on Tukubi</p>
          </div>
        </div>

        {isSaved ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
              <Check className="w-7 h-7" />
            </div>
            <h4 className="text-lg font-black text-white">Membership Tier Published!</h4>
            <p className="text-xs text-slate-300">
              Fans can now subscribe to <strong className="text-brand-sunriseCoral">{tierName}</strong> for ${gross} USD/month.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-300">Tier Name</label>
              <input
                type="text"
                required
                value={tierName}
                onChange={(e) => setTierName(e.target.value)}
                className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-brand-caribbeanSea"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">Monthly Price (USD)</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: '$2.99', minor: 299 },
                  { label: '$4.99', minor: 499 },
                  { label: '$9.99', minor: 999 },
                ].map((opt) => (
                  <button
                    key={opt.minor}
                    type="button"
                    onClick={() => setTierPrice(opt.minor)}
                    className={`py-2 rounded-xl border text-xs font-black transition-all ${
                      tierPrice === opt.minor
                        ? 'border-brand-caribbeanSea bg-brand-caribbeanSea/20 text-brand-caribbeanSea'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400'
                    }`}
                  >
                    {opt.label} / mo
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-300">Subscriber Perks (One per line)</label>
              <textarea
                rows={3}
                value={perks}
                onChange={(e) => setPerks(e.target.value)}
                className="w-full bg-slate-900/80 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-brand-caribbeanSea"
              />
            </div>

            {/* 82.1% Net Transparency Calculation Box */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-brand-sunriseCoral/30 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-brand-goldenHour" /> 82.1% Net Payout Engine
                </span>
                <span className="text-[10px] text-emerald-400 font-black uppercase bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded-full">
                  Keep 82.1% Net
                </span>
              </div>

              <div className="space-y-1 text-xs pt-2 border-t border-slate-800/80">
                <div className="flex justify-between text-slate-400">
                  <span>Fan Pays (Gross):</span>
                  <span className="font-bold text-white">${gross} USD</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Tukubi Platform Fee (15.0%):</span>
                  <span className="text-slate-400">-${platformFee} USD</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Payment Processing / Gateway (2.9%):</span>
                  <span className="text-slate-400">-${pspFee} USD</span>
                </div>
                <div className="border-t border-slate-800 pt-1.5 flex justify-between font-black text-white">
                  <span>Creator Net per Subscriber:</span>
                  <span className="text-emerald-400">${net} USD/mo</span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-brand-caribbeanSea via-brand-sunriseCoral to-brand-goldenHour font-black text-slate-950 text-xs uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Publish Membership Tier'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
