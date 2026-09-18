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

    // Authoritative pricing: derive cost from ad set configuration, preventing client manipulation
    const { data: adRecord } = await supabase
      .from('ads')
      .select('ad_sets(bid_cpm_minor)')
      .eq('id', adId)
      .maybeSingle();

    let serverCostMinor = 0;
    if (adRecord && adRecord.ad_sets) {
      const adSet = Array.isArray(adRecord.ad_sets) ? adRecord.ad_sets[0] : adRecord.ad_sets;
      const cpm = Number((adSet as any)?.bid_cpm_minor) || 0;
      serverCostMinor = Math.max(0, Math.round(cpm / 1000));
    }

    // Insert impression record with authoritative pricing
    const { data, error } = await supabase
      .from('ad_impressions')
      .insert({
        ad_id: adId,
        viewer_id: user?.id || null,
        placement,
        cost_minor: serverCostMinor,
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
