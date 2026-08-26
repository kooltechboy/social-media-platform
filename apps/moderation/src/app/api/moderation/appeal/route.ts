import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

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
    !['upheld', 'overturned'].includes(body.decision)
  ) {
    return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 });
  }

  const cookieStore = await cookies();

  // Authenticate the moderator caller
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

  // Verify moderator/admin role
  const { data: account } = await serviceClient
    .from('accounts')
    .select('role')
    .or(`profile_id.eq.${user.id},id.eq.${user.id}`)
    .maybeSingle();

  if (account && !['moderator', 'admin', 'management', 'superadmin'].includes(account.role)) {
    return NextResponse.json({ error: 'Forbidden. Moderator privileges required.' }, { status: 403 });
  }

  const decision = body.decision as 'upheld' | 'overturned';
  const rationale = typeof body.rationale === 'string' ? body.rationale.slice(0, 500) : null;

  // 1. Fetch the case details
  const { data: caseRow } = await serviceClient
    .from('moderation_cases')
    .select('id, target_type, target_id, appeal_status')
    .eq('id', body.caseId)
    .maybeSingle();

  if (!caseRow) {
    return NextResponse.json({ error: 'Case not found.' }, { status: 404 });
  }

  // 2. Update the appeal record on the case
  await serviceClient
    .from('moderation_cases')
    .update({
      appeal_status: decision,
      appeal_rationale: rationale,
      appeal_decided_by: user.id,
      appeal_decided_at: new Date().toISOString(),
      status: decision === 'overturned' ? 'decided' : 'decided',
    })
    .eq('id', body.caseId);

  // 3. Side-effects: If overturned, restore content visibility
  if (decision === 'overturned') {
    if (caseRow.target_type === 'post') {
      await serviceClient.from('posts').update({ is_hidden: false }).eq('id', caseRow.target_id);
    } else if (caseRow.target_type === 'comment') {
      await serviceClient.from('comments').update({ is_hidden: false }).eq('id', caseRow.target_id);
    }
  }

  // 4. Audit log entry
  await serviceClient.from('audit_logs').insert({
    action: `appeal_${decision}`,
    target_table: 'moderation_cases',
    target_id: body.caseId,
    actor_id: user.id,
    new_values: { decision, rationale },
  });

  return NextResponse.json({ ok: true, decision });
}
