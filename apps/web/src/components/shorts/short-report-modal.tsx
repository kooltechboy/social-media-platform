'use client';

import React, { useState } from 'react';
import { X, AlertTriangle, ShieldCheck, CheckCircle2, Loader2 } from 'lucide-react';
import { reportShortAction } from '../../lib/media/short-actions';

interface ShortReportModalProps {
  isOpen: boolean;
  shortId: string;
  onClose: () => void;
}

const REPORT_REASONS = [
  { id: 'inappropriate', label: 'Inappropriate Content or Nudity' },
  { id: 'hate_speech', label: 'Hate Speech or Harassment' },
  { id: 'spam', label: 'Spam, Scam, or Misleading Information' },
  { id: 'copyright', label: 'Intellectual Property or Copyright Violation' },
  { id: 'violence', label: 'Violence or Dangerous Organizations' },
  { id: 'other', label: 'Other Safety Concern' },
];

export default function ShortReportModal({ isOpen, shortId, onClose }: ShortReportModalProps) {
  const [selectedReason, setSelectedReason] = useState(REPORT_REASONS[0].id);
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await reportShortAction(shortId, selectedReason, details.trim());
      if (res.success) {
        setIsSuccess(true);
        setTimeout(() => {
          setIsSuccess(false);
          onClose();
        }, 1500);
      } else {
        setErrorMessage(res.error || 'Failed to submit report.');
      }
    } catch {
      setErrorMessage('Network error submitting report.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0D1322] border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-black text-white">Report TUKUBI Short</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close report modal"
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isSuccess ? (
          <div className="py-8 text-center space-y-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <h4 className="text-base font-bold text-white">Report Received</h4>
            <p className="text-xs text-brand-sandstone/70">
              Thank you for keeping TUKUBI safe and respectful for Caribbean creators and diaspora members.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-xs text-brand-sandstone/70">
              Help our moderation team understand the issue with this Short.
            </p>

            {errorMessage && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                {errorMessage}
              </div>
            )}

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {REPORT_REASONS.map((r) => (
                <label
                  key={r.id}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                    selectedReason === r.id
                      ? 'bg-amber-500/10 border-amber-500/50 text-white font-bold'
                      : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <input
                    type="radio"
                    name="report_reason"
                    value={r.id}
                    checked={selectedReason === r.id}
                    onChange={() => setSelectedReason(r.id)}
                    className="accent-amber-500"
                  />
                  <span>{r.label}</span>
                </label>
              ))}
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                Additional Details (Optional)
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Provide context for our Trust &amp; Safety team..."
                rows={2}
                maxLength={300}
                className="w-full bg-brand-twilight border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black px-5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Submitting…
                  </>
                ) : (
                  'Submit Report'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
