import React from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen } from 'lucide-react';

export interface RelatedArticle {
  slug: string;
  title: string;
  description: string | null;
  category_title?: string | null;
}

export interface RelatedArticlesProps {
  articles: RelatedArticle[];
}

export default function RelatedArticles({ articles }: RelatedArticlesProps) {
  if (!articles || !articles.length) return null;
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-black uppercase tracking-wider text-brand-sandstone/50">Related Articles</h3>
      <div className="space-y-2">
        {articles.map((a) => (
          <Link
            key={a.slug}
            href={`/help/${a.slug}`}
            className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-brand-caribbeanSea/30 hover:bg-white/10 transition-all group"
          >
            <BookOpen className="w-4 h-4 text-brand-caribbeanSea flex-shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white group-hover:text-brand-caribbeanSea transition-colors">{a.title}</p>
              {a.description && (
                <p className="text-xs text-brand-sandstone/60 mt-0.5 line-clamp-1">{a.description}</p>
              )}
              {a.category_title && (
                <p className="text-[10px] text-brand-caribbeanSea/70 mt-1">{a.category_title}</p>
              )}
            </div>
            <ArrowRight className="w-4 h-4 text-brand-sandstone/30 group-hover:text-brand-caribbeanSea flex-shrink-0 mt-0.5 transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  );
}
