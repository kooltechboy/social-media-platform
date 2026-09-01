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
  Trash2,
  BarChart2,
  ShoppingBag,
  Calendar,
  HeartHandshake,
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
import { generateCreatorContentPlan } from '@caribbean/ai';
import DeviceMediaCaptureModal, { type CaptureMode } from './media/device-media-capture-modal';

export type ComposerMode =
  | 'text'
  | 'photo'
  | 'video'
  | 'reel'
  | 'live'
  | 'poll'
  | 'product'
  | 'event'
  | 'fundraiser'
  | 'alert';

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

const DRAFT_KEY = 'tukubi_composer_draft_v3';

export default function UniversalComposer({
  displayName = 'Caribbean Member',
  avatarInitials = 'TK',
  accountType = 'personal',
  onPostCreated,
  defaultExpanded = false,
  initialMode = 'text',
}: UniversalComposerProps) {
  const router = useRouter();
  const { t } = useTranslation();

  const [isExpanded, setIsExpanded] = useState(defaultExpanded || initialMode !== 'text');
  const [mode, setMode] = useState<ComposerMode>(initialMode);
  const [content, setContent] = useState('');
  const [audience, setAudience] = useState<AudienceSelection>('everyone');
  const [isReel, setIsReel] = useState(initialMode === 'reel');

  // Media files
  const [mediaList, setMediaList] = useState<UploadedMediaItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [activeMediaDropdown, setActiveMediaDropdown] = useState<'photo' | 'video' | 'reel' | null>(null);

  // Native / Live Camera modal
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [cameraModalMode, setCameraModalMode] = useState<CaptureMode>('photo');

  // Interactive Attachment States
  // 1. Poll
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);

  // 2. Product / Marketplace
  const [productTitle, setProductTitle] = useState('');
  const [productPrice, setProductPrice] = useState('');

  // 3. Event
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventLocation, setEventLocation] = useState('');

  // 4. Fundraiser / Relief
  const [fundraiserTitle, setFundraiserTitle] = useState('');
  const [fundraiserTarget, setFundraiserTarget] = useState('');

  // 5. Official Alert (Government / Institution)
  const [isOfficialAlert, setIsOfficialAlert] = useState(false);

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

  function handleFileSelect(files: FileList | null, preferredType?: 'image' | 'video', markAsReel = false) {
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
      if (markAsReel) {
        setIsReel(true);
        setMode('reel');
      }
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
      setMode('reel');
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

  // Upload files to Supabase 'post-media' bucket
  async function uploadMediaFiles(): Promise<string[]> {
    if (mediaList.length === 0) return [];
    const supabase = createSupabaseBrowserClient();
    const uploadedUrls: string[] = [];

    for (let i = 0; i < mediaList.length; i++) {
      const item = mediaList[i];
      setUploadProgressText(`Uploading media ${i + 1} of ${mediaList.length}...`);

      if (supabase) {
        try {
          const fileExt = item.file.name.split('.').pop() || (item.type === 'video' ? 'mp4' : 'jpg');
          const cleanName = item.file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
          const filePath = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}_${cleanName}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('post-media')
            .upload(filePath, item.file, {
              cacheControl: '3600',
              upsert: false,
            });

          if (!uploadError) {
            const { data: pubData } = supabase.storage.from('post-media').getPublicUrl(filePath);
            if (pubData && pubData.publicUrl) {
              uploadedUrls.push(pubData.publicUrl);
              continue;
            }
          }
        } catch (err) {
          console.error('Storage upload error:', err);
        }
      }

      // Fallback data preview URL for offline or test sandbox
      uploadedUrls.push(item.previewUrl);
    }

    return uploadedUrls;
  }

  async function handlePublish(e: React.FormEvent) {
    e.preventDefault();
    const hasMedia = mediaList.length > 0;
    const hasContent = content.trim().length > 0;
    const hasPoll = mode === 'poll' && pollQuestion.trim().length > 0;
    const hasProduct = mode === 'product' && productTitle.trim().length > 0;
    const hasEvent = mode === 'event' && eventTitle.trim().length > 0;
    const hasFundraiser = mode === 'fundraiser' && fundraiserTitle.trim().length > 0;

    if (!hasContent && !hasMedia && !hasPoll && !hasProduct && !hasEvent && !hasFundraiser) {
      setErrorMessage('Please enter some text, add photos/videos, or attach an update.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      // 1. Upload media files
      const uploadedMediaUrls = await uploadMediaFiles();

      // 2. Build structured captions & content
      let finalContent = content.trim();

      // Append individual media captions if provided
      const mediaCaptions = mediaList
        .map((m) => m.caption?.trim())
        .filter(Boolean);

      if (mediaCaptions.length > 0 && !finalContent) {
        finalContent = mediaCaptions.join('\n');
      } else if (mediaCaptions.length > 0 && finalContent) {
        const extraCaptions = mediaCaptions.filter((c) => c !== finalContent);
        if (extraCaptions.length > 0) {
          finalContent = `${finalContent}\n\n${extraCaptions.join('\n')}`;
        }
      }

      // Attach dynamic mode sections
      if (mode === 'poll' && pollQuestion.trim()) {
        const validOptions = pollOptions.filter((o) => o.trim());
        if (validOptions.length > 0) {
          finalContent = `${finalContent ? `${finalContent}\n\n` : ''}📊 **Poll:** ${pollQuestion.trim()}\n${validOptions.map((o) => `• ${o.trim()}`).join('\n')}`;
        }
      } else if (mode === 'product' && productTitle.trim()) {
        finalContent = `${finalContent ? `${finalContent}\n\n` : ''}🛍️ **Featured Product:** ${productTitle.trim()} ($${productPrice ? productPrice.trim() : '0.00'} USD on TUKUBI)`;
      } else if (mode === 'event' && eventTitle.trim()) {
        finalContent = `${finalContent ? `${finalContent}\n\n` : ''}📅 **Upcoming Caribbean Event:** ${eventTitle.trim()} (${eventDate ? eventDate.trim() : 'TBD'}${eventLocation ? ` • 📍 ${eventLocation.trim()}` : ''})`;
      } else if (mode === 'fundraiser' && fundraiserTitle.trim()) {
        finalContent = `${finalContent ? `${finalContent}\n\n` : ''}💰 **Community Fundraiser:** ${fundraiserTitle.trim()} (Goal: $${fundraiserTarget ? fundraiserTarget.trim() : '1,000'} USD on TUKUBI)`;
      }

      if (isOfficialAlert) {
        finalContent = `🚨 **OFFICIAL CIVIC ADVISORY** 🚨\n\n${finalContent}`;
      }

      // Map simplified audience to backend visibility and cultural tags
      let backendVisibility: 'public' | 'followers' | 'friends' | 'private' = 'public';
      const culturalTags: string[] = [];

      if (isReel || mode === 'reel') {
        culturalTags.push('reel');
      }
      if (isOfficialAlert) {
        culturalTags.push('civic_alert', 'official');
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

      // Reset state on successful publish
      setContent('');
      setMediaList([]);
      setMode('text');
      setIsReel(false);
      setPollQuestion('');
      setPollOptions(['', '']);
      setProductTitle('');
      setProductPrice('');
      setEventTitle('');
      setEventDate('');
      setEventLocation('');
      setFundraiserTitle('');
      setFundraiserTarget('');
      setIsOfficialAlert(false);
      setIsExpanded(false);

      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {
        // Ignore
      }

      setSuccessMessage('Published! Your post is live on the feed.');
      setTimeout(() => setSuccessMessage(null), 4000);

      // Dispatch global window event for instant feed update
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

  function openCameraFor(captureMode: CaptureMode) {
    setCameraModalMode(captureMode);
    setCameraModalOpen(true);
    setActiveMediaDropdown(null);
  }

  function handleAiAssist() {
    const topic = content.trim() || 'Caribbean culture, community, and diaspora connection';
    const plan = generateCreatorContentPlan({
      topic,
      category: 'social',
      dialect: 'standard_english',
    });
    if (!content.trim() && plan.captions.length > 0) {
      setContent(`${plan.captions[0]}\n\n${plan.hashtags.join(' ')}`);
    } else {
      setContent((prev) => `${prev.trim()}\n\n${plan.hashtags.join(' ')}`);
    }
    setIsExpanded(true);
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
          setCameraModalOpen(false);
          if (cameraModalMode === 'video') videoInputRef.current?.click();
          else if (cameraModalMode === 'reel') reelInputRef.current?.click();
          else photoInputRef.current?.click();
        }}
      />

      {/* Hidden File Pickers */}
      <input
        type="file"
        ref={photoInputRef}
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          handleFileSelect(e.target.files, 'image');
          e.target.value = '';
        }}
      />
      <input
        type="file"
        ref={videoInputRef}
        accept="video/*"
        multiple
        className="hidden"
        onChange={(e) => {
          handleFileSelect(e.target.files, 'video');
          e.target.value = '';
        }}
      />
      <input
        type="file"
        ref={reelInputRef}
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          handleFileSelect(e.target.files, 'video', true);
          e.target.value = '';
        }}
      />

      {/* Main Composer Box */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`glass rounded-3xl border transition-all ${
          isDragging
            ? 'border-brand-caribbeanSea shadow-2xl shadow-brand-caribbeanSea/30 ring-2 ring-brand-caribbeanSea/40 bg-brand-dusk/95'
            : 'border-slate-800/80 hover:border-slate-700 bg-brand-dusk/80 shadow-xl'
        }`}
      >
        {!isExpanded ? (
          /* ────────────────────────────────────────────────────────── */
          /* 1. COLLAPSED STREAM PROMPT BAR (ALL OPTIONS DIRECTLY CLICKABLE) */
          /* ────────────────────────────────────────────────────────── */
          <div className="p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-caribbeanSea via-brand-goldenHour to-brand-sunriseCoral text-slate-950 font-black flex items-center justify-center text-xs shadow-md flex-shrink-0 ring-2 ring-brand-caribbeanSea/30">
                {avatarInitials}
              </div>

              <button
                type="button"
                onClick={() => setIsExpanded(true)}
                className="flex-1 bg-brand-twilight/90 hover:bg-brand-twilight text-left px-4 py-3 rounded-2xl text-sm font-medium text-brand-sandstone/50 hover:text-brand-sandstone border border-slate-800 transition-all flex items-center justify-between group cursor-text"
              >
                <span>What&apos;s happening, {firstName}?</span>
                <span className="text-xs font-bold text-brand-caribbeanSea group-hover:text-brand-goldenHour flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-brand-goldenHour" /> Create Post
                </span>
              </button>
            </div>

            {/* Direct Action Buttons Row */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/70 overflow-x-auto scrollbar-none gap-1 sm:gap-2">
              {/* Photo Direct Trigger */}
              <button
                type="button"
                onClick={() => {
                  photoInputRef.current?.click();
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-brand-sunriseCoral hover:bg-brand-twilight transition-all whitespace-nowrap"
                title="Choose Photos from Device"
              >
                <ImageIcon className="w-4 h-4 text-brand-sunriseCoral" />
                <span>Photo</span>
              </button>

              {/* Video Direct Trigger */}
              <button
                type="button"
                onClick={() => {
                  videoInputRef.current?.click();
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-rose-400 hover:bg-brand-twilight transition-all whitespace-nowrap"
                title="Choose Videos from Device"
              >
                <Video className="w-4 h-4 text-rose-400" />
                <span>Video</span>
              </button>

              {/* Reel Direct Trigger */}
              <button
                type="button"
                onClick={() => {
                  setIsReel(true);
                  setMode('reel');
                  reelInputRef.current?.click();
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-amber-300 hover:bg-brand-twilight transition-all whitespace-nowrap"
                title="Upload Short Video Reel"
              >
                <Film className="w-4 h-4 text-brand-goldenHour" />
                <span>Reel</span>
              </button>

              {/* Live Camera Direct Trigger */}
              <button
                type="button"
                onClick={() => openCameraFor('photo')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-brand-caribbeanSea hover:bg-brand-twilight transition-all whitespace-nowrap"
                title="Open Camera"
              >
                <Camera className="w-4 h-4 text-brand-caribbeanSea" />
                <span className="hidden md:inline">Camera</span>
              </button>

              {/* Poll Trigger */}
              <button
                type="button"
                onClick={() => {
                  setMode('poll');
                  setIsExpanded(true);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-purple-400 hover:bg-brand-twilight transition-all whitespace-nowrap"
                title="Create Community Poll"
              >
                <BarChart2 className="w-4 h-4 text-purple-400" />
                <span className="hidden sm:inline">Poll</span>
              </button>

              {/* Store / Product Trigger */}
              <button
                type="button"
                onClick={() => {
                  setMode('product');
                  setIsExpanded(true);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-emerald-400 hover:bg-brand-twilight transition-all whitespace-nowrap"
                title="Feature a Product"
              >
                <ShoppingBag className="w-4 h-4 text-emerald-400" />
                <span className="hidden sm:inline">Store</span>
              </button>

              {/* Event Trigger */}
              <button
                type="button"
                onClick={() => {
                  setMode('event');
                  setIsExpanded(true);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-yellow-400 hover:bg-brand-twilight transition-all whitespace-nowrap"
                title="Share an Upcoming Caribbean Event"
              >
                <Calendar className="w-4 h-4 text-yellow-400" />
                <span className="hidden sm:inline">Event</span>
              </button>

              {/* Fundraiser / Relief Trigger */}
              <button
                type="button"
                onClick={() => {
                  setMode('fundraiser');
                  setIsExpanded(true);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-rose-400 hover:bg-brand-twilight transition-all whitespace-nowrap"
                title="Launch Community Fundraiser"
              >
                <HeartHandshake className="w-4 h-4 text-rose-400" />
                <span className="hidden sm:inline">Relief</span>
              </button>

              {/* AI Creator Assist Trigger */}
              <button
                type="button"
                onClick={handleAiAssist}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-brand-goldenHour bg-brand-goldenHour/10 hover:bg-brand-goldenHour/20 border border-brand-goldenHour/30 transition-all whitespace-nowrap"
                title="AI Creator Assistant"
              >
                <Sparkles className="w-4 h-4 text-brand-goldenHour" />
                <span className="hidden md:inline">AI Assist</span>
              </button>
            </div>
          </div>
        ) : (
          /* ────────────────────────────────────────────────────────── */
          /* 2. EXPANDED FULL-FEATURED COMPOSER WORKSPACE               */
          /* ────────────────────────────────────────────────────────── */
          <form onSubmit={handlePublish} className="p-5 space-y-4">
            {/* Header: Author, Audience & Mode Badge */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-caribbeanSea to-brand-sunriseCoral text-slate-950 font-black flex items-center justify-center text-xs shadow-md flex-shrink-0">
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
                    {mode !== 'text' && mode !== 'reel' && (
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-brand-caribbeanSea/20 text-brand-caribbeanSea border border-brand-caribbeanSea/30">
                        {mode}
                      </span>
                    )}
                  </h4>

                  {/* Audience Selector */}
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
                onClick={() => {
                  setIsExpanded(false);
                  setMode('text');
                }}
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
                    ? 'Add a caption for your media...'
                    : mode === 'poll'
                    ? 'Ask your Caribbean community a question...'
                    : mode === 'product'
                    ? 'Describe this product, handcrafted items, or store deal...'
                    : mode === 'event'
                    ? 'Describe your upcoming carnival fete, concert, or gathering...'
                    : mode === 'fundraiser'
                    ? 'Share why this community relief or initiative needs support...'
                    : `What's on your mind, ${firstName}? Share stories, thoughts, photos, or videos...`
                }
                rows={mediaList.length > 0 || mode !== 'text' ? 3 : 4}
                maxLength={3000}
                className="w-full bg-brand-twilight/80 border border-slate-800/80 rounded-2xl p-4 text-sm text-brand-sandstone placeholder-brand-sandstone/40 focus:outline-none focus:border-brand-caribbeanSea/60 focus:ring-1 focus:ring-brand-caribbeanSea/60 transition-all resize-none leading-relaxed"
              />
              <div className="absolute bottom-3 right-3 text-[10px] font-mono text-brand-sandstone/40">
                {content.length}/3000
              </div>
            </div>

            {/* ────────────────────────────────────────────────────────── */}
            {/* ATTACHMENT PANELS FOR SPECIALIZED MODES                    */}
            {/* ────────────────────────────────────────────────────────── */}

            {/* 1. POLL PANEL */}
            {mode === 'poll' && (
              <div className="p-4 rounded-2xl bg-brand-twilight border border-purple-500/30 space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-400 flex items-center gap-1.5">
                    <BarChart2 className="w-4 h-4" /> Interactive Community Poll
                  </span>
                  <button
                    type="button"
                    onClick={() => setMode('text')}
                    className="text-brand-sandstone/40 hover:text-brand-sandstone text-xs flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" /> Remove
                  </button>
                </div>

                <input
                  type="text"
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  placeholder="Poll Question (e.g. Best Carnival road march of 2026?)"
                  className="w-full bg-brand-dusk border border-slate-800 rounded-xl px-3 py-2 text-xs text-brand-sandstone focus:outline-none focus:border-purple-500"
                />

                <div className="space-y-2">
                  {pollOptions.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const next = [...pollOptions];
                          next[idx] = e.target.value;
                          setPollOptions(next);
                        }}
                        placeholder={`Option ${idx + 1}`}
                        className="flex-1 bg-brand-dusk border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-brand-sandstone focus:outline-none focus:border-purple-500"
                      />
                      {pollOptions.length > 2 && (
                        <button
                          type="button"
                          onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== idx))}
                          className="p-1.5 text-brand-sandstone/40 hover:text-rose-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                  {pollOptions.length < 5 && (
                    <button
                      type="button"
                      onClick={() => setPollOptions([...pollOptions, ''])}
                      className="text-xs font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1 pt-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Option
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* 2. PRODUCT / STORE PANEL */}
            {mode === 'product' && (
              <div className="p-4 rounded-2xl bg-brand-twilight border border-emerald-500/30 space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <ShoppingBag className="w-4 h-4" /> Feature Marketplace Product
                  </span>
                  <button
                    type="button"
                    onClick={() => setMode('text')}
                    className="text-brand-sandstone/40 hover:text-brand-sandstone text-xs flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" /> Remove
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={productTitle}
                    onChange={(e) => setProductTitle(e.target.value)}
                    placeholder="Product Name (e.g. Handmade Jamaican Blue Mountain Roast)"
                    className="w-full bg-brand-dusk border border-slate-800 rounded-xl px-3 py-2 text-xs text-brand-sandstone focus:outline-none focus:border-emerald-500"
                  />
                  <input
                    type="number"
                    step="0.01"
                    value={productPrice}
                    onChange={(e) => setProductPrice(e.target.value)}
                    placeholder="Price ($ USD on TUKUBI)"
                    className="w-full bg-brand-dusk border border-slate-800 rounded-xl px-3 py-2 text-xs text-brand-sandstone focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            )}

            {/* 3. EVENT PANEL */}
            {mode === 'event' && (
              <div className="p-4 rounded-2xl bg-brand-twilight border border-yellow-500/30 space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-yellow-400 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" /> Caribbean Event / Gathering
                  </span>
                  <button
                    type="button"
                    onClick={() => setMode('text')}
                    className="text-brand-sandstone/40 hover:text-brand-sandstone text-xs flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" /> Remove
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    placeholder="Event Name (e.g. Port of Spain Carnival Fete)"
                    className="w-full bg-brand-dusk border border-slate-800 rounded-xl px-3 py-2 text-xs text-brand-sandstone focus:outline-none focus:border-yellow-500"
                  />
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full bg-brand-dusk border border-slate-800 rounded-xl px-3 py-2 text-xs text-brand-sandstone focus:outline-none focus:border-yellow-500"
                  />
                  <input
                    type="text"
                    value={eventLocation}
                    onChange={(e) => setEventLocation(e.target.value)}
                    placeholder="Location / Island (e.g. Queen's Park Savannah)"
                    className="w-full bg-brand-dusk border border-slate-800 rounded-xl px-3 py-2 text-xs text-brand-sandstone focus:outline-none focus:border-yellow-500"
                  />
                </div>
              </div>
            )}

            {/* 4. FUNDRAISER / RELIEF PANEL */}
            {mode === 'fundraiser' && (
              <div className="p-4 rounded-2xl bg-brand-twilight border border-rose-500/30 space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                    <HeartHandshake className="w-4 h-4" /> Launch Community Relief / Fundraiser
                  </span>
                  <button
                    type="button"
                    onClick={() => setMode('text')}
                    className="text-brand-sandstone/40 hover:text-brand-sandstone text-xs flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" /> Remove
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={fundraiserTitle}
                    onChange={(e) => setFundraiserTitle(e.target.value)}
                    placeholder="Cause / Initiative Title (e.g. Hurricane Preparedness Relief)"
                    className="w-full bg-brand-dusk border border-slate-800 rounded-xl px-3 py-2 text-xs text-brand-sandstone focus:outline-none focus:border-rose-500"
                  />
                  <input
                    type="number"
                    value={fundraiserTarget}
                    onChange={(e) => setFundraiserTarget(e.target.value)}
                    placeholder="Funding Goal ($ USD on TUKUBI)"
                    className="w-full bg-brand-dusk border border-slate-800 rounded-xl px-3 py-2 text-xs text-brand-sandstone focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>
            )}

            {/* 5. CIVIC ALERT CHECKBOX (Government / Institution accounts) */}
            {(accountType === 'government' || accountType === 'institution') && (
              <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-950/30 border border-brand-goldenHour/30">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-brand-goldenHour" />
                  <div>
                    <p className="text-xs font-bold text-amber-300">Mark as Official Civic Advisory</p>
                    <p className="text-[10px] text-brand-sandstone/60">High priority alert for residents and diaspora</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isOfficialAlert}
                  onChange={(e) => setIsOfficialAlert(e.target.checked)}
                  className="w-4 h-4 accent-brand-goldenHour rounded cursor-pointer"
                />
              </div>
            )}

            {/* Media Previews Grid with per-media Captions */}
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

            {/* Action Bar Footer (All options directly clickable) */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
              {/* Attachment Mode Switchers */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
                {/* Media */}
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  title="Add Photos from Device"
                  className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    mediaList.length > 0
                      ? 'bg-brand-sunriseCoral/20 text-brand-sunriseCoral border border-brand-sunriseCoral/30'
                      : 'text-brand-sandstone/70 hover:text-brand-sunriseCoral hover:bg-brand-twilight'
                  }`}
                >
                  <ImageIcon className="w-4 h-4 text-brand-sunriseCoral" />
                  <span className="hidden md:inline">Photo</span>
                </button>

                {/* Video */}
                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  title="Add Video from Device"
                  className="p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all text-brand-sandstone/70 hover:text-rose-400 hover:bg-brand-twilight"
                >
                  <Video className="w-4 h-4 text-rose-400" />
                  <span className="hidden md:inline">Video</span>
                </button>

                {/* Reel */}
                <button
                  type="button"
                  onClick={() => {
                    setIsReel(true);
                    setMode('reel');
                    reelInputRef.current?.click();
                  }}
                  title="Upload Short Vertical Reel"
                  className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    isReel
                      ? 'bg-brand-goldenHour/20 text-amber-300 border border-brand-goldenHour/30'
                      : 'text-brand-sandstone/70 hover:text-amber-300 hover:bg-brand-twilight'
                  }`}
                >
                  <Film className="w-4 h-4 text-brand-goldenHour" />
                  <span className="hidden md:inline">Reel</span>
                </button>

                {/* Live Camera */}
                <button
                  type="button"
                  onClick={() => openCameraFor('photo')}
                  title="Capture from Camera"
                  className="p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all text-brand-sandstone/70 hover:text-brand-caribbeanSea hover:bg-brand-twilight"
                >
                  <Camera className="w-4 h-4 text-brand-caribbeanSea" />
                  <span className="hidden lg:inline">Camera</span>
                </button>

                {/* Poll */}
                <button
                  type="button"
                  onClick={() => setMode(mode === 'poll' ? 'text' : 'poll')}
                  title="Create Interactive Poll"
                  className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    mode === 'poll'
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                      : 'text-brand-sandstone/70 hover:text-purple-400 hover:bg-brand-twilight'
                  }`}
                >
                  <BarChart2 className="w-4 h-4 text-purple-400" />
                  <span className="hidden md:inline">Poll</span>
                </button>

                {/* Store */}
                <button
                  type="button"
                  onClick={() => setMode(mode === 'product' ? 'text' : 'product')}
                  title="Feature a Store Product"
                  className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    mode === 'product'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'text-brand-sandstone/70 hover:text-emerald-400 hover:bg-brand-twilight'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4 text-emerald-400" />
                  <span className="hidden md:inline">Store</span>
                </button>

                {/* Event */}
                <button
                  type="button"
                  onClick={() => setMode(mode === 'event' ? 'text' : 'event')}
                  title="Attach Upcoming Event"
                  className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    mode === 'event'
                      ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                      : 'text-brand-sandstone/70 hover:text-yellow-400 hover:bg-brand-twilight'
                  }`}
                >
                  <Calendar className="w-4 h-4 text-yellow-400" />
                  <span className="hidden md:inline">Event</span>
                </button>

                {/* Fundraiser */}
                <button
                  type="button"
                  onClick={() => setMode(mode === 'fundraiser' ? 'text' : 'fundraiser')}
                  title="Launch Community Relief Fundraiser"
                  className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    mode === 'fundraiser'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : 'text-brand-sandstone/70 hover:text-rose-400 hover:bg-brand-twilight'
                  }`}
                >
                  <HeartHandshake className="w-4 h-4 text-rose-400" />
                  <span className="hidden md:inline">Relief</span>
                </button>

                {/* AI Creator Assistant */}
                <button
                  type="button"
                  onClick={handleAiAssist}
                  title="AI Creator Assistant: Polish & Add Hashtags"
                  className="p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all text-brand-goldenHour bg-brand-goldenHour/10 border border-brand-goldenHour/30 hover:bg-brand-goldenHour/20"
                >
                  <Sparkles className="w-4 h-4 text-brand-goldenHour" />
                  <span className="hidden lg:inline">AI Assist</span>
                </button>
              </div>

              {/* Submit Button */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    (!content.trim() &&
                      mediaList.length === 0 &&
                      !pollQuestion.trim() &&
                      !productTitle.trim() &&
                      !eventTitle.trim() &&
                      !fundraiserTitle.trim())
                  }
                  className="w-full sm:w-auto bg-gradient-to-r from-brand-caribbeanSea via-brand-sunriseCoral to-brand-goldenHour hover:opacity-95 disabled:opacity-40 text-slate-950 font-black px-6 py-2.5 rounded-2xl text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-brand-caribbeanSea/20 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                      <span>{uploadProgressText || 'Publishing...'}</span>
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

            {/* Success Notification */}
            {successMessage && (
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}
          </form>
        )}
      </div>
    </>
  );
}
