'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  UserPlus,
  UserCheck,
  Check,
  MapPin,
  MessageSquare,
  MoreVertical,
  Shield,
  Share2,
  UserMinus,
  Clock,
  Sparkles,
  Lock,
} from 'lucide-react';
import UserAvatar from '../user-avatar';
import OfficialBadge from '../official/official-badge';
import { type DiscoverProfile } from '../../lib/discovery/actions';
import {
  getRelationshipActionConfig,
  resolveRelationshipBadge,
  formatMutualFriendsCount,
} from '@caribbean/social';

export interface PersonCardProps {
  person: DiscoverProfile;
  currentUserId?: string;
  onFollowToggle?: (userId: string) => Promise<void>;
  onSendFriendRequest?: (userId: string) => Promise<void>;
  onAcceptFriendRequest?: (userId: string) => Promise<void>;
  onDeclineFriendRequest?: (userId: string) => Promise<void>;
  onCancelFriendRequest?: (userId: string) => Promise<void>;
  onUnfriend?: (userId: string) => Promise<void>;
  onBlock?: (userId: string) => Promise<void>;
  isActionPending?: boolean;
  contextMode?: 'discover' | 'friends' | 'requests' | 'following' | 'followers';
}

export default function PersonCard({
  person,
  currentUserId,
  onFollowToggle,
  onSendFriendRequest,
  onAcceptFriendRequest,
  onDeclineFriendRequest,
  onCancelFriendRequest,
  onUnfriend,
  onBlock,
  isActionPending = false,
  contextMode = 'discover',
}: PersonCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showUnfriendConfirm, setShowUnfriendConfirm] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [copied, setCopied] = useState(false);

  const isSelf = currentUserId === person.id;
  const isOfficial =
    person.is_official ||
    person.username?.toLowerCase() === 'tukubi' ||
    person.display_name?.toLowerCase() === 'tukubi';

  const rel = person.relationship;
  const isBlocked = !!rel?.isBlocked;
  const isFollowing = !!rel?.isFollowing;
  const isFollower = !!rel?.isFollower;
  const friendshipStatus = (rel?.friendshipStatus || 'none') as
    | 'none'
    | 'pending_sent'
    | 'pending_received'
    | 'accepted'
    | 'declined';

  const actionConfig = getRelationshipActionConfig({
    isBlocked,
    friendshipStatus,
    isFollowing,
    isFollower,
    isOfficial,
  });

  const relBadge = resolveRelationshipBadge({
    isOfficial,
    friendshipStatus,
    isFollowing,
    isFollower,
  });

  const mutualFriendsText = person.mutual_count
    ? formatMutualFriendsCount(person.mutual_count)
    : null;

  const handleShare = async () => {
    setIsMenuOpen(false);
    const url = `${typeof window !== 'undefined' ? window.location.origin : 'https://tukubi.com'}/profile/${person.username}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${person.display_name} on TUKUBI`,
          text: `Connect with ${person.display_name} on TUKUBI — The Caribbean Connected`,
          url,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore
    }
  };

  const isMessagingDisabled = person.messaging_permission === 'no_one';
  const isMessagingFriendsOnly =
    person.messaging_permission === 'friends' && friendshipStatus !== 'accepted';

  return (
    <div className="surface-card surface-card-interactive rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-4 group relative border border-white/10 hover:border-brand-caribbeanSea/30 transition-all bg-[#140C22]/80 backdrop-blur-md shadow-lg hover:shadow-brand-caribbeanSea/5">
      {/* Top Section: Avatar, Details & Overflow Menu */}
      <div className="flex items-start justify-between gap-3">
        <Link
          href={`/profile/${person.username}`}
          className="flex items-center gap-3.5 min-w-0 flex-1 group/author focus:outline-none"
          aria-label={`View ${person.display_name}'s profile`}
        >
          <UserAvatar
            src={person.avatar_url}
            name={person.display_name}
            size="lg"
            className="ring-2 ring-white/10 group-hover/author:ring-brand-caribbeanSea/50 transition-all shrink-0"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h4 className="text-sm sm:text-base font-extrabold text-white truncate group-hover/author:text-brand-caribbeanSea transition-colors">
                {person.display_name}
              </h4>
              {isOfficial ? (
                <OfficialBadge size="sm" showLabel={false} />
              ) : person.is_verified ? (
                <Check className="w-3.5 h-3.5 text-brand-caribbeanSea shrink-0" aria-label="Verified" />
              ) : null}

              {/* Explicit Member / Friend Relationship Badge */}
              <span
                className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                  relBadge.type === 'official'
                    ? 'bg-gradient-to-r from-brand-caribbeanSea/20 to-brand-sunriseCoral/20 text-brand-caribbeanSea border-brand-caribbeanSea/40'
                    : relBadge.type === 'friend'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-white/5 text-brand-sandstone/70 border-white/10'
                }`}
              >
                {relBadge.label}
              </span>
            </div>

            <p className="text-xs text-brand-sandstone/70 truncate">@{person.username}</p>

            {person.country_name && (
              <span className="text-xs text-brand-sunriseCoral font-semibold flex items-center gap-1 mt-1 truncate">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="truncate">{person.country_name}</span>
              </span>
            )}

            {mutualFriendsText && (
              <span className="text-[11px] text-brand-goldenHour font-bold block mt-0.5 truncate">
                {mutualFriendsText}
              </span>
            )}
          </div>
        </Link>

        {/* Overflow Context Menu */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 rounded-xl text-brand-sandstone/60 hover:text-white hover:bg-white/10 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center focus:outline-none"
            aria-label="More options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 top-10 w-48 bg-[#1D1429] border border-white/15 rounded-2xl p-1.5 shadow-2xl z-30 space-y-1 text-xs animate-fadeIn">
              <button
                type="button"
                onClick={handleShare}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/10 text-brand-sandstone hover:text-white font-bold flex items-center gap-2"
              >
                <Share2 className="w-3.5 h-3.5 text-brand-caribbeanSea" />
                <span>{copied ? 'Link Copied!' : 'Share Profile'}</span>
              </button>

              {!isSelf && friendshipStatus === 'accepted' && onUnfriend && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    setShowUnfriendConfirm(true);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-rose-500/20 text-rose-300 font-bold flex items-center gap-2"
                >
                  <UserMinus className="w-3.5 h-3.5 text-rose-400" />
                  <span>Unfriend</span>
                </button>
              )}

              {!isSelf && onBlock && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    setShowBlockConfirm(true);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-rose-500/20 text-rose-400 font-bold flex items-center gap-2"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Block Member</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bio Snippet */}
      {person.bio ? (
        <p className="text-xs sm:text-sm text-brand-sandstone/80 line-clamp-2 leading-relaxed">
          {person.bio}
        </p>
      ) : person.recommendationReason ? (
        <p className="text-xs text-brand-caribbeanSea/90 italic flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-brand-goldenHour shrink-0" />
          <span className="truncate">{person.recommendationReason}</span>
        </p>
      ) : null}

      {/* Action Buttons Section */}
      {!isSelf && currentUserId && (
        <div className="flex items-center gap-2 pt-3 border-t border-white/10 flex-wrap sm:flex-nowrap">
          {/* 1. Primary Friendship / Request Action */}
          {!isOfficial && (
            <>
              {friendshipStatus === 'accepted' ? (
                <span className="flex-1 text-center text-xs font-bold py-2 px-2.5 rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center justify-center gap-1.5 min-h-[38px]">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Friends</span>
                </span>
              ) : friendshipStatus === 'pending_sent' ? (
                <div className="flex-1 flex items-center gap-1">
                  <span className="flex-1 text-center text-xs font-bold py-2 px-2 rounded-xl bg-white/5 text-brand-sandstone/70 border border-white/10 flex items-center justify-center gap-1 min-h-[38px]">
                    <Clock className="w-3 h-3 text-amber-400" />
                    <span className="truncate">Sent</span>
                  </span>
                  {onCancelFriendRequest && (
                    <button
                      type="button"
                      disabled={isActionPending}
                      onClick={() => onCancelFriendRequest(person.id)}
                      title="Cancel Request"
                      className="text-xs px-2.5 py-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-brand-sandstone hover:text-rose-300 border border-white/10 transition-colors min-h-[38px]"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ) : friendshipStatus === 'pending_received' ? (
                <div className="flex-1 flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={isActionPending}
                    onClick={() => onAcceptFriendRequest?.(person.id)}
                    className="flex-1 text-xs font-black py-2 px-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all min-h-[38px] shadow-sm"
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    disabled={isActionPending}
                    onClick={() => onDeclineFriendRequest?.(person.id)}
                    className="text-xs font-bold py-2 px-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-brand-sandstone border border-white/10 transition-colors min-h-[38px]"
                  >
                    Decline
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={isActionPending}
                  onClick={() => onSendFriendRequest?.(person.id)}
                  className="flex-1 flex items-center justify-center gap-1 text-xs font-black py-2 px-2.5 rounded-xl bg-brand-caribbeanSea hover:brightness-110 text-slate-950 transition-all shadow-sm min-h-[38px]"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Add Friend</span>
                </button>
              )}
            </>
          )}

          {/* 2. One-Way Follow Action */}
          {onFollowToggle && (
            <button
              type="button"
              disabled={isActionPending}
              onClick={() => onFollowToggle(person.id)}
              className={`text-xs font-bold px-3 py-2 rounded-xl transition-all min-h-[38px] shrink-0 ${
                isFollowing
                  ? 'bg-white/10 text-brand-sandstone border border-white/15 hover:bg-rose-500/20 hover:text-rose-300'
                  : isOfficial
                  ? 'flex-1 bg-gradient-to-r from-brand-caribbeanSea to-brand-sunriseCoral text-slate-950 font-black hover:brightness-110 shadow-md'
                  : isFollower
                  ? 'bg-brand-goldenHour hover:brightness-110 text-slate-950 font-black shadow-md'
                  : 'bg-brand-sunriseCoral hover:brightness-110 text-slate-950 font-black shadow-md'
              }`}
            >
              {actionConfig.followLabel}
            </button>
          )}

          {/* 3. Direct Message Link */}
          {isMessagingDisabled ? (
            <button
              type="button"
              disabled
              title="This member isn't accepting new messages"
              className="text-xs font-bold px-3 py-2 rounded-xl bg-white/5 text-brand-sandstone/40 border border-white/5 cursor-not-allowed flex items-center gap-1 min-h-[38px] shrink-0"
            >
              <Lock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Msg</span>
            </button>
          ) : (
            <Link
              href={`/messages?u=${encodeURIComponent(person.username)}`}
              title={
                isMessagingFriendsOnly
                  ? 'This member only receives messages from friends'
                  : `Message @${person.username}`
              }
              className="text-xs font-bold px-3 py-2 rounded-xl bg-white/5 hover:bg-white/15 text-brand-sandstone hover:text-white border border-white/10 transition-colors flex items-center gap-1 min-h-[38px] shrink-0 focus:outline-none"
            >
              <MessageSquare className="w-3.5 h-3.5 text-brand-caribbeanSea" />
              <span>Msg</span>
            </Link>
          )}
        </div>
      )}

      {/* Logged Out CTA */}
      {!currentUserId && (
        <div className="flex items-center gap-2 pt-3 border-t border-white/10">
          <Link
            href={`/login?next=/profile/${person.username}`}
            className="flex-1 text-center text-xs font-bold py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all min-h-[38px] flex items-center justify-center"
          >
            Connect on TUKUBI
          </Link>
        </div>
      )}

      {/* Unfriend Confirmation Dialog */}
      {showUnfriendConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="unfriend-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn"
          onClick={() => setShowUnfriendConfirm(false)}
        >
          <div
            className="bg-[#1D1429] border border-white/20 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400">
                <UserMinus className="w-5 h-5" />
              </div>
              <div>
                <h4 id="unfriend-dialog-title" className="text-base font-extrabold text-white">
                  Remove Friend?
                </h4>
                <p className="text-xs text-brand-sandstone/70">
                  Are you sure you want to unfriend {person.display_name}?
                </p>
              </div>
            </div>
            <p className="text-xs text-brand-sandstone/80 leading-relaxed">
              They will no longer see your friends-only updates, and you will no longer be listed as friends. You will remain members of TUKUBI.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowUnfriendConfirm(false)}
                className="flex-1 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors min-h-[38px]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isActionPending}
                onClick={async () => {
                  setShowUnfriendConfirm(false);
                  await onUnfriend?.(person.id);
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs transition-all min-h-[38px] shadow-sm"
              >
                Unfriend
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Block Confirmation Dialog */}
      {showBlockConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="block-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn"
          onClick={() => setShowBlockConfirm(false)}
        >
          <div
            className="bg-[#1D1429] border border-rose-500/30 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h4 id="block-dialog-title" className="text-base font-extrabold text-white">
                  Block {person.display_name}?
                </h4>
                <p className="text-xs text-rose-300 font-semibold">
                  This will sever all ties.
                </p>
              </div>
            </div>
            <p className="text-xs text-brand-sandstone/80 leading-relaxed">
              Blocking will automatically remove any friendship, remove following connections, and prevent {person.display_name} from messaging you or seeing your profile.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowBlockConfirm(false)}
                className="flex-1 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors min-h-[38px]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isActionPending}
                onClick={async () => {
                  setShowBlockConfirm(false);
                  await onBlock?.(person.id);
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs transition-all min-h-[38px] shadow-sm"
              >
                Block Member
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
