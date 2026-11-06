'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  X,
  Send,
  Loader2,
  Trash2,
  CornerDownRight,
  Smile,
  CheckCircle,
  MessageCircle,
} from 'lucide-react';
import UserAvatar from '../user-avatar';
import EmojiPickerPopover from '../emoji/emoji-picker-popover';
import type { FeedPostData } from '../feed-stream';

export interface MobileCommentsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  post: FeedPostData;
  currentUserId?: string;
  currentUserAvatar?: string | null;
  currentUserName?: string;
  commentList?: any[];
  onSubmitComment: (e: React.FormEvent, postId: string) => void;
  isSubmittingComment?: boolean;
  commentInput: string;
  onCommentInputChange: (postId: string, text: string) => void;
  onDeleteComment?: (commentId: string, postId: string) => void;
  replyingTo?: { commentId: string; authorName: string } | null;
  onSetReplyingTo: (postId: string, target: { commentId: string; authorName: string } | null) => void;
}

export default function MobileCommentsSheet({
  isOpen,
  onClose,
  post,
  currentUserId,
  currentUserAvatar,
  currentUserName = 'You',
  commentList = [],
  onSubmitComment,
  isSubmittingComment = false,
  commentInput,
  onCommentInputChange,
  onDeleteComment,
  replyingTo,
  onSetReplyingTo,
}: MobileCommentsSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Prevent background feed scrolling while bottom sheet is open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Focus input on open or when replying
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen, replyingTo]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const rootComments = commentList.filter((c) => !c.parent_id);
  const totalComments = commentList.length;

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-end animate-fadeIn md:hidden"
      role="dialog"
      aria-modal="true"
      aria-label={`Comments on post by ${post.author}`}
      onClick={(e) => {
        if (sheetRef.current && !sheetRef.current.contains(e.target as Node)) {
          onClose();
        }
      }}
    >
      <div
        ref={sheetRef}
        className="w-full bg-[#0B1424] border-t border-white/[0.12] rounded-t-3xl shadow-2xl flex flex-col max-h-[88vh] h-[85vh] animate-slideUp overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle / Pill */}
        <div className="pt-2.5 pb-1 flex justify-center shrink-0">
          <div className="w-10 h-1 rounded-full bg-white/20" aria-hidden="true" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.08] shrink-0">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-[#00C2A8]" />
            <h3 className="font-semibold text-[15px] text-[#F8FAFC]">
              Comments
              <span className="ml-1.5 text-xs text-[#94A3B8] font-normal">
                ({totalComments})
              </span>
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-[#94A3B8] hover:text-white flex items-center justify-center transition-colors"
            aria-label="Close comments"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Comment List */}
        <div
          ref={listRef}
          className="flex-1 overflow-y-auto px-4 py-3 space-y-3.5 overscroll-contain"
        >
          {rootComments.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mx-auto text-[#00C2A8]">
                <MessageCircle className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-[#F8FAFC]">No comments yet</p>
              <p className="text-xs text-[#94A3B8] max-w-xs mx-auto">
                Be the first to share your thoughts with the Caribbean community!
              </p>
            </div>
          ) : (
            rootComments.map((c) => {
              const cProfile = Array.isArray(c.profiles) ? c.profiles[0] : c.profiles;
              const isCommentAuthor = Boolean(currentUserId && c.author_id === currentUserId);
              const replies = commentList.filter((r) => r.parent_id === c.id);

              return (
                <div key={c.id} className="space-y-2">
                  {/* Root comment */}
                  <div className="flex items-start gap-2.5">
                    <UserAvatar
                      src={cProfile?.avatar_url}
                      name={cProfile?.display_name || 'Member'}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-3 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <Link
                            href={`/profile/${cProfile?.username || ''}`}
                            onClick={onClose}
                            className="font-semibold text-xs text-[#F8FAFC] hover:text-[#00C2A8] transition-colors truncate"
                          >
                            {cProfile?.display_name || 'Caribbean Member'}
                          </Link>
                          {isCommentAuthor && onDeleteComment && (
                            <button
                              type="button"
                              onClick={() => onDeleteComment(c.id, post.id)}
                              className="text-white/40 hover:text-rose-400 p-1 transition-colors"
                              title="Delete comment"
                              aria-label="Delete comment"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-[#E8EDF5] leading-relaxed whitespace-pre-wrap break-words">
                          {c.content}
                        </p>
                      </div>

                      {/* Reply button */}
                      <div className="flex items-center gap-3 px-1 pt-1 text-[11px] text-[#94A3B8]">
                        <button
                          type="button"
                          onClick={() =>
                            onSetReplyingTo(post.id, {
                              commentId: c.id,
                              authorName: cProfile?.display_name || 'Member',
                            })
                          }
                          className="font-medium hover:text-[#00C2A8] transition-colors"
                        >
                          Reply
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Nested replies */}
                  {replies.length > 0 && (
                    <div className="pl-8 space-y-2">
                      {replies.map((reply) => {
                        const rProfile = Array.isArray(reply.profiles) ? reply.profiles[0] : reply.profiles;
                        const isReplyAuthor = Boolean(currentUserId && reply.author_id === currentUserId);

                        return (
                          <div key={reply.id} className="flex items-start gap-2">
                            <CornerDownRight className="w-3.5 h-3.5 text-white/30 shrink-0 mt-2" />
                            <UserAvatar
                              src={rProfile?.avatar_url}
                              name={rProfile?.display_name || 'Member'}
                              size="xs"
                            />
                            <div className="flex-1 min-w-0 bg-white/[0.03] border border-white/[0.05] rounded-xl p-2.5 space-y-1">
                              <div className="flex items-center justify-between gap-2">
                                <Link
                                  href={`/profile/${rProfile?.username || ''}`}
                                  onClick={onClose}
                                  className="font-semibold text-[11px] text-[#F8FAFC] hover:text-[#00C2A8] truncate"
                                >
                                  {rProfile?.display_name || 'Member'}
                                </Link>
                                {isReplyAuthor && onDeleteComment && (
                                  <button
                                    type="button"
                                    onClick={() => onDeleteComment(reply.id, post.id)}
                                    className="text-white/40 hover:text-rose-400 p-0.5 transition-colors"
                                    title="Delete reply"
                                    aria-label="Delete reply"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                              <p className="text-[11px] text-[#E8EDF5] leading-relaxed whitespace-pre-wrap break-words">
                                {reply.content}
                              </p>
                            </div>
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

        {/* Pinned Bottom Input Bar */}
        <div className="border-t border-white/[0.08] bg-[#070D1A]/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] space-y-2 shrink-0">
          {/* Replying banner */}
          {replyingTo && (
            <div className="flex items-center justify-between px-2 py-1 rounded-lg bg-[#00C2A8]/10 border border-[#00C2A8]/20 text-[11px] text-[#00C2A8]">
              <span className="truncate">
                Replying to <strong className="font-semibold">{replyingTo.authorName}</strong>
              </span>
              <button
                type="button"
                onClick={() => onSetReplyingTo(post.id, null)}
                className="text-white/60 hover:text-white ml-2"
                aria-label="Cancel reply"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          <form
            onSubmit={(e) => onSubmitComment(e, post.id)}
            className="flex items-center gap-2"
          >
            <UserAvatar src={currentUserAvatar} name={currentUserName} size="sm" />
            <div className="flex-1 relative flex items-center">
              <input
                ref={inputRef}
                type="text"
                value={commentInput}
                onChange={(e) => onCommentInputChange(post.id, e.target.value)}
                placeholder={
                  replyingTo
                    ? `Reply to ${replyingTo.authorName}...`
                    : 'Add a comment...'
                }
                className="w-full h-10 pl-3.5 pr-10 rounded-full bg-white/[0.05] border border-white/[0.08] text-xs text-white placeholder-[#7C8AA0] focus:outline-none focus:border-[#00C2A8]/60 focus:ring-2 focus:ring-[#00C2A8]/10 transition-colors"
              />
              <div className="absolute right-2.5">
                <EmojiPickerPopover
                  onSelectEmoji={(emoji) =>
                    onCommentInputChange(post.id, `${commentInput}${emoji}`)
                  }
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isSubmittingComment || !commentInput.trim()}
              className="w-10 h-10 rounded-full bg-gradient-to-r from-[#00C2A8] to-[#0EA5E9] text-[#070D1A] flex items-center justify-center font-bold disabled:opacity-40 transition-all active:scale-95 shrink-0"
              aria-label="Post comment"
            >
              {isSubmittingComment ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4 -ml-0.5" />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
