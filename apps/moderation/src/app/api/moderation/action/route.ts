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

  // 1. Fetch the case details
  const { data: caseRow } = await serviceClient
    .from('moderation_cases')
    .select('id, target_type, target_id, report_id')
    .eq('id', body.caseId)
    .maybeSingle();

  // 2. Insert the moderation action record
  const { error: actionErr } = await serviceClient.from('moderation_actions').insert({
    case_id: body.caseId,
    moderator_id: user.id,
    action,
    rationale,
  });

  if (actionErr) {
    return NextResponse.json({ error: actionErr.message }, { status: 500 });
  }

  // 3. Update the case status
  const newStatus = action === 'escalate' ? 'escalated' : 'decided';
  await serviceClient
    .from('moderation_cases')
    .update({ status: newStatus, decided_at: new Date().toISOString() })
    .eq('id', body.caseId);

  // 4. Apply side-effects to the target and linked report
  if (caseRow) {
    if (action === 'remove') {
      if (caseRow.target_type === 'post') {
        await serviceClient.from('posts').update({ is_hidden: true }).eq('id', caseRow.target_id);
      } else if (caseRow.target_type === 'comment') {
        await serviceClient.from('comments').update({ is_hidden: true }).eq('id', caseRow.target_id);
      }
      if (caseRow.report_id) {
        await serviceClient.from('reports').update({ status: 'resolved' }).eq('id', caseRow.report_id);
      }
    } else if (action === 'allow') {
      if (caseRow.report_id) {
        await serviceClient.from('reports').update({ status: 'dismissed' }).eq('id', caseRow.report_id);
      }
    }

    // 5. Append-only audit log
    await serviceClient.from('audit_logs').insert({
      action: `moderation_${action}`,
      target_table: caseRow.target_type === 'post' ? 'posts' : caseRow.target_type === 'comment' ? 'comments' : 'moderation_cases',
      target_id: caseRow.target_id,
      actor_id: user.id,
      new_values: { case_id: body.caseId, action, rationale },
    });
  }

  return NextResponse.json({ ok: true, action, status: newStatus });
}
