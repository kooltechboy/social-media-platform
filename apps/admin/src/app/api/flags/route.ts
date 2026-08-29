import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient, createAnonSupabaseClient } from '../../../lib/supabase/server';

export async function POST(req: NextRequest) {
  const anonClient = await createAnonSupabaseClient();
  const serviceClient = await createAdminSupabaseClient();
  if (!anonClient || !serviceClient) {
    return NextResponse.json({ error: 'Not configured.' }, { status: 503 });
  }

  const body = await req.json().catch(() => null);
  if (
    !body ||
    typeof body.key !== 'string' ||
    body.key.trim().length === 0 ||
    body.key.length > 80 ||
    typeof body.enabled !== 'boolean'
  ) {
    return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 });
  }

  const { data: { user }, error: authError } = await anonClient.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  const { data: account } = await serviceClient
    .from('accounts')
    .select('role, status')
    .or(`profile_id.eq.${user.id},id.eq.${user.id}`)
    .maybeSingle();
  if (!account || account.status !== 'active' || !['admin', 'management', 'superadmin', 'super_admin'].includes(account.role)) {
    return NextResponse.json({ error: 'Forbidden. Admin privileges required.' }, { status: 403 });
  }

  const { error } = await serviceClient
    .from('feature_flags')
    .update({ enabled: body.enabled })
    .eq('key', body.key);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { error: auditError } = await serviceClient.from('audit_logs').insert({
    action: 'feature_flag_updated',
    entity_type: 'feature_flags',
    entity_id: null,
    actor_id: user.id,
    metadata: { key: body.key, enabled: body.enabled },
  });
  if (auditError) return NextResponse.json({ error: auditError.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
