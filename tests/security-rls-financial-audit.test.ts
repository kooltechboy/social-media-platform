/**
 * =============================================================================
 * Security, RLS & Financial Integrity Audit Suite
 *
 * NASA-Grade & Fortune-100 Database Security Verification
 * Target Scope: Migrations 00101, 00102, 00103 + Monorepo Financial Safety Mandates
 * =============================================================================
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Security, RLS & Financial Integrity Audit Suite', () => {
  const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
  const migration00101Path = path.join(migrationsDir, '00101_polls_and_quizzes_enhancements.sql');
  const migration00102Path = path.join(migrationsDir, '00102_social_commerce_and_product_tagging.sql');
  const migration00103Path = path.join(migrationsDir, '00103_events_and_community_relief.sql');
  const migration00035Path = path.join(migrationsDir, '00035_remove_mutable_ledger_balance.sql');

  const sql101 = fs.readFileSync(migration00101Path, 'utf-8');
  const sql102 = fs.readFileSync(migration00102Path, 'utf-8');
  const sql103 = fs.readFileSync(migration00103Path, 'utf-8');
  const combinedSql = `${sql101}\n${sql102}\n${sql103}`;

  // ---------------------------------------------------------------------------
  // 1. Migration File Presence & Hygiene
  // ---------------------------------------------------------------------------
  describe('Migration File Presence & Hygiene', () => {
    it('verifies that migrations 00101, 00102, and 00103 exist on disk', () => {
      expect(fs.existsSync(migration00101Path)).toBe(true);
      expect(fs.existsSync(migration00102Path)).toBe(true);
      expect(fs.existsSync(migration00103Path)).toBe(true);
    });

    it('confirms migrations contain valid SQL content without placeholder comments', () => {
      expect(sql101.length).toBeGreaterThan(500);
      expect(sql102.length).toBeGreaterThan(1000);
      expect(sql103.length).toBeGreaterThan(1000);

      expect(combinedSql).not.toContain('TODO');
      expect(combinedSql).not.toContain('FIXME');
      expect(combinedSql).not.toContain('MOCK');
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Comprehensive RLS & FORCE RLS Verification
  // ---------------------------------------------------------------------------
  describe('Row Level Security (RLS) & FORCE RLS Mandates', () => {
    const requiredTables = [
      'polls',
      'poll_options',
      'poll_votes',
      'posts',
      'videos',
      'product_tags',
      'orders',
      'order_items',
      'storefront_configs',
      'events',
      'event_attendees',
      'relief_campaigns',
      'relief_donations',
    ] as const;

    it('enforces that every required table has ENABLE ROW LEVEL SECURITY defined', () => {
      for (const table of requiredTables) {
        const enableRegex = new RegExp(`ALTER\\s+TABLE\\s+public\\.${table}\\s+ENABLE\\s+ROW\\s+LEVEL\\s+SECURITY`, 'i');
        const isEnabled = enableRegex.test(combinedSql);
        expect(isEnabled, `Table "public.${table}" must have ENABLE ROW LEVEL SECURITY declared`).toBe(true);
      }
    });

    it('enforces that every required table has FORCE ROW LEVEL SECURITY defined to prevent table-owner bypasses', () => {
      for (const table of requiredTables) {
        const forceRegex = new RegExp(`ALTER\\s+TABLE\\s+public\\.${table}\\s+FORCE\\s+ROW\\s+LEVEL\\s+SECURITY`, 'i');
        const isForced = forceRegex.test(combinedSql);
        expect(isForced, `Table "public.${table}" must have FORCE ROW LEVEL SECURITY declared`).toBe(true);
      }
    });

    it('verifies explicit distribution of RLS definitions across the respective migrations', () => {
      // 00101: Polls ecosystem
      expect(sql101).toMatch(/ALTER\s+TABLE\s+public\.polls\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/i);
      expect(sql101).toMatch(/ALTER\s+TABLE\s+public\.polls\s+FORCE\s+ROW\s+LEVEL\s+SECURITY/i);
      expect(sql101).toMatch(/ALTER\s+TABLE\s+public\.poll_options\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/i);
      expect(sql101).toMatch(/ALTER\s+TABLE\s+public\.poll_options\s+FORCE\s+ROW\s+LEVEL\s+SECURITY/i);
      expect(sql101).toMatch(/ALTER\s+TABLE\s+public\.poll_votes\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/i);
      expect(sql101).toMatch(/ALTER\s+TABLE\s+public\.poll_votes\s+FORCE\s+ROW\s+LEVEL\s+SECURITY/i);

      // 00102: Commerce & product tagging ecosystem
      expect(sql102).toMatch(/ALTER\s+TABLE\s+public\.posts\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/i);
      expect(sql102).toMatch(/ALTER\s+TABLE\s+public\.posts\s+FORCE\s+ROW\s+LEVEL\s+SECURITY/i);
      expect(sql102).toMatch(/ALTER\s+TABLE\s+public\.videos\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/i);
      expect(sql102).toMatch(/ALTER\s+TABLE\s+public\.videos\s+FORCE\s+ROW\s+LEVEL\s+SECURITY/i);
      expect(sql102).toMatch(/ALTER\s+TABLE\s+public\.product_tags\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/i);
      expect(sql102).toMatch(/ALTER\s+TABLE\s+public\.product_tags\s+FORCE\s+ROW\s+LEVEL\s+SECURITY/i);
      expect(sql102).toMatch(/ALTER\s+TABLE\s+public\.orders\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/i);
      expect(sql102).toMatch(/ALTER\s+TABLE\s+public\.orders\s+FORCE\s+ROW\s+LEVEL\s+SECURITY/i);
      expect(sql102).toMatch(/ALTER\s+TABLE\s+public\.order_items\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/i);
      expect(sql102).toMatch(/ALTER\s+TABLE\s+public\.order_items\s+FORCE\s+ROW\s+LEVEL\s+SECURITY/i);
      expect(sql102).toMatch(/ALTER\s+TABLE\s+public\.storefront_configs\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/i);
      expect(sql102).toMatch(/ALTER\s+TABLE\s+public\.storefront_configs\s+FORCE\s+ROW\s+LEVEL\s+SECURITY/i);

      // 00103: Events and community relief ecosystem
      expect(sql103).toMatch(/ALTER\s+TABLE\s+public\.events\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/i);
      expect(sql103).toMatch(/ALTER\s+TABLE\s+public\.events\s+FORCE\s+ROW\s+LEVEL\s+SECURITY/i);
      expect(sql103).toMatch(/ALTER\s+TABLE\s+public\.event_attendees\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/i);
      expect(sql103).toMatch(/ALTER\s+TABLE\s+public\.event_attendees\s+FORCE\s+ROW\s+LEVEL\s+SECURITY/i);
      expect(sql103).toMatch(/ALTER\s+TABLE\s+public\.relief_campaigns\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/i);
      expect(sql103).toMatch(/ALTER\s+TABLE\s+public\.relief_campaigns\s+FORCE\s+ROW\s+LEVEL\s+SECURITY/i);
      expect(sql103).toMatch(/ALTER\s+TABLE\s+public\.relief_donations\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/i);
      expect(sql103).toMatch(/ALTER\s+TABLE\s+public\.relief_donations\s+FORCE\s+ROW\s+LEVEL\s+SECURITY/i);
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Search Path Hardening & SECURITY DEFINER Safety
  // ---------------------------------------------------------------------------
  describe('Search Path Hardening on SECURITY DEFINER Routines', () => {
    const hardenedRoutines = [
      {
        name: 'handle_poll_vote_insert',
        sql: sql101,
        expectedSearchPath: 'SET search_path = public, pg_temp',
      },
      {
        name: 'place_order_with_escrow',
        sql: sql102,
        expectedSearchPath: 'SET search_path = public, pg_temp',
      },
      {
        name: 'handle_relief_donation_insert',
        sql: sql103,
        expectedSearchPath: 'SET search_path = public, pg_temp',
      },
    ];

    for (const routine of hardenedRoutines) {
      it(`verifies SECURITY DEFINER and hardened search_path on ${routine.name}`, () => {
        expect(routine.sql).toContain(routine.name);

        // Asserts function has SECURITY DEFINER
        const secDefinerRegex = new RegExp(
          `FUNCTION\\s+public\\.${routine.name}[\\s\\S]*?SECURITY\\s+DEFINER`,
          'i'
        );
        expect(secDefinerRegex.test(routine.sql), `${routine.name} must be declared as SECURITY DEFINER`).toBe(true);

        // Asserts function has hardened search_path = public, pg_temp
        const searchPathRegex = new RegExp(
          `FUNCTION\\s+public\\.${routine.name}[\\s\\S]*?SET\\s+search_path\\s*=\\s*public,\\s*pg_temp`,
          'i'
        );
        expect(
          searchPathRegex.test(routine.sql),
          `${routine.name} must include "SET search_path = public, pg_temp" to eliminate CWE-426 search path vulnerabilities`
        ).toBe(true);
      });
    }
  });

  // ---------------------------------------------------------------------------
  // 4. Subquery Optimization: auth.uid() Caching
  // ---------------------------------------------------------------------------
  describe('RLS Policy Subquery Optimization (auth.uid() caching)', () => {
    it('verifies that all RLS policies wrap auth.uid() inside a subselect (SELECT auth.uid()) for query plan caching', () => {
      // Find all policy blocks in 00102 and 00103
      const policyRegex = /CREATE\s+POLICY\s+"([^"]+)"[\s\S]*?(?:USING|WITH\s+CHECK)\s*\(([\s\S]*?)\);/gi;
      const policiesChecked: string[] = [];

      let match;
      while ((match = policyRegex.exec(combinedSql)) !== null) {
        const policyName = match[1];
        const policyBody = match[2];
        policiesChecked.push(policyName);

        // If the policy references auth.uid(), it must be encapsulated as (SELECT auth.uid())
        if (policyBody.includes('auth.uid()')) {
          // Check that every instance of auth.uid() is preceded by "(SELECT "
          const bareUidMatch = policyBody.match(/(?<!\(\s*SELECT\s+)auth\.uid\(\)/);
          expect(
            bareUidMatch,
            `Policy "${policyName}" contains un-cached bare auth.uid(). It must be wrapped in (SELECT auth.uid()) for performance and cache stability.`
          ).toBeNull();
        }
      }

      // Ensure that multiple policies were discovered and audited
      expect(policiesChecked.length).toBeGreaterThanOrEqual(5);
    });

    it('verifies (SELECT auth.uid()) specifically in commerce and relief policies', () => {
      // 00102 Seller reads assigned orders policy
      expect(sql102).toMatch(/USING\s*\(\s*seller_id\s*=\s*\(\s*SELECT\s+auth\.uid\(\)\s*\)\s*\)/i);

      // 00102 Product tags creator policy
      expect(sql102).toMatch(/author_id\s*=\s*\(\s*SELECT\s+auth\.uid\(\)\s*\)/i);
      expect(sql102).toMatch(/creator_id\s*=\s*\(\s*SELECT\s+auth\.uid\(\)\s*\)/i);

      // 00103 Relief campaigns policies
      expect(sql103).toMatch(/creator_id\s*=\s*\(\s*SELECT\s+auth\.uid\(\)\s*\)/i);

      // 00103 Relief donations policies
      expect(sql103).toMatch(/donor_id\s*=\s*\(\s*SELECT\s+auth\.uid\(\)\s*\)/i);
    });
  });

  // ---------------------------------------------------------------------------
  // 5. Double-Entry Financial Safety, Idempotency & Concurrency Audit
  // ---------------------------------------------------------------------------
  describe('Double-Entry & Concurrency Integrity Audit', () => {
    it('enforces idempotency_key uniqueness on orders and relief_donations tables', () => {
      // Relief donations table definition in 00103
      expect(sql103).toMatch(/idempotency_key\s+VARCHAR\(128\)\s+UNIQUE\s+NOT\s+NULL/i);

      // Orders idempotency handling in 00102 RPC function place_order_with_escrow
      expect(sql102).toContain('p_idempotency_key');
      expect(sql102).toMatch(/SELECT\s+id,\s*escrow_status\s+INTO\s+v_existing_order_id,\s*v_existing_escrow_status\s+FROM\s+public\.orders\s+WHERE\s+idempotency_key\s*=\s*p_idempotency_key/i);
      expect(sql102).toContain('idempotent_replay');
    });

    it('asserts row-level FOR UPDATE locks in place_order_with_escrow to prevent stock race conditions', () => {
      // Product stock locking
      const productLockRegex = /SELECT[\s\S]*?FROM\s+public\.products\s+WHERE\s+id\s*=\s*v_product_id\s+FOR\s+UPDATE/i;
      expect(productLockRegex.test(sql102), 'place_order_with_escrow must acquire FOR UPDATE row lock on products').toBe(true);

      // Variant stock locking
      const variantLockRegex = /SELECT[\s\S]*?FROM\s+public\.product_variants\s+WHERE[\s\S]*?FOR\s+UPDATE/i;
      expect(variantLockRegex.test(sql102), 'place_order_with_escrow must acquire FOR UPDATE row lock on product_variants').toBe(true);
    });

    it('asserts row-level FOR UPDATE locks in handle_relief_donation_insert trigger function to prevent campaign tally races', () => {
      const campaignLockRegex = /SELECT[\s\S]*?FROM\s+public\.relief_campaigns\s+WHERE\s+id\s*=\s*NEW\.campaign_id\s+FOR\s+UPDATE/i;
      expect(campaignLockRegex.test(sql103), 'handle_relief_donation_insert must acquire FOR UPDATE row lock on relief_campaigns').toBe(true);
    });

    it('enforces that no mutable column balance increments occur outside authorized triggers/RPCs', () => {
      // In migrations 00101, 00102, 00103, no table wallet or financial balance is mutated directly via balance = balance + X
      expect(combinedSql).not.toMatch(/SET\s+balance\s*=\s*balance\s*[\+\-]/i);

      // Verify that 00035 dropped mutable balance column from ledger_accounts to enforce double-entry auditability
      expect(fs.existsSync(migration00035Path)).toBe(true);
      const sql035 = fs.readFileSync(migration00035Path, 'utf-8');
      expect(sql035).toMatch(/DROP\s+COLUMN\s+IF\s+EXISTS\s+balance/i);
      expect(sql035).toMatch(/DROP\s+TRIGGER\s+IF\s+EXISTS\s+trg_update_ledger_balance/i);
    });

    it('verifies that stock decrements and campaign tallies only happen under verified pre-conditions', () => {
      // Stock decrement requires inventory_count >= requested quantity
      expect(sql102).toMatch(/inventory_count\s*<\s*v_qty/i);
      expect(sql102).toMatch(/RAISE\s+EXCEPTION\s+'Insufficient stock/i);

      // Campaign donation requires verified status (not rejected), active campaign, and deadline validity
      expect(sql103).toMatch(/v_campaign\.is_active\s+IS\s+NOT\s+TRUE/i);
      expect(sql103).toMatch(/v_campaign\.verification_status\s*=\s*'rejected'/i);
      expect(sql103).toMatch(/v_campaign\.deadline_at\s*<\s*now\(\)/i);
    });
  });

  // ---------------------------------------------------------------------------
  // 6. Privilege Boundary & Access Grants Audit
  // ---------------------------------------------------------------------------
  describe('Privilege Boundary & Access Grants Audit', () => {
    it('verifies public execute revocation on sensitive RPC function place_order_with_escrow', () => {
      expect(sql102).toMatch(/REVOKE\s+ALL\s+ON\s+FUNCTION\s+public\.place_order_with_escrow.*FROM\s+PUBLIC/i);
      expect(sql102).toMatch(/GRANT\s+EXECUTE\s+ON\s+FUNCTION\s+public\.place_order_with_escrow.*TO\s+authenticated/i);
      expect(sql102).toMatch(/GRANT\s+EXECUTE\s+ON\s+FUNCTION\s+public\.place_order_with_escrow.*TO\s+service_role/i);
    });

    it('verifies caller authorization check inside place_order_with_escrow (auth.uid() = p_buyer_id)', () => {
      expect(sql102).toMatch(/IF\s+auth\.uid\(\)\s+IS\s+NULL\s+OR\s+NOT\s*\(\s*auth\.uid\(\)\s*=\s*p_buyer_id\s*\)\s+THEN/i);
    });

    it('verifies granular table grants for relief_campaigns and relief_donations', () => {
      // Authenticated users can select, insert, update campaigns
      expect(sql103).toMatch(/GRANT\s+SELECT,\s*INSERT,\s*UPDATE\s+ON\s+public\.relief_campaigns\s+TO\s+authenticated/i);
      // Anon can only select
      expect(sql103).toMatch(/GRANT\s+SELECT\s+ON\s+public\.relief_campaigns\s+TO\s+anon/i);

      // Both authenticated and anon can insert donations (guest donations permitted)
      expect(sql103).toMatch(/GRANT\s+SELECT,\s*INSERT\s+ON\s+public\.relief_donations\s+TO\s+authenticated/i);
      expect(sql103).toMatch(/GRANT\s+SELECT,\s*INSERT\s+ON\s+public\.relief_donations\s+TO\s+anon/i);
    });
  });
});
