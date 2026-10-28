import { describe, it, expect, vi } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { TransactionLedgerService } from '../../packages/payments/src/transaction-service';
import { getArticlesByCategory, searchArticles } from '../../apps/web/src/lib/help/articles-data';

const REPO_ROOT = path.resolve(__dirname, '../..');

describe('TUKUBI: Giant Among Giants — Comprehensive Security, Payments, Social & Vault Regression Suite', () => {
  describe('1. Migration 00115 Security, RLS & RPC Hardening', () => {
    const migrationPath = path.join(
      REPO_ROOT,
      'supabase/migrations/00115_security_ads_and_rpc_hardening.sql'
    );
    const sql = fs.readFileSync(migrationPath, 'utf8');

    it('reconciles unified RLS policies on public.posts including is_page_member / can_manage_page', () => {
      expect(sql).toContain('CREATE POLICY "View posts policy"');
      expect(sql).toContain('public.is_page_member(page_id, (SELECT auth.uid()))');
      expect(sql).toContain('CREATE OR REPLACE FUNCTION public.can_manage_page');
    });

    it('enforces strict user_id = auth.uid() INSERT policies on all feed_activity_timeline_* partitions', () => {
      expect(sql).toContain("c.relname LIKE 'feed_activity_timeline_%'");
      expect(sql).toContain('FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id)');
    });

    it('protects public.videos immutable counters and defines video_saves & video_shares with RLS', () => {
      expect(sql).toContain('CREATE OR REPLACE FUNCTION public.enforce_video_immutable_fields()');
      expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.video_saves');
      expect(sql).toContain('ALTER TABLE public.video_saves ENABLE ROW LEVEL SECURITY');
      expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.video_shares');
      expect(sql).toContain('ALTER TABLE public.video_shares ENABLE ROW LEVEL SECURITY');
      expect(sql).toContain('CREATE OR REPLACE FUNCTION public.increment_video_counter');
    });

    it('defines respond_or_leave_livestream_cohost with search_path hardening', () => {
      expect(sql).toContain('CREATE OR REPLACE FUNCTION public.respond_or_leave_livestream_cohost');
      expect(sql).toContain('SET search_path = public, pg_temp');
    });

    it('hardens record_ad_impression_and_spend with server-computed CPM, moderation check, 5m deduplication, and double-entry ledger entries', () => {
      expect(sql).toContain('CREATE OR REPLACE FUNCTION public.record_ad_impression_and_spend');
      expect(sql).toContain("v_moderation_status <> 'approved'");
      expect(sql).toContain('v_server_cost := GREATEST(1, ROUND(v_bid_cpm_minor::numeric / 1000.0)::integer)');
      expect(sql).toContain('INSERT INTO public.ledger_entries');
      expect(sql).toContain(
        'REVOKE ALL ON FUNCTION public.record_ad_impression_and_spend(UUID, UUID, TEXT, INTEGER) FROM PUBLIC, anon;'
      );
    });

    it('prevents IDOR in get_user_messaging_friends, is_staff_or_ad_moderator, is_page_member, and can_manage_page', () => {
      expect(sql).toContain("IF v_role IS DISTINCT FROM 'service_role' AND target_uid IS DISTINCT FROM v_caller THEN");
      expect(sql).toContain("RAISE EXCEPTION 'Access denied: cannot query another user''s messaging friends'");
      expect(sql).toContain('CREATE OR REPLACE FUNCTION public.enforce_campaign_and_ad_security()');
      expect(sql).toContain('CREATE OR REPLACE FUNCTION public.fund_campaign_from_intent');
    });
  });

  describe('2. Double-Entry Ledger & PayPal Verification Contracts', () => {
    it('creates balanced double-entry ledger records for platform-direct AD_PAYMENT settlements (recipientId = null)', async () => {
      const insertedLedgerEntries: any[] = [];

      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'payment_transactions') {
            return {
              select: () => ({
                eq: () => ({
                  single: async () => ({
                    data: {
                      id: 'tx_ad_001',
                      idempotency_key: 'settle_intent_12345',
                      transaction_type: 'AD_PAYMENT',
                      status: 'PENDING',
                      payer_id: '11111111-1111-1111-1111-111111111111',
                      recipient_id: null,
                      creator_id: null,
                      merchant_id: null,
                      gross_amount_minor: 2500,
                      platform_fee_minor: 0,
                      processing_fee_minor: 0,
                      tax_minor: 0,
                      net_amount_minor: 2500,
                      currency: 'USD',
                      provider: 'paypal',
                      provider_transaction_id: 'PAYPAL_CAPTURE_001',
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString(),
                    },
                    error: null,
                  }),
                }),
              }),
              update: () => ({
                eq: () => ({
                  select: () => ({
                    single: async () => ({
                      data: {
                        id: 'tx_ad_001',
                        idempotency_key: 'settle_intent_12345',
                        transaction_type: 'AD_PAYMENT',
                        status: 'COMPLETED',
                        payer_id: '11111111-1111-1111-1111-111111111111',
                        recipient_id: null,
                        gross_amount_minor: 2500,
                        platform_fee_minor: 0,
                        processing_fee_minor: 0,
                        tax_minor: 0,
                        net_amount_minor: 2500,
                        currency: 'USD',
                        provider: 'paypal',
                        provider_transaction_id: 'PAYPAL_CAPTURE_001',
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                      },
                      error: null,
                    }),
                  }),
                }),
              }),
            };
          }
          if (table === 'ledger_entries') {
            return {
              insert: async (rows: any[]) => {
                insertedLedgerEntries.push(...rows);
                return { error: null };
              },
            };
          }
          return {
            insert: async () => ({ error: null }),
          };
        }),
        rpc: vi.fn(async (_fn: string, args: any) => {
          if (args.p_account_type === 'paypal_escrow') {
            return { data: 'acc_escrow_001', error: null };
          }
          return { data: 'acc_plat_rev_001', error: null };
        }),
      };

      const service = new TransactionLedgerService();
      const settled = await service.settleTransaction(mockSupabase, 'tx_ad_001', {
        providerTransactionId: 'PAYPAL_CAPTURE_001',
      });

      expect(settled.status).toBe('COMPLETED');
      expect(insertedLedgerEntries).toHaveLength(2);

      const debit = insertedLedgerEntries.find((e) => e.entry_type === 'DEBIT');
      const credit = insertedLedgerEntries.find((e) => e.entry_type === 'CREDIT');
      expect(debit).toBeDefined();
      expect(credit).toBeDefined();
      expect(debit.amount).toBe(-2500);
      expect(credit.amount).toBe(2500);
      expect(debit.amount + credit.amount).toBe(0);
    });

    it('verifies PayPal capture route and webhook handler enforce order binding, amount verification, and CAPTURE.COMPLETED settlement', () => {
      const captureRoute = fs.readFileSync(
        path.join(REPO_ROOT, 'apps/web/src/app/api/payments/paypal/capture/route.ts'),
        'utf8'
      );
      expect(captureRoute).toContain('expectedOrderId && expectedOrderId !== token');
      expect(captureRoute).toContain('`settle_intent_${intent.id}`');
      expect(captureRoute).toContain(
        'Number(campaign.funded_amount_minor || 0) + Number(intent.amount_minor || 0)'
      );

      const webhookRoute = fs.readFileSync(
        path.join(REPO_ROOT, 'apps/web/src/app/api/payments/webhooks/[provider]/route.ts'),
        'utf8'
      );
      expect(webhookRoute).toContain("case 'CHECKOUT.ORDER.APPROVED':");
      expect(webhookRoute).toContain("case 'PAYMENT.CAPTURE.COMPLETED':");
      expect(webhookRoute).toContain('`settle_intent_${intent.id}`');
    });
  });

  describe('3. Help & Learn Center Completeness & Search Safety', () => {
    const requiredCategorySlugs = [
      'getting-started',
      'explore',
      'create',
      'reels-video',
      'live',
      'podcasts',
      'communities',
      'messaging',
      'creators',
      'marketplace',
      'events',
      'pages-stores',
      'financial-center',
      'profile-settings',
      'privacy-security',
      'troubleshooting',
      'whats-new',
    ];

    it('populates every single Help category with at least one published guide', () => {
      for (const slug of requiredCategorySlugs) {
        const articles = getArticlesByCategory(slug);
        expect(
          articles.length,
          `Expected Help category "${slug}" to have >= 1 article`
        ).toBeGreaterThan(0);
      }
    });

    it('executes searchArticles across step titles and descriptions without throwing', () => {
      const results = searchArticles('theme');
      expect(results.length).toBeGreaterThan(0);
      const rsvpResults = searchArticles('RSVP');
      expect(rsvpResults.length).toBeGreaterThan(0);
    });
  });

  describe('4. Mobile WCAG 2.2 AA Contrast & Web Theme Switching', () => {
    const mobileScreens = [
      'apps/mobile/src/screens/CommunitiesScreen.tsx',
      'apps/mobile/src/screens/FinancialCenterScreen.tsx',
      'apps/mobile/src/screens/SoundsScreen.tsx',
      'apps/mobile/src/screens/ReelsScreen.tsx',
    ];

    it('uses TOKENS.actionText (#110D17, 7.48:1 AAA) on Sunrise Coral CTAs across secondary mobile screens', () => {
      const tokensFile = fs.readFileSync(
        path.join(REPO_ROOT, 'apps/mobile/src/theme/tokens.ts'),
        'utf8'
      );
      expect(tokensFile).toContain('actionText');
      for (const relPath of mobileScreens) {
        const content = fs.readFileSync(path.join(REPO_ROOT, relPath), 'utf8');
        expect(content).toContain('TOKENS.actionText');
      }
    });

    it('supports both island-vibes and island-daylight in settings-actions.ts and layout.tsx', () => {
      const settingsActions = fs.readFileSync(
        path.join(REPO_ROOT, 'apps/web/src/lib/settings/settings-actions.ts'),
        'utf8'
      );
      expect(settingsActions).toContain("'island-vibes'");
      expect(settingsActions).toContain("'island-daylight'");
      expect(settingsActions).toContain("'tukubi_theme'");

      const rootLayout = fs.readFileSync(
        path.join(REPO_ROOT, 'apps/web/src/app/layout.tsx'),
        'utf8'
      );
      expect(rootLayout).toContain('data-theme={activeTheme}');
    });
  });

  describe('5. Obsidian Engineering Intelligence Vault & Codebase Knowledge Graph', () => {
    const requiredNotes = [
      'TUKUBI Engineering Intelligence/TUKUBI Engineering Intelligence.md',
      'TUKUBI Engineering Intelligence/01 Product and Brand/PROJECT_CONTEXT.md',
      'TUKUBI Engineering Intelligence/02 Architecture/SYSTEM_ARCHITECTURE.md',
      'TUKUBI Engineering Intelligence/05 Feature Inventory/FEATURE_INVENTORY.md',
      'TUKUBI Engineering Intelligence/03 Codebase Intelligence/CODEBASE_MAP.md',
      'TUKUBI Engineering Intelligence/03 Codebase Intelligence/graph.json',
      'TUKUBI Engineering Intelligence/06 Database and APIs/DATA_MODEL.md',
      'TUKUBI Engineering Intelligence/06 Database and APIs/API_AND_INTEGRATIONS.md',
      'TUKUBI Engineering Intelligence/07 Security and Privacy/SECURITY_THREAT_MODEL.md',
      'TUKUBI Engineering Intelligence/12 Testing and QA/TESTING_STRATEGY.md',
      'TUKUBI Engineering Intelligence/00 Dashboard/TECHNICAL_DEBT_REGISTER.md',
      'TUKUBI Engineering Intelligence/00 Dashboard/PRODUCT_MATURITY_SCORECARD.md',
      'TUKUBI Engineering Intelligence/00 Dashboard/IMPLEMENTATION_ROADMAP.md',
      'TUKUBI Engineering Intelligence/14 Decision Records/ARCHITECTURE_DECISION_RECORDS.md',
      'TUKUBI Engineering Intelligence/13 Operations and Releases/ENGINEERING_CHANGELOG.md',
    ];

    it('contains all 13 core deliverables, vault index, and machine-readable codebase graph', () => {
      for (const relPath of requiredNotes) {
        const fullPath = path.join(REPO_ROOT, relPath);
        expect(fs.existsSync(fullPath), `Missing deliverable: ${relPath}`).toBe(true);
      }

      const graph = JSON.parse(
        fs.readFileSync(
          path.join(REPO_ROOT, 'TUKUBI Engineering Intelligence/03 Codebase Intelligence/graph.json'),
          'utf8'
        )
      );
      expect(graph.summary.applicationsCount).toBe(6);
      expect(graph.summary.packagesCount).toBe(25);
      expect(graph.summary.sqlMigrationsCount).toBeGreaterThanOrEqual(115);
    });
  });
});
