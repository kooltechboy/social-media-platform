'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Tv,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Share2,
  Heart,
  Flame,
  Crown,
  Gift,
  Users,
  MessageSquare,
  Send,
  Check,
  CheckCircle,
  Radio,
  Sparkles,
} from 'lucide-react';
import { createSupabaseBrowserClient } from '../../lib/supabase/browser';
import { sendLiveMessageAction, type LiveActionState } from '../../lib/live/actions';
import { LiveGiftModal } from '../live-gift-modal';
import { followAction, unfollowAction } from '../../lib/social/profile-actions';

export interface LivestreamViewItem {
  id: string;
  title: string;
  state: 'scheduled' | 'live' | 'ended' | 'cancelled';
  access_level: string;
  peak_viewers: number;
  started_at: string | null;
  creator_id: string;
  location?: string;
  category?: string;
  profiles: { display_name: string; username: string } | null;
  videoUrl?: string;
}

interface LiveViewerPlayerProps {
  stream: LivestreamViewItem;
  user: {
    id: string;
    displayName: string;
    username?: string;
  } | null;
}

interface ChatMessage {
  id: string;
  body: string;
  sender_id: string | null;
  display_name: string;
  isHost?: boolean;
  created_at: string;
}

interface FloatingReaction {
  id: number;
  emoji: string;
  left: number;
}

const DEFAULT_STREAM_VIDEO =
  'https://assets.mixkit.co/videos/preview/mixkit-caribbean-tropical-beach-with-turquoise-water-41221-large.mp4';

