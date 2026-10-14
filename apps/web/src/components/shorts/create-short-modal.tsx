'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Film,
  Music,
  UploadCloud,
  CheckCircle,
  AlertCircle,
  Globe,
  Users,
  Lock,
  Camera,
  Loader2,
  Building2,
  User,
  Sparkles,
  MapPin,
  Tag,
} from 'lucide-react';
import { CARIBBEAN_SOUNDS, type CaribbeanSound } from '../../lib/constants/caribbean-sounds';
import { publishShortAction, fetchUserManagedPagesAction } from '../../lib/media/short-actions';
import { createSupabaseBrowserClient } from '../../lib/supabase/browser';
import { TukubiCreationStudio, type CreationStudioHandoffPayload } from '../media/creation';

interface ManagedPage {
  id: string;
  name: string;
  avatar_url: string | null;
}

interface CreateShortModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSoundId?: string;
  user: {
    id: string;
    displayName: string;
    username?: string;
  } | null;
}

const CATEGORIES = [
  { id: 'culture', label: 'Carnival & Heritage' },
  { id: 'music', label: 'Soca & Reggae' },
  { id: 'food', label: 'Flavors & Food' },
  { id: 'comedy', label: 'Caribbean Comedy' },
  { id: 'island_life', label: 'Island Life' },
];

const CARIBBEAN_COUNTRIES = [
  'Trinidad & Tobago',
  'Jamaica',
  'Barbados',
  'Bahamas',
  'Guyana',
  'St. Lucia',
  'Antigua & Barbuda',
  'Grenada',
  'St. Vincent & Grenadines',
  'Belize',
  'Haiti',
  'Dominican Republic',
  'Puerto Rico',
  'US Virgin Islands',
  'British Virgin Islands',
  'Cayman Islands',
  'Curacao',
  'Aruba',
  'Suriname',
];

