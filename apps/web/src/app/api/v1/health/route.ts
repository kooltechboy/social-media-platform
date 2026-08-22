import { NextResponse } from 'next/server';
import { createServerSupabase } from '../../../../lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startedAt = Date.now();
  const supabase = createServerSupabase();

  if (!supabase) {
    return NextResponse.json(
      { status: 'degraded', database: 'unconfigured', latencyMs: 0 },
      { status: 200 },
    );
  }

  try {
    const { error } = await supabase.from('feature_flags').select('key').limit(1);
    if (error) throw error;
    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      latencyMs: Date.now() - startedAt,
    });
  } catch {
    return NextResponse.json(
      { status: 'degraded', database: 'unreachable', latencyMs: Date.now() - startedAt },
      { status: 503 },
    );
  }
}
