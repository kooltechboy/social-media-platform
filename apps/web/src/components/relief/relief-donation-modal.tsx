'use client';

import React from 'react';
import {
  X,
  Heart,
  ShieldCheck,
  Sparkles,
  Lock,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Loader2,
  HandHeart,
  Users,
} from 'lucide-react';
import {
  formatDonationAmount,
  validateDonationAmount,
  RELIEF_CATEGORY_METADATA,
} from '../../lib/relief/types';
import type { ReliefCampaign, ReliefDonation } from '../../lib/relief/types';
import { donateToReliefCampaignAction } from '../../lib/relief/actions';

export interface ReliefDonationModalProps {
  campaign: ReliefCampaign;
  isOpen: boolean;
  onClose: () => void;
  currentUserId?: string;
  onDonationSuccess?: (donation: ReliefDonation) => void;
  className?: string;
}

const PRESET_AMOUNTS = [10, 25, 50, 100, 250];

function useSafeState<T>(initialValue: T | (() => T)): [T, React.Dispatch<React.SetStateAction<T>>] {
  const internals =
    (React as any)?.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE ||
    (React as any)?.__SECRET_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
  const dispatcher = internals?.H || internals?.ReactCurrentDispatcher?.current;

  if (dispatcher) {
    return React.useState<T>(initialValue);
  }
  const val = typeof initialValue === 'function' ? (initialValue as () => T)() : initialValue;
  return [val, () => {}];
}

function useSafeTransition(): [boolean, (callback: () => void) => void] {
  const internals =
    (React as any)?.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE ||
    (React as any)?.__SECRET_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
  const dispatcher = internals?.H || internals?.ReactCurrentDispatcher?.current;

  if (dispatcher && typeof React.useTransition === 'function') {
    return React.useTransition();
  }
  return [false, (cb: () => void) => cb()];
}

function useSafeEffect(effect: React.EffectCallback, deps?: React.DependencyList): void {
  const internals =
    (React as any)?.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE ||
    (React as any)?.__SECRET_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
  const dispatcher = internals?.H || internals?.ReactCurrentDispatcher?.current;

  if (dispatcher && typeof React.useEffect === 'function') {
    React.useEffect(effect, deps);
  }
}

