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
  ShoppingBag,
  Trash2,
} from 'lucide-react';
import { calculateLiveDiscountPrice } from '@caribbean/live';
import { createSupabaseBrowserClient } from '../../lib/supabase/browser';
import { sendLiveMessageAction, deleteLiveMessageAction, recordLiveViewerHeartbeatAction, type LiveActionState } from '../../lib/live/actions';
import { LiveGiftModal } from '../live-gift-modal';
import { followAction, unfollowAction } from '../../lib/social/profile-actions';
import { AudioManager } from '../../lib/media/audio-manager';

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
  stream?: LivestreamViewItem | null;
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

export default function LiveViewerPlayer({ stream, user }: LiveViewerPlayerProps) {
  if (!stream) {
    return (
      <div className="glass rounded-3xl p-12 text-center max-w-2xl mx-auto space-y-4 border border-red-500/20 my-8">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
          <Tv className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-black text-white">No Live Broadcasts Active</h3>
        <p className="text-xs text-brand-sandstone/70 leading-relaxed max-w-md mx-auto">
          There are currently no active island livestreams or scheduled dub sessions broadcasting. Be the first to go live!
        </p>
        <Link
          href="/live/broadcast"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold text-xs hover:opacity-90 transition-opacity shadow-lg shadow-red-600/20"
        >
          🔴 Go Live Now
        </Link>
      </div>
    );
  }

  return <ActiveLivePlayer stream={stream} user={user} />;
}

