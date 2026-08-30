'use client';

import React, { useState, useEffect } from 'react';
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
  MoreHorizontal,
  Trash2,
  Flag,
  Bookmark,
  Link2,
  X,
  AlertCircle,
} from 'lucide-react';
import {
  toggleLikeAction,
  createCommentAction,
  fetchPostCommentsAction,
  deletePostAction,
  deleteCommentAction,
  incrementPostShareAction,
  reportPostAction,
} from '../lib/social/actions';
import { createSupabaseBrowserClient } from '../lib/supabase/browser';
import SpotPayTipModal from './spotpay-tip-modal';
import ShoppablePostWidget, { type TaggedProduct } from './shoppable-post-widget';
import UserAvatar from './user-avatar';

export interface FeedPostData {
  id: string;
  authorId?: string;
  author: string;
  handle: string;
  avatarUrl?: string | null;
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

export default function FeedStream({ initialPosts, currentUserId }: FeedStreamProps) {
  const [activeTab, setActiveTab] = useState<'caribbean' | 'foryou' | 'diaspora' | 'creator'>('caribbean');
  const [posts, setPosts] = useState<FeedPostData[]>(initialPosts);
  const [expandedCommentsPostId, setExpandedCommentsPostId] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [commentLists, setCommentLists] = useState<Record<string, any[]>>({});
  const [isSubmittingComment, setIsSubmittingComment] = useState<string | null>(null);
  const [shareToast, setShareToast] = useState<string | null>(null);
  const [activeMenuPostId, setActiveMenuPostId] = useState<string | null>(null);
  const [reportModalPostId, setReportModalPostId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState<string>('spam');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [savedPostIds, setSavedPostIds] = useState<Set<string>>(new Set());

  // SpotPay Tip state
  const [tipTarget, setTipTarget] = useState<{ name: string; handle: string } | null>(null);

  // 1. Listen for immediate post-creation events from UniversalComposer
  useEffect(() => {
    function handleNewPost(event: Event) {
      const customEvent = event as CustomEvent<{ post: FeedPostData }>;
      if (customEvent.detail?.post) {
        const newPost = customEvent.detail.post;
        setPosts((prev) => {
          if (prev.some((p) => p.id === newPost.id)) {
            return prev;
          }
          return [newPost, ...prev];
        });
      }
    }

    window.addEventListener('tukubi:new-post', handleNewPost);
    window.addEventListener('tukubi:new-post', handleNewPost);
    return () => {
      window.removeEventListener('tukubi:new-post', handleNewPost);
      window.removeEventListener('tukubi:new-post', handleNewPost);
    };
  }, []);

  // 2. Reconcile server-refreshed initialPosts with local state
  useEffect(() => {
    if (initialPosts && initialPosts.length > 0) {
      setPosts((prev) => {
        const existingIds = new Set(initialPosts.map((p) => p.id));
        const newlyAddedLocal = prev.filter((p) => !existingIds.has(p.id));
        return [...newlyAddedLocal, ...initialPosts];
      });
    }
  }, [initialPosts]);

  // 3. Supabase Realtime subscription for cross-tab / live streaming posts & deletions
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    const channel = supabase
      .channel('feed_realtime_posts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts' },
        async (payload) => {
          const newRow = payload.new as any;
          if (!newRow || !newRow.id) return;

          try {
            const { data: postWithProfile } = await supabase
              .from('posts')
              .select('id, author_id, content, created_at, media_urls, cultural_tags, likes_count, comments_count, shares_count, profiles(display_name, username, avatar_url, is_verified)')
              .eq('id', newRow.id)
              .maybeSingle();

            if (postWithProfile) {
              const rawProfile = postWithProfile.profiles;
              const profile = Array.isArray(rawProfile) ? rawProfile[0] : rawProfile;

              const livePost: FeedPostData = {
                id: postWithProfile.id,
                authorId: postWithProfile.author_id,
                author: profile?.display_name || 'Caribbean Member',
                handle: profile?.username || 'member',
                verified: profile?.is_verified ?? true,
                location: 'Tukubi Network 🌴',
                time: 'just now',
                content: postWithProfile.content || '',
                mediaUrls: postWithProfile.media_urls || [],
                culturalTags: postWithProfile.cultural_tags || [],
                likes: postWithProfile.likes_count || 0,
                reposts: postWithProfile.shares_count || 0,
                comments: postWithProfile.comments_count || 0,
                category: 'caribbean',
              };

              setPosts((prev) => {
                if (prev.some((p) => p.id === livePost.id)) return prev;
                return [livePost, ...prev];
              });
            }
          } catch {
            // Ignore realtime fetch errors
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'posts' },
        (payload) => {
          const oldRow = payload.old as any;
          if (oldRow?.id) {
            setPosts((prev) => prev.filter((p) => p.id !== oldRow.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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

  const [replyingTo, setReplyingTo] = useState<{ [postId: string]: { commentId: string; authorName: string } | null }>({});
  const [shareModalPost, setShareModalPost] = useState<FeedPostData | null>(null);

  async function handleSubmitComment(e: React.FormEvent, postId: string) {
    e.preventDefault();
    const commentText = (commentInputs[postId] || '').trim();
    if (!commentText) return;

    const parentId = replyingTo[postId]?.commentId;

    setIsSubmittingComment(postId);
    try {
      const res = await createCommentAction(postId, commentText, parentId);
      if (res.success && res.comment) {
        setCommentLists((prev) => ({
          ...prev,
          [postId]: [...(prev[postId] || []), res.comment],
        }));
        setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
        setReplyingTo((prev) => ({ ...prev, [postId]: null }));
        setPosts((prev) =>
          prev.map((p) => (p.id === postId ? { ...p, comments: p.comments + 1 } : p))
        );
      }
    } finally {
      setIsSubmittingComment(null);
    }
  }

  async function handleDeleteComment(commentId: string, postId: string) {
    setCommentLists((prev) => ({
      ...prev,
      [postId]: (prev[postId] || []).filter((c) => c.id !== commentId),
    }));
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, comments: Math.max(0, p.comments - 1) } : p))
    );

    try {
      await deleteCommentAction(commentId, postId);
    } catch {
      // Revert if fetch fails
      const res = await fetchPostCommentsAction(postId);
      if (res.comments) {
        setCommentLists((prev) => ({ ...prev, [postId]: res.comments }));
      }
    }
  }

  async function handleDeletePost(postId: string) {
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) return;
    setActiveMenuPostId(null);

    // Optimistically remove from state
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    setShareToast('Post deleted successfully.');
    setTimeout(() => setShareToast(null), 3000);

    try {
      const res = await deletePostAction(postId);
      if (!res.success) {
        setShareToast(res.error || 'Failed to delete post.');
        setTimeout(() => setShareToast(null), 4000);
      }
    } catch {
      setShareToast('Error deleting post.');
      setTimeout(() => setShareToast(null), 4000);
    }
  }

  function handleShare(post: FeedPostData) {
    setShareModalPost(post);
  }

  async function handleExecuteShare(
    post: FeedPostData,
    shareType: 'copy_link' | 'native' | 'whatsapp' | 'twitter' | 'facebook' | 'repost'
  ) {
    const postUrl = typeof window !== 'undefined' ? `${window.location.origin}/#${post.id}` : '';
    const shareText = `Check out this post by ${post.author} on Tukubi: "${post.content.slice(0, 100)}..."`;

    if (shareType === 'copy_link') {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(postUrl);
        setShareToast('Post link copied to clipboard!');
        setTimeout(() => setShareToast(null), 3000);
      }
    } else if (shareType === 'native') {
      if (navigator.share) {
        try {
          await navigator.share({
            title: `Tukubi — ${post.author}'s post`,
            text: shareText,
            url: postUrl,
          });
        } catch (err: any) {
          if (err.name !== 'AbortError') console.error('Error sharing:', err);
        }
      }
    } else if (shareType === 'whatsapp') {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${postUrl}`)}`, '_blank');
    } else if (shareType === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(postUrl)}`, '_blank');
    } else if (shareType === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`, '_blank');
    } else if (shareType === 'repost') {
      setShareToast('Post shared to your Tukubi network!');
      setTimeout(() => setShareToast(null), 3000);
    }

    setShareModalPost(null);

    // Increment share counter in database & UI
    setPosts((prev) =>
      prev.map((p) => (p.id === post.id ? { ...p, reposts: p.reposts + 1 } : p))
    );

    try {
      const dbType = shareType === 'repost' ? 'internal' : shareType === 'copy_link' ? 'copy_link' : 'external';
      await incrementPostShareAction(post.id, dbType);
    } catch {
      // Ignore
    }
  }

  function handleToggleSave(postId: string) {
    setSavedPostIds((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
        setShareToast('Post removed from saved bookmarks.');
      } else {
        next.add(postId);
        setShareToast('Post saved to bookmarks!');
      }
      return next;
    });
    setActiveMenuPostId(null);
    setTimeout(() => setShareToast(null), 3000);
  }

  async function handleReportSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reportModalPostId) return;

    setIsSubmittingReport(true);
    try {
      const res = await reportPostAction(reportModalPostId, reportReason);
      if (res.success) {
        setShareToast('Report submitted for safety review.');
        setReportModalPostId(null);
      } else {
        setShareToast(res.error || 'Failed to submit report.');
      }
    } catch {
      setShareToast('Report submission failed.');
    } finally {
      setIsSubmittingReport(false);
      setTimeout(() => setShareToast(null), 4000);
    }
  }

  // Filter posts based on active tab
  const displayedPosts = posts.filter((p) => {
    if (activeTab === 'caribbean') return true;
    if (activeTab === 'foryou') {
      return p.likes > 200 || p.verified || (currentUserId && p.authorId === currentUserId);
    }
    if (activeTab === 'diaspora') {
      return (
        p.location?.includes('US') ||
        p.location?.includes('CA') ||
        p.location?.includes('UK') ||
        p.location?.includes('Diaspora') ||
        p.category === 'diaspora' ||
        p.culturalTags?.includes('diaspora')
      );
    }
    if (activeTab === 'creator') {
      return (
        p.tag?.includes('Vibes') ||
        p.tag?.includes('Soca') ||
        p.tag?.includes('Sound') ||
        p.category === 'creator' ||
        p.culturalTags?.includes('creator') ||
        p.culturalTags?.includes('music')
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Feed Filter Tab Bar */}
      <div className="flex gap-2 sm:gap-4 border-b border-slate-800 pb-2 overflow-x-auto scrollbar-none" role="tablist">
        {[
          { id: 'caribbean', label: 'Caribbean' },
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
                  <Link
                    href={`/profile/${post.handle}`}
                    className="hover:scale-105 transition-transform shrink-0"
                    aria-label={`View profile for ${post.author}`}
                  >
                    <UserAvatar
                      src={post.avatarUrl}
                      name={post.author}
                      size="md"
                    />
                  </Link>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Link
                        href={`/profile/${post.handle}`}
                        className="font-extrabold text-sm text-brand-sandstone hover:text-brand-caribbeanSea transition-colors"
                      >
                        {post.author}
                      </Link>
                      {post.verified && <CheckCircle className="w-3.5 h-3.5 text-brand-caribbeanSea fill-brand-caribbeanSea/20" />}
                      <Link
                        href={`/profile/${post.handle}`}
                        className="text-xs text-brand-sandstone/40 hover:text-brand-sandstone/70 transition-colors"
                      >
                        @{post.handle}
                      </Link>
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

                <div className="flex items-center gap-2 relative">
                  {post.tag && (
                    <Link
                      href={`/explore?q=${encodeURIComponent(post.tag.replace('#', ''))}`}
                      className="text-[10px] font-black px-2.5 py-1 rounded-full bg-brand-caribbeanSea/10 hover:bg-brand-caribbeanSea/20 text-brand-caribbeanSea border border-brand-caribbeanSea/20 transition-colors"
                    >
                      {post.tag}
                    </Link>
                  )}

                  {/* Post Options Menu Button */}
                  <button
                    type="button"
                    aria-label="Post options"
                    onClick={() => setActiveMenuPostId(activeMenuPostId === post.id ? null : post.id)}
                    className="p-1.5 rounded-full text-brand-sandstone/60 hover:text-brand-sandstone hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-caribbeanSea"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>

                  {/* Dropdown Menu */}
                  {activeMenuPostId === post.id && (
                    <div className="absolute right-0 top-8 z-30 w-44 rounded-2xl bg-brand-dusk border border-slate-700 shadow-2xl p-1.5 space-y-1 animate-fadeIn text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          handleShare(post);
                          setActiveMenuPostId(null);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-slate-200 hover:bg-white/10 flex items-center gap-2 font-semibold transition-colors"
                      >
                        <Link2 className="w-3.5 h-3.5 text-brand-caribbeanSea" />
                        <span>Copy Link</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleSave(post.id)}
                        className="w-full text-left px-3 py-2 rounded-xl text-slate-200 hover:bg-white/10 flex items-center gap-2 font-semibold transition-colors"
                      >
                        <Bookmark className={`w-3.5 h-3.5 ${savedPostIds.has(post.id) ? 'fill-brand-goldenHour text-brand-goldenHour' : 'text-slate-400'}`} />
                        <span>{savedPostIds.has(post.id) ? 'Saved' : 'Save Post'}</span>
                      </button>

                      {currentUserId && post.authorId === currentUserId ? (
                        <button
                          type="button"
                          onClick={() => handleDeletePost(post.id)}
                          className="w-full text-left px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-950/50 flex items-center gap-2 font-bold transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                          <span>Delete Post</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setReportModalPostId(post.id);
                            setActiveMenuPostId(null);
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl text-amber-400 hover:bg-amber-950/50 flex items-center gap-2 font-semibold transition-colors"
                        >
                          <Flag className="w-3.5 h-3.5 text-amber-400" />
                          <span>Report Content</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
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
                  aria-label={post.isUserLiked ? 'Unlike post' : 'Like post'}
                  onClick={() => handleToggleLike(post.id)}
                  className={`flex items-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rose-400 rounded-lg px-1 ${
                    post.isUserLiked ? 'text-rose-400 font-bold' : 'hover:text-rose-400'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${post.isUserLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                  <span>{post.likes}</span>
                </button>

                {/* Comments Toggle */}
                <button
                  type="button"
                  aria-label="View or add comments"
                  onClick={() => handleToggleComments(post.id)}
                  className={`flex items-center gap-1.5 hover:text-brand-caribbeanSea transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-caribbeanSea rounded-lg px-1 ${
                    expandedCommentsPostId === post.id ? 'text-brand-caribbeanSea font-bold' : ''
                  }`}
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{post.comments}</span>
                </button>

                {/* Share Button */}
                <button
                  type="button"
                  aria-label="Share post"
                  onClick={() => handleShare(post)}
                  className="flex items-center gap-1.5 hover:text-brand-sunriseCoral transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-sunriseCoral rounded-lg px-1"
                >
                  <Share2 className="w-4 h-4" />
                  <span>{post.reposts > 0 ? post.reposts : 'Share'}</span>
                </button>

                {/* SpotPay Tip Trigger */}
                <button
                  type="button"
                  aria-label={`Send SpotPay Tip to ${post.author}`}
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
                  {/* List of Comments & Threaded Replies */}
                  <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                    {(commentLists[post.id] || []).length === 0 ? (
                      <p className="text-xs text-brand-sandstone/40 italic py-1">No comments yet. Start the conversation!</p>
                    ) : (
                      // Render root comments
                      (commentLists[post.id] || [])
                        .filter((c) => !c.parent_id)
                        .map((c, i) => {
                          const isCommentAuthor = currentUserId && c.author_id === currentUserId;
                          const replies = (commentLists[post.id] || []).filter((r) => r.parent_id === c.id);

                          return (
                            <div key={c.id || i} className="space-y-2">
                              {/* Parent Comment */}
                              <div className="p-3 rounded-2xl bg-black/30 border border-white/8 space-y-1.5 group hover:border-white/15 transition-colors">
                                <div className="flex items-center justify-between">
                                  {c.profiles?.username ? (
                                    <Link
                                      href={`/profile/${c.profiles.username}`}
                                      className="text-xs font-bold text-slate-200 hover:text-brand-caribbeanSea transition-colors"
                                    >
                                      {c.profiles?.display_name || 'Caribbean Member'}
                                    </Link>
                                  ) : (
                                    <span className="text-xs font-bold text-slate-200">
                                      {c.profiles?.display_name || 'Caribbean Member'}
                                    </span>
                                  )}
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setReplyingTo((prev) => ({
                                          ...prev,
                                          [post.id]: { commentId: c.id, authorName: c.profiles?.display_name || 'Member' },
                                        }))
                                      }
                                      className="text-[10px] text-brand-caribbeanSea hover:underline font-semibold"
                                    >
                                      Reply
                                    </button>
                                    <span className="text-[10px] text-brand-sandstone/40">just now</span>
                                    {isCommentAuthor && (
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteComment(c.id, post.id)}
                                        className="opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-300 transition-opacity p-0.5"
                                        title="Delete comment"
                                        aria-label="Delete comment"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                                <p className="text-xs text-slate-300 leading-relaxed">{c.content}</p>
                              </div>

                              {/* Nested Replies */}
                              {replies.length > 0 && (
                                <div className="ml-5 pl-3 border-l-2 border-brand-caribbeanSea/20 space-y-2">
                                  {replies.map((r, ri) => {
                                    const isReplyAuthor = currentUserId && r.author_id === currentUserId;
                                    return (
                                      <div
                                        key={r.id || ri}
                                        className="p-2.5 rounded-xl bg-black/20 border border-white/5 space-y-1 group"
                                      >
                                        <div className="flex items-center justify-between">
                                          {r.profiles?.username ? (
                                            <Link
                                              href={`/profile/${r.profiles.username}`}
                                              className="text-[11px] font-bold text-brand-sandstone hover:text-brand-caribbeanSea transition-colors"
                                            >
                                              {r.profiles?.display_name || 'Caribbean Member'}
                                            </Link>
                                          ) : (
                                            <span className="text-[11px] font-bold text-brand-sandstone">
                                              {r.profiles?.display_name || 'Caribbean Member'}
                                            </span>
                                          )}
                                          <div className="flex items-center gap-2">
                                            <span className="text-[9px] text-brand-sandstone/40">reply</span>
                                            {isReplyAuthor && (
                                              <button
                                                type="button"
                                                onClick={() => handleDeleteComment(r.id, post.id)}
                                                className="opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-300 transition-opacity p-0.5"
                                                title="Delete reply"
                                                aria-label="Delete reply"
                                              >
                                                <Trash2 className="w-2.5 h-2.5" />
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                        <p className="text-xs text-slate-300">{r.content}</p>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })
                    )}
                  </div>

                  {/* Reply Target Indicator */}
                  {replyingTo[post.id] && (
                    <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-brand-caribbeanSea/10 border border-brand-caribbeanSea/20 text-[11px]">
                      <span className="text-brand-caribbeanSea font-medium">
                        Replying to <strong>@{replyingTo[post.id]?.authorName}</strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => setReplyingTo((prev) => ({ ...prev, [post.id]: null }))}
                        className="text-brand-sandstone/60 hover:text-brand-sandstone"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  {/* Comment Input */}
                  <form onSubmit={(e) => handleSubmitComment(e, post.id)} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={commentInputs[post.id] || ''}
                      onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                      placeholder={
                        replyingTo[post.id]
                          ? `Write a reply to @${replyingTo[post.id]?.authorName}...`
                          : 'Write a supportive reply or feedback...'
                      }
                      className="flex-1 bg-white/8 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-brand-caribbeanSea"
                    />
                    <button
                      type="submit"
                      aria-label="Submit comment"
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

      {/* Report Modal */}
      {reportModalPostId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-brand-dusk border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-black text-sm text-brand-sandstone flex items-center gap-2">
                <Flag className="w-4 h-4 text-amber-400" /> Report Content
              </h3>
              <button
                type="button"
                onClick={() => setReportModalPostId(null)}
                className="p-1.5 rounded-full text-brand-sandstone/60 hover:text-brand-sandstone hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleReportSubmit} className="space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed">
                Why are you reporting this post? Our CaribAI &amp; Trust &amp; Safety team will review the case promptly.
              </p>

              <div className="space-y-2">
                {[
                  { id: 'spam', label: 'Spam, scam, or misleading information' },
                  { id: 'harassment', label: 'Harassment, hate speech, or abuse' },
                  { id: 'inappropriate', label: 'Inappropriate or harmful media' },
                  { id: 'copyright', label: 'Copyright or intellectual property violation' },
                ].map((item) => (
                  <label
                    key={item.id}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs cursor-pointer transition-colors ${
                      reportReason === item.id
                        ? 'bg-brand-caribbeanSea/10 border-brand-caribbeanSea text-brand-caribbeanSea font-bold'
                        : 'bg-brand-twilight/50 border-slate-800 text-slate-300 hover:bg-brand-twilight'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reportReason"
                      value={item.id}
                      checked={reportReason === item.id}
                      onChange={(e) => setReportReason(e.target.value)}
                      className="accent-brand-caribbeanSea"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReportModalPostId(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReport}
                  className="bg-gradient-to-r from-brand-caribbeanSea to-brand-sunriseCoral text-slate-950 font-black px-5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md disabled:opacity-50"
                >
                  {isSubmittingReport ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {shareModalPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-brand-dusk border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-black text-sm text-brand-sandstone flex items-center gap-2">
                <Share2 className="w-4 h-4 text-brand-sunriseCoral" /> Share Post
              </h3>
              <button
                type="button"
                onClick={() => setShareModalPost(null)}
                className="p-1.5 rounded-full text-brand-sandstone/60 hover:text-brand-sandstone hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 py-1">
              {/* Copy Link Option */}
              <button
                type="button"
                onClick={() => handleExecuteShare(shareModalPost, 'copy_link')}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-brand-twilight/60 border border-slate-800 hover:border-brand-caribbeanSea/40 hover:bg-brand-twilight transition-colors text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-brand-caribbeanSea/10 text-brand-caribbeanSea flex items-center justify-center">
                    <Link2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-200 group-hover:text-brand-sandstone">Copy Link to Post</p>
                    <p className="text-[10px] text-brand-sandstone/40">Direct link to share anywhere</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-1 rounded bg-slate-800 text-slate-300">Copy</span>
              </button>

              {/* Native Mobile Share if available */}
              {typeof navigator !== 'undefined' && 'share' in navigator && (
                <button
                  type="button"
                  onClick={() => handleExecuteShare(shareModalPost, 'native')}
                  className="w-full flex items-center justify-between p-3 rounded-2xl bg-brand-twilight/60 border border-slate-800 hover:border-brand-sunriseCoral/40 hover:bg-brand-twilight transition-colors text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-brand-sunriseCoral/10 text-brand-sunriseCoral flex items-center justify-center">
                      <Share2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-200 group-hover:text-brand-sandstone">Device Share Menu</p>
                      <p className="text-[10px] text-brand-sandstone/40">AirDrop, SMS, Nearby Share &amp; apps</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-1 rounded bg-slate-800 text-slate-300">Open</span>
                </button>
              )}

              {/* Social Channels Grid */}
              <div className="grid grid-cols-3 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleExecuteShare(shareModalPost, 'whatsapp')}
                  className="p-3 rounded-2xl bg-emerald-950/30 border border-emerald-800/30 hover:border-emerald-500/50 hover:bg-emerald-900/40 text-center space-y-1 transition-all"
                >
                  <div className="text-lg">💬</div>
                  <p className="text-[11px] font-bold text-emerald-300">WhatsApp</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleExecuteShare(shareModalPost, 'twitter')}
                  className="p-3 rounded-2xl bg-sky-950/30 border border-sky-800/30 hover:border-sky-500/50 hover:bg-sky-900/40 text-center space-y-1 transition-all"
                >
                  <div className="text-lg">𝕏</div>
                  <p className="text-[11px] font-bold text-sky-300">X / Twitter</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleExecuteShare(shareModalPost, 'facebook')}
                  className="p-3 rounded-2xl bg-blue-950/30 border border-blue-800/30 hover:border-blue-500/50 hover:bg-blue-900/40 text-center space-y-1 transition-all"
                >
                  <div className="text-lg">👥</div>
                  <p className="text-[11px] font-bold text-blue-300">Facebook</p>
                </button>
              </div>

              {/* Internal Repost */}
              <button
                type="button"
                onClick={() => handleExecuteShare(shareModalPost, 'repost')}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl bg-gradient-to-r from-brand-caribbeanSea/20 to-brand-sunriseCoral/20 border border-brand-caribbeanSea/30 hover:bg-brand-caribbeanSea/30 text-brand-sandstone font-extrabold text-xs transition-colors mt-2"
              >
                <Repeat className="w-4 h-4 text-brand-caribbeanSea" /> Repost to My Caribbean Feed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

