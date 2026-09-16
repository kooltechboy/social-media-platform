'use client';

import React from 'react';
import Link from 'next/link';
import { HelpCircle, ArrowRight } from 'lucide-react';

export interface ContextualHelpButtonProps {
  articleSlug: string;
  label?: string;
  compact?: boolean;
}

export default function ContextualHelpButton({ articleSlug, label = 'How does this work?', compact = false }: ContextualHelpButtonProps) {
  if (compact) {
    return (
      <Link
        href={`/help/${articleSlug}`}
        className="inline-flex items-center gap-1.5 text-xs text-brand-sandstone/60 hover:text-brand-caribbeanSea transition-colors py-1 px-2 rounded-lg hover:bg-brand-caribbeanSea/10"
        aria-label={label}
      >
        <HelpCircle className="w-3.5 h-3.5 text-brand-caribbeanSea" />
        <span>{label}</span>
      </Link>
    );
  }

  return (
    <Link
      href={`/help/${articleSlug}`}
      className="inline-flex items-center gap-2 text-xs font-bold text-brand-caribbeanSea hover:underline px-3 py-1.5 rounded-xl bg-brand-caribbeanSea/10 border border-brand-caribbeanSea/20 hover:bg-brand-caribbeanSea/20 transition-all"
      aria-label={label}
    >
      <HelpCircle className="w-4 h-4" />
      <span>{label}</span>
      <ArrowRight className="w-3 h-3" />
    </Link>
  );
}
