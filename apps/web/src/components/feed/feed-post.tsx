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
  Star,
  EyeOff,
  ThumbsDown,
  Edit3,
} from 'lucide-react';
import UserAvatar from '../user-avatar';
import OfficialBadge from '../official/official-badge';
import ReactionPicker, { type ReactionType } from '../reactions/reaction-picker';
import EmojiPickerPopover from '../emoji/emoji-picker-popover';
import { createSupabaseBrowserClient } from '../../lib/supabase/browser';
import { hidePostAction, unhidePostAction, updatePostAction } from '../../lib/social/actions';
import TukubiImage from '../ui/tukubi-image';
import TukubiVideoPlayer from '../media/tukubi-video-player';
import TukubiGallery from '../media/tukubi-gallery';
import ShoppablePostWidget from '../shoppable-post-widget';
import InteractivePollWidget from '../polls/interactive-poll-widget';
import { useTranslation, LOCALE_DETAILS, LOCALES, type Locale } from '@caribbean/localization';
import type { FeedPostData } from '../feed-stream';

export interface FeedPostProps {
  post: FeedPostData;
  currentUserId?: string;
  isSaved?: boolean;
  onSavePost: (postId: string) => void;
  onToggleReaction: (postId: string, type: ReactionType) => void;
  currentReaction?: ReactionType | null;
  likeCount?: number;
  onReactWithEmoji?: (postId: string, emoji: string) => void;
  customEmojiList?: Array<{ emoji: string; count: number; users: string[] }>;
  onShare: (post: FeedPostData) => void;
  onDeletePost: (postId: string) => void;
  onReportPost: (postId: string) => void;
  onTipCreator: (target: { name: string; handle: string }) => void;
  onHidePost?: (postId: string, reason: 'hide' | 'not_interested') => void;
  onUnhidePost?: (postId: string) => void;

  // Comments
  isCommentsExpanded?: boolean;
  onToggleComments: (postId: string) => void;
  commentList?: any[];
  commentInput?: string;
  onCommentInputChange: (postId: string, text: string) => void;
  onSubmitComment: (e: React.FormEvent, postId: string) => void;
  isSubmittingComment?: boolean;
  onDeleteComment: (commentId: string, postId: string) => void;
  replyingTo?: { commentId: string; authorName: string } | null;
  onSetReplyingTo: (postId: string, target: { commentId: string; authorName: string } | null) => void;

  // Translation
  translation?: {
    translatedText?: string | null;
    sourceLang?: string;
    targetLang?: Locale;
    isTranslating?: boolean;
    isShowingOriginal?: boolean;
    error?: string | null;
  };
  onTranslatePost: (postId: string, content: string, targetLang: Locale) => void;
  onToggleOriginalTranslation: (postId: string) => void;
}

