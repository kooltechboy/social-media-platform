'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Tv,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Radio,
  Users,
  Settings,
  X,
  Share2,
  Sparkles,
  Heart,
  MessageSquare,
  Send,
  Shield,
  CheckCircle,
  AlertTriangle,
  MonitorUp,
  Volume2,
  FlipHorizontal,
  Flame,
  Crown,
  Gift,
  Check,
} from 'lucide-react';
import {
  LIVE_CATEGORIES,
  formatLiveDuration,
  type StreamAccess,
} from '@caribbean/live';
import {
  createLivestreamAction,
  endLivestreamAction,
  sendLiveMessageAction,
} from '../../lib/live/actions';
import { createSupabaseBrowserClient } from '../../lib/supabase/browser';

interface LiveHostStudioProps {
  user: {
    id: string;
    displayName: string;
    username?: string;
  };
}

interface HostChatMessage {
  id: string;
  sender_name: string;
  body: string;
  isHost?: boolean;
  time: string;
}

interface FloatingReaction {
  id: number;
  emoji: string;
  left: number;
}

export default function LiveHostStudio({ user }: LiveHostStudioProps) {
  const router = useRouter();

  // Media Stream State
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isMirrored, setIsMirrored] = useState(true);

  // Audio VU Meter State
  const [audioLevel, setAudioLevel] = useState(0);

  // Devices
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedVideoDeviceId, setSelectedVideoDeviceId] = useState<string>('');
  const [selectedAudioDeviceId, setSelectedAudioDeviceId] = useState<string>('');

  // Stream Configuration & Broadcast State
  const [title, setTitle] = useState(`${user.displayName}'s Caribbean Live Session 🌴`);
  const [category, setCategory] = useState<string>('Culture & Talk');
  const [accessLevel, setAccessLevel] = useState<StreamAccess>('public');
  const [locationTag, setLocationTag] = useState('');

  const [isLive, setIsLive] = useState(false);
  const [livestreamId, setLivestreamId] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  // Live Metrics
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [viewerCount, setViewerCount] = useState(1);
  const [peakViewers, setPeakViewers] = useState(1);

  // Chat & Reactions
  const [chatMessages, setChatMessages] = useState<HostChatMessage[]>([
    { id: '1', sender_name: 'Tukubi System', body: 'Studio ready. Click "Go Live Now" to broadcast.', isHost: false, time: 'Just now' },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [reactions, setReactions] = useState<FloatingReaction[]>([]);
  const [copiedLink, setCopiedLink] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  // Initialize Media Devices
  useEffect(() => {
    async function initMedia(videoDeviceId?: string, audioDeviceId?: string) {
      try {
        if (!navigator?.mediaDevices?.getUserMedia) {
          setCameraError('WebRTC and Camera APIs are not supported in this browser.');
          setHasCameraPermission(false);
          return;
        }

        const constraints: MediaStreamConstraints = {
          video: videoDeviceId ? { deviceId: { exact: videoDeviceId }, width: { ideal: 1280 }, height: { ideal: 720 } } : { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: audioDeviceId ? { deviceId: { exact: audioDeviceId } } : true,
        };

        const userMedia = await navigator.mediaDevices.getUserMedia(constraints);
        setStream(userMedia);
        setHasCameraPermission(true);
        setCameraError(null);

        if (videoRef.current) {
          videoRef.current.srcObject = userMedia;
        }

        // Setup Audio Analyser for VU Meter
        setupAudioAnalyser(userMedia);

        // Enumerate connected devices
        const devices = await navigator.mediaDevices.enumerateDevices();
        setVideoDevices(devices.filter((d) => d.kind === 'videoinput'));
        setAudioDevices(devices.filter((d) => d.kind === 'audioinput'));
      } catch (err: any) {
        console.warn('Camera/Mic permission denied or not found:', err);
        setHasCameraPermission(false);
        setCameraError(err?.message || 'Camera or Microphone access was denied or is unavailable.');
      }
    }

    void initMedia();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        void audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  function setupAudioAnalyser(mediaStream: MediaStream) {
    try {
      const audioTracks = mediaStream.getAudioTracks();
      if (audioTracks.length === 0) return;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(mediaStream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      function checkAudio() {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        setAudioLevel(Math.min(100, Math.round((average / 128) * 100)));
        animationFrameRef.current = requestAnimationFrame(checkAudio);
      }

      checkAudio();
    } catch {
      // AudioContext fallback
    }
  }

  function stopAllMedia() {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      void audioContextRef.current.close().catch(() => {});
    }
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }

  // Timer while live
  useEffect(() => {
    if (isLive) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isLive]);

  // Realtime live chat & authentic presence subscription while live
  useEffect(() => {
    if (!isLive || !livestreamId) return;

    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    const channel = supabase
      .channel(`host-live-chat-${livestreamId}`, {
        config: {
          presence: { key: user.id },
        },
      })
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const activeViewers = Math.max(1, Object.keys(state).length);
        setViewerCount(activeViewers);
        setPeakViewers((peak) => Math.max(peak, activeViewers));
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'live_messages',
          filter: `livestream_id=eq.${livestreamId}`,
        },
        (payload) => {
          const row = payload.new as { id: string; body: string; sender_id: string | null; created_at: string };
          setChatMessages((prev) => [
            ...prev,
            {
              id: String(row.id),
              sender_name: row.sender_id === user.id ? `${user.displayName} (Host)` : 'Viewer',
              body: row.body,
              isHost: row.sender_id === user.id,
              time: 'Just now',
            },
          ]);
        }
      )
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ online_at: new Date().toISOString(), isHost: true });
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [isLive, livestreamId, user.displayName, user.id]);

  useEffect(() => {
    chatScrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Toggle Controls
  function toggleMute() {
    if (stream) {
      stream.getAudioTracks().forEach((t) => {
        t.enabled = isMicMuted;
      });
      setIsMicMuted(!isMicMuted);
    }
  }

  function toggleVideo() {
    if (stream) {
      stream.getVideoTracks().forEach((t) => {
        t.enabled = isVideoOff;
      });
      setIsVideoOff(!isVideoOff);
    }
  }

  async function toggleScreenShare() {
    try {
      if (isScreenSharing) {
        // Revert to camera
        const userMedia = await navigator.mediaDevices.getUserMedia({
          video: selectedVideoDeviceId ? { deviceId: { exact: selectedVideoDeviceId } } : true,
          audio: true,
        });
        setStream(userMedia);
        if (videoRef.current) {
          videoRef.current.srcObject = userMedia;
        }
        setIsScreenSharing(false);
      } else {
        const displayMedia = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });
        setStream(displayMedia);
        if (videoRef.current) {
          videoRef.current.srcObject = displayMedia;
        }
        setIsScreenSharing(true);

        displayMedia.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
        };
      }
    } catch {
      // User cancelled screen share
    }
  }

  // Start Broadcast
  async function handleStartBroadcast() {
    if (!title.trim()) return;
    setIsStarting(true);

    try {
      const res = await createLivestreamAction({
        title: title.trim(),
        accessLevel,
      });

      if (res.error) {
        alert(res.error);
        setIsStarting(false);
        return;
      }

      setLivestreamId(res.streamId || 'stream-active');
      setIsLive(true);
      setElapsedSeconds(0);
      setViewerCount(1);
      setPeakViewers(1);
      setChatMessages([
        {
          id: 'welcome',
          sender_name: 'Tukubi Broadcaster',
          body: `🔴 BROADCAST LIVE: "${title}" is now streaming across the Caribbean & Diaspora!`,
          isHost: true,
          time: 'Just now',
        },
      ]);
    } catch (err: any) {
      alert(err?.message || 'Failed to start broadcast session.');
    } finally {
      setIsStarting(false);
    }
  }

  // End Broadcast
  async function handleConfirmEnd() {
    setIsEnding(true);
    try {
      if (livestreamId) {
        await endLivestreamAction(livestreamId, peakViewers);
      }
    } catch {
      // Ignore
    } finally {
      setIsLive(false);
      setShowEndModal(false);
      setIsEnding(false);
      setShowSummary(true);
      stopAllMedia();
    }
  }

  // Host sends chat message
  async function handleSendChat(e: React.FormEvent) {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const body = chatInput.trim();
    setChatInput('');

    const newMsg: HostChatMessage = {
      id: String(Date.now()),
      sender_name: `${user.displayName} (Host)`,
      body,
      isHost: true,
      time: 'Just now',
    };
    setChatMessages((prev) => [...prev, newMsg]);

    if (livestreamId) {
      const fd = new FormData();
      fd.set('livestreamId', livestreamId);
      fd.set('body', body);
      void sendLiveMessageAction({ error: null }, fd);
    }
  }

  function handleShareStream() {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/live?id=${livestreamId || ''}` : '';
    if (navigator.clipboard) {
      void navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  }

  // Spawn reaction emoji
  function triggerHostReaction(emoji: string) {
    const r: FloatingReaction = {
      id: Date.now() + Math.random(),
      emoji,
      left: Math.floor(Math.random() * 60) + 20,
    };
    setReactions((prev) => [...prev, r]);
    setTimeout(() => {
      setReactions((prev) => prev.filter((item) => item.id !== r.id));
    }, 2500);
  }

  return (
    <div className="min-h-screen bg-brand-twilight/90 backdrop-blur-md text-brand-sandstone flex flex-col justify-between p-3 md:p-6 max-w-7xl mx-auto space-y-6 rounded-3xl">
      {/* Top Studio Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/live"
            className="p-2 rounded-xl bg-brand-dusk border border-slate-800 hover:text-white text-brand-sandstone/80 text-xs font-bold transition-colors"
          >
            ← Exit Studio
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isLive ? 'bg-red-500 animate-ping' : 'bg-brand-goldenHour'}`} />
              <h1 className="text-lg md:text-xl font-black text-brand-sandstone flex items-center gap-2">
                <Tv className="w-5 h-5 text-red-500" />
                {isLive ? 'Host Broadcast Studio — LIVE' : 'Broadcast Setup & Device Testing'}
              </h1>
            </div>
            <p className="text-xs text-brand-sandstone/60">
              {isLive ? `Broadcasting as @${user.username || 'host'} • WebRTC Low-Latency Ingest` : 'Verify your camera, microphone, audio levels, and stream title before going live.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isLive ? (
            <>
              <button
                onClick={handleShareStream}
                className="bg-brand-dusk border border-slate-800 hover:border-slate-700 text-slate-200 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-2 transition-colors cursor-pointer"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                {copiedLink ? 'Link Copied' : 'Share Stream'}
              </button>
              <button
                onClick={() => setShowEndModal(true)}
                className="bg-red-600 hover:bg-red-500 text-white font-black px-5 py-2 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-red-600/30 transition-all cursor-pointer"
              >
                End Broadcast
              </button>
            </>
          ) : (
            <button
              onClick={handleStartBroadcast}
              disabled={isStarting}
              className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black px-6 py-2.5 rounded-2xl text-xs flex items-center gap-2 shadow-lg shadow-red-600/30 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Radio className="w-4 h-4" />
              {isStarting ? 'Starting Broadcast…' : 'Go Live Now'}
            </button>
          )}
        </div>
      </header>

      {/* Main Broadcast Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        {/* Left: Video Viewport & Controls (Col 8) */}
        <div className="lg:col-span-8 flex flex-col space-y-4">
          <div className="relative bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden aspect-video flex items-center justify-center shadow-2xl group">
            {/* Live Video Feed */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${isMirrored && !isScreenSharing ? '-scale-x-100' : ''}`}
            />

            {/* Video Off Placeholder */}
            {isVideoOff && (
              <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center space-y-2 z-10">
                <VideoOff className="w-12 h-12 text-slate-600" />
                <p className="text-xs text-brand-sandstone/60 font-bold">Camera is currently turned off</p>
              </div>
            )}

            {/* Camera Permission Error Overlay */}
            {hasCameraPermission === false && (
              <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center space-y-3 z-20">
                <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-200">Camera / Microphone Access Required</h3>
                <p className="text-xs text-brand-sandstone/60 max-w-sm">
                  {cameraError || 'Please allow browser permissions for camera and microphone to start broadcasting.'}
                </p>
              </div>
            )}

            {/* Floating Reactions Overlay */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
              {reactions.map((r) => (
                <div
                  key={r.id}
                  className="absolute bottom-10 text-3xl animate-float-fade"
                  style={{ left: `${r.left}%` }}
                >
                  {r.emoji}
                </div>
              ))}
            </div>

            {/* Live Overlay Badges */}
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
              <span className={`text-xs font-black px-3 py-1 rounded-full flex items-center gap-1.5 shadow-md ${
                isLive ? 'bg-red-600 text-white animate-pulse' : 'bg-brand-goldenHour text-slate-950'
              }`}>
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                {isLive ? 'LIVE' : 'PREVIEW'}
              </span>

              {isLive && (
                <>
                  <span className="bg-slate-900/80 backdrop-blur-md text-slate-200 text-xs font-bold px-3 py-1 rounded-full border border-slate-700 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-brand-caribbeanSea" /> {viewerCount.toLocaleString()}
                  </span>
                  <span className="bg-slate-900/80 backdrop-blur-md text-emerald-400 text-xs font-bold px-3 py-1 rounded-full border border-slate-700">
                    ⏱ {formatLiveDuration(elapsedSeconds)}
                  </span>
                </>
              )}
            </div>

            {/* Top Right Studio Status */}
            <div className="absolute top-4 right-4 z-10 hidden sm:flex items-center gap-2">
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-slate-300 border border-slate-700">
                1080p 60fps
              </span>
            </div>

            {/* Bottom In-Player Audio VU Meter */}
            <div className="absolute bottom-4 left-4 right-4 z-10 flex items-center justify-between bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-2 flex-1 max-w-xs">
                <Volume2 className={`w-4 h-4 ${isMicMuted ? 'text-rose-400' : 'text-emerald-400'}`} />
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-75 ${
                      isMicMuted ? 'bg-slate-600 w-0' : audioLevel > 75 ? 'bg-red-500' : audioLevel > 40 ? 'bg-amber-400' : 'bg-emerald-400'
                    }`}
                    style={{ width: isMicMuted ? '0%' : `${audioLevel}%` }}
                  />
                </div>
                <span className="text-[10px] font-bold text-brand-sandstone/60 min-w-[28px]">
                  {isMicMuted ? 'Muted' : `${audioLevel}%`}
                </span>
              </div>

              {/* Host Quick Emoji Trigger */}
              <div className="flex items-center gap-1.5">
                {['❤️', '🔥', '🌴', '👑', '🎉'].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => triggerHostReaction(emoji)}
                    className="p-1 rounded-lg hover:bg-white/10 text-sm transition-transform active:scale-125 cursor-pointer"
                    title={`Send ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Broadcaster Toolbar */}
          <div className="bg-brand-dusk border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleMute}
                className={`p-3 rounded-xl border font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                  isMicMuted
                    ? 'bg-rose-500/20 border-rose-500 text-rose-400'
                    : 'bg-brand-twilight border-slate-700 text-slate-200 hover:text-white'
                }`}
                title={isMicMuted ? 'Unmute Microphone' : 'Mute Microphone'}
              >
                {isMicMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-emerald-400" />}
                <span>{isMicMuted ? 'Unmute' : 'Mute'}</span>
              </button>

              <button
                type="button"
                onClick={toggleVideo}
                className={`p-3 rounded-xl border font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                  isVideoOff
                    ? 'bg-rose-500/20 border-rose-500 text-rose-400'
                    : 'bg-brand-twilight border-slate-700 text-slate-200 hover:text-white'
                }`}
                title={isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
              >
                {isVideoOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4 text-brand-caribbeanSea" />}
                <span>{isVideoOff ? 'Start Video' : 'Stop Video'}</span>
              </button>

              <button
                type="button"
                onClick={toggleScreenShare}
                className={`p-3 rounded-xl border font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                  isScreenSharing
                    ? 'bg-brand-goldenHour/20 border-brand-goldenHour text-amber-300'
                    : 'bg-brand-twilight border-slate-700 text-slate-200 hover:text-white'
                }`}
                title="Share Screen"
              >
                <MonitorUp className="w-4 h-4 text-brand-goldenHour" />
                <span>{isScreenSharing ? 'Stop Screen' : 'Share Screen'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsMirrored(!isMirrored)}
                className={`p-3 rounded-xl border font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                  isMirrored
                    ? 'bg-brand-twilight border-slate-700 text-brand-caribbeanSea'
                    : 'bg-brand-twilight border-slate-800 text-slate-400 hover:text-white'
                }`}
                title="Mirror Camera"
              >
                <FlipHorizontal className="w-4 h-4" />
                <span className="hidden sm:inline">Mirror</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-brand-sandstone/60 font-semibold hidden md:inline">
                {locationTag}
              </span>
            </div>
          </div>

          {/* Pre-Live Configuration Deck (when not yet live) */}
          {!isLive && (
            <div className="bg-brand-dusk border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <h3 className="text-sm font-black text-brand-sandstone uppercase tracking-wider flex items-center gap-2">
                <Settings className="w-4 h-4 text-brand-caribbeanSea" /> Broadcast Metadata &amp; Privacy
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-brand-sandstone/80">Stream Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Carnival Band Launch & Avenue Live Fete 🎭"
                    className="w-full bg-brand-twilight border border-slate-700 rounded-2xl px-4 py-2.5 text-xs text-brand-sandstone focus:outline-none focus:border-brand-caribbeanSea"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-brand-sandstone/80">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-brand-twilight border border-slate-700 rounded-2xl px-4 py-2.5 text-xs text-brand-sandstone focus:outline-none focus:border-brand-caribbeanSea cursor-pointer"
                  >
                    {LIVE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-brand-sandstone/80">Audience Access Level</label>
                  <select
                    value={accessLevel}
                    onChange={(e) => setAccessLevel(e.target.value as StreamAccess)}
                    className="w-full bg-brand-twilight border border-slate-700 rounded-2xl px-4 py-2.5 text-xs text-brand-sandstone focus:outline-none focus:border-brand-caribbeanSea cursor-pointer"
                  >
                    <option value="public">Public (All Caribbean &amp; Diaspora)</option>
                    <option value="followers">Followers Only</option>
                    <option value="subscribers">Paid Subscribers Only</option>
                  </select>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-brand-sandstone/80">Location / Island Tag (Optional)</label>
                  <input
                    type="text"
                    value={locationTag}
                    onChange={(e) => setLocationTag(e.target.value)}
                    placeholder="e.g. Kingston, Port of Spain, Miami, London, or Pan-Caribbean"
                    className="w-full bg-brand-twilight border border-slate-700 rounded-2xl px-4 py-2.5 text-xs text-brand-sandstone focus:outline-none focus:border-brand-caribbeanSea"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Live Chat & Event Stream (Col 4) */}
        <div className="lg:col-span-4 bg-brand-dusk border border-slate-800 rounded-3xl p-5 flex flex-col justify-between shadow-2xl h-[580px]">
          {/* Chat Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-brand-caribbeanSea" />
              <h3 className="text-xs font-black uppercase text-brand-sandstone">Live Chat &amp; Studio Alerts</h3>
            </div>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
              {chatMessages.length} msgs
            </span>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto space-y-3 py-3 pr-1">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`p-2.5 rounded-2xl text-xs space-y-0.5 ${
                  msg.isHost
                    ? 'bg-red-500/10 border border-red-500/30'
                    : 'bg-brand-twilight border border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`font-bold ${msg.isHost ? 'text-red-400' : 'text-brand-caribbeanSea'}`}>
                    {msg.sender_name}
                  </span>
                  <span className="text-[10px] text-brand-sandstone/40">{msg.time}</span>
                </div>
                <p className="text-slate-200 leading-relaxed break-words">{msg.body}</p>
              </div>
            ))}
            <div ref={chatScrollRef} />
          </div>

          {/* Host Chat Input Form */}
          <form onSubmit={handleSendChat} className="pt-3 border-t border-slate-800 flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Post message as Host…"
              className="flex-1 bg-brand-twilight border border-slate-700 rounded-2xl px-3.5 py-2 text-xs text-brand-sandstone focus:outline-none focus:border-red-500"
            />
            <button
              type="submit"
              disabled={!chatInput.trim()}
              className="bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold p-2.5 rounded-2xl text-xs transition-colors cursor-pointer shadow-md"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>

      {/* End Broadcast Confirmation Modal */}
      {showEndModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-brand-dusk border border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center mx-auto">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-black text-brand-sandstone">End Live Broadcast?</h3>
              <p className="text-xs text-brand-sandstone/60">
                Are you sure you want to end this live stream? Viewers will be disconnected and stream statistics will be finalized.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowEndModal(false)}
                className="flex-1 bg-brand-twilight border border-slate-700 text-slate-300 font-bold py-2.5 rounded-2xl text-xs hover:text-white"
              >
                Keep Streaming
              </button>
              <button
                type="button"
                onClick={handleConfirmEnd}
                disabled={isEnding}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-black py-2.5 rounded-2xl text-xs shadow-lg shadow-red-600/30"
              >
                {isEnding ? 'Ending…' : 'End Stream Now'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Post-Stream Summary Modal */}
      {showSummary && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-brand-dusk border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-6 shadow-2xl text-center">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-red-600 to-brand-goldenHour flex items-center justify-center mx-auto text-slate-950 font-black shadow-lg">
              <CheckCircle className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-black text-brand-sandstone">Broadcast Concluded!</h2>
              <p className="text-xs text-brand-sandstone/60">
                Great stream, @{user.username || 'creator'}! Here are your live performance metrics.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-brand-twilight border border-slate-800 rounded-2xl p-3">
                <span className="text-[10px] font-bold text-brand-sandstone/40 uppercase block">Duration</span>
                <span className="text-sm font-black text-brand-sandstone">{formatLiveDuration(elapsedSeconds)}</span>
              </div>
              <div className="bg-brand-twilight border border-slate-800 rounded-2xl p-3">
                <span className="text-[10px] font-bold text-brand-sandstone/40 uppercase block">Peak Viewers</span>
                <span className="text-sm font-black text-brand-caribbeanSea">{peakViewers.toLocaleString()}</span>
              </div>
              <div className="bg-brand-twilight border border-slate-800 rounded-2xl p-3">
                <span className="text-[10px] font-bold text-brand-sandstone/40 uppercase block">Messages</span>
                <span className="text-sm font-black text-brand-goldenHour">{chatMessages.length}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Link
                href="/live"
                className="flex-1 bg-brand-twilight border border-slate-700 hover:text-white text-slate-300 font-bold py-2.5 rounded-2xl text-xs"
              >
                Back to Live Streams
              </Link>
              <Link
                href="/creator-studio/videos"
                className="flex-1 bg-gradient-to-r from-red-600 to-rose-600 text-white font-black py-2.5 rounded-2xl text-xs shadow-lg shadow-red-600/20"
              >
                Creator Studio →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