export default function ReliefDonationModal({
  campaign,
  isOpen,
  onClose,
  currentUserId,
  onDonationSuccess,
  className = '',
}: ReliefDonationModalProps) {
  const [selectedPreset, setSelectedPreset] = useSafeState<number | null>(50);
  const [customAmount, setCustomAmount] = useSafeState<string>('50');
  const [isAnonymous, setIsAnonymous] = useSafeState<boolean>(false);
  const [donorName, setDonorName] = useSafeState<string>('');
  const [donorMessage, setDonorMessage] = useSafeState<string>('');
  const [errorMessage, setErrorMessage] = useSafeState<string | null>(null);
  const [completedDonation, setCompletedDonation] = useSafeState<ReliefDonation | null>(null);

  const [isPending, startTransition] = useSafeTransition();

  // Escape key and modal accessibility
  useSafeEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const numericDollar = Number.parseFloat(customAmount) || 0;
  const amountMinor = Math.round(numericDollar * 100);

  const handleSelectPreset = (preset: number) => {
    setSelectedPreset(preset);
    setCustomAmount(preset.toString());
    setErrorMessage(null);
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomAmount(val);
    const parsed = Number.parseFloat(val);
    if (PRESET_AMOUNTS.includes(parsed)) {
      setSelectedPreset(parsed);
    } else {
      setSelectedPreset(null);
    }
    setErrorMessage(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const validation = validateDonationAmount(amountMinor);
    if (!validation.isValid) {
      setErrorMessage(validation.error || 'Please enter a valid donation amount ($1.00 minimum).');
      return;
    }

    startTransition(async () => {
      try {
        const result = await donateToReliefCampaignAction({
          campaign_id: campaign.id,
          amount_minor: amountMinor,
          currency: campaign.currency || 'USD',
          is_anonymous: isAnonymous,
          donor_name: isAnonymous ? null : donorName.trim() || null,
          donor_message: donorMessage.trim() || null,
        });

        if (result.error) {
          setErrorMessage(result.error);
        } else if (result.data) {
          setCompletedDonation(result.data);
          if (onDonationSuccess) {
            onDonationSuccess(result.data);
          }
        }
      } catch (err: any) {
        setErrorMessage(err?.message || 'An unexpected error occurred while processing your donation.');
      }
    });
  };

  const categoryMeta = RELIEF_CATEGORY_METADATA[campaign.category] || {
    title: 'Disaster Relief & Mutual Aid',
    protocol: 'CARIB-EMERGENCY',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-twilight/80 backdrop-blur-md animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="relief-donation-modal-title"
        className={`bg-brand-dusk border border-slate-800 rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-6 relative max-h-[92vh] overflow-y-auto text-slate-100 ${className}`}
      >
        {/* Accessible Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close relief donation modal"
          className="absolute top-4 right-4 p-2 rounded-full text-brand-sandstone/60 hover:text-white hover:bg-white/10 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
        >
          <X className="w-5 h-5" />
          <span className="sr-only">Close</span>
        </button>

        {completedDonation ? (
          /* Confirmation State */
          <div className="text-center py-6 space-y-5 animate-fadeIn">
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                Mutual Aid Donation Confirmed
              </span>
              <h3 className="font-extrabold text-2xl text-white pt-2">
                Thank You for Standing with the Community!
              </h3>
              <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                Your generous contribution of{' '}
                <strong className="text-white font-bold">
                  {formatDonationAmount(completedDonation.amount_minor, completedDonation.currency)}
                </strong>{' '}
                has been recorded on the verified Caribbean mutual aid ledger.
              </p>
            </div>

            <div className="rounded-2xl bg-white/5 border border-white/10 p-4 text-xs text-slate-300 text-left space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Campaign:</span>
                <span className="font-semibold text-white truncate max-w-[240px]">
                  {campaign.title}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Transaction Ref:</span>
                <span className="font-mono text-emerald-300 text-[11px]">
                  {completedDonation.idempotency_key}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Protocol:</span>
                <span className="font-mono text-brand-goldenHour text-[11px]">
                  {categoryMeta.protocol}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full min-h-[44px] min-w-[44px] rounded-2xl bg-gradient-to-r from-brand-sunriseCoral to-brand-goldenHour text-white font-bold py-3 hover:opacity-95 transition-opacity cursor-pointer"
            >
              Done
            </button>
          </div>
        ) : (
          /* Donation Form */
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Header */}
            <div className="flex items-center gap-3.5 pr-8">
              <div className="p-3.5 rounded-2xl bg-brand-sunriseCoral/20 text-brand-sunriseCoral border border-brand-sunriseCoral/30 shrink-0">
                <HandHeart className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-goldenHour/15 text-brand-goldenHour border border-brand-goldenHour/30">
                    Disaster Relief Protocol
                  </span>
                </div>
                <h2
                  id="relief-donation-modal-title"
                  className="font-black text-lg sm:text-xl text-white pt-0.5"
                >
                  Donate to Relief
                </h2>
                <p className="text-xs text-slate-300 line-clamp-1">{campaign.title}</p>
              </div>
            </div>

            {/* 0% Platform Fee Mutual Aid Guarantee Callout */}
            <div className="p-3.5 rounded-2xl bg-brand-caribbeanSea/10 border border-brand-caribbeanSea/30 flex items-start gap-3 text-xs text-brand-caribbeanSea">
              <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5 text-brand-caribbeanSea" />
              <div className="space-y-0.5">
                <p className="font-extrabold text-white text-xs">
                  0% Platform Fee Mutual Aid Guarantee
                </p>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  100% of your donation is routed directly to the verified disaster relief fund. TUKUBI deducts zero platform fees for mutual aid operations.
                </p>
              </div>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div
                role="alert"
                aria-live="assertive"
                className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Amount Selection Section */}
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                Select Donation Amount ({campaign.currency || 'USD'})
              </label>

              {/* Preset Buttons */}
              <div className="grid grid-cols-5 gap-2">
                {PRESET_AMOUNTS.map((preset) => {
                  const isSelected = selectedPreset === preset;
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      aria-pressed={isSelected}
                      className={`min-h-[44px] min-w-[44px] rounded-xl font-bold text-sm transition-all flex items-center justify-center cursor-pointer border ${
                        isSelected
                          ? 'bg-brand-sunriseCoral text-white border-brand-sunriseCoral shadow-md shadow-brand-sunriseCoral/25 ring-2 ring-brand-sunriseCoral/50'
                          : 'bg-white/5 text-slate-200 border-white/10 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {`$${preset}`}
                    </button>
                  );
                })}
              </div>

              {/* Custom Amount Input */}
              <div className="relative mt-2">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                  $
                </span>
                <input
                  id="custom-donation-amount"
                  type="number"
                  min="1"
                  step="any"
                  value={customAmount}
                  onChange={handleCustomAmountChange}
                  placeholder="Custom amount"
                  aria-label="Custom donation amount in dollars"
                  className="w-full min-h-[44px] rounded-xl bg-slate-900 border border-slate-700 pl-8 pr-16 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-sunriseCoral focus:border-brand-sunriseCoral"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                  {campaign.currency || 'USD'}
                </span>
              </div>
            </div>

            {/* Anonymous Toggle */}
            <div className="space-y-2">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-brand-sunriseCoral focus:ring-brand-sunriseCoral cursor-pointer"
                />
                <span className="text-xs font-medium text-slate-200">
                  Keep my name private
                </span>
              </label>

              {!isAnonymous && (
                <div className="pt-1">
                  <input
                    type="text"
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    placeholder="Your name or organization (optional)"
                    aria-label="Donor name or organization"
                    className="w-full min-h-[44px] rounded-xl bg-slate-900 border border-slate-700 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-sunriseCoral"
                  />
                </div>
              )}
            </div>

            {/* Words of Encouragement Textarea */}
            <div className="space-y-1.5">
              <label
                htmlFor="donor-encouragement-message"
                className="block text-xs font-bold text-slate-300"
              >
                Words of encouragement
              </label>
              <textarea
                id="donor-encouragement-message"
                rows={3}
                maxLength={280}
                value={donorMessage}
                onChange={(e) => setDonorMessage(e.target.value)}
                placeholder="Share a message of solidarity, hope, or prayer with the affected Caribbean community..."
                aria-label="Words of encouragement message"
                className="w-full rounded-xl bg-slate-900 border border-slate-700 p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-sunriseCoral resize-none leading-relaxed"
              />
              <div className="flex justify-between text-[10px] text-slate-500 px-1">
                <span>Solidarity message</span>
                <span>{donorMessage.length} / 280</span>
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isPending || amountMinor < 100}
                className="w-full min-h-[44px] min-w-[44px] rounded-2xl bg-gradient-to-r from-brand-sunriseCoral via-pink-600 to-brand-goldenHour hover:opacity-95 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed font-extrabold text-white text-sm py-3.5 shadow-lg shadow-brand-sunriseCoral/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing Mutual Aid Gift...</span>
                  </>
                ) : (
                  <>
                    <Heart className="w-4 h-4 fill-white" />
                    <span>
                      Complete Donation of{' '}
                      {formatDonationAmount(amountMinor > 0 ? amountMinor : 0, campaign.currency || 'USD')}
                    </span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
