import React from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  BookOpen,
  ArrowLeft,
  CheckCircle,
  Clock,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Search,
  ExternalLink,
  Plus,
  Filter,
} from 'lucide-react';
import { getAuthorizedUser, createServiceSupabaseClient } from '../../../lib/supabase/server';
import AccessDenied from '../../../components/access-denied';
import { HELP_ARTICLES } from '../../../lib/help/articles-data';

export const dynamic = 'force-dynamic';

export default async function AdminHelpCMSPage() {
  const auth = await getAuthorizedUser(['admin', 'management', 'superadmin']);
  if (!auth.isLoggedIn) {
    redirect('/login?next=/admin/help');
  }
  if (!auth.isAuthorized) {
    return (
      <AccessDenied
        user={auth.user}
        requiredRole="admin"
        currentRole={auth.role}
        resourceName="TUKUBI Help Center CMS"
      />
    );
  }

  const supabase = await createServiceSupabaseClient();

  let dbArticles: any[] = [];
  let dbQueries: any[] = [];
  let feedbackStats = { helpful: 0, notHelpful: 0 };

  if (supabase) {
    const [articlesRes, queriesRes, feedbackRes] = await Promise.all([
      supabase
        .from('help_articles')
        .select('id, slug, title, status, is_public, views_count, helpful_count, not_helpful_count, updated_at, help_categories(title)')
        .order('views_count', { ascending: false }),
      supabase
        .from('help_search_queries')
        .select('id, query, results_count, created_at')
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('help_article_feedback')
        .select('is_helpful'),
    ]);

    dbArticles = articlesRes.data || [];
    dbQueries = queriesRes.data || [];

    if (feedbackRes.data) {
      feedbackStats.helpful = feedbackRes.data.filter((f) => f.is_helpful).length;
      feedbackStats.notHelpful = feedbackRes.data.filter((f) => !f.is_helpful).length;
    }
  }

  // Combine DB articles with static verified articles if DB table not yet populated
  const displayArticles = dbArticles.length > 0
    ? dbArticles
    : HELP_ARTICLES.map((a) => ({
        id: a.slug,
        slug: a.slug,
        title: a.title,
        status: 'published',
        is_public: true,
        views_count: 0,
        helpful_count: 0,
        not_helpful_count: 0,
        updated_at: new Date().toISOString(),
        help_categories: { title: a.categoryTitle },
      }));

  const totalArticles = displayArticles.length;
  const publishedCount = displayArticles.filter((a) => a.status === 'published').length;

  return (
    <div className="w-full p-4 lg:p-8 space-y-8 animate-fadeIn text-brand-sandstone">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div className="space-y-1">
          <Link
            href="/admin"
            className="text-xs text-brand-sandstone/60 hover:text-white flex items-center gap-1 mb-2 transition-colors"
          >
            <ArrowLeft className="w-3 h-3" /> Back to Admin Console
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-brand-caribbeanSea" /> Help &amp; Knowledge Base CMS
          </h1>
          <p className="text-xs sm:text-sm text-brand-sandstone/70">
            Manage public help articles, FAQ entries, category taxonomy, and search analytics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Link
            href="/help"
            target="_blank"
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5" /> View Public /help
          </Link>
          <Link
            href="/learn"
            target="_blank"
            className="px-4 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-200 text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5" /> View Public /learn
          </Link>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
          <span className="text-[10px] uppercase font-bold text-brand-sandstone/60">Total Articles</span>
          <div className="text-2xl font-black text-white">{totalArticles}</div>
          <span className="text-[11px] text-brand-caribbeanSea font-semibold">{publishedCount} published live</span>
        </div>

        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
          <span className="text-[10px] uppercase font-bold text-brand-sandstone/60">Help Categories</span>
          <div className="text-2xl font-black text-white">17</div>
          <span className="text-[11px] text-emerald-400 font-semibold">Active &amp; Public</span>
        </div>

        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
          <span className="text-[10px] uppercase font-bold text-brand-sandstone/60">Helpful Feedback</span>
          <div className="text-2xl font-black text-emerald-400 flex items-center gap-1">
            <ThumbsUp className="w-5 h-5" /> {feedbackStats.helpful}
          </div>
          <span className="text-[11px] text-brand-sandstone/60">Positive responses</span>
        </div>

        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
          <span className="text-[10px] uppercase font-bold text-brand-sandstone/60">Needs Improvement</span>
          <div className="text-2xl font-black text-orange-400 flex items-center gap-1">
            <ThumbsDown className="w-5 h-5" /> {feedbackStats.notHelpful}
          </div>
          <span className="text-[11px] text-brand-sandstone/60">Unhelpful feedback</span>
        </div>
      </div>

      {/* Articles Management Table */}
      <div className="surface-card rounded-2xl border border-white/10 overflow-hidden">
        <div className="p-5 border-b border-white/10 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white">Knowledge Base Articles</h2>
            <p className="text-xs text-brand-sandstone/60">List of all guides and their current publication status.</p>
          </div>
          <span className="text-xs text-brand-sandstone/60 font-semibold">
            {displayArticles.length} Total
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 text-brand-sandstone/60 uppercase font-black tracking-wider text-[10px]">
                <th className="p-4">Title</th>
                <th className="p-4">Category</th>
                <th className="p-4">Status</th>
                <th className="p-4">Views</th>
                <th className="p-4">Feedback</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {displayArticles.map((art) => (
                <tr key={art.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-4 font-bold text-white">
                    <div className="line-clamp-1">{art.title}</div>
                    <span className="text-[10px] font-mono text-brand-sandstone/40">/help/{art.slug}</span>
                  </td>
                  <td className="p-4 text-brand-sandstone/80">
                    {art.help_categories?.title || 'General'}
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                      art.status === 'published'
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                        : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                    }`}>
                      <CheckCircle className="w-2.5 h-2.5" /> {art.status}
                    </span>
                  </td>
                  <td className="p-4 text-brand-sandstone/70">
                    {(art.views_count || 0).toLocaleString()}
                  </td>
                  <td className="p-4 text-brand-sandstone/70">
                    <span className="text-emerald-400">+{art.helpful_count || 0}</span> / <span className="text-orange-400">-{art.not_helpful_count || 0}</span>
                  </td>
                  <td className="p-4 text-right">
                    <Link
                      href={`/help/${art.slug}`}
                      target="_blank"
                      className="text-xs font-bold text-brand-caribbeanSea hover:underline inline-flex items-center gap-1"
                    >
                      View <ExternalLink className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Search Queries Analytics */}
      <div className="surface-card rounded-2xl p-6 border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Search className="w-4 h-4 text-brand-goldenHour" /> Search Query Analytics
            </h3>
            <p className="text-xs text-brand-sandstone/60">
              Terms users are searching for in the Help Center to identify documentation gaps.
            </p>
          </div>
          <span className="text-xs text-brand-sandstone/50 font-semibold">Latest queries</span>
        </div>

        {dbQueries.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {dbQueries.map((q) => (
              <div key={q.id} className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                <p className="text-xs font-bold text-white truncate">&quot;{q.query}&quot;</p>
                <div className="flex items-center justify-between text-[10px] text-brand-sandstone/50">
                  <span>{q.results_count} results</span>
                  <span>{new Date(q.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-brand-sandstone/50 italic py-2">
            No search logs recorded yet. Search activity will automatically populate here as users search /help.
          </p>
        )}
      </div>
    </div>
  );
}
