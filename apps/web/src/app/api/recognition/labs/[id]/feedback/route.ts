import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, getCurrentUser } from '../../../../../../lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const supabase = await createSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
    }

    const body = await request.json().catch(() => ({}));
    const { rating, feedback_text, reported_issue } = body;

    if (!feedback_text || typeof feedback_text !== 'string') {
      return NextResponse.json({ error: 'Feedback text is required' }, { status: 400 });
    }

    const { error } = await supabase.from('labs_feedback').insert({
      program_id: id,
      profile_id: currentUser.id,
      rating: typeof rating === 'number' ? rating : null,
      feedback_text: feedback_text.trim(),
      reported_issue: Boolean(reported_issue),
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Increment feedback count on membership record
    await supabase
      .from('labs_members')
      .update({ feedback_count: 1 })
      .eq('program_id', id)
      .eq('profile_id', currentUser.id);

    return NextResponse.json({ success: true, message: 'Thank you for your valuable feedback!' });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