export default function LiveViewerPlayer({ stream, user }: LiveViewerPlayerProps) {
  // Player Controls
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      body: 'Big up from London! Loving the vibes 🔥',
      sender_id: null,
      display_name: 'Marcus_UK',
      created_at: new Date(Date.now() - 120000).toISOString(),
    },
    {
      id: '2',
      body: 'Sound system heavy tonight! 🇯🇲🔊',
      sender_id: null,
      display_name: 'Kingston_Dub',
      created_at: new Date(Date.now() - 60000).toISOString(),
    },
    {
      id: '3',
      body: 'Sent 1x Carnival Crown via SpotPay! 👑',
      sender_id: null,
      display_name: 'SocaLover99',
      created_at: new Date(Date.now() - 30000).toISOString(),
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followingPending, setFollowingPending] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [reactions, setReactions] = useState<FloatingReaction[]>([]);

  const videoContainerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  const isLive = stream.state === 'live';

  // Supabase Realtime Chat Subscription
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase || !isLive) return;

    const channel = supabase
      .channel(`viewer-live-chat-${stream.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'live_messages',
          filter: `livestream_id=eq.${stream.id}`,
        },
        async (payload) => {
          const row = payload.new as { id: string; body: string; sender_id: string | null; created_at: string };
          let name = 'Viewer';
          if (row.sender_id === stream.creator_id) {
            name = `${stream.profiles?.display_name ?? 'Host'} (Host)`;
          } else if (row.sender_id === user?.id) {
            name = user.displayName;
          }

          setMessages((prev) => [
            ...prev,
            {
              id: String(row.id),
              body: row.body,
              sender_id: row.sender_id,
              display_name: name,
              isHost: row.sender_id === stream.creator_id,
              created_at: row.created_at,
            },
          ]);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [stream.id, isLive, stream.creator_id, stream.profiles?.display_name, user?.displayName, user?.id]);

  useEffect(() => {
    chatScrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Video Controls
  function togglePlay() {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  }

  function toggleMute() {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  }

  function handleVolumeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      if (val > 0 && isMuted) {
        videoRef.current.muted = false;
        setIsMuted(false);
      }
    }
  }

  function toggleFullscreen() {
    if (!videoContainerRef.current) return;
    if (!document.fullscreenElement) {
      videoContainerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }

  // Follow Host
  async function toggleFollow() {
    if (!user || followingPending) return;
    setFollowingPending(true);
    const nextState = !isFollowing;
    setIsFollowing(nextState);

    try {
      if (nextState) {
        await followAction(stream.creator_id);
      } else {
        await unfollowAction(stream.creator_id);
      }
    } catch {
      setIsFollowing(!nextState);
    } finally {
      setFollowingPending(false);
    }
  }

  // Share Stream
  function handleShare() {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/live?id=${stream.id}` : '';
    if (navigator.share) {
      navigator.share({
        title: `${stream.title} on Antilia Live`,
        url,
      }).catch(() => {});
    } else if (navigator.clipboard) {
      void navigator.clipboard.writeText(url);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
  }

  // Send Reaction
  function triggerReaction(emoji: string) {
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

  // Send Message
  function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const body = chatInput.trim();
    setChatInput('');

    if (user) {
      const optimisticMsg: ChatMessage = {
        id: String(Date.now()),
        body,
        sender_id: user.id,
        display_name: user.displayName,
        isHost: user.id === stream.creator_id,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimisticMsg]);

      const fd = new FormData();
      fd.set('livestreamId', stream.id);
      fd.set('body', body);
      void sendLiveMessageAction({ error: null }, fd);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Video Player & Engagement Rail (Col 8) */}
      <div className="lg:col-span-8 space-y-4">
        <div
          ref={videoContainerRef}
          className="relative bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col group"
        >
          {/* Main Video Viewport */}
          <div className="aspect-video relative overflow-hidden flex items-center justify-center">
            {isLive ? (
              <video
                ref={videoRef}
                src={stream.videoUrl || DEFAULT_STREAM_VIDEO}
                autoPlay
                playsInline
                loop
                muted={isMuted}
                className="w-full h-full object-cover cursor-pointer"
                onClick={togglePlay}
              />
            ) : (
              <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center p-6 text-center space-y-3 z-10">
                <div className="w-16 h-16 rounded-3xl bg-brand-twilight border border-slate-800 flex items-center justify-center text-3xl">
                  {stream.state === 'scheduled' ? '📅' : '🏁'}
                </div>
                <h3 className="text-lg font-black text-brand-sandstone">
                  {stream.state === 'scheduled' ? 'Broadcast is Scheduled' : 'Broadcast has Ended'}
                </h3>
                <p className="text-xs text-brand-sandstone/60 max-w-sm">
                  {stream.state === 'scheduled'
                    ? 'This broadcast will go live shortly. Stay tuned!'
                    : 'The host has ended this live session. Check out other active broadcasts below.'}
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

            {/* Top Status Badges */}
            <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
              <span className={`text-xs font-black px-3 py-1 rounded-full flex items-center gap-1.5 shadow-md ${
                isLive ? 'bg-red-600 text-white animate-pulse' : 'bg-brand-goldenHour text-slate-950'
              }`}>
                {isLive && <span className="w-2 h-2 rounded-full bg-white animate-ping" />}
                {isLive ? 'LIVE' : stream.state.toUpperCase()}
              </span>

              <span className="bg-slate-900/80 backdrop-blur-md text-slate-200 text-xs font-bold px-3 py-1 rounded-full border border-slate-700 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-brand-caribbeanSea" /> {stream.peak_viewers.toLocaleString()} watching
              </span>

              {stream.category && (
                <span className="hidden sm:inline-block bg-slate-900/80 backdrop-blur-md text-rose-300 text-xs font-semibold px-3 py-1 rounded-full border border-slate-700">
                  {stream.category}
                </span>
              )}
            </div>

            {/* Top Right Controls */}
            <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
              <button
                onClick={handleShare}
                className="p-2 rounded-full bg-slate-900/80 backdrop-blur-md text-slate-200 hover:text-white border border-slate-700 transition-colors"
                title="Share Stream"
              >
                {copiedShare ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
              </button>
            </div>

            {/* Bottom Overlay Player Controls */}
            {isLive && (
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity z-20">
                <div className="flex items-center gap-3">
                  <button
                    onClick={togglePlay}
                    className="p-2 rounded-xl bg-slate-900/80 backdrop-blur-md text-white hover:bg-slate-800 transition-colors"
                  >
                    {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current translate-x-0.5" />}
                  </button>

                  <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800">
                    <button onClick={toggleMute} className="text-slate-300 hover:text-white">
                      {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                    </button>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      className="w-16 accent-brand-caribbeanSea h-1 bg-slate-700 rounded cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleFullscreen}
                    className="p-2 rounded-xl bg-slate-900/80 backdrop-blur-md text-slate-300 hover:text-white transition-colors"
                    title="Fullscreen"
                  >
                    {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Broadcaster Profile & Engagement Bar */}
          <div className="p-5 bg-brand-dusk border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <Link
                href={`/profile/${stream.profiles?.username ?? 'creator'}`}
                className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-500 to-brand-goldenHour text-slate-950 font-black flex items-center justify-center text-sm shadow-md flex-shrink-0"
              >
                {(stream.profiles?.display_name ?? 'CO').slice(0, 2).toUpperCase()}
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-black text-brand-sandstone leading-snug">{stream.title}</h4>
                </div>
                <p className="text-xs text-brand-sandstone/60">
                  {stream.profiles?.display_name ?? 'Caribbean Host'} · @{stream.profiles?.username ?? 'creator'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              {user && user.id !== stream.creator_id && (
                <button
                  type="button"
                  disabled={followingPending}
                  onClick={toggleFollow}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer ${
                    isFollowing
                      ? 'bg-brand-twilight text-slate-300 border border-slate-700'
                      : 'bg-brand-caribbeanSea hover:bg-brand-caribbeanSea/90 text-slate-950 shadow-md'
                  }`}
                >
                  {isFollowing ? 'Following ✓' : '+ Follow Host'}
                </button>
              )}

              {/* SpotPay Gift Modal */}
              <LiveGiftModal livestreamId={stream.id} isAuthenticated={Boolean(user)} />
            </div>
          </div>
        </div>
      </div>

      {/* Live Chat Column (Col 4) */}
      <div className="lg:col-span-4 bg-brand-dusk border border-slate-800 rounded-3xl p-5 flex flex-col justify-between shadow-2xl h-[560px]">
        {/* Chat Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-brand-caribbeanSea" />
            <h3 className="text-xs font-black uppercase text-brand-sandstone">Live Chat</h3>
          </div>
          <span className="text-[10px] font-bold text-brand-sandstone/60">
            {isLive ? 'Realtime Active' : 'Chat Closed'}
          </span>
        </div>

        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto space-y-3 py-3 pr-1">
          {messages.map((msg) => (
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
                  {msg.display_name}
                </span>
                <span className="text-[10px] text-brand-sandstone/40">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-slate-200 leading-relaxed break-words">{msg.body}</p>
            </div>
          ))}
          <div ref={chatScrollRef} />
        </div>

        {/* Reaction Cannon Bar */}
        <div className="py-2 border-t border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {['❤️', '🔥', '🌴', '👑', '🎉', '🇯🇲', '🇹🇹', '🇩🇴'].map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => triggerReaction(emoji)}
                className="p-1 rounded-lg hover:bg-white/10 text-base transition-transform active:scale-125 cursor-pointer"
                title={`Send ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Input */}
        {user ? (
          <form onSubmit={handleSendMessage} className="pt-2 border-t border-slate-800 flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Send a message in live chat…"
              className="flex-1 bg-brand-twilight border border-slate-700 rounded-2xl px-3.5 py-2 text-xs text-brand-sandstone focus:outline-none focus:border-brand-caribbeanSea"
            />
            <button
              type="submit"
              disabled={!chatInput.trim()}
              className="bg-brand-caribbeanSea hover:bg-brand-caribbeanSea/90 text-slate-950 font-bold p-2.5 rounded-2xl text-xs transition-colors cursor-pointer shadow-md disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        ) : (
          <div className="pt-2 border-t border-slate-800 text-center">
            <Link
              href="/login?redirect=/live"
              className="block bg-brand-twilight hover:bg-slate-800 border border-slate-700 text-brand-caribbeanSea font-bold py-2 rounded-2xl text-xs transition-colors"
            >
              Sign in to Chat &amp; React
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
