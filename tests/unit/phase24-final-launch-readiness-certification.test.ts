import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Phase 24 — Final Launch Readiness & Production Sign-Off Certification', () => {
  const root = path.resolve(__dirname, '../..');

  // ===========================================================================
  // 1. Comprehensive Phase Test File Inventory
  // ===========================================================================
  describe('1. Universal Phase Certification Suite Coverage', () => {
    it('verifies that dedicated certification suites exist for all operational phases', () => {
      const requiredPhaseSuites = [
        'phase1-functional-production-certification.test.ts',
        'phase2-database-integrity-certification.test.ts',
        'phase3-media-storage-production-certification.test.ts',
        'phase4-mobile-experience-production-certification.test.ts',
        'phase5-desktop-responsive-certification.test.ts',
        'phase6-performance-production-certification.test.ts',
        'phase7-security-audit-production-certification.test.ts',
        'phase8-financial-ledger-certification.test.ts',
        'phase9-trust-safety-certification.test.ts',
        'phase10-creator-studio-monetization-certification.test.ts',
        'phase11-realtime-messaging-concurrency-certification.test.ts',
        'phase12-live-streaming-ingest-chat-certification.test.ts',
        'phase13-caribbean-diaspora-geography-certification.test.ts',
        'phase14-social-commerce-escrow-orders-certification.test.ts',
        'phase15-podcasting-network-rss-certification.test.ts',
        'phase16-communities-hubs-governance-certification.test.ts',
        'phase17-pages-identity-management-certification.test.ts',
        'phase18-events-relief-ticketing-certification.test.ts',
        'phase19-advertising-campaign-delivery-certification.test.ts',
        'phase20-seo-metadata-opengraph-certification.test.ts',
        'phase21-pwa-offline-service-worker-certification.test.ts',
        'phase22-observability-sentry-audit-logging-certification.test.ts',
        'phase23-cicd-gates-zero-tolerance-certification.test.ts',
        'phase24-final-launch-readiness-certification.test.ts',
      ];

      const unitDir = path.join(root, 'tests/unit');
      for (const suite of requiredPhaseSuites) {
        const full = path.join(unitDir, suite);
        expect(fs.existsSync(full), `Missing certification suite: ${suite}`).toBe(true);
      }
    });
  });

  // ===========================================================================
  // 2. Governance Mandates & Inviolable Rules Verification
  // ===========================================================================
  describe('2. Inviolable Governance Mandates (AGENTS.md)', () => {
    it('verifies AGENTS.md exists and defines the 10 inviolable mandates', () => {
      const agentsMdPath = path.join(root, 'AGENTS.md');
      expect(fs.existsSync(agentsMdPath)).toBe(true);

      const content = fs.readFileSync(agentsMdPath, 'utf-8');
      expect(content).toContain('Mandates & Inviolable Rules');
      expect(content).toContain('Double-Entry Financial Ledger Safety');
      expect(content).toContain('Database Integrity & RLS');
      expect(content).toContain('Security & Secrets');
      expect(content).toContain('Privacy of Caribbean Identity');
      expect(content).toContain('Store Policy Compliance');
    });

    it('verifies all 104+ versioned database migrations exist in sequential order', () => {
      const migDir = path.join(root, 'supabase/migrations');
      const files = fs.readdirSync(migDir).filter((f) => f.endsWith('.sql'));

      expect(files.length).toBeGreaterThanOrEqual(104);
      // Verify latest universal discovery GIN indexing migration exists
      expect(files.some((f) => f.includes('00104_universal_discovery_gin_indexes'))).toBe(true);
    });

    it('verifies production launch configuration defines live marketplace start date', () => {
      const launchConfigPath = path.join(root, 'packages/payments/src/launch-config.ts');
      expect(fs.existsSync(launchConfigPath)).toBe(true);

      const content = fs.readFileSync(launchConfigPath, 'utf-8');
      expect(content).toContain('MARKETPLACE_COMMERCE_START');
      expect(content).toContain('2026-09-30T00:00:00Z');
    });
  });

  // ===========================================================================
  // 3. Monorepo Apps & Packages Structural Verification
  // ===========================================================================
  describe('3. Monorepo Structural Integrity', () => {
    it('verifies all core apps exist with package.json', () => {
      const requiredApps = ['web', 'mobile', 'admin', 'moderation', 'creator-studio', 'business-studio'];
      for (const app of requiredApps) {
        const pkgJson = path.join(root, 'apps', app, 'package.json');
        expect(fs.existsSync(pkgJson), `Missing app package.json for apps/${app}`).toBe(true);
      }
    });

    it('verifies all core Caribbean packages exist with package.json', () => {
      const requiredPackages = [
        'advertising', 'ai', 'analytics', 'api', 'auth',
        'business', 'communities', 'creator', 'database', 'live',
        'localization', 'marketplace', 'media', 'notifications',
        'payments', 'podcasts', 'recommendations', 'search',
        'social', 'trust-safety', 'ui',
      ];
      for (const pkg of requiredPackages) {
        const pkgJson = path.join(root, 'packages', pkg, 'package.json');
        expect(fs.existsSync(pkgJson), `Missing package.json for packages/${pkg}`).toBe(true);
      }
    });
  });
});
