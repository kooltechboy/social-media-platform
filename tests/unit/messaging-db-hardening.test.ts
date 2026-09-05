import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, it, expect } from 'vitest';

describe('Migration 00056 - Messaging Production Hardening', () => {
  const migrationPath = join(
    __dirname,
    '../../supabase/migrations/00056_messaging_production_hardening_and_indexes.sql'
  );
  let sql: string;

  // ─── Section 1: File existence ────────────────────────────────────────────

  it('migration file exists and is readable', () => {
    sql = readFileSync(migrationPath, 'utf-8');
    expect(sql.length).toBeGreaterThan(0);
  });

  // ─── Section 2: FK Indexes ────────────────────────────────────────────────

  it('contains idx_conversations_created_by index', () => {
    sql = readFileSync(migrationPath, 'utf-8');
    expect(sql).toContain('idx_conversations_created_by');
  });

  it('contains idx_conversations_last_message_id index', () => {
    sql = readFileSync(migrationPath, 'utf-8');
    expect(sql).toContain('idx_conversations_last_message_id');
  });

  it('contains idx_conversation_members_last_read_msg index', () => {
    sql = readFileSync(migrationPath, 'utf-8');
    expect(sql).toContain('idx_conversation_members_last_read_msg');
  });

  it('contains idx_messages_sender_id index', () => {
    sql = readFileSync(migrationPath, 'utf-8');
    expect(sql).toContain('idx_messages_sender_id');
  });

  it('contains idx_messages_reply_to_id index', () => {
    sql = readFileSync(migrationPath, 'utf-8');
    expect(sql).toContain('idx_messages_reply_to_id');
  });

  it('contains idx_message_reactions_profile_id index', () => {
    sql = readFileSync(migrationPath, 'utf-8');
    expect(sql).toContain('idx_message_reactions_profile_id');
  });

  it('contains idx_message_requests_conversation index', () => {
    sql = readFileSync(migrationPath, 'utf-8');
    expect(sql).toContain('idx_message_requests_conversation');
  });

  // ─── Section 3: RLS subquery caching ─────────────────────────────────────

  it('all RLS policies use (SELECT auth.uid()) caching — no bare auth.uid() in policy bodies', () => {
    sql = readFileSync(migrationPath, 'utf-8');
    expect(sql).toContain('(SELECT auth.uid())');
    // Find any line that has bare auth.uid() not wrapped in SELECT
    const forbiddenBareUid = sql.split('\n').filter(
      (line) =>
        !line.trim().startsWith('--') &&
        line.includes('auth.uid()') &&
        !line.includes('(SELECT auth.uid())') &&
        !line.includes('current_uid') &&
        !line.includes(':= (SELECT') &&
        !line.includes('DECLARE')
    );
    expect(forbiddenBareUid).toHaveLength(0);
  });

  it('conversations RLS policies are dropped', () => {
    sql = readFileSync(migrationPath, 'utf-8');
    expect(sql).toContain('DROP POLICY IF EXISTS "authenticated_members_read_conversations"');
    expect(sql).toContain('DROP POLICY IF EXISTS "authenticated_users_create_conversations"');
    expect(sql).toContain('DROP POLICY IF EXISTS "authenticated_admins_update_conversations"');
  });

  it('conversation_members RLS policies are dropped', () => {
    sql = readFileSync(migrationPath, 'utf-8');
    expect(sql).toContain('DROP POLICY IF EXISTS "authenticated_members_read_memberships"');
    expect(sql).toContain('DROP POLICY IF EXISTS "authenticated_users_manage_own_membership"');
    expect(sql).toContain('DROP POLICY IF EXISTS "authenticated_members_update_own_membership"');
  });

  it('messages RLS policies are dropped (including 00055 split policies)', () => {
    sql = readFileSync(migrationPath, 'utf-8');
    expect(sql).toContain('DROP POLICY IF EXISTS "authenticated_members_read_messages"');
    expect(sql).toContain('DROP POLICY IF EXISTS "authenticated_members_insert_messages"');
    expect(sql).toContain('DROP POLICY IF EXISTS "authenticated_senders_delete_messages"');
    expect(sql).toContain('DROP POLICY IF EXISTS "authenticated_senders_update_own_messages"');
    expect(sql).toContain('DROP POLICY IF EXISTS "authenticated_members_soft_delete_messages"');
  });

  it('message_reactions RLS policies are dropped', () => {
    sql = readFileSync(migrationPath, 'utf-8');
    expect(sql).toContain('DROP POLICY IF EXISTS "authenticated_members_read_reactions"');
    expect(sql).toContain('DROP POLICY IF EXISTS "authenticated_members_insert_reactions"');
    expect(sql).toContain('DROP POLICY IF EXISTS "authenticated_users_delete_own_reactions"');
  });

  it('message_requests RLS policies are dropped', () => {
    sql = readFileSync(migrationPath, 'utf-8');
    expect(sql).toContain('DROP POLICY IF EXISTS "authenticated_users_read_message_requests"');
    expect(sql).toContain('DROP POLICY IF EXISTS "authenticated_users_create_message_requests"');
    expect(sql).toContain('DROP POLICY IF EXISTS "authenticated_receivers_update_message_requests"');
  });

  // ─── Section 4: get_or_create_direct_conversation hardening ───────────────

  it('contains REVOKE ALL ON FUNCTION get_or_create_direct_conversation', () => {
    sql = readFileSync(migrationPath, 'utf-8');
    expect(sql).toContain('REVOKE ALL ON FUNCTION public.get_or_create_direct_conversation');
  });

  it('revokes execute from PUBLIC and anon', () => {
    sql = readFileSync(migrationPath, 'utf-8');
    expect(sql).toContain('FROM PUBLIC');
    expect(sql).toContain('FROM anon');
  });

  it('grants execute to authenticated and service_role', () => {
    sql = readFileSync(migrationPath, 'utf-8');
    expect(sql).toContain('GRANT EXECUTE ON FUNCTION public.get_or_create_direct_conversation(UUID) TO authenticated');
    expect(sql).toContain('GRANT EXECUTE ON FUNCTION public.get_or_create_direct_conversation(UUID) TO service_role');
  });

  it('contains bidirectional reactivation: profile_id IN (current_uid, target_user_id)', () => {
    sql = readFileSync(migrationPath, 'utf-8');
    expect(sql).toContain('profile_id IN (current_uid, target_user_id)');
  });

  it('function contains self-message guard', () => {
    sql = readFileSync(migrationPath, 'utf-8');
    expect(sql).toContain('cannot_message_self');
  });

  it('function contains canonical pair key logic', () => {
    sql = readFileSync(migrationPath, 'utf-8');
    expect(sql).toContain('canonical_pair');
    expect(sql).toContain('pair_key');
  });

  it('function handles race condition via unique_violation', () => {
    sql = readFileSync(migrationPath, 'utf-8');
    expect(sql).toContain('unique_violation');
  });
});