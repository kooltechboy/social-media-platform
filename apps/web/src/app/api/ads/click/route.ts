import { NextRequest, NextResponse } from 'next/server';
import {
  createServiceSupabaseClient,
  createSupabaseServerClient,
  getCurrentUser,
} from '../../../../lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { impressionId } = body;

    if (!impressionId) {
      return NextResponse.json({ error: 'impressionId is required' }, { status: 400 });
    }

    const supabase = (await createServiceSupabaseClient()) || (await createSupabaseServerClient());
    if (!supabase) {
      return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
    }

    const user = await getCurrentUser().catch(() => null);

    // Check if click was already recorded for this impressionId (deduplication)
    const { data: existingClick } = await supabase
      .from('ad_clicks')
      .select('id')
      .eq('impression_id', impressionId)
      .maybeSingle();

    if (existingClick?.id) {
      return NextResponse.json({ success: true, deduplicated: true });
    }

    const { error } = await supabase.from('ad_clicks').insert({
      impression_id: impressionId,
    });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    // Also record in ad_events if impression maps to an ad_id
    const { data: imp } = await supabase
      .from('ad_impressions')
      .select('ad_id, placement')
      .eq('id', impressionId)
      .maybeSingle();

    if (imp?.ad_id) {
      await supabase.from('ad_events').insert({
        ad_id: imp.ad_id,
        viewer_id: user?.id || null,
        event_type: 'click',
        placement: imp.placement || 'feed',
        cost_charged_minor: 0,
      });
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
  const destinationParam = searchParams.get('to');

  let verifiedDestination: string | null = null;

  if (impressionIdStr) {
    try {
      const supabase = (await createServiceSupabaseClient()) || (await createSupabaseServerClient());
      if (supabase) {
        const { data: existingClick } = await supabase
          .from('ad_clicks')
          .select('id')
          .eq('impression_id', impressionIdStr)
          .maybeSingle();

        if (!existingClick?.id) {
          await supabase.from('ad_clicks').insert({
            impression_id: impressionIdStr,
          });
        }

        // Fetch verified destination URL from the database ad record
        const { data: impression } = await supabase
          .from('ad_impressions')
          .select('ad_id, placement, ads(destination_url)')
          .eq('id', impressionIdStr)
          .maybeSingle();

        if (impression && impression.ads) {
          const ad = Array.isArray(impression.ads) ? impression.ads[0] : impression.ads;
          if (ad?.destination_url) {
            verifiedDestination = (ad as any).destination_url;
          }
          if (!existingClick?.id && impression.ad_id) {
            await supabase.from('ad_events').insert({
              ad_id: impression.ad_id,
              event_type: 'click',
              placement: impression.placement || 'feed',
              cost_charged_minor: 0,
            });
          }
        }
      }
    } catch {
      // Non-blocking telemetry failure
    }
  }

  // Determine final safe target URL
  let targetUrl = '/';

  if (verifiedDestination) {
    try {
      const parsed = new URL(verifiedDestination, request.url);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        targetUrl = parsed.toString();
      }
    } catch {
      targetUrl = '/';
    }
  } else if (destinationParam) {
    // Only allow safe internal relative paths when not backed by an ad record
    if (
      destinationParam.startsWith('/') &&
      !destinationParam.startsWith('//') &&
      !destinationParam.includes('\\')
    ) {
      targetUrl = destinationParam;
    }
  }

  return NextResponse.redirect(new URL(targetUrl, request.url));
}
