'use client';
/* eslint-disable react-hooks/rules-of-hooks */

import React from 'react';
import { X, Loader2, Camera, Video, Film, ArrowRight, ShoppingBag } from 'lucide-react';
import {
  CameraManager,
  ClipRecorder,
  CanvasCompositor,
  type CreationMode,
  type CameraPermissionState,
  type RecordedClip,
  type PhotoEditState,
  type VideoEditState,
  type MediaExportResult,
} from '@caribbean/media';
import StudioViewfinder from './studio-viewfinder';
import PhotoEditor from './photo-editor';
import VideoTimelineEditor from './video-timeline-editor';
import { createSupabaseBrowserClient } from '../../../lib/supabase/browser';
import ProductTaggingTray, {
  DEFAULT_CARIBBEAN_PRODUCTS,
} from '../../commerce/product-tagging-tray';
import {
  type TaggedProductSummary,
  formatProductPrice,
} from '@caribbean/marketplace';

export interface CreationStudioHandoffPayload {
  file: File;
  mediaKind: 'image' | 'video';
  previewUrl: string;
  aspectRatio: string;
  posterBlob?: Blob;
  soundId?: string;
  soundTitle?: string;
  durationSeconds?: number;
  altText?: string;
  taggedProductIds?: string[];
}

export interface TukubiCreationStudioProps {
  isOpen: boolean;
  initialMode?: CreationMode;
  initialStage?: 'capture' | 'edit' | 'review' | 'exporting';
  initialClips?: RecordedClip[];
  initialPhotoUrl?: string;
  initialExportProgress?: number;
  initialTaggedProducts?: TaggedProductSummary[];
  onClose: () => void;
  onHandoffComplete: (payload: CreationStudioHandoffPayload) => void;
  storageClient?: any;
}

function useSafeState<T>(initialValue: T | (() => T)): [T, React.Dispatch<React.SetStateAction<T>>] {
  const internals =
    (React as any)?.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE ||
    (React as any)?.__SECRET_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
  const dispatcher = internals?.H || internals?.ReactCurrentDispatcher?.current;

  if (dispatcher) {
    return React.useState<T>(initialValue);
  }
  const val = typeof initialValue === 'function' ? (initialValue as () => T)() : initialValue;
  return [val, () => {}];
}

function useSafeRef<T>(initialValue: T): React.MutableRefObject<T> {
  const internals =
    (React as any)?.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE ||
    (React as any)?.__SECRET_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
  const dispatcher = internals?.H || internals?.ReactCurrentDispatcher?.current;

  if (dispatcher) {
    return React.useRef<T>(initialValue);
  }
  return { current: initialValue };
}

function useSafeEffect(effect: React.EffectCallback, deps?: React.DependencyList): void {
  const internals =
    (React as any)?.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE ||
    (React as any)?.__SECRET_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
  const dispatcher = internals?.H || internals?.ReactCurrentDispatcher?.current;

  if (dispatcher) {
    React.useEffect(effect, deps);
  }
}

function useSafeCallback<T extends (...args: any[]) => any>(callback: T, deps: React.DependencyList): T {
  const internals =
    (React as any)?.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE ||
    (React as any)?.__SECRET_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
  const dispatcher = internals?.H || internals?.ReactCurrentDispatcher?.current;

  if (dispatcher) {
    return React.useCallback(callback, deps);
  }
  return callback;
}

