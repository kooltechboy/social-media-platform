import React from 'react';
import { formatPrice } from '@caribbean/business';

export default function CampaignsPage() {
  const campaigns = [
    {
      id: 'CMP-301',
      title: 'Carnival Coffee Roasters Promo',
      status: 'Active',
      budgetMinor: 50000, // $500.00
      spentMinor: 31250,
      impressions: 48900,
      clicks: 2140,
      ctr: '4.37%',
      target: 'Kingston, Port of Spain, Miami',
    },
    {
      id: 'CMP-302',
      title: 'Diaspora Holiday Gift Basket Push',
      status: 'Scheduled',
      budgetMinor: 100000, // $1,000.00
      spentMinor: 0,
      impressions: 0,
      clicks: 0,
      ctr: '0.00%',
      target: 'London, Toronto, NYC, Brooklyn',
    },
    {
      id: 'CMP-299',
      title: 'Summer Flash Sale: Island Spices',
      status: 'Completed',
      budgetMinor: 25000,
      spentMinor: 25000,
      impressions: 34100,
      clicks: 1890,
      ctr: '5.54%',
      target: 'Caribbean Basin Wide',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#2A1B38] pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white">Advertising Campaigns</h1>
          <p className="text-sm text-[#FDF2E9]/60">
            Reach engaged Caribbean diaspora audiences across Tukubi feeds, explore spotlight, and live audio lounges.
          </p>
        </div>
        <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#00B4D8] to-[#FFB347] text-white font-semibold text-sm shadow-md hover:opacity-95 transition-opacity">
          + Launch New Campaign
        </button>
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
              {campaigns.map((c) => (
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
