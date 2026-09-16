import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabaseClient } from '../../../../../lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { article_id, slug, is_helpful, feedback_text } = body;

    const supabase = await createServiceSupabaseClient();
    if (supabase && (article_id || slug)) {
      // Find article UUID if only slug was passed
      let articleUuid = article_id;
      if (!articleUuid || !articleUuid.includes('-')) {
        const { data: art } = await supabase
          .from('help_articles')
          .select('id')
          .eq('slug', slug)
          .maybeSingle();
        if (art) articleUuid = art.id;
      }

      if (articleUuid) {
        // Record feedback
        await supabase.from('help_article_feedback').insert({
          article_id: articleUuid,
          is_helpful: Boolean(is_helpful),
          feedback_text: feedback_text ? String(feedback_text).slice(0, 500) : null,
        });

        // Update counter on the article
        if (is_helpful) {
          try {
            await supabase.rpc('increment_help_article_views', { article_uuid: articleUuid });
          } catch {
            // non-blocking
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Failed to record feedback' }, { status: 500 });
  }
}
