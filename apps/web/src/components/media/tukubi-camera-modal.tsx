'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Camera,
  Video,
  Film,
  X,
  RotateCcw,
  Check,
  StopCircle,
  AlertCircle,
  FolderOpen,
  Sparkles,
  Loader2,
  Zap,
  ZapOff,
  Pause,
  Play,
  Music,
  Mic,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { CARIBBEAN_SOUNDS, type CaribbeanSound } from '../../lib/constants/caribbean-sounds';

export type StudioCaptureMode = 'photo' | 'video' | 'reel';

export interface TukubiCameraModalProps {
  isOpen: boolean;
  initialMode?: StudioCaptureMode;
  mode?: StudioCaptureMode;
  onClose: () => void;
  onCaptureComplete: (file: File, type: 'image' | 'video', meta?: { coverBlob?: Blob; soundId?: string; soundTitle?: string; durationSeconds?: number }) => void;
  onFallbackToFilePicker?: (mode: StudioCaptureMode) => void;
  initialSoundId?: string;
}

interface DeviceOption {
  deviceId: string;
  label: string;
}

export default function TukubiCameraModal({
  isOpen,
  initialMode,
  mode,
  onClose,
  onCaptureComplete,
  onFallbackToFilePicker,
  initialSoundId,
}: TukubiCameraModalProps) {
  const effectiveInitialMode = initialMode || mode || 'photo';
  const [activeMode, setActiveMode] = useState<StudioCaptureMode>(effectiveInitialMode);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  // Devices
  const [videoDevices, setVideoDevices] = useState<DeviceOption[]>([]);
  const [audioDevices, setAudioDevices] = useState<DeviceOption[]>([]);
  const [selectedVideoDeviceId, setSelectedVideoDeviceId] = useState<string>('');
  const [selectedAudioDeviceId, setSelectedAudioDeviceId] = useState<string>('');
  const [showDeviceSettings, setShowDeviceSettings] = useState(false);

  // Torch / Flash
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);

  // Recording
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);

  // Sound selection for Reels
  const [selectedSound, setSelectedSound] = useState<CaribbeanSound | null>(null);
  const [showSoundPicker, setShowSoundPicker] = useState(false);
  const [soundSearch, setSoundSearch] = useState('');
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

  // Captured output preview
  const [capturedBlob, setCapturedBlob] = useState<{
    blob: Blob;
    type: 'image' | 'video';
    previewUrl: string;
  } | null>(null);

  // Refs
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);

  // Sync initial sound
  useEffect(() => {
    if (initialSoundId) {
      const found = CARIBBEAN_SOUNDS.find((s) => s.id === initialSoundId);
      if (found) setSelectedSound(found);
    }
  }, [initialSoundId]);

  // Sync mode when prop changes
  useEffect(() => {
    if (isOpen) {
      setActiveMode(effectiveInitialMode);
    }
  }, [isOpen, effectiveInitialMode]);

  const stopAllMedia = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (audioPreviewRef.current) {
      audioPreviewRef.current.pause();
    }
  }, []);

  // Enumerate cameras and microphones
  const refreshDevices = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) return;
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const vList = devices
        .filter((d) => d.kind === 'videoinput')
        .map((d, i) => ({ deviceId: d.deviceId, label: d.label || `Camera ${i + 1}` }));
      const aList = devices
        .filter((d) => d.kind === 'audioinput')
        .map((d, i) => ({ deviceId: d.deviceId, label: d.label || `Microphone ${i + 1}` }));

      setVideoDevices(vList);
      setAudioDevices(aList);
    } catch {
      // Ignore enumeration issues
    }
  }, []);

  // Initialize camera stream
  useEffect(() => {
    if (!isOpen) {
      stopAllMedia();
      setCapturedBlob(null);
      setPermissionError(null);
      setIsRecording(false);
      setIsPaused(false);
      setRecordSeconds(0);
      setTorchEnabled(false);
      setTorchSupported(false);
      return;
    }

    let isCancelled = false;

    async function initCamera() {
      setIsInitializing(true);
      setPermissionError(null);
      stopAllMedia();

      if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setPermissionError('Camera is not supported in this browser environment. Please upload media directly.');
        setIsInitializing(false);
        return;
      }

      try {
        const isVideoMode = activeMode === 'video' || activeMode === 'reel';
        const isReel = activeMode === 'reel';

        const videoConstraints: MediaTrackConstraints = {
          facingMode: selectedVideoDeviceId ? undefined : facingMode,
          deviceId: selectedVideoDeviceId ? { exact: selectedVideoDeviceId } : undefined,
          width: isReel ? { ideal: 720 } : { ideal: 1280 },
          height: isReel ? { ideal: 1280 } : { ideal: 720 },
        };

        const audioConstraints: boolean | MediaTrackConstraints = isVideoMode
          ? selectedAudioDeviceId
            ? { deviceId: { exact: selectedAudioDeviceId } }
            : true
          : false;

        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: audioConstraints,
        });

        if (isCancelled) {
          mediaStream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = mediaStream;

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().catch(() => {});
        }

        // Check Torch capability
        const videoTrack = mediaStream.getVideoTracks()[0];
        if (videoTrack && typeof videoTrack.getCapabilities === 'function') {
          const capabilities = videoTrack.getCapabilities() as any;
          setTorchSupported(Boolean(capabilities?.torch));
        } else {
          setTorchSupported(false);
        }

        await refreshDevices();
      } catch (err: unknown) {
        if (isCancelled) return;
        const error = err as Error;
        console.warn('[TukubiCameraModal] Camera error:', error);

        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          setPermissionError(
            'Camera access is blocked. Please enable camera and microphone permissions in your browser or device settings.'
          );
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
          setPermissionError('No camera or microphone was found on this device.');
        } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
          setPermissionError('Camera is in use by another application or tab. Please close other camera apps and retry.');
        } else {
          setPermissionError(`Camera unavailable: ${error.message || 'Please check device permissions.'}`);
        }
      } finally {
        if (!isCancelled) {
          setIsInitializing(false);
        }
      }
    }

    initCamera();

    return () => {
      isCancelled = true;
      stopAllMedia();
    };
  }, [isOpen, activeMode, facingMode, selectedVideoDeviceId, selectedAudioDeviceId, stopAllMedia, refreshDevices]);

  // Torch Toggle
  async function toggleTorch() {
    if (!streamRef.current || !torchSupported) return;
    const videoTrack = streamRef.current.getVideoTracks()[0];
    if (!videoTrack) return;

    try {
      const nextTorch = !torchEnabled;
      await (videoTrack as any).applyConstraints({
        advanced: [{ torch: nextTorch }],
      });
      setTorchEnabled(nextTorch);
    } catch {
      // Ignored
    }
  }

  // Camera flip
  function toggleCameraFlip() {
    setSelectedVideoDeviceId('');
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  }

  // Photo snapshot capture
  function takePhotoSnapshot() {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const previewUrl = URL.createObjectURL(blob);
        setCapturedBlob({ blob, type: 'image', previewUrl });
      },
      'image/jpeg',
      0.92
    );
  }

  // Video recording
  function startVideoRecording() {
    if (!streamRef.current) return;
    recordedChunksRef.current = [];

    try {
      const mimeType = MediaRecorder.isTypeSupported('video/mp4')
        ? 'video/mp4'
        : MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : 'video/webm';

      const recorder = new MediaRecorder(streamRef.current, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const finalBlob = new Blob(recordedChunksRef.current, { type: mimeType });
        const previewUrl = URL.createObjectURL(finalBlob);
        setCapturedBlob({ blob: finalBlob, type: 'video', previewUrl });
        setIsRecording(false);
        setIsPaused(false);
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        if (audioPreviewRef.current) {
          audioPreviewRef.current.pause();
        }
      };

      recorder.start(200);
      setIsRecording(true);
      setIsPaused(false);
      setRecordSeconds(0);

      // Play synced sound if Reel mode
      if (activeMode === 'reel' && selectedSound?.audioUrl) {
        if (!audioPreviewRef.current) {
          audioPreviewRef.current = new Audio(selectedSound.audioUrl);
        } else {
          audioPreviewRef.current.src = selectedSound.audioUrl;
        }
        audioPreviewRef.current.currentTime = 0;
        audioPreviewRef.current.play().catch(() => {});
      }

      const maxLimit = activeMode === 'reel' ? 60 : 300;
      timerRef.current = setInterval(() => {
        setRecordSeconds((prev) => {
          if (prev >= maxLimit) {
            stopVideoRecording();
            return maxLimit;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error('[TukubiCameraModal] MediaRecorder error:', err);
      setPermissionError('Video recording is not supported in this format on your device.');
    }
  }

  function pauseVideoRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
      }
    }
  }

  function resumeVideoRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      const maxLimit = activeMode === 'reel' ? 60 : 300;
      timerRef.current = setInterval(() => {
        setRecordSeconds((prev) => {
          if (prev >= maxLimit) {
            stopVideoRecording();
            return maxLimit;
          }
          return prev + 1;
        });
      }, 1000);
      if (audioPreviewRef.current) {
        audioPreviewRef.current.play().catch(() => {});
      }
    }
  }

  function stopVideoRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }

  function handleRetake() {
    if (capturedBlob) {
      URL.revokeObjectURL(capturedBlob.previewUrl);
      setCapturedBlob(null);
    }
    setIsRecording(false);
    setIsPaused(false);
    setRecordSeconds(0);
  }

  // Confirm capture and generate cover frame if video
  async function handleConfirm() {
    if (!capturedBlob) return;
    const isVid = capturedBlob.type === 'video';
    const ext = isVid ? (capturedBlob.blob.type.includes('mp4') ? 'mp4' : 'webm') : 'jpg';
    const fileName = `tukubi_${activeMode}_${Date.now()}.${ext}`;
    const file = new File([capturedBlob.blob], fileName, { type: capturedBlob.blob.type });

    let coverBlob: Blob | undefined = undefined;

    if (isVid && previewVideoRef.current) {
      try {
        const vid = previewVideoRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = vid.videoWidth || 640;
        canvas.height = vid.videoHeight || 360;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);
          coverBlob = await new Promise<Blob | undefined>((resolve) =>
            canvas.toBlob((b) => resolve(b || undefined), 'image/jpeg', 0.85)
          );
        }
      } catch {
        // Fallback without cover
      }
    }

    onCaptureComplete(file, capturedBlob.type, {
      coverBlob,
      soundId: selectedSound?.id,
      soundTitle: selectedSound ? `${selectedSound.title} — ${selectedSound.artist}` : undefined,
      durationSeconds: isVid ? Math.max(1, recordSeconds) : undefined,
    });
    onClose();
  }

  if (!isOpen) return null;

  const filteredSounds = soundSearch.trim()
    ? CARIBBEAN_SOUNDS.filter(
        (s) =>
          s.title.toLowerCase().includes(soundSearch.toLowerCase()) ||
          s.artist.toLowerCase().includes(soundSearch.toLowerCase()) ||
          s.genre.toLowerCase().includes(soundSearch.toLowerCase())
      )
    : CARIBBEAN_SOUNDS;

  return (
    <div
      className="fixed inset-0 z-[80] bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-label="TUKUBI Native Camera &amp; Media Studio"
    >
      <div className="w-full max-w-2xl bg-brand-dusk border border-slate-700/80 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh] relative">
        {/* Top Header Controls Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-slate-800 bg-[#0A0F22]/90 z-20">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-sunriseCoral animate-pulse" />
            <span className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
              TUKUBI Studio Camera
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Torch Toggle if supported */}
            {torchSupported && !capturedBlob && (
              <button
                type="button"
                onClick={toggleTorch}
                aria-label={torchEnabled ? 'Turn off flash' : 'Turn on flash'}
                className={`p-2 rounded-full transition-colors ${
                  torchEnabled ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {torchEnabled ? <Zap className="w-4 h-4" /> : <ZapOff className="w-4 h-4" />}
              </button>
            )}

            {/* Device Settings (Webcam / Mic Picker) */}
            {(videoDevices.length > 1 || audioDevices.length > 1) && !capturedBlob && (
              <button
                type="button"
                onClick={() => setShowDeviceSettings(!showDeviceSettings)}
                aria-label="Device selection"
                className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                title="Select Camera &amp; Microphone"
              >
                <Mic className="w-4 h-4 text-brand-caribbeanSea" />
              </button>
            )}

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close studio camera"
              className="p-2 rounded-full text-brand-sandstone/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Device Settings Panel Dropdown */}
        {showDeviceSettings && !capturedBlob && (
          <div className="bg-[#0E152B] border-b border-slate-800 p-4 space-y-3 text-xs z-20 animate-fadeIn">
            <div className="flex items-center justify-between font-bold text-white mb-1">
              <span>Hardware Inputs</span>
              <button
                type="button"
                onClick={() => setShowDeviceSettings(false)}
                className="text-slate-400 hover:text-white"
              >
                Done
              </button>
            </div>
            {videoDevices.length > 1 && (
              <div>
                <label className="block text-slate-400 mb-1">Active Camera</label>
                <select
                  value={selectedVideoDeviceId}
                  onChange={(e) => setSelectedVideoDeviceId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white"
                >
                  <option value="">Default System Camera</option>
                  {videoDevices.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {audioDevices.length > 1 && (
              <div>
                <label className="block text-slate-400 mb-1">Active Microphone</label>
                <select
                  value={selectedAudioDeviceId}
                  onChange={(e) => setSelectedAudioDeviceId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white"
                >
                  <option value="">Default System Microphone</option>
                  {audioDevices.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* Viewfinder & Media Area */}
        <div className="relative bg-black flex items-center justify-center overflow-hidden min-h-[340px] sm:min-h-[420px] aspect-[4/3] sm:aspect-video flex-1">
          {permissionError ? (
            <div className="p-6 text-center space-y-4 max-w-md">
              <div className="w-14 h-14 rounded-3xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto text-amber-400">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-base font-black text-white">Camera Access Notice</h3>
              <p className="text-xs text-brand-sandstone/80 leading-relaxed">{permissionError}</p>

              {onFallbackToFilePicker && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onFallbackToFilePicker(activeMode);
                  }}
                  className="bg-brand-caribbeanSea hover:brightness-110 text-slate-950 font-black px-5 py-3 rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 mx-auto transition-all shadow-lg shadow-brand-caribbeanSea/20 cursor-pointer min-h-[44px]"
                >
                  <FolderOpen className="w-4 h-4" />
                  <span>Choose from Device Library</span>
                </button>
              )}
            </div>
          ) : isInitializing ? (
            <div className="flex flex-col items-center gap-3 text-brand-sandstone/70 text-xs">
              <Loader2 className="w-9 h-9 animate-spin text-brand-caribbeanSea" />
              <span className="font-bold">Activating Caribbean Studio Lens…</span>
            </div>
          ) : capturedBlob ? (
            /* Review Stage */
            capturedBlob.type === 'video' ? (
              <div className="w-full h-full flex flex-col items-center justify-center relative bg-black">
                <video
                  ref={previewVideoRef}
                  src={capturedBlob.previewUrl}
                  controls
                  autoPlay
                  loop
                  playsInline
                  className={`w-full h-full object-contain max-h-[65vh] ${
                    activeMode === 'reel' ? 'aspect-[9/16] max-w-[280px] rounded-2xl' : ''
                  }`}
                />
                {selectedSound && (
                  <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 text-xs text-rose-300 flex items-center gap-1.5">
                    <Music className="w-3.5 h-3.5 text-rose-400" />
                    <span>{selectedSound.title}</span>
                  </div>
                )}
              </div>
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={capturedBlob.previewUrl}
                alt="Captured snapshot preview"
                className="w-full h-full object-contain max-h-[65vh]"
              />
            )
          ) : (
            /* Live Camera Stream */
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full ${
                  activeMode === 'reel'
                    ? 'object-cover aspect-[9/16] max-w-[290px] rounded-3xl my-2 border-2 border-brand-goldenHour/50 shadow-2xl'
                    : 'object-cover'
                }`}
              />

              {/* Recording Indicator & Timer */}
              {isRecording && (
                <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
                  <div className="bg-red-600/90 text-white font-mono text-xs font-black px-3.5 py-1.5 rounded-full flex items-center gap-2 shadow-lg animate-pulse">
                    <span className="w-2.5 h-2.5 rounded-full bg-white" />
                    <span>
                      {String(Math.floor(recordSeconds / 60)).padStart(2, '0')}:
                      {String(recordSeconds % 60).padStart(2, '0')}
                    </span>
                  </div>
                  {isPaused && (
                    <span className="bg-amber-500 text-slate-950 font-black text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider">
                      PAUSED
                    </span>
                  )}
                </div>
              )}

              {/* Top Sound Badge for Reels */}
              {activeMode === 'reel' && !isRecording && (
                <button
                  type="button"
                  onClick={() => setShowSoundPicker(true)}
                  className="absolute top-4 left-4 z-10 bg-black/60 hover:bg-black/80 text-white text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-md border border-white/20 flex items-center gap-1.5 transition-colors"
                >
                  <Music className="w-3.5 h-3.5 text-rose-400" />
                  <span>{selectedSound ? selectedSound.title : 'Add Caribbean Sound'}</span>
                </button>
              )}

              {/* Flip camera button */}
              <button
                type="button"
                onClick={toggleCameraFlip}
                className="absolute top-4 right-4 z-10 bg-black/60 hover:bg-black/80 text-white p-2.5 rounded-full backdrop-blur-md border border-white/20 transition-all shadow-md active:scale-95"
                title="Switch Camera (Front/Rear)"
                aria-label="Switch Camera Front or Rear"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* Caribbean Sound Picker Modal for Reels */}
        {showSoundPicker && (
          <div className="absolute inset-0 z-30 bg-[#0B0F1F]/95 backdrop-blur-xl p-5 flex flex-col animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Music className="w-5 h-5 text-rose-400" />
                <h3 className="font-black text-sm text-white">Select Caribbean Sound / Stem</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSoundPicker(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="pt-3 pb-2">
              <input
                type="text"
                value={soundSearch}
                onChange={(e) => setSoundSearch(e.target.value)}
                placeholder="Search Soca, Dancehall, Reggae, Kompa..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-rose-400"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 mt-2">
              {filteredSounds.map((sound) => (
                <div
                  key={sound.id}
                  onClick={() => {
                    setSelectedSound(sound);
                    setShowSoundPicker(false);
                  }}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-rose-500/15 border border-white/10 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{sound.flag}</span>
                    <div>
                      <p className="text-xs font-black text-white">{sound.title}</p>
                      <p className="text-[10px] text-brand-sandstone/70">
                        {sound.artist} • {sound.genre}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    {sound.durationFormatted}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mode Selector Tabs (PHOTO | VIDEO | REEL) */}
        {!capturedBlob && !permissionError && (
          <div className="bg-[#0A0F22] border-t border-slate-800/80 px-4 py-2 flex items-center justify-center gap-3 text-xs font-black">
            {[
              { id: 'photo', label: 'PHOTO', icon: Camera },
              { id: 'video', label: 'VIDEO', icon: Video },
              { id: 'reel', label: 'REEL (9:16)', icon: Film },
            ].map((m) => {
              const Icon = m.icon;
              const isSelected = activeMode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  disabled={isRecording}
                  onClick={() => setActiveMode(m.id as StudioCaptureMode)}
                  className={`px-4 py-1.5 rounded-full transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40 ${
                    isSelected
                      ? 'bg-gradient-to-r from-brand-caribbeanSea to-brand-sunriseCoral text-slate-950 font-black shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Footer Shutter & Actions Bar */}
        <div className="p-4 bg-[#0A0F22] border-t border-slate-800 flex items-center justify-between gap-4">
          {capturedBlob ? (
            /* Review Actions */
            <>
              <button
                type="button"
                onClick={handleRetake}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-brand-sandstone text-xs font-bold border border-white/10 transition-colors min-h-[44px]"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Retake</span>
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-brand-caribbeanSea via-brand-sunriseCoral to-brand-goldenHour text-slate-950 text-xs sm:text-sm font-black shadow-xl hover:brightness-110 active:scale-95 transition-all min-h-[44px]"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Confirm &amp; Use {capturedBlob.type === 'video' ? 'Video' : 'Photo'}</span>
              </button>
            </>
          ) : permissionError ? (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 rounded-2xl bg-white/10 text-white text-xs font-bold hover:bg-white/20 transition-colors min-h-[44px]"
            >
              Cancel
            </button>
          ) : (
            /* Live Capture Controls */
            <>
              {/* Library Selection Button */}
              {onFallbackToFilePicker ? (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onFallbackToFilePicker(activeMode);
                  }}
                  disabled={isRecording}
                  className="text-xs text-slate-400 hover:text-brand-caribbeanSea flex items-center gap-1.5 font-bold transition-colors disabled:opacity-40 min-h-[44px]"
                  title="Upload from device storage"
                >
                  <FolderOpen className="w-4 h-4" />
                  <span className="hidden sm:inline">Library</span>
                </button>
              ) : (
                <div className="w-10" />
              )}

              {/* Shutter Button & Record Controls */}
              <div className="flex-1 flex items-center justify-center gap-4">
                {activeMode === 'photo' ? (
                  <button
                    type="button"
                    onClick={takePhotoSnapshot}
                    disabled={isInitializing || !streamRef.current}
                    className="w-16 h-16 rounded-full bg-gradient-to-tr from-brand-caribbeanSea via-brand-sunriseCoral to-brand-goldenHour p-1.5 shadow-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-40 cursor-pointer"
                    aria-label="Take Photo"
                  >
                    <div className="w-full h-full rounded-full border-2 border-slate-950 bg-white" />
                  </button>
                ) : isRecording ? (
                  <div className="flex items-center gap-3">
                    {/* Pause / Resume */}
                    {isPaused ? (
                      <button
                        type="button"
                        onClick={resumeVideoRecording}
                        className="w-11 h-11 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center transition-all"
                        aria-label="Resume Recording"
                      >
                        <Play className="w-5 h-5 fill-current" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={pauseVideoRecording}
                        className="w-11 h-11 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-all"
                        aria-label="Pause Recording"
                      >
                        <Pause className="w-5 h-5 fill-current" />
                      </button>
                    )}

                    {/* Stop Recording */}
                    <button
                      type="button"
                      onClick={stopVideoRecording}
                      className="flex items-center gap-2 px-6 py-3 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-black shadow-xl shadow-rose-600/30 animate-pulse transition-all"
                      aria-label="Stop Recording"
                    >
                      <StopCircle className="w-5 h-5" />
                      <span>Stop</span>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={startVideoRecording}
                    disabled={isInitializing || !streamRef.current}
                    className="w-16 h-16 rounded-full bg-rose-600 p-1.5 shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center disabled:opacity-40 cursor-pointer"
                    aria-label={activeMode === 'reel' ? 'Record Reel' : 'Record Video'}
                  >
                    <div className="w-6 h-6 rounded-full bg-white" />
                  </button>
                )}
              </div>

              {/* Cancel Button */}
              <button
                type="button"
                onClick={onClose}
                disabled={isRecording}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 font-bold disabled:opacity-40 min-h-[44px] flex items-center"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
