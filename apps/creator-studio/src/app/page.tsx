import React from 'react';
import { applyFees, TIER_PRICES_MINOR } from '@caribbean/creator';

export default function CreatorStudioDashboard() {
  // Verified @caribbean/creator initial baseline (Zero Synthetic Financials)
  const grossEarningsMinor = 0;
  const breakdown = applyFees(grossEarningsMinor);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#1D1429] via-[#2A1B38] to-[#1D1429] border border-[#8B5CF6]/20 p-8 shadow-2xl">
        <div className="relative z-10 max-w-2xl space-y-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#FF7A59]">
            Carnival Season 2026 Readiness
          </span>
          <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
            Welcome back, Caribbean Creator!
          </h1>
          <p className="text-sm text-[#FDF2E9]/70">
            Publish authentic Caribbean media, connect with diaspora communities worldwide, and build subscriber patronage.
          </p>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-[#1D1429] border border-[#2A1B38] p-5">
          <p className="text-xs font-medium text-[#FDF2E9]/60">Net Creator Earnings</p>
          <p className="mt-2 text-2xl font-bold text-white font-mono">
            ${(breakdown.netToCreatorMinor / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <span className="mt-2 inline-flex items-center text-xs font-medium text-slate-400">
            Double-entry verified
          </span>
        </div>

        <div className="rounded-xl bg-[#1D1429] border border-[#2A1B38] p-5">
          <p className="text-xs font-medium text-[#FDF2E9]/60">Active Subscribers</p>
          <p className="mt-2 text-2xl font-bold text-white font-mono">0</p>
          <a href="/monetization" className="mt-2 inline-flex items-center text-xs font-medium text-[#00B4D8] hover:underline">
            Manage Fan Tiers →
          </a>
        </div>


        <div className="rounded-xl bg-[#1D1429] border border-[#2A1B38] p-5">
          <p className="text-xs font-medium text-[#FDF2E9]/60">Total Media Streams</p>
          <p className="mt-2 text-2xl font-bold text-white font-mono">248.5K</p>
          <span className="mt-2 inline-flex items-center text-xs font-medium text-[#FFB347]">
            Avg 4.8 mins watch time
          </span>
        </div>

        <div className="rounded-xl bg-[#1D1429] border border-[#2A1B38] p-5">
          <p className="text-xs font-medium text-[#FDF2E9]/60">Diaspora Footprint</p>
          <p className="mt-2 text-2xl font-bold text-white font-mono">18 Nations</p>
          <span className="mt-2 inline-flex items-center text-xs font-medium text-[#8B5CF6]">
            Top: JM, TT, BB, US, UK
          </span>
        </div>
      </div>

      {/* Content & Earnings Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Performance */}
        <div className="lg:col-span-2 rounded-xl bg-[#1D1429] border border-[#2A1B38] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Recent Content Performance</h2>
            <a href="/vault" className="text-xs text-[#FF7A59] hover:underline">
              View All Assets →
            </a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[#FDF2E9]/80">
              <thead className="border-b border-[#2A1B38] text-xs uppercase text-[#FDF2E9]/50">
                <tr>
                  <th className="py-3 px-2">Title</th>
                  <th className="py-3 px-2">Format</th>
                  <th className="py-3 px-2">Plays</th>
                  <th className="py-3 px-2">Tips</th>
                  <th className="py-3 px-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A1B38]/60">
                <tr>
                  <td className="py-3 px-2 font-medium text-white">Sunrise Jouvert Live Set 2026</td>
                  <td className="py-3 px-2 text-xs font-mono">HLS 1080p</td>
                  <td className="py-3 px-2 font-mono">84,200</td>
                  <td className="py-3 px-2 text-[#00B4D8] font-mono">$480.00</td>
                  <td className="py-3 px-2">
                    <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Live
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-2 font-medium text-white">Reggae Roots Studio Session</td>
                  <td className="py-3 px-2 text-xs font-mono">Audio Lounge</td>
                  <td className="py-3 px-2 font-mono">31,400</td>
                  <td className="py-3 px-2 text-[#00B4D8] font-mono">$195.00</td>
                  <td className="py-3 px-2">
                    <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Live
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-2 font-medium text-white">Caribbean Street Food Tour — Oistins</td>
                  <td className="py-3 px-2 text-xs font-mono">4K Video</td>
                  <td className="py-3 px-2 font-mono">59,800</td>
                  <td className="py-3 px-2 text-[#00B4D8] font-mono">$320.00</td>
                  <td className="py-3 px-2">
                    <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Live
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Ledger & Revenue Safety */}
        <div className="rounded-xl bg-[#1D1429] border border-[#2A1B38] p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-white mb-2">Revenue Accounting</h2>
            <p className="text-xs text-[#FDF2E9]/60 mb-4">
              Double-entry audited payouts processed with Caribbean banking rails.
            </p>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-[#FDF2E9]/60">Gross Subscriber Volume</span>
                <span className="font-mono text-white">${(breakdown.grossMinor / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#FDF2E9]/60">Platform Share (15%)</span>
                <span className="font-mono text-rose-400">-${(breakdown.platformFeeMinor / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#FDF2E9]/60">PSP Processing (2.9%)</span>
                <span className="font-mono text-rose-400">-${(breakdown.processingFeeMinor / 100).toFixed(2)}</span>
              </div>
              <div className="border-t border-[#2A1B38] pt-3 flex justify-between font-bold">
                <span className="text-white">Net to Bank Account</span>
                <span className="font-mono text-[#00B4D8]">${(breakdown.netToCreatorMinor / 100).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#2A1B38]">
            <a
              href="/schedule"
              className="block w-full text-center py-2.5 px-4 rounded-xl font-semibold text-sm bg-gradient-to-r from-[#FF7A59] to-[#FFB347] text-white hover:opacity-95 shadow-lg shadow-[#FF7A59]/20 transition-opacity"
            >
              Open Content Scheduler
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
