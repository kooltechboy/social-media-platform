'use client';
import React, { useState } from 'react';
import { Play, Pause, Loader2, CreditCard, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { updateCampaignStatusAction, initiateCampaignCheckoutAction } from '../../lib/advertising/actions';

export default function CampaignRow({ campaign }: { campaign: any }) {
  const [status, setStatus] = useState(campaign.status);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isFunding, setIsFunding] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function toggleStatus() {
    if (isUpdating) return;
    setIsUpdating(true);
    setErrorMessage(null);
    const newStatus = status === 'active' ? 'paused' : 'active';
    const res = await updateCampaignStatusAction(campaign.id, newStatus);
    if (!res.error) {
      setStatus(newStatus);
    } else {
      setErrorMessage(res.error);
    }
    setIsUpdating(false);
  }

  async function handleFund() {
    if (isFunding) return;
    setIsFunding(true);
    setErrorMessage(null);
    const res = await initiateCampaignCheckoutAction(campaign.id);
    if (res.success && res.approvalUrl) {
      window.location.href = res.approvalUrl;
      return;
    }
    setErrorMessage(res.error || 'Failed to initiate PayPal checkout');
    setIsFunding(false);
  }

  const spend = ((campaign.spendMinor || 0) / 100).toFixed(2);
  const funded = ((campaign.fundedAmountMinor || 0) / 100).toFixed(2);

  return (
    <tr className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
      <td className="p-4">
        <div className="font-bold text-white">{campaign.name}</div>
        {errorMessage && (
          <div className="text-[11px] text-rose-400 mt-1 flex items-center gap-1 font-semibold">
            <AlertCircle className="w-3 h-3 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </td>
      <td className="p-4">
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
          status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
          status === 'paused' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 
          status === 'completed' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
          'bg-slate-500/10 text-slate-400 border border-slate-500/20'
        }`}>
          {status}
        </span>
      </td>
      <td className="p-4">
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
          campaign.moderationStatus === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
          campaign.moderationStatus === 'rejected' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
          'bg-amber-500/10 text-amber-400 border border-amber-500/20'
        }`}
        title={campaign.moderationReason || ''}
        >
          {campaign.moderationStatus === 'approved' && <CheckCircle className="w-3 h-3" />}
          {campaign.moderationStatus === 'rejected' && <AlertCircle className="w-3 h-3" />}
          {campaign.moderationStatus === 'pending' && <Clock className="w-3 h-3" />}
          <span className="capitalize">{campaign.moderationStatus || 'pending'}</span>
        </span>
      </td>
      <td className="p-4 text-slate-300 capitalize">{campaign.objective.replace(/_/g, ' ')}</td>
      <td className="p-4 text-emerald-400 font-mono">${funded}</td>
      <td className="p-4 text-white font-mono">${spend}</td>
      <td className="p-4 text-slate-300 font-mono">{campaign.impressions.toLocaleString()}</td>
      <td className="p-4 text-slate-300 font-mono">{campaign.ctr.toFixed(2)}%</td>
      <td className="p-4 text-right">
        <div className="flex items-center justify-end gap-2">
          {Number(campaign.fundedAmountMinor || 0) === 0 && (
            <button
              onClick={handleFund}
              disabled={isFunding}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all"
              title="Authorize prepaid budget via PayPal"
            >
              {isFunding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CreditCard className="w-3.5 h-3.5" />}
              <span>Fund via PayPal</span>
            </button>
          )}
          <button
            onClick={toggleStatus}
            disabled={isUpdating || Number(campaign.fundedAmountMinor || 0) === 0 || campaign.moderationStatus === 'rejected'}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-40"
            title={status === 'active' ? 'Pause Campaign' : 'Resume Campaign'}
          >
            {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : 
             status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
        </div>
      </td>
    </tr>
  );
}
