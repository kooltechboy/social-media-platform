'use client';

import React, { useState, useRef } from 'react';
import {
  X,
  UploadCloud,
  Image as ImageIcon,
  Video,
  Globe,
  Users,
  Lock,
  Sparkles,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { createStoryAction, type StoryData } from '../../lib/social/actions';
import { createSupabaseBrowserClient } from '../../lib/supabase/browser';

interface CreateMomentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStoryCreated: (story: StoryData) => void;
  currentUserId?: string;
}

export default function CreateMomentModal({
  isOpen,
  onClose,
  onStoryCreated,
  currentUserId,
}: CreateMomentModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mediaKind, setMediaKind] = useState<'image' | 'video'>('image');
  const [caption, setCaption] = useState('');
  const [audience, setAudience] = useState<'public' | 'followers' | 'close_friends'>('public');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progressText, setProgressText] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  function handleFileSelect(files: FileList | null) {
    if (!files || files.length === 0) return;
    const selected = files[0];
    const isVid = selected.type.startsWith('video/');
    setFile(selected);
    setMediaKind(isVid ? 'video' : 'image');
    setPreviewUrl(URL.createObjectURL(selected));
    setErrorMessage(null);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  }

  async function uploadMedia(): Promise<string> {
    if (!file) throw new Error('No media selected');
    setProgressText('Uploading to Tukubi Moment Cloud...');

    const supabase = createSupabaseBrowserClient();
    const ext = file.name.split('.').pop() || (mediaKind === 'video' ? 'mp4' : 'jpg');
    const folder = currentUserId ? `${currentUserId}/` : '';
    const filename = `${folder}moment_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${ext}`;

    if (supabase) {
      try {
        const { data, error } = await supabase.storage
          .from('story-media')
          .upload(filename, file, { cacheControl: '3600', upsert: false });

        if (!error && data) {
          const { data: publicData } = supabase.storage.from('story-media').getPublicUrl(data.path);
          if (publicData?.publicUrl) {
            return publicData.publicUrl;
          }
        }
      } catch {
        // Fallback for offline / sandbox
      }
    }

    return previewUrl || '';
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file && !previewUrl) {
      setErrorMessage('Please select a photo or video to share.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const uploadedUrl = await uploadMedia();
      setProgressText('Publishing your Moment...');

      const formData = new FormData();
      formData.set('media_url', uploadedUrl);
      formData.set('media_kind', mediaKind);
      formData.set('caption', caption.trim());
      formData.set('audience', audience);

      const res = await createStoryAction(formData);

      if (!res.success || !res.story) {
        setErrorMessage(res.error || 'Failed to publish Moment.');
        return;
      }

      onStoryCreated(res.story);
      onClose();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'An error occurred.');
    } finally {
      setIsSubmitting(false);
      setProgressText(null);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-brand-dusk border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-caribbeanSea via-brand-sunriseCoral to-brand-goldenHour p-0.5 flex items-center justify-center shadow-md">
              <div className="w-full h-full bg-brand-dusk rounded-full flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-brand-caribbeanSea" />
              </div>
            </div>
            <h3 className="font-extrabold text-sm sm:text-base text-brand-sandstone">
              Share Caribbean Moment
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-brand-sandstone/60 hover:text-brand-sandstone hover:bg-brand-twilight transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />

          {/* Media Picker / Preview */}
          {!previewUrl ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-brand-caribbeanSea bg-sky-950/40'
                  : 'border-slate-800 hover:border-brand-caribbeanSea/60 bg-brand-twilight/50 hover:bg-brand-twilight/80'
              }`}
            >
              <div className="w-14 h-14 rounded-2xl bg-brand-dusk border border-slate-800 flex items-center justify-center mb-3 shadow-inner">
                <UploadCloud className="w-7 h-7 text-brand-caribbeanSea animate-pulse" />
              </div>
              <h4 className="text-sm font-black text-brand-sandstone mb-1">
                Select or Drop Photo / Video
              </h4>
              <p className="text-xs text-brand-sandstone/50 max-w-xs">
                Visible to the Caribbean diaspora for 24 hours. Max 25MB.
              </p>
            </div>
          ) : (
            <div className="relative rounded-2xl overflow-hidden aspect-[9/16] max-h-72 bg-black border border-slate-800 flex items-center justify-center group mx-auto">
              {mediaKind === 'video' ? (
                <video src={previewUrl} className="w-full h-full object-cover" controls playsInline />
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={previewUrl} alt="Moment Preview" className="w-full h-full object-cover" />
              )}
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setPreviewUrl(null);
                }}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-rose-400 hover:text-rose-300 border border-rose-500/30 transition-all shadow-lg"
                title="Change media"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Caption Input */}
          <div>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Add an island caption or vibes (optional)..."
              maxLength={300}
              rows={2}
              className="w-full bg-brand-twilight border border-slate-800 rounded-xl p-3 text-xs text-brand-sandstone placeholder-brand-sandstone/40 focus:outline-none focus:border-brand-caribbeanSea transition-all resize-none"
            />
            <div className="text-right text-[10px] text-brand-sandstone/40 mt-1">
              {caption.length}/300
            </div>
          </div>

          {/* Audience Selector */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
            <span className="text-xs font-bold text-brand-sandstone/70">Story Audience:</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setAudience('public')}
                className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1 border transition-all ${
                  audience === 'public'
                    ? 'bg-brand-caribbeanSea/20 border-brand-caribbeanSea text-brand-caribbeanSea shadow-sm'
                    : 'bg-brand-twilight border-slate-800 text-brand-sandstone/60 hover:text-brand-sandstone'
                }`}
              >
                <Globe className="w-3.5 h-3.5" /> Public
              </button>
              <button
                type="button"
                onClick={() => setAudience('followers')}
                className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1 border transition-all ${
                  audience === 'followers'
                    ? 'bg-brand-sunriseCoral/20 border-brand-sunriseCoral text-brand-sunriseCoral shadow-sm'
                    : 'bg-brand-twilight border-slate-800 text-brand-sandstone/60 hover:text-brand-sandstone'
                }`}
              >
                <Users className="w-3.5 h-3.5" /> Followers
              </button>
              <button
                type="button"
                onClick={() => setAudience('close_friends')}
                className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1 border transition-all ${
                  audience === 'close_friends'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-sm'
                    : 'bg-brand-twilight border-slate-800 text-brand-sandstone/60 hover:text-brand-sandstone'
                }`}
              >
                <Lock className="w-3.5 h-3.5" /> Close Friends
              </button>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 flex items-center gap-2 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-brand-sandstone/60 hover:text-brand-sandstone hover:bg-brand-twilight transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (!file && !previewUrl)}
              className="bg-gradient-to-r from-brand-caribbeanSea via-brand-sunriseCoral to-brand-goldenHour hover:from-brand-caribbeanSea hover:to-brand-sunriseCoral text-slate-950 font-black px-5 py-2 rounded-xl text-xs flex items-center gap-2 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{progressText || 'Publishing...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Publish Moment</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
