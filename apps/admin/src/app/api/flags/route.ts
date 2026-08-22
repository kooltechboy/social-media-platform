import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ error: 'Not configured.' }, { status: 503 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body.key !== 'string' || typeof body.enabled !== 'boolean') {
    return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 });
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(url, serviceKey, {
    cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll() {},
    },
    auth: { persistSession: false },
  });

  const { error } = await supabase
    .from('feature_flags')
    .update({ enabled: body.enabled })
    .eq('key', body.key);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
