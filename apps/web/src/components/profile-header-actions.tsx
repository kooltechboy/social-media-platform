'use client';

import React, { useState } from 'react';
import { Share2, Check, MessageSquare, Edit3 } from 'lucide-react';
import Link from 'next/link';
import ProfileEditModal, { type ProfileData } from './profile-edit-modal';

interface ProfileHeaderActionsProps {
  username: string;
  isOwnProfile: boolean;
  isAuthenticated: boolean;
  profileData?: ProfileData;
}

export default function ProfileHeaderActions({
  username,
  isOwnProfile,
  isAuthenticated,
  profileData,
}: ProfileHeaderActionsProps) {
  const [copied, setCopied] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const handleShare = async () => {
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

  return (
    <>
      <div className="flex items-center gap-2">
        {isOwnProfile && profileData && (
          <button
            type="button"
            onClick={() => setIsEditOpen(true)}
            className="flex items-center gap-2 px-3.5 md:px-4 py-1.5 md:py-2 rounded-full bg-brand-caribbeanSea/20 hover:bg-brand-caribbeanSea text-brand-caribbeanSea hover:text-slate-950 border border-brand-caribbeanSea/30 text-xs md:text-sm font-bold transition-all cursor-pointer min-h-[36px] md:min-h-[40px]"
          >
            <Edit3 className="w-3.5 h-3.5 md:w-4 md:h-4" />
            <span>Edit Profile</span>
          </button>
        )}

        {!isOwnProfile && isAuthenticated && (
          <Link
            href={`/messages?u=${encodeURIComponent(username)}`}
            title={profileData?.messaging_permission === 'no_one' ? "This member isn't accepting new messages right now" : `Message @${username}`}
            className="flex items-center gap-2 px-3.5 md:px-4 py-1.5 md:py-2 rounded-full bg-brand-caribbeanSea/20 hover:bg-brand-caribbeanSea text-brand-caribbeanSea hover:text-slate-950 border border-brand-caribbeanSea/30 text-xs md:text-sm font-bold transition-all min-h-[36px] md:min-h-[40px]"
          >
            <MessageSquare className="w-3.5 h-3.5 md:w-4 md:h-4" />
            <span>Message</span>
          </Link>
        )}

        <button
          type="button"
          onClick={handleShare}
          aria-label="Share profile"
          className="p-2 md:p-2.5 text-slate-300 hover:text-brand-sandstone rounded-full hover:bg-brand-dusk border border-slate-800 transition-colors flex items-center gap-1.5 text-xs md:text-sm cursor-pointer min-h-[36px] md:min-h-[40px] min-w-[36px] md:min-w-[40px] justify-center"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 md:w-4 md:h-4 text-brand-sunriseCoral" />
              <span className="text-[10px] md:text-xs text-brand-sunriseCoral font-bold">Copied</span>
            </>
          ) : (
            <Share2 className="w-4 h-4 md:w-4.5 md:h-4.5" />
          )}
        </button>
      </div>

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
