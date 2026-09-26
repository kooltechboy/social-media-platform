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
  Trash2,
  Calendar,
  Image as ImageIcon,
  Loader2,
  Video,
  Link2,
  Layers,
} from 'lucide-react';
import {
  createPodcastAction,
  publishEpisodeAction,
  generateCaribAiPodcastMetadataAction,
  type PodcastActionState,
} from '../../lib/podcasts/actions';
import { createSupabaseBrowserClient } from '../../lib/supabase/browser';
import {
  CARIBBEAN_PODCAST_CATEGORIES,
  CARIBBEAN_PODCAST_TERRITORIES,
  type Chapter,
  type TimedLink,
} from '@caribbean/podcasts';

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
  const [showSubtitle, setShowSubtitle] = useState('');
  const [showDescription, setShowDescription] = useState('');
  const [authorName, setAuthorName] = useState(user?.displayName || '');
  const [languageIso, setLanguageIso] = useState('en');
  const [category, setCategory] = useState<string>(CARIBBEAN_PODCAST_CATEGORIES[0]);
  const [islandTerritory, setIslandTerritory] = useState<string>('TTO');
  const [showType, setShowType] = useState<'episodic' | 'serial'>('episodic');
  const [isShowPaid, setIsShowPaid] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  // Publish Episode Form State
  const [selectedPodcastId, setSelectedPodcastId] = useState(existingPodcasts[0]?.id || '');
  const [episodeTitle, setEpisodeTitle] = useState('');
  const [episodeSubtitle, setEpisodeSubtitle] = useState('');
  const [seasonNumber, setSeasonNumber] = useState(1);
  const [episodeNumber, setEpisodeNumber] = useState(1);
  const [episodeType, setEpisodeType] = useState<'full' | 'trailer' | 'bonus'>('full');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioFileName, setAudioFileName] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoFileName, setVideoFileName] = useState<string | null>(null);
  const [showNotes, setShowNotes] = useState('');
  const [transcript, setTranscript] = useState('');
  const [isEpisodeSubscriberOnly, setIsEpisodeSubscriberOnly] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');

  // Chapter markers state
  const [chapters, setChapters] = useState<Chapter[]>([
    { startSeconds: 0, title: 'Introduction & Welcome' },
  ]);

  // Timed links state
  const [timedLinks, setTimedLinks] = useState<TimedLink[]>([]);

  // CaribAI Studio State
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const audioInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
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

  function handleVideoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      setVideoFileName(file.name);
    }
  }

  function addChapter() {
    const lastStart = chapters.length > 0 ? chapters[chapters.length - 1].startSeconds + 300 : 0;
    setChapters([...chapters, { startSeconds: lastStart, title: `Chapter ${chapters.length + 1}` }]);
  }

  function removeChapter(idx: number) {
    setChapters(chapters.filter((_, i) => i !== idx));
  }

  function updateChapter(idx: number, field: keyof Chapter, value: any) {
    const updated = [...chapters];
    updated[idx] = { ...updated[idx], [field]: value };
    setChapters(updated);
  }

  function addTimedLink() {
    setTimedLinks([
      ...timedLinks,
      { timestampSeconds: 60, title: 'Context Link', url: 'https://tukubi.com' },
    ]);
  }

  function removeTimedLink(idx: number) {
    setTimedLinks(timedLinks.filter((_, i) => i !== idx));
  }

  function updateTimedLink(idx: number, field: keyof TimedLink, value: any) {
    const updated = [...timedLinks];
    updated[idx] = { ...updated[idx], [field]: value };
    setTimedLinks(updated);
  }

  async function handleCaribAiGenerate() {
    if (!episodeTitle.trim()) {
      setErrorMessage('Please enter an episode title first to generate AI studio metadata.');
      return;
    }
    setIsGeneratingAi(true);
    setErrorMessage(null);
    try {
      const res = await generateCaribAiPodcastMetadataAction(episodeTitle, showNotes);
      setShowNotes(res.summary);
      if (res.chapters && res.chapters.length > 0) {
        setChapters(res.chapters);
      }
      setSuccessMessage('CaribAI generated chapters and episode summary!');
    } catch {
      setErrorMessage('Could not generate AI metadata at this moment.');
    } finally {
      setIsGeneratingAi(false);
    }
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
      if (showSubtitle) fd.set('subtitle', showSubtitle.trim());
      fd.set('description', showDescription.trim());
      if (authorName) fd.set('authorName', authorName.trim());
      fd.set('languageIso', languageIso);
      fd.set('category', category);
      fd.set('islandTerritory', islandTerritory);
      fd.set('showType', showType);
      fd.set('isPaid', isShowPaid ? 'true' : 'false');
      if (coverPath) fd.set('coverPath', coverPath);

      const res = await createPodcastAction({ error: null, success: null }, fd);
      if (res.error) {
        setErrorMessage(res.error);
      } else {
        setSuccessMessage('Podcast show created successfully with Apple Podcasts & Spotify RSS!');
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
      let videoStoragePath: string | null = null;
      const supabase = createSupabaseBrowserClient();

      if (audioFile && user && supabase) {
        setUploadProgress('Uploading master audio stream…');
        const ext = audioFile.name.split('.').pop() || 'mp3';
        const cleanName = `${Date.now()}_ep_${episodeNumber}.${ext}`;
        const path = `${user.id}/${cleanName}`;

        const { error: upErr } = await supabase.storage.from('podcast-audio').upload(path, audioFile, {
          cacheControl: '3600',
          upsert: false,
        });

        if (upErr) throw new Error(`Audio upload failed: ${upErr.message}`);
        audioStoragePath = path;
      } else if (asDraft) {
        audioStoragePath = 'draft_pending_upload';
      }

      if (videoFile && user && supabase) {
        setUploadProgress('Uploading video stream derivative…');
        const vExt = videoFile.name.split('.').pop() || 'mp4';
        const vName = `${Date.now()}_ep_${episodeNumber}_video.${vExt}`;
        const vPath = `${user.id}/${vName}`;

        const { error: vErr } = await supabase.storage.from('podcast-video').upload(vPath, videoFile, {
          cacheControl: '3600',
          upsert: false,
        });

        if (!vErr) videoStoragePath = vPath;
      }

      setUploadProgress(asDraft ? 'Saving episode draft…' : 'Publishing episode…');

      const res = await publishEpisodeAction({
        podcastId: selectedPodcastId,
        seasonNumber: Number(seasonNumber) || 1,
        episodeNumber: Number(episodeNumber) || 1,
        title: episodeTitle.trim(),
        subtitle: episodeSubtitle.trim() || undefined,
        durationSeconds: (Number(durationMinutes) || 30) * 60,
        audioPath: audioStoragePath,
        videoPath: videoStoragePath,
        showNotes: showNotes.trim() || undefined,
        transcript: transcript.trim() || undefined,
        chapters: chapters.length > 0 ? chapters : undefined,
        timedLinks: timedLinks.length > 0 ? timedLinks : undefined,
        episodeType,
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
              <h2 className="text-lg font-black text-white">Podcast Studio &amp; Universal Publisher</h2>
              <p className="text-xs text-brand-sandstone/70">
                Launch Caribbean audio &amp; video shows with RSS 2.0 syndication, chapter markers &amp; timed links.
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

        {/* Feedback banners */}
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

        {/* TAB 1: PUBLISH EPISODE */}
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
                  className="px-5 py-2.5 rounded-xl bg-purple-600 text-white text-xs font-black shadow-md shadow-purple-600/30"
                >
                  Create Show Now →
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Select Show */}
                <div>
                  <label className="block text-xs font-black text-brand-sandstone/80 mb-1">
                    Select Target Podcast Show *
                  </label>
                  <select
                    value={selectedPodcastId}
                    onChange={(e) => setSelectedPodcastId(e.target.value)}
                    className="w-full bg-slate-950/80 border border-white/20 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    {existingPodcasts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Title & Subtitle */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-black text-brand-sandstone/80 mb-1">
                      Episode Title *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Sound System History Part 1"
                      value={episodeTitle}
                      onChange={(e) => setEpisodeTitle(e.target.value)}
                      className="w-full bg-slate-950/80 border border-white/20 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-brand-sandstone/80 mb-1">
                      Episode Subtitle
                    </label>
                    <input
                      type="text"
                      placeholder="Brief one-line teaser"
                      value={episodeSubtitle}
                      onChange={(e) => setEpisodeSubtitle(e.target.value)}
                      className="w-full bg-slate-950/80 border border-white/20 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                {/* Season, Episode, Type, Duration */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-black text-brand-sandstone/80 mb-1">Season #</label>
                    <input
                      type="number"
                      min={1}
                      value={seasonNumber}
                      onChange={(e) => setSeasonNumber(parseInt(e.target.value, 10) || 1)}
                      className="w-full bg-slate-950/80 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-brand-sandstone/80 mb-1">Episode #</label>
                    <input
                      type="number"
                      min={1}
                      value={episodeNumber}
                      onChange={(e) => setEpisodeNumber(parseInt(e.target.value, 10) || 1)}
                      className="w-full bg-slate-950/80 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-brand-sandstone/80 mb-1">Episode Type</label>
                    <select
                      value={episodeType}
                      onChange={(e) => setEpisodeType(e.target.value as any)}
                      className="w-full bg-slate-950/80 border border-white/20 rounded-xl px-2 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="full">Full Episode</option>
                      <option value="trailer">Trailer</option>
                      <option value="bonus">Bonus</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-brand-sandstone/80 mb-1">Duration (min)</label>
                    <input
                      type="number"
                      min={1}
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10) || 30)}
                      className="w-full bg-slate-950/80 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                {/* Media Uploads (Audio & Video) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Audio Upload */}
                  <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                    <label className="block text-xs font-black text-white flex items-center gap-1.5">
                      <Mic className="w-3.5 h-3.5 text-purple-400" /> Master Audio File *
                    </label>
                    <input
                      ref={audioInputRef}
                      type="file"
                      accept="audio/*"
                      onChange={handleAudioChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => audioInputRef.current?.click()}
                      className="w-full py-3 px-3 rounded-xl border border-dashed border-purple-500/40 hover:bg-purple-600/10 text-xs font-bold text-brand-sandstone/80 hover:text-white flex items-center justify-center gap-2"
                    >
                      <UploadCloud className="w-4 h-4 text-purple-400" />
                      <span>{audioFileName || 'Choose MP3, WAV or AAC'}</span>
                    </button>
                  </div>

                  {/* Video Upload */}
                  <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                    <label className="block text-xs font-black text-white flex items-center gap-1.5">
                      <Video className="w-3.5 h-3.5 text-indigo-400" /> Video Derivative (Optional)
                    </label>
                    <input
                      ref={videoInputRef}
                      type="file"
                      accept="video/*"
                      onChange={handleVideoChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => videoInputRef.current?.click()}
                      className="w-full py-3 px-3 rounded-xl border border-dashed border-indigo-500/40 hover:bg-indigo-600/10 text-xs font-bold text-brand-sandstone/80 hover:text-white flex items-center justify-center gap-2"
                    >
                      <Video className="w-4 h-4 text-indigo-400" />
                      <span>{videoFileName || 'Choose MP4 or WebM'}</span>
                    </button>
                  </div>
                </div>

                {/* Show Notes & CaribAI Assistant */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-brand-sandstone/80">
                      Show Notes &amp; Description
                    </label>
                    <button
                      type="button"
                      onClick={handleCaribAiGenerate}
                      disabled={isGeneratingAi}
                      className="text-[11px] font-black px-2.5 py-1 rounded-lg bg-purple-600/20 text-purple-300 border border-purple-500/40 hover:bg-purple-600/40 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3 text-purple-400" />
                      <span>{isGeneratingAi ? 'CaribAI Generating…' : 'CaribAI Smart Draft'}</span>
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    placeholder="Describe this episode, guests, talking points, and links…"
                    value={showNotes}
                    onChange={(e) => setShowNotes(e.target.value)}
                    className="w-full bg-slate-950/80 border border-white/20 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                {/* Chapter Markers Editor */}
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-white flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-purple-400" /> Chapter Markers ({chapters.length})
                    </label>
                    <button
                      type="button"
                      onClick={addChapter}
                      className="text-[11px] text-purple-400 font-bold hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add Chapter
                    </button>
                  </div>

                  <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                    {chapters.map((chap, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs">
                        <input
                          type="number"
                          min={0}
                          placeholder="Sec"
                          value={chap.startSeconds}
                          onChange={(e) => updateChapter(idx, 'startSeconds', parseInt(e.target.value, 10) || 0)}
                          className="w-20 bg-slate-950/80 border border-white/20 rounded-lg px-2 py-1 text-white text-xs font-mono"
                        />
                        <input
                          type="text"
                          placeholder="Chapter Title"
                          value={chap.title}
                          onChange={(e) => updateChapter(idx, 'title', e.target.value)}
                          className="flex-1 bg-slate-950/80 border border-white/20 rounded-lg px-2 py-1 text-white text-xs"
                        />
                        {chapters.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeChapter(idx)}
                            className="p-1 text-rose-400 hover:text-white"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Timed Links Editor */}
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-white flex items-center gap-1.5">
                      <Link2 className="w-3.5 h-3.5 text-emerald-400" /> In-Stream Timed Links ({timedLinks.length})
                    </label>
                    <button
                      type="button"
                      onClick={addTimedLink}
                      className="text-[11px] text-emerald-400 font-bold hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add Timed Link
                    </button>
                  </div>

                  {timedLinks.length > 0 && (
                    <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                      {timedLinks.map((tl, idx) => (
                        <div key={idx} className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                          <input
                            type="number"
                            placeholder="Sec"
                            value={tl.timestampSeconds}
                            onChange={(e) => updateTimedLink(idx, 'timestampSeconds', parseInt(e.target.value, 10) || 0)}
                            className="bg-slate-950/80 border border-white/20 rounded-lg px-2 py-1 text-white text-xs font-mono"
                          />
                          <input
                            type="text"
                            placeholder="Link Title"
                            value={tl.title}
                            onChange={(e) => updateTimedLink(idx, 'title', e.target.value)}
                            className="bg-slate-950/80 border border-white/20 rounded-lg px-2 py-1 text-white text-xs"
                          />
                          <div className="flex items-center gap-1">
                            <input
                              type="url"
                              placeholder="https://…"
                              value={tl.url}
                              onChange={(e) => updateTimedLink(idx, 'url', e.target.value)}
                              className="flex-1 bg-slate-950/80 border border-white/20 rounded-lg px-2 py-1 text-white text-xs"
                            />
                            <button
                              type="button"
                              onClick={() => removeTimedLink(idx)}
                              className="p-1 text-rose-400 hover:text-white"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Subscriber Only Checkbox */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="isEpisodeSubscriberOnly"
                    checked={isEpisodeSubscriberOnly}
                    onChange={(e) => setIsEpisodeSubscriberOnly(e.target.checked)}
                    className="w-4 h-4 accent-purple-600 rounded"
                  />
                  <label htmlFor="isEpisodeSubscriberOnly" className="text-xs text-brand-sandstone/90 font-bold flex items-center gap-1">
                    <Lock className="w-3 h-3 text-amber-300" /> Subscribers &amp; Members Only
                  </label>
                </div>

                {/* Actions Bar */}
                <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleEpisodeSubmit(true)}
                    className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs"
                  >
                    Save Draft
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleEpisodeSubmit(false)}
                    className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs shadow-lg shadow-purple-600/30 flex items-center gap-2"
                  >
                    {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Publish Episode Now</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CREATE SHOW */}
        {user && tab === 'create_show' && (
          <form onSubmit={handleCreateShow} className="space-y-4">
            {/* Show Title & Subtitle */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-black text-brand-sandstone/80 mb-1">
                  Podcast Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Caribbean Tech &amp; Culture"
                  value={showTitle}
                  onChange={(e) => setShowTitle(e.target.value)}
                  className="w-full bg-slate-950/80 border border-white/20 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-black text-brand-sandstone/80 mb-1">
                  Show Subtitle
                </label>
                <input
                  type="text"
                  placeholder="One-line show tagline"
                  value={showSubtitle}
                  onChange={(e) => setShowSubtitle(e.target.value)}
                  className="w-full bg-slate-950/80 border border-white/20 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* Author, Territory, Category */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-black text-brand-sandstone/80 mb-1">Host / Author</label>
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="w-full bg-slate-950/80 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-brand-sandstone/80 mb-1">Territory</label>
                <select
                  value={islandTerritory}
                  onChange={(e) => setIslandTerritory(e.target.value)}
                  className="w-full bg-slate-950/80 border border-white/20 rounded-xl px-2 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  {CARIBBEAN_PODCAST_TERRITORIES.map((t) => (
                    <option key={t.iso} value={t.iso}>
                      {t.flag} {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-brand-sandstone/80 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950/80 border border-white/20 rounded-xl px-2 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  {CARIBBEAN_PODCAST_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Show Description */}
            <div>
              <label className="block text-xs font-black text-brand-sandstone/80 mb-1">
                Show Description
              </label>
              <textarea
                rows={3}
                placeholder="What is this podcast about? What themes, stories, or interviews will listeners hear?"
                value={showDescription}
                onChange={(e) => setShowDescription(e.target.value)}
                className="w-full bg-slate-950/80 border border-white/20 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Artwork Upload */}
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <label className="block text-xs font-black text-white flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-purple-400" /> Square Cover Artwork (min 1400x1400)
              </label>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                onChange={handleCoverChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                className="w-full py-3 px-3 rounded-xl border border-dashed border-purple-500/40 hover:bg-purple-600/10 text-xs font-bold text-brand-sandstone/80 hover:text-white flex items-center justify-center gap-2"
              >
                <UploadCloud className="w-4 h-4 text-purple-400" />
                <span>{coverFile ? coverFile.name : 'Choose Square JPEG or PNG'}</span>
              </button>
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !showTitle.trim()}
                className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-black text-xs shadow-lg shadow-purple-600/30 flex items-center gap-2"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Create Podcast Show</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
