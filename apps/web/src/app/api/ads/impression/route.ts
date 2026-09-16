import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, getCurrentUser } from '../../../../lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { adId, placement = 'feed', costMinor = 0 } = body;

    if (!adId) {
      return NextResponse.json({ error: 'adId is required' }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
    }

    const user = await getCurrentUser();

    // Insert impression record
    const { data, error } = await supabase
      .from('ad_impressions')
      .insert({
        ad_id: adId,
        viewer_id: user?.id || null,
        placement,
        cost_minor: Math.max(0, Number(costMinor) || 0),
      })
      .select('id')
      .single();

    if (error) {
      // Non-blocking telemetry failure
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, impressionId: data?.id });
  } catch (err: any) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Impression logging failure' },
      { status: 500 }
    );
  }
}
