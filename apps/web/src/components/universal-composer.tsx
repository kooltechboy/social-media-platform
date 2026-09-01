'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Image as ImageIcon,
  Video,
  Film,
  Camera,
  FolderOpen,
  Sparkles,
  Send,
  X,
  Plus,
  Smile,
  CheckCircle,
  AlertCircle,
  UploadCloud,
  Globe,
  Users,
  Shield,
  Loader2,
  ChevronDown,
} from 'lucide-react';
import { createPostAction } from '../lib/social/actions';
import { createSupabaseBrowserClient } from '../lib/supabase/browser';
import { useTranslation } from '@caribbean/localization';
import DeviceMediaCaptureModal, { type CaptureMode } from './media/device-media-capture-modal';

export type ComposerMode = 'text' | 'photo' | 'video' | 'reel' | 'live' | 'poll' | 'product' | 'event' | 'fundraiser' | 'alert';
export type AudienceSelection = 'everyone' | 'friends' | 'local' | 'caribbean' | 'diaspora';

export interface UniversalComposerProps {
  displayName?: string;
  avatarInitials?: string;
  accountType?: 'personal' | 'creator' | 'business' | 'government' | 'institution';
  onPostCreated?: (post?: any) => void;
  defaultExpanded?: boolean;
  initialMode?: ComposerMode;
}

interface UploadedMediaItem {
  id: string;
  file: File;
  previewUrl: string;
  type: 'image' | 'video';
  caption?: string;
  uploadedUrl?: string;
}

const DRAFT_KEY = 'tukubi_composer_draft_v2';

