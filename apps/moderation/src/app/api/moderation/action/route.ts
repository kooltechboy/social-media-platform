import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

type ModerationAction = 'remove' | 'restrict' | 'allow' | 'escalate';

export async function POST(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !serviceKey || !anonKey) {
    return NextResponse.json({ error: 'Not configured.' }, { status: 503 });
  }

  const body = await req.json().catch(() => null);
  if (
    !body ||
    typeof body.caseId !== 'string' ||
    !['remove', 'restrict', 'allow', 'escalate'].includes(body.action)
  ) {
    return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 });
  }

  const cookieStore = await cookies();

  // Authenticate the caller
  const anonClient = createServerClient(url, anonKey, {
    cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll() {},
    },
  });
  const { data: { user }, error: authErr } = await anonClient.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  // Use service role for writes
  const serviceClient = createServerClient(url, serviceKey, {
    cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll() {},
    },
    auth: { persistSession: false },
  });

  const action = body.action as ModerationAction;
  const rationale: string | null = typeof body.rationale === 'string' ? body.rationale.slice(0, 500) : null;

  const { error: actionErr } = await serviceClient.from('moderation_actions').insert({
    case_id: body.caseId,
    moderator_id: user.id,
    action,
    rationale,
  });

  if (actionErr) {
    return NextResponse.json({ error: actionErr.message }, { status: 500 });
  }

  const newStatus = action === 'escalate' ? 'escalated' : 'decided';
  await serviceClient
    .from('moderation_cases')
    .update({ status: newStatus, decided_at: new Date().toISOString() })
    .eq('id', body.caseId);

  return NextResponse.json({ ok: true, action, status: newStatus });
}
