'use client';

import React, { useState, useTransition } from 'react';
import { Heart } from 'lucide-react';
import { toggleWishlistAction } from '../../lib/marketplace/actions';

interface WishlistButtonProps {
  productId: string;
  initialSaved?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function WishlistButton({
  productId,
  initialSaved = false,
  className = '',
  size = 'md',
}: WishlistButtonProps) {
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [isPending, startTransition] = useTransition();

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Optimistic toggle
    const nextSaved = !isSaved;
    setIsSaved(nextSaved);

    startTransition(async () => {
      const res = await toggleWishlistAction(productId);
      if (res.error) {
        // Revert on failure
        setIsSaved(!nextSaved);
      } else {
        setIsSaved(res.isSaved);
      }
    });
  };

  const sizeClasses = {
    sm: 'p-1.5 rounded-lg',
    md: 'p-2 rounded-xl',
    lg: 'p-3 rounded-2xl',
  }[size];

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }[size];

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`transition-all ${sizeClasses} ${
        isSaved
          ? 'bg-rose-500/20 border border-rose-500/40 text-rose-400 shadow-md shadow-rose-500/20'
          : 'bg-black/40 hover:bg-black/60 border border-white/10 text-brand-sandstone/70 hover:text-white'
      } ${className}`}
      aria-label={isSaved ? 'Remove from wishlist' : 'Save to wishlist'}
      title={isSaved ? 'Saved in Wishlist' : 'Save Item'}
    >
      <Heart
        className={`${iconSizes} ${isSaved ? 'fill-rose-400 text-rose-400' : ''} transition-transform ${
          isPending ? 'scale-90' : 'hover:scale-110'
        }`}
      />
    </button>
  );
}
