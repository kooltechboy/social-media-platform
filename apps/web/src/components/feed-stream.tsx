'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Heart,
  Repeat,
  MessageCircle,
  Share2,
  Wallet,
  CheckCircle,
  Sparkles,
  Send,
  Loader2,
  Image as ImageIcon,
  Film,
  MapPin,
  Globe,
} from 'lucide-react';
import { toggleLikeAction, createCommentAction, fetchPostCommentsAction } from '../lib/social/actions';
import SpotPayTipModal from './spotpay-tip-modal';
import ShoppablePostWidget, { type TaggedProduct } from './shoppable-post-widget';

export interface FeedPostData {
  id: string;
  author: string;
  handle: string;
  verified?: boolean;
  location?: string;
  time: string;
  content: string;
  mediaUrls?: string[];
  likes: number;
  reposts: number;
  comments: number;
  tag?: string;
  culturalTags?: string[];
  isUserLiked?: boolean;
  category?: 'caribbean' | 'foryou' | 'diaspora' | 'creator';
  taggedProduct?: TaggedProduct;
}

interface FeedStreamProps {
  initialPosts: FeedPostData[];
  currentUserId?: string;
}

export default function FeedStream({ initialPosts }: FeedStreamProps) {
  const [activeTab, setActiveTab] = useState<'caribbean' | 'foryou' | 'diaspora' | 'creator'>('caribbean');
  const [posts, setPosts] = useState<FeedPostData[]>(initialPosts);
  const [expandedCommentsPostId, setExpandedCommentsPostId] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [commentLists, setCommentLists] = useState<Record<string, any[]>>({});
  const [isSubmittingComment, setIsSubmittingComment] = useState<string | null>(null);
  const [shareToast, setShareToast] = useState<string | null>(null);

  // SpotPay Tip state
  const [tipTarget, setTipTarget] = useState<{ name: string; handle: string } | null>(null);

  async function handleToggleLike(postId: string) {
    // Optimistic UI update
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const willLike = !p.isUserLiked;
        return {
          ...p,
          isUserLiked: willLike,
          likes: willLike ? p.likes + 1 : Math.max(0, p.likes - 1),
        };
      })
    );

    try {
      await toggleLikeAction(postId);
    } catch {
      // Revert optimistic update on error
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id !== postId) return p;
          const wasLiked = !p.isUserLiked;
          return {
            ...p,
            isUserLiked: wasLiked,
            likes: wasLiked ? p.likes + 1 : Math.max(0, p.likes - 1),
          };
        })
      );
    }
  }

  async function handleToggleComments(postId: string) {
    if (expandedCommentsPostId === postId) {
      setExpandedCommentsPostId(null);
      return;
    }

    setExpandedCommentsPostId(postId);
    if (!commentLists[postId]) {
      const res = await fetchPostCommentsAction(postId);
      if (res.comments) {
        setCommentLists((prev) => ({ ...prev, [postId]: res.comments }));
      }
    }
  }

  async function handleSubmitComment(e: React.FormEvent, postId: string) {
    e.preventDefault();
    const commentText = (commentInputs[postId] || '').trim();
    if (!commentText) return;

    setIsSubmittingComment(postId);
    try {
      const res = await createCommentAction(postId, commentText);
      if (res.success && res.comment) {
        setCommentLists((prev) => ({
          ...prev,
          [postId]: [...(prev[postId] || []), res.comment],
        }));
        setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
        setPosts((prev) =>
          prev.map((p) => (p.id === postId ? { ...p, comments: p.comments + 1 } : p))
        );
      }
    } finally {
      setIsSubmittingComment(null);
    }
  }

  function handleShare(post: FeedPostData) {
    const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/#${post.id}` : '';
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setShareToast(`Post link copied to clipboard!`);
      setTimeout(() => setShareToast(null), 3000);
    }
  }

  // Filter posts based on active tab
  const displayedPosts = posts.filter((p) => {
    if (activeTab === 'caribbean') return true;
    if (activeTab === 'foryou') return p.likes > 200 || p.verified;
    if (activeTab === 'diaspora') return p.location?.includes('US') || p.location?.includes('CA') || p.location?.includes('UK') || p.location?.includes('Diaspora');
    if (activeTab === 'creator') return p.tag?.includes('Vibes') || p.tag?.includes('Soca') || p.tag?.includes('Sound');
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Feed Filter Tab Bar */}
      <div className="flex gap-2 sm:gap-4 border-b border-slate-800 pb-2 overflow-x-auto scrollbar-none" role="tablist">
        {[
          { id: 'caribbean', label: 'Caribbean Now' },
          { id: 'foryou', label: 'For You' },
          { id: 'diaspora', label: 'Diaspora Hubs' },
          { id: 'creator', label: 'Creators & Music' },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`pb-2 whitespace-nowrap text-xs font-black transition-all relative focus-visible:outline-none px-1 ${
                isActive ? 'text-brand-caribbeanSea' : 'text-brand-sandstone/60 hover:text-slate-200'
              }`}
            >
              {tab.label}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand-caribbeanSea via-brand-sunriseCoral to-brand-goldenHour rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Share Toast */}
      {shareToast && (
        <div className="p-3 rounded-2xl bg-brand-caribbeanSea/20 border border-brand-caribbeanSea/40 text-brand-caribbeanSea text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle className="w-4 h-4 text-brand-caribbeanSea" />
          <span>{shareToast}</span>
        </div>
      )}

      {/* Feed Stream */}
      <div className="space-y-4">
        {displayedPosts.length === 0 ? (
          <div className="p-8 text-center glass rounded-2xl space-y-2">
            <Globe className="w-8 h-8 text-slate-600 mx-auto" />
            <h4 className="text-sm font-black text-slate-300">No posts in this channel yet</h4>
            <p className="text-xs text-brand-sandstone/40">Be the first to share an update to the Caribbean diaspora!</p>
          </div>
        ) : (
          displayedPosts.map((post) => (
            <article
              key={post.id}
              id={post.id}
              className="glass rounded-2xl p-5 space-y-4 hover:border-white/15 transition-all"
            >
              {/* Post Author Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-brand-goldenHour via-rose-500 to-brand-caribbeanSea p-0.5 shadow-md flex-shrink-0">
                    <div className="w-full h-full bg-brand-twilight rounded-2xl flex items-center justify-center font-black text-xs text-brand-sandstone">
                      {post.author.slice(0, 2).toUpperCase()}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-extrabold text-sm text-brand-sandstone">{post.author}</h4>
                      {post.verified && <CheckCircle className="w-3.5 h-3.5 text-brand-caribbeanSea fill-brand-caribbeanSea/20" />}
                      <span className="text-xs text-brand-sandstone/40">@{post.handle}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-brand-sandstone/60 mt-0.5">
                      {post.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-brand-sunriseCoral" />
                          {post.location}
                        </span>
                      )}
                      <span>•</span>
                      <span>{post.time}</span>
                    </div>
                  </div>
                </div>

                {post.tag && (
                  <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-brand-caribbeanSea/10 text-brand-caribbeanSea border border-brand-caribbeanSea/20">
                    {post.tag}
                  </span>
                )}
              </div>

              {/* Content Body */}
              <p className="text-sm text-slate-200 leading-relaxed font-medium whitespace-pre-wrap">
                {post.content}
              </p>

              {/* Media Gallery Previews */}
              {post.mediaUrls && post.mediaUrls.length > 0 && (
                <div
                  className={`grid gap-2 rounded-2xl overflow-hidden ${
                    post.mediaUrls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
                  }`}
                >
                  {post.mediaUrls.map((url, idx) => (
                    <div key={idx} className="relative bg-brand-twilight rounded-xl overflow-hidden max-h-96">
                      {url.endsWith('.mp4') || url.includes('video') ? (
                        <video src={url} controls className="w-full h-full object-cover" />
                      ) : (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={url}
                          alt="Post media"
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Shoppable Tagged Product (Social Commerce) */}
              {post.taggedProduct && (
                <ShoppablePostWidget product={post.taggedProduct} />
              )}

              {/* Interaction Bar */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800/70 text-brand-sandstone/60 text-xs">
                {/* Like Button */}
                <button
                  type="button"
                  onClick={() => handleToggleLike(post.id)}
                  className={`flex items-center gap-1.5 transition-colors ${
                    post.isUserLiked ? 'text-rose-400 font-bold' : 'hover:text-rose-400'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${post.isUserLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                  <span>{post.likes}</span>
                </button>

                {/* Comments Toggle */}
                <button
                  type="button"
                  onClick={() => handleToggleComments(post.id)}
                  className={`flex items-center gap-1.5 hover:text-brand-caribbeanSea transition-colors ${
                    expandedCommentsPostId === post.id ? 'text-brand-caribbeanSea font-bold' : ''
                  }`}
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{post.comments}</span>
                </button>

                {/* Share Button */}
                <button
                  type="button"
                  onClick={() => handleShare(post)}
                  className="flex items-center gap-1.5 hover:text-brand-sunriseCoral transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Share</span>
                </button>

                {/* SpotPay Tip Trigger */}
                <button
                  type="button"
                  onClick={() => setTipTarget({ name: post.author, handle: post.handle })}
                  className="flex items-center gap-1.5 text-brand-sunriseCoral font-extrabold hover:text-emerald-300 transition-all bg-brand-sunriseCoral/10 hover:bg-brand-sunriseCoral/20 px-3 py-1 rounded-full border border-brand-sunriseCoral/20 shadow-sm"
                >
                  <Wallet className="w-3.5 h-3.5" />
                  <span>Tip SpotPay</span>
                </button>
              </div>

              {/* Inline Comments Section */}
              {expandedCommentsPostId === post.id && (
                <div className="pt-3 border-t border-slate-800/80 space-y-3 animate-fadeIn">
                  {/* List of Comments */}
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {(commentLists[post.id] || []).length === 0 ? (
                      <p className="text-xs text-brand-sandstone/40 italic py-1">No comments yet. Start the conversation!</p>
                    ) : (
                      (commentLists[post.id] || []).map((c, i) => (
                        <div key={c.id || i} className="p-3 rounded-2xl bg-black/30 border border-white/8 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-200">
                              {c.profiles?.display_name || 'Caribbean Member'}
                            </span>
                            <span className="text-[10px] text-brand-sandstone/40">just now</span>
                          </div>
                          <p className="text-xs text-slate-300">{c.content}</p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Comment Input */}
                  <form onSubmit={(e) => handleSubmitComment(e, post.id)} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={commentInputs[post.id] || ''}
                      onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                      placeholder="Write a supportive reply or feedback..."
                      className="flex-1 bg-white/8 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-white/30"
                    />
                    <button
                      type="submit"
                      disabled={isSubmittingComment === post.id || !commentInputs[post.id]?.trim()}
                      className="bg-brand-caribbeanSea hover:bg-brand-caribbeanSea text-slate-950 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1 transition-all disabled:opacity-50"
                    >
                      {isSubmittingComment === post.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </form>
                </div>
              )}
            </article>
          ))
        )}
      </div>

      {/* SpotPay Tip Modal */}
      {tipTarget && (
        <SpotPayTipModal
          isOpen={!!tipTarget}
          onClose={() => setTipTarget(null)}
          creatorName={tipTarget.name}
          creatorHandle={tipTarget.handle}
        />
      )}
    </div>
  );
}

