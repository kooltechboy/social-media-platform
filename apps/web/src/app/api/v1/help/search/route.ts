import { NextRequest, NextResponse } from 'next/server';
import { searchArticles, HELP_ARTICLES } from '../../../../../lib/help/articles-data';
import { createServiceSupabaseClient } from '../../../../../lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '10', 10), 1), 30);

  if (!q.trim()) {
    return NextResponse.json({ results: [] });
  }

  // 1. First attempt full-text search against Supabase if configured
  try {
    const supabase = await createServiceSupabaseClient();
    if (supabase) {
      const { data: dbArticles } = await supabase
        .from('help_articles')
        .select('id, slug, title, description, help_categories(title)')
        .eq('status', 'published')
        .eq('is_public', true)
        .textSearch('search_tokens', q, { type: 'websearch', config: 'english' })
        .limit(limit);

      // Async log the search query without blocking response
      try {
        await supabase.from('help_search_queries').insert({
          query: q.slice(0, 200),
          results_count: dbArticles?.length || 0,
        });
      } catch {
        // non-blocking
      }

      if (dbArticles && dbArticles.length > 0) {
        const results = dbArticles.map((a: any) => ({
          id: a.id,
          slug: a.slug,
          title: a.title,
          description: a.description,
          category_title: a.help_categories?.title || null,
        }));
        return NextResponse.json({ results });
      }
    }
  } catch {
    // fallback to static memory repository below
  }

  // 2. High-performance fallback: search in-memory verified articles repository
  const localResults = searchArticles(q, limit).map((a) => ({
    id: a.slug,
    slug: a.slug,
    title: a.title,
    description: a.description,
    category_title: a.categoryTitle,
  }));

  return NextResponse.json({ results: localResults });
}
