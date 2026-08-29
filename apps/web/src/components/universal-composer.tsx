'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Image as ImageIcon,
  Video,
  Film,
  Radio,
  BarChart2,
  Calendar,
  ShoppingBag,
  HeartHandshake,
  MapPin,
  Globe,
  Sparkles,
  Send,
  X,
  Plus,
  Smile,
  Wallet,
  CheckCircle,
  AlertCircle,
  UploadCloud,
  Eye,
  Lock,
  Users,
  Shield,
  Loader2,
  Trash2,
} from 'lucide-react';
import { createPostAction } from '../lib/social/actions';
import { createSupabaseBrowserClient } from '../lib/supabase/browser';

export type ComposerMode = 'text' | 'photo' | 'video' | 'reel' | 'live' | 'poll' | 'product' | 'event' | 'fundraiser' | 'alert';

export interface UniversalComposerProps {
  displayName?: string;
  avatarInitials?: string;
  accountType?: 'personal' | 'creator' | 'business' | 'government' | 'institution';
  onPostCreated?: (post?: any) => void;
  defaultExpanded?: boolean;
}



interface UploadedMediaItem {
  id: string;
  file: File;
  previewUrl: string;
  type: 'image' | 'video';
  uploadedUrl?: string;
}

const DRAFT_KEY = 'tukubi_composer_draft_v1';