function ActiveLivePlayer({
  stream,
  user,
}: {
  stream: LivestreamViewItem;
  user: LiveViewerPlayerProps['user'];
}) {
  // Player Controls
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followingPending, setFollowingPending] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [reactions, setReactions] = useState<FloatingReaction[]>([]);
  const [pinnedProduct, setPinnedProduct] = useState<{
    id: string;
    productId: string;
    title: string;
    priceMinor: number;
    discountedPriceMinor: number;
    savingsMinor: number;
    flashDiscountBps: number;
    currency: string;
    imageUrl?: string;
    inventoryCount: number | null;
  } | null>(null);

  const [liveViewerCount, setLiveViewerCount] = useState<number>(() => stream.peak_viewers || 0);

  const videoContainerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  const isLive = stream.state === 'live';

  // Live Realtime Presence Telemetry
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase || !stream.id) return;

    const presenceChannel = supabase.channel(`live-presence-${stream.id}`, {
      config: {
        presence: {
          key: user?.id || `anon-${Math.random().toString(36).substring(7)}`,
        },
      },
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const count = Object.keys(state).length;
        setLiveViewerCount(count);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            user_id: user?.id || null,
            display_name: user?.displayName || 'Anonymous Viewer',
            online_at: new Date().toISOString(),
          });
        }
      });

    // Send heartbeat
    if (user) {
      void recordLiveViewerHeartbeatAction(stream.id);
      const interval = setInterval(() => {
        void recordLiveViewerHeartbeatAction(stream.id);
      }, 30000);
      return () => {
        clearInterval(interval);
        void supabase.removeChannel(presenceChannel);
      };
    }

    return () => {
      void supabase.removeChannel(presenceChannel);
    };
  }, [stream.id, user?.id, user?.displayName]);

  // Fetch & subscribe to live pinned shopping drop
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase || !stream.id) return;

    let isMounted = true;
    const loadPinnedProduct = async () => {
      const { data } = await supabase
        .from('livestream_products')
        .select(`
          id,
          product_id,
          flash_discount_bps,
          products (
            id,
            title,
            price_minor,
            currency,
            inventory_count,
            marketplace_product_media (url, is_primary)
          )
        `)
        .eq('livestream_id', stream.id)
        .eq('is_pinned', true)
        .maybeSingle();

      if (!isMounted) return;

      if (data && data.products) {
        const prod: any = data.products;
        const media = prod.marketplace_product_media;
        const img = Array.isArray(media) && media.length > 0 ? media[0].url : undefined;
        const bps = data.flash_discount_bps || 0;
        const discount = calculateLiveDiscountPrice(prod.price_minor, bps);

        setPinnedProduct({
          id: data.id,
          productId: prod.id,
          title: prod.title,
          priceMinor: prod.price_minor,
          discountedPriceMinor: discount.discountedMinor,
          savingsMinor: discount.savingsMinor,
          flashDiscountBps: bps,
          currency: prod.currency || 'USD',
          imageUrl: img,
          inventoryCount: prod.inventory_count,
        });
      } else {
        setPinnedProduct(null);
      }
    };

    void loadPinnedProduct();

    const channel = supabase
      .channel(`viewer-live-products-${stream.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'livestream_products',
          filter: `livestream_id=eq.${stream.id}`,
        },
        () => {
          void loadPinnedProduct();
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      void supabase.removeChannel(channel);
    };
  }, [stream.id]);

  // Load existing stream messages on mount
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase || !stream.id) return;

    let isMounted = true;
    void supabase
      .from('live_messages')
      .select('id, body, sender_id, created_at, profiles(display_name, username)')
      .eq('livestream_id', stream.id)
      .order('created_at', { ascending: true })
      .limit(50)
      .then(({ data }) => {
        if (isMounted && data) {
          const formatted: ChatMessage[] = data.map((msg: any) => ({
            id: msg.id,
            body: msg.body,
            sender_id: msg.sender_id,
            display_name: msg.profiles?.display_name || msg.profiles?.username || 'Viewer',
            isHost: msg.sender_id === stream.creator_id,
            created_at: msg.created_at,
          }));
          setMessages(formatted);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [stream.id, stream.creator_id]);

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

  // Register with global AudioManager
  useEffect(() => {
    AudioManager.register(`tukubi-live-${stream.id}`, {
      kind: 'live',
      onPause: () => {
        videoRef.current?.pause();
        setIsPlaying(false);
      },
      onMute: () => {
        if (videoRef.current) videoRef.current.muted = true;
        setIsMuted(true);
      },
    });
    return () => {
      AudioManager.unregister(`tukubi-live-${stream.id}`);
    };
  }, [stream.id]);

  // Video Controls
  function togglePlay() {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      if (!isMuted) {
        AudioManager.claimAudio(`tukubi-live-${stream.id}`, 'live');
      }
      videoRef.current.play().catch(() => {
        setIsPlaying(false);
      });
      setIsPlaying(true);
    }
  }

  function toggleMute() {
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
    if (!nextMuted && isPlaying) {
      AudioManager.claimAudio(`tukubi-live-${stream.id}`, 'live');
    }
  }

  function handleVolumeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      if (val > 0 && isMuted) {
        videoRef.current.muted = false;
        setIsMuted(false);
        if (isPlaying) {
          AudioManager.claimAudio(`tukubi-live-${stream.id}`, 'live');
        }
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
        title: `${stream.title} on Tukubi Live`,
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

  async function handleDeleteMessage(messageId: string) {
    await deleteLiveMessageAction(messageId, stream.id);
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Video Player & Engagement Rail (Col 8, expanded to 9 on 3xl+) */}
      <div className="lg:col-span-8 3xl:col-span-9 space-y-4">
        <div
          ref={videoContainerRef}
          className="relative bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col group"
        >
          {/* Main Video Viewport */}
          <div className="aspect-video relative overflow-hidden flex items-center justify-center">
            {isLive ? (
              stream.videoUrl ? (
                <video
                  ref={videoRef}
                  src={stream.videoUrl}
                  autoPlay
                  playsInline
                  loop
                  muted={isMuted}
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={togglePlay}
                  onPlay={() => {
                    setIsPlaying(true);
                    if (!isMuted) {
                      AudioManager.claimAudio(`tukubi-live-${stream.id}`, 'live');
                    }
                  }}
                  onPause={() => setIsPlaying(false)}
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center p-6 text-center space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-brand-surface border border-white/10 flex items-center justify-center text-brand-sandstone/70">
                    <Radio className="w-7 h-7 text-amber-400/80" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-white">Broadcast Signal Standby</h3>
                    <p className="text-xs text-brand-sandstone/75 max-w-sm">
                      Session is open, awaiting live video feed from host. Live chat and engagement are active.
                    </p>
                  </div>
                </div>
              )
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
                <Users className="w-3.5 h-3.5 text-brand-caribbeanSea" /> {isLive ? `${liveViewerCount} watching` : `${stream.peak_viewers} peak viewers`}
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

            {/* Live Shopping Pinned Flash Drop Card */}
            {pinnedProduct && (
              <div className="absolute bottom-16 left-4 right-4 sm:right-auto sm:max-w-sm z-30 pointer-events-auto">
                <div className="bg-slate-950/90 backdrop-blur-xl border border-red-500/60 rounded-2xl p-3 shadow-2xl flex items-center gap-3">
                  <div className="relative w-12 h-12 rounded-xl bg-slate-900 border border-white/10 overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {pinnedProduct.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={pinnedProduct.imageUrl} alt={pinnedProduct.title} className="w-full h-full object-cover" />
                    ) : (
                      <ShoppingBag className="w-5 h-5 text-brand-caribbeanSea" />
                    )}
                    {pinnedProduct.flashDiscountBps > 0 && (
                      <span className="absolute top-0 right-0 bg-red-600 text-white text-[9px] font-black px-1 rounded-bl">
                        -{pinnedProduct.flashDiscountBps / 100}%
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-black uppercase text-red-400 flex items-center gap-1">
                        <Flame className="w-3 h-3 fill-current" /> Live Drop
                      </span>
                      {pinnedProduct.inventoryCount !== null && pinnedProduct.inventoryCount <= 5 && (
                        <span className="text-[9px] font-bold text-amber-300">Only {pinnedProduct.inventoryCount} left!</span>
                      )}
                    </div>
                    <h4 className="text-xs font-black text-white truncate">{pinnedProduct.title}</h4>
                    <div className="flex items-baseline gap-1.5 mt-0.5">
                      <span className="text-xs font-black text-brand-caribbeanSea">
                        ${(pinnedProduct.discountedPriceMinor / 100).toFixed(2)} {pinnedProduct.currency}
                      </span>
                      {pinnedProduct.flashDiscountBps > 0 && (
                        <span className="text-[10px] text-brand-sandstone/50 line-through">
                          ${(pinnedProduct.priceMinor / 100).toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>

                  <Link
                    href={`/marketplace/${pinnedProduct.productId}`}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:brightness-110 text-white font-black text-xs text-center transition-all shadow-md min-h-[36px] flex items-center justify-center flex-shrink-0 cursor-pointer"
                  >
                    Buy Drop
                  </Link>
                </div>
              </div>
            )}

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
          <div className="p-5 surface-card border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <Link
                href={`/profile/${stream.profiles?.username ?? 'creator'}`}
                className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-500 to-brand-goldenHour text-slate-950 font-black flex items-center justify-center text-sm shadow-md flex-shrink-0"
              >
                {(stream.profiles?.display_name ?? 'CO').slice(0, 2).toUpperCase()}
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm sm:text-base font-black text-white leading-snug">{stream.title}</h4>
                </div>
                <p className="text-xs text-brand-sandstone/80 font-bold mt-0.5">
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
                  className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all disabled:opacity-50 cursor-pointer min-h-[44px] flex items-center justify-center ${
                    isFollowing
                      ? 'bg-white/10 text-white border border-white/20 hover:bg-white/15'
                      : 'bg-brand-caribbeanSea hover:brightness-110 text-slate-950 shadow-md'
                  }`}
                >
                  {isFollowing ? 'Following ✓' : '+ Follow Host'}
                </button>
              )}

              {/* Live Gift Modal */}
              <LiveGiftModal livestreamId={stream.id} isAuthenticated={Boolean(user)} />
            </div>
          </div>
        </div>
      </div>

      {/* Live Chat Column (Col 4 on lg, Col 3 on 3xl+) */}
      <div className="lg:col-span-4 3xl:col-span-3 surface-card border border-white/10 rounded-3xl p-5 flex flex-col justify-between shadow-2xl h-[560px] 3xl:h-[680px]">
        {/* Chat Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-brand-caribbeanSea" />
            <h3 className="text-xs font-black uppercase text-white tracking-wider">Live Chat</h3>
          </div>
          <span className="text-[10px] font-bold text-brand-sandstone/70">
            {isLive ? 'Realtime Active' : 'Chat Closed'}
          </span>
        </div>

        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto space-y-3 py-3 pr-1">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-4 text-brand-sandstone/60 space-y-2">
              <MessageSquare className="w-8 h-8 text-white/30 mx-auto" />
              <p className="text-xs font-bold text-white">No messages yet</p>
              <p className="text-[11px] text-brand-sandstone/70">Be the first to say hello to the broadcaster and community!</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`p-3 rounded-2xl text-xs space-y-1 ${
                  msg.isHost
                    ? 'bg-red-500/15 border border-red-500/40 text-white'
                    : 'bg-white/5 border border-white/10 text-brand-sandstone/90'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`font-black ${msg.isHost ? 'text-red-300' : 'text-brand-caribbeanSea'}`}>
                    {msg.display_name}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-brand-sandstone/50">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {user && (user.id === stream.creator_id || user.id === msg.sender_id) && (
                      <button
                        type="button"
                        onClick={() => handleDeleteMessage(msg.id)}
                        className="text-brand-sandstone/40 hover:text-red-400 p-0.5 rounded transition-colors cursor-pointer"
                        title="Delete message"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-white leading-relaxed break-words">{msg.body}</p>
              </div>
            ))
          )}
          <div ref={chatScrollRef} />
        </div>

        {/* Reaction Cannon Bar */}
        <div className="py-2 border-t border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {['❤️', '🔥', '🌴', '👑', '🎉', '🇯🇲', '🇹🇹', '🇩🇴'].map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => triggerReaction(emoji)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-base transition-transform active:scale-125 cursor-pointer"
                title={`Send ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Input */}
        {user ? (
          <form onSubmit={handleSendMessage} className="pt-2 border-t border-white/10 flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Send a message in live chat…"
              className="flex-1 bg-slate-950/80 border border-white/20 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-brand-sandstone/50 focus:outline-none focus:border-brand-caribbeanSea min-h-[40px]"
            />
            <button
              type="submit"
              disabled={!chatInput.trim()}
              className="bg-brand-caribbeanSea hover:brightness-110 text-slate-950 font-black p-2.5 rounded-xl text-xs transition-colors cursor-pointer shadow-md disabled:opacity-50 min-h-[40px] min-w-[40px] flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <div className="pt-2 border-t border-white/10 text-center">
            <Link
              href="/login?redirect=/live"
              className="block bg-white/10 hover:bg-white/15 border border-white/20 text-brand-caribbeanSea font-black py-2.5 rounded-xl text-xs transition-colors min-h-[40px] flex items-center justify-center"
            >
              Sign in to Chat &amp; React
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
