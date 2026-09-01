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
} from 'lucide-react';

export type CaptureMode = 'photo' | 'video' | 'reel';

interface DeviceMediaCaptureModalProps {
  isOpen: boolean;
  mode: CaptureMode;
  onClose: () => void;
  onCaptureComplete: (file: File, type: 'image' | 'video') => void;
  onFallbackToFilePicker?: () => void;
}

export default function DeviceMediaCaptureModal({
  isOpen,
  mode,
  onClose,
  onCaptureComplete,
  onFallbackToFilePicker,
}: DeviceMediaCaptureModalProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [capturedBlob, setCapturedBlob] = useState<{ blob: Blob; type: 'image' | 'video'; previewUrl: string } | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const stopAllMedia = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setStream(null);
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Initialize camera stream when modal opens or facingMode changes
  useEffect(() => {
    if (!isOpen) {
      stopAllMedia();
      setCapturedBlob(null);
      setPermissionError(null);
      setIsRecording(false);
      setRecordSeconds(0);
      return;
    }

    let isCancelled = false;

    async function initCamera() {
      setIsInitializing(true);
      setPermissionError(null);
      stopAllMedia();

      if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setPermissionError('Camera recording is not supported in this browser environment.');
        setIsInitializing(false);
        return;
      }

      try {
        const isVideoMode = mode === 'video' || mode === 'reel';
        const constraints: MediaStreamConstraints = {
          video: {
            facingMode,
            width: mode === 'reel' ? { ideal: 720 } : { ideal: 1280 },
            height: mode === 'reel' ? { ideal: 1280 } : { ideal: 720 },
          },
          audio: isVideoMode,
        };

        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);

        if (isCancelled) {
          mediaStream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = mediaStream;
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().catch(() => {});
        }
      } catch (err: unknown) {
        if (isCancelled) return;
        const error = err as Error;
        console.warn('Camera access error:', error);
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          setPermissionError('Camera or microphone permission was denied. Please allow access in browser settings or choose a file from your device.');
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
          setPermissionError('No camera or microphone was found on this device.');
        } else {
          setPermissionError('Unable to access camera: ' + (error.message || 'Unknown device error.'));
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
  }, [isOpen, mode, facingMode, stopAllMedia]);

  // Handle Photo Snapshot
  function takePhotoSnapshot() {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw frame
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

  // Handle Start Video / Reel Recording
  function startVideoRecording() {
    if (!stream) return;
    recordedChunksRef.current = [];

    try {
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : MediaRecorder.isTypeSupported('video/mp4')
        ? 'video/mp4'
        : 'video/webm';

      const recorder = new MediaRecorder(stream, { mimeType });
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
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };

      recorder.start(250); // Collect slice every 250ms
      setIsRecording(true);
      setRecordSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordSeconds((prev) => {
          if (prev >= 60) {
            // Max 60 seconds for Reel/Short video
            stopVideoRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error('Failed to start MediaRecorder:', err);
      setPermissionError('Video recording is not supported in this format.');
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
    setRecordSeconds(0);
  }

  function handleConfirm() {
    if (!capturedBlob) return;
    const isVid = capturedBlob.type === 'video';
    const ext = isVid ? (capturedBlob.blob.type.includes('mp4') ? 'mp4' : 'webm') : 'jpg';
    const fileName = `${mode}_capture_${Date.now()}.${ext}`;
    const file = new File([capturedBlob.blob], fileName, { type: capturedBlob.blob.type });

    onCaptureComplete(file, capturedBlob.type);
    onClose();
  }

  function toggleCameraFlip() {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`${mode === 'photo' ? 'Take Photo' : mode === 'reel' ? 'Record Reel' : 'Record Video'}`}
    >
      <div className="w-full max-w-lg bg-brand-dusk border border-slate-700/80 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-brand-twilight/80">
          <div className="flex items-center gap-2 text-brand-sandstone font-extrabold text-sm">
            {mode === 'photo' && <Camera className="w-4 h-4 text-brand-sunriseCoral" />}
            {mode === 'video' && <Video className="w-4 h-4 text-rose-400" />}
            {mode === 'reel' && <Film className="w-4 h-4 text-brand-goldenHour" />}
            <span>
              {mode === 'photo' ? 'Take Photo' : mode === 'reel' ? 'Record Reel (9:16)' : 'Record Video'}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close camera"
            className="p-1.5 rounded-full text-brand-sandstone/60 hover:text-brand-sandstone hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport Area */}
        <div className="relative bg-black flex items-center justify-center overflow-hidden min-h-[320px] aspect-[4/3] sm:aspect-video">
          {permissionError ? (
            <div className="p-6 text-center space-y-4 max-w-sm">
              <AlertCircle className="w-12 h-12 text-amber-400 mx-auto" />
              <p className="text-xs text-brand-sandstone/80 leading-relaxed">{permissionError}</p>
              {onFallbackToFilePicker && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onFallbackToFilePicker();
                  }}
                  className="bg-brand-caribbeanSea hover:bg-brand-caribbeanSea text-slate-950 font-bold px-4 py-2.5 rounded-2xl text-xs flex items-center justify-center gap-2 mx-auto transition-colors"
                >
                  <FolderOpen className="w-4 h-4" />
                  <span>Choose From Device Files</span>
                </button>
              )}
            </div>
          ) : isInitializing ? (
            <div className="flex flex-col items-center gap-3 text-brand-sandstone/60 text-xs">
              <Loader2 className="w-8 h-8 animate-spin text-brand-caribbeanSea" />
              <span>Starting camera...</span>
            </div>
          ) : capturedBlob ? (
            // Preview captured media
            capturedBlob.type === 'video' ? (
              <video
                src={capturedBlob.previewUrl}
                controls
                autoPlay
                playsInline
                className="w-full h-full object-contain max-h-[60vh]"
              />
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={capturedBlob.previewUrl}
                alt="Captured snapshot"
                className="w-full h-full object-contain max-h-[60vh]"
              />
            )
          ) : (
            // Live video stream
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full ${
                  mode === 'reel' ? 'object-cover aspect-[9/16] max-w-[280px] rounded-2xl my-2 border border-brand-goldenHour/40' : 'object-cover'
                }`}
              />

              {/* Recording indicator */}
              {isRecording && (
                <div className="absolute top-4 left-4 bg-red-600/90 text-white font-mono text-xs font-bold px-3 py-1 rounded-full flex items-center gap-2 shadow-lg animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-white" />
                  <span>{String(Math.floor(recordSeconds / 60)).padStart(2, '0')}:{String(recordSeconds % 60).padStart(2, '0')}</span>
                </div>
              )}

              {/* Flip camera button */}
              <button
                type="button"
                onClick={toggleCameraFlip}
                className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full backdrop-blur-md border border-white/20 transition-all shadow-md"
                title="Switch Camera (Front/Rear)"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* Controls Footer */}
        <div className="p-4 bg-brand-twilight border-t border-slate-800 flex items-center justify-between gap-3">
          {capturedBlob ? (
            <>
              <button
                type="button"
                onClick={handleRetake}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-brand-dusk hover:bg-slate-800 text-brand-sandstone text-xs font-bold border border-slate-700 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Retake</span>
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-brand-caribbeanSea to-brand-sunriseCoral hover:opacity-90 text-slate-950 text-xs font-black shadow-lg transition-all"
              >
                <Check className="w-4 h-4" />
                <span>Use this {capturedBlob.type === 'video' ? 'Video' : 'Photo'}</span>
              </button>
            </>
          ) : permissionError ? (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-2xl bg-brand-dusk text-brand-sandstone/80 text-xs font-bold hover:bg-slate-800"
            >
              Cancel
            </button>
          ) : (
            <>
              {onFallbackToFilePicker && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onFallbackToFilePicker();
                  }}
                  className="text-xs text-brand-sandstone/60 hover:text-brand-caribbeanSea flex items-center gap-1.5 font-semibold"
                >
                  <FolderOpen className="w-4 h-4" />
                  <span className="hidden sm:inline">Device Library</span>
                </button>
              )}

              <div className="flex-1 flex justify-center">
                {mode === 'photo' ? (
                  <button
                    type="button"
                    onClick={takePhotoSnapshot}
                    disabled={isInitializing || !stream}
                    className="w-14 h-14 rounded-full bg-gradient-to-tr from-brand-caribbeanSea to-brand-sunriseCoral p-1 shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                    aria-label="Capture snapshot"
                  >
                    <div className="w-full h-full rounded-full border-2 border-slate-950 bg-white/90" />
                  </button>
                ) : isRecording ? (
                  <button
                    type="button"
                    onClick={stopVideoRecording}
                    className="flex items-center gap-2 px-5 py-3 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-lg animate-pulse"
                  >
                    <StopCircle className="w-5 h-5" />
                    <span>Stop Recording</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={startVideoRecording}
                    disabled={isInitializing || !stream}
                    className="w-14 h-14 rounded-full bg-rose-600 p-1 shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center disabled:opacity-50"
                    aria-label="Start recording"
                  >
                    <div className="w-6 h-6 rounded-full bg-white" />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={onClose}
                className="text-xs text-brand-sandstone/60 hover:text-brand-sandstone px-2 py-1 font-semibold"
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
