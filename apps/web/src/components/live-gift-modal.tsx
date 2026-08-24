'use client';

import React, { useState, useTransition } from 'react';
import { Gift, Sparkles, X, Loader2 } from 'lucide-react';
import { GIFT_CATALOG } from '@caribbean/live';
import { sendGiftAction, type SendGiftState } from '../lib/live/actions';

interface LiveGiftModalProps {
  livestreamId: string;
  isAuthenticated: boolean;
}

export function LiveGiftModal({ livestreamId, isAuthenticated }: LiveGiftModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedGift, setSelectedGift] = useState(GIFT_CATALOG[0].key);
  const [state, setState] = useState<SendGiftState>({ error: null });
  const [pending, startTransition] = useTransition();

  const handleSend = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('giftKey', selectedGift);
    formData.append('livestreamId', livestreamId);

    startTransition(() => {
      void sendGiftAction(state, formData).then((next) => {
        setState(next);
        if (next.success) {
          setTimeout(() => {
            setIsOpen(false);
            setState({ error: null });
          }, 1200);
        }
      });
    });
  };

  if (!isAuthenticated) {
    return (
      <a
        href="/login"
        className="bg-brand-sunriseCoral/20 text-emerald-300 hover:bg-brand-sunriseCoral/30 border border-brand-sunriseCoral/30 px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
      >
        <Gift className="w-4 h-4" /> Send Gift
      </a>
    );
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-brand-sunriseCoral hover:bg-brand-sunriseCoral text-slate-950 px-4 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-lg shadow-brand-sunriseCoral/20 transition-colors"
      >
        <Gift className="w-4 h-4" /> Send Gift
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-brand-twilight/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-brand-dusk border border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-brand-sandstone flex items-center gap-2">
                <Gift className="w-5 h-5 text-brand-sunriseCoral" /> Virtual Caribbean Gifts
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-brand-sandstone/60 hover:text-brand-sandstone p-1 rounded-full hover:bg-brand-dusk transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-brand-sandstone/60">
              Support the creator live. Funded instantly via your SpotPay wallet.
            </p>

            <form onSubmit={handleSend} className="space-y-4">
              <div className="grid grid-cols-2 gap-2.5">
                {GIFT_CATALOG.map((gift) => {
                  const isSelected = selectedGift === gift.key;
                  return (
                    <button
                      type="button"
                      key={gift.key}
                      onClick={() => setSelectedGift(gift.key)}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        isSelected
                          ? 'bg-brand-sunriseCoral/10 border-brand-sunriseCoral text-brand-sandstone shadow-sm shadow-brand-sunriseCoral/20'
                          : 'bg-brand-twilight border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-2xl block mb-1">
                        {gift.key === 'island_rose' && '🌹'}
                        {gift.key === 'steel_pan' && '🥁'}
                        {gift.key === 'carnival_crown' && '👑'}
                        {gift.key === 'sunrise_fete' && '☀️'}
                      </span>
                      <h4 className="font-bold text-xs">{gift.label}</h4>
                      <p className="text-[11px] font-extrabold text-brand-sunriseCoral mt-0.5">
                        ${(gift.priceMinor / 100).toFixed(2)} USD
                      </p>
                    </button>
                  );
                })}
              </div>

              {state.error && (
                <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-xl px-3 py-2">
                  {state.error}
                </p>
              )}

              {state.success && (
                <p className="text-xs text-emerald-300 bg-brand-sunriseCoral/10 border border-brand-sunriseCoral/30 rounded-xl px-3 py-2 flex items-center gap-1.5 font-bold">
                  <Sparkles className="w-4 h-4 text-brand-sunriseCoral" /> {state.giftName} sent successfully!
                </p>
              )}

              <button
                type="submit"
                disabled={pending || !!state.success}
                className="w-full bg-brand-sunriseCoral hover:bg-brand-sunriseCoral disabled:opacity-50 text-slate-950 font-black py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors"
              >
                {pending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Sending Gift…
                  </>
                ) : (
                  'Send via SpotPay Wallet'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
