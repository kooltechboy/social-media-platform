'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import {
  Film,
  Mic,
  Tv,
  FileText,
  Clock,
  Trash2,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Play,
  Calendar,
  Layers,
  Radio,
  Plus,
  Search,
  Filter,
  Loader2,
} from 'lucide-react';
import {
  deletePodcastAction,
  deletePodcastEpisodeAction,
  publishDraftEpisodeAction,
} from '../../lib/podcasts/actions';
import {
  deleteLivestreamAction,
  startScheduledLivestreamAction,
} from '../../lib/live/actions';
import { deleteDraftAction, type CreatorDraftItem } from '../../lib/creator/draft-actions';
import CreatePodcastModal from '../podcasts/create-podcast-modal';

export interface CreatorVideoItem {
  id: string;
  title: string;
  video_kind: string;
  view_count: number;
  visibility: string;
  created_at: string;
}

export interface CreatorPodcastEpisodeItem {
  id: string;
  title: string;
  season_number: number;
  episode_number: number;
  duration_seconds: number;
  published_at: string | null;
  scheduled_for: string | null;
  is_subscriber_only: boolean;
  audio_path: string;
}

export interface CreatorPodcastItem {
  id: string;
  title: string;
  slug: string;
  follower_count: number;
  episodes: CreatorPodcastEpisodeItem[];
}

export interface CreatorLivestreamItem {
  id: string;
  title: string;
  state: 'scheduled' | 'live' | 'ended' | 'cancelled';
  access_level: string;
  peak_viewers: number;
  scheduled_for: string | null;
  started_at: string | null;
  ended_at: string | null;
  stream_url?: string | null;
}

interface CreatorContentManagerProps {
  user: { id: string; displayName: string; username?: string };
  videos: CreatorVideoItem[];
  podcasts: CreatorPodcastItem[];
  livestreams: CreatorLivestreamItem[];
  drafts: CreatorDraftItem[];
  initialTab?: 'all' | 'videos' | 'podcasts' | 'livestreams' | 'drafts';
}

