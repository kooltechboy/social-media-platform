import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  REGISTERED_PROVIDERS,
  DEFAULT_ROUTING_RULES,
  isMarketplaceCommerceActive,
  isCreatorFreeAccessActive,
} from '../../packages/payments/src/index';

describe('Marketplace Launch Gating & Payment Engine Certification', () => {
  it('identifies PayPal as an active/supported payment provider', () => {
    const paypal = REGISTERED_PROVIDERS['paypal'];
    expect(paypal).toBeDefined();
    expect(['active', 'sandbox']).toContain(paypal?.status);
    expect(paypal?.capabilities).toContain('checkout');
  });

  it('marks uncertified secondary Caribbean processors with appropriate status', () => {
    const wipay = REGISTERED_PROVIDERS['wipay'];
    const cxpay = REGISTERED_PROVIDERS['cxpay'];
    const cashapp = REGISTERED_PROVIDERS['cashapp'];

    expect(wipay?.status).toBe('pending_approval');
    expect(cxpay?.status).toBe('pending_approval');
    expect(cashapp?.status).toBe('pending_approval');
  });

  it('verifies migration 00038 exists and defines all required launch flags', () => {
    const migrationPath = path.resolve(
      __dirname,
      '../../supabase/migrations/00038_launch_phases_and_feature_flags.sql'
    );
    expect(fs.existsSync(migrationPath)).toBe(true);

    const migrationSql = fs.readFileSync(migrationPath, 'utf8');
    expect(migrationSql).toContain('CREATOR_FREE_ACCESS_ENABLED');
    expect(migrationSql).toContain('CREATOR_FREE_ACCESS_END_DATE');
    expect(migrationSql).toContain('CREATOR_PAID_TIERS_ENABLED');
    expect(migrationSql).toContain('MARKETPLACE_ENABLED');
    expect(migrationSql).toContain('MARKETPLACE_COMMERCE_ENABLED');
    expect(migrationSql).toContain('MARKETPLACE_COMMERCE_START_DATE');
    expect(migrationSql).toContain('PAYPAL_ENABLED');
    expect(migrationSql).toContain('enabled');
    expect(migrationSql).toContain('is_enabled');
  });

  it('verifies zero fake podcast fallback mocks in podcasts show page', () => {
    const podcastShowPath = path.resolve(
      __dirname,
      '../../apps/web/src/app/podcasts/[slug]/page.tsx'
    );
    const content = fs.readFileSync(podcastShowPath, 'utf8');
    expect(content).not.toContain('follower_count: 8450');
    expect(content).not.toContain('creator_id: \'creator-showcase\'');
    expect(content).toContain('Podcast Show Not Found');
  });

  it('verifies unified checkout modal enforces pre-launch gating and Coming Soon badges', () => {
    const checkoutPath = path.resolve(
      __dirname,
      '../../apps/web/src/components/unified-checkout-modal.tsx'
    );
    const content = fs.readFileSync(checkoutPath, 'utf8');
    expect(content).toContain('Marketplace Transactions Launch September 30, 2026');
    expect(content).toContain('Coming Soon');
    expect(content).toContain('isMarketplaceCommerceActive');
  });

  it('verifies marketplace actions enforces transaction gate', () => {
    const actionsPath = path.resolve(
      __dirname,
      '../../apps/web/src/lib/marketplace/actions.ts'
    );
    const content = fs.readFileSync(actionsPath, 'utf8');
    expect(content).toContain('isMarketplaceCommerceActive');
    expect(content).toContain('MARKETPLACE_COMMERCE_ENABLED');
    expect(content).toContain('Marketplace transactions officially begin September 30, 2026');
  });
});
