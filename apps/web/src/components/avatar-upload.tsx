'use client';

import React, { useState, useRef } from 'react';
import { Camera, Image as ImageIcon, Loader2, CheckCircle, AlertCircle, X } from 'lucide-react';
import { uploadAvatarAction, uploadCoverAction, removeCoverAction } from '../lib/profile/profile-actions';
import { useAuth } from './auth-provider';
import UserAvatar from './user-avatar';

interface AvatarUploadProps {
  currentAvatarUrl?: string | null;
  displayName: string;
  onAvatarUpdated?: (newUrl: string) => void;
}

interface CoverUploadProps {
  currentCoverUrl?: string | null;
  onCoverUpdated?: (newUrl: string | null) => void;
}

export function AvatarUpload({ currentAvatarUrl, displayName, onAvatarUpdated }: AvatarUploadProps) {
  const { refresh } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatarUrl || null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset feedback
    setError(null);
    setSuccess(false);

    // Client-side validations
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      setError('Please select a JPG, PNG, or WebP image.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image file must be under 5MB.');
      return;
    }

    // Immediate local preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await uploadAvatarAction(formData);

      if (!res.success || !res.data?.url) {
        setError(res.error || 'Failed to upload photo. Please try again.');
        setPreviewUrl(currentAvatarUrl || null);
      } else {
        setPreviewUrl(res.data.url);
        setSuccess(true);
        onAvatarUpdated?.(res.data.url);
        await refresh();
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch {
      setError('A network error occurred while uploading. Please retry.');
      setPreviewUrl(currentAvatarUrl || null);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col items-center sm:items-start gap-4">
      <div className="relative group">
        <UserAvatar
          src={previewUrl}
          name={displayName}
          size="xl"
          className="border-2 border-slate-700"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          aria-label="Change profile photo"
          className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer"
        >
          {uploading ? (
            <Loader2 className="w-6 h-6 animate-spin text-brand-caribbeanSea" />
          ) : (
            <>
              <Camera className="w-5 h-5 text-brand-caribbeanSea mb-0.5" />
              <span className="text-[10px] font-bold">Change</span>
            </>
          )}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileChange}
          className="hidden"
          aria-hidden="true"
        />
      </div>

      <div className="space-y-1 text-center sm:text-left">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-3.5 py-1.5 rounded-xl bg-brand-caribbeanSea/20 hover:bg-brand-caribbeanSea text-brand-caribbeanSea hover:text-slate-950 border border-brand-caribbeanSea/30 text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5"
          >
            {uploading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Uploading photo…</span>
              </>
            ) : (
              <>
                <Camera className="w-3.5 h-3.5" />
                <span>Upload New Photo</span>
              </>
            )}
          </button>
        </div>
        <p className="text-[11px] text-brand-sandstone/50">
          JPG, PNG, or WebP up to 5MB.
        </p>

        {error && (
          <p className="text-xs text-rose-400 flex items-center gap-1 mt-1 bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/20">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </p>
        )}
        {success && (
          <p className="text-xs text-emerald-400 flex items-center gap-1 mt-1 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
            <CheckCircle className="w-3.5 h-3.5 shrink-0" />
            <span>Profile photo updated successfully!</span>
          </p>
        )}
      </div>
    </div>
  );
}

export function CoverUpload({ currentCoverUrl, onCoverUpdated }: CoverUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentCoverUrl || null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccess(false);

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      setError('Please select a JPG, PNG, or WebP image.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Banner image must be under 10MB.');
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await uploadCoverAction(formData);

      if (!res.success || !res.data?.url) {
        setError(res.error || 'Failed to upload cover banner.');
        setPreviewUrl(currentCoverUrl || null);
      } else {
        setPreviewUrl(res.data.url);
        setSuccess(true);
        onCoverUpdated?.(res.data.url);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch {
      setError('A network error occurred. Please retry.');
      setPreviewUrl(currentCoverUrl || null);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemove = async () => {
    setRemoving(true);
    setError(null);
    try {
      const res = await removeCoverAction();
      if (res.success) {
        setPreviewUrl(null);
        onCoverUpdated?.(null);
      } else {
        setError(res.error || 'Failed to remove cover.');
      }
    } catch {
      setError('Failed to remove cover banner.');
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="relative w-full h-36 sm:h-48 rounded-2xl overflow-hidden border border-slate-800 bg-gradient-to-r from-sky-950 via-slate-900 to-amber-950/40">
        {previewUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={previewUrl}
            alt="Cover Banner Preview"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-brand-sandstone/40 p-4 text-center">
            <ImageIcon className="w-8 h-8 mb-2 text-brand-caribbeanSea/40" />
            <p className="text-xs font-semibold">No custom cover banner set.</p>
            <p className="text-[11px] text-brand-sandstone/30">Displaying Caribbean twilight gradient.</p>
          </div>
        )}

        {uploading && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-2 text-brand-sandstone text-xs font-bold">
            <Loader2 className="w-5 h-5 animate-spin text-brand-caribbeanSea" />
            <span>Uploading cover photo…</span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || removing}
            className="px-3.5 py-1.5 rounded-xl bg-brand-caribbeanSea/20 hover:bg-brand-caribbeanSea text-brand-caribbeanSea hover:text-slate-950 border border-brand-caribbeanSea/30 text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>{previewUrl ? 'Change Cover' : 'Upload Cover'}</span>
          </button>

          {previewUrl && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={uploading || removing}
              className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>{removing ? 'Removing…' : 'Remove'}</span>
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="hidden"
            aria-hidden="true"
          />
        </div>

        <span className="text-[11px] text-brand-sandstone/40">
          Recommended: 1500x500px, max 10MB.
        </span>
      </div>

      {error && (
        <p className="text-xs text-rose-400 flex items-center gap-1 bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/20">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}
      {success && (
        <p className="text-xs text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
          <CheckCircle className="w-3.5 h-3.5 shrink-0" />
          <span>Cover banner updated successfully!</span>
        </p>
      )}
    </div>
  );
}
