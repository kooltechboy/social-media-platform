'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  Pin,
  Smile,
  MessageSquare,
} from 'lucide-react';
import {
  toggleLikeAction,
  createCommentAction,
  fetchPostCommentsAction,
  deletePostAction,
  deleteCommentAction,
  incrementPostShareAction,
  reportPostAction,
  savePostAction,
  unsavePostAction,
  getSavedPostIdsAction,
} from '../lib/social/actions';
import { translatePostAction } from '../lib/social/translate-actions';
import { createSupabaseBrowserClient } from '../lib/supabase/browser';
import CreatorTipModal from './creator-tip-modal';
import ShoppablePostWidget, { type TaggedProduct } from './shoppable-post-widget';
import UserAvatar from './user-avatar';
import OfficialBadge from './official/official-badge';
import EmojiPickerPopover from './emoji/emoji-picker-popover';
import { useTranslation, LOCALE_DETAILS, LOCALES, Locale } from '@caribbean/localization';
import ReactionPicker from './reactions/reaction-picker';
import type { ReactionType } from './reactions/reaction-picker';
import { toggleReactionAction } from '../lib/social/actions';
import TukubiImage from './ui/tukubi-image';
import TukubiVideoPlayer from './media/tukubi-video-player';
import InteractivePollWidget from './polls/interactive-poll-widget';
import type { PollData } from '../lib/polls/types';
import FeedPost from './feed/feed-post';

export interface FeedPostData {
  id: string;
  authorId?: string;
  author: string;
  handle: string;
  avatarUrl?: string | null;
  verified?: boolean;
  isOfficial?: boolean;
  isPinned?: boolean;
  officialContentType?: string;
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
  poll?: PollData;
}

export interface FeedStreamProps {
  initialPosts: FeedPostData[];
  currentUserId?: string;
  mode?: string;
  nextCursor?: string;
  showTabs?: boolean;
}

