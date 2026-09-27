'use client';

import React from 'react';
import {
  RotateCcw,
  Zap,
  ZapOff,
  AlertCircle,
  FolderOpen,
  Play,
  Pause,
  Square,
  RefreshCw,
  HelpCircle,
  Video,
  Camera,
} from 'lucide-react';
import type { CreationMode, CameraPermissionState, RecordedClip } from '@caribbean/media';

export interface StudioViewfinderProps {
  mode: CreationMode;
  permissionState: CameraPermissionState;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  facingMode: 'user' | 'environment';
  torchSupported: boolean;
  torchEnabled: boolean;
  countdown: number | null;
  isRecording: boolean;
  isPaused: boolean;
  clips: RecordedClip[];
  totalDurationMs: number;
  maxDurationMs: number;
  onSwitchCamera: () => void;
  onToggleTorch: () => void;
  onStartCapture: () => void;
  onPauseCapture?: () => void;
  onResumeCapture?: () => void;
  onStopCapture?: () => void;
  onDeleteLastClip?: () => void;
  onOpenLibraryFallback: () => void;
  onRetryPermissions: () => void;
}

export default function StudioViewfinder({
  mode,
  permissionState,
  videoRef,
  facingMode,
  torchSupported,
  torchEnabled,
  countdown,
  isRecording,
  isPaused,
  clips,
  totalDurationMs,
  maxDurationMs,
  onSwitchCamera,
  onToggleTorch,
  onStartCapture,
  onPauseCapture,
  onResumeCapture,
  onStopCapture,
  onDeleteLastClip,
  onOpenLibraryFallback,
  onRetryPermissions,
}: StudioViewfinderProps) {
  const isVideoOrReel = mode === 'video' || mode === 'reel';
  const safeMaxDuration = Math.max(1, maxDurationMs);
  const progressPercent = Math.min(100, Math.max(0, (totalDurationMs / safeMaxDuration) * 100));

  // Compute multi-segment allocations for clips and active recording chunk
  const recordedDuration = clips.reduce((acc, c) => acc + (c.durationMs || 0), 0);
  const activeRecordingDuration = isRecording ? Math.max(0, totalDurationMs - recordedDuration) : 0;

  return (
    <div
      role="region"
      aria-label="Camera viewfinder"
      className="relative w-full h-full flex flex-col items-center justify-center bg-black overflow-hidden select-none"
    >
      {/* Segmented Top Progress Bar for Multi-Clip Video/Reel */}
      {isVideoOrReel && (
        <div
          role="progressbar"
          aria-valuenow={Math.round(progressPercent)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Recording duration progress"
          className="absolute top-3 left-4 right-4 z-30 flex items-center gap-1.5 h-2 bg-white/20 backdrop-blur-md rounded-full px-1 py-0.5 overflow-hidden border border-white/10"
        >
          {clips.length > 0 ? (
            <>
              {clips.map((clip, index) => {
                const clipPercent = (clip.durationMs / safeMaxDuration) * 100;
                return (
                  <div
                    key={clip.id || `clip-${index}`}
                    style={{ width: `${clipPercent}%` }}
                    className="h-full bg-brand-goldenHour rounded-full shadow-sm"
                  />
                );
              })}
              {activeRecordingDuration > 0 && (
                <div
                  style={{ width: `${(activeRecordingDuration / safeMaxDuration) * 100}%` }}
                  className="h-full bg-rose-500 animate-pulse rounded-full shadow-sm"
                />
              )}
            </>
          ) : (
            <div
              className={`h-full transition-all duration-150 rounded-full shadow-sm ${
                isRecording ? 'bg-rose-500 animate-pulse' : 'bg-brand-goldenHour'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          )}
        </div>
      )}

      {/* Camera Live Stream Viewport or Permission Recovery UI */}
      {permissionState === 'GRANTED' ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          aria-label="Live camera feed"
          className={`w-full h-full object-cover transition-transform duration-300 ${
            facingMode === 'user' ? 'scale-x-[-1]' : ''
          }`}
        />
      ) : (
        <div className="flex flex-col items-center justify-center p-6 text-center max-w-md z-20 mx-4 bg-islandVibes-surfaceCard border border-white/10 rounded-2xl backdrop-blur-md shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-brand-goldenHour/15 border border-brand-goldenHour/30 flex items-center justify-center mb-4">
            {permissionState === 'REQUESTING' ? (
              <RefreshCw className="w-8 h-8 text-brand-goldenHour animate-spin" />
            ) : (
              <AlertCircle className="w-8 h-8 text-brand-goldenHour" />
            )}
          </div>

          <h3 className="text-white font-bold text-lg mb-2">
            {permissionState === 'DENIED' || permissionState === 'BLOCKED'
              ? 'Camera Access Blocked'
              : permissionState === 'REQUESTING'
                ? 'Requesting Camera Access'
                : 'Camera Access Required'}
          </h3>

          <p className="text-white/70 text-xs leading-relaxed mb-4">
            {permissionState === 'DENIED' || permissionState === 'BLOCKED'
              ? 'Permission was denied. Follow the steps below to re-enable camera access in your browser.'
              : permissionState === 'REQUESTING'
                ? 'Please tap Allow in the browser prompt to activate your camera and microphone.'
                : 'Allow camera and microphone access to record reels, capture photos, and produce videos.'}
          </p>

          {/* Step-by-step guidance for permission recovery */}
          <div className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-left mb-5">
            <div className="flex items-center gap-1.5 text-brand-goldenHour text-xs font-semibold mb-2">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>How to enable camera:</span>
            </div>
            <ol className="text-[11px] text-white/60 space-y-1 list-decimal list-inside">
              <li>Click the lock or camera icon in your address bar</li>
              <li>Toggle Camera & Microphone permissions to <strong className="text-white/80">Allow</strong></li>
              <li>Click "Try Again" below to resume capture</li>
            </ol>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onRetryPermissions}
              aria-label="Try again to request camera permissions"
              className="min-h-[44px] min-w-[44px] px-5 py-2.5 bg-brand-goldenHour text-black font-semibold text-xs rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-md flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
            <button
              type="button"
              onClick={onOpenLibraryFallback}
              aria-label="Choose file from device instead"
              className="min-h-[44px] min-w-[44px] px-5 py-2.5 bg-white/10 text-white font-medium text-xs rounded-xl hover:bg-white/20 active:scale-95 transition-all border border-white/15 flex items-center gap-2"
            >
              <FolderOpen className="w-4 h-4" />
              Choose File
            </button>
          </div>
        </div>
      )}

      {/* Countdown Visual Overlay */}
      {countdown !== null && (
        <div
          role="alert"
          aria-live="assertive"
          aria-label={`Recording starts in ${countdown} seconds`}
          className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in"
        >
          <span className="text-8xl font-black text-brand-goldenHour drop-shadow-xl animate-ping scale-110">
            {countdown}
          </span>
          <span className="text-white/80 font-medium text-xs mt-6 tracking-widest uppercase">
            Get Ready
          </span>
        </div>
      )}

      {/* Viewfinder Top-Right Utility Controls */}
      {permissionState === 'GRANTED' && (
        <div className="absolute top-8 right-4 z-20 flex flex-col gap-3">
          <button
            type="button"
            onClick={onSwitchCamera}
            aria-label="Flip camera"
            className="min-w-[44px] min-h-[44px] w-11 h-11 rounded-full bg-black/50 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-black/70 active:scale-90 transition-all shadow-lg"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          {torchSupported && (
            <button
              type="button"
              onClick={onToggleTorch}
              aria-label="Toggle flashlight"
              className={`min-w-[44px] min-h-[44px] w-11 h-11 rounded-full backdrop-blur-md border flex items-center justify-center transition-all active:scale-90 shadow-lg ${
                torchEnabled
                  ? 'bg-amber-400 text-black border-amber-300 ring-2 ring-amber-400/50'
                  : 'bg-black/50 text-white border-white/20 hover:bg-black/70'
              }`}
            >
              {torchEnabled ? <Zap className="w-5 h-5 fill-current" /> : <ZapOff className="w-5 h-5" />}
            </button>
          )}
        </div>
      )}

      {/* Viewfinder Bottom Capture Controls Bar */}
      {permissionState === 'GRANTED' && (
        <div className="absolute bottom-6 left-0 right-0 z-20 flex items-center justify-around px-8">
          {/* Discard last clip button if multi-clip exists, otherwise file picker fallback */}
          {isVideoOrReel && clips.length > 0 && onDeleteLastClip ? (
            <button
              type="button"
              onClick={onDeleteLastClip}
              aria-label="Delete last clip take"
              className="min-h-[44px] min-w-[44px] text-white/90 hover:text-rose-400 text-xs font-semibold px-4 py-2 rounded-xl bg-black/50 border border-white/20 backdrop-blur-md transition-all active:scale-95 shadow-md flex items-center gap-1.5"
            >
              <span>Undo Take</span>
              <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[10px] font-bold">
                {clips.length}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenLibraryFallback}
              aria-label="Upload file from device"
              className="min-w-[44px] min-h-[44px] w-11 h-11 rounded-full bg-black/50 border border-white/20 flex items-center justify-center text-white/80 hover:text-white active:scale-90 transition-all backdrop-blur-md shadow-md"
            >
              <FolderOpen className="w-5 h-5" />
            </button>
          )}

          {/* Shutter / Record Trigger Controls */}
          {!isVideoOrReel ? (
            <button
              type="button"
              onClick={onStartCapture}
              aria-label="Capture photo"
              className="min-w-[44px] min-h-[44px] w-[72px] h-[72px] rounded-full border-4 border-white flex items-center justify-center p-1 active:scale-90 transition-transform shadow-2xl"
            >
              <div className="w-full h-full rounded-full bg-white hover:bg-amber-100 transition-colors" />
            </button>
          ) : !isRecording ? (
            <button
              type="button"
              onClick={onStartCapture}
              aria-label="Start recording video"
              className="min-w-[44px] min-h-[44px] w-[72px] h-[72px] rounded-full border-4 border-rose-500 flex items-center justify-center p-1 active:scale-90 transition-transform shadow-2xl"
            >
              <div className="w-full h-full rounded-full bg-rose-500 hover:bg-rose-400 transition-colors" />
            </button>
          ) : (
            <div className="flex items-center gap-4">
              {isPaused && onResumeCapture ? (
                <button
                  type="button"
                  onClick={onResumeCapture}
                  aria-label="Resume recording"
                  className="min-w-[44px] min-h-[44px] w-14 h-14 rounded-full bg-amber-500 hover:bg-amber-400 text-black flex items-center justify-center active:scale-90 transition-transform shadow-xl"
                >
                  <Play className="w-6 h-6 fill-current" />
                </button>
              ) : onPauseCapture ? (
                <button
                  type="button"
                  onClick={onPauseCapture}
                  aria-label="Pause recording"
                  className="min-w-[44px] min-h-[44px] w-14 h-14 rounded-full bg-amber-500/90 hover:bg-amber-400 text-black flex items-center justify-center active:scale-90 transition-transform shadow-xl"
                >
                  <Pause className="w-6 h-6 fill-current" />
                </button>
              ) : null}

              {onStopCapture && (
                <button
                  type="button"
                  onClick={onStopCapture}
                  aria-label="Stop clip recording"
                  className="min-w-[44px] min-h-[44px] w-16 h-16 rounded-full border-4 border-rose-500 flex items-center justify-center bg-rose-600 hover:bg-rose-500 text-white active:scale-90 transition-transform shadow-xl"
                >
                  <Square className="w-6 h-6 fill-current" />
                </button>
              )}
            </div>
          )}

          {/* Spacer to keep shutter centered when 3-column layout is used */}
          <div className="min-w-[44px] w-11" aria-hidden="true" />
        </div>
      )}
    </div>
  );
}
