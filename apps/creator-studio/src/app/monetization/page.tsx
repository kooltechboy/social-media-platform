import React from 'react';
import { DollarSign, ShieldCheck, Sparkles, Layers, Users, ExternalLink } from 'lucide-react';
import { CREATOR_TIERS } from '@caribbean/payments';

export default function CreatorStudioMonetizationPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-[#2A1B38] pb-6">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#FF7A59]">
          <Sparkles className="w-4 h-4" />
          <span>Creator Economy &amp; Patronage</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight mt-1">
          Monetization Command Center
        </h1>
        <p className="text-sm text-[#FDF2E9]/70 mt-1 max-w-2xl">
          Set up custom subscriber tiers, review real-time fan tipping, and manage verified double-entry disbursements.
        </p>
      </div>

      {/* Metrics Row (Authentic Zero Baseline) */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-[#1D1429] border border-[#2A1B38] p-5 space-y-1">
          <p className="text-xs font-medium text-[#FDF2E9]/60">Available for Payout</p>
          <p className="text-2xl font-bold text-white font-mono">$0.00</p>
          <p className="text-[11px] text-slate-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Double-entry verified
          </p>
        </div>

        <div className="rounded-xl bg-[#1D1429] border border-[#2A1B38] p-5 space-y-1">
          <p className="text-xs font-medium text-[#FDF2E9]/60">Monthly Subscriber Run-Rate</p>
          <p className="text-2xl font-bold text-emerald-400 font-mono">$0.00</p>
          <p className="text-[11px] text-slate-400">0 Active Members</p>
        </div>

        <div className="rounded-xl bg-[#1D1429] border border-[#2A1B38] p-5 space-y-1">
          <p className="text-xs font-medium text-[#FDF2E9]/60">Fan Tips &amp; Live Gifts</p>
          <p className="text-2xl font-bold text-[#FFB347] font-mono">$0.00</p>
          <p className="text-[11px] text-slate-400">0 Transactions</p>
        </div>

        <div className="rounded-xl bg-[#1D1429] border border-[#2A1B38] p-5 space-y-1">
          <p className="text-xs font-medium text-[#FDF2E9]/60">Minimum Payout Threshold</p>
          <p className="text-2xl font-bold text-white font-mono">$50.00</p>
          <p className="text-[11px] text-slate-400">Standard Caribbean Rail</p>
        </div>
      </div>

      {/* Standard Platform Tiers */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Platform Creator Tiers &amp; Commission Rates</h2>
            <p className="text-xs text-[#FDF2E9]/60">
              Upgrade your creator plan to unlock reduced platform fees on fan tips and exclusive HD streaming capabilities.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {Object.values(CREATOR_TIERS).map((tier) => (
            <div key={tier.id} className="rounded-2xl bg-[#1D1429] border border-[#2A1B38] p-6 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <h3 className="text-base font-bold text-white">{tier.name}</h3>
                  <span className="text-xs font-mono font-bold text-[#FFB347]">
                    {tier.priceMinor === 0 ? 'Free' : `$${(tier.priceMinor / 100).toFixed(2)}/mo`}
                  </span>
                </div>
                <div className="text-xs text-slate-300 font-semibold">
                  Platform Commission: <strong className="text-emerald-400">{tier.platformFeeBps / 100}%</strong>
                </div>
                <ul className="space-y-2 text-xs text-[#FDF2E9]/70 pt-2 border-t border-[#2A1B38]">
                  {tier.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00B4D8]" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-4 border-t border-[#2A1B38]">
                <span className="text-[11px] text-emerald-400 font-bold block">
                  Promotional Launch Access Active
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
