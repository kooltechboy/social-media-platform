import { NextRequest, NextResponse } from 'next/server';
import { createModerationSupabaseClient, createAnonSupabaseClient } from '../../../../lib/supabase/server';

type ModerationAction = 'remove' | 'restrict' | 'allow' | 'escalate';

export async function POST(req: NextRequest) {
  const anonClient = await createAnonSupabaseClient();
  const serviceClient = await createModerationSupabaseClient();
  if (!anonClient || !serviceClient) {
    return NextResponse.json({ error: 'Not configured.' }, { status: 503 });
  }

  const body = await req.json().catch(() => null);
  if (
    !body ||
    typeof body.caseId !== 'string' ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.caseId) ||
    !['remove', 'restrict', 'allow', 'escalate'].includes(body.action)
  ) {
    return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 });
  }

  // Authenticate the caller
  const { data: { user }, error: authErr } = await anonClient.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  const { data: account } = await serviceClient
    .from('accounts')
    .select('role, status')
    .or(`profile_id.eq.${user.id},id.eq.${user.id}`)
    .maybeSingle();
  if (!account || account.status !== 'active' || !['moderator', 'admin', 'management', 'superadmin', 'super_admin'].includes(account.role)) {
    return NextResponse.json({ error: 'Forbidden. Moderator privileges required.' }, { status: 403 });
  }

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
    const { error: auditError } = await serviceClient.from('audit_logs').insert({
      action: `moderation_${action}`,
      entity_type: caseRow.target_type === 'post' ? 'posts' : caseRow.target_type === 'comment' ? 'comments' : 'moderation_cases',
      entity_id: caseRow.target_id,
      actor_id: user.id,
      metadata: { case_id: body.caseId, action, rationale },
    });
    if (auditError) return NextResponse.json({ error: auditError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, action, status: newStatus });
}
