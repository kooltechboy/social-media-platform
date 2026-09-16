'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Megaphone, ExternalLink, Sparkles, CheckCircle } from 'lucide-react';
import UserAvatar from '../user-avatar';
import TukubiImage from '../ui/tukubi-image';

export interface SponsoredFeedCardProps {
  post: {
    id: string;
    adId?: string;
    authorId: string;
    author: string;
    handle: string;
    avatarUrl?: string | null;
    headline?: string;
    content: string;
    mediaUrls?: string[];
    destinationUrl: string;
    ctaText?: string;
    isSponsored: true;
    verified?: boolean;
    bidCpmMinor?: number;
  };
}

export default function SponsoredFeedCard({ post }: SponsoredFeedCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [impressionLogged, setImpressionLogged] = useState(false);
  const [impressionId, setImpressionId] = useState<number | null>(null);

  // Auto-record viewable impression when card is visible in viewport
  useEffect(() => {
    if (impressionLogged || !post.adId) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !impressionLogged) {
            setImpressionLogged(true);
            fetch('/api/ads/impression', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                adId: post.adId,
                placement: 'feed',
                costMinor: post.bidCpmMinor ? Math.round(post.bidCpmMinor / 1000) : 0,
              }),
            })
              .then((res) => res.json())
              .then((data) => {
                if (data.impressionId) {
                  setImpressionId(data.impressionId);
                }
              })
              .catch(() => {
                // Non-blocking impression logging failure
              });
          }
        });
      },
      { threshold: 0.5 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [impressionLogged, post.adId, post.bidCpmMinor]);

  const handleCtaClick = () => {
    if (impressionId) {
      fetch('/api/ads/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ impressionId }),
      }).catch(() => {
        // Non-blocking click logging failure
      });
    }
  };

  const primaryMedia = post.mediaUrls && post.mediaUrls.length > 0 ? post.mediaUrls[0] : null;

  return (
    <article
      ref={cardRef}
      className="bg-slate-900/60 backdrop-blur-md border border-amber-500/20 hover:border-amber-500/40 rounded-3xl p-5 shadow-lg shadow-amber-500/5 transition-all space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <UserAvatar
            avatarUrl={post.avatarUrl}
            name={post.author}
            size="md"
            className="border-2 border-amber-500/30"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white text-base">{post.author}</span>
              {post.verified && <CheckCircle className="w-4 h-4 text-brand-caribbeanSea fill-brand-caribbeanSea/20" />}
            </div>
            <span className="text-xs text-slate-400">@{post.handle}</span>
          </div>
        </div>

        {/* Sponsored Indicator */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold tracking-wide">
          <Megaphone className="w-3.5 h-3.5 text-amber-400" />
          <span>Sponsored</span>
        </div>
      </div>

      {/* Headline & Body */}
      {post.headline && (
        <h3 className="text-lg font-bold text-white tracking-tight leading-snug">
          {post.headline}
        </h3>
      )}
      <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
        {post.content}
      </p>

      {/* Media Creative */}
      {primaryMedia && (
        <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-black/40 aspect-video w-full">
          <TukubiImage
            src={primaryMedia}
            alt={post.headline || post.author}
            fill
            className="object-cover"
          />
        </div>
      )}

      {/* Call to Action Footer */}
      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
        <span className="text-xs text-slate-400 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          Featured Caribbean Promotion
        </span>

        <a
          href={post.destinationUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleCtaClick}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-brand-sunriseCoral hover:from-amber-400 hover:to-brand-goldenHour text-white font-bold text-sm shadow-md shadow-amber-500/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <span>{post.ctaText || 'Learn More'}</span>
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </article>
  );
}
