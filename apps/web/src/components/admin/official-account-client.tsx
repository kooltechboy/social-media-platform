'use client';

import React, { useState, useTransition } from 'react';
import {
  Sparkles,
  Send,
  FileText,
  CheckCircle2,
  Clock,
  Pin,
  Bot,
  UserCheck,
  AlertTriangle,
  Plus,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import OfficialBadge from '../official/official-badge';
import UserAvatar from '../user-avatar';
import {
  createOfficialDraftAction,
  publishOfficialDraftAction,
  directPublishOfficialPostAction,
} from '../../lib/official/actions';
import {
  OfficialAccount,
  OfficialAccountOperator,
  OfficialPostDraft,
  OfficialContentType,
} from '../../lib/official/types';

interface OfficialAccountClientProps {
  officialAccount: OfficialAccount;
  operators: OfficialAccountOperator[];
  drafts: OfficialPostDraft[];
  currentUserId: string;
}

export default function OfficialAccountClient({
  officialAccount,
  operators,
  drafts,
  currentUserId,
}: OfficialAccountClientProps) {
  const [activeTab, setActiveTab] = useState<'studio' | 'drafts' | 'operators'>('studio');
  const [publishMode, setPublishMode] = useState<'direct' | 'draft'>('direct');
  const [content, setContent] = useState('');
  const [contentType, setContentType] = useState<OfficialContentType>('announcement');
  const [culturalTags, setCulturalTags] = useState('caribbean, tukubiofficial, platform');
  const [mediaUrls, setMediaUrls] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  const [isPending, startTransition] = useTransition();

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!content.trim()) {
      setFeedback({ type: 'error', message: 'Post content cannot be empty.' });
      return;
    }

    const formData = new FormData();
    formData.append('official_account_id', officialAccount.id);
    formData.append('content', content);
    formData.append('content_type', contentType);
    formData.append('is_pinned', isPinned ? 'true' : 'false');
    formData.append('cultural_tags', culturalTags);
    if (mediaUrls.trim()) {
      formData.append('media_urls', mediaUrls);
    }

    startTransition(async () => {
      try {
        if (publishMode === 'direct') {
          const res = await directPublishOfficialPostAction({ success: false }, formData);
          if (res.success) {
            setFeedback({
              type: 'success',
              message: 'Official post published successfully to the live feed!',
            });
            setContent('');
            setMediaUrls('');
            setIsPinned(false);
          } else {
            setFeedback({ type: 'error', message: res.error || 'Failed to publish post.' });
          }
        } else {
          const res = await createOfficialDraftAction({ success: false }, formData);
          if (res.success) {
            setFeedback({
              type: 'success',
              message: 'Draft saved to official queue for review.',
            });
            setContent('');
            setMediaUrls('');
            setActiveTab('drafts');
          } else {
            setFeedback({ type: 'error', message: res.error || 'Failed to create draft.' });
          }
        }
      } catch (err: any) {
        setFeedback({ type: 'error', message: err.message || 'An unexpected error occurred.' });
      }
    });
  };

  const handlePublishDraft = (draftId: string) => {
    setFeedback(null);
    startTransition(async () => {
      try {
        const res = await publishOfficialDraftAction(draftId);
        if (res.success) {
          setFeedback({
            type: 'success',
            message: 'Draft approved and published to live feed!',
          });
        } else {
          setFeedback({ type: 'error', message: res.error || 'Failed to publish draft.' });
        }
      } catch (err: any) {
        setFeedback({ type: 'error', message: err.message || 'Action failed.' });
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Official Account Overview Card */}
      <div className="bg-brand-dusk/80 border border-slate-800 rounded-3xl p-6 relative overflow-hidden shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <UserAvatar
              src={officialAccount.profile?.avatar_url}
              name={officialAccount.profile?.display_name || 'TUKUBI'}
              size="lg"
              className="ring-2 ring-[#0EA5E9]/40"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-brand-sandstone">
                  {officialAccount.profile?.display_name || 'TUKUBI'}
                </h2>
                <OfficialBadge size="md" showLabel={true} label="Official TUKUBI" />
              </div>
              <p className="text-xs text-brand-sandstone/60 font-semibold mt-0.5">
                @{officialAccount.profile?.username || 'tukubi'} •{' '}
                <span className="text-[#38BDF8] capitalize">
                  {officialAccount.classification.replace('_', ' ')}
                </span>
                {officialAccount.department && ` • ${officialAccount.department}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Active System Identity
            </span>
          </div>
        </div>

        <p className="text-xs text-brand-sandstone/70 leading-relaxed mt-4 bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800/80 whitespace-pre-line font-medium">
          {officialAccount.profile?.bio}
        </p>
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold border flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('studio')}
          className={`text-xs font-black px-4 py-2 rounded-xl transition-colors flex items-center gap-2 ${
            activeTab === 'studio'
              ? 'bg-brand-caribbeanSea text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-brand-sandstone hover:bg-slate-800/50'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Publishing Studio
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('drafts')}
          className={`text-xs font-black px-4 py-2 rounded-xl transition-colors flex items-center gap-2 ${
            activeTab === 'drafts'
              ? 'bg-brand-caribbeanSea text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-brand-sandstone hover:bg-slate-800/50'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Drafts &amp; Bot Queue ({drafts.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('operators')}
          className={`text-xs font-black px-4 py-2 rounded-xl transition-colors flex items-center gap-2 ${
            activeTab === 'operators'
              ? 'bg-brand-caribbeanSea text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-brand-sandstone hover:bg-slate-800/50'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Operators ({operators.length})
        </button>
      </div>

      {/* TAB 1: STUDIO */}
      {activeTab === 'studio' && (
        <form onSubmit={handlePublish} className="bg-brand-dusk/70 border border-slate-800 rounded-3xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-brand-sandstone flex items-center gap-2">
              <Send className="w-4 h-4 text-brand-caribbeanSea" />
              Compose as @{officialAccount.profile?.username}
            </h3>

            <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setPublishMode('direct')}
                className={`text-[11px] font-bold px-3 py-1 rounded-lg transition-colors ${
                  publishMode === 'direct'
                    ? 'bg-brand-caribbeanSea text-slate-950'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Publish Directly
              </button>
              <button
                type="button"
                onClick={() => setPublishMode('draft')}
                className={`text-[11px] font-bold px-3 py-1 rounded-lg transition-colors ${
                  publishMode === 'draft'
                    ? 'bg-brand-caribbeanSea text-slate-950'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Save as Draft
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-sandstone/70 mb-1.5">
              Official Post Content
            </label>
            <textarea
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="🌴 Share an official platform update, cultural highlight, creator spotlight, or community announcement..."
              className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-4 text-sm text-brand-sandstone placeholder-slate-500 focus:outline-none focus:border-brand-caribbeanSea transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-brand-sandstone/70 mb-1.5">
                Official Content Taxonomy
              </label>
              <select
                value={contentType}
                onChange={(e) => setContentType(e.target.value as OfficialContentType)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-brand-caribbeanSea"
              >
                <option value="announcement">Announcement (Executive / Platform)</option>
                <option value="platform_update">Platform Update / Features</option>
                <option value="community">Community News</option>
                <option value="creator_spotlight">Creator Spotlight</option>
                <option value="business_spotlight">Business &amp; Merchant Spotlight</option>
                <option value="culture">Caribbean Culture &amp; Heritage</option>
                <option value="diaspora">Global Diaspora Connect</option>
                <option value="event">Ecosystem Event</option>
                <option value="education">Education &amp; How-To</option>
                <option value="safety">Trust &amp; Safety Notice</option>
                <option value="welcome">Welcome to TUKUBI</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-sandstone/70 mb-1.5">
                Cultural &amp; Discovery Tags (comma separated)
              </label>
              <input
                type="text"
                value={culturalTags}
                onChange={(e) => setCulturalTags(e.target.value)}
                placeholder="caribbean, tukubiofficial, spotlight"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-brand-caribbeanSea"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-sandstone/70 mb-1.5">
              Media Image/Video URLs (optional, comma separated)
            </label>
            <input
              type="text"
              value={mediaUrls}
              onChange={(e) => setMediaUrls(e.target.value)}
              placeholder="https://images.unsplash.com/photo-..., https://..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-brand-caribbeanSea"
            />
          </div>

          {publishMode === 'direct' && (
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isPinned"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 text-brand-caribbeanSea focus:ring-0"
              />
              <label htmlFor="isPinned" className="text-xs font-bold text-slate-300 flex items-center gap-1 cursor-pointer">
                <Pin className="w-3.5 h-3.5 text-brand-sunriseCoral" />
                Pin this post to the top of the TUKUBI Home Feed and Profile
              </label>
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isPending || !content.trim()}
              className="bg-brand-caribbeanSea hover:bg-[#38BDF8] disabled:opacity-50 text-slate-950 text-xs font-black px-6 py-2.5 rounded-xl transition-all shadow-lg flex items-center gap-2"
            >
              {isPending ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {publishMode === 'direct' ? 'Publish Official Post' : 'Save Draft to Queue'}
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: DRAFTS & BOT QUEUE */}
      {activeTab === 'drafts' && (
        <div className="space-y-4">
          {drafts.length === 0 ? (
            <div className="bg-brand-dusk/40 border border-dashed border-slate-800 rounded-3xl p-10 text-center space-y-2">
              <FileText className="w-8 h-8 mx-auto text-brand-sandstone/30" />
              <h4 className="text-sm font-bold text-brand-sandstone">No pending drafts or bot submissions</h4>
              <p className="text-xs text-brand-sandstone/50 max-w-sm mx-auto">
                Drafts created by operators or prepared by the TUKUBI Bot will appear here for review and approval.
              </p>
            </div>
          ) : (
            drafts.map((draft) => (
              <div
                key={draft.id}
                className="bg-brand-dusk/70 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-colors space-y-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {draft.actor_type === 'system_bot' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        <Bot className="w-3 h-3" /> TUKUBI Bot
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-300 border border-sky-500/30">
                        <UserCheck className="w-3 h-3" /> Operator Draft
                      </span>
                    )}

                    <span className="text-[10px] font-bold text-slate-400 capitalize bg-slate-800/80 px-2 py-0.5 rounded-md">
                      {draft.content_type.replace('_', ' ')}
                    </span>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        draft.status === 'approved'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : draft.status === 'published'
                          ? 'bg-blue-500/20 text-blue-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {draft.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>

                  <span className="text-[11px] text-slate-500">
                    {new Date(draft.created_at).toLocaleDateString()}
                  </span>
                </div>

                <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap bg-slate-900/50 p-3 rounded-xl border border-slate-800/60">
                  {draft.content}
                </p>

                <div className="flex items-center justify-between pt-2">
                  <div className="text-[11px] text-slate-400">
                    {draft.author_profile?.display_name && (
                      <span>Drafted by @{draft.author_profile.username}</span>
                    )}
                  </div>

                  {draft.status !== 'published' && (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handlePublishDraft(draft.id)}
                      className="bg-brand-caribbeanSea hover:bg-[#38BDF8] disabled:opacity-50 text-slate-950 text-[11px] font-black px-4 py-1.5 rounded-xl transition-all shadow-md flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Approve &amp; Publish to Feed
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: OPERATORS */}
      {activeTab === 'operators' && (
        <div className="bg-brand-dusk/70 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-brand-sandstone flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-brand-caribbeanSea" />
              Authorized Platform Operators
            </h3>
          </div>

          <p className="text-xs text-brand-sandstone/60 leading-relaxed">
            Operators are authorized staff members from KOOL TECH SOLUTIONS / TUKUBI who possess cryptographic and database clearance to publish and draft on behalf of @tukubi.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {operators.map((op) => (
              <div
                key={op.id}
                className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <UserAvatar
                    src={op.operator_profile?.avatar_url}
                    name={op.operator_profile?.display_name || 'Operator'}
                    size="sm"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">
                      {op.operator_profile?.display_name || 'Operator'}
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      @{op.operator_profile?.username || 'user'}
                    </p>
                  </div>
                </div>

                <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-brand-caribbeanSea/20 text-brand-caribbeanSea border border-brand-caribbeanSea/30">
                  {op.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
