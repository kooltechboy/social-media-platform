'use client';

import React, { useState, useRef, useTransition } from 'react';
import { Camera, Upload, Trash2, RefreshCw, AlertCircle, CheckCircle, Image as ImageIcon } from 'lucide-react';
import { uploadPageImageAction, removePageImageAction } from '../../lib/pages/actions';

interface PageImageUploaderProps {
  pageId: string;
  imageType: 'avatar' | 'banner';
  currentUrl?: string | null;
  onUrlChange?: (newUrl: string | null) => void;
  disabled?: boolean;
}

export default function PageImageUploader({
  pageId,
  imageType,
  currentUrl,
  onUrlChange,
  disabled = false,
}: PageImageUploaderProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl || null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAvatar = imageType === 'avatar';
  const label = isAvatar ? 'Page Profile Picture' : 'Page Cover Banner';
  const recommendedDimensions = isAvatar ? 'Recommended: 400×400px (1:1)' : 'Recommended: 1200×450px (16:6)';
  const maxSizeBytes = isAvatar ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
  const maxSizeLabel = isAvatar ? '5MB' : '10MB';
  const allowedExtensions = isAvatar ? 'JPG, PNG, WebP, GIF' : 'JPG, PNG, WebP';

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    setSuccessMessage(null);

    // Validate MIME type
    const validMimes = isAvatar
      ? ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      : ['image/jpeg', 'image/png', 'image/webp'];

    if (!validMimes.includes(file.type.toLowerCase())) {
      setErrorMessage(`Please select a valid image format (${allowedExtensions}).`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Validate size
    if (file.size > maxSizeBytes) {
      setErrorMessage(`File exceeds maximum allowed size of ${maxSizeLabel}.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Instant local preview
    const objectUrl = URL.createObjectURL(file);
    const previousSavedUrl = previewUrl;
    setPreviewUrl(objectUrl);
    setIsUploading(true);

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append('file', file);

        const res = await uploadPageImageAction(pageId, formData, imageType);

        if (res.success && res.url) {
          setPreviewUrl(res.url);
          setSuccessMessage(res.message || `${label} updated successfully!`);
          if (onUrlChange) {
            onUrlChange(res.url);
          }
        } else {
          setErrorMessage(res.error || `Failed to upload ${label.toLowerCase()}.`);
          setPreviewUrl(previousSavedUrl);
        }
      } catch (err: any) {
        setErrorMessage(err?.message || 'A network error occurred while uploading.');
        setPreviewUrl(previousSavedUrl);
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    });
  };

  const handleRemove = async () => {
    if (!confirm(`Are you sure you want to remove this ${label.toLowerCase()}?`)) return;

    setErrorMessage(null);
    setSuccessMessage(null);

    startTransition(async () => {
      try {
        const res = await removePageImageAction(pageId, imageType);
        if (res.success) {
          setPreviewUrl(null);
          setSuccessMessage(`${label} removed successfully.`);
          if (onUrlChange) {
            onUrlChange(null);
          }
        } else {
          setErrorMessage(res.error || `Failed to remove ${label.toLowerCase()}.`);
        }
      } catch (err: any) {
        setErrorMessage(err?.message || 'A network error occurred while removing.');
      }
    });
  };

  return (
    <div className="space-y-3 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5 text-brand-sunriseCoral" />
            <span>{label}</span>
          </h4>
          <p className="text-[11px] text-brand-sandstone/60">
            {recommendedDimensions} · Max {maxSizeLabel} ({allowedExtensions})
          </p>
        </div>

        {previewUrl && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={disabled || isUploading || isPending}
            className="text-[11px] font-bold text-rose-400 hover:text-rose-300 disabled:opacity-50 flex items-center gap-1 transition-colors px-2.5 py-1 rounded-lg hover:bg-rose-500/10"
            aria-label={`Remove ${label}`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Remove</span>
          </button>
        )}
      </div>

      {/* Hidden native file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={isAvatar ? 'image/jpeg,image/png,image/webp,image/gif' : 'image/jpeg,image/png,image/webp'}
        onChange={handleFileSelect}
        className="hidden"
        id={`page-image-input-${pageId}-${imageType}`}
        disabled={disabled || isUploading || isPending}
      />

      {/* Upload & Preview Container */}
      {isAvatar ? (
        <div className="flex items-center gap-5">
          <div className="relative group shrink-0">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-slate-900 border-2 border-white/20 shadow-xl overflow-hidden flex items-center justify-center">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt={label}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-900/60 to-slate-950 flex flex-col items-center justify-center text-brand-sandstone/60">
                  <span className="text-3xl">🌴</span>
                  <span className="text-[9px] font-bold mt-1">No Avatar</span>
                </div>
              )}

              {/* Uploading Spinner Overlay */}
              {(isUploading || isPending) && (
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center text-white gap-1 z-10">
                  <RefreshCw className="w-5 h-5 animate-spin text-brand-sunriseCoral" />
                  <span className="text-[9px] font-black uppercase tracking-wider">Saving...</span>
                </div>
              )}
            </div>

            {/* Quick Hover Overlay */}
            {!disabled && !isUploading && !isPending && (
              <label
                htmlFor={`page-image-input-${pageId}-${imageType}`}
                className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity rounded-3xl cursor-pointer flex flex-col items-center justify-center text-white gap-1 text-[10px] font-black uppercase tracking-wider"
              >
                <Camera className="w-5 h-5 text-brand-sunriseCoral" />
                <span>Change</span>
              </label>
            )}
          </div>

          <div className="space-y-2 flex-1">
            <label
              htmlFor={`page-image-input-${pageId}-${imageType}`}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-black text-xs transition-all cursor-pointer shadow-md ${
                disabled || isUploading || isPending ? 'opacity-50 pointer-events-none' : ''
              }`}
            >
              <Upload className="w-4 h-4 text-brand-sunriseCoral" />
              <span>{previewUrl ? 'Replace Photo' : 'Upload Profile Picture'}</span>
            </label>
            <p className="text-[11px] text-brand-sandstone/60 leading-relaxed">
              Shown across the Caribbean on public page headers, home feed posts, directory discovery, and search.
            </p>
          </div>
        </div>
      ) : (
        /* Banner Container (16:6 aspect ratio) */
        <div className="relative group w-full rounded-3xl overflow-hidden border border-white/10 bg-slate-900 shadow-xl">
          <div className="h-40 sm:h-52 w-full relative bg-gradient-to-r from-purple-900 via-indigo-950 to-slate-900">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt={label}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-brand-sandstone/40 gap-2 p-6 text-center">
                <ImageIcon className="w-8 h-8 opacity-40 text-brand-sunriseCoral" />
                <p className="text-xs font-bold text-white/80">No Cover Banner Set</p>
                <p className="text-[11px] text-brand-sandstone/50 max-w-sm">
                  Add a high-resolution cover photo to capture your brand or island identity.
                </p>
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />

            {/* Uploading Spinner Overlay */}
            {(isUploading || isPending) && (
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center text-white gap-2 z-10">
                <RefreshCw className="w-6 h-6 animate-spin text-brand-sunriseCoral" />
                <span className="text-xs font-black uppercase tracking-wider">Uploading Banner...</span>
              </div>
            )}
          </div>

          {/* Bottom Action Bar inside Banner */}
          <div className="p-3 bg-slate-950/90 border-t border-white/5 flex items-center justify-between gap-3">
            <span className="text-[11px] text-brand-sandstone/60 truncate">
              {previewUrl ? 'Current page banner active.' : 'Recommended ratio: 16:6 widescreen'}
            </span>
            <label
              htmlFor={`page-image-input-${pageId}-${imageType}`}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-sunriseCoral hover:brightness-110 text-slate-950 font-black text-xs transition-all cursor-pointer shadow-md shrink-0 ${
                disabled || isUploading || isPending ? 'opacity-50 pointer-events-none' : ''
              }`}
            >
              <Upload className="w-3.5 h-3.5 text-slate-950" />
              <span>{previewUrl ? 'Change Banner' : 'Upload Banner'}</span>
            </label>
          </div>
        </div>
      )}

      {/* Notifications */}
      {errorMessage && (
        <div
          role="alert"
          className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2 animate-fadeIn"
        >
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div
          role="status"
          className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fadeIn"
        >
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{successMessage}</span>
        </div>
      )}
    </div>
  );
}