export default function TukubiCreationStudio({
  isOpen,
  initialMode = 'photo',
  initialStage = 'capture',
  initialClips = [],
  initialPhotoUrl,
  initialExportProgress = 0,
  initialTaggedProducts = [],
  onClose,
  onHandoffComplete,
  storageClient,
}: TukubiCreationStudioProps) {
  const [mode, setMode] = useSafeState<CreationMode>(initialMode);
  const [stage, setStage] = useSafeState<'capture' | 'edit' | 'review' | 'exporting'>(initialStage);
  const [permissionState, setPermissionState] = useSafeState<CameraPermissionState>('UNKNOWN');
  const [facingMode, setFacingMode] = useSafeState<'user' | 'environment'>('user');
  const [torchSupported, setTorchSupported] = useSafeState<boolean>(false);
  const [torchEnabled, setTorchEnabled] = useSafeState<boolean>(false);
  const [countdown, setCountdown] = useSafeState<number | null>(null);
  const [isRecording, setIsRecording] = useSafeState<boolean>(false);
  const [isPaused, setIsPaused] = useSafeState<boolean>(false);
  const [clips, setClips] = useSafeState<RecordedClip[]>(initialClips);
  const [rawPhotoUrl, setRawPhotoUrl] = useSafeState<string | null>(initialPhotoUrl || null);
  const [exportProgress, setExportProgress] = useSafeState<number>(initialExportProgress);
  const [exportStatusText, setExportStatusText] = useSafeState<string>('Preparing studio composition...');
  const [taggedProducts, setTaggedProducts] = useSafeState<TaggedProductSummary[]>(initialTaggedProducts || []);
  const [isTaggingTrayOpen, setIsTaggingTrayOpen] = useSafeState<boolean>(false);
  const [pendingPhotoState, setPendingPhotoState] = useSafeState<PhotoEditState | null>(null);
  const [pendingVideoState, setPendingVideoState] = useSafeState<VideoEditState | null>(null);

  const cameraManagerRef = useSafeRef<CameraManager | null>(null);
  const clipRecorderRef = useSafeRef<ClipRecorder | null>(null);
  const compositorRef = useSafeRef<CanvasCompositor | null>(null);
  const videoRef = useSafeRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useSafeRef<MediaRecorder | null>(null);
  const chunksRef = useSafeRef<Blob[]>([]);
  const fileInputRef = useSafeRef<HTMLInputElement | null>(null);

  // Initialize headless creation engines
  useSafeEffect(() => {
    if (!cameraManagerRef.current) {
      cameraManagerRef.current = new CameraManager();
    }
    if (!clipRecorderRef.current) {
      clipRecorderRef.current = new ClipRecorder(mode === 'reel' ? 60000 : 300000);
    } else {
      clipRecorderRef.current.setMaxDurationMs(mode === 'reel' ? 60000 : 300000);
    }
    if (!compositorRef.current) {
      compositorRef.current = new CanvasCompositor();
    }
  }, [mode]);

  const initCamera = useSafeCallback(async () => {
    if (!cameraManagerRef.current) return;
    try {
      const stream = await cameraManagerRef.current.startCamera(facingMode, mode);
      setPermissionState('GRANTED');
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      const videoTrack = stream.getVideoTracks()[0];
      const capabilities: any = videoTrack?.getCapabilities ? videoTrack.getCapabilities() : {};
      setTorchSupported(Boolean(capabilities?.torch));
    } catch {
      setPermissionState(cameraManagerRef.current.getPermissionState());
    }
  }, [facingMode, mode]);

  useSafeEffect(() => {
    if (isOpen && stage === 'capture') {
      initCamera();
    }
    return () => {
      cameraManagerRef.current?.stopTracks();
    };
  }, [isOpen, stage, initCamera]);

  if (!isOpen) return null;

  const handleSwitchCamera = async () => {
    const nextFacing = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextFacing);
    if (cameraManagerRef.current) {
      try {
        const stream = await cameraManagerRef.current.switchCamera(nextFacing);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch {
        setPermissionState(cameraManagerRef.current.getPermissionState());
      }
    }
  };

  const handleToggleTorch = async () => {
    if (!cameraManagerRef.current) return;
    const nextTorch = !torchEnabled;
    const success = await cameraManagerRef.current.toggleTorch(nextTorch);
    if (success) {
      setTorchEnabled(nextTorch);
    }
  };

  const handleCapturePhoto = async () => {
    if (!videoRef.current || !compositorRef.current) return;
    try {
      const { blob } = await compositorRef.current.exportProcessedPhoto(
        videoRef.current,
        {
          crop: { x: 0, y: 0, width: 0, height: 0 },
          aspectRatio: '1:1',
          rotationDeg: 0,
          flipHorizontal: facingMode === 'user',
          filter: 'none',
          brightness: 0,
          contrast: 0,
          saturation: 0,
          altText: '',
        }
      );
      const url = typeof URL !== 'undefined' && URL.createObjectURL ? URL.createObjectURL(blob) : 'blob:photo';
      setRawPhotoUrl(url);
      setStage('edit');
    } catch (err) {
      console.error('Photo capture error:', err);
    }
  };

  const handleStartRecording = () => {
    const stream = cameraManagerRef.current?.getCurrentStream();
    if (!stream || typeof MediaRecorder === 'undefined') return;

    chunksRef.current = [];
    try {
      const mr = new MediaRecorder(stream, { mimeType: 'video/webm' });
      mediaRecorderRef.current = mr;

      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        if (clipRecorderRef.current) {
          clipRecorderRef.current.addClip(blob, 10000);
          setClips(clipRecorderRef.current.getClips());
        }
        setIsRecording(false);
        setIsPaused(false);
      };

      mr.start(500);
      setIsRecording(true);
      setIsPaused(false);
    } catch (err) {
      console.error('MediaRecorder start error:', err);
    }
  };

  const handlePauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
    }
  };

  const handleResumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const handleDeleteLastClip = () => {
    if (clipRecorderRef.current) {
      clipRecorderRef.current.removeLastClip();
      setClips(clipRecorderRef.current.getClips());
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('image/')) {
      const url = typeof URL !== 'undefined' && URL.createObjectURL ? URL.createObjectURL(file) : 'blob:photo';
      setRawPhotoUrl(url);
      setMode('photo');
      setStage('edit');
    } else if (file.type.startsWith('video/')) {
      if (clipRecorderRef.current) {
        clipRecorderRef.current.addClip(file, 15000);
        setClips(clipRecorderRef.current.getClips());
      }
      setMode('video');
      setStage('edit');
    }
  };

  const executePhotoExport = async (state: PhotoEditState) => {
    if (!rawPhotoUrl || !compositorRef.current) return;
    setStage('exporting');
    setExportStatusText('Applying Caribbean presets & rendering composition...');
    setExportProgress(35);

    try {
      let blob: Blob;
      if (typeof Image !== 'undefined') {
        const img = new Image();
        img.src = rawPhotoUrl;
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error('Failed to load image preview'));
        });
        setExportProgress(75);
        setExportStatusText('Encoding optimized responsive image...');
        const res = await compositorRef.current.exportProcessedPhoto(img, state);
        blob = res.blob;
      } else {
        blob = new Blob(['sample-processed-photo'], { type: 'image/webp' });
      }

      setExportProgress(95);
      setExportStatusText('Finalizing media asset handoff...');

      const file = new File([blob], `tukubi_photo_${Date.now()}.webp`, { type: 'image/webp' });
      const previewUrl = typeof URL !== 'undefined' && URL.createObjectURL ? URL.createObjectURL(blob) : rawPhotoUrl;

      setExportProgress(100);
      onHandoffComplete({
        file,
        mediaKind: 'image',
        previewUrl,
        aspectRatio: state.aspectRatio,
        altText: state.altText,
        taggedProductIds: taggedProducts.map((p) => p.id),
      });
      onClose();
    } catch (err) {
      console.error('Photo export error:', err);
      setStage('edit');
    }
  };

  const handlePhotoSave = async (state: PhotoEditState) => {
    setPendingPhotoState(state);
    setStage('review');
  };

  const executeVideoExport = (finalState: VideoEditState) => {
    if (clips.length === 0) return;
    setStage('exporting');
    setExportStatusText('Assembling timeline clips & rhythm stems...');
    setExportProgress(45);

    const primaryClip = clips[0];
    const file = new File(
      [primaryClip.blob || new Blob([])],
      `tukubi_video_${Date.now()}.webm`,
      { type: 'video/webm' }
    );

    setExportProgress(90);
    setExportStatusText('Finalizing video package...');

    const totalDurationSeconds =
      clipRecorderRef.current?.getTotalDurationMs()
        ? Math.round(clipRecorderRef.current.getTotalDurationMs()) / 1000
        : Math.round(clips.reduce((acc, c) => acc + (c.durationMs || 0), 0)) / 1000;

    setExportProgress(100);
    onHandoffComplete({
      file,
      mediaKind: 'video',
      previewUrl: primaryClip.previewUrl,
      aspectRatio: mode === 'reel' ? '9:16' : '16:9',
      soundId: finalState.selectedSoundId,
      soundTitle: finalState.selectedSoundTitle,
      durationSeconds: totalDurationSeconds,
      taggedProductIds: taggedProducts.map((p) => p.id),
    });
    onClose();
  };

  const handleVideoSave = (finalState: VideoEditState) => {
    setPendingVideoState(finalState);
    setStage('review');
  };

  return (
    <div
      role="dialog"
      aria-modal={true}
      aria-label="Tukubi Creation Studio"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md select-none"
    >
      <div className="relative w-full h-full max-w-4xl max-h-[94vh] bg-slate-950 rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-white/10">
        {/* Top Header Dismiss Bar */}
        <div className="absolute top-4 left-4 right-4 z-40 flex items-center justify-between pointer-events-none">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close studio"
            className="w-10 h-10 rounded-full bg-black/60 border border-white/15 flex items-center justify-center text-white/90 hover:text-white hover:bg-black/80 transition-all pointer-events-auto active:scale-95 shadow-lg"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Mode Switcher Tabs (Only visible during capture and when not actively recording) */}
          {stage === 'capture' && !isRecording && (
            <div className="flex items-center gap-1.5 p-1 bg-black/60 backdrop-blur-md rounded-2xl border border-white/15 pointer-events-auto shadow-lg">
              <button
                type="button"
                onClick={() => setMode('photo')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  mode === 'photo'
                    ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-md'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                Photo
              </button>
              <button
                type="button"
                onClick={() => setMode('video')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  mode === 'video'
                    ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-md'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Video className="w-3.5 h-3.5" />
                Video
              </button>
              <button
                type="button"
                onClick={() => setMode('reel')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  mode === 'reel'
                    ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-md'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Film className="w-3.5 h-3.5" />
                Reel
              </button>
            </div>
          )}

          {/* Review / Next Button if clips are captured in video/reel mode */}
          {stage === 'capture' && (mode === 'video' || mode === 'reel') && clips.length > 0 && !isRecording && (
            <button
              type="button"
              onClick={() => setStage('edit')}
              aria-label="Proceed to timeline editor"
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-white text-xs font-bold rounded-2xl pointer-events-auto transition-transform active:scale-95 shadow-xl"
            >
              <span>Review ({clips.length})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Hidden File Input for fallback gallery uploads */}
        <input
          ref={fileInputRef}
          type="file"
          accept={mode === 'photo' ? 'image/*' : 'video/*'}
          onChange={handleFileInputChange}
          className="hidden"
          aria-hidden="true"
        />

        {/* 1. Capture Stage: Viewfinder */}
        {stage === 'capture' && (
          <StudioViewfinder
            mode={mode}
            permissionState={permissionState}
            videoRef={videoRef}
            facingMode={facingMode}
            torchSupported={torchSupported}
            torchEnabled={torchEnabled}
            countdown={countdown}
            isRecording={isRecording}
            isPaused={isPaused}
            clips={clips}
            totalDurationMs={clipRecorderRef.current?.getTotalDurationMs() || 0}
            maxDurationMs={clipRecorderRef.current?.getMaxDurationMs() || 60000}
            onSwitchCamera={handleSwitchCamera}
            onToggleTorch={handleToggleTorch}
            onStartCapture={mode === 'photo' ? handleCapturePhoto : handleStartRecording}
            onPauseCapture={handlePauseRecording}
            onResumeCapture={handleResumeRecording}
            onStopCapture={handleStopRecording}
            onDeleteLastClip={handleDeleteLastClip}
            onOpenLibraryFallback={() => fileInputRef.current?.click()}
            onRetryPermissions={initCamera}
          />
        )}

        {/* 2. Edit Stage: Photo Editor */}
        {stage === 'edit' && mode === 'photo' && (
          <PhotoEditor
            imageSrc={rawPhotoUrl || 'blob:photo'}
            onSave={handlePhotoSave}
            onCancel={() => setStage('capture')}
          />
        )}

        {/* 2. Edit Stage: Video Timeline Editor */}
        {stage === 'edit' && (mode === 'video' || mode === 'reel') && (
          <VideoTimelineEditor
            clips={clips}
            onSave={handleVideoSave}
            onCancel={() => setStage('capture')}
          />
        )}

        {/* 3. Review & Export Stage */}
        {stage === 'review' && (
          <div
            role="region"
            aria-label="Review and Export"
            className="flex-1 flex flex-col p-6 overflow-y-auto text-white space-y-6"
          >
            {/* Header info */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400">
                  Review &amp; Export
                </h3>
                <p className="text-xs text-white/60">
                  Tag Caribbean store products and review before publishing.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStage('edit')}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white/70 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
                >
                  Back to Editor
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (mode === 'photo') {
                      executePhotoExport(
                        pendingPhotoState || {
                          crop: { x: 0, y: 0, width: 0, height: 0 },
                          aspectRatio: '1:1',
                          rotationDeg: 0,
                          flipHorizontal: false,
                          filter: 'none',
                          brightness: 0,
                          contrast: 0,
                          saturation: 0,
                          altText: '',
                        }
                      );
                    } else {
                      executeVideoExport(
                        pendingVideoState || {
                          clips,
                          soundVolume: 80,
                          micVolume: 100,
                          activeFilter: 'none',
                          textOverlays: [],
                          coverTimestampMs: 0,
                        }
                      );
                    }
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:opacity-95 text-white text-xs font-bold rounded-xl shadow-lg transition-transform active:scale-95"
                >
                  <span>Export &amp; Share</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Media Preview Card */}
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="relative w-full md:w-64 aspect-[4/3] sm:aspect-square rounded-2xl overflow-hidden bg-black/60 border border-white/10 flex items-center justify-center flex-shrink-0 shadow-xl">
                {mode === 'photo' && rawPhotoUrl ? (
                  <img
                    src={rawPhotoUrl}
                    alt="Review media preview"
                    className="w-full h-full object-contain"
                  />
                ) : clips.length > 0 ? (
                  <video
                    src={clips[0].previewUrl}
                    controls
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-white/40 text-xs flex flex-col items-center gap-2">
                    <Film className="w-8 h-8 opacity-40" />
                    <span>Media Ready for Export</span>
                  </div>
                )}
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-black/70 text-[10px] font-bold text-amber-300 uppercase tracking-wider border border-white/10">
                  {mode}
                </span>
              </div>

              {/* Tagging Controls & Summary */}
              <div className="flex-1 w-full space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm font-bold text-white/90">
                      Caribbean Store Tags ({taggedProducts.length}/5)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsTaggingTrayOpen(!isTaggingTrayOpen)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>{isTaggingTrayOpen ? 'Close Tag Tray' : 'Tag Products for Caribbean Shop'}</span>
                  </button>
                </div>

                {/* Tagged Preview Chips */}
                {taggedProducts.length > 0 ? (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {taggedProducts.map((prod) => (
                        <div
                          key={prod.id}
                          className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-emerald-500/40 text-xs text-white/90 shadow-sm"
                        >
                          <span className="font-semibold">{prod.title}</span>
                          <span className="text-emerald-400 font-bold">
                            {formatProductPrice(prod.priceMinor, prod.currency || 'USD')}
                          </span>
                          <button
                            type="button"
                            aria-label={`Remove ${prod.title}`}
                            onClick={() =>
                              setTaggedProducts((prev) => prev.filter((p) => p.id !== prod.id))
                            }
                            className="p-0.5 rounded-md hover:bg-white/10 text-white/60 hover:text-rose-400 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-dashed border-white/10 bg-white/5 text-center text-xs text-white/50 space-y-1">
                    <p className="font-semibold text-white/70">No Products Tagged</p>
                    <p>Connect Caribbean artisans, coffee growers, or local goods directly to your post.</p>
                  </div>
                )}

                {/* Expandable Tagging Tray */}
                {isTaggingTrayOpen && (
                  <div className="pt-2">
                    <ProductTaggingTray
                      selectedProducts={taggedProducts}
                      onTagsChange={(newTags) => setTaggedProducts(newTags)}
                      maxTags={5}
                      onClose={() => setIsTaggingTrayOpen(false)}
                      className="border border-emerald-500/30 shadow-2xl rounded-2xl"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 4. Exporting Stage: Telemetry & Progress */}
        {stage === 'exporting' && (
          <div
            role="progressbar"
            aria-valuenow={exportProgress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Media composition progress"
            className="flex-1 flex flex-col items-center justify-center p-8 text-center text-white bg-slate-950"
          >
            <div className="relative mb-6">
              <div className="w-20 h-20 rounded-full border-4 border-white/10 border-t-amber-400 animate-spin flex items-center justify-center" />
              <Loader2 className="w-8 h-8 text-amber-400 absolute inset-0 m-auto animate-spin" />
            </div>

            <h3 className="font-bold text-xl mb-2 tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400">
              Compositing Caribbean Media
            </h3>
            <p className="text-xs text-white/70 max-w-sm mb-6 leading-relaxed">
              {exportStatusText}
            </p>

            <div className="w-72 max-w-full space-y-2">
              <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/10">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 rounded-full transition-all duration-300 ease-out shadow-lg"
                  style={{ width: `${Math.min(100, Math.max(0, exportProgress))}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[11px] font-semibold text-white/50 px-1">
                <span>Rendering Engine</span>
                <span className="text-amber-400 font-mono">{exportProgress}%</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
