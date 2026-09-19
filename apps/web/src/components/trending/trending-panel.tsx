import React from 'react';
import Link from 'next/link';
import { TrendingUp, Hash, Music2, User, Tag } from 'lucide-react';

export const VALID_SIGNAL_TYPES = ['hashtag', 'sound', 'creator', 'topic', 'keyword'] as const;
export type TrendingSignalType = (typeof VALID_SIGNAL_TYPES)[number];

export interface TrendingSignal {
  id: string;
  signal_type: TrendingSignalType | string;
  entity_id: string;
  entity_label: string;
  entity_avatar_url?: string | null;
  score: number;
  post_count_last_2h?: number;
  post_count_last_24h: number;
  territory_iso?: string | null;
}

export interface TrendingPanelProps {
  signals: TrendingSignal[];
  territory?: string | null;
  className?: string;
}

const TYPE_ICON: Record<string, React.ElementType> = {
  hashtag: Hash,
  sound: Music2,
  creator: User,
  topic: Tag,
  keyword: Tag,
};

const TYPE_COLOR: Record<string, string> = {
  hashtag: 'text-brand-caribbeanSea',
  sound: 'text-purple-400',
  creator: 'text-brand-sunriseCoral',
  topic: 'text-yellow-400',
  keyword: 'text-slate-400',
};

export function getSignalHref(signal: { signal_type: string; entity_id: string; entity_label: string }): string {
  switch (signal.signal_type) {
    case 'hashtag':
      return `/explore?q=${encodeURIComponent('#' + signal.entity_id)}`;
    case 'sound':
      return `/sounds?id=${encodeURIComponent(signal.entity_id)}`;
    case 'creator':
      return `/profile/${signal.entity_id}`;
    default:
      return `/explore?q=${encodeURIComponent(signal.entity_label)}`;
  }
}

export default function TrendingPanel({ signals, territory, className = '' }: TrendingPanelProps) {
  if (signals.length === 0) {
    return (
      <div className={`p-4 border border-slate-800 rounded-2xl bg-brand-dusk/40 ${className}`}>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-brand-sunriseCoral" />
          <h3 className="text-sm font-black text-brand-sandstone">Trending in the Caribbean</h3>
        </div>
        <p className="text-xs text-brand-sandstone/60">
          Trending topics will appear here as the TUKUBI community grows.
        </p>
      </div>
    );
  }

  return (
    <div className={`border border-slate-800 rounded-2xl bg-brand-dusk/40 overflow-hidden ${className}`}>
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800">
        <TrendingUp className="w-4 h-4 text-brand-sunriseCoral" />
        <h3 className="text-sm font-black text-brand-sandstone">
          {territory ? `Trending in ${territory}` : 'Trending in the Caribbean 🌴'}
        </h3>
      </div>

      <div className="divide-y divide-slate-800/50">
        {signals.slice(0, 10).map((signal, i) => {
          const Icon = TYPE_ICON[signal.signal_type] || Tag;
          const colorClass = TYPE_COLOR[signal.signal_type] || 'text-slate-400';
          const href = getSignalHref(signal);

          return (
            <Link
              key={signal.id}
              href={href}
              className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800/30 transition-colors group"
            >
              <span className="text-xs font-bold text-slate-600 w-4 shrink-0">{i + 1}</span>
              <Icon className={`w-3.5 h-3.5 shrink-0 ${colorClass}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-brand-sandstone truncate group-hover:text-brand-caribbeanSea transition-colors">
                  {signal.signal_type === 'hashtag' ? `#${signal.entity_label}` : signal.entity_label}
                </p>
                <p className="text-[10px] text-slate-500">
                  {signal.post_count_last_24h.toLocaleString()} posts today
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="px-4 py-2 border-t border-slate-800">
        <Link href="/explore" className="text-xs text-brand-caribbeanSea hover:text-emerald-400 font-medium transition-colors">
          View all trending →
        </Link>
      </div>
    </div>
  );
}
