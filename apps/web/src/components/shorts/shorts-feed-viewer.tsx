'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Film, Music, Plus, MessageCircle, Share2, X, Send, Copy, Check, MessageSquare
} from 'lucide-react';
import ShortCard, { type ShortItem } from './short-card';
import ShortReportModal from './short-report-modal';
import CreateShortModal from './create-short-modal';
import {
  postShortCommentAction,
  recordShortShareAction,
  recordShortViewAction,
  saveShortAction,
  unsaveShortAction,
} from '../../lib/media/short-actions';

interface CommentItem {
  id: string;
  user: string;
  handle: string;
  avatar: string;
  text: string;
  time: string;
}

interface ShortsFeedViewerProps {
  initialShorts: ShortItem[];
  user: {
    id: string;
    displayName: string;
    username?: string;
  } | null;
}

export default function ShortsFeedViewer({ initialShorts, user }: ShortsFeedViewerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams?.get('tab') || 'for_you';
  const currentCategory = searchParams?.get('category') || '';

  const effectiveShorts = initialShorts || [];
  const [shorts, setShorts] = useState<ShortItem[]>(effectiveShorts);
  const [isMuted, setIsMuted] = useState(true);
  const [activeShortId, setActiveShortId] = useState<string | null>(effectiveShorts[0]?.id || null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Synchronize initial shorts on prop change
  useEffect(() => {
    setShorts(initialShorts || []);
    if (initialShorts && initialShorts.length > 0) {
      setActiveShortId(initialShorts[0].id);
    } else {
      setActiveShortId(null);
    }
  }, [initialShorts]);

  // Handle ?create=true deep query param
  useEffect(() => {
    if (searchParams?.get('create') === 'true') {
      setIsCreateModalOpen(true);
    }
  }, [searchParams]);

  // Likes & Social state
  const [likesState, setLikesState] = useState<Record<string, { count: number; liked: boolean }>>(() => {
    const initial: Record<string, { count: number; liked: boolean }> = {};
    for (const s of effectiveShorts) {
      const numeric = parseInt(s.likes.replace(/[^0-9]/g, ''), 10) || 0;
      initial[s.id] = { count: numeric, liked: s.initialLiked ?? false };
    }
    return initial;
  });

  const [followingState, setFollowingState] = useState<Record<string, boolean>>({});
  const [savedShorts, setSavedShorts] = useState<Set<string>>(new Set());

  const handleSaveShort = async (shortId: string) => {
    const isSaved = savedShorts.has(shortId);
    setSavedShorts(prev => {
      const next = new Set(prev);
      if (isSaved) next.delete(shortId); else next.add(shortId);
      return next;
    });
    if (isSaved) {
      await unsaveShortAction(shortId);
    } else {
      await saveShortAction(shortId);
    }
  };

  // Comments state
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [activeCommentsShortId, setActiveCommentsShortId] = useState<string | null>(null);
  const [commentsByShort, setCommentsByShort] = useState<Record<string, CommentItem[]>>({});
  const [newCommentText, setNewCommentText] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);

  // Share state
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [activeShareShortId, setActiveShareShortId] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Report state
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [activeReportShortId, setActiveReportShortId] = useState<string | null>(null);

  // IntersectionObserver for active Short
  useEffect(() => {
    const options = { root: null, rootMargin: '0px', threshold: 0.6 };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('data-short-id');
          if (id) {
            setActiveShortId(id);
            void recordShortViewAction(id, 3);
          }
        }
      });
    }, options);
    const elements = document.querySelectorAll('.short-container');
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [shorts]);

  // Keyboard navigation: ArrowDown / ArrowUp to move between Shorts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        const currentIdx = shorts.findIndex(s => s.id === activeShortId);
        if (currentIdx < shorts.length - 1) {
          const nextId = shorts[currentIdx + 1].id;
          const el = document.querySelector(`[data-short-id="${nextId}"]`);
          el?.scrollIntoView({ behavior: 'smooth' });
        }
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        const currentIdx = shorts.findIndex(s => s.id === activeShortId);
        if (currentIdx > 0) {
          const prevId = shorts[currentIdx - 1].id;
          const el = document.querySelector(`[data-short-id="${prevId}"]`);
          el?.scrollIntoView({ behavior: 'smooth' });
        }
      } else if (e.key === 'm' || e.key === 'M') {
        toggleMute();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shorts, activeShortId]);

  const toggleMute = useCallback(() => setIsMuted(prev => !prev), []);

  const handleTabChange = (tab: string) => {
    const params = new URLSearchParams(searchParams?.toString());
    params.set('tab', tab);
    router.push(`?${params.toString()}`);
  };

  const handleCategoryChange = (cat: string) => {
    const params = new URLSearchParams(searchParams?.toString());
    if (cat) {
      params.set('category', cat);
    } else {
      params.delete('category');
    }
    router.push(`?${params.toString()}`);
  };

  const handleOpenComments = (shortId: string) => {
    setActiveCommentsShortId(shortId);
    setIsCommentsOpen(true);
  };

  const handleOpenShare = (shortId: string) => {
    setActiveShareShortId(shortId);
    setIsShareModalOpen(true);
  };

  const handleOpenReport = (shortId: string) => {
    setActiveReportShortId(shortId);
    setIsReportModalOpen(true);
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !activeCommentsShortId) return;
    setIsPostingComment(true);
    const newComment: CommentItem = {
      id: `c_${Date.now()}`,
      user: user?.displayName ?? 'Caribbean Friend',
      handle: user?.username ?? 'caribbean_guest',
      avatar: '🌴',
      text: newCommentText.trim(),
      time: 'Just now',
    };
    setCommentsByShort(prev => ({
      ...prev,
      [activeCommentsShortId]: [newComment, ...(prev[activeCommentsShortId] ?? [])],
    }));
    setNewCommentText('');
    await postShortCommentAction(activeCommentsShortId, newComment.text);
    setIsPostingComment(false);
  };

  const handleCopyShareLink = () => {
    const url = typeof window !== 'undefined' && activeShareShortId
      ? `${window.location.origin}/shorts?id=${activeShareShortId}`
      : '';
    if (navigator.clipboard) {
      void navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
    if (activeShareShortId) void recordShortShareAction(activeShareShortId, 'copy_link');
  };

  const tabs = [
    { id: 'for_you', label: 'For You' },
    { id: 'following', label: 'Following' },
    { id: 'trending', label: 'Trending' },
    { id: 'caribbean', label: 'Caribbean' },
  ];

  const categories = [
    { id: '', label: 'All' },
    { id: 'music', label: 'Music & Dance' },
    { id: 'food', label: 'Food & Cooking' },
    { id: 'comedy', label: 'Comedy' },
    { id: 'travel', label: 'Island Life' },
    { id: 'culture', label: 'Culture & Heritage' },
  ];

  const currentComments = activeCommentsShortId ? (commentsByShort[activeCommentsShortId] ?? []) : [];

  return (
    <div className="flex flex-col h-full w-full bg-black relative overflow-hidden">
      {/* Top Navigation & Category Chips Bar */}
      <div className="flex-none z-30 px-4 md:px-6 py-2.5 bg-gradient-to-b from-black/90 via-black/60 to-transparent absolute top-0 left-0 right-0 space-y-2 pointer-events-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto scrollbar-hide py-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                aria-label={`Tab ${tab.label}`}
                className={`text-xs sm:text-sm font-black transition-colors whitespace-nowrap cursor-pointer ${
                  currentTab === tab.id
                    ? 'text-white border-b-2 border-brand-sunriseCoral pb-0.5'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-3.5 py-1.5 bg-gradient-to-r from-brand-sunriseCoral to-rose-500 text-slate-950 font-black text-xs rounded-xl hover:opacity-95 flex items-center gap-1.5 transition-all shadow-md shadow-brand-sunriseCoral/20 cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" /> Create Short
          </button>
        </div>

        {/* Discovery category chips */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-0.5">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                currentCategory === cat.id
                  ? 'bg-white text-slate-950 shadow-sm'
                  : 'bg-black/50 text-white/70 hover:text-white border border-white/10 hover:border-white/20'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Snap Scroll Stage */}
      <div
        className="flex-1 w-full h-full overflow-y-scroll snap-y snap-mandatory overscroll-none scrollbar-hide"
        style={{ touchAction: 'pan-y' }}
      >
        {shorts.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center z-10 relative">
            <div className="surface-card rounded-3xl p-8 sm:p-10 max-w-md w-full border border-white/15 shadow-2xl space-y-5 bg-[#0D1322]/90 backdrop-blur-xl">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-sunriseCoral/20 to-rose-500/20 border border-brand-sunriseCoral/40 flex items-center justify-center mx-auto text-brand-sunriseCoral shadow-lg">
                <Film className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl sm:text-2xl font-black text-white">No Shorts in this feed yet</h2>
                <p className="text-xs sm:text-sm text-brand-sandstone/80 leading-relaxed">
                  Be the first creator to publish short-form video moments, carnival rhythms, and island culture to the global Caribbean diaspora.
                </p>
              </div>
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-brand-sunriseCoral to-rose-500 hover:brightness-110 text-slate-950 font-black px-6 py-3 rounded-2xl text-xs sm:text-sm transition-all shadow-md shadow-brand-sunriseCoral/20 min-h-[44px] cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Create First Short
                </button>
                <Link
                  href="/sounds"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-white/20 hover:bg-white/10 text-white font-bold px-5 py-3 rounded-2xl text-xs sm:text-sm transition-all min-h-[44px]"
                >
                  <Music className="w-4 h-4 text-brand-goldenHour" /> Browse Sounds
                </Link>
              </div>
            </div>
          </div>
        ) : (
          shorts.map((short, idx) => {
            const isActive = activeShortId === short.id;
            const isNext = shorts[idx - 1]?.id === activeShortId || shorts[idx + 1]?.id === activeShortId;
            return (
              <ShortCard
                key={short.id}
                short={short}
                isActive={isActive}
                isNext={isNext}
                isMuted={isMuted}
                toggleMute={toggleMute}
                user={user}
                likesState={likesState}
                setLikesState={setLikesState}
                followingState={followingState}
                setFollowingState={setFollowingState}
                onOpenComments={handleOpenComments}
                onOpenShare={handleOpenShare}
                onOpenReport={handleOpenReport}
                isSaved={savedShorts.has(short.id)}
                onSave={handleSaveShort}
              />
            );
          })
        )}
      </div>

      {/* Slide-over Comments Drawer */}
      {isCommentsOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-md bg-[#0D1322] border-l border-slate-800 h-full p-5 flex flex-col justify-between shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black text-brand-sandstone flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-brand-caribbeanSea" /> Comments ({currentComments.length})
              </h3>
              <button
                onClick={() => setIsCommentsOpen(false)}
                aria-label="Close Comments"
                className="w-7 h-7 rounded-full bg-brand-dusk border border-slate-800 flex items-center justify-center text-brand-sandstone/60 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {currentComments.length === 0 ? (
                <p className="text-xs text-brand-sandstone/40 text-center py-10">No comments yet. Start the conversation!</p>
              ) : (
                currentComments.map((comment) => (
                  <div key={comment.id} className="flex items-start gap-2.5 p-2 rounded-xl bg-brand-twilight/50 text-xs">
                    <span className="text-xl">{comment.avatar}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-200">@{comment.handle}</span>
                        <span className="text-[10px] text-brand-sandstone/40">{comment.time}</span>
                      </div>
                      <p className="text-slate-300 mt-1">{comment.text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <form onSubmit={handlePostComment} className="pt-3 border-t border-slate-800 flex items-center gap-2">
              <input
                type="text"
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder="Add a Caribbean comment..."
                aria-label="Comment input"
                className="flex-1 bg-brand-twilight border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
              />
              <button
                type="submit"
                aria-label="Send Comment"
                disabled={isPostingComment || !newCommentText.trim()}
                className="bg-rose-500 hover:bg-rose-400 disabled:opacity-50 text-slate-950 p-2 rounded-xl transition-colors cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D1322] border border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-brand-sandstone flex items-center gap-2">
                <Share2 className="w-4 h-4 text-brand-sunriseCoral" /> Share TUKUBI Short
              </h3>
              <button
                onClick={() => setIsShareModalOpen(false)}
                aria-label="Close Share Modal"
                className="w-7 h-7 rounded-full bg-brand-dusk border border-slate-800 flex items-center justify-center text-brand-sandstone/60 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-300">Share this short moment with diaspora communities and friends.</p>
            <div className="space-y-2">
              <button
                onClick={handleCopyShareLink}
                aria-label="Copy Link"
                className="w-full bg-brand-twilight border border-slate-700 hover:border-slate-500 text-slate-200 font-bold p-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copiedLink ? 'Link Copied to Clipboard!' : 'Copy Short Link'}
              </button>

              {(() => {
                const targetShort = shorts.find((s) => s.id === activeShareShortId);
                if (!targetShort?.handle) return null;
                return (
                  <Link
                    href={`/messages?u=${encodeURIComponent(targetShort.handle)}`}
                    className="w-full bg-brand-caribbeanSea/20 border border-brand-caribbeanSea/40 hover:bg-brand-caribbeanSea/30 text-brand-caribbeanSea font-bold p-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Message @{targetShort.handle}
                  </Link>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {isReportModalOpen && activeReportShortId && (
        <ShortReportModal
          isOpen={isReportModalOpen}
          shortId={activeReportShortId}
          onClose={() => setIsReportModalOpen(false)}
        />
      )}

      {/* Create Short Modal */}
      <CreateShortModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        user={user}
      />
    </div>
  );
}