export default function FeedStream({
  initialPosts,
  currentUserId,
  mode = 'for_you',
  nextCursor,
  showTabs = false,
}: FeedStreamProps) {
  const router = useRouter();
  const { t, locale } = useTranslation();
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
  const [savedPosts, setSavedPosts] = useState<Set<string>>(
    () => new Set(mode === 'saved' ? initialPosts.map((p) => p.id) : [])
  );

  useEffect(() => {
    if (currentUserId && mode !== 'saved') {
      getSavedPostIdsAction()
        .then((ids) => {
          if (ids && ids.length > 0) {
            setSavedPosts(new Set(ids));
          }
        })
        .catch(() => {});
    }
  }, [currentUserId, mode]);

  const handleSavePost = async (postId: string) => {
    const isSaved = savedPosts.has(postId);
    setSavedPosts((prev) => {
      const next = new Set(prev);
      if (isSaved) next.delete(postId);
      else next.add(postId);
      return next;
    });
    if (isSaved) {
      setShareToast('Post removed from saved bookmarks.');
      await unsavePostAction(postId);
    } else {
      setShareToast('Post saved to bookmarks!');
      await savePostAction(postId);
    }
    setTimeout(() => setShareToast(null), 3000);
  };
  const [confirmDeletePostId, setConfirmDeletePostId] = useState<string | null>(null);
  const [activeEmojiPickerPostId, setActiveEmojiPickerPostId] = useState<string | null>(null);
  const [activeCommentEmojiPickerPostId, setActiveCommentEmojiPickerPostId] = useState<string | null>(null);
  const [customEmojiReactions, setCustomEmojiReactions] = useState<
    Record<string, Array<{ emoji: string; count: number; users: string[] }>>
  >({});

  const [postReactions, setPostReactions] = useState<Record<string, ReactionType | null>>(
    () => Object.fromEntries(initialPosts.map(p => [p.id, p.isUserLiked ? 'like' as ReactionType : null]))
  );
  const [postLikeCounts, setPostLikeCounts] = useState<Record<string, number>>(
    () => Object.fromEntries(initialPosts.map(p => [p.id, p.likes]))
  );

  const handleReaction = async (postId: string, type: ReactionType) => {
    const prev = postReactions[postId];
    const isRemoval = prev === type;
    setPostReactions(r => ({ ...r, [postId]: isRemoval ? null : type }));
    setPostLikeCounts(c => ({
      ...c,
      [postId]: (c[postId] || 0) + (isRemoval ? -1 : prev ? 0 : 1)
    }));
    const result = await toggleReactionAction(postId, type);
    if (result.error) {
      setPostReactions(r => ({ ...r, [postId]: prev ?? null }));
      setPostLikeCounts(c => ({ ...c, [postId]: (c[postId] || 0) + (isRemoval ? 1 : prev ? 0 : -1) }));
    }
  };

  function handleReactToPost(postId: string, emoji: string) {
    setCustomEmojiReactions((prev) => {
      const currentList = prev[postId] || [];
      const existing = currentList.find((r) => r.emoji === emoji);

      let nextList;
      if (existing) {
        if (currentUserId && existing.users.includes(currentUserId)) {
          nextList = currentList
            .map((r) =>
              r.emoji === emoji
                ? { ...r, count: r.count - 1, users: r.users.filter((u) => u !== currentUserId) }
                : r
            )
            .filter((r) => r.count > 0);
        } else {
          nextList = currentList.map((r) =>
            r.emoji === emoji
              ? { ...r, count: r.count + 1, users: [...r.users, currentUserId || 'anon'] }
              : r
          );
        }
      } else {
        nextList = [...currentList, { emoji, count: 1, users: [currentUserId || 'anon'] }];
      }

      return { ...prev, [postId]: nextList };
    });
  }

  // Content Translation State with full multilingual target support
  const [postTranslations, setPostTranslations] = useState<
    Record<
      string,
      {
        translatedText?: string | null;
        sourceLang?: string;
        targetLang?: Locale;
        isTranslating?: boolean;
        isShowingOriginal?: boolean;
        error?: string | null;
      }
    >
  >({});

  async function handleTranslatePost(postId: string, content: string, targetLang: Locale) {
    setPostTranslations((prev) => ({
      ...prev,
      [postId]: {
        ...prev[postId],
        isTranslating: true,
        targetLang,
        error: null,
      },
    }));

    try {
      const data = await translatePostAction(postId, content, targetLang);
      if (data.translation && data.translation.trim() !== content.trim()) {
        setPostTranslations((prev) => ({
          ...prev,
          [postId]: {
            translatedText: data.translation || undefined,
            sourceLang: 'auto',
            targetLang,
            isTranslating: false,
            isShowingOriginal: false,
            error: null,
          },
        }));
      } else {
        setPostTranslations((prev) => ({
          ...prev,
          [postId]: {
            ...prev[postId],
            isTranslating: false,
            error: data.error || t('post.translation_unavailable'),
          },
        }));
      }
    } catch {
      setPostTranslations((prev) => ({
        ...prev,
        [postId]: {
          ...prev[postId],
          isTranslating: false,
          error: t('post.translation_unavailable'),
        },
      }));
    }
  }

  function handleToggleOriginal(postId: string) {
    setPostTranslations((prev) => ({
      ...prev,
      [postId]: {
        ...prev[postId],
        isShowingOriginal: !prev[postId]?.isShowingOriginal,
      },
    }));
  }

  // Creator Tip state
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
    return () => {
      window.removeEventListener('tukubi:new-post', handleNewPost);
    };
  }, []);

  // 2. Reconcile server-refreshed initialPosts with local state
  useEffect(() => {
    if (initialPosts) {
      if (initialPosts.length === 0) {
        setPosts((prev) => prev.filter((p) => p.id.startsWith('temp-') || p.time === 'just now'));
      } else {
        setPosts((prev) => {
          const existingIds = new Set(initialPosts.map((p) => p.id));
          const newlyAddedLocal = prev.filter((p) => !existingIds.has(p.id) && (p.id.startsWith('temp-') || p.time === 'just now'));
          return [...newlyAddedLocal, ...initialPosts];
        });
      }
    }
  }, [initialPosts]);

  // 3. Supabase Realtime subscription for cross-tab / live streaming posts & deletions
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    let filterStr = '';
    
    // Self-executing async function to setup realtime correctly based on mode
    (async () => {
      if (currentUserId && (mode === 'following' || mode === 'for_you')) {
        const { data: follows } = await supabase.from('follows').select('following_id').eq('follower_id', currentUserId);
        const followedIds = follows?.map((f: any) => f.following_id) || [];
        if (followedIds.length > 0) {
           filterStr = `author_id=in.(${followedIds.join(',')})`;
        } else {
           // Follows nobody, unfiltered fallback (though for_you we might want only caribbean fallback, but prompt says: "If followedIds is empty... fall back to unfiltered")
        }
      }

      let channelOpts: any = { event: 'INSERT', schema: 'public', table: 'posts' };
      if (filterStr) {
         channelOpts.filter = filterStr;
      }

      let lastInjectTime = 0;

      const channel = supabase
        .channel('feed_realtime_posts')
        .on(
          'postgres_changes',
          channelOpts,
          async (payload) => {
            const newRow = payload.new as any;
            if (!newRow || !newRow.id) return;
            
            // Rate limit for unfiltered modes
            if (!filterStr && (mode === 'caribbean' || mode === 'latest')) {
               const now = Date.now();
               if (now - lastInjectTime < 5000) return; // skip
               lastInjectTime = now;
            }

          try {
            const { data: postWithProfile } = await supabase
              .from('posts')
              .select('id, author_id, content, created_at, media_urls, cultural_tags, likes_count, comments_count, shares_count, is_official, is_pinned, official_content_type, profiles:profiles!posts_author_id_fkey(display_name, username, avatar_url, is_verified, is_official)')
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
                isOfficial: postWithProfile.is_official || profile?.is_official || false,
                isPinned: postWithProfile.is_pinned || false,
                officialContentType: postWithProfile.official_content_type || undefined,
                location: 'Caribbean 🌴',
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
    })();

    return () => {
      supabase.getChannels().forEach(ch => supabase.removeChannel(ch));
    };
  }, [currentUserId, mode]);

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

  function handleDeletePost(postId: string) {
    setActiveMenuPostId(null);
    setConfirmDeletePostId(postId);
  }

  async function executeDeletePost(postId: string) {
    setConfirmDeletePostId(null);

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
      setShareToast('Post shared to TUKUBI!');
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

  async function handleToggleSave(postId: string) {
    setActiveMenuPostId(null);
    await handleSavePost(postId);
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

  // Posts are already filtered by the server based on mode
  const displayedPosts = posts;

  return (
    <div className="space-y-6">
      {/* Optional Feed Filter Tab Bar (when showTabs requested) */}
      {showTabs && (
        <div className="flex gap-2 sm:gap-4 border-b border-slate-800 pb-2 overflow-x-auto scrollbar-none" role="tablist">
          {[
            { id: 'for_you', label: t('feed.for_you') },
            { id: 'following', label: 'Following' },
            { id: 'caribbean', label: t('feed.caribbean') },
            { id: 'communities', label: t('nav.communities') },
          ].map((tab) => {
            const isActive = mode === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => router.replace(`/?mode=${tab.id}`)}
                className={`pb-2 md:pb-2.5 whitespace-nowrap text-xs md:text-sm font-black transition-all relative focus-visible:outline-none px-1 md:px-2 ${
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
      )}

      {/* Share Toast */}
      {shareToast && (
        <div className="p-3.5 rounded-2xl bg-brand-caribbeanSea/20 border border-brand-caribbeanSea/40 text-brand-caribbeanSea text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle className="w-4 h-4 text-brand-caribbeanSea" />
          <span>{shareToast}</span>
        </div>
      )}

      {/* Feed Stream */}
      <div className="space-y-4">
        {displayedPosts.length === 0 ? (
          <div className="p-8 sm:p-12 text-center glass-aerospace rounded-3xl space-y-3 border border-white/10 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-brand-caribbeanSea/10 border border-brand-caribbeanSea/25 flex items-center justify-center mx-auto text-brand-caribbeanSea">
              <Globe className="w-6 h-6" />
            </div>
            <h4 className="text-base font-black text-white">No Caribbean updates in this channel yet</h4>
            <p className="text-xs sm:text-sm text-brand-sandstone/65 max-w-md mx-auto leading-relaxed">
              Connect with fellow islanders, follow creators across the diaspora, or create your first post above!
            </p>
          </div>
        ) : (
          displayedPosts.map((post) => (
            <div key={post.id} className="relative">
              {/* Accessible messaging touchpoint for screen readers and direct communication */}
              <span className="sr-only">
                <Link href={`/messages?u=${post.handle}`}>Message Author</Link>
              </span>
              <FeedPost
                post={post}
                currentUserId={currentUserId}
                isSaved={savedPosts.has(post.id)}
                onSavePost={handleSavePost}
              onToggleReaction={handleReaction}
              currentReaction={postReactions[post.id]}
              likeCount={postLikeCounts[post.id]}
              onReactWithEmoji={handleReactToPost}
              customEmojiList={customEmojiReactions[post.id]}
              onShare={handleShare}
              onDeletePost={handleDeletePost}
              onReportPost={(postId) => {
                setReportModalPostId(postId);
                setActiveMenuPostId(null);
              }}
              onTipCreator={setTipTarget}
              isCommentsExpanded={expandedCommentsPostId === post.id}
              onToggleComments={handleToggleComments}
              commentList={commentLists[post.id]}
              commentInput={commentInputs[post.id] || ''}
              onCommentInputChange={(postId, text) =>
                setCommentInputs((prev) => ({ ...prev, [postId]: text }))
              }
              onSubmitComment={handleSubmitComment}
              isSubmittingComment={isSubmittingComment === post.id}
              onDeleteComment={handleDeleteComment}
              replyingTo={replyingTo[post.id]}
              onSetReplyingTo={(postId, target) =>
                setReplyingTo((prev) => ({ ...prev, [postId]: target }))
              }
              translation={postTranslations[post.id]}
              onTranslatePost={handleTranslatePost}
              onToggleOriginalTranslation={handleToggleOriginal}
            />
          </div>
        ))
        )}
      </div>

      {/* Creator Tip Modal */}
      {tipTarget && (
        <CreatorTipModal
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

      {/* Delete Confirmation Modal */}
      {confirmDeletePostId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-brand-dusk border border-slate-700/80 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 rounded-2xl bg-rose-500/20 border border-rose-500/30">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-base text-brand-sandstone">Delete Post</h3>
            </div>
            <p className="text-xs text-brand-sandstone/70 leading-relaxed">
              Are you sure you want to delete this post? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeletePostId(null)}
                className="px-4 py-2 rounded-2xl text-xs font-bold text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => executeDeletePost(confirmDeletePostId)}
                className="px-4 py-2 rounded-2xl text-xs font-black bg-rose-600 hover:bg-rose-500 text-white transition-colors shadow-lg shadow-rose-600/20"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Load More */}
      {nextCursor && (
        <div className="pt-4 pb-8 flex justify-center">
          <button
            onClick={() => router.push(`/?mode=${mode}&cursor=${nextCursor}`)}
            className="px-6 md:px-8 py-2 md:py-2.5 min-h-[42px] md:min-h-[46px] rounded-full glass hover:bg-white/10 transition-colors text-sm md:text-base font-bold text-slate-200"
          >
            Load more
          </button>
        </div>
      )}
    </div>
  );
}

