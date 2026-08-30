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
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-brand-caribbeanSea/20 hover:bg-brand-caribbeanSea text-brand-caribbeanSea hover:text-slate-950 border border-brand-caribbeanSea/30 text-xs font-bold transition-all cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </button>
        )}

        {!isOwnProfile && isAuthenticated && (
          <Link
            href={`/messages?u=${encodeURIComponent(username)}`}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-brand-caribbeanSea/20 hover:bg-brand-caribbeanSea text-brand-caribbeanSea hover:text-slate-950 border border-brand-caribbeanSea/30 text-xs font-bold transition-all"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Message</span>
          </Link>
        )}

        <button
          type="button"
          onClick={handleShare}
          aria-label="Share profile"
          className="p-2 text-slate-300 hover:text-brand-sandstone rounded-full hover:bg-brand-dusk border border-slate-800 transition-colors flex items-center gap-1 text-xs cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-brand-sunriseCoral" />
              <span className="text-[10px] text-brand-sunriseCoral font-bold">Copied</span>
            </>
          ) : (
            <Share2 className="w-4 h-4" />
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
