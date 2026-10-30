import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('Migration 00116 — Legal Consent Records & Account Deletion Lifecycle (Law 172-13, Law 126-02, GDPR)', () => {
  const rootDir = join(__dirname, '..');
  const migrationPath = join(rootDir, 'supabase/migrations/00116_legal_consent_and_account_lifecycle.sql');

  it('migration file 00116 exists in supabase/migrations/', () => {
    expect(existsSync(migrationPath)).toBe(true);
  });

  it('creates legal_consent_records table with required audit columns', () => {
    const content = readFileSync(migrationPath, 'utf-8');
    expect(content).toContain('CREATE TABLE IF NOT EXISTS public.legal_consent_records');
    expect(content).toContain('user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE');
    expect(content).toContain('document_type VARCHAR(50) NOT NULL');
    expect(content).toContain('document_version VARCHAR(20) NOT NULL');
    expect(content).toContain('consented BOOLEAN NOT NULL DEFAULT true');
    expect(content).toContain('consented_at TIMESTAMPTZ NOT NULL DEFAULT now()');
    expect(content).toContain('jurisdiction VARCHAR(50) DEFAULT \'DO\'');
  });

  it('enforces RLS on legal_consent_records with strict user and service-role policies', () => {
    const content = readFileSync(migrationPath, 'utf-8');
    expect(content).toContain('ALTER TABLE public.legal_consent_records ENABLE ROW LEVEL SECURITY;');
    expect(content).toContain('CREATE POLICY "Users view own consent records"');
    expect(content).toContain('auth.uid() = user_id');
    expect(content).toContain('CREATE POLICY "Users insert own consent records"');
    expect(content).toContain('CREATE POLICY "Service role manages consent records"');
  });

  it('creates account_deletion_requests table with 30-day grace period pipeline', () => {
    const content = readFileSync(migrationPath, 'utf-8');
    expect(content).toContain('CREATE TABLE IF NOT EXISTS public.account_deletion_requests');
    expect(content).toContain('user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE');
    expect(content).toContain('scheduled_deletion_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval \'30 days\')');
    expect(content).toContain('CHECK (status IN (\'scheduled\', \'processing\', \'completed\', \'cancelled\'))');
  });

  it('enforces RLS on account_deletion_requests', () => {
    const content = readFileSync(migrationPath, 'utf-8');
    expect(content).toContain('ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY;');
    expect(content).toContain('CREATE POLICY "Users view own deletion requests"');
    expect(content).toContain('CREATE POLICY "Users insert own deletion request"');
    expect(content).toContain('CREATE POLICY "Users update own scheduled deletion request"');
  });

  it('defines request_account_deletion and cancel_account_deletion with SECURITY DEFINER and pinned search_path', () => {
    const content = readFileSync(migrationPath, 'utf-8');
    expect(content).toContain('CREATE OR REPLACE FUNCTION public.request_account_deletion');
    expect(content).toContain('CREATE OR REPLACE FUNCTION public.cancel_account_deletion');
    expect(content).toContain('SECURITY DEFINER SET search_path = public, pg_temp');
    expect(content).toContain('GRANT EXECUTE ON FUNCTION public.request_account_deletion');
    expect(content).toContain('GRANT EXECUTE ON FUNCTION public.cancel_account_deletion');
  });
});
