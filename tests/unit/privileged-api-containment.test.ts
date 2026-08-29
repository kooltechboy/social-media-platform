import { beforeEach, describe, expect, it, vi } from 'vitest';

type Row = Record<string, unknown>;

const state = vi.hoisted(() => ({
  authUser: null as { id: string; email?: string } | null,
  authError: null as Error | null,
  accounts: [] as Row[],
  caseRow: {
    id: '00000000-0000-4000-8000-000000000001',
    target_type: 'post',
    target_id: '00000000-0000-4000-8000-000000000002',
    report_id: null,
  } as Row,
  updateError: null as Error | null,
  insertError: null as Error | null,
  calls: [] as Array<{ table: string; operation: string; values?: unknown }>,
}));

class Query {
  constructor(private readonly table: string) {}

  select() {
    return this;
  }

  or() {
    return this;
  }

  eq() {
    return this;
  }

  update(values: unknown) {
    state.calls.push({ table: this.table, operation: 'update', values });
    return this;
  }

  insert(values: unknown) {
    state.calls.push({ table: this.table, operation: 'insert', values });
    return this;
  }

  maybeSingle() {
    if (this.table === 'accounts') return Promise.resolve({ data: state.accounts[0] ?? null, error: null });
    if (this.table === 'moderation_cases') return Promise.resolve({ data: state.caseRow, error: null });
    return Promise.resolve({ data: null, error: null });
  }

  then(resolve: (result: { data: Row | null; error: Error | null }) => unknown) {
    return Promise.resolve(resolve({ data: null, error: this.table === 'audit_logs' ? state.insertError : state.updateError }));
  }
}

const clientFor = (key: string) => ({
  auth: {
    getUser: vi.fn(async () => ({ data: { user: state.authUser }, error: state.authError })),
  },
  from: (table: string) => new Query(table),
  key,
});

vi.mock('next/server', () => ({
  NextResponse: { json: (body: unknown, init?: ResponseInit) => Response.json(body, init) },
}));
vi.mock('../../apps/admin/src/lib/supabase/server', () => ({
  createAdminSupabaseClient: vi.fn(async () => clientFor('service-key')),
  createAnonSupabaseClient: vi.fn(async () => clientFor('anon-key')),
}));
vi.mock('../../apps/moderation/src/lib/supabase/server', () => ({
  createModerationSupabaseClient: vi.fn(async () => clientFor('service-key')),
  createAnonSupabaseClient: vi.fn(async () => clientFor('anon-key')),
}));

beforeEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key';
  state.authUser = { id: '00000000-0000-0000-0000-000000000010' };
  state.authError = null;
  state.accounts = [{ role: 'admin', status: 'active' }];
  state.caseRow = {
    id: '00000000-0000-4000-8000-000000000001',
    target_type: 'post',
    target_id: '00000000-0000-4000-8000-000000000002',
    report_id: null,
  };
  state.updateError = null;
  state.insertError = null;
  state.calls = [];
});

const request = (body: unknown) => new Request('http://localhost/api', {
  method: 'POST',
  body: JSON.stringify(body),
  headers: { 'content-type': 'application/json' },
});

describe('admin flags privileged API containment', () => {
  it('rejects unauthenticated callers before changing a flag', async () => {
    state.authUser = null;
    const { POST } = await import('../../apps/admin/src/app/api/flags/route');

    const response = await POST(request({ key: 'stories_enabled', enabled: true }) as never);

    expect(response.status).toBe(401);
    expect(state.calls).toHaveLength(0);
  });

  it('rejects inactive or non-admin accounts', async () => {
    state.accounts = [{ role: 'moderator', status: 'active' }];
    const { POST } = await import('../../apps/admin/src/app/api/flags/route');

    const response = await POST(request({ key: 'stories_enabled', enabled: true }) as never);

    expect(response.status).toBe(403);
    expect(state.calls).toHaveLength(0);
  });

  it('rejects inactive admin accounts', async () => {
    state.accounts = [{ role: 'admin', status: 'suspended' }];
    const { POST } = await import('../../apps/admin/src/app/api/flags/route');

    const response = await POST(request({ key: 'stories_enabled', enabled: true }) as never);

    expect(response.status).toBe(403);
    expect(state.calls).toHaveLength(0);
  });

  it('requires a bounded non-empty flag key', async () => {
    const { POST } = await import('../../apps/admin/src/app/api/flags/route');

    const response = await POST(request({ key: ' '.repeat(81), enabled: true }) as never);

    expect(response.status).toBe(400);
    expect(state.calls).toHaveLength(0);
  });

  it('records a schema-compatible audit entry and fails if audit recording fails', async () => {
    state.insertError = new Error('audit unavailable');
    const { POST } = await import('../../apps/admin/src/app/api/flags/route');

    const response = await POST(request({ key: 'stories_enabled', enabled: true }) as never);

    expect(response.status).toBe(500);
    expect(state.calls.some(({ table }) => table === 'audit_logs')).toBe(true);
    expect(state.calls.find(({ table }) => table === 'audit_logs')?.values).toMatchObject({
      action: 'feature_flag_updated',
      entity_type: 'feature_flags',
      entity_id: null,
      metadata: { key: 'stories_enabled', enabled: true },
    });
  });
});

describe('moderation action privileged API containment', () => {
  it('rejects an authenticated user without an account', async () => {
    state.accounts = [];
    const { POST } = await import('../../apps/moderation/src/app/api/moderation/action/route');

    const response = await POST(request({
      caseId: state.caseRow?.id,
      action: 'remove',
    }) as never);

    expect(response.status).toBe(403);
    expect(state.calls).toHaveLength(0);
  });

  it('rejects inactive moderator accounts', async () => {
    state.accounts = [{ role: 'moderator', status: 'suspended' }];
    const { POST } = await import('../../apps/moderation/src/app/api/moderation/action/route');

    const response = await POST(request({
      caseId: state.caseRow?.id,
      action: 'remove',
    }) as never);

    expect(response.status).toBe(403);
    expect(state.calls).toHaveLength(0);
  });

  it('rejects malformed case identifiers', async () => {
    const { POST } = await import('../../apps/moderation/src/app/api/moderation/action/route');

    const response = await POST(request({ caseId: 'not-a-uuid', action: 'remove' }) as never);

    expect(response.status).toBe(400);
    expect(state.calls).toHaveLength(0);
  });

  it('does not report success when audit recording fails', async () => {
    state.insertError = new Error('audit unavailable');
    const { POST } = await import('../../apps/moderation/src/app/api/moderation/action/route');

    const response = await POST(request({
      caseId: state.caseRow?.id,
      action: 'remove',
    }) as never);

    expect(response.status).toBe(500);
    expect(state.calls.find(({ table }) => table === 'audit_logs')?.values).toMatchObject({
      action: 'moderation_remove',
      entity_type: 'posts',
      entity_id: state.caseRow?.target_id,
    });
  });
});
