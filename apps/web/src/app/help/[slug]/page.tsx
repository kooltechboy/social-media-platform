import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, ArrowLeft, ArrowRight, ExternalLink, Sparkles, BookOpen } from 'lucide-react';
import ArticleContent from '../../../components/help/article-content';
import ArticleFeedback from '../../../components/help/article-feedback';
import RelatedArticles from '../../../components/help/related-articles';
import TableOfContents, { type ToCItem } from '../../../components/help/table-of-contents';
import { getArticleBySlug, HELP_ARTICLES } from '../../../lib/help/articles-data';
import { createServiceSupabaseClient } from '../../../lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) {
    return { title: 'Help Article — TUKUBI' };
  }
  return {
    title: `${article.title} — TUKUBI Help Center`,
    description: article.description,
    openGraph: {
      title: `${article.title} — TUKUBI Help Center`,
      description: article.description,
      url: `https://tukubi.com/help/${slug}`,
      siteName: 'TUKUBI Help Center',
    },
  };
}

export default async function HelpArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article) {
    // Attempt to lookup dynamically in database
    try {
      const supabase = await createServiceSupabaseClient();
      if (supabase) {
        const { data: dbArticle } = await supabase
          .from('help_articles')
          .select('*, help_categories(title, slug)')
          .eq('slug', slug)
          .maybeSingle();

        if (!dbArticle) notFound();

        // Increment view count asynchronously
        void supabase.rpc('increment_help_article_views', { article_uuid: dbArticle.id });
      } else {
        notFound();
      }
    } catch {
      notFound();
    }
  }

  // Related articles in same category (excluding current)
  const related = HELP_ARTICLES.filter(
    (a) => a.categorySlug === article?.categorySlug && a.slug !== slug
  ).slice(0, 3).map((a) => ({
    slug: a.slug,
    title: a.title,
    description: a.description,
    category_title: a.categoryTitle,
  }));

  // Build Table of Contents items from section titles
  const tocItems: ToCItem[] = (article?.sections || [])
    .filter((s) => s.title)
    .map((s, idx) => ({
      id: `section-${idx}`,
      label: s.title || `Section ${idx + 1}`,
      level: 1,
    }));

  return (
    <div className="space-y-8">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-brand-sandstone/60">
        <Link href="/help" className="hover:text-white transition-colors flex items-center gap-1">
          <ArrowLeft className="w-3 h-3" /> Help Center
        </Link>
        <ChevronRight className="w-3 h-3 text-white/20" />
        <Link href={`/learn/${article?.categorySlug}`} className="hover:text-white transition-colors">
          {article?.categoryTitle}
        </Link>
        <ChevronRight className="w-3 h-3 text-white/20" />
        <span className="text-white font-semibold truncate max-w-xs">{article?.title}</span>
      </nav>

      {/* Main Grid: Article Body (left 8 cols) + Sidebar (right 4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Article Content */}
        <article className="lg:col-span-8 space-y-8">
          {/* Article Header */}
          <div className="space-y-3 pb-6 border-b border-white/10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-caribbeanSea/15 border border-brand-caribbeanSea/30 text-brand-caribbeanSea text-xs font-black uppercase tracking-wider">
              {article?.categoryTitle}
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
              {article?.title}
            </h1>
            <p className="text-sm sm:text-base text-brand-sandstone/80 leading-relaxed">
              {article?.description}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs text-brand-sandstone/50 pt-2">
              <span>Updated September 2026</span>
              <span>•</span>
              <span>Verified TUKUBI Documentation</span>
              {article?.ctaHref && (
                <>
                  <span>•</span>
                  <Link
                    href={article.ctaHref}
                    className="text-brand-sunriseCoral font-bold hover:underline flex items-center gap-1"
                  >
                    {article.ctaLabel || 'Try this feature'} <ArrowRight className="w-3 h-3" />
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Render Sections */}
          {article && <ArticleContent sections={article.sections} />}

          {/* Quick Action CTA Banner */}
          {article?.ctaHref && (
            <div className="surface-card rounded-2xl p-6 border border-brand-caribbeanSea/30 bg-gradient-to-r from-brand-caribbeanSea/10 via-slate-900/80 to-brand-sunriseCoral/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-brand-caribbeanSea">Ready to experience it?</p>
                <h3 className="text-base font-bold text-white mt-0.5">Explore {article.title} in TUKUBI</h3>
              </div>
              <Link
                href={article.ctaHref}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-caribbeanSea to-brand-sunriseCoral hover:brightness-110 text-slate-950 text-xs font-black transition-all flex items-center gap-2 shadow-lg min-h-[44px]"
              >
                {article.ctaLabel || 'Open Feature'} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {/* Helpful Feedback Widget */}
          <ArticleFeedback articleId={article?.slug || slug} slug={article?.slug || slug} />
        </article>

        {/* Right Rail: Table of Contents & Related Articles */}
        <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
          {tocItems.length > 0 && (
            <div className="surface-card rounded-2xl p-5 border border-white/10">
              <TableOfContents items={tocItems} />
            </div>
          )}

          {related.length > 0 && (
            <div className="surface-card rounded-2xl p-5 border border-white/10">
              <RelatedArticles articles={related} />
            </div>
          )}

          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-brand-sandstone/50">Need more assistance?</h4>
            <p className="text-xs text-brand-sandstone/70">
              Can&apos;t find what you need? Visit the Learn Center or ask the TUKUBI Assistant.
            </p>
            <Link
              href="/help"
              className="text-xs font-bold text-brand-caribbeanSea hover:underline flex items-center gap-1 pt-1"
            >
              Back to Search <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
