'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Film,
  Music,
  UploadCloud,
  CheckCircle,
  AlertCircle,
  Volume2,
  Sliders,
  Sparkles,
  Lock,
  Globe,
  Users,
} from 'lucide-react';
import { CARIBBEAN_SOUNDS, type CaribbeanSound } from '../../lib/constants/caribbean-sounds';
import { publishReelAction } from '../../lib/media/reel-actions';

interface CreateReelModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSoundId?: string;
  user: {
    id: string;
    displayName: string;
    username?: string;
  } | null;
}

export default function CreateReelModal({
  isOpen,
  onClose,
  initialSoundId,
  user,
}: CreateReelModalProps) {
  const [title, setTitle] = useState('');
  const [selectedSound, setSelectedSound] = useState<CaribbeanSound | null>(null);
  const [isSelectingSound, setIsSelectingSound] = useState(false);
  const [soundSearch, setSoundSearch] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<'public' | 'followers' | 'subscribers'>('public');
  const [originalAudioVolume, setOriginalAudioVolume] = useState(100);
  const [trackVolume, setTrackVolume] = useState(80);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (initialSoundId) {
      const found = CARIBBEAN_SOUNDS.find((s) => s.id === initialSoundId);
      if (found) setSelectedSound(found);
    }
  }, [initialSoundId]);

  if (!isOpen) return null;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      setErrorMessage('Please select a valid video file (.mp4, .mov, .webm).');
      return;
    }

    setVideoFile(file);
    const url = URL.createObjectURL(file);
    setVideoPreviewUrl(url);
    setErrorMessage(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage('Please add a title / caption for your Reel.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const formData = new FormData();
    formData.set('title', title.trim());
    formData.set('visibility', visibility);
    if (selectedSound) {
      formData.set('soundId', selectedSound.id);
      formData.set('soundTitle', `${selectedSound.title} — ${selectedSound.artist}`);
    }
    formData.set('durationSeconds', '30');

    try {
      const res = await publishReelAction(formData);
      if (res.success) {
        setSuccessMessage('🎉 Your Caribbean Reel has been published!');
        setTimeout(() => {
          onClose();
          window.location.reload();
        }, 1200);
      } else {
        setErrorMessage(res.error ?? 'Failed to publish reel.');
        setIsSubmitting(false);
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Error publishing reel.');
      setIsSubmitting(false);
    }
  }

  const filteredSounds = soundSearch.trim()
    ? CARIBBEAN_SOUNDS.filter(
        (s) =>
          s.title.toLowerCase().includes(soundSearch.toLowerCase()) ||
          s.artist.toLowerCase().includes(soundSearch.toLowerCase()) ||
          s.genre.toLowerCase().includes(soundSearch.toLowerCase())
      )
    : CARIBBEAN_SOUNDS;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0D1322] border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 relative space-y-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-brand-sandstone">Create Caribbean Reel</h2>
              <p className="text-xs text-brand-sandstone/60">Share short-form island moments &amp; rhythm stems</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-brand-dusk border border-slate-800 flex items-center justify-center text-brand-sandstone/60 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs text-emerald-400 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Video Selection / Preview */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-2">Video Media *</label>
            {videoPreviewUrl ? (
              <div className="relative rounded-2xl overflow-hidden bg-black aspect-[9/12] max-h-72 mx-auto border border-slate-800 flex items-center justify-center">
                <video
                  ref={videoPreviewRef}
                  src={videoPreviewUrl}
                  controls
                  className="w-full h-full object-contain"
                />
                <button
                  type="button"
                  onClick={() => {
                    setVideoFile(null);
                    setVideoPreviewUrl(null);
                  }}
                  className="absolute top-3 right-3 bg-black/70 text-white p-1.5 rounded-full hover:bg-rose-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-rose-500/50 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-brand-dusk/40 flex flex-col items-center gap-2.5"
              >
                <UploadCloud className="w-10 h-10 text-rose-400" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-200">Click to upload video</p>
                  <p className="text-[11px] text-brand-sandstone/60">MP4, MOV, WebM (up to 500MB, 9:16 vertical)</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            )}
          </div>

          {/* Sound Attachment */}
          <div className="bg-brand-dusk/60 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-rose-400" /> Caribbean Sound / Track
              </label>
              <button
                type="button"
                onClick={() => setIsSelectingSound(!isSelectingSound)}
                className="text-[11px] font-black text-rose-400 hover:underline"
              >
                {selectedSound ? 'Change Track' : '+ Browse Sounds'}
              </button>
            </div>

            {selectedSound ? (
              <div className="flex items-center justify-between p-3 rounded-xl bg-brand-twilight border border-slate-800">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">{selectedSound.flag}</span>
                  <div>
                    <p className="text-xs font-bold text-slate-200">{selectedSound.title}</p>
                    <p className="text-[11px] text-brand-sandstone/60">{selectedSound.artist} • {selectedSound.genre}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedSound(null)}
                  className="text-xs text-slate-400 hover:text-rose-400"
                >
                  Remove
                </button>
              </div>
            ) : (
              <p className="text-xs text-brand-sandstone/60">No sound selected (will use original video audio).</p>
            )}

            {/* Sound Selector Dropdown */}
            {isSelectingSound && (
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <input
                  type="text"
                  placeholder="Search Soca, Dancehall, Reggae, Kompa..."
                  value={soundSearch}
                  onChange={(e) => setSoundSearch(e.target.value)}
                  className="w-full bg-brand-twilight border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
                />
                <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                  {filteredSounds.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => {
                        setSelectedSound(s);
                        setIsSelectingSound(false);
                      }}
                      className="flex items-center justify-between p-2 rounded-lg bg-brand-dusk/80 hover:bg-rose-500/20 border border-slate-800/80 cursor-pointer text-xs transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span>{s.flag}</span>
                        <div>
                          <span className="font-bold text-slate-200">{s.title}</span>
                          <span className="text-[10px] text-brand-sandstone/60 block">{s.artist}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-black text-rose-400 uppercase">{s.genre}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Caption */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">Caption &amp; Hashtags *</label>
            <textarea
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Describe your Caribbean short... #Carnival #Soca #Jamaica #Tukubi"
              rows={3}
              maxLength={300}
              className="w-full bg-brand-twilight border border-slate-700 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-rose-500 resize-none"
            />
            <span className="text-[10px] text-brand-sandstone/40 text-right block">{title.length}/300</span>
          </div>

          {/* Privacy */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-2">Audience &amp; Visibility</label>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {[
                { id: 'public', label: 'Public', icon: <Globe className="w-3.5 h-3.5 text-brand-caribbeanSea" /> },
                { id: 'followers', label: 'Followers', icon: <Users className="w-3.5 h-3.5 text-brand-goldenHour" /> },
                { id: 'subscribers', label: 'Subscribers', icon: <Lock className="w-3.5 h-3.5 text-rose-400" /> },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setVisibility(opt.id as any)}
                  className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 font-bold transition-all ${
                    visibility === opt.id
                      ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                      : 'bg-brand-twilight border-slate-800 text-brand-sandstone/60 hover:text-slate-200'
                  }`}
                >
                  {opt.icon}
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-brand-sandstone/60 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="bg-gradient-to-r from-rose-500 to-brand-goldenHour text-slate-950 font-black px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg disabled:opacity-50 transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  Publishing Reel…
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Publish Reel
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