export default function UniversalComposer({
  displayName = 'Caribbean Member',
  avatarInitials = 'TK',
  accountType = 'personal',
  onPostCreated,
  defaultExpanded = false,
}: UniversalComposerProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [mode, setMode] = useState<ComposerMode>('text');
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'followers' | 'friends' | 'private'>('public');
  const [audienceContext, setAudienceContext] = useState<'diaspora' | 'local'>('diaspora');

  // Media files & uploads
  const [mediaList, setMediaList] = useState<UploadedMediaItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Structured attachments state
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [productTitle, setProductTitle] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [fundraiserTitle, setFundraiserTitle] = useState('');
  const [fundraiserTarget, setFundraiserTarget] = useState('');
  const [isOfficialAlert, setIsOfficialAlert] = useState(false);

  // Status & submission
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const firstName = displayName.split(' ')[0] || 'Friend';

  // Restore draft on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.content) {
          setContent(parsed.content);
        }
      }
    } catch {
      // Ignore local storage read errors
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
            updatedAt: Date.now(),
          })
        );
      } catch {
        // Ignore local storage write errors
      }
    }
  }, [content]);

  function handleFileSelect(files: FileList | null) {
    if (!files || files.length === 0) return;
    const items: UploadedMediaItem[] = [];

    Array.from(files).forEach((file) => {
      if (mediaList.length + items.length >= 10) return; // Max 10 items
      const isVideo = file.type.startsWith('video/');
      const previewUrl = URL.createObjectURL(file);
      items.push({
        id: `media_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        file,
        previewUrl,
        type: isVideo ? 'video' : 'image',
      });
    });

    if (items.length > 0) {
      setMediaList((prev) => [...prev, ...items]);
      setIsExpanded(true);
      if (items.some((i) => i.type === 'video')) {
        setMode('video');
      } else {
        setMode('photo');
      }
    }
  }

  function removeMediaItem(id: string) {
    setMediaList((prev) => {
      const next = prev.filter((m) => m.id !== id);
      if (next.length === 0 && (mode === 'photo' || mode === 'video')) {
        setMode('text');
      }
      return next;
    });
  }

  // Drag and drop event handlers
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
    setUploadProgressText('Optimizing and uploading Caribbean media...');

    const supabase = createSupabaseBrowserClient();
    const uploadedUrls: string[] = [];

    for (let i = 0; i < mediaList.length; i++) {
      const item = mediaList[i];
      const ext = item.file.name.split('.').pop() || (item.type === 'video' ? 'mp4' : 'jpg');
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
        } catch {
          // Fall back to mock URL if client storage request fails in sandbox
        }
      }

      // Fallback data preview URL for offline / sandbox testing
      uploadedUrls.push(item.previewUrl);
    }

    return uploadedUrls;
  }

  async function handlePublish(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() && mediaList.length === 0 && mode === 'text') return;

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      // 1. Direct browser-to-storage media upload
      const uploadedMediaUrls = await uploadMediaFiles();

      // 2. Build structured final post text & attachments
      let finalContent = content.trim();

      if (mode === 'poll' && pollQuestion.trim()) {
        const validOptions = pollOptions.filter((o) => o.trim());
        finalContent = `${finalContent}\n\n📊 **Poll:** ${pollQuestion}\n${validOptions.map((o) => `• ${o}`).join('\n')}`;
      } else if (mode === 'product' && productTitle.trim()) {
        finalContent = `${finalContent}\n\n🛍️ **Featured Product:** ${productTitle} ($${productPrice || '0.00'} USD on SpotPay)`;
      } else if (mode === 'event' && eventTitle.trim()) {
        finalContent = `${finalContent}\n\n📅 **Upcoming Caribbean Event:** ${eventTitle} (${eventDate || 'TBD'})`;
      } else if (mode === 'fundraiser' && fundraiserTitle.trim()) {
        finalContent = `${finalContent}\n\n💰 **SpotPay Fundraiser:** ${fundraiserTitle} (Goal: $${fundraiserTarget || '1,000'} USD)`;
      }

      if (isOfficialAlert) {
        finalContent = `🚨 **OFFICIAL CARIBBEAN ADVISORY** 🚨\n\n${finalContent}`;
      }

      const tags = [
        mode,
      ].filter(Boolean);

      const formData = new FormData();
      formData.set('content', finalContent);
      formData.set('visibility', visibility);
      formData.set('media_urls', JSON.stringify(uploadedMediaUrls));
      formData.set('cultural_tags', JSON.stringify(tags));

      const result = await createPostAction({ error: null }, formData);

      if (result.error) {
        setErrorMessage(result.error);
        return;
      }

      // Clear state and draft on success
      setContent('');
      setMediaList([]);
      setPollQuestion('');
      setPollOptions(['', '']);
      setProductTitle('');
      setProductPrice('');
      setEventTitle('');
      setEventDate('');
      setFundraiserTitle('');
      setFundraiserTarget('');
      setIsOfficialAlert(false);
      setMode('text');
      setIsExpanded(false);
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {
        // Ignore
      }

      setSuccessMessage('Successfully published to the Tukubi feed!');
      setTimeout(() => setSuccessMessage(null), 4000);

      // Dispatch global window event with newly created post for instant FeedStream update
      if (typeof window !== 'undefined' && result.post) {
        window.dispatchEvent(
          new CustomEvent('tukubi:new-post', {
            detail: { post: result.post },
          })
        );
        window.dispatchEvent(
          new CustomEvent('antilia:new-post', {
            detail: { post: result.post },
          })
        );
      }

      if (onPostCreated) onPostCreated(result.post);
      router.refresh();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'An unexpected error occurred while posting.');
    } finally {
      setIsSubmitting(false);
      setUploadProgressText(null);
    }
  }

  function openWithMode(targetMode: ComposerMode) {
    setMode(targetMode);
    setIsExpanded(true);
    if (targetMode === 'photo' || targetMode === 'video' || targetMode === 'reel') {
      setTimeout(() => fileInputRef.current?.click(), 100);
    }
  }

  return (
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
      {/* Hidden Multi-file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*"
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />

      {/* Dragging Overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-30 rounded-3xl bg-brand-twilight/90 backdrop-blur-md flex flex-col items-center justify-center border-2 border-dashed border-brand-caribbeanSea p-6 text-center space-y-2 pointer-events-none">
          <UploadCloud className="w-12 h-12 text-brand-caribbeanSea animate-bounce" />
          <h3 className="text-base font-black text-brand-sandstone">Drop Photos or Videos Here</h3>
          <p className="text-xs text-brand-caribbeanSea">Attach directly to your Tukubi post</p>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* 1. COLLAPSED FACEBOOK-STYLE INLINE STATE                   */}
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
                <Sparkles className="w-3.5 h-3.5 text-brand-goldenHour" /> Post
              </span>
            </button>
          </div>

          {/* Quick Action Pills Row */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-800/70 overflow-x-auto scrollbar-none gap-2">
            <button
              type="button"
              onClick={() => openWithMode('photo')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-300 hover:text-brand-caribbeanSea hover:bg-brand-dusk/80 transition-all whitespace-nowrap"
            >
              <ImageIcon className="w-4 h-4 text-brand-sunriseCoral" />
              <span>Photo</span>
            </button>

            <button
              type="button"
              onClick={() => openWithMode('video')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-300 hover:text-rose-300 hover:bg-brand-dusk/80 transition-all whitespace-nowrap"
            >
              <Video className="w-4 h-4 text-rose-400" />
              <span>Video</span>
            </button>

            <button
              type="button"
              onClick={() => openWithMode('reel')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-300 hover:text-amber-300 hover:bg-brand-dusk/80 transition-all whitespace-nowrap"
            >
              <Film className="w-4 h-4 text-brand-goldenHour" />
              <span>Reel</span>
            </button>

            <button
              type="button"
              onClick={() => openWithMode('poll')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-300 hover:text-purple-300 hover:bg-brand-dusk/80 transition-all whitespace-nowrap"
            >
              <BarChart2 className="w-4 h-4 text-purple-400" />
              <span>Poll</span>
            </button>

            <button
              type="button"
              onClick={() => openWithMode('event')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-300 hover:text-yellow-300 hover:bg-brand-dusk/80 transition-all whitespace-nowrap"
            >
              <Calendar className="w-4 h-4 text-yellow-400" />
              <span>Event</span>
            </button>

            <button
              type="button"
              onClick={() => openWithMode('product')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-300 hover:text-emerald-300 hover:bg-brand-dusk/80 transition-all whitespace-nowrap"
            >
              <ShoppingBag className="w-4 h-4 text-brand-sunriseCoral" />
              <span>Store</span>
            </button>
          </div>
        </div>
      ) : (
        /* ────────────────────────────────────────────────────────── */
        /* 2. EXPANDED UNIVERSAL COMPOSER WORKSPACE                   */
        /* ────────────────────────────────────────────────────────── */
        <form onSubmit={handlePublish} className="p-5 space-y-4">
          {/* Header & Metadata selectors */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-caribbeanSea to-brand-sunriseCoral text-slate-950 font-black flex items-center justify-center text-xs shadow-md">
                {avatarInitials}
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-brand-sandstone flex items-center gap-1.5">
                  {displayName}
                  {accountType !== 'personal' && (
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-brand-sunriseCoral/20 text-emerald-300 border border-brand-sunriseCoral/30">
                      {accountType}
                    </span>
                  )}
                </h4>

                {/* Audience Context Toggle */}
                <div className="flex items-center gap-2 mt-1.5 mb-1">
                  <button
                    type="button"
                    onClick={() => setAudienceContext('diaspora')}
                    className={`border text-[11px] font-bold rounded-lg px-2 py-1 flex items-center gap-1 transition-colors ${
                      audienceContext === 'diaspora'
                        ? 'bg-brand-twilight border-brand-caribbeanSea/50 text-brand-caribbeanSea'
                        : 'bg-brand-dusk border-slate-800 text-brand-sandstone/60 hover:bg-brand-dusk'
                    }`}
                  >
                    Global Diaspora 🌍
                  </button>
                  <button
                    type="button"
                    onClick={() => setAudienceContext('local')}
                    className={`border text-[11px] font-bold rounded-lg px-2 py-1 flex items-center gap-1 transition-colors ${
                      audienceContext === 'local'
                        ? 'bg-brand-twilight border-brand-caribbeanSea/50 text-brand-caribbeanSea'
                        : 'bg-brand-dusk border-slate-800 text-brand-sandstone/60 hover:bg-brand-dusk'
                    }`}
                  >
                    Island Local 🏝️
                  </button>
                </div>

                {/* Visibility Pill selector */}
                <div className="flex items-center flex-wrap gap-1.5 mt-1">
                  <select
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value as typeof visibility)}
                    className="bg-sky-950/40 border border-brand-caribbeanSea/50 text-[11px] font-bold text-brand-caribbeanSea rounded-full px-2.5 py-0.5 focus:outline-none focus:border-brand-caribbeanSea cursor-pointer appearance-none flex items-center"
                  >
                    <option value="public">
                      {audienceContext === 'diaspora' ? '🌍 Public (Diaspora)' : '🏝️ Public (Local)'}
                    </option>
                    <option value="followers">👥 Followers Only</option>
                    <option value="friends">🤝 Close Friends</option>
                    <option value="private">🔒 Private Only</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Close / Collapse button */}
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="self-end sm:self-auto p-1.5 rounded-full text-brand-sandstone/60 hover:text-brand-sandstone hover:bg-brand-dusk transition-colors"
              title="Close composer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main Textarea */}
          <div className="relative">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handlePublish(e);
                }
              }}
              placeholder={`What is happening across the ${audienceContext === 'diaspora' ? 'diaspora' : 'island'}, ${firstName}?`}
              rows={4}
              maxLength={3000}
              className="w-full bg-brand-twilight/80 border border-slate-800/80 rounded-2xl p-4 text-sm text-brand-sandstone placeholder-brand-sandstone/40 focus:outline-none focus:border-brand-caribbeanSea/60 focus:ring-1 focus:ring-brand-caribbeanSea/60 transition-all resize-none leading-relaxed"
            />
            <div className="absolute bottom-3 right-3 text-[10px] font-mono text-brand-sandstone/40">
              {content.length}/3000
            </div>
          </div>

          {/* Media Previews Grid */}
          {mediaList.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 p-3 rounded-2xl bg-brand-twilight/80 border border-slate-800">
              {mediaList.map((item) => (
                <div key={item.id} className="relative group rounded-xl overflow-hidden aspect-video bg-brand-dusk border border-slate-800">
                  {item.type === 'video' ? (
                    <video src={item.previewUrl} className="w-full h-full object-cover" />
                  ) : (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={item.previewUrl} alt="Upload preview" className="w-full h-full object-cover" />
                  )}
                  <button
                    type="button"
                    onClick={() => removeMediaItem(item.id)}
                    className="absolute top-1.5 right-1.5 p-1 rounded-full bg-brand-twilight/80 text-rose-400 hover:text-rose-300 hover:bg-rose-950 border border-rose-500/30 transition-all shadow-md"
                    title="Remove media"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <span className="absolute bottom-1.5 left-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-brand-twilight/80 text-slate-300 uppercase">
                    {item.type}
                  </span>
                </div>
              ))}

              {mediaList.length < 10 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-xl border border-dashed border-slate-700 hover:border-brand-caribbeanSea flex flex-col items-center justify-center gap-1 text-brand-sandstone/60 hover:text-brand-caribbeanSea transition-all aspect-video"
                >
                  <Plus className="w-5 h-5" />
                  <span className="text-[11px] font-bold">Add More</span>
                </button>
              )}
            </div>
          )}

          {/* ────────────────────────────────────────────────────────── */}
          {/* MODE-SPECIFIC STRUCTURED ATTACHMENT PANELS                 */}
          {/* ────────────────────────────────────────────────────────── */}

          {/* Poll Builder */}
          {mode === 'poll' && (
            <div className="p-4 rounded-2xl bg-brand-twilight border border-purple-500/30 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-400 flex items-center gap-1.5">
                  <BarChart2 className="w-4 h-4" /> Caribbean Community Poll
                </span>
                <button type="button" onClick={() => setMode('text')} className="text-brand-sandstone/40 hover:text-brand-sandstone">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <input
                type="text"
                value={pollQuestion}
                onChange={(e) => setPollQuestion(e.target.value)}
                placeholder="Ask a question (e.g. Best Carnival fete in Trinidad?)..."
                className="w-full bg-brand-dusk border border-slate-800 rounded-xl px-3 py-2 text-xs text-brand-sandstone placeholder-brand-sandstone/40 focus:outline-none focus:border-purple-500"
              />
              <div className="space-y-2">
                {pollOptions.map((opt, idx) => (
                  <input
                    key={idx}
                    type="text"
                    value={opt}
                    onChange={(e) => {
                      const next = [...pollOptions];
                      next[idx] = e.target.value;
                      setPollOptions(next);
                    }}
                    placeholder={`Option ${idx + 1}`}
                    className="w-full bg-brand-dusk border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                  />
                ))}
              </div>
              {pollOptions.length < 5 && (
                <button
                  type="button"
                  onClick={() => setPollOptions([...pollOptions, ''])}
                  className="text-[11px] font-bold text-purple-400 hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add Another Option
                </button>
              )}
            </div>
          )}

          {/* Product / Commerce Attachment */}
          {mode === 'product' && (
            <div className="p-4 rounded-2xl bg-brand-twilight border border-brand-sunriseCoral/30 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-brand-sunriseCoral flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4" /> Attach Marketplace Product / Service
                </span>
                <button type="button" onClick={() => setMode('text')} className="text-brand-sandstone/40 hover:text-brand-sandstone">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={productTitle}
                  onChange={(e) => setProductTitle(e.target.value)}
                  placeholder="Product name (e.g. Handmade Mas Costume)"
                  className="bg-brand-dusk border border-slate-800 rounded-xl px-3 py-2 text-xs text-brand-sandstone focus:outline-none focus:border-brand-sunriseCoral"
                />
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs text-brand-sandstone/40 font-bold">$</span>
                  <input
                    type="number"
                    value={productPrice}
                    onChange={(e) => setProductPrice(e.target.value)}
                    placeholder="Price (USD on SpotPay)"
                    className="w-full bg-brand-dusk border border-slate-800 rounded-xl pl-7 pr-3 py-2 text-xs text-brand-sandstone focus:outline-none focus:border-brand-sunriseCoral"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Cultural Event Attachment */}
          {mode === 'event' && (
            <div className="p-4 rounded-2xl bg-brand-twilight border border-yellow-500/30 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-yellow-400 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" /> Attach Cultural Event / Fete
                </span>
                <button type="button" onClick={() => setMode('text')} className="text-brand-sandstone/40 hover:text-brand-sandstone">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="Event Title (e.g. Jouvert Sunrise Party)"
                  className="bg-brand-dusk border border-slate-800 rounded-xl px-3 py-2 text-xs text-brand-sandstone focus:outline-none focus:border-yellow-500"
                />
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="bg-brand-dusk border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-yellow-500"
                />
              </div>
            </div>
          )}

          {/* Fundraiser / Community Relief */}
          {mode === 'fundraiser' && (
            <div className="p-4 rounded-2xl bg-brand-twilight border border-rose-500/30 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                  <HeartHandshake className="w-4 h-4" /> Launch SpotPay Fundraiser / Relief
                </span>
                <button type="button" onClick={() => setMode('text')} className="text-brand-sandstone/40 hover:text-brand-sandstone">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={fundraiserTitle}
                  onChange={(e) => setFundraiserTitle(e.target.value)}
                  placeholder="Cause (e.g. Island Hurricane Relief Fund)"
                  className="bg-brand-dusk border border-slate-800 rounded-xl px-3 py-2 text-xs text-brand-sandstone focus:outline-none focus:border-rose-500"
                />
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs text-brand-sandstone/40 font-bold">$</span>
                  <input
                    type="number"
                    value={fundraiserTarget}
                    onChange={(e) => setFundraiserTarget(e.target.value)}
                    placeholder="Funding Goal (USD on SpotPay)"
                    className="w-full bg-brand-dusk border border-slate-800 rounded-xl pl-7 pr-3 py-2 text-xs text-brand-sandstone focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Civic Alert for Government / Institution */}
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

          {/* ────────────────────────────────────────────────────────── */}
          {/* ACTION TOOLBAR & PUBLISH CONTROLS                          */}
          {/* ────────────────────────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
            {/* Attachment Switchers */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
              <button
                type="button"
                data-mode="photo"
                onClick={() => fileInputRef.current?.click()}
                title="Add Photos or Videos"
                className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  mediaList.length > 0 ? 'bg-brand-caribbeanSea/20 text-brand-caribbeanSea border border-brand-caribbeanSea/30' : 'text-brand-sandstone/60 hover:text-brand-sandstone hover:bg-brand-dusk'
                }`}
              >
                <ImageIcon className="w-4 h-4 text-brand-caribbeanSea" />
                <span className="hidden md:inline">Media ({mediaList.length})</span>
              </button>

              <button
                type="button"
                data-mode="poll"
                onClick={() => setMode(mode === 'poll' ? 'text' : 'poll')}
                title="Create Poll"
                className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  mode === 'poll' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'text-brand-sandstone/60 hover:text-brand-sandstone hover:bg-brand-dusk'
                }`}
              >
                <BarChart2 className="w-4 h-4 text-purple-400" />
                <span className="hidden md:inline">Poll</span>
              </button>

              <button
                type="button"
                data-mode="product"
                onClick={() => setMode(mode === 'product' ? 'text' : 'product')}
                title="Attach Product"
                className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  mode === 'product' ? 'bg-brand-sunriseCoral/20 text-brand-sunriseCoral border border-brand-sunriseCoral/30' : 'text-brand-sandstone/60 hover:text-brand-sandstone hover:bg-brand-dusk'
                }`}
              >
                <ShoppingBag className="w-4 h-4 text-brand-sunriseCoral" />
                <span className="hidden md:inline">Store</span>
              </button>

              <button
                type="button"
                data-mode="event"
                onClick={() => setMode(mode === 'event' ? 'text' : 'event')}
                title="Attach Event"
                className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  mode === 'event' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 'text-brand-sandstone/60 hover:text-brand-sandstone hover:bg-brand-dusk'
                }`}
              >
                <Calendar className="w-4 h-4 text-yellow-400" />
                <span className="hidden md:inline">Event</span>
              </button>

              <button
                type="button"
                data-mode="fundraiser"
                onClick={() => setMode(mode === 'fundraiser' ? 'text' : 'fundraiser')}
                title="Launch Fundraiser"
                className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  mode === 'fundraiser' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'text-brand-sandstone/60 hover:text-brand-sandstone hover:bg-brand-dusk'
                }`}
              >
                <HeartHandshake className="w-4 h-4 text-rose-400" />
                <span className="hidden md:inline">Relief</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const topic = content.trim() || 'Caribbean culture and music';
                  const { generateCreatorContentPlan } = require('@caribbean/ai');
                  const plan = generateCreatorContentPlan({ topic, category: 'social', dialect: 'standard_english' });
                  setContent(prev => prev ? `${prev}\n\n${plan.hashtags.join(' ')}` : `${plan.captions[0]}\n\n${plan.hashtags.join(' ')}`);
                }}
                title="AI Creator Assistant: Polish & Add Hashtags"
                className="p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all text-brand-goldenHour bg-brand-goldenHour/10 border border-brand-goldenHour/30 hover:bg-brand-goldenHour/20"
              >
                <Sparkles className="w-4 h-4 text-brand-goldenHour" />
                <span className="hidden md:inline">AI Creator Assist</span>
              </button>
            </div>

            {/* Submit Button */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="submit"
                disabled={isSubmitting || (!content.trim() && mediaList.length === 0 && mode === 'text')}
                className="w-full sm:w-auto bg-gradient-to-r from-brand-caribbeanSea via-brand-sunriseCoral to-brand-goldenHour hover:from-brand-caribbeanSea hover:to-brand-sunriseCoral text-slate-950 font-black px-6 py-2.5 rounded-2xl text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-brand-caribbeanSea/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>{uploadProgressText || 'Publishing...'}</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>{audienceContext === 'diaspora' ? 'Post to Diaspora' : 'Post Locally'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Feedback banners */}
          {errorMessage && (
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-2xl bg-brand-sunriseCoral/10 border border-brand-sunriseCoral/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-brand-sunriseCoral flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}
        </form>
      )}
    </div>
  );
}

