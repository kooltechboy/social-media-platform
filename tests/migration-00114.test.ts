import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('Migration 00114 — TUKUBI Ads Production Hardening, PayPal Billing Linkage & Moderation', () => {
  const rootDir = join(__dirname, '..');
  const migrationPath = join(rootDir, 'supabase/migrations/00114_tukubi_ads_production_hardening.sql');

  it('migration file 00114 exists in supabase/migrations/', () => {
    expect(existsSync(migrationPath)).toBe(true);
  });

  it('fixes ad_events RLS policy to join advertisers profile_id to auth.uid()', () => {
    const content = readFileSync(migrationPath, 'utf-8');
    expect(content).toContain('ad_owners_read_events');
    expect(content).toContain('adv.profile_id = auth.uid()');
  });

  it('adds budget spend tracking and moderation columns to campaigns', () => {
    const content = readFileSync(migrationPath, 'utf-8');
    expect(content).toContain('funded_amount_minor INTEGER DEFAULT 0 NOT NULL');
    expect(content).toContain('spent_amount_minor INTEGER DEFAULT 0 NOT NULL');
    expect(content).toContain('moderation_status VARCHAR(20) DEFAULT \'pending\'');
    expect(content).toContain('source_post_id UUID REFERENCES public.posts(id)');
    expect(content).toContain('page_id UUID REFERENCES public.businesses(id)');
  });

  it('adds moderation columns to ads', () => {
    const content = readFileSync(migrationPath, 'utf-8');
    expect(content).toContain('rejection_reason TEXT');
    expect(content).toContain('moderated_at TIMESTAMPTZ');
    expect(content).toContain('moderated_by UUID REFERENCES public.profiles(id)');
  });

  it('defines is_staff_or_ad_moderator function for role-based governance', () => {
    const content = readFileSync(migrationPath, 'utf-8');
    expect(content).toContain('CREATE OR REPLACE FUNCTION public.is_staff_or_ad_moderator');
    expect(content).toContain('SECURITY DEFINER');
    expect(content).toContain('SET search_path = public');
  });

  it('establishes staff administrative RLS policies on campaigns, ads, and ad sets', () => {
    const content = readFileSync(migrationPath, 'utf-8');
    expect(content).toContain('Staff read all campaigns');
    expect(content).toContain('Staff update all campaigns');
    expect(content).toContain('Staff read all ads');
    expect(content).toContain('Staff update all ads');
  });

  it('implements atomic record_ad_impression_and_spend function with budget overspend lock', () => {
    const content = readFileSync(migrationPath, 'utf-8');
    expect(content).toContain('CREATE OR REPLACE FUNCTION public.record_ad_impression_and_spend');
    expect(content).toContain('FOR UPDATE OF c');
    expect(content).toContain('v_spent >= v_funded');
    expect(content).toContain('status = \'completed\'');
  });
});
