'use client';

import React, { useState, useTransition } from 'react';
import { Plus, X, Sparkles, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { createCreatorPlanAction } from '@/lib/creator/monetization-actions';

export default function CreatePlanModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await createCreatorPlanAction(formData);
      if (!res.success) {
        setError(res.error || 'Failed to create plan.');
      } else {
        setSuccess(true);
        setTimeout(() => {
          setIsOpen(false);
          setSuccess(false);
        }, 1200);
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 rounded-xl bg-brand-sunriseCoral text-slate-950 text-xs font-black flex items-center gap-1.5 hover:opacity-95 transition-opacity shadow-lg shadow-brand-sunriseCoral/20 cursor-pointer"
      >
        <Plus className="w-4 h-4" />
        <span>Create New Subscription Tier</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#1D1429] border border-purple-500/20 rounded-3xl p-6 max-w-lg w-full shadow-2xl relative space-y-5">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2 text-brand-goldenHour text-xs font-black uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>Fan Monetization</span>
              </div>
              <h2 className="text-xl font-black text-white mt-1">Create Creator Subscription Tier</h2>
              <p className="text-xs text-slate-400">
                Offer your followers recurring memberships with exclusive benefits, VIP content, and patron recognition.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {success ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                <h3 className="text-lg font-bold text-white">Subscription Tier Published!</h3>
                <p className="text-xs text-slate-400">Your fans can now subscribe to this tier.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Tier Name</label>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="e.g. VIP Island Insider, Dub Club Patron"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-brand-sunriseCoral"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Monthly Price ($ USD)</label>
                    <input
                      type="number"
                      name="price"
                      required
                      step="0.01"
                      min="0.99"
                      placeholder="4.99"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-brand-sunriseCoral"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Billing Interval</label>
                    <select
                      name="billingInterval"
                      defaultValue="monthly"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-brand-sunriseCoral"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="annual">Annual</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Description</label>
                  <textarea
                    name="description"
                    rows={2}
                    placeholder="Describe what subscribers unlock with this membership..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-brand-sunriseCoral resize-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    Subscriber Benefits <span className="font-normal text-slate-500">(one benefit per line)</span>
                  </label>
                  <textarea
                    name="benefits"
                    rows={3}
                    placeholder="Early podcast episodes&#10;Exclusive behind-the-scenes videos&#10;Patron badge on comments&#10;Access to private community lounge"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-brand-sunriseCoral resize-none"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    disabled={isPending}
                    className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isPending}
                    className="px-5 py-2.5 rounded-xl bg-brand-sunriseCoral text-slate-950 font-black flex items-center gap-2 hover:opacity-95 cursor-pointer disabled:opacity-50"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Publishing...</span>
                      </>
                    ) : (
                      <span>Publish Tier</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
