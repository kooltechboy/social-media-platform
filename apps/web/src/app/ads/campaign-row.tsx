'use client';
import React, { useState } from 'react';
import { Play, Pause, Loader2 } from 'lucide-react';
import { updateCampaignStatusAction } from '../../lib/advertising/actions';

export default function CampaignRow({ campaign }: { campaign: any }) {
  const [status, setStatus] = useState(campaign.status);
  const [isUpdating, setIsUpdating] = useState(false);

  async function toggleStatus() {
    if (isUpdating) return;
    setIsUpdating(true);
    const newStatus = status === 'active' ? 'paused' : 'active';
    const res = await updateCampaignStatusAction(campaign.id, newStatus);
    if (!res.error) {
      setStatus(newStatus);
    }
    setIsUpdating(false);
  }

  const spend = (campaign.spendMinor / 100).toFixed(2);
  
  return (
    <tr className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
      <td className="p-4 font-bold text-white">{campaign.name}</td>
      <td className="p-4">
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
          status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
          status === 'paused' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 
          'bg-slate-500/10 text-slate-400 border border-slate-500/20'
        }`}>
          {status}
        </span>
      </td>
      <td className="p-4 text-slate-300 capitalize">{campaign.objective.replace(/_/g, ' ')}</td>
      <td className="p-4 text-white font-mono">${spend}</td>
      <td className="p-4 text-slate-300 font-mono">{campaign.impressions.toLocaleString()}</td>
      <td className="p-4 text-slate-300 font-mono">{campaign.ctr.toFixed(2)}%</td>
      <td className="p-4 text-right">
        <button
          onClick={toggleStatus}
          disabled={isUpdating}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          title={status === 'active' ? 'Pause Campaign' : 'Resume Campaign'}
        >
          {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : 
           status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>
      </td>
    </tr>
  );
}
