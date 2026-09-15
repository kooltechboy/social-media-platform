'use client';

import React, { useState, useTransition } from 'react';
import { Share2, Copy, Check, X, MessageSquare, Send, Sparkles, Link as LinkIcon } from 'lucide-react';
import { createAffiliateLinkAction } from '../../lib/marketplace/actions';

interface ShareProductModalProps {
  productId: string;
  productTitle: string;
  isOpen: boolean;
  onClose: () => void;
  isCreator?: boolean;
}

export default function ShareProductModal({
  productId,
  productTitle,
  isOpen,
  onClose,
  isCreator = false,
}: ShareProductModalProps) {
  const [copied, setCopied] = useState(false);
  const [affiliateCode, setAffiliateCode] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://tukubi.com';
  const shareUrl = affiliateCode
    ? `${origin}/marketplace/${productId}?ref=${affiliateCode}`
    : `${origin}/marketplace/${productId}`;

  const handleCopy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleGenerateAffiliate = () => {
    startTransition(async () => {
      const res = await createAffiliateLinkAction(productId);
      if (res.referralCode) {
        setAffiliateCode(res.referralCode);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="surface-card border border-white/15 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-brand-sandstone/60 hover:text-white p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1">
          <div className="flex items-center gap-2 text-brand-caribbeanSea text-xs font-black uppercase tracking-wider">
            <Share2 className="w-4 h-4" /> Share Product
          </div>
          <h2 className="text-xl font-black text-white">{productTitle}</h2>
          <p className="text-xs text-brand-sandstone/70">
            Share authentic Caribbean goods across TUKUBI social and external networks.
          </p>
        </div>

        {/* Copy Link Input */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-brand-sandstone/80">
            Product Link
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 bg-slate-950/80 border border-white/20 rounded-xl px-3 py-2 text-xs font-mono text-white truncate focus:outline-none"
            />
            <button
              onClick={handleCopy}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shrink-0"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Social Quick Share Buttons */}
        <div className="space-y-2 pt-2 border-t border-white/10">
          <label className="block text-xs font-bold text-brand-sandstone/80">
            Share Inside TUKUBI
          </label>
          <div className="grid grid-cols-2 gap-2 text-xs font-bold">
            <a
              href={`/messages?shareProduct=${productId}&title=${encodeURIComponent(productTitle)}`}
              className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white flex items-center gap-2.5 transition-all"
            >
              <Send className="w-4 h-4 text-brand-caribbeanSea" />
              <span>Send in Chat</span>
            </a>
            <a
              href={`/create?productTag=${productId}&caption=${encodeURIComponent(`Check out ${productTitle} on TUKUBI Marketplace!`)}`}
              className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white flex items-center gap-2.5 transition-all"
            >
              <MessageSquare className="w-4 h-4 text-orange-400" />
              <span>Post to Feed</span>
            </a>
          </div>
        </div>

        {/* Creator Affiliate Section */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 to-slate-900 border border-purple-500/30 space-y-2 text-xs">
          <div className="flex items-center gap-2 text-purple-300 font-bold">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>Creator Affiliate Commerce</span>
          </div>
          <p className="text-[11px] text-brand-sandstone/70 leading-relaxed">
            Earn <strong className="text-white">5.0% commission</strong> on every sale made through your trackable affiliate link.
          </p>
          {!affiliateCode ? (
            <button
              onClick={handleGenerateAffiliate}
              disabled={isPending}
              className="w-full py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-md"
            >
              {isPending ? 'Generating Link...' : 'Generate My Affiliate Link'}
            </button>
          ) : (
            <div className="p-2 rounded-xl bg-purple-900/40 border border-purple-400/40 text-[11px] font-mono text-purple-200 truncate">
              Code: {affiliateCode} (Active)
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
