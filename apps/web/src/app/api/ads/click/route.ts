import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '../../../../lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { impressionId } = body;

    if (!impressionId) {
      return NextResponse.json({ error: 'impressionId is required' }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
    }

    const { error } = await supabase.from('ad_clicks').insert({
      impression_id: impressionId,
    });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Click logging failure' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const impressionIdStr = searchParams.get('impressionId');
  const destination = searchParams.get('to') || '/';

  if (impressionIdStr) {
    const impressionId = parseInt(impressionIdStr, 10);
    if (!isNaN(impressionId)) {
      try {
        const supabase = await createSupabaseServerClient();
        if (supabase) {
          await supabase.from('ad_clicks').insert({
            impression_id: impressionId,
          });
        }
      } catch {
        // Non-blocking telemetry failure
      }
    }
  }

  // Safe redirect validation
  let targetUrl = destination;
  try {
    const parsed = new URL(destination, request.url);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      targetUrl = parsed.toString();
    }
  } catch {
    targetUrl = '/';
  }

  return NextResponse.redirect(new URL(targetUrl, request.url));
}
