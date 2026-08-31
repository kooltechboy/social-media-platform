import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '../../../../lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    const supabase = await createSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
    }

    let query = supabase
      .from('recognition_badges')
      .select(`
        id, slug, name, description, icon, tier, rarity, color_theme, display_priority, max_recipients, current_recipients_count,
        category:recognition_badge_categories(slug, name, icon)
      `)
      .eq('is_active', true)
      .order('display_priority', { ascending: false });

    if (category) {
      query = query.eq('category.slug', category);
    }

    const { data: badges, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ badges: badges ?? [] });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
