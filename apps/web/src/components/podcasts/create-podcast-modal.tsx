'use client';

import React, { useState } from 'react';
import {
  Mic,
  Plus,
  X,
  UploadCloud,
  FileText,
  Clock,
  Sparkles,
  Lock,
  Globe,
  Radio,
  CheckCircle,
  AlertCircle,
  ListPlus,
  Trash2,
} from 'lucide-react';
import {
  createPodcastAction,
  publishEpisodeAction,
  type PodcastActionState,
} from '../../lib/podcasts/actions';
import type { Chapter } from '@caribbean/podcasts';

interface CreatePodcastModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    displayName: string;
    username?: string;
  } | null;
  existingPodcasts?: Array<{ id: string; title: string }>;
}

export default function CreatePodcastModal({
  isOpen,
  onClose,
  user,
  existingPodcasts = [],
}: CreatePodcastModalProps) {
  const [tab, setTab] = useState<'create_show' | 'publish_episode'>(
    existingPodcasts.length > 0 ? 'publish_episode' : 'create_show'
  );

  // Create Show Form State
  const [showTitle, setShowTitle] = useState('');
  const [showDescription, setShowDescription] = useState('');
  const [languageIso, setLanguageIso] = useState('en');
  const [category, setCategory] = useState('Culture & Society');
  const [isShowPaid, setIsShowPaid] = useState(false);

  // Publish Episode Form State
  const [selectedPodcastId, setSelectedPodcastId] = useState(existingPodcasts[0]?.id || '');
  const [episodeTitle, setEpisodeTitle] = useState('');
  const [seasonNumber, setSeasonNumber] = useState(1);
  const [episodeNumber, setEpisodeNumber] = useState(1);
  const [durationMinutes, setDurationMinutes] = useState(35);
  const [audioUrl, setAudioUrl] = useState('');
  const [showNotes, setShowNotes] = useState('');
  const [transcript, setTranscript] = useState('');
  const [isEpisodeSubscriberOnly, setIsEpisodeSubscriberOnly] = useState(false);

  // Chapter markers state
  const [chapters, setChapters] = useState<Chapter[]>([
    { startSeconds: 0, title: 'Introduction & Greetings' },
    { startSeconds: 300, title: 'Main Topic & Interview' },
  ]);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  function addChapter() {
    const lastStart = chapters.length > 0 ? chapters[chapters.length - 1].startSeconds + 300 : 0;
    setChapters([...chapters, { startSeconds: lastStart, title: `Segment ${chapters.length + 1}` }]);
  }

  function removeChapter(idx: number) {
    setChapters(chapters.filter((_, i) => i !== idx));
  }

  function updateChapter(idx: number, field: 'startSeconds' | 'title', value: any) {
    const updated = [...chapters];
    updated[idx] = { ...updated[idx], [field]: value };
    setChapters(updated);
  }

  async function handleCreateShow(e: React.FormEvent) {
    e.preventDefault();
    if (!showTitle.trim()) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    const fd = new FormData();
    fd.set('title', showTitle.trim());
    fd.set('description', showDescription.trim());
    fd.set('languageIso', languageIso);
    fd.set('isPaid', isShowPaid ? 'true' : 'false');

    try {
      const res = await createPodcastAction({ error: null, success: null }, fd);
      if (res.error) {
        setErrorMessage(res.error);
      } else {
        setSuccessMessage('Podcast show created successfully!');
        setTimeout(() => {
          onClose();
          window.location.reload();
        }, 1500);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to create podcast show.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handlePublishEpisode(e: React.FormEvent) {
    e.preventDefault();
    if (!episodeTitle.trim()) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await publishEpisodeAction({
        podcastId: selectedPodcastId || 'pod-showcase-1',
        seasonNumber: Number(seasonNumber) || 1,
        episodeNumber: Number(episodeNumber) || 1,
        title: episodeTitle.trim(),
        durationSeconds: (Number(durationMinutes) || 30) * 60,
        audioPath: audioUrl.trim() || 'https://assets.mixkit.co/active_storage/sfx/2874/2874-preview.mp3',
        showNotes: showNotes.trim() || undefined,
        transcript: transcript.trim() || undefined,
        chapters: chapters.length > 0 ? chapters : undefined,
        isSubscriberOnly: isEpisodeSubscriberOnly,
      });

      if (!res.success) {
        setErrorMessage(res.error || 'Failed to publish episode.');
      } else {
        setSuccessMessage('Episode successfully published to podcast network and iTunes RSS!');
        setTimeout(() => {
          onClose();
          window.location.reload();
        }, 1500);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to publish episode.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-brand-dusk border border-slate-800 rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-brand-sandstone">Podcast Studio &amp; RSS Publisher</h2>
              <p className="text-xs text-brand-sandstone/60">
                Publish episodes with chapters, synchronized transcripts, and iTunes RSS 2.0 feeds.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 p-1 bg-brand-twilight rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => setTab('publish_episode')}
            className={`flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              tab === 'publish_episode'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-brand-sandstone/60 hover:text-white'
            }`}
          >
            🎙️ Publish Episode
          </button>
          <button
            type="button"
            onClick={() => setTab('create_show')}
            className={`flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              tab === 'create_show'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-brand-sandstone/60 hover:text-white'
            }`}
          >
            📻 Create New Show
          </button>
        </div>

        {/* Alerts */}
        {!user && (
          <div className="p-4 rounded-2xl bg-brand-twilight border border-slate-700 text-center space-y-3">
            <p className="text-xs text-brand-sandstone/80">
              You must be signed in to create podcast shows or publish episodes.
            </p>
            <a
              href="/login?redirect=/podcasts"
              className="inline-block bg-purple-600 hover:bg-purple-500 text-white font-bold px-5 py-2 rounded-xl text-xs transition-colors shadow-md"
            >
              Sign In to Continue
            </a>
          </div>
        )}

        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form: Publish Episode */}
        {user && tab === 'publish_episode' && (
          <form onSubmit={handlePublishEpisode} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-brand-sandstone/80">Select Podcast Show</label>
              <select
                value={selectedPodcastId}
                onChange={(e) => setSelectedPodcastId(e.target.value)}
                className="w-full bg-brand-twilight border border-slate-700 rounded-2xl px-4 py-2.5 text-xs text-brand-sandstone focus:outline-none focus:border-purple-500"
              >
                {existingPodcasts.length > 0 ? (
                  existingPodcasts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="pod-1">The Caribbean Tech Exchange</option>
                    <option value="pod-2">Island Roots &amp; Reggae History</option>
                    <option value="pod-3">Soca Therapy: Carnival &amp; Road Talks</option>
                    <option value="pod-4">Diaspora Table: Culinary Stories</option>
                  </>
                )}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-brand-sandstone/80">Episode Title</label>
              <input
                type="text"
                value={episodeTitle}
                onChange={(e) => setEpisodeTitle(e.target.value)}
                placeholder="e.g. Episode 43: Caribbean AI & FinTech Horizons"
                className="w-full bg-brand-twilight border border-slate-700 rounded-2xl px-4 py-2.5 text-xs text-brand-sandstone focus:outline-none focus:border-purple-500"
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-brand-sandstone/80">Season #</label>
                <input
                  type="number"
                  min={1}
                  value={seasonNumber}
                  onChange={(e) => setSeasonNumber(parseInt(e.target.value, 10))}
                  className="w-full bg-brand-twilight border border-slate-700 rounded-2xl px-4 py-2.5 text-xs text-brand-sandstone focus:outline-none focus:border-purple-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-brand-sandstone/80">Episode #</label>
                <input
                  type="number"
                  min={1}
                  value={episodeNumber}
                  onChange={(e) => setEpisodeNumber(parseInt(e.target.value, 10))}
                  className="w-full bg-brand-twilight border border-slate-700 rounded-2xl px-4 py-2.5 text-xs text-brand-sandstone focus:outline-none focus:border-purple-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-brand-sandstone/80">Est. Duration (mins)</label>
                <input
                  type="number"
                  min={1}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10))}
                  className="w-full bg-brand-twilight border border-slate-700 rounded-2xl px-4 py-2.5 text-xs text-brand-sandstone focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-brand-sandstone/80">Audio Enclosure URL (MP3 / AAC)</label>
              <input
                type="url"
                value={audioUrl}
                onChange={(e) => setAudioUrl(e.target.value)}
                placeholder="https://cdn.caribbeanone.app/podcasts/episode.mp3"
                className="w-full bg-brand-twilight border border-slate-700 rounded-2xl px-4 py-2.5 text-xs text-brand-sandstone focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-brand-sandstone/80">Show Notes &amp; Description</label>
              <textarea
                value={showNotes}
                onChange={(e) => setShowNotes(e.target.value)}
                rows={3}
                placeholder="Key takeaways, guest bios, timestamps, and sponsor mentions…"
                className="w-full bg-brand-twilight border border-slate-700 rounded-2xl p-3 text-xs text-brand-sandstone focus:outline-none focus:border-purple-500 resize-none"
              />
            </div>

            {/* Interactive Chapter Markers Builder */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Podcasting 2.0 Chapter Markers
                </label>
                <button
                  type="button"
                  onClick={addChapter}
                  className="text-[11px] font-bold text-purple-300 hover:text-white flex items-center gap-1 bg-purple-600/20 px-2.5 py-1 rounded-lg border border-purple-500/30"
                >
                  <ListPlus className="w-3 h-3" /> Add Chapter
                </button>
              </div>

              <div className="space-y-2">
                {chapters.map((chap, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      value={chap.startSeconds}
                      onChange={(e) => updateChapter(idx, 'startSeconds', parseInt(e.target.value, 10))}
                      placeholder="Start (sec)"
                      className="w-24 bg-brand-twilight border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-brand-sandstone"
                    />
                    <input
                      type="text"
                      value={chap.title}
                      onChange={(e) => updateChapter(idx, 'title', e.target.value)}
                      placeholder="Chapter title"
                      className="flex-1 bg-brand-twilight border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-brand-sandstone"
                    />
                    {chapters.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeChapter(idx)}
                        className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/20"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Transcript Area */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              <label className="text-xs font-bold text-brand-sandstone/80">Episode Transcript (Plain text / AI generated)</label>
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                rows={3}
                placeholder="Full audio transcription for accessibility, search indexing, and viewer subtitles…"
                className="w-full bg-brand-twilight border border-slate-700 rounded-2xl p-3 text-xs text-brand-sandstone focus:outline-none focus:border-purple-500 resize-none"
              />
            </div>

            {/* SpotPay Gating Toggle */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-brand-twilight border border-slate-800">
              <div className="flex items-center gap-2.5">
                <Lock className="w-4 h-4 text-brand-goldenHour" />
                <div>
                  <span className="text-xs font-bold text-brand-sandstone">SpotPay Member-Exclusive</span>
                  <p className="text-[11px] text-brand-sandstone/60">Gate this episode to paid monthly subscribers</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={isEpisodeSubscriberOnly}
                onChange={(e) => setIsEpisodeSubscriberOnly(e.target.checked)}
                className="w-4 h-4 accent-purple-500 rounded cursor-pointer"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !episodeTitle.trim()}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black py-3 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              {isSubmitting ? 'Publishing Episode…' : 'Publish Episode Now'}
            </button>
          </form>
        )}

        {/* Form: Create New Show */}
        {user && tab === 'create_show' && (
          <form onSubmit={handleCreateShow} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-brand-sandstone/80">Show Title</label>
              <input
                type="text"
                value={showTitle}
                onChange={(e) => setShowTitle(e.target.value)}
                placeholder="e.g. Caribbean Conversations & Diaspora Waves"
                className="w-full bg-brand-twilight border border-slate-700 rounded-2xl px-4 py-2.5 text-xs text-brand-sandstone focus:outline-none focus:border-purple-500"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-brand-sandstone/80">Show Description</label>
              <textarea
                value={showDescription}
                onChange={(e) => setShowDescription(e.target.value)}
                rows={3}
                placeholder="Describe your podcast theme, topics, and diaspora audience…"
                className="w-full bg-brand-twilight border border-slate-700 rounded-2xl p-3 text-xs text-brand-sandstone focus:outline-none focus:border-purple-500 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-brand-sandstone/80">Primary Language</label>
                <select
                  value={languageIso}
                  onChange={(e) => setLanguageIso(e.target.value)}
                  className="w-full bg-brand-twilight border border-slate-700 rounded-2xl px-4 py-2.5 text-xs text-brand-sandstone focus:outline-none focus:border-purple-500"
                >
                  <option value="en">English</option>
                  <option value="jam">Jamaican Patois</option>
                  <option value="ht">Haitian Kreyòl</option>
                  <option value="es">Spanish (Español)</option>
                  <option value="fr">French (Français)</option>
                  <option value="pap">Papiamento</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-brand-sandstone/80">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-brand-twilight border border-slate-700 rounded-2xl px-4 py-2.5 text-xs text-brand-sandstone focus:outline-none focus:border-purple-500"
                >
                  <option value="Culture & Society">Culture &amp; Society</option>
                  <option value="Music & Sound Systems">Music &amp; Sound Systems</option>
                  <option value="Business & Technology">Business &amp; Technology</option>
                  <option value="Food & Culinary">Food &amp; Culinary</option>
                  <option value="Diaspora Life">Diaspora Life</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !showTitle.trim()}
              className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black py-3 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Radio className="w-4 h-4" />
              {isSubmitting ? 'Creating Show…' : 'Create Podcast Show & Generate RSS'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