export default function CreatorContentManager({
  user,
  videos,
  podcasts,
  livestreams,
  drafts,
  initialTab = 'all',
}: CreatorContentManagerProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'videos' | 'podcasts' | 'livestreams' | 'drafts'>(initialTab);
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft' | 'scheduled'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isPodcastModalOpen, setIsPodcastModalOpen] = useState(false);

  function clearFeedback() {
    setFeedback(null);
  }

  function handleDeletePodcast(podcastId: string) {
    if (!confirm('Are you sure you want to delete this entire podcast show and its episodes?')) return;
    startTransition(async () => {
      clearFeedback();
      const res = await deletePodcastAction(podcastId);
      if (res.success) {
        setFeedback({ type: 'success', message: 'Podcast show deleted successfully.' });
        window.location.reload();
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to delete podcast.' });
      }
    });
  }

  function handleDeleteEpisode(episodeId: string) {
    if (!confirm('Are you sure you want to delete this episode?')) return;
    startTransition(async () => {
      clearFeedback();
      const res = await deletePodcastEpisodeAction(episodeId);
      if (res.success) {
        setFeedback({ type: 'success', message: 'Episode deleted successfully.' });
        window.location.reload();
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to delete episode.' });
      }
    });
  }

  function handlePublishEpisode(episodeId: string) {
    startTransition(async () => {
      clearFeedback();
      const res = await publishDraftEpisodeAction(episodeId);
      if (res.success) {
        setFeedback({ type: 'success', message: 'Episode published to feed and RSS.' });
        window.location.reload();
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to publish episode.' });
      }
    });
  }

  function handleDeleteLivestream(streamId: string) {
    if (!confirm('Are you sure you want to delete this livestream record?')) return;
    startTransition(async () => {
      clearFeedback();
      const res = await deleteLivestreamAction(streamId);
      if (res.success) {
        setFeedback({ type: 'success', message: 'Livestream removed.' });
        window.location.reload();
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to delete livestream.' });
      }
    });
  }

  function handleStartStream(streamId: string) {
    startTransition(async () => {
      clearFeedback();
      const res = await startScheduledLivestreamAction(streamId);
      if (res.success) {
        setFeedback({ type: 'success', message: 'Livestream started! Opening studio...' });
        window.location.href = '/live/broadcast';
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to start livestream.' });
      }
    });
  }

  function handleDeleteDraft(draftId: string) {
    if (!confirm('Discard this draft permanently?')) return;
    startTransition(async () => {
      clearFeedback();
      const res = await deleteDraftAction(draftId);
      if (res.success) {
        setFeedback({ type: 'success', message: 'Draft deleted.' });
        window.location.reload();
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to delete draft.' });
      }
    });
  }

  // Flatten episodes for display
  const allEpisodes = podcasts.flatMap((p) =>
    p.episodes.map((ep) => ({ ...ep, podcastTitle: p.title, podcastSlug: p.slug }))
  );

  return (
    <div className="surface-card rounded-3xl p-6 sm:p-8 space-y-6 border border-white/15 shadow-2xl">
      {/* Header & Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-brand-goldenHour" /> Content &amp; Media Command Center
          </h2>
          <p className="text-xs sm:text-sm text-brand-sandstone/75 mt-0.5">
            Manage your posts, video reels, podcasts, live streams, and drafts in one place.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPodcastModalOpen(true)}
            className="bg-purple-600 hover:bg-purple-500 text-white font-black px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-md shadow-purple-600/30 min-h-[38px]"
          >
            <Plus className="w-3.5 h-3.5" /> Publish Podcast
          </button>
          <Link
            href="/create"
            className="bg-brand-sunriseCoral hover:brightness-110 text-slate-950 font-black px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-brand-sunriseCoral/20 min-h-[38px]"
          >
            <Plus className="w-3.5 h-3.5" /> Create Hub
          </Link>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-bold flex items-center justify-between gap-2 animate-fadeIn ${
            feedback.type === 'success'
              ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300'
              : 'bg-rose-500/15 border border-rose-500/40 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={clearFeedback} className="underline text-[11px] hover:opacity-80">
            Dismiss
          </button>
        </div>
      )}

      {/* Navigation Tabs & Search/Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all', label: 'All Content', count: videos.length + podcasts.length + livestreams.length + drafts.length },
            { id: 'videos', label: 'Videos & Reels', count: videos.length },
            { id: 'podcasts', label: 'Podcasts & Episodes', count: podcasts.length },
            { id: 'livestreams', label: 'Live Broadcasts', count: livestreams.length },
            { id: 'drafts', label: 'Drafts', count: drafts.length },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all flex items-center gap-1.5 min-h-[38px] ${
                activeTab === tab.id
                  ? 'bg-white text-slate-950 shadow-md'
                  : 'bg-white/5 hover:bg-white/10 text-brand-sandstone/80 border border-white/10'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeTab === tab.id ? 'bg-slate-900 text-white' : 'bg-white/10 text-brand-sandstone/70'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Status Filter & Search */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 text-brand-sandstone/50 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search content…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950/80 border border-white/15 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-brand-sandstone/50 focus:outline-none focus:border-brand-goldenHour"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-slate-950/80 border border-white/15 rounded-xl px-2.5 py-1.5 text-xs text-brand-sandstone focus:outline-none focus:border-brand-goldenHour min-h-[34px]"
          >
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Drafts</option>
            <option value="scheduled">Scheduled</option>
          </select>
        </div>
      </div>

      {/* Content Rendering Section */}
      <div className="space-y-4">
        {/* PODCASTS SECTION */}
        {(activeTab === 'all' || activeTab === 'podcasts') && (
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-purple-400 flex items-center gap-2">
              <Mic className="w-4 h-4" /> Podcast Shows &amp; Episodes ({podcasts.length})
            </h3>

            {podcasts.length === 0 ? (
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center space-y-2">
                <p className="text-xs text-brand-sandstone/70">You haven&apos;t launched any podcast shows yet.</p>
                <button
                  onClick={() => setIsPodcastModalOpen(true)}
                  className="text-xs text-purple-400 font-black hover:underline"
                >
                  Create Your First Show →
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {podcasts.map((show) => (
                  <div key={show.id} className="surface-card rounded-2xl p-4 border border-white/10 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                      <div>
                        <h4 className="font-black text-sm text-white flex items-center gap-2">
                          <span>{show.title}</span>
                          <span className="text-[10px] font-normal text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-full">
                            {show.follower_count.toLocaleString()} Subscribers
                          </span>
                        </h4>
                        <p className="text-xs text-brand-sandstone/60 mt-0.5">
                          Slug: /{show.slug} · {show.episodes.length} Episode{show.episodes.length === 1 ? '' : 's'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/podcasts?slug=${show.slug}`}
                          className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-brand-sandstone text-xs font-bold flex items-center gap-1 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> View Show
                        </Link>
                        <button
                          disabled={isPending}
                          onClick={() => handleDeletePodcast(show.id)}
                          className="p-1.5 rounded-xl text-rose-400 hover:bg-rose-500/20 transition-colors"
                          title="Delete Show"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Episodes List */}
                    {show.episodes.length === 0 ? (
                      <p className="text-xs text-brand-sandstone/60 italic py-1">
                        No episodes published under this show yet.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {show.episodes.map((ep) => {
                          const isDraft = !ep.published_at && !ep.scheduled_for;
                          const isScheduled = Boolean(ep.scheduled_for && (!ep.published_at || new Date(ep.scheduled_for).getTime() > Date.now()));
                          const isPublished = Boolean(ep.published_at);

                          if (statusFilter === 'published' && !isPublished) return null;
                          if (statusFilter === 'draft' && !isDraft) return null;
                          if (statusFilter === 'scheduled' && !isScheduled) return null;

                          return (
                            <div
                              key={ep.id}
                              className="p-3 rounded-xl bg-slate-900/60 border border-white/5 flex items-center justify-between gap-3 text-xs"
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-white truncate">
                                    S{ep.season_number}E{ep.episode_number}: {ep.title}
                                  </span>
                                  {isPublished && (
                                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                                      LIVE
                                    </span>
                                  )}
                                  {isDraft && (
                                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
                                      DRAFT
                                    </span>
                                  )}
                                  {isScheduled && (
                                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300">
                                      SCHEDULED
                                    </span>
                                  )}
                                </div>
                                <p className="text-brand-sandstone/60 text-[11px] mt-0.5">
                                  {Math.round(ep.duration_seconds / 60)} mins
                                  {ep.is_subscriber_only && ' · Subscribers Only'}
                                  {ep.scheduled_for && ` · Scheduled: ${new Date(ep.scheduled_for).toLocaleDateString()}`}
                                </p>
                              </div>

                              <div className="flex items-center gap-2 flex-shrink-0">
                                {isDraft && (
                                  <button
                                    disabled={isPending}
                                    onClick={() => handlePublishEpisode(ep.id)}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                                  >
                                    Publish Now
                                  </button>
                                )}
                                <button
                                  disabled={isPending}
                                  onClick={() => handleDeleteEpisode(ep.id)}
                                  className="p-1 rounded-lg text-rose-400 hover:bg-rose-500/20 transition-colors"
                                  title="Delete Episode"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* LIVESTREAMS SECTION */}
        {(activeTab === 'all' || activeTab === 'livestreams') && (
          <div className="space-y-3 pt-4 border-t border-white/10">
            <h3 className="text-xs font-black uppercase tracking-wider text-red-400 flex items-center gap-2">
              <Tv className="w-4 h-4" /> Live Broadcast Sessions ({livestreams.length})
            </h3>

            {livestreams.length === 0 ? (
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center space-y-2">
                <p className="text-xs text-brand-sandstone/70">You have no recorded or scheduled livestreams.</p>
                <Link href="/live/broadcast" className="text-xs text-red-400 font-black hover:underline">
                  Launch Broadcast Studio →
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {livestreams.map((stream) => (
                  <div
                    key={stream.id}
                    className="p-4 rounded-2xl surface-card border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{stream.title}</span>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                            stream.state === 'live'
                              ? 'bg-red-600 text-white animate-pulse'
                              : stream.state === 'scheduled'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-white/10 text-brand-sandstone/70'
                          }`}
                        >
                          {stream.state}
                        </span>
                      </div>
                      <p className="text-brand-sandstone/60 text-[11px]">
                        Access: {stream.access_level} · Peak Viewers: {stream.peak_viewers.toLocaleString()}
                        {stream.scheduled_for && ` · Scheduled: ${new Date(stream.scheduled_for).toLocaleString()}`}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {stream.state === 'scheduled' && (
                        <button
                          disabled={isPending}
                          onClick={() => handleStartStream(stream.id)}
                          className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs flex items-center gap-1"
                        >
                          <Radio className="w-3.5 h-3.5" /> Start Stream
                        </button>
                      )}
                      <Link
                        href={`/live?id=${stream.id}`}
                        className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-brand-sandstone font-bold text-xs"
                      >
                        Open
                      </Link>
                      <button
                        disabled={isPending}
                        onClick={() => handleDeleteLivestream(stream.id)}
                        className="p-1.5 rounded-xl text-rose-400 hover:bg-rose-500/20 transition-colors"
                        title="Delete Stream"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIDEOS SECTION */}
        {(activeTab === 'all' || activeTab === 'videos') && (
          <div className="space-y-3 pt-4 border-t border-white/10">
            <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
              <Film className="w-4 h-4" /> Videos &amp; Reels ({videos.length})
            </h3>

            {videos.length === 0 ? (
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center space-y-2">
                <p className="text-xs text-brand-sandstone/70">No videos published yet.</p>
                <Link href="/create" className="text-xs text-emerald-400 font-black hover:underline">
                  Upload Video in Create Hub →
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {videos.map((vid) => (
                  <div
                    key={vid.id}
                    className="p-4 rounded-2xl surface-card border border-white/10 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <h4 className="font-bold text-white text-sm">{vid.title}</h4>
                      <p className="text-brand-sandstone/60 text-[11px] mt-0.5">
                        {vid.video_kind} · {vid.view_count.toLocaleString()} Views · Visibility: {vid.visibility}
                      </p>
                    </div>
                    <Link
                      href={`/reels?id=${vid.id}`}
                      className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-brand-sandstone font-bold text-xs"
                    >
                      Watch
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* DRAFTS SECTION */}
        {(activeTab === 'all' || activeTab === 'drafts') && (
          <div className="space-y-3 pt-4 border-t border-white/10">
            <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <Clock className="w-4 h-4" /> Cloud-Synced Drafts ({drafts.length})
            </h3>

            {drafts.length === 0 ? (
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center space-y-2">
                <p className="text-xs text-brand-sandstone/70">
                  Zero unposted drafts. Your workspace is completely up-to-date.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {drafts.map((draft) => (
                  <div
                    key={draft.id}
                    className="p-4 rounded-2xl surface-card border border-amber-500/30 flex items-center justify-between gap-3 text-xs bg-amber-950/20"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{draft.title}</span>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 uppercase">
                          {draft.content_type}
                        </span>
                      </div>
                      <p className="text-brand-sandstone/60 text-[11px] mt-0.5">
                        Last updated {new Date(draft.updated_at).toLocaleDateString()} ·{' '}
                        {draft.body ? draft.body.slice(0, 60) + '…' : 'No description'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/create?draftId=${draft.id}`}
                        className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-black text-xs"
                      >
                        Resume Draft
                      </Link>
                      <button
                        disabled={isPending}
                        onClick={() => handleDeleteDraft(draft.id)}
                        className="p-1.5 rounded-xl text-rose-400 hover:bg-rose-500/20 transition-colors"
                        title="Delete Draft"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Podcast Creation Modal */}
      <CreatePodcastModal
        isOpen={isPodcastModalOpen}
        onClose={() => setIsPodcastModalOpen(false)}
        user={user}
        existingPodcasts={podcasts.map((p) => ({ id: p.id, title: p.title }))}
      />
    </div>
  );
}
