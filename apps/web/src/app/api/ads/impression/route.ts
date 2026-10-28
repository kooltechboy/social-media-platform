import { NextRequest, NextResponse } from 'next/server';
import {
  createServiceSupabaseClient,
  createSupabaseServerClient,
  getCurrentUser,
} from '../../../../lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { adId, placement = 'feed' } = body;

    if (!adId) {
      return NextResponse.json({ error: 'adId is required' }, { status: 400 });
    }

    const supabase = (await createServiceSupabaseClient()) || (await createSupabaseServerClient());
    if (!supabase) {
      return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
    }

    const user = await getCurrentUser().catch(() => null);

    // 1. Primary path: atomic server-computed spend + impression + double-entry ledger RPC
    if (typeof (supabase as any).rpc === 'function') {
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        'record_ad_impression_and_spend',
        {
          p_ad_id: adId,
          p_viewer_id: user?.id || null,
          p_placement: placement,
          p_cost_minor: 0,
        }
      );

      if (!rpcError && rpcData) {
        if (rpcData.recorded === false) {
          return NextResponse.json(
            { success: false, reason: rpcData.reason || 'Impression not billable' },
            { status: 400 }
          );
        }
        return NextResponse.json({
          success: true,
          impressionId: rpcData.impression_id,
          deduplicated: Boolean(rpcData.deduplicated),
        });
      }
    }

    // 2. Fallback path: derive cost from ad_sets configuration and insert impression
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
