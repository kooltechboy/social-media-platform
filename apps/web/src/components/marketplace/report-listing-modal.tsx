'use client';

import React, { useState, useTransition } from 'react';
import { Flag, X, AlertCircle, CheckCircle, ShieldAlert } from 'lucide-react';
import { reportListingAction } from '../../lib/marketplace/actions';

interface ReportListingModalProps {
  productId: string;
  productTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

const REPORT_REASONS = [
  { id: 'counterfeit', label: 'Suspected Counterfeit / Inauthentic Item' },
  { id: 'scam', label: 'Fraud, Scam, or Off-Platform Solicitation' },
  { id: 'prohibited', label: 'Prohibited, Dangerous, or Regulated Goods' },
  { id: 'misleading', label: 'Misleading Description or Stolen Media' },
  { id: 'inappropriate', label: 'Offensive or Inappropriate Content' },
];

export default function ReportListingModal({
  productId,
  productTitle,
  isOpen,
  onClose,
}: ReportListingModalProps) {
  const [reason, setReason] = useState(REPORT_REASONS[0].id);
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const res = await reportListingAction(productId, reason, description);
      if (res.error) {
        setError(res.error);
      } else {
        setSuccess('Thank you. TUKUBI Trust & Safety has received your report for review.');
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="surface-card border border-rose-500/30 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-brand-sandstone/60 hover:text-white p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1">
          <div className="flex items-center gap-2 text-rose-400 text-xs font-black uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4" /> Trust &amp; Safety Report
          </div>
          <h2 className="text-xl font-black text-white">Report Listing</h2>
          <p className="text-xs text-brand-sandstone/70 truncate">{productTitle}</p>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-brand-sandstone/90 mb-1.5">
              Reason for Report
            </label>
            <div className="space-y-2">
              {REPORT_REASONS.map((r) => (
                <label
                  key={r.id}
                  className={`flex items-center gap-2.5 p-3 rounded-2xl border text-xs cursor-pointer transition-all ${
                    reason === r.id
                      ? 'bg-rose-500/10 border-rose-500/50 text-white font-bold'
                      : 'bg-white/5 border-white/10 text-brand-sandstone/70 hover:text-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="reportReason"
                    value={r.id}
                    checked={reason === r.id}
                    onChange={(e) => setReason(e.target.value)}
                    className="accent-rose-500"
                  />
                  <span>{r.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-sandstone/90 mb-1.5">
              Additional Details (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide any relevant context to assist our investigation..."
              rows={3}
              className="w-full bg-slate-950/80 border border-white/20 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-brand-sandstone/40 focus:outline-none focus:border-rose-500 resize-none"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl border border-white/15 text-white font-bold text-xs hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || !!success}
              className="flex-1 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-black text-xs transition-all shadow-md shadow-rose-600/20"
            >
              {isPending ? 'Submitting Report...' : 'Submit to Trust & Safety'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
