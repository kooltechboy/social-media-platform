'use client';

import React, { useState } from 'react';
import { Shield, ShieldCheck, AlertCircle, X, Calendar, Users, Loader2 } from 'lucide-react';
import { updateAgeVerificationAction, linkParentGuardianAction } from '../../lib/safety/actions';
import { calculateAge, resolveAgeTier } from '../../lib/safety/age-service';

export interface AgeVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDob?: string;
  onSuccess?: (ageTier: string) => void;
}

export default function AgeVerificationModal({
  isOpen,
  onClose,
  currentDob,
  onSuccess,
}: AgeVerificationModalProps) {
  const [dob, setDob] = useState(currentDob || '');
  const [parentUsername, setParentUsername] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const age = dob ? calculateAge(dob) : null;
  const tier = age !== null ? resolveAgeTier(age) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dob) {
      setErrorMessage('Please enter your date of birth.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await updateAgeVerificationAction(dob);
      if (!res.success) {
        setErrorMessage(res.error || 'Failed to update age verification.');
        setIsSubmitting(false);
        return;
      }

      // If user is under 18 and provided parent username, link parent
      if (tier === '13_to_17' || tier === 'under_13') {
        if (parentUsername.trim()) {
          await linkParentGuardianAction(parentUsername.trim());
        }
      }

      setSuccessMessage('Age tier verified! Privacy settings updated.');
      if (onSuccess && res.ageTier) {
        onSuccess(res.ageTier);
      }
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch {
      setErrorMessage('An unexpected error occurred while saving.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md rounded-3xl bg-[#0A0F22] border border-white/15 p-6 shadow-2xl text-brand-sandstone">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-caribbeanSea to-brand-sunriseCoral p-0.5 shadow-md shadow-brand-caribbeanSea/20">
            <div className="w-full h-full bg-[#0A1024] rounded-[14px] flex items-center justify-center text-brand-caribbeanSea">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Age & Child Safety Verification</h3>
            <p className="text-xs text-white/50">COPPA & Global Online Privacy Standards</p>
          </div>
        </div>

        <p className="text-xs text-brand-sandstone/70 leading-relaxed mb-4">
          TUKUBI enforces strict child safety safeguards. Minor profiles receive automatic protections,
          including restricted direct messages from unknown adults and safe content defaults.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* DOB Picker */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-white flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-brand-caribbeanSea" />
              <span>Date of Birth</span>
            </label>
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-xs focus:outline-none focus:border-brand-caribbeanSea transition-colors cursor-pointer"
            />
          </div>

          {/* Age Tier Indicator */}
          {age !== null && (
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs flex items-center justify-between">
              <span className="text-white/60">Detected Category:</span>
              <span className="font-bold text-brand-caribbeanSea">
                {tier === 'under_13' ? 'Child (Under 13 - Parental Gate)' : tier === '13_to_17' ? 'Teen (13-17 Protected Minor)' : 'Adult (18+)'}
              </span>
            </div>
          )}

          {/* Optional Parent Guardian Linking for Minors */}
          {(tier === '13_to_17' || tier === 'under_13') && (
            <div className="space-y-1.5 pt-2 border-t border-white/10">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-brand-goldenHour" />
                <span>Parent or Legal Guardian Username</span>
              </label>
              <input
                type="text"
                value={parentUsername}
                onChange={(e) => setParentUsername(e.target.value)}
                placeholder="@parent_username"
                className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/15 text-white text-xs focus:outline-none focus:border-brand-goldenHour transition-colors"
              />
              <p className="text-[11px] text-white/50">
                A consent verification ping will be routed to your guardian&apos;s account.
              </p>
            </div>
          )}

          {/* Feedback messages */}
          {errorMessage && (
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
          {successMessage && (
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-white/80 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !dob}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-brand-caribbeanSea to-cyan-400 text-slate-950 text-xs font-black transition-all hover:brightness-110 active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Verify & Save</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
