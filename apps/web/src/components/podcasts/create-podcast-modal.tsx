'use client';

import React, { useState, useRef } from 'react';
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
  Calendar,
  Image as ImageIcon,
  Loader2,
} from 'lucide-react';
import {
  createPodcastAction,
  publishEpisodeAction,
  type PodcastActionState,
} from '../../lib/podcasts/actions';
import { createSupabaseBrowserClient } from '../../lib/supabase/browser';
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
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  // Publish Episode Form State
  const [selectedPodcastId, setSelectedPodcastId] = useState(existingPodcasts[0]?.id || '');
  const [episodeTitle, setEpisodeTitle] = useState('');
  const [seasonNumber, setSeasonNumber] = useState(1);
  const [episodeNumber, setEpisodeNumber] = useState(1);
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioFileName, setAudioFileName] = useState<string | null>(null);
  const [showNotes, setShowNotes] = useState('');
  const [transcript, setTranscript] = useState('');
  const [isEpisodeSubscriberOnly, setIsEpisodeSubscriberOnly] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');

  // Chapter markers state
  const [chapters, setChapters] = useState<Chapter[]>([
    { startSeconds: 0, title: 'Introduction & Welcome' },
  ]);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const audioInputRef = useRef<HTMLInputElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  }

  function handleAudioChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setAudioFile(file);
      setAudioFileName(file.name);

      // Attempt reading duration from audio element
      const tempAudio = document.createElement('audio');
      tempAudio.preload = 'metadata';
      tempAudio.src = URL.createObjectURL(file);
      tempAudio.onloadedmetadata = () => {
        if (tempAudio.duration && !isNaN(tempAudio.duration) && isFinite(tempAudio.duration)) {
          setDurationMinutes(Math.max(1, Math.round(tempAudio.duration / 60)));
        }
      };
    }
  }

  function addChapter() {
    const lastStart = chapters.length > 0 ? chapters[chapters.length - 1].startSeconds + 300 : 0;
    setChapters([...chapters, { startSeconds: lastStart, title: `Chapter ${chapters.length + 1}` }]);
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
    setUploadProgress(null);

    try {
      let coverPath: string | null = null;
      if (coverFile && user) {
        setUploadProgress('Uploading show artwork…');
        const supabase = createSupabaseBrowserClient();
        if (supabase) {
          const path = `${user.id}/podcast-cover-${Date.now()}-${coverFile.name.replace(/\s+/g, '_')}`;
          const { error: upErr } = await supabase.storage.from('post-media').upload(path, coverFile);
          if (!upErr) coverPath = path;
        }
      }

      setUploadProgress('Saving podcast show…');
      const fd = new FormData();
      fd.set('title', showTitle.trim());
      fd.set('description', showDescription.trim());
      fd.set('languageIso', languageIso);
      fd.set('isPaid', isShowPaid ? 'true' : 'false');
      if (coverPath) fd.set('coverPath', coverPath);

      const res = await createPodcastAction({ error: null, success: null }, fd);
      if (res.error) {
        setErrorMessage(res.error);
      } else {
        setSuccessMessage('Podcast show created successfully!');
        setTimeout(() => {
          onClose();
          window.location.reload();
        }, 1200);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to create podcast show.');
    } finally {
      setIsSubmitting(false);
      setUploadProgress(null);
    }
  }

  async function handleEpisodeSubmit(asDraft: boolean = false) {
    if (!selectedPodcastId) {
      setErrorMessage('Please select a valid podcast show.');
      return;
    }
    if (!episodeTitle.trim()) {
      setErrorMessage('Please enter an episode title.');
      return;
    }
    if (!audioFile && !asDraft) {
      setErrorMessage('Please select an audio file to upload for this episode.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setUploadProgress(null);

    try {
      let audioStoragePath = '';

      if (audioFile && user) {
        setUploadProgress('Uploading master episode audio to storage…');
        const supabase = createSupabaseBrowserClient();
        if (!supabase) throw new Error('Storage client unavailable.');

        const ext = audioFile.name.split('.').pop() || 'mp3';
        const cleanName = `${Date.now()}_ep_${episodeNumber}.${ext}`;
        const path = `${user.id}/${cleanName}`;

        const { error: upErr } = await supabase.storage.from('podcast-audio').upload(path, audioFile, {
          cacheControl: '3600',
          upsert: false,
        });

        if (upErr) {
          throw new Error(`Audio upload failed: ${upErr.message}`);
        }
        audioStoragePath = path;
      } else if (asDraft) {
        audioStoragePath = 'draft_pending_upload';
      }

      setUploadProgress(asDraft ? 'Saving episode draft…' : 'Publishing episode…');

      const res = await publishEpisodeAction({
        podcastId: selectedPodcastId,
        seasonNumber: Number(seasonNumber) || 1,
        episodeNumber: Number(episodeNumber) || 1,
        title: episodeTitle.trim(),
        durationSeconds: (Number(durationMinutes) || 30) * 60,
        audioPath: audioStoragePath,
        showNotes: showNotes.trim() || undefined,
        transcript: transcript.trim() || undefined,
        chapters: chapters.length > 0 ? chapters : undefined,
        isSubscriberOnly: isEpisodeSubscriberOnly,
        isDraft: asDraft,
        scheduledFor: !asDraft && scheduledDate ? scheduledDate : null,
      });

      if (!res.success) {
        setErrorMessage(res.error || 'Failed to process episode.');
      } else {
        setSuccessMessage(
          asDraft
            ? 'Episode saved as draft in Creator Studio!'
            : (scheduledDate ? 'Episode scheduled successfully!' : 'Episode published to podcast network and iTunes RSS!')
        );
        setTimeout(() => {
          onClose();
          window.location.reload();
        }, 1200);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to submit episode.');
    } finally {
      setIsSubmitting(false);
      setUploadProgress(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="surface-card border border-purple-500/30 rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Podcast Studio &amp; RSS Publisher</h2>
              <p className="text-xs text-brand-sandstone/70">
                Host Caribbean shows with real audio storage, chapter markers, and iTunes RSS feeds.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-brand-sandstone/60 hover:text-white hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 p-1 bg-white/5 rounded-2xl border border-white/10">
          <button
            type="button"
            onClick={() => setTab('publish_episode')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              tab === 'publish_episode'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-brand-sandstone/70 hover:text-white'
            }`}
          >
            🎙️ Publish Episode
          </button>
          <button
            type="button"
            onClick={() => setTab('create_show')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              tab === 'create_show'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-brand-sandstone/70 hover:text-white'
            }`}
          >
            📻 Create New Show
          </button>
        </div>

        {/* Auth Gate */}
        {!user && (
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center space-y-3">
            <p className="text-xs text-brand-sandstone/80">
              You must be signed in to create podcast shows or publish audio episodes.
            </p>
            <a
              href="/login?redirect=/podcasts"
              className="inline-block bg-purple-600 hover:bg-purple-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-colors shadow-md shadow-purple-600/30"
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

        {uploadProgress && (
          <div className="p-3.5 rounded-2xl bg-purple-500/15 border border-purple-500/30 text-purple-200 text-xs flex items-center gap-2.5 animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
            <span>{uploadProgress}</span>
          </div>
        )}

        {/* Tab 1: Publish Episode */}
        {user && tab === 'publish_episode' && (
          <div className="space-y-4">
            {existingPodcasts.length === 0 ? (
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center space-y-3">
                <Radio className="w-8 h-8 text-purple-400 mx-auto" />
                <h3 className="text-sm font-black text-white">No Podcast Show Registered</h3>
                <p className="text-xs text-brand-sandstone/70 max-w-sm mx-auto">
                  You must create a podcast show before publishing individual episodes.
                </p>
                <button
                  type="button"
                  onClick={() => setTab('create_show')}
                  className="bg-purple-600 hover:bg-purple-500 text-white font-black px-4 py-2 rounded-xl text-xs"
                >
                  Create Show Now →
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleEpisodeSubmit(false);
                }}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-brand-sandstone/80">Select Podcast Show</label>
                  <select
                    value={selectedPodcastId}
                    onChange={(e) => setSelectedPodcastId(e.target.value)}
                    className="w-full bg-slate-900 border border-white/15 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                    required
                  >
                    {existingPodcasts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-brand-sandstone/80">Episode Title</label>
                  <input
                    type="text"
                    value={episodeTitle}
                    onChange={(e) => setEpisodeTitle(e.target.value)}
                    placeholder="e.g. Episode 12: Island FinTech & Digital Trade Horizons"
                    className="w-full bg-slate-900 border border-white/15 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-brand-sandstone/40 focus:outline-none focus:border-purple-500"
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
                      onChange={(e) => setSeasonNumber(parseInt(e.target.value, 10) || 1)}
                      className="w-full bg-slate-900 border border-white/15 rounded-2xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-brand-sandstone/80">Episode #</label>
                    <input
                      type="number"
                      min={1}
                      value={episodeNumber}
                      onChange={(e) => setEpisodeNumber(parseInt(e.target.value, 10) || 1)}
                      className="w-full bg-slate-900 border border-white/15 rounded-2xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-brand-sandstone/80">Duration (Min)</label>
                    <input
                      type="number"
                      min={1}
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10) || 1)}
                      className="w-full bg-slate-900 border border-white/15 rounded-2xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                {/* Direct Audio File Upload */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-brand-sandstone/80">Master Audio File (.mp3, .wav, .m4a)</label>
                  <input
                    type="file"
                    ref={audioInputRef}
                    accept="audio/*,.mp3,.wav,.m4a,.ogg"
                    onChange={handleAudioChange}
                    className="hidden"
                  />
                  <div
                    onClick={() => audioInputRef.current?.click()}
                    className="border-2 border-dashed border-white/20 hover:border-purple-500/50 rounded-2xl p-4 text-center cursor-pointer transition-colors bg-white/5"
                  >
                    <UploadCloud className="w-6 h-6 text-purple-400 mx-auto mb-1" />
                    <p className="text-xs font-bold text-white">
                      {audioFileName ? `Selected: ${audioFileName}` : 'Click to select master episode audio'}
                    </p>
                    <p className="text-[11px] text-brand-sandstone/60 mt-0.5">
                      Uploaded directly to Supabase Storage. Max size: 2 GB.
                    </p>
                  </div>
                </div>

                {/* Show Notes */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-brand-sandstone/80">Episode Description &amp; Show Notes</label>
                  <textarea
                    rows={3}
                    value={showNotes}
                    onChange={(e) => setShowNotes(e.target.value)}
                    placeholder="Provide context, guest bios, and resource links..."
                    className="w-full bg-slate-900 border border-white/15 rounded-2xl px-4 py-2 text-xs text-white placeholder-brand-sandstone/40 focus:outline-none focus:border-purple-500"
                  />
                </div>

                {/* Transcript */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-brand-sandstone/80">Synchronized Transcript (Optional)</label>
                  <textarea
                    rows={2}
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    placeholder="Paste full episode transcript for search and accessibility..."
                    className="w-full bg-slate-900 border border-white/15 rounded-2xl px-4 py-2 text-xs text-white placeholder-brand-sandstone/40 focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>

                {/* Scheduling */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-brand-sandstone/80 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-purple-400" /> Schedule Release (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full bg-slate-900 border border-white/15 rounded-2xl px-4 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                {/* Member Only Toggle */}
                <label className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isEpisodeSubscriberOnly}
                    onChange={(e) => setIsEpisodeSubscriberOnly(e.target.checked)}
                    className="rounded text-purple-600 focus:ring-purple-500"
                  />
                  <div className="text-xs">
                    <p className="font-black text-white flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-amber-400" /> Subscriber-Exclusive Episode
                    </p>
                    <p className="text-brand-sandstone/60 text-[11px]">
                      Only active paid community and creator members can stream this episode.
                    </p>
                  </div>
                </label>

                {/* Action Buttons */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-white/10">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => void handleEpisodeSubmit(true)}
                    className="px-4 py-2.5 rounded-xl border border-white/20 text-white font-bold text-xs hover:bg-white/10 transition-colors"
                  >
                    Save as Draft
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2.5 rounded-xl text-brand-sandstone/70 hover:text-white text-xs font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs transition-colors shadow-lg shadow-purple-600/30 flex items-center gap-2"
                    >
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                      <span>{scheduledDate ? 'Schedule Episode' : 'Publish to Feed & RSS'}</span>
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Tab 2: Create Show */}
        {user && tab === 'create_show' && (
          <form onSubmit={handleCreateShow} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-brand-sandstone/80">Show Title</label>
              <input
                type="text"
                value={showTitle}
                onChange={(e) => setShowTitle(e.target.value)}
                placeholder="e.g. Voices of the Archipelago"
                className="w-full bg-slate-900 border border-white/15 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-brand-sandstone/40 focus:outline-none focus:border-purple-500"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-brand-sandstone/80">Show Description &amp; Premise</label>
              <textarea
                rows={3}
                value={showDescription}
                onChange={(e) => setShowDescription(e.target.value)}
                placeholder="Explain the mission, topics, and cultural focus of your show..."
                className="w-full bg-slate-900 border border-white/15 rounded-2xl px-4 py-2 text-xs text-white placeholder-brand-sandstone/40 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-brand-sandstone/80">Primary Language</label>
                <select
                  value={languageIso}
                  onChange={(e) => setLanguageIso(e.target.value)}
                  className="w-full bg-slate-900 border border-white/15 rounded-2xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="en">English (English)</option>
                  <option value="es">Español (Spanish)</option>
                  <option value="fr">Français (French)</option>
                  <option value="ht">Kreyòl Ayisyen (Haitian Creole)</option>
                  <option value="pap">Papiamento</option>
                  <option value="nl">Nederlands (Dutch)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-brand-sandstone/80">Network Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-900 border border-white/15 rounded-2xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="Culture & History">Culture &amp; History</option>
                  <option value="Music & Sound Systems">Music &amp; Sound Systems</option>
                  <option value="Business & Tech">Business &amp; Tech</option>
                  <option value="Food & Culinary">Food &amp; Culinary</option>
                  <option value="Diaspora Life">Diaspora Life</option>
                </select>
              </div>
            </div>

            {/* Cover Artwork File Upload */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-brand-sandstone/80">Show Artwork / Cover Image</label>
              <input
                type="file"
                ref={coverInputRef}
                accept="image/*"
                onChange={handleCoverChange}
                className="hidden"
              />
              <div
                onClick={() => coverInputRef.current?.click()}
                className="border-2 border-dashed border-white/20 hover:border-purple-500/50 rounded-2xl p-4 text-center cursor-pointer transition-colors bg-white/5 flex items-center justify-center gap-3"
              >
                {coverPreview ? (
                  <img src={coverPreview} alt="Cover preview" className="w-14 h-14 rounded-xl object-cover" />
                ) : (
                  <ImageIcon className="w-6 h-6 text-purple-400" />
                )}
                <div className="text-left">
                  <p className="text-xs font-bold text-white">
                    {coverFile ? coverFile.name : 'Select 1400×1400+ square cover artwork'}
                  </p>
                  <p className="text-[11px] text-brand-sandstone/60">
                    Compliant with Apple Podcasts and Spotify standards.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-3 flex items-center justify-end gap-3 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-brand-sandstone/70 hover:text-white text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs transition-colors shadow-lg shadow-purple-600/30 flex items-center gap-2"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                <span>Create Podcast Show</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
