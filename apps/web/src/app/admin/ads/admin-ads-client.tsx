'use client';

import React, { useState } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Loader2, 
  ExternalLink, 
  Megaphone, 
  DollarSign, 
  ShieldCheck, 
  Clock, 
  Search,
  Eye,
  Filter
} from 'lucide-react';
import { 
  approveCampaignAdminAction, 
  rejectCampaignAdminAction 
} from '../../../lib/advertising/actions';

interface AdminAdsClientProps {
  initialCampaigns: any[];
}

const REJECTION_REASONS = [
  'Misleading claims or deceptive pricing',
  'Prohibited content (weapons, adult, illegal goods)',
  'Low quality creative or offensive imagery',
  'Broken, deceptive, or unsafe destination URL',
  'Discriminatory or non-compliant targeting',
  'Violates TUKUBI Caribbean Community Guidelines',
];

export default function AdminAdsClient({ initialCampaigns }: AdminAdsClientProps) {
  const [campaigns, setCampaigns] = useState<any[]>(initialCampaigns);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [rejectingCampaignId, setRejectingCampaignId] = useState<string | null>(null);
  const [selectedReason, setSelectedReason] = useState<string>(REJECTION_REASONS[0]);
  const [customReason, setCustomReason] = useState<string>('');
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleApprove = async (campaignId: string) => {
    setActionInProgress(campaignId);
    setFeedbackMessage(null);
    try {
      const res = await approveCampaignAdminAction(campaignId);
      if (res.success) {
        setCampaigns((prev) => prev.filter((c) => c.id !== campaignId));
        setFeedbackMessage({ type: 'success', text: `Campaign approved successfully for ad delivery.` });
      } else {
        setFeedbackMessage({ type: 'error', text: res.error || 'Failed to approve campaign' });
      }
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Error executing approval' });
    } finally {
      setActionInProgress(null);
    }
  };

  const handleReject = async (campaignId: string) => {
    setActionInProgress(campaignId);
    setFeedbackMessage(null);
    const reason = customReason.trim() ? `${selectedReason}: ${customReason.trim()}` : selectedReason;
    try {
      const res = await rejectCampaignAdminAction(campaignId, reason);
      if (res.success) {
        setCampaigns((prev) => prev.filter((c) => c.id !== campaignId));
        setRejectingCampaignId(null);
        setCustomReason('');
        setFeedbackMessage({ type: 'success', text: `Campaign rejected. Reason recorded for advertiser audit.` });
      } else {
        setFeedbackMessage({ type: 'error', text: res.error || 'Failed to reject campaign' });
      }
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Error executing rejection' });
    } finally {
      setActionInProgress(null);
    }
  };

  return (
    <div className="space-y-6">
      {feedbackMessage && (
        <div
          className={`p-4 rounded-xl border text-sm font-semibold flex items-center justify-between animate-fadeIn ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMessage.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="text-xs opacity-70 hover:opacity-100 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {campaigns.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/40 border border-slate-800 rounded-3xl p-8 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white">All Ad Campaigns Cleared</h2>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            There are no campaigns currently awaiting safety review or moderation clearance.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            {campaigns.length} Campaign{campaigns.length === 1 ? '' : 's'} Pending Review
          </div>

          <div className="grid grid-cols-1 gap-6">
            {campaigns.map((camp) => {
              const advertiser = Array.isArray(camp.advertisers) ? camp.advertisers[0] : camp.advertisers;
              const profile = advertiser?.profiles;
              const adSet = camp.ad_sets?.[0];
              const ad = adSet?.ads?.[0];
              const budgetFormatted = (Number(camp.budget_total_minor || 0) / 100).toFixed(2);
              const fundedFormatted = (Number(camp.funded_amount_minor || 0) / 100).toFixed(2);
              const isFunded = Number(camp.funded_amount_minor || 0) > 0;

              return (
                <div
                  key={camp.id}
                  className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5"
                >
                  {/* Campaign Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-black text-white">{camp.name}</h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          Pending Review
                        </span>
                        {isFunded ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Prepaid ${fundedFormatted}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-800 text-slate-400 border border-slate-700">
                            Unfunded (${budgetFormatted} Target)
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Advertiser: <span className="font-semibold text-slate-200">{advertiser?.name || 'Unknown'}</span>{' '}
                        {profile?.username ? `(@${profile.username})` : ''} • ID: <span className="font-mono text-slate-500">{camp.id.slice(0, 8)}</span>
                      </p>
                    </div>

                    <div className="text-xs text-slate-400">
                      Created: {new Date(camp.created_at).toLocaleString()}
                    </div>
                  </div>

                  {/* Ad Creative & Targeting Details */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Creative Preview */}
                    <div className="lg:col-span-2 bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 space-y-3">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5 text-brand-caribbeanSea" />
                        Creative Preview
                      </div>

                      {ad ? (
                        <div className="space-y-3">
                          <h4 className="text-base font-bold text-white">{ad.headline || 'No Headline'}</h4>
                          <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                            {ad.body || 'No primary copy'}
                          </p>

                          {ad.media_path && (
                            <div className="rounded-xl overflow-hidden border border-slate-800 bg-black/40 max-h-48 flex items-center justify-center">
                              <img
                                src={ad.media_path}
                                alt={ad.headline || 'Ad Creative'}
                                className="object-cover w-full h-full max-h-48"
                              />
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-2 text-xs">
                            <span className="text-slate-400 truncate max-w-xs">
                              URL:{' '}
                              <a
                                href={ad.destination_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-brand-caribbeanSea hover:underline inline-flex items-center gap-1 font-mono"
                              >
                                {ad.destination_url}
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </span>
                            <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 font-bold">
                              {ad.creative_type || 'single_image'}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 italic">No creative found in this campaign.</p>
                      )}
                    </div>

                    {/* Targeting & Objective Info */}
                    <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 space-y-4 text-xs">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Filter className="w-3.5 h-3.5 text-brand-goldenHour" />
                        Delivery Configuration
                      </div>

                      <div className="space-y-2">
                        <div>
                          <span className="text-slate-500">Objective:</span>
                          <span className="text-white font-bold ml-1 capitalize">
                            {(camp.objective_v2 || camp.objective || 'awareness').replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500">Placement:</span>
                          <span className="text-white font-bold ml-1 uppercase">{adSet?.placement || 'feed'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Target Region:</span>
                          <span className="text-white font-bold ml-1">{adSet?.country_iso || 'All Caribbean'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">CPM Bid:</span>
                          <span className="text-white font-bold ml-1 font-mono">
                            ${((adSet?.bid_cpm_minor || 800) / 100).toFixed(2)}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500">Funding Status:</span>
                          <span
                            className={`font-bold ml-1 ${
                              isFunded ? 'text-emerald-400' : 'text-amber-400'
                            }`}
                          >
                            {isFunded ? `Prepaid ($${fundedFormatted})` : 'Awaiting Payment'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Reject Reason Form (if toggled) */}
                  {rejectingCampaignId === camp.id && (
                    <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/40 space-y-3 animate-fadeIn">
                      <div className="flex items-center gap-2 text-rose-300 font-bold text-sm">
                        <AlertCircle className="w-4 h-4 text-rose-400" />
                        Select Policy Rejection Reason
                      </div>

                      <select
                        value={selectedReason}
                        onChange={(e) => setSelectedReason(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none"
                      >
                        {REJECTION_REASONS.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>

                      <input
                        type="text"
                        placeholder="Additional details / reviewer notes for advertiser (optional)..."
                        value={customReason}
                        onChange={(e) => setCustomReason(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none"
                      />

                      <div className="flex items-center justify-end gap-2 pt-2">
                        <button
                          onClick={() => setRejectingCampaignId(null)}
                          className="px-4 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleReject(camp.id)}
                          disabled={actionInProgress === camp.id}
                          className="px-4 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-1.5 shadow"
                        >
                          {actionInProgress === camp.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5" />
                          )}
                          <span>Confirm Rejection</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Action Bar */}
                  {rejectingCampaignId !== camp.id && (
                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button
                        onClick={() => setRejectingCampaignId(camp.id)}
                        disabled={actionInProgress === camp.id}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1.5 transition-colors"
                      >
                        <XCircle className="w-4 h-4 text-rose-400" />
                        <span>Reject Campaign</span>
                      </button>

                      <button
                        onClick={() => handleApprove(camp.id)}
                        disabled={actionInProgress === camp.id}
                        className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition-colors shadow-md shadow-emerald-600/20"
                      >
                        {actionInProgress === camp.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                        <span>Approve Campaign</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
