import React from 'react';
import { Zap } from 'lucide-react';

export interface WhatsNewItem {
  date: string;
  label: string;
  description: string;
  isNew?: boolean;
}

// Real verified TUKUBI updates — sourced from the actual codebase audit
export const WHATS_NEW_ITEMS: WhatsNewItem[] = [
  {
    date: 'Sept 2026',
    label: 'TUKUBI Help & Learn Center',
    description: 'Complete Help and Learn Center now available. Find guides, tutorials and answers to your questions.',
    isNew: true,
  },
  {
    date: 'Sept 2026',
    label: 'Caribbean Sounds',
    description: 'Discover, play and use Caribbean sound tracks in your Reels and posts.',
    isNew: true,
  },
  {
    date: 'Aug 2026',
    label: 'People & Network Hub',
    description: 'Find Caribbean members, manage friends, followers and discover people you may know.',
  },
  {
    date: 'Aug 2026',
    label: 'Creator Studio Upgrades',
    description: 'AI repurposing, deeper analytics, and improved content management tools.',
  },
  {
    date: 'Aug 2026',
    label: 'Enterprise Marketplace',
    description: 'Advanced seller tools, bespoke storefronts, and Caribbean territory-specific commerce.',
  },
  {
    date: 'Jul 2026',
    label: 'Interactive Polls',
    description: 'Add polls to your posts and engage your audience with Caribbean questions.',
  },
  {
    date: 'Jul 2026',
    label: 'Saved Posts',
    description: 'Bookmark any post to find it later in your Saved collection.',
  },
  {
    date: 'Jun 2026',
    label: 'Recognition & Badges',
    description: 'Earn founder badges, reputation scores, and join the TUKUBI Hall of Fame.',
  },
];

export interface WhatsNewBannerProps {
  limit?: number;
}

export default function WhatsNewBanner({ limit = 4 }: WhatsNewBannerProps) {
  const items = WHATS_NEW_ITEMS.slice(0, limit);
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex-shrink-0 mt-0.5">
            {item.isNew ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-brand-sunriseCoral/20 text-brand-sunriseCoral border border-brand-sunriseCoral/30 uppercase">
                <Zap className="w-2.5 h-2.5" /> NEW
              </span>
            ) : (
              <span className="text-[10px] font-semibold text-brand-sandstone/40">{item.date}</span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-white">{item.label}</p>
            <p className="text-xs text-brand-sandstone/65 mt-0.5 leading-relaxed">{item.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
