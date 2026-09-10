import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '../../lib/supabase/server';
import { fetchAdvertiserCampaignsAction } from '../../lib/advertising/actions';
import { Plus, BarChart2, Play, Pause, ExternalLink, Megaphone } from 'lucide-react';
import CampaignRow from './campaign-row';

export const dynamic = 'force-dynamic';

export default async function AdsDashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login?next=/ads');
  }

  const { campaigns, error } = await fetchAdvertiserCampaignsAction();

  if (error) {
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-4">Ads Manager</h1>
        <div className="p-4 bg-red-900/20 text-red-400 border border-red-900 rounded-xl">
          Error loading campaigns: {error}
        </div>
      </div>
    );
  }

  const totalSpendMinor = campaigns?.reduce((sum, c) => sum + (c.spendMinor || 0), 0) || 0;
  const totalSpend = (totalSpendMinor / 100).toFixed(2);
  const totalImpressions = campaigns?.reduce((sum, c) => sum + (c.impressions || 0), 0) || 0;
  const totalClicks = campaigns?.reduce((sum, c) => sum + (c.clicks || 0), 0) || 0;
  const avgCtr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00';

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">Ads Manager</h1>
          <p className="text-sm text-slate-400 mt-1">Manage your Caribbean campaigns</p>
        </div>
        <Link
          href="/ads/new"
          className="bg-brand-sunriseCoral hover:bg-brand-goldenHour text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" /> New Campaign
        </Link>
      </div>

      {campaigns && campaigns.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl">
              <div className="text-slate-400 text-sm font-bold mb-1">Total Spend</div>
              <div className="text-2xl font-black text-white">${totalSpend}</div>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl">
              <div className="text-slate-400 text-sm font-bold mb-1">Impressions</div>
              <div className="text-2xl font-black text-white">{totalImpressions.toLocaleString()}</div>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl">
              <div className="text-slate-400 text-sm font-bold mb-1">Avg. CTR</div>
              <div className="text-2xl font-black text-brand-caribbeanSea">{avgCtr}%</div>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl">
              <div className="text-slate-400 text-sm font-bold mb-1">Clicks</div>
              <div className="text-2xl font-black text-brand-goldenHour">{totalClicks.toLocaleString()}</div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/50 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <th className="p-4 font-bold">Campaign Name</th>
                  <th className="p-4 font-bold">Status</th>
                  <th className="p-4 font-bold">Objective</th>
                  <th className="p-4 font-bold">Spend</th>
                  <th className="p-4 font-bold">Impressions</th>
                  <th className="p-4 font-bold">CTR</th>
                  <th className="p-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {campaigns.map(camp => (
                  <CampaignRow key={camp.id} campaign={camp} />
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="text-center py-20 bg-slate-900/30 border border-slate-800 border-dashed rounded-3xl">
          <div className="w-20 h-20 bg-brand-sunriseCoral/10 text-brand-sunriseCoral rounded-full flex items-center justify-center mx-auto mb-4">
            <Megaphone className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">Launch your first Caribbean ad campaign</h2>
          <p className="text-slate-400 mb-6 max-w-md mx-auto">
            Connect with the Caribbean diaspora. Create ads that resonate with our culture and drive real results.
          </p>
          <Link
            href="/ads/new"
            className="inline-flex bg-brand-sunriseCoral hover:bg-brand-goldenHour text-white px-6 py-3 rounded-xl font-bold items-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" /> Create Campaign
          </Link>
        </div>
      )}
    </div>
  );
}
