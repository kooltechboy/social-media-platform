import { createHash } from 'crypto';

export type Table =
  | 'countries' | 'regions' | 'cities' | 'languages' | 'country_languages'
  | 'profiles' | 'profile_identity' | 'profile_interests'
  | 'follows' | 'blocks' | 'friendships' | 'mutes'
  | 'posts' | 'comments' | 'post_reactions' | 'post_media' | 'post_hashtags' | 'post_mentions'
  | 'communities' | 'community_members' | 'community_roles'
  | 'notifications' | 'analytics_events' | 'feature_flags'
  | 'reports' | 'moderation_cases' | 'moderation_actions' | 'risk_scores'
  | 'conversations' | 'conversation_members' | 'messages' | 'message_attachments' | 'message_receipts'
  | 'stories' | 'story_views' | 'videos' | 'video_views' | 'creator_accounts' | 'subscriptions'
  | 'livestreams' | 'live_messages' | 'live_gifts' | 'podcasts' | 'podcast_episodes' | 'podcast_followers'
  | 'ledger_accounts' | 'ledger_entries' | 'psp_capabilities'
  | 'payment_intents' | 'payment_methods' | 'payment_attempts' | 'idempotency_keys'
  | 'refunds' | 'disputes' | 'chargebacks' | 'payouts' | 'commissions'
  | 'businesses' | 'business_locations' | 'business_reviews'
  | 'products' | 'orders' | 'order_items' | 'events' | 'event_attendees' | 'tickets'
  | 'advertisers' | 'campaigns' | 'ad_sets' | 'ads' | 'ad_impressions' | 'ad_clicks'
  | 'device_sessions' | 'login_events' | 'audit_logs' | 'security_events'
  | 'official_accounts' | 'official_account_operators' | 'official_post_drafts' | 'reserved_usernames'
  | 'creator_content_drafts';

export type Visibility = 'public' | 'followers' | 'friends' | 'private';

export interface CursorPayload {
  sortKey: string;
  id: string;
}

export function encodeCursor(payload: CursorPayload): string {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

export function decodeCursor(cursor: string): CursorPayload {
  const parsed = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')) as CursorPayload;
  if (!parsed.sortKey || !parsed.id) {
    throw new Error('Malformed cursor');
  }
  return parsed;
}

export interface SqlStatement {
  text: string;
  params: unknown[];
}

export function hashIdentifier(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export interface RlsAssertion {
  name: string;
  statement: SqlStatement;
  expectRowCount: number;
}

export interface RlsTestRole {
  role: 'anon' | 'authenticated' | 'owner' | 'service';
  userId?: string;
}

export interface RlsTestCase {
  table: Table;
  operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
  role: RlsTestRole;
  shouldSeeRows: boolean;
}

export function buildRlsAssertion(test: RlsTestCase): RlsAssertion {
  const setRole = test.role.role === 'service' ? 'service_role' : test.role.role;
  const claim = test.role.userId
    ? `set claim request.jwt.claims to '{"sub":"${test.role.userId}","role":"authenticated"}';`
    : `set claim request.jwt.claims to '{"role":"${setRole}"}';`;
  const statement: SqlStatement = {
    text: `begin; ${claim} select count(*)::int as count from public.${test.table}; rollback;`,
    params: [],
  };
  return {
    name: `${test.role.role} ${test.operation} on ${test.table} should ${test.shouldSeeRows ? 'see rows' : 'see zero rows'}`,
    statement,
    expectRowCount: test.shouldSeeRows ? -1 : 0,
  };
}

export class RlsTestHarness {
  private readonly cases: RlsTestCase[] = [];

  public add(test: RlsTestCase): this {
    if (test.role.role === 'owner' && !test.role.userId) {
      throw new Error('Owner role requires userId');
    }
    this.cases.push(test);
    return this;
  }

  public addForTable(table: Table, opts: { clientReadable: boolean }): this {
    this.add({ table, operation: 'SELECT', role: { role: 'anon' }, shouldSeeRows: false });
    this.add({ table, operation: 'SELECT', role: { role: 'service' }, shouldSeeRows: true });
    if (!opts.clientReadable) {
      this.add({
        table,
        operation: 'SELECT',
        role: { role: 'authenticated', userId: '00000000-0000-0000-0000-000000000001' },
        shouldSeeRows: false,
      });
    }
    return this;
  }

  public compile(): RlsAssertion[] {
    return this.cases.map(buildRlsAssertion);
  }
}
