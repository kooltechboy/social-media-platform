import React from 'react';
import { formatPrice } from '@caribbean/business';

export default function CampaignsPage() {
  const campaigns: Array<{
    id: string;
    title: string;
    status: string;
    budgetMinor: number;
    spentMinor: number;
    impressions: number;
    clicks: number;
    ctr: string;
    target: string;
  }> = [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#2A1B38] pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white">Advertising Campaigns</h1>
          <p className="text-sm text-[#FDF2E9]/60">
            Reach engaged Caribbean diaspora audiences across Tukubi feeds, explore spotlight, and live audio lounges.
          </p>
        </div>
        <a
          href="/business-center?tab=campaigns"
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#00B4D8] to-[#FFB347] text-[#110D17] font-bold text-sm shadow-md hover:opacity-95 transition-opacity inline-flex items-center justify-center"
        >
          + Launch New Campaign
        </a>
      </div>

      <div className="rounded-xl bg-[#1D1429] border border-[#2A1B38] p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[#FDF2E9]/80">
            <thead className="border-b border-[#2A1B38] text-xs uppercase text-[#FDF2E9]/50">
              <tr>
                <th className="py-3 px-2">Campaign</th>
                <th className="py-3 px-2">Status</th>
                <th className="py-3 px-2">Budget / Spent</th>
                <th className="py-3 px-2">Impressions</th>
                <th className="py-3 px-2">Clicks (CTR)</th>
                <th className="py-3 px-2">Target Audience</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A1B38]/60">
              {campaigns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#FDF2E9]/50">
                    <p className="text-sm font-semibold text-white">No advertising campaigns created yet</p>
                    <p className="text-xs mt-1">
                      Create and fund regional or diaspora ad campaigns in the canonical Business Center (`/business-center?tab=campaigns`, `ad_campaigns` table) to track live impressions and CTR here.
                    </p>
                  </td>
                </tr>
              ) : (
                campaigns.map((c) => (
                  <tr key={c.id}>
                    <td className="py-3 px-2">
                      <p className="font-semibold text-white">{c.title}</p>
                      <p className="text-xs font-mono text-[#00B4D8]">{c.id}</p>
                    </td>
                    <td className="py-3 px-2">
                      <span
                        className={`px-2.5 py-0.5 text-xs rounded-full border ${
                          c.status === 'Active'
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            : c.status === 'Scheduled'
                            ? 'bg-[#8B5CF6]/20 text-[#8B5CF6] border-[#8B5CF6]/30'
                            : 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-xs font-mono">
                      <span className="text-white">{formatPrice(c.spentMinor, 'USD')}</span>
                      <span className="text-[#FDF2E9]/50"> / {formatPrice(c.budgetMinor, 'USD')}</span>
                    </td>
                    <td className="py-3 px-2 font-mono text-white">{c.impressions.toLocaleString()}</td>
                    <td className="py-3 px-2 text-xs font-mono">
                      <span className="text-white">{c.clicks.toLocaleString()}</span>{' '}
                      <span className="text-[#FFB347]">({c.ctr})</span>
                    </td>
                    <td className="py-3 px-2 text-xs text-[#FDF2E9]/70">{c.target}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
