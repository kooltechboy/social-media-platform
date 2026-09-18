import { createHash } from 'crypto';

export type Table =
  | 'countries' | 'regions' | 'cities' | 'languages' | 'country_languages'
  | 'profiles' | 'profile_identity' | 'profile_interests' | 'profile_counts'
  | 'follows' | 'blocks' | 'friendships' | 'mutes'
  | 'posts' | 'comments' | 'post_reactions' | 'post_media' | 'post_hashtags' | 'post_mentions' | 'post_shares' | 'saved_posts'
  | 'communities' | 'community_members' | 'community_roles'
  | 'notifications' | 'notification_preferences' | 'analytics_events' | 'feature_flags'
  | 'reports' | 'moderation_cases' | 'moderation_actions' | 'risk_scores'
  | 'conversations' | 'conversation_members' | 'messages' | 'message_attachments' | 'message_receipts' | 'message_reactions' | 'message_requests'
  | 'stories' | 'story_views' | 'videos' | 'video_views' | 'creator_accounts' | 'subscriptions'
  | 'livestreams' | 'live_messages' | 'live_gifts' | 'live_moderators' | 'live_replays' | 'live_viewers' | 'livestream_products'
  | 'podcasts' | 'podcast_episodes' | 'podcast_followers' | 'podcast_progress' | 'podcast_analytics'
  | 'sounds' | 'sound_licenses' | 'sound_usage' | 'sound_lounges' | 'sound_lounge_members'
  | 'ledger_accounts' | 'ledger_entries' | 'psp_capabilities'
  | 'payment_intents' | 'payment_methods' | 'payment_attempts' | 'payment_connections' | 'payment_providers' | 'payment_transactions' | 'payment_webhooks' | 'payment_audit_logs' | 'idempotency_keys'
  | 'refunds' | 'disputes' | 'chargebacks' | 'payouts' | 'commissions' | 'commission_rules' | 'commission_snapshots' | 'financial_disputes'
  | 'reconciliation_reports' | 'transfer_records'
  | 'businesses' | 'business_locations' | 'business_reviews' | 'business_subscriptions' | 'business_ai_configs'
  | 'products' | 'product_variants' | 'product_tags' | 'product_reviews' | 'seller_plans' | 'storefront_configs'
  | 'marketplace_categories' | 'marketplace_offers' | 'marketplace_product_media' | 'marketplace_disputes' | 'marketplace_dispute_messages' | 'marketplace_shipments' | 'marketplace_wishlists' | 'marketplace_saved_searches' | 'marketplace_reports' | 'marketplace_affiliate_links'
  | 'orders' | 'order_items' | 'events' | 'event_attendees' | 'tickets'
  | 'advertisers' | 'campaigns' | 'ad_sets' | 'ads' | 'ad_impressions' | 'ad_clicks' | 'ad_events' | 'brand_campaign_briefs'
  | 'device_sessions' | 'login_events' | 'audit_logs' | 'security_events' | 'accounts' | 'user_devices'
  | 'official_accounts' | 'official_account_operators' | 'official_post_drafts' | 'reserved_usernames'
  | 'creator_content_drafts' | 'creator_applications' | 'creator_marketplace_profiles' | 'creator_subscription_plans' | 'creator_team_members' | 'monetization_rules' | 'monetization_tier_configs'
  | 'early_access_programs' | 'early_access_members' | 'founder_programs' | 'founder_members' | 'founders_council' | 'founders_council_members' | 'ambassador_programs' | 'ambassador_members' | 'academy_programs' | 'labs_programs' | 'labs_members' | 'labs_feedback'
  | 'awards_programs' | 'award_nominations' | 'award_winners'
  | 'recognition_badges' | 'recognition_badge_categories' | 'recognition_achievements' | 'recognition_referrals' | 'reputation_levels' | 'user_badges' | 'user_achievements' | 'user_certifications' | 'user_reputation' | 'user_favorites' | 'user_active_identity'
  | 'feed_activity_timeline' | 'trending_signals' | 'content_translations_cache' | 'commercial_subscriptions' | 'commercial_rule_audit_logs' | 'affiliate_referrals' | 'media_assets' | 'parental_consent_requests' | 'polls' | 'poll_options' | 'poll_votes' | 'recommendation_feedback' | 'spotlights'
  | 'help_categories' | 'help_articles' | 'help_faqs' | 'help_article_feedback' | 'help_search_queries' | 'help_tutorial_steps';

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