export default function UniversalComposer({
  displayName = 'Caribbean Member',
  avatarInitials = 'TK',
  accountType = 'personal',
  onPostCreated,
  defaultExpanded = false,
}: UniversalComposerProps) {
  const router = useRouter();
  const { t } = useTranslation();

  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [content, setContent] = useState('');
  const [audience, setAudience] = useState<AudienceSelection>('everyone');
  const [isReel, setIsReel] = useState(false);

  // Media files
  const [mediaList, setMediaList] = useState<UploadedMediaItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [activeMediaDropdown, setActiveMediaDropdown] = useState<'photo' | 'video' | 'reel' | null>(null);

  // Native / Live Camera modal
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [cameraModalMode, setCameraModalMode] = useState<CaptureMode>('photo');

  // Hidden File Inputs
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const reelInputRef = useRef<HTMLInputElement>(null);

  // Status & submission
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const firstName = displayName.split(' ')[0]?.replace('@', '') || 'Friend';

  // Restore draft on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.content) setContent(parsed.content);
        if (parsed.audience) setAudience(parsed.audience);
      }
    } catch {
      // Ignore
    }
  }, []);

  // Auto-save draft
  useEffect(() => {
    if (content.trim()) {
      try {
        localStorage.setItem(
          DRAFT_KEY,
          JSON.stringify({
            content,
            audience,
            updatedAt: Date.now(),
          })
        );
      } catch {
        // Ignore
      }
    }
  }, [content, audience]);

  function handleFileSelect(files: FileList | null, preferredType?: 'image' | 'video') {
    if (!files || files.length === 0) return;
    const items: UploadedMediaItem[] = [];

    Array.from(files).forEach((file) => {
      if (mediaList.length + items.length >= 10) return;
      const isVideo = file.type.startsWith('video/') || preferredType === 'video';
      const previewUrl = URL.createObjectURL(file);
      items.push({
        id: `media_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        file,
        previewUrl,
        type: isVideo ? 'video' : 'image',
        caption: '',
      });
    });

    if (items.length > 0) {
      setMediaList((prev) => [...prev, ...items]);
      setIsExpanded(true);
      setActiveMediaDropdown(null);
    }
  }

  function handleDirectCapture(file: File, type: 'image' | 'video') {
    const previewUrl = URL.createObjectURL(file);
    const item: UploadedMediaItem = {
      id: `media_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      file,
      previewUrl,
      type,
      caption: '',
    };
    setMediaList((prev) => [...prev, item]);
    setIsExpanded(true);
    if (cameraModalMode === 'reel') {
      setIsReel(true);
    }
  }

  function removeMediaItem(id: string) {
    setMediaList((prev) => {
      const target = prev.find((m) => m.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      const next = prev.filter((m) => m.id !== id);
      if (next.length === 0) {
        setIsReel(false);
      }
      return next;
    });
  }

  function updateMediaCaption(id: string, captionText: string) {
    setMediaList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, caption: captionText } : item))
    );
  }

  // Drag & drop handlers
  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  }

  async function uploadMediaFiles(): Promise<string[]> {
    if (mediaList.length === 0) return [];
    setUploadProgressText('Uploading media to Tukubi...');

    const supabase = createSupabaseBrowserClient();
    const uploadedUrls: string[] = [];

    for (let i = 0; i < mediaList.length; i++) {
      const item = mediaList[i];
      const ext = item.file.name?.split('.').pop() || (item.type === 'video' ? 'mp4' : 'jpg');
      const filename = `feed_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}.${ext}`;

      if (supabase) {
        try {
          const { data, error } = await supabase.storage
            .from('post-media')
            .upload(filename, item.file, {
              cacheControl: '3600',
              upsert: false,
            });

          if (!error && data) {
            const { data: publicData } = supabase.storage
              .from('post-media')
              .getPublicUrl(data.path);
            if (publicData?.publicUrl) {
              uploadedUrls.push(publicData.publicUrl);
              continue;
            }
          }
        } catch (err) {
          console.warn('Direct storage upload fallback:', err);
        }
      }

      uploadedUrls.push(item.previewUrl);
    }

    return uploadedUrls;
  }

  async function handlePublish(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() && mediaList.length === 0) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      // 1. Upload media files
      const uploadedMediaUrls = await uploadMediaFiles();

      // 2. Build captions & content
      let finalContent = content.trim();

      // Append individual media captions if provided
      const mediaCaptions = mediaList
        .map((m) => m.caption?.trim())
        .filter(Boolean);

      if (mediaCaptions.length > 0 && !finalContent) {
        finalContent = mediaCaptions.join('\n');
      } else if (mediaCaptions.length > 0 && finalContent) {
        // If content and captions both exist, keep unified text
        const extraCaptions = mediaCaptions.filter((c) => c !== finalContent);
        if (extraCaptions.length > 0) {
          finalContent = `${finalContent}\n\n${extraCaptions.join('\n')}`;
        }
      }

      // Map simplified audience to backend visibility and cultural tags
      let backendVisibility: 'public' | 'followers' | 'friends' | 'private' = 'public';
      const culturalTags: string[] = [];

      if (isReel) {
        culturalTags.push('reel');
      }

      switch (audience) {
        case 'friends':
          backendVisibility = 'friends';
          culturalTags.push('friends');
          break;
        case 'local':
          backendVisibility = 'public';
          culturalTags.push('local');
          break;
        case 'caribbean':
          backendVisibility = 'public';
          culturalTags.push('caribbean');
          break;
        case 'diaspora':
          backendVisibility = 'public';
          culturalTags.push('diaspora');
          break;
        case 'everyone':
        default:
          backendVisibility = 'public';
          break;
      }

      const formData = new FormData();
      formData.set('content', finalContent);
      formData.set('visibility', backendVisibility);
      formData.set('media_urls', JSON.stringify(uploadedMediaUrls));
      formData.set('cultural_tags', JSON.stringify(culturalTags));

      const result = await createPostAction({ error: null }, formData);

      if (result.error) {
        setErrorMessage(result.error);
        return;
      }

      // Clean state on success
      setContent('');
      setMediaList([]);
      setIsReel(false);
      setIsExpanded(false);
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {
        // Ignore
      }

      setSuccessMessage('Published! Your post is live on the feed.');
      setTimeout(() => setSuccessMessage(null), 4000);

      // Dispatch global window event for instant zero-latency feed update
      if (typeof window !== 'undefined' && result.post) {
        window.dispatchEvent(
          new CustomEvent('tukubi:new-post', {
            detail: { post: result.post },
          })
        );
      }

      if (onPostCreated) onPostCreated(result.post);
      router.refresh();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'An unexpected error occurred while publishing.');
    } finally {
      setIsSubmitting(false);
      setUploadProgressText(null);
    }
  }

  function openCameraFor(mode: CaptureMode) {
    setCameraModalMode(mode);
    setCameraModalOpen(true);
    setActiveMediaDropdown(null);
  }

  return (
    <>
      {/* Device Media Live Camera Modal */}
      <DeviceMediaCaptureModal
        isOpen={cameraModalOpen}
        mode={cameraModalMode}
        onClose={() => setCameraModalOpen(false)}
        onCaptureComplete={handleDirectCapture}
        onFallbackToFilePicker={() => {
          if (cameraModalMode === 'photo') photoInputRef.current?.click();
          else if (cameraModalMode === 'video') videoInputRef.current?.click();
          else reelInputRef.current?.click();
        }}
      />

      {/* Hidden file pickers */}
      <input
        ref={photoInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => handleFileSelect(e.target.files, 'image')}
        className="hidden"
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        onChange={(e) => handleFileSelect(e.target.files, 'video')}
        className="hidden"
      />
      <input
        ref={reelInputRef}
        type="file"
        accept="video/*"
        onChange={(e) => {
          setIsReel(true);
          handleFileSelect(e.target.files, 'video');
        }}
        className="hidden"
      />

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative transition-all duration-300 rounded-3xl border shadow-xl ${
          isDragging
            ? 'border-brand-caribbeanSea bg-sky-950/40 ring-4 ring-brand-caribbeanSea/20'
            : 'border-slate-800/90 bg-brand-dusk/90 backdrop-blur-xl hover:border-slate-700/90'
        }`}
      >
        {/* Dragging Overlay */}
        {isDragging && (
          <div className="absolute inset-0 z-30 rounded-3xl bg-brand-twilight/90 backdrop-blur-md flex flex-col items-center justify-center border-2 border-dashed border-brand-caribbeanSea p-6 text-center space-y-2 pointer-events-none">
            <UploadCloud className="w-12 h-12 text-brand-caribbeanSea animate-bounce" />
            <h3 className="text-base font-black text-brand-sandstone">Drop Photos or Videos Here</h3>
            <p className="text-xs text-brand-caribbeanSea">Attach directly to your post</p>
          </div>
        )}

        {/* ────────────────────────────────────────────────────────── */}
        {/* 1. COLLAPSED QUICK-TRIGGER STATE                          */}
        {/* ────────────────────────────────────────────────────────── */}
        {!isExpanded ? (
          <div className="p-4 sm:p-5 space-y-4">
            {successMessage && (
              <div className="p-3 rounded-2xl bg-brand-sunriseCoral/10 border border-brand-sunriseCoral/30 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
                <CheckCircle className="w-4 h-4 text-brand-sunriseCoral flex-shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}
            {errorMessage && (
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-brand-caribbeanSea via-brand-sunriseCoral to-brand-goldenHour p-0.5 shadow-md flex-shrink-0">
                <div className="w-full h-full bg-brand-twilight rounded-2xl flex items-center justify-center font-black text-xs text-brand-sandstone">
                  {avatarInitials}
                </div>
              </div>

              {/* Clickable prompt input */}
              <button
                type="button"
                onClick={() => setIsExpanded(true)}
                className="flex-1 bg-brand-twilight/90 hover:bg-brand-twilight border border-slate-800/90 hover:border-brand-caribbeanSea/40 text-left px-5 py-3 rounded-2xl text-xs sm:text-sm text-brand-sandstone/60 hover:text-slate-200 transition-all flex items-center justify-between group shadow-inner"
              >
                <span>What&apos;s happening, {firstName}?</span>
                <span className="text-[11px] font-bold text-brand-caribbeanSea/80 group-hover:text-brand-caribbeanSea flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-brand-goldenHour" /> Create Post
                </span>
              </button>
            </div>

            {/* Direct Media Actions Bar */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800/70 overflow-x-auto scrollbar-none gap-2">
              {/* Photo Action */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setActiveMediaDropdown(activeMediaDropdown === 'photo' ? null : 'photo')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-300 hover:text-brand-caribbeanSea hover:bg-brand-dusk/80 transition-all whitespace-nowrap"
                >
                  <ImageIcon className="w-4 h-4 text-brand-sunriseCoral" />
                  <span>Photo</span>
                  <ChevronDown className="w-3 h-3 opacity-60" />
                </button>
                {activeMediaDropdown === 'photo' && (
                  <div className="absolute left-0 top-9 z-40 w-44 bg-brand-dusk border border-slate-700 rounded-2xl shadow-xl p-1.5 space-y-1 animate-fadeIn">
                    <button
                      type="button"
                      onClick={() => openCameraFor('photo')}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-white/10 flex items-center gap-2 font-semibold"
                    >
                      <Camera className="w-4 h-4 text-brand-sunriseCoral" />
                      <span>Take Photo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        photoInputRef.current?.click();
                        setActiveMediaDropdown(null);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-white/10 flex items-center gap-2 font-semibold"
                    >
                      <FolderOpen className="w-4 h-4 text-brand-caribbeanSea" />
                      <span>Choose From Device</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Video Action */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setActiveMediaDropdown(activeMediaDropdown === 'video' ? null : 'video')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-300 hover:text-rose-300 hover:bg-brand-dusk/80 transition-all whitespace-nowrap"
                >
                  <Video className="w-4 h-4 text-rose-400" />
                  <span>Video</span>
                  <ChevronDown className="w-3 h-3 opacity-60" />
                </button>
                {activeMediaDropdown === 'video' && (
                  <div className="absolute left-0 top-9 z-40 w-44 bg-brand-dusk border border-slate-700 rounded-2xl shadow-xl p-1.5 space-y-1 animate-fadeIn">
                    <button
                      type="button"
                      onClick={() => openCameraFor('video')}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-white/10 flex items-center gap-2 font-semibold"
                    >
                      <Camera className="w-4 h-4 text-rose-400" />
                      <span>Record Video</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        videoInputRef.current?.click();
                        setActiveMediaDropdown(null);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-white/10 flex items-center gap-2 font-semibold"
                    >
                      <FolderOpen className="w-4 h-4 text-brand-caribbeanSea" />
                      <span>Choose From Device</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Reel Action */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setActiveMediaDropdown(activeMediaDropdown === 'reel' ? null : 'reel')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-300 hover:text-amber-300 hover:bg-brand-dusk/80 transition-all whitespace-nowrap"
                >
                  <Film className="w-4 h-4 text-brand-goldenHour" />
                  <span>Reel</span>
                  <ChevronDown className="w-3 h-3 opacity-60" />
                </button>
                {activeMediaDropdown === 'reel' && (
                  <div className="absolute left-0 top-9 z-40 w-44 bg-brand-dusk border border-slate-700 rounded-2xl shadow-xl p-1.5 space-y-1 animate-fadeIn">
                    <button
                      type="button"
                      onClick={() => openCameraFor('reel')}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-white/10 flex items-center gap-2 font-semibold"
                    >
                      <Camera className="w-4 h-4 text-brand-goldenHour" />
                      <span>Record Reel</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        reelInputRef.current?.click();
                        setActiveMediaDropdown(null);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-white/10 flex items-center gap-2 font-semibold"
                    >
                      <FolderOpen className="w-4 h-4 text-brand-caribbeanSea" />
                      <span>Choose Video</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* ────────────────────────────────────────────────────────── */
          /* 2. EXPANDED SINGLE-SCREEN COMPOSER WORKSPACE               */
          /* ────────────────────────────────────────────────────────── */
          <form onSubmit={handlePublish} className="p-5 space-y-4">
            {/* Header: Author & Simple Audience Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-caribbeanSea to-brand-sunriseCoral text-slate-950 font-black flex items-center justify-center text-xs shadow-md">
                  {avatarInitials}
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-brand-sandstone flex items-center gap-1.5">
                    {displayName}
                    {isReel && (
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-brand-goldenHour/20 text-amber-300 border border-brand-goldenHour/30">
                        Reel
                      </span>
                    )}
                  </h4>

                  {/* Simple Audience Control */}
                  <div className="flex items-center gap-1.5 mt-1">
                    <label htmlFor="audience-select" className="text-[11px] font-bold text-brand-sandstone/60">
                      Who can see this?
                    </label>
                    <div className="relative inline-block">
                      <select
                        id="audience-select"
                        value={audience}
                        onChange={(e) => setAudience(e.target.value as AudienceSelection)}
                        className="bg-brand-twilight border border-brand-caribbeanSea/40 text-[11px] font-bold text-brand-caribbeanSea rounded-full pl-3 pr-7 py-1 focus:outline-none focus:border-brand-caribbeanSea cursor-pointer appearance-none shadow-sm"
                      >
                        <option value="everyone">🌍 Everyone</option>
                        <option value="friends">🤝 Friends</option>
                        <option value="local">🏝️ Local</option>
                        <option value="caribbean">🌴 Caribbean</option>
                        <option value="diaspora">✈️ Diaspora</option>
                      </select>
                      <ChevronDown className="w-3 h-3 text-brand-caribbeanSea absolute right-2.5 top-2 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="self-end sm:self-auto p-1.5 rounded-full text-brand-sandstone/60 hover:text-brand-sandstone hover:bg-brand-dusk transition-colors"
                title="Close composer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Main Content & Caption Input */}
            <div className="relative">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={
                  mediaList.length > 0
                    ? 'Add a caption for your post...'
                    : `What's on your mind, ${firstName}? Write a post or add photos/videos...`
                }
                rows={mediaList.length > 0 ? 3 : 4}
                maxLength={3000}
                className="w-full bg-brand-twilight/80 border border-slate-800/80 rounded-2xl p-4 text-sm text-brand-sandstone placeholder-brand-sandstone/40 focus:outline-none focus:border-brand-caribbeanSea/60 focus:ring-1 focus:ring-brand-caribbeanSea/60 transition-all resize-none leading-relaxed"
              />
              <div className="absolute bottom-3 right-3 text-[10px] font-mono text-brand-sandstone/40">
                {content.length}/3000
              </div>
            </div>

            {/* Media Previews with per-media Captions */}
            {mediaList.length > 0 && (
              <div className="space-y-3 p-3 rounded-2xl bg-brand-twilight/80 border border-slate-800">
                <div className="flex items-center justify-between text-xs font-bold text-brand-sandstone/80 px-1">
                  <span>Attached Media ({mediaList.length}/10)</span>
                  {isReel && (
                    <span className="text-[11px] text-amber-300 font-bold flex items-center gap-1">
                      <Film className="w-3.5 h-3.5" /> Vertical Reel Mode
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {mediaList.map((item) => (
                    <div
                      key={item.id}
                      className="relative group rounded-xl overflow-hidden bg-brand-dusk border border-slate-800 flex flex-col"
                    >
                      <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                        {item.type === 'video' ? (
                          <video src={item.previewUrl} controls className="w-full h-full object-contain" />
                        ) : (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={item.previewUrl} alt="Preview" className="w-full h-full object-cover" />
                        )}
                        <button
                          type="button"
                          onClick={() => removeMediaItem(item.id)}
                          className="absolute top-2 right-2 p-1.5 rounded-full bg-brand-twilight/90 text-rose-400 hover:text-rose-300 hover:bg-rose-950 border border-rose-500/30 transition-all shadow-md"
                          title="Remove media"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                        <span className="absolute bottom-2 left-2 text-[9px] font-bold px-2 py-0.5 rounded bg-brand-twilight/90 text-slate-300 uppercase">
                          {item.type}
                        </span>
                      </div>

                      {/* Optional caption for this media item */}
                      <input
                        type="text"
                        value={item.caption || ''}
                        onChange={(e) => updateMediaCaption(item.id, e.target.value)}
                        placeholder="Add media caption..."
                        className="w-full bg-brand-dusk px-3 py-1.5 text-xs text-brand-sandstone placeholder-brand-sandstone/40 border-t border-slate-800 focus:outline-none focus:bg-slate-900"
                      />
                    </div>
                  ))}

                  {mediaList.length < 10 && (
                    <div className="flex flex-col gap-2 justify-center p-3 rounded-xl border border-dashed border-slate-700 hover:border-brand-caribbeanSea/60 transition-all aspect-video">
                      <p className="text-[11px] font-bold text-center text-brand-sandstone/60">Add More Media</p>
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => photoInputRef.current?.click()}
                          className="p-2 rounded-xl bg-brand-dusk hover:bg-slate-800 text-brand-sunriseCoral text-xs font-bold"
                          title="Add Photo"
                        >
                          <ImageIcon className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => videoInputRef.current?.click()}
                          className="p-2 rounded-xl bg-brand-dusk hover:bg-slate-800 text-rose-400 text-xs font-bold"
                          title="Add Video"
                        >
                          <Video className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openCameraFor('photo')}
                          className="p-2 rounded-xl bg-brand-dusk hover:bg-slate-800 text-brand-goldenHour text-xs font-bold"
                          title="Take Photo"
                        >
                          <Camera className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Error or Progress Notice */}
            {uploadProgressText && (
              <div className="p-3 rounded-2xl bg-sky-950/40 border border-brand-caribbeanSea/30 text-brand-caribbeanSea text-xs font-bold flex items-center gap-2 animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{uploadProgressText}</span>
              </div>
            )}
            {errorMessage && (
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Action Bar Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
              {/* Media selection buttons */}
              <div className="flex items-center gap-1 sm:gap-2">
                {/* Photo Trigger */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setActiveMediaDropdown(activeMediaDropdown === 'photo' ? null : 'photo')}
                    className="p-2 rounded-xl text-slate-300 hover:text-brand-sunriseCoral hover:bg-brand-twilight transition-colors flex items-center gap-1 text-xs font-bold"
                    title="Add Photo"
                  >
                    <ImageIcon className="w-4 h-4 text-brand-sunriseCoral" />
                    <span className="hidden sm:inline">Photo</span>
                  </button>
                  {activeMediaDropdown === 'photo' && (
                    <div className="absolute left-0 bottom-10 z-40 w-44 bg-brand-dusk border border-slate-700 rounded-2xl shadow-xl p-1.5 space-y-1 animate-fadeIn">
                      <button
                        type="button"
                        onClick={() => openCameraFor('photo')}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-white/10 flex items-center gap-2 font-semibold"
                      >
                        <Camera className="w-4 h-4 text-brand-sunriseCoral" />
                        <span>Take Photo</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          photoInputRef.current?.click();
                          setActiveMediaDropdown(null);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-white/10 flex items-center gap-2 font-semibold"
                      >
                        <FolderOpen className="w-4 h-4 text-brand-caribbeanSea" />
                        <span>Choose From Device</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Video Trigger */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setActiveMediaDropdown(activeMediaDropdown === 'video' ? null : 'video')}
                    className="p-2 rounded-xl text-slate-300 hover:text-rose-400 hover:bg-brand-twilight transition-colors flex items-center gap-1 text-xs font-bold"
                    title="Add Video"
                  >
                    <Video className="w-4 h-4 text-rose-400" />
                    <span className="hidden sm:inline">Video</span>
                  </button>
                  {activeMediaDropdown === 'video' && (
                    <div className="absolute left-0 bottom-10 z-40 w-44 bg-brand-dusk border border-slate-700 rounded-2xl shadow-xl p-1.5 space-y-1 animate-fadeIn">
                      <button
                        type="button"
                        onClick={() => openCameraFor('video')}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-white/10 flex items-center gap-2 font-semibold"
                      >
                        <Camera className="w-4 h-4 text-rose-400" />
                        <span>Record Video</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          videoInputRef.current?.click();
                          setActiveMediaDropdown(null);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-white/10 flex items-center gap-2 font-semibold"
                      >
                        <FolderOpen className="w-4 h-4 text-brand-caribbeanSea" />
                        <span>Choose From Device</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Reel Trigger */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setActiveMediaDropdown(activeMediaDropdown === 'reel' ? null : 'reel')}
                    className="p-2 rounded-xl text-slate-300 hover:text-amber-300 hover:bg-brand-twilight transition-colors flex items-center gap-1 text-xs font-bold"
                    title="Create Reel"
                  >
                    <Film className="w-4 h-4 text-brand-goldenHour" />
                    <span className="hidden sm:inline">Reel</span>
                  </button>
                  {activeMediaDropdown === 'reel' && (
                    <div className="absolute left-0 bottom-10 z-40 w-44 bg-brand-dusk border border-slate-700 rounded-2xl shadow-xl p-1.5 space-y-1 animate-fadeIn">
                      <button
                        type="button"
                        onClick={() => openCameraFor('reel')}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-white/10 flex items-center gap-2 font-semibold"
                      >
                        <Camera className="w-4 h-4 text-brand-goldenHour" />
                        <span>Record Reel (9:16)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          reelInputRef.current?.click();
                          setActiveMediaDropdown(null);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-white/10 flex items-center gap-2 font-semibold"
                      >
                        <FolderOpen className="w-4 h-4 text-brand-caribbeanSea" />
                        <span>Choose Video</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting || (!content.trim() && mediaList.length === 0)}
                  className="bg-gradient-to-r from-brand-caribbeanSea via-brand-sunriseCoral to-brand-goldenHour hover:opacity-95 disabled:opacity-40 text-slate-950 font-black px-6 py-2.5 rounded-full text-xs transition-all shadow-lg flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Publishing...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Post</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </>
  );
}