export default function FeedPost({
  post,
  currentUserId,
  isSaved = false,
  onSavePost,
  onToggleReaction,
  currentReaction = null,
  likeCount = post.likes,
  onReactWithEmoji,
  customEmojiList = [],
  onShare,
  onDeletePost,
  onReportPost,
  onTipCreator,
  onHidePost,
  onUnhidePost,

  // Comments
  isCommentsExpanded = false,
  onToggleComments,
  commentList = [],
  commentInput = '',
  onCommentInputChange,
  onSubmitComment,
  isSubmittingComment = false,
  onDeleteComment,
  replyingTo = null,
  onSetReplyingTo,

  // Translation
  translation,
  onTranslatePost,
  onToggleOriginalTranslation,
}: FeedPostProps) {
  const { t, locale } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isCommentEmojiPickerOpen, setIsCommentEmojiPickerOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [isNotInterested, setIsNotInterested] = useState(false);
  const [isFavorite, setIsFavorite] = useState(Boolean(post.isAuthorFavorited));

  const isAuthor = Boolean(currentUserId && post.authorId === currentUserId);
  const rootComments = commentList.filter((c) => !c.parent_id);

  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(post.content || '');
  const [displayedContent, setDisplayedContent] = useState(post.content || '');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const handleSaveEdit = async () => {
    if (isSubmittingEdit) return;
    setIsSubmittingEdit(true);
    setEditError(null);
    try {
      const res = await updatePostAction(post.id, { content: editedContent });
      if (res.error) {
        setEditError(res.error);
      } else {
        setDisplayedContent(editedContent);
        setIsEditing(false);
      }
    } catch (err: any) {
      setEditError(err?.message || 'Failed to update post');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  if (isHidden) {
    return (
      <div className="glass rounded-2xl p-4 text-center text-xs text-brand-sandstone/60 border border-white/5 flex items-center justify-between animate-fadeIn">
        <span>Post hidden from your feed.</span>
        <button
          type="button"
          onClick={async () => {
            setIsHidden(false);
            if (onUnhidePost) {
              onUnhidePost(post.id);
            } else {
              await unhidePostAction(post.id);
            }
          }}
          className="text-brand-caribbeanSea font-bold hover:underline"
        >
          Undo
        </button>
      </div>
    );
  }

  if (isNotInterested) {
    return (
      <div className="glass rounded-2xl p-4 text-center text-xs text-brand-sandstone/60 border border-white/5 flex items-center justify-between animate-fadeIn">
        <span>Thanks for your feedback. We will show fewer posts like this.</span>
        <button
          type="button"
          onClick={async () => {
            setIsNotInterested(false);
            if (onUnhidePost) {
              onUnhidePost(post.id);
            } else {
              await unhidePostAction(post.id);
            }
          }}
          className="text-brand-goldenHour font-bold hover:underline"
        >
          Undo
        </button>
      </div>
    );
  }

  return (
    <article
      id={post.id}
      aria-label={`Post by ${post.author}`}
      className="glass-aerospace rounded-3xl p-5 sm:p-6 space-y-4 hover:border-white/25 transition-all duration-300 relative group overflow-hidden shadow-2xl"
    >
      {/* Specular high-definition light reflection line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

      {/* ────────────────────────────────────────────────────────── */}
      {/* 1. POST HEADER                                            */}
      {/* ────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3.5 min-w-0">
          <Link
            href={`/profile/${post.handle}`}
            className="hover:scale-105 transition-transform shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-caribbeanSea rounded-2xl"
            aria-label={`View profile for ${post.author}`}
          >
            <UserAvatar
              src={post.avatarUrl}
              name={post.author}
              size="md"
            />
          </Link>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Link
                href={`/profile/${post.handle}`}
                className="font-black text-sm sm:text-base md:text-[17px] text-white hover:text-brand-caribbeanSea transition-colors tracking-tight truncate"
              >
                {post.author}
              </Link>

              {post.isOfficial ? (
                <OfficialBadge
                  size="xs"
                  showLabel={true}
                  label={post.handle.toLowerCase() === 'tukubi' ? 'Official TUKUBI' : 'Official'}
                />
              ) : post.verified ? (
                <span title="Verified Member" aria-label="Verified Member" className="inline-flex items-center">
                  <CheckCircle className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-brand-caribbeanSea fill-brand-caribbeanSea/20 drop-shadow-[0_0_6px_rgba(0,180,216,0.5)]" />
                </span>
              ) : null}

              <Link
                href={`/profile/${post.handle}`}
                className="text-xs sm:text-sm font-semibold text-white/50 hover:text-white/80 transition-colors"
              >
                @{post.handle}
              </Link>

              {post.isPinned && (
                <span className="inline-flex items-center gap-1 text-[11px] font-black text-brand-sunriseCoral bg-brand-sunriseCoral/15 px-2.5 py-0.5 rounded-full border border-brand-sunriseCoral/30">
                  <Pin className="w-3 h-3" />
                  Pinned
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs font-medium text-white/60 mt-0.5">
              {post.location && (
                <span className="flex items-center gap-1 text-white/70">
                  <MapPin className="w-3.5 h-3.5 text-brand-sunriseCoral shrink-0" />
                  <span>{post.location}</span>
                </span>
              )}
              <span className="text-white/30">•</span>
              <span>{post.time}</span>
              {post.officialContentType && (
                <>
                  <span className="text-white/30">•</span>
                  <span className="text-[11px] font-bold text-brand-caribbeanSea capitalize px-2 py-0.5 rounded bg-brand-caribbeanSea/10 border border-brand-caribbeanSea/20">
                    {post.officialContentType.replace('_', ' ')}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Header Options */}
        <div className="flex items-center gap-2 relative shrink-0">
          {post.tag && (
            <Link
              href={`/explore?q=${encodeURIComponent(post.tag.replace('#', ''))}`}
              className="text-[11px] sm:text-xs font-black px-2.5 sm:px-3 py-1 rounded-full bg-brand-caribbeanSea/10 hover:bg-brand-caribbeanSea/20 text-brand-caribbeanSea border border-brand-caribbeanSea/20 transition-colors hidden sm:inline-block"
            >
              {post.tag}
            </Link>
          )}

          {/* Contextual Kebab Menu Button */}
          <button
            type="button"
            aria-label="Post options"
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 rounded-full text-brand-sandstone/60 hover:text-brand-sandstone hover:bg-white/10 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-caribbeanSea"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>

          {/* Dropdown Menu */}
          {isMenuOpen && (
            <div className="absolute right-0 top-12 z-30 w-52 rounded-2xl bg-brand-dusk border border-slate-700 shadow-2xl p-1.5 space-y-1 animate-fadeIn text-xs sm:text-sm">
              <button
                type="button"
                onClick={() => {
                  onShare(post);
                  setIsMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2.5 rounded-xl text-slate-200 hover:bg-white/10 flex items-center gap-2.5 font-semibold transition-colors min-h-[40px]"
              >
                <Link2 className="w-4 h-4 text-brand-caribbeanSea" />
                <span>Share / Copy Link</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSavePost(post.id);
                  setIsMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2.5 rounded-xl text-slate-200 hover:bg-white/10 flex items-center gap-2.5 font-semibold transition-colors min-h-[40px]"
              >
                <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-brand-caribbeanSea text-brand-caribbeanSea' : 'text-slate-400'}`} />
                <span>{isSaved ? 'Remove Bookmark' : 'Save Post'}</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  setIsFavorite(!isFavorite);
                  setIsMenuOpen(false);
                  try {
                    const supabase = createSupabaseBrowserClient();
                    if (supabase && currentUserId) {
                      await supabase.rpc('toggle_favorite', {
                        p_target_id: post.authorId,
                        p_target_type: 'creator',
                      });
                    }
                  } catch {}
                }}
                className="w-full text-left px-3 py-2.5 rounded-xl text-slate-200 hover:bg-white/10 flex items-center gap-2.5 font-semibold transition-colors min-h-[40px]"
              >
                <Star className={`w-4 h-4 ${isFavorite ? 'fill-brand-goldenHour text-brand-goldenHour' : 'text-slate-400'}`} />
                <span>{isFavorite ? 'Remove from Favorites' : 'Add Author to Favorites'}</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  setIsHidden(true);
                  setIsMenuOpen(false);
                  if (onHidePost) {
                    onHidePost(post.id, 'hide');
                  } else {
                    await hidePostAction(post.id, 'hide');
                  }
                }}
                className="w-full text-left px-3 py-2.5 rounded-xl text-slate-200 hover:bg-white/10 flex items-center gap-2.5 font-semibold transition-colors min-h-[40px]"
              >
                <EyeOff className="w-4 h-4 text-slate-400" />
                <span>Hide Post</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  setIsNotInterested(true);
                  setIsMenuOpen(false);
                  if (onHidePost) {
                    onHidePost(post.id, 'not_interested');
                  } else {
                    await hidePostAction(post.id, 'not_interested');
                  }
                }}
                className="w-full text-left px-3 py-2.5 rounded-xl text-slate-200 hover:bg-white/10 flex items-center gap-2.5 font-semibold transition-colors min-h-[40px]"
              >
                <ThumbsDown className="w-4 h-4 text-slate-400" />
                <span>Not Interested</span>
              </button>

              {currentUserId !== post.authorId && post.handle && (
                <Link
                  href={`/messages?u=${encodeURIComponent(post.handle)}`}
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-slate-200 hover:bg-white/10 flex items-center gap-2.5 font-semibold transition-colors min-h-[40px]"
                >
                  <MessageSquare className="w-4 h-4 text-brand-caribbeanSea" />
                  <span>Message Author</span>
                </Link>
              )}

              {isAuthor ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(true);
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-xl text-slate-200 hover:bg-white/10 flex items-center gap-2.5 font-semibold transition-colors min-h-[40px]"
                  >
                    <Edit3 className="w-4 h-4 text-brand-caribbeanSea" />
                    <span>Edit Post</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onDeletePost(post.id);
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-xl text-rose-400 hover:bg-rose-950/50 flex items-center gap-2.5 font-bold transition-colors min-h-[40px]"
                  >
                    <Trash2 className="w-4 h-4 text-rose-400" />
                    <span>Delete Post</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onReportPost(post.id);
                    setIsMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-amber-400 hover:bg-amber-950/50 flex items-center gap-2.5 font-semibold transition-colors min-h-[40px]"
                >
                  <Flag className="w-4 h-4 text-amber-400" />
                  <span>Report Content</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 2. POST CONTENT BODY                                      */}
      {/* ────────────────────────────────────────────────────────── */}
      {isEditing ? (
        <div className="space-y-3 p-4 rounded-2xl bg-black/40 border border-brand-caribbeanSea/30 animate-fadeIn">
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            rows={4}
            className="w-full bg-transparent text-slate-100 placeholder-slate-500 text-sm md:text-base leading-relaxed resize-none focus:outline-none"
            placeholder="Edit your post..."
            aria-label="Edit post content"
          />
          {editError && (
            <p className="text-xs text-rose-400 font-bold">{editError}</p>
          )}
          <div className="flex items-center justify-end gap-2 pt-1 border-t border-white/10">
            <button
              type="button"
              onClick={() => {
                setEditedContent(displayedContent);
                setIsEditing(false);
                setEditError(null);
              }}
              disabled={isSubmittingEdit}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-brand-sandstone/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveEdit}
              disabled={isSubmittingEdit || !editedContent.trim()}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-brand-caribbeanSea to-brand-sunriseCoral text-slate-950 font-black text-xs hover:brightness-110 transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSubmittingEdit ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save</span>
              )}
            </button>
          </div>
        </div>
      ) : (
        <p className="text-base md:text-[17px] text-slate-100 leading-[1.6] font-medium whitespace-pre-wrap">
          {translation?.translatedText && !translation?.isShowingOriginal
            ? translation.translatedText
            : displayedContent}
        </p>
      )}

      {/* Cultural Tags Rail */}
      {post.culturalTags && post.culturalTags.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
          {post.culturalTags.map((t, idx) => (
            <Link
              key={idx}
              href={`/explore?q=${encodeURIComponent(t)}`}
              className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 text-brand-sandstone/70 border border-white/8 transition-colors"
            >
              #{t}
            </Link>
          ))}
        </div>
      )}

      {/* Multilingual Translation Controls */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        {translation?.isTranslating ? (
          <div className="flex items-center gap-2 text-xs text-brand-sandstone/70">
            <Loader2 className="w-4 h-4 animate-spin text-brand-caribbeanSea" />
            <span>{t('post.translating')}</span>
          </div>
        ) : translation?.translatedText ? (
          <div className="w-full p-3 rounded-2xl bg-brand-caribbeanSea/10 border border-brand-caribbeanSea/20 flex flex-wrap items-center justify-between gap-2 text-xs md:text-sm animate-fadeIn">
            <div className="flex items-center gap-2 text-brand-sandstone/85 text-xs">
              <Sparkles className="w-4 h-4 text-brand-caribbeanSea shrink-0" />
              <span>
                {translation?.isShowingOriginal
                  ? 'Showing original'
                  : `Translated to ${
                      LOCALE_DETAILS[translation?.targetLang as Locale]?.nativeName ||
                      translation?.targetLang ||
                      'selected language'
                    }`}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={translation?.targetLang || locale}
                onChange={(e) => onTranslatePost(post.id, post.content, e.target.value as Locale)}
                aria-label="Change translation target language"
                className="bg-brand-twilight/90 border border-brand-caribbeanSea/30 text-xs font-bold text-brand-caribbeanSea rounded-lg px-2.5 py-1 focus:outline-none cursor-pointer"
              >
                {LOCALES.map((code) => (
                  <option key={code} value={code} className="bg-brand-dusk text-slate-200">
                    {LOCALE_DETAILS[code].nativeName}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => onToggleOriginalTranslation(post.id)}
                className="text-xs font-bold text-brand-caribbeanSea hover:underline whitespace-nowrap"
              >
                {translation?.isShowingOriginal ? 'Show Translation' : 'Show Original'}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="relative inline-flex items-center">
              <Globe className="w-4 h-4 text-brand-caribbeanSea mr-1.5 shrink-0" />
              <select
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) {
                    onTranslatePost(post.id, post.content, e.target.value as Locale);
                    e.target.value = '';
                  }
                }}
                aria-label="Translate post to language"
                className="bg-brand-twilight/80 hover:bg-brand-twilight border border-slate-700 hover:border-brand-caribbeanSea/60 text-xs font-semibold text-brand-caribbeanSea rounded-full pl-3 pr-7 py-1.5 focus:outline-none focus:border-brand-caribbeanSea cursor-pointer transition-colors appearance-none min-h-[36px]"
              >
                <option value="" disabled>
                  Translate to ▾
                </option>
                {LOCALES.map((code) => (
                  <option key={code} value={code} className="bg-brand-dusk text-slate-200">
                    {LOCALE_DETAILS[code].nativeName} ({LOCALE_DETAILS[code].name})
                  </option>
                ))}
              </select>
            </div>

            {translation?.error && (
              <span className="text-xs text-rose-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{translation.error}</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 3. POST MEDIA GALLERY                                     */}
      {/* ────────────────────────────────────────────────────────── */}
      {post.mediaUrls && post.mediaUrls.length > 0 && (
        <TukubiGallery
          mediaUrls={post.mediaUrls}
          mediaItems={post.mediaItems}
          altText={`Post by ${post.author}`}
          authorName={post.author}
          className="w-full"
        />
      )}

      {/* Shoppable Tagged Product Widget */}
      {post.taggedProduct && <ShoppablePostWidget product={post.taggedProduct} />}

      {/* Interactive Poll Widget */}
      {post.poll && <InteractivePollWidget initialPoll={post.poll} currentUserId={currentUserId} />}

      {/* ────────────────────────────────────────────────────────── */}
      {/* 4. INTERACTION BAR                                        */}
      {/* ────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-800/70 text-brand-sandstone/70 text-xs sm:text-sm">
        {/* Reaction Picker & Counter */}
        <div className="flex items-center gap-1.5">
          <ReactionPicker
            currentReaction={currentReaction}
            onSelect={(type) => onToggleReaction(post.id, type)}
          />
          <span className="text-xs sm:text-sm font-semibold text-slate-200 tabular-nums">
            {likeCount || 0}
          </span>
        </div>

        {/* Comments Toggle */}
        <button
          type="button"
          aria-label={`View comments (${post.comments})`}
          onClick={() => onToggleComments(post.id)}
          className={`flex items-center gap-1.5 sm:gap-2 hover:text-brand-caribbeanSea transition-colors px-2.5 py-2 min-h-[44px] rounded-xl font-semibold select-none ${
            isCommentsExpanded ? 'text-brand-caribbeanSea font-bold' : ''
          }`}
        >
          <MessageCircle className="w-5 h-5" />
          <span>{post.comments}</span>
        </button>

        {/* Share Button */}
        <button
          type="button"
          aria-label="Share post"
          onClick={() => onShare(post)}
          className="flex items-center gap-1.5 sm:gap-2 hover:text-brand-sunriseCoral transition-colors px-2.5 py-2 min-h-[44px] rounded-xl font-semibold select-none"
        >
          <Share2 className="w-5 h-5" />
          <span>{post.reposts > 0 ? post.reposts : 'Share'}</span>
        </button>

        {/* Bookmark Button */}
        <button
          type="button"
          onClick={() => onSavePost(post.id)}
          className={`p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition-colors ${
            isSaved ? 'text-brand-caribbeanSea' : 'text-slate-400 hover:text-slate-200'
          }`}
          title={isSaved ? 'Unsave post' : 'Save post'}
          aria-label={isSaved ? 'Unsave post' : 'Save post'}
        >
          <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-brand-caribbeanSea' : ''}`} />
        </button>

        {/* Creator Tip Trigger */}
        <button
          type="button"
          aria-label={`Send Tip to ${post.author}`}
          onClick={() => onTipCreator({ name: post.author, handle: post.handle })}
          className="flex items-center gap-1.5 text-brand-sunriseCoral font-extrabold hover:text-emerald-300 transition-all bg-brand-sunriseCoral/10 hover:bg-brand-sunriseCoral/20 px-3 sm:px-4 py-2 min-h-[44px] rounded-full border border-brand-sunriseCoral/25 text-xs sm:text-sm shadow-sm"
        >
          <Wallet className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          <span className="hidden sm:inline">Tip</span>
        </button>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 5. INLINE THREADED COMMENTS SECTION                       */}
      {/* ────────────────────────────────────────────────────────── */}
      {isCommentsExpanded && (
        <div className="pt-3 border-t border-slate-800/80 space-y-3 animate-fadeIn">
          {/* List of Comments & Threaded Replies */}
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {commentList.length === 0 ? (
              <p className="text-xs sm:text-sm text-brand-sandstone/50 italic py-2">
                No comments yet. Start the conversation across the Caribbean!
              </p>
            ) : (
              rootComments.map((c, i) => {
                const cProfile = Array.isArray(c.profiles) ? c.profiles[0] : c.profiles;
                const isCommentAuthor = Boolean(currentUserId && c.author_id === currentUserId);
                const replies = commentList.filter((r) => r.parent_id === c.id);

                return (
                  <div key={c.id || i} className="space-y-2">
                    {/* Root Comment Card */}
                    <div className="p-3.5 rounded-2xl bg-black/30 border border-white/8 space-y-1.5 group hover:border-white/15 transition-colors">
                      <div className="flex items-center justify-between">
                        {cProfile?.username ? (
                          <Link
                            href={`/profile/${cProfile.username}`}
                            className="text-xs sm:text-sm font-bold text-slate-200 hover:text-brand-caribbeanSea transition-colors"
                          >
                            {cProfile?.display_name || 'Caribbean Member'}
                          </Link>
                        ) : (
                          <span className="text-xs sm:text-sm font-bold text-slate-200">
                            {cProfile?.display_name || 'Caribbean Member'}
                          </span>
                        )}

                        <div className="flex items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() =>
                              onSetReplyingTo(post.id, {
                                commentId: c.id,
                                authorName: cProfile?.display_name || 'Member',
                              })
                            }
                            className="text-xs text-brand-caribbeanSea hover:underline font-semibold min-h-[32px] flex items-center"
                          >
                            Reply
                          </button>

                          {!isCommentAuthor && cProfile?.username && (
                            <Link
                              href={`/messages?u=${encodeURIComponent(cProfile.username)}`}
                              className="text-xs text-slate-400 hover:text-brand-caribbeanSea font-semibold flex items-center gap-1 min-h-[32px]"
                              title="Direct message author"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-brand-caribbeanSea" />
                              <span className="hidden sm:inline">Msg</span>
                            </Link>
                          )}

                          <span className="text-xs text-brand-sandstone/40">just now</span>

                          {isCommentAuthor && (
                            <button
                              type="button"
                              onClick={() => onDeleteComment(c.id, post.id)}
                              className="opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-300 transition-opacity p-1 min-w-[32px] min-h-[32px] flex items-center justify-center"
                              title="Delete comment"
                              aria-label="Delete comment"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{c.content}</p>
                    </div>

                    {/* Threaded Nested Replies */}
                    {replies.length > 0 && (
                      <div className="ml-5 pl-3.5 border-l-2 border-brand-caribbeanSea/25 space-y-2">
                        {replies.map((r, ri) => {
                          const rProfile = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
                          const isReplyAuthor = Boolean(currentUserId && r.author_id === currentUserId);
                          return (
                            <div
                              key={r.id || ri}
                              className="p-3 rounded-xl bg-black/20 border border-white/5 space-y-1 group"
                            >
                              <div className="flex items-center justify-between">
                                {rProfile?.username ? (
                                  <Link
                                    href={`/profile/${rProfile.username}`}
                                    className="text-xs font-bold text-brand-sandstone hover:text-brand-caribbeanSea transition-colors"
                                  >
                                    {rProfile?.display_name || 'Caribbean Member'}
                                  </Link>
                                ) : (
                                  <span className="text-xs font-bold text-brand-sandstone">
                                    {rProfile?.display_name || 'Caribbean Member'}
                                  </span>
                                )}

                                <div className="flex items-center gap-2">
                                  {!isReplyAuthor && rProfile?.username && (
                                    <Link
                                      href={`/messages?u=${encodeURIComponent(rProfile.username)}`}
                                      className="text-[11px] text-slate-400 hover:text-brand-caribbeanSea font-semibold flex items-center gap-0.5"
                                      title="Direct message author"
                                    >
                                      <MessageSquare className="w-3 h-3 text-brand-caribbeanSea" />
                                      <span>Msg</span>
                                    </Link>
                                  )}
                                  <span className="text-[11px] text-brand-sandstone/40">reply</span>
                                  {isReplyAuthor && (
                                    <button
                                      type="button"
                                      onClick={() => onDeleteComment(r.id, post.id)}
                                      className="opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-300 transition-opacity p-0.5"
                                      title="Delete reply"
                                      aria-label="Delete reply"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              </div>
                              <p className="text-xs sm:text-sm text-slate-300">{r.content}</p>
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
          {replyingTo && (
            <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-brand-caribbeanSea/10 border border-brand-caribbeanSea/20 text-xs">
              <span className="text-brand-caribbeanSea font-medium">
                Replying to <strong>@{replyingTo.authorName}</strong>
              </span>
              <button
                type="button"
                onClick={() => onSetReplyingTo(post.id, null)}
                className="text-brand-sandstone/60 hover:text-brand-sandstone p-1"
                aria-label="Cancel reply"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Comment Ingest Input Form */}
          <form onSubmit={(e) => onSubmitComment(e, post.id)} className="flex items-center gap-2 relative pt-1">
            <input
              type="text"
              value={commentInput}
              onChange={(e) => onCommentInputChange(post.id, e.target.value)}
              placeholder={
                replyingTo
                  ? `Write a reply to @${replyingTo.authorName}...`
                  : 'Write a supportive reply or feedback...'
              }
              className="flex-1 bg-white/8 border border-white/12 rounded-2xl pl-4 pr-10 py-2.5 min-h-[44px] text-xs sm:text-sm text-white placeholder-white/40 focus:outline-none focus:border-brand-caribbeanSea focus:ring-1 focus:ring-brand-caribbeanSea transition-all"
            />

            {/* Comment Emoji Picker */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsCommentEmojiPickerOpen(!isCommentEmojiPickerOpen)}
                className="p-2.5 text-slate-400 hover:text-amber-300 hover:bg-white/10 rounded-xl transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                title="Add emoji to comment"
                aria-label="Add emoji to comment"
              >
                <Smile className="w-5 h-5" />
              </button>

              <EmojiPickerPopover
                isOpen={isCommentEmojiPickerOpen}
                onClose={() => setIsCommentEmojiPickerOpen(false)}
                onSelectEmoji={(emoji) => {
                  onCommentInputChange(post.id, commentInput + emoji);
                  setIsCommentEmojiPickerOpen(false);
                }}
                position="top"
              />
            </div>

            <button
              type="submit"
              aria-label="Submit comment"
              disabled={isSubmittingComment || !commentInput.trim()}
              className="bg-brand-caribbeanSea hover:bg-[#38BDF8] text-slate-950 font-black px-4 py-2.5 min-h-[44px] rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all disabled:opacity-40 cursor-pointer active:scale-95"
            >
              {isSubmittingComment ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </form>
        </div>
      )}
    </article>
  );
}