export default function CreateShortModal({
  isOpen,
  onClose,
  initialSoundId,
  user,
}: CreateShortModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('culture');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedSound, setSelectedSound] = useState<CaribbeanSound | null>(null);
  const [isSelectingSound, setIsSelectingSound] = useState(false);
  const [soundSearch, setSoundSearch] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<'public' | 'followers' | 'subscribers'>('public');
  const [videoDuration, setVideoDuration] = useState<number>(30);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  // Managed Pages & Identity
  const [managedPages, setManagedPages] = useState<ManagedPage[]>([]);
  const [selectedIdentity, setSelectedIdentity] = useState<'personal' | string>('personal');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (initialSoundId) {
      const target = initialSoundId.trim().toLowerCase();
      const found = CARIBBEAN_SOUNDS.find(
        (s) =>
          s.id.toLowerCase() === target ||
          s.title.toLowerCase() === target ||
          target.includes(s.title.toLowerCase()) ||
          s.title.toLowerCase().includes(target)
      );
      if (found) setSelectedSound(found);
    }
  }, [initialSoundId]);

  useEffect(() => {
    if (isOpen && user) {
      fetchUserManagedPagesAction().then((pages) => {
        setManagedPages(pages);
      });
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      setErrorMessage('Please select a valid video file (.mp4, .mov, .webm).');
      return;
    }

    if (file.size > 500 * 1024 * 1024) {
      setErrorMessage('Video file exceeds the 500MB size limit.');
      return;
    }

    setVideoFile(file);
    const url = URL.createObjectURL(file);
    setVideoPreviewUrl(url);
    setErrorMessage(null);
  }

  function handleCameraHandoff(payload: CreationStudioHandoffPayload) {
    setIsCameraOpen(false);
    if (payload.file) {
      setVideoFile(payload.file);
      setVideoPreviewUrl(payload.previewUrl || URL.createObjectURL(payload.file));
      setErrorMessage(null);
    }
    if (payload.durationSeconds) {
      setVideoDuration(payload.durationSeconds);
    }
    if (payload.soundId) {
      const found = CARIBBEAN_SOUNDS.find((s) => s.id === payload.soundId);
      if (found) setSelectedSound(found);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage('Please add a caption / title for your Short.');
      return;
    }
    if (!videoFile) {
      setErrorMessage('Please select or record a video file for your Short.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setUploadProgress('Uploading Caribbean Short to secure media storage...');

    try {
      const supabase = createSupabaseBrowserClient();
      if (!supabase) throw new Error('Storage client is unavailable.');

      const fileExt = videoFile.name.split('.').pop() || 'mp4';
      const cleanName = videoFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const effectiveUid = user?.id || 'anonymous';
      const filePath = `${effectiveUid}/shorts/${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${cleanName}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('post-media')
        .upload(filePath, videoFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Short video upload failed: ${uploadError.message}`);
      }

      const { data: pubData } = supabase.storage.from('post-media').getPublicUrl(filePath);
      if (!pubData || !pubData.publicUrl) {
        throw new Error('Failed to resolve public URL for uploaded video.');
      }

      setUploadProgress('Publishing Short across the TUKUBI Caribbean Network...');

      const formData = new FormData();
      formData.set('title', title.trim());
      formData.set('description', description.trim());
      formData.set('visibility', visibility);
      formData.set('category', category);
      formData.set('storagePath', pubData.publicUrl);
      if (selectedCountry) {
        formData.set('locationTag', selectedCountry);
      }
      if (selectedSound) {
        formData.set('soundId', selectedSound.id);
        formData.set('soundTitle', `${selectedSound.title} — ${selectedSound.artist}`);
      }
      formData.set('durationSeconds', String(videoDuration));

      if (selectedIdentity !== 'personal') {
        formData.set('pageId', selectedIdentity);
      }

      const res = await publishShortAction(formData);
      if (res.success) {
        setSuccessMessage('🎉 Your TUKUBI Short has been published!');
        setTimeout(() => {
          onClose();
          window.location.reload();
        }, 1200);
      } else {
        setErrorMessage(res.error ?? 'Failed to publish Short.');
        setIsSubmitting(false);
        setUploadProgress(null);
      }
    } catch (err: any) {
      console.error('[CreateShortModal] Error:', err);
      setErrorMessage(err.message || 'An unexpected error occurred during publishing.');
      setIsSubmitting(false);
      setUploadProgress(null);
    }
  }

  const filteredSounds = CARIBBEAN_SOUNDS.filter(
    (s) =>
      s.title.toLowerCase().includes(soundSearch.toLowerCase()) ||
      s.artist.toLowerCase().includes(soundSearch.toLowerCase()) ||
      s.genre.toLowerCase().includes(soundSearch.toLowerCase())
  );

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
        <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl text-white overflow-hidden my-auto max-h-[92vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90 sticky top-0 z-10 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-caribbeanSea to-brand-coralPink flex items-center justify-center">
                <Film className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white">Publish TUKUBI Short</h3>
                <p className="text-xs text-slate-400">Caribbean short-form video discovery</p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
            {/* Identity Switcher (Personal vs Managed Caribbean Page) */}
            {managedPages.length > 0 && (
              <div className="bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/60 space-y-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-brand-caribbeanSea" />
                  Publish As
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedIdentity('personal')}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all cursor-pointer min-h-[44px] ${
                      selectedIdentity === 'personal'
                        ? 'bg-brand-caribbeanSea/20 border-brand-caribbeanSea text-white'
                        : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    <User className="w-4 h-4 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold truncate">{user?.displayName || 'Personal'}</div>
                      <div className="text-[10px] text-slate-400">Personal Profile</div>
                    </div>
                  </button>

                  {managedPages.map((page) => (
                    <button
                      key={page.id}
                      type="button"
                      onClick={() => setSelectedIdentity(page.id)}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all cursor-pointer min-h-[44px] ${
                        selectedIdentity === page.id
                          ? 'bg-brand-coralPink/20 border-brand-coralPink text-white'
                          : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Building2 className="w-4 h-4 shrink-0 text-brand-coralPink" />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold truncate">{page.name}</div>
                        <div className="text-[10px] text-brand-coralPink/90">Page Account</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Video Input / Preview / Camera Launch */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Video Media (9:16 Vertical Video)
              </label>

              {videoPreviewUrl ? (
                <div className="relative aspect-[9/16] max-h-72 mx-auto bg-black rounded-2xl overflow-hidden border border-slate-700 shadow-inner group">
                  <video
                    ref={videoPreviewRef}
                    src={videoPreviewUrl}
                    controls
                    className="w-full h-full object-contain"
                    onLoadedMetadata={(e) => {
                      const dur = Math.round(e.currentTarget.duration);
                      setVideoDuration(dur);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setVideoFile(null);
                      setVideoPreviewUrl(null);
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-red-600 text-white rounded-full transition-colors cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
                    aria-label="Remove video"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-700 hover:border-brand-caribbeanSea/60 hover:bg-brand-caribbeanSea/5 rounded-2xl transition-all cursor-pointer min-h-[140px]"
                  >
                    <UploadCloud className="w-8 h-8 text-brand-caribbeanSea mb-2" />
                    <span className="text-xs font-bold text-slate-200">Upload Video</span>
                    <span className="text-[10px] text-slate-400 mt-1">MP4, WebM (up to 180s)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsCameraOpen(true)}
                    className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-700 hover:border-brand-coralPink/60 hover:bg-brand-coralPink/5 rounded-2xl transition-all cursor-pointer min-h-[140px]"
                  >
                    <Camera className="w-8 h-8 text-brand-coralPink mb-2" />
                    <span className="text-xs font-bold text-slate-200">Record 9:16 Short</span>
                    <span className="text-[10px] text-slate-400 mt-1">Camera Studio</span>
                  </button>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/quicktime,video/webm"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {/* Caption & Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Caption / Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Share your island vibes or cultural moment..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-caribbeanSea focus:ring-1 focus:ring-brand-caribbeanSea"
                maxLength={150}
                required
              />
            </div>

            {/* Description (Optional) */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Description / Tags (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add hashtags (#Carnival2026, #CaribbeanLife) or details..."
                rows={2}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-caribbeanSea focus:ring-1 focus:ring-brand-caribbeanSea resize-none"
              />
            </div>

            {/* Category Chips */}
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-brand-goldenHour" />
                Category
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer min-h-[36px] ${
                      category === cat.id
                        ? 'bg-brand-caribbeanSea text-white shadow-md'
                        : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Island / Location Tag */}
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-brand-coralPink" />
                Caribbean Island / Location
              </label>
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-caribbeanSea"
              >
                <option value="">Caribbean Wide / All Islands</option>
                {CARIBBEAN_COUNTRIES.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </div>

            {/* Caribbean Sound Selector */}
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5 text-brand-caribbeanSea" />
                  Caribbean Sound
                </span>
                {selectedSound && (
                  <button
                    type="button"
                    onClick={() => setSelectedSound(null)}
                    className="text-[11px] text-red-400 hover:underline cursor-pointer"
                  >
                    Remove Sound
                  </button>
                )}
              </label>

              {selectedSound ? (
                <div className="flex items-center justify-between p-3 bg-brand-caribbeanSea/10 border border-brand-caribbeanSea/30 rounded-xl">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-brand-caribbeanSea/30 flex items-center justify-center shrink-0">
                      <Music className="w-4 h-4 text-brand-caribbeanSea" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate text-white">{selectedSound.title}</div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {selectedSound.artist} • {selectedSound.genre}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsSelectingSound(true)}
                    className="text-xs text-brand-caribbeanSea font-semibold hover:underline cursor-pointer px-2 min-h-[44px] flex items-center"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsSelectingSound(true)}
                  className="w-full flex items-center justify-between p-3 bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-xl text-left cursor-pointer transition-colors min-h-[44px]"
                >
                  <span className="text-xs text-slate-400 flex items-center gap-2">
                    <Music className="w-4 h-4 text-slate-500" />
                    Attach Caribbean Sound (Soca, Reggae, Dancehall...)
                  </span>
                  <Sparkles className="w-3.5 h-3.5 text-brand-goldenHour" />
                </button>
              )}
            </div>

            {/* Visibility Settings */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Audience Visibility
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setVisibility('public')}
                  className={`flex flex-col items-center p-2.5 rounded-xl border text-center transition-all cursor-pointer min-h-[44px] ${
                    visibility === 'public'
                      ? 'bg-brand-caribbeanSea/20 border-brand-caribbeanSea text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  <Globe className="w-4 h-4 mb-1" />
                  <span className="text-[11px] font-bold">Public</span>
                </button>
                <button
                  type="button"
                  onClick={() => setVisibility('followers')}
                  className={`flex flex-col items-center p-2.5 rounded-xl border text-center transition-all cursor-pointer min-h-[44px] ${
                    visibility === 'followers'
                      ? 'bg-brand-caribbeanSea/20 border-brand-caribbeanSea text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  <Users className="w-4 h-4 mb-1" />
                  <span className="text-[11px] font-bold">Followers</span>
                </button>
                <button
                  type="button"
                  onClick={() => setVisibility('subscribers')}
                  className={`flex flex-col items-center p-2.5 rounded-xl border text-center transition-all cursor-pointer min-h-[44px] ${
                    visibility === 'subscribers'
                      ? 'bg-brand-caribbeanSea/20 border-brand-caribbeanSea text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  <Lock className="w-4 h-4 mb-1" />
                  <span className="text-[11px] font-bold">Subscribers</span>
                </button>
              </div>
            </div>

            {/* Status Messages */}
            {errorMessage && (
              <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {uploadProgress && (
              <div className="p-3 bg-brand-caribbeanSea/10 border border-brand-caribbeanSea/30 rounded-xl text-brand-caribbeanSea text-xs flex items-center gap-2 animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                <span>{uploadProgress}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3 bg-green-950/60 border border-green-800/80 rounded-xl text-green-300 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Footer Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || !title.trim() || !videoFile}
                className="w-full bg-gradient-to-r from-brand-caribbeanSea via-brand-coralPink to-brand-goldenHour hover:opacity-95 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer min-h-[48px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Publishing Short...</span>
                  </>
                ) : (
                  <>
                    <Film className="w-4 h-4" />
                    <span>Publish TUKUBI Short</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Sound Selection Modal */}
      {isSelectingSound && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-5 text-white max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <div className="flex items-center gap-2">
                <Music className="w-5 h-5 text-brand-caribbeanSea" />
                <h4 className="font-bold text-sm">Select Caribbean Sound</h4>
              </div>
              <button
                onClick={() => setIsSelectingSound(false)}
                className="p-1 text-slate-400 hover:text-white rounded-full min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Close sound modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <input
              type="text"
              value={soundSearch}
              onChange={(e) => setSoundSearch(e.target.value)}
              placeholder="Search soca, reggae, artist..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 mb-3 focus:outline-none focus:border-brand-caribbeanSea"
            />

            <div className="space-y-2 overflow-y-auto flex-1 pr-1">
              {filteredSounds.map((sound) => (
                <div
                  key={sound.id}
                  onClick={() => {
                    setSelectedSound(sound);
                    setIsSelectingSound(false);
                  }}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800 cursor-pointer border border-transparent hover:border-slate-700 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-white truncate">{sound.title}</div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {sound.artist} • {sound.genre} ({sound.durationFormatted})
                    </div>
                  </div>
                  <button
                    type="button"
                    className="text-xs bg-brand-caribbeanSea/20 hover:bg-brand-caribbeanSea/30 text-brand-caribbeanSea px-3 py-1.5 rounded-lg font-semibold ml-2 min-h-[36px]"
                  >
                    Select
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Creation Studio 9:16 Camera Studio Handoff */}
      {isCameraOpen && (
        <TukubiCreationStudio
          isOpen={isCameraOpen}
          onClose={() => setIsCameraOpen(false)}
          onHandoffComplete={handleCameraHandoff}
          initialMode="reel"
        />
      )}
    </>
  );
}
