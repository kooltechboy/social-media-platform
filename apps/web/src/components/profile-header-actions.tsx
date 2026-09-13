'use client';

import React, { useState } from 'react';
import {
  Share2,
  Check,
  MessageSquare,
  Edit3,
  UserPlus,
  UserCheck,
  Clock,
  UserMinus,
  Shield,
  MoreVertical,
  Lock,
} from 'lucide-react';
import Link from 'next/link';
import ProfileEditModal, { type ProfileData } from './profile-edit-modal';
import {
  followUserAction,
  unfollowUserAction,
  sendFriendRequestAction,
  acceptFriendRequestAction,
  declineFriendRequestAction,
  cancelFriendRequestAction,
  unfriendAction,
  blockUserAction,
} from '../lib/social/relationship-actions';
import { getRelationshipActionConfig } from '@caribbean/social';

export interface ProfileHeaderActionsProps {
  targetUserId: string;
  username: string;
  isOwnProfile: boolean;
  isAuthenticated: boolean;
  isOfficial?: boolean;
  initialRelationship?: {
    state: string;
    isFollowing: boolean;
    isFollower?: boolean;
    friendshipStatus: string;
    isBlocked?: boolean;
  };
  profileData?: ProfileData;
}

export default function ProfileHeaderActions({
  targetUserId,
  username,
  isOwnProfile,
  isAuthenticated,
  isOfficial = false,
  initialRelationship,
  profileData,
}: ProfileHeaderActionsProps) {
  const [copied, setCopied] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const [relState, setRelState] = useState(initialRelationship || {
    state: 'none',
    isFollowing: false,
    isFollower: false,
    friendshipStatus: 'none',
    isBlocked: false,
  });

  const handleShare = async () => {
    setIsMenuOpen(false);
    const url = typeof window !== 'undefined' ? window.location.href : `https://tukubi.com/profile/${username}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `@${username} on Tukubi`,
          text: `Check out @${username}'s Caribbean profile on Tukubi`,
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

  const handleToggleFollow = async () => {
    if (!isAuthenticated || isPending) return;
    const nextFollowing = !relState.isFollowing;
    setRelState((prev) => ({
      ...prev,
      isFollowing: nextFollowing,
      state: nextFollowing ? 'following' : 'none',
    }));
    setIsPending(true);

    try {
      if (nextFollowing) {
        await followUserAction(targetUserId);
      } else {
        await unfollowUserAction(targetUserId);
      }
    } catch {
      setRelState((prev) => ({ ...prev, isFollowing: !nextFollowing }));
    } finally {
      setIsPending(false);
    }
  };

  const handleSendFriendRequest = async () => {
    if (!isAuthenticated || isPending) return;
    setRelState((prev) => ({
      ...prev,
      friendshipStatus: 'pending_sent',
      state: 'request_sent',
    }));
    setIsPending(true);

    try {
      const res = await sendFriendRequestAction(targetUserId);
      if (res.data?.status === 'accepted') {
        setRelState((prev) => ({ ...prev, friendshipStatus: 'accepted', state: 'friends' }));
      }
    } catch {
      setRelState((prev) => ({ ...prev, friendshipStatus: 'none', state: 'none' }));
    } finally {
      setIsPending(false);
    }
  };

  const handleAcceptRequest = async () => {
    if (!isAuthenticated || isPending) return;
    setRelState((prev) => ({
      ...prev,
      friendshipStatus: 'accepted',
      state: 'friends',
    }));
    setIsPending(true);

    try {
      await acceptFriendRequestAction(targetUserId);
    } catch {
      setRelState((prev) => ({ ...prev, friendshipStatus: 'pending_received' }));
    } finally {
      setIsPending(false);
    }
  };

  const handleDeclineRequest = async () => {
    if (!isAuthenticated || isPending) return;
    setRelState((prev) => ({
      ...prev,
      friendshipStatus: 'none',
      state: 'none',
    }));
    setIsPending(true);

    try {
      await declineFriendRequestAction(targetUserId);
    } catch {
      setRelState((prev) => ({ ...prev, friendshipStatus: 'pending_received' }));
    } finally {
      setIsPending(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!isAuthenticated || isPending) return;
    setRelState((prev) => ({
      ...prev,
      friendshipStatus: 'none',
      state: prev.isFollowing ? 'following' : 'none',
    }));
    setIsPending(true);

    try {
      await cancelFriendRequestAction(targetUserId);
    } catch {
      setRelState((prev) => ({ ...prev, friendshipStatus: 'pending_sent' }));
    } finally {
      setIsPending(false);
    }
  };

  const handleUnfriend = async () => {
    setIsMenuOpen(false);
    if (!isAuthenticated || isPending) return;
    setRelState((prev) => ({
      ...prev,
      friendshipStatus: 'none',
      state: prev.isFollowing ? 'following' : 'none',
    }));
    setIsPending(true);

    try {
      await unfriendAction(targetUserId);
    } catch {
      setRelState((prev) => ({ ...prev, friendshipStatus: 'accepted' }));
    } finally {
      setIsPending(false);
    }
  };

  const handleBlock = async () => {
    setIsMenuOpen(false);
    if (!isAuthenticated || isPending) return;
    setRelState((prev) => ({
      ...prev,
      isBlocked: true,
      state: 'blocked',
    }));
    setIsPending(true);

    try {
      await blockUserAction(targetUserId);
    } catch {
      setRelState((prev) => ({ ...prev, isBlocked: false }));
    } finally {
      setIsPending(false);
    }
  };

  const actionConfig = getRelationshipActionConfig({
    isBlocked: relState.isBlocked,
    friendshipStatus: relState.friendshipStatus as any,
    isFollowing: relState.isFollowing,
    isFollower: relState.isFollower,
    isOfficial,
  });

  const isMessagingDisabled = profileData?.messaging_permission === 'no_one';
  const isMessagingFriendsOnly =
    profileData?.messaging_permission === 'friends' && relState.friendshipStatus !== 'accepted';

  return (
    <>
      <div className="flex items-center gap-2.5 flex-wrap">
        {/* Own Profile Actions */}
        {isOwnProfile && profileData && (
          <button
            type="button"
            onClick={() => setIsEditOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-brand-caribbeanSea/20 hover:bg-brand-caribbeanSea text-brand-caribbeanSea hover:text-slate-950 border border-brand-caribbeanSea/30 text-xs sm:text-sm md:text-base font-bold transition-all cursor-pointer min-h-[44px] md:min-h-[48px]"
          >
            <Edit3 className="w-4 h-4 md:w-4.5 md:h-4.5" />
            <span>Edit Profile</span>
          </button>
        )}

        {/* Visitor Actions (Logged In) */}
        {!isOwnProfile && isAuthenticated && (
          <>
            {/* 1. Add Friend / Friendship Status */}
            {!isOfficial && (
              <>
                {relState.friendshipStatus === 'accepted' ? (
                  <span className="flex items-center gap-1.5 px-4 md:px-5 py-2.5 rounded-2xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs sm:text-sm md:text-base font-black min-h-[44px] md:min-h-[48px]">
                    <UserCheck className="w-4 h-4 md:w-5 md:h-5 text-emerald-400" />
                    <span>Friends</span>
                  </span>
                ) : relState.friendshipStatus === 'pending_sent' ? (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={handleCancelRequest}
                    title="Click to cancel pending friend request"
                    className="flex items-center gap-1.5 px-4 md:px-5 py-2.5 rounded-2xl bg-white/10 hover:bg-rose-500/20 text-brand-sandstone hover:text-rose-300 border border-white/15 text-xs sm:text-sm md:text-base font-bold transition-all min-h-[44px] md:min-h-[48px]"
                  >
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span>Request Sent</span>
                  </button>
                ) : relState.friendshipStatus === 'pending_received' ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={handleAcceptRequest}
                      className="flex items-center gap-1.5 px-4 md:px-5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs sm:text-sm md:text-base font-black transition-all shadow-md min-h-[44px] md:min-h-[48px]"
                    >
                      <UserCheck className="w-4 h-4 md:w-5 md:h-5" />
                      <span>Accept</span>
                    </button>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={handleDeclineRequest}
                      className="px-3.5 md:px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-brand-sandstone border border-white/15 text-xs sm:text-sm md:text-base font-bold transition-all min-h-[44px] md:min-h-[48px]"
                    >
                      Decline
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={handleSendFriendRequest}
                    className="flex items-center gap-2 px-4 md:px-5 py-2.5 rounded-2xl bg-brand-caribbeanSea hover:brightness-110 text-slate-950 font-black text-xs sm:text-sm md:text-base transition-all shadow-md shadow-brand-caribbeanSea/20 min-h-[44px] md:min-h-[48px]"
                  >
                    <UserPlus className="w-4 h-4 md:w-5 md:h-5" />
                    <span>Add Friend</span>
                  </button>
                )}
              </>
            )}

            {/* 2. One-Way Follow Toggle */}
            <button
              type="button"
              disabled={isPending}
              onClick={handleToggleFollow}
              className={`flex items-center gap-2 px-4 md:px-5 py-2.5 rounded-2xl font-black text-xs sm:text-sm md:text-base transition-all shadow-md min-h-[44px] md:min-h-[48px] ${
                relState.isFollowing
                  ? 'bg-white/10 hover:bg-rose-500/20 text-brand-sandstone hover:text-rose-300 border border-white/15'
                  : isOfficial
                  ? 'bg-gradient-to-r from-brand-caribbeanSea to-brand-sunriseCoral text-slate-950 hover:brightness-110 shadow-brand-caribbeanSea/20'
                  : relState.isFollower
                  ? 'bg-brand-goldenHour hover:brightness-110 text-slate-950 shadow-brand-goldenHour/20'
                  : 'bg-brand-sunriseCoral hover:brightness-110 text-slate-950 shadow-brand-sunriseCoral/20'
              }`}
            >
              <span>{actionConfig.followLabel}</span>
            </button>

            {/* 3. Message CTA */}
            {isMessagingDisabled ? (
              <button
                type="button"
                disabled
                title="This member is not accepting messages"
                className="flex items-center gap-2 px-4 md:px-5 py-2.5 rounded-2xl bg-white/5 text-brand-sandstone/40 border border-white/5 text-xs sm:text-sm md:text-base font-bold cursor-not-allowed min-h-[44px] md:min-h-[48px]"
              >
                <Lock className="w-4 h-4 md:w-5 md:h-5" />
                <span>Message</span>
              </button>
            ) : (
              <Link
                href={`/messages?u=${encodeURIComponent(username)}`}
                title={
                  isMessagingFriendsOnly
                    ? 'This member only receives messages from friends'
                    : `Message @${username}`
                }
                className="flex items-center gap-2 px-4 md:px-5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/15 text-xs sm:text-sm md:text-base font-bold transition-all shadow-md min-h-[44px] md:min-h-[48px]"
              >
                <MessageSquare className="w-4 h-4 md:w-5 md:h-5 text-brand-caribbeanSea" />
                <span>Message</span>
              </Link>
            )}
          </>
        )}

        {/* Visitor Actions (Logged Out) */}
        {!isOwnProfile && !isAuthenticated && (
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="flex items-center gap-2 bg-gradient-to-r from-brand-caribbeanSea to-brand-sunriseCoral hover:brightness-110 text-slate-950 font-black text-xs sm:text-sm md:text-base px-5 md:px-6 py-2.5 rounded-2xl transition-all shadow-md min-h-[44px] md:min-h-[48px]"
            >
              <UserPlus className="w-4 h-4 md:w-5 md:h-5" />
              <span>Sign in to Connect</span>
            </Link>
            <Link
              href={`/login?next=/messages?u=${encodeURIComponent(username)}`}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm md:text-base px-4 py-2.5 rounded-2xl border border-white/15 transition-all min-h-[44px] md:min-h-[48px]"
            >
              <MessageSquare className="w-4 h-4 text-brand-caribbeanSea" />
              <span>Message</span>
            </Link>
          </div>
        )}

        {/* Share Button */}
        <button
          type="button"
          onClick={handleShare}
          aria-label="Share profile"
          className="p-2.5 md:p-3 text-slate-300 hover:text-white rounded-2xl bg-white/5 hover:bg-white/15 border border-white/15 transition-all flex items-center gap-1.5 text-xs md:text-sm cursor-pointer min-h-[44px] md:min-h-[48px] min-w-[44px] md:min-w-[48px] justify-center"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-brand-sunriseCoral" />
              <span className="text-xs text-brand-sunriseCoral font-bold">Copied</span>
            </>
          ) : (
            <Share2 className="w-4 h-4 md:w-5 md:h-5" />
          )}
        </button>

        {/* Overflow Menu for Visitor */}
        {!isOwnProfile && isAuthenticated && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2.5 md:p-3 text-slate-300 hover:text-white rounded-2xl bg-white/5 hover:bg-white/15 border border-white/15 transition-all flex items-center justify-center min-h-[44px] md:min-h-[48px] min-w-[44px] md:min-w-[48px]"
              aria-label="More profile options"
            >
              <MoreVertical className="w-4 h-4 md:w-5 md:h-5" />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 top-12 w-48 bg-[#1D1429] border border-white/15 rounded-2xl p-1.5 shadow-2xl z-30 space-y-1 text-xs animate-fadeIn">
                {relState.friendshipStatus === 'accepted' && (
                  <button
                    type="button"
                    onClick={handleUnfriend}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-rose-500/20 text-rose-300 font-bold flex items-center gap-2"
                  >
                    <UserMinus className="w-3.5 h-3.5 text-rose-400" />
                    <span>Unfriend</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleBlock}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-rose-500/20 text-rose-400 font-bold flex items-center gap-2"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Block @{username}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {isOwnProfile && profileData && (
        <ProfileEditModal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          initialProfile={profileData}
        />
      )}
    </>
  );
}
