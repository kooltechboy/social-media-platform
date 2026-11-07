import React from 'react';
import Link from 'next/link';
import UserAvatar from '../user-avatar';
import type { FeedPostData } from '../feed-stream';

export interface QuotePostCardProps {
  quotedPost: FeedPostData | null | undefined;
}

export default function QuotePostCard({ quotedPost }: QuotePostCardProps) {
  if (!quotedPost) return null;

  return (
    <Link
      href={`/post/${quotedPost.id}`}
      className="block mt-3 rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] transition-colors p-3.5 space-y-2 group"
    >
      <div className="flex items-center gap-2">
        <UserAvatar
          avatarUrl={quotedPost.avatarUrl}
          name={quotedPost.author}
          size="xs"
        />
        <span className="text-xs font-bold text-white group-hover:text-brand-caribbeanSea transition-colors">
          {quotedPost.author}
        </span>
        <span className="text-xs text-brand-mist">@{quotedPost.handle}</span>
        {quotedPost.time && (
          <span className="text-[11px] text-brand-mist/60 ml-auto">{quotedPost.time}</span>
        )}
      </div>
      <p className="text-xs text-brand-sand line-clamp-3 leading-relaxed">
        {quotedPost.content}
      </p>
      {quotedPost.mediaUrls && quotedPost.mediaUrls.length > 0 && (
        <div className="text-[11px] text-brand-caribbeanSea font-medium">
          📷 {quotedPost.mediaUrls.length} {quotedPost.mediaUrls.length === 1 ? 'attachment' : 'attachments'}
        </div>
      )}
    </Link>
  );
}
