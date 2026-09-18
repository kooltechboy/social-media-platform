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
  const destinationParam = searchParams.get('to');

  let verifiedDestination: string | null = null;

  if (impressionIdStr) {
    const impressionId = parseInt(impressionIdStr, 10);
    if (!isNaN(impressionId)) {
      try {
        const supabase = await createSupabaseServerClient();
        if (supabase) {
          await supabase.from('ad_clicks').insert({
            impression_id: impressionId,
          });

          // Fetch verified destination URL from the database ad record
          const { data: impression } = await supabase
            .from('ad_impressions')
            .select('ad_id, ads(destination_url)')
            .eq('id', impressionId)
            .maybeSingle();

          if (impression && impression.ads) {
            const ad = Array.isArray(impression.ads) ? impression.ads[0] : impression.ads;
            if (ad?.destination_url) {
              verifiedDestination = (ad as any).destination_url;
            }
          }
        }
      } catch {
        // Non-blocking telemetry failure
      }
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
