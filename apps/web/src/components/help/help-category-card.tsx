import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export interface HelpCategoryCardProps {
  slug: string;
  title: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  articleCount?: number;
}

export default function HelpCategoryCard({ slug, title, description, icon, color, articleCount }: HelpCategoryCardProps) {
  const accentColor = color || '#38BDF8';
  return (
    <Link
      href={`/learn/${slug}`}
      className="flex flex-col p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all group"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ backgroundColor: `${accentColor}20`, border: `1px solid ${accentColor}40` }}
        >
          <span style={{ color: accentColor }}>
            {icon === 'Sparkles' ? '✨' : icon === 'Compass' ? '🧭' : icon === 'PlusCircle' ? '➕' :
             icon === 'Video' ? '🎬' : icon === 'Tv' ? '📺' : icon === 'Mic' ? '🎙️' :
             icon === 'Users' ? '👥' : icon === 'MessageSquare' ? '💬' : icon === 'Radio' ? '📡' :
             icon === 'ShoppingBag' ? '🛍️' : icon === 'Calendar' ? '📅' : icon === 'Building2' ? '🏢' :
             icon === 'Wallet' ? '💳' : icon === 'Settings' ? '⚙️' : icon === 'Shield' ? '🛡️' :
             icon === 'AlertTriangle' ? '⚠️' : icon === 'Zap' ? '⚡' : '📖'}
          </span>
        </div>
        <ArrowRight className="w-4 h-4 text-brand-sandstone/30 group-hover:text-white transition-colors flex-shrink-0 mt-1" />
      </div>
      <h3 className="text-sm font-black text-white mb-1.5 group-hover:text-brand-caribbeanSea transition-colors">{title}</h3>
      {description && (
        <p className="text-xs text-brand-sandstone/60 leading-relaxed line-clamp-2 flex-1">{description}</p>
      )}
      {typeof articleCount === 'number' && (
        <p className="text-[10px] font-semibold text-brand-sandstone/40 mt-3">{articleCount} {articleCount === 1 ? 'article' : 'articles'}</p>
      )}
    </Link>
  );
}
