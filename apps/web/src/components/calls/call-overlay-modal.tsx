'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Phone,
  PhoneOff,
  Video,
  VideoOff,
  Mic,
  MicOff,
  RotateCcw,
  Volume2,
  VolumeX,
  ShieldCheck,
  Maximize2,
  Minimize2,
  Sparkles,
  Monitor,
  Wifi,
  Radio,
  X,
} from 'lucide-react';
import UserAvatar from '../user-avatar';

export type CallMode = 'audio' | 'video';
export type CallState = 'ringing' | 'connected' | 'ended';

interface CallOverlayModalProps {
  isOpen: boolean;
  peerName: string;
  peerAvatarUrl?: string | null;
  mode: CallMode;
  onClose: () => void;
}

export default function CallOverlayModal({
  isOpen,
  peerName,
  peerAvatarUrl,
  mode = 'video',
  onClose,
}: CallOverlayModalProps) {
  const [callState, setCallState] = useState<CallState>('ringing');
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(mode === 'audio');
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isPiP, setIsPiP] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [audioLevels, setAudioLevels] = useState<number[]>([20, 45, 75, 90, 60, 35, 80, 50]);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const screenShareVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const durationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Play synthetic pleasant ringback tone using Web Audio API
  const playRingtone = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime); // A4
      osc.frequency.setValueAtTime(480, ctx.currentTime + 0.1); // Harmony

      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.8);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 2.0);
    } catch {
      // Ignore audio synthesis errors if user hasn't interacted
    }
  }, []);

  const stopAllMedia = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch {}
      audioContextRef.current = null;
    }
  }, []);

  // Initialize Camera & Microphone Stream
  useEffect(() => {
    if (!isOpen) {
      stopAllMedia();
      setCallState('ringing');
      setCallDuration(0);
      setIsPiP(false);
      return;
    }

    let isCancelled = false;

    async function initCall() {
      setCallState('ringing');
      setCallDuration(0);
      playRingtone();

      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: mode === 'video' ? { facingMode } : false,
          });

          if (isCancelled) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }

          localStreamRef.current = stream;
          if (localVideoRef.current && mode === 'video') {
            localVideoRef.current.srcObject = stream;
            localVideoRef.current.play().catch(() => {});
          }
        }
      } catch (err) {
        console.warn('Call media initialization warning:', err);
      }

      // Simulate connection transition after 2.5 seconds ringing
      const ringTimer = setTimeout(() => {
        if (!isCancelled) {
          setCallState('connected');
          durationTimerRef.current = setInterval(() => {
            setCallDuration((prev) => prev + 1);
            // Dynamic audio frequency animation
            setAudioLevels(
              Array.from({ length: 12 }, () => Math.floor(Math.random() * 80) + 20)
            );
          }, 1000);
        }
      }, 2400);

      return () => clearTimeout(ringTimer);
    }

    initCall();

    return () => {
      isCancelled = true;
      stopAllMedia();
    };
  }, [isOpen, mode, facingMode, stopAllMedia, playRingtone]);

  // Toggle Mute Audio
  function toggleAudio() {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsAudioMuted(!isAudioMuted);
    } else {
      setIsAudioMuted(!isAudioMuted);
    }
  }

  // Toggle Video Camera
  async function toggleVideo() {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      if (videoTracks.length > 0) {
        videoTracks.forEach((track) => {
          track.enabled = !track.enabled;
        });
        setIsVideoMuted(!isVideoMuted);
      } else {
        // Request video stream if started in audio mode
        try {
          const vStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode } });
          const newTrack = vStream.getVideoTracks()[0];
          localStreamRef.current.addTrack(newTrack);
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = localStreamRef.current;
          }
          setIsVideoMuted(false);
        } catch (e) {
          console.warn('Could not enable video track:', e);
        }
      }
    } else {
      setIsVideoMuted(!isVideoMuted);
    }
  }

  // Toggle Screen Sharing
  async function toggleScreenShare() {
    if (isScreenSharing) {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
      }
      setIsScreenSharing(false);
    } else {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
          const sStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
          screenStreamRef.current = sStream;
          setIsScreenSharing(true);
          if (screenShareVideoRef.current) {
            screenShareVideoRef.current.srcObject = sStream;
          }
          sStream.getVideoTracks()[0].onended = () => {
            setIsScreenSharing(false);
          };
        }
      } catch (e) {
        console.warn('Screen share canceled or failed:', e);
      }
    }
  }

  function handleEndCall() {
    setCallState('ended');
    stopAllMedia();
    setTimeout(() => {
      onClose();
    }, 800);
  }

  function formatCallDuration(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  if (!isOpen) return null;

  // Render PiP Mini Overlay
  if (isPiP) {
    return (
      <div className="fixed bottom-6 right-6 z-50 w-72 bg-[#140B22]/95 backdrop-blur-2xl border border-brand-caribbeanSea/50 rounded-3xl p-4 shadow-2xl space-y-3 animate-fadeIn text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserAvatar name={peerName} src={peerAvatarUrl} size="sm" />
            <div className="min-w-0">
              <p className="text-xs font-black truncate">{peerName}</p>
              <p className="text-[10px] text-emerald-400 font-bold font-mono">
                {callState === 'connected' ? formatCallDuration(callDuration) : 'Connecting...'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsPiP(false)}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-300 hover:text-white"
            title="Expand call"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center justify-around pt-2 border-t border-white/10">
          <button
            type="button"
            onClick={toggleAudio}
            className={`p-2 rounded-xl ${isAudioMuted ? 'bg-rose-500/20 text-rose-400' : 'bg-white/10 text-white'}`}
          >
            {isAudioMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={handleEndCall}
            className="p-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white shadow-md"
            title="End Call"
          >
            <PhoneOff className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[80] bg-black/90 backdrop-blur-xl flex items-center justify-center p-3 sm:p-6 text-white animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-4xl h-[88vh] bg-[#0E071A]/95 border border-white/20 rounded-3xl shadow-2xl flex flex-col overflow-hidden relative">
        {/* Specular Edge Top Highlight */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-brand-caribbeanSea/60 to-transparent pointer-events-none z-30" />

        {/* Top Bar Status & HUD */}
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-white/10 bg-white/[0.02] z-20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-brand-caribbeanSea to-brand-sunriseCoral text-slate-950 font-black flex items-center justify-center text-xs shadow-md">
              {mode === 'video' ? <Video className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base text-white flex items-center gap-2">
                {peerName}
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {callState === 'connected' ? 'NASA HD Connected' : 'Calling...'}
                </span>
              </h3>
              <p className="text-[11px] text-slate-300 font-mono font-medium">
                {callState === 'connected' ? (
                  <span className="text-brand-caribbeanSea">{formatCallDuration(callDuration)}</span>
                ) : (
                  'Securing Pan-Caribbean WebRTC Stream...'
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.05] border border-white/10 text-[11px] text-slate-300 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>256-bit E2EE</span>
            </div>

            <button
              type="button"
              onClick={() => setIsPiP(true)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Minimize to Picture-in-Picture"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Video & Audio Canvas Area */}
        <div className="flex-1 relative bg-gradient-to-b from-[#140A24] to-[#08040F] flex items-center justify-center overflow-hidden p-4">
          {mode === 'video' && !isVideoMuted ? (
            /* Video Mode Grid */
            <div className="w-full h-full relative rounded-2xl overflow-hidden bg-black/60 border border-white/10 flex items-center justify-center">
              {/* Screen share view or main remote peer view */}
              {isScreenSharing ? (
                <video
                  ref={screenShareVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-center space-y-4">
                  <div className="relative">
                    <UserAvatar name={peerName} src={peerAvatarUrl} size="lg" />
                    <span className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-brand-caribbeanSea text-slate-950 shadow-md">
                      <Sparkles className="w-3.5 h-3.5" />
                    </span>
                  </div>
                  <div>
                    <p className="text-base font-black text-white">{peerName}</p>
                    <p className="text-xs text-slate-400">
                      {callState === 'connected' ? 'Video stream active' : 'Waiting for answer...'}
                    </p>
                  </div>
                </div>
              )}

              {/* Local User Self-Preview PiP Box */}
              <div className="absolute bottom-4 right-4 w-32 sm:w-44 aspect-video bg-black/80 rounded-2xl overflow-hidden border-2 border-brand-caribbeanSea/60 shadow-2xl z-10 group">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-2 left-2 text-[9px] font-black px-1.5 py-0.5 rounded bg-black/60 text-white">
                  You
                </span>
                <button
                  type="button"
                  onClick={() => setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'))}
                  className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-black text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Flip camera"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>
            </div>
          ) : (
            /* Audio Mode Experience (Aesthetic Soundwaves & Avatar) */
            <div className="flex flex-col items-center justify-center text-center space-y-6 max-w-sm">
              <div className="relative">
                <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl bg-gradient-to-tr from-brand-caribbeanSea via-teal-400 to-brand-sunriseCoral p-1 shadow-2xl animate-pulse">
                  <div className="w-full h-full rounded-[22px] bg-[#120722] flex items-center justify-center overflow-hidden">
                    <UserAvatar name={peerName} src={peerAvatarUrl} size="lg" />
                  </div>
                </div>
                {callState === 'connected' && (
                  <span className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-emerald-400 border-4 border-[#120722] shadow-md" />
                )}
              </div>

              <div className="space-y-1">
                <h4 className="text-xl font-black text-white">{peerName}</h4>
                <p className="text-xs text-brand-caribbeanSea font-bold tracking-wide">
                  {callState === 'connected' ? 'High-Definition Audio Connected' : 'Ringing Caribbean Member...'}
                </p>
              </div>

              {/* Live Audio Frequency Bars */}
              {callState === 'connected' && (
                <div className="flex items-center gap-1.5 h-12 pt-2">
                  {audioLevels.map((lvl, idx) => (
                    <div
                      key={idx}
                      style={{ height: `${lvl}%` }}
                      className="w-1.5 bg-gradient-to-t from-brand-caribbeanSea via-teal-300 to-brand-sunriseCoral rounded-full transition-all duration-150 shadow-sm"
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Control Dock */}
        <div className="p-5 sm:p-6 bg-slate-950/90 border-t border-white/10 flex items-center justify-center gap-3 sm:gap-5 z-20 flex-wrap">
          {/* Microphone Mute */}
          <button
            type="button"
            onClick={toggleAudio}
            className={`p-3.5 rounded-2xl transition-all ${
              isAudioMuted
                ? 'bg-rose-500/20 border border-rose-500 text-rose-400 shadow-md'
                : 'bg-white/10 hover:bg-white/20 border border-white/10 text-white'
            }`}
            title={isAudioMuted ? 'Unmute microphone' : 'Mute microphone'}
          >
            {isAudioMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Video Toggle */}
          <button
            type="button"
            onClick={toggleVideo}
            className={`p-3.5 rounded-2xl transition-all ${
              isVideoMuted
                ? 'bg-rose-500/20 border border-rose-500 text-rose-400 shadow-md'
                : 'bg-white/10 hover:bg-white/20 border border-white/10 text-white'
            }`}
            title={isVideoMuted ? 'Turn on camera' : 'Turn off camera'}
          >
            {isVideoMuted ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          </button>

          {/* Screen Share */}
          <button
            type="button"
            onClick={toggleScreenShare}
            className={`p-3.5 rounded-2xl transition-all ${
              isScreenSharing
                ? 'bg-brand-caribbeanSea/30 border border-brand-caribbeanSea text-brand-caribbeanSea shadow-md'
                : 'bg-white/10 hover:bg-white/20 border border-white/10 text-white'
            }`}
            title={isScreenSharing ? 'Stop screen share' : 'Share screen'}
          >
            <Monitor className="w-5 h-5" />
          </button>

          {/* End Call Button (Prominent Red) */}
          <button
            type="button"
            onClick={handleEndCall}
            className="px-6 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-sm flex items-center gap-2 shadow-xl shadow-rose-600/30 transform hover:scale-105 active:scale-95 transition-all"
            title="End Call"
          >
            <PhoneOff className="w-5 h-5" />
            <span className="hidden sm:inline">End Call</span>
          </button>
        </div>
      </div>
    </div>
  );
}
