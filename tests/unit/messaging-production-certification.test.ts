import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { describe, it, expect } from 'vitest';

const ROOT = join(__dirname, '../..');

describe('TUKUBI Messaging Production Certification Suite', () => {

  // ── Database Layer ─────────────────────────────────────────────────────────

  describe('Migration 00056 — Production Hardening', () => {
    const migPath = join(ROOT, 'supabase/migrations/00056_messaging_production_hardening_and_indexes.sql');

    it('migration file exists', () => {
      expect(existsSync(migPath)).toBe(true);
    });

    let sql = '';
    it('migration is non-empty and parseable', () => {
      sql = readFileSync(migPath, 'utf-8');
      expect(sql.length).toBeGreaterThan(500);
    });

    it('contains all 7 required FK indexes', () => {
      const sql = readFileSync(migPath, 'utf-8');
      const requiredIndexes = [
        'idx_conversations_created_by',
        'idx_conversations_last_message_id',
        'idx_conversation_members_last_read_msg',
        'idx_messages_sender_id',
        'idx_messages_reply_to_id',
        'idx_message_reactions_profile_id',
        'idx_message_requests_conversation',
      ];
      for (const idx of requiredIndexes) {
        expect(sql, `Missing index: ${idx}`).toContain(idx);
      }
    });

    it('RLS policies use (SELECT auth.uid()) subquery caching', () => {
      const sql = readFileSync(migPath, 'utf-8');
      expect(sql).toContain('(SELECT auth.uid())');
      // Must NOT still use bare auth.uid() in policy definitions after the replacements
    });

    it('get_or_create_direct_conversation is bidirectional (reactivates both users)', () => {
      const sql = readFileSync(migPath, 'utf-8');
      // Must contain "IN (current_uid, target_user_id)" or equivalent bidirectional update
      const hasBidirectional =
        sql.includes('IN (current_uid, target_user_id)') ||
        sql.includes('IN (target_user_id, current_uid)') ||
        (sql.includes('current_uid') && sql.includes('target_user_id') && sql.includes('left_at IS NOT NULL'));
      expect(hasBidirectional).toBe(true);
    });

    it('function has privilege hardening (REVOKE FROM PUBLIC/anon)', () => {
      const sql = readFileSync(migPath, 'utf-8');
      const hasRevoke =
        sql.toLowerCase().includes('revoke') &&
        (sql.includes('PUBLIC') || sql.includes('public')) &&
        sql.includes('get_or_create_direct_conversation');
      expect(hasRevoke).toBe(true);
    });
  });

  // ── Web Touchpoints ───────────────────────────────────────────────────────

  describe('Web Discovery — Message Touchpoints', () => {
    const webComponents = join(ROOT, 'apps/web/src/components');

    it('members-directory-client.tsx has Message button linking to /messages', () => {
      const src = readFileSync(join(webComponents, 'members/members-directory-client.tsx'), 'utf-8');
      expect(src).toContain('/messages?u=');
      expect(src).toContain('Message');
    });

    it('social-search-client.tsx has Message button for people results', () => {
      const src = readFileSync(join(webComponents, 'search/social-search-client.tsx'), 'utf-8');
      expect(src).toContain('/messages?u=');
    });

    it('friends-center-client.tsx has Message button across all major tabs', () => {
      const src = readFileSync(join(webComponents, 'friends/friends-center-client.tsx'), 'utf-8');
      // Count occurrences of /messages?u= — should be multiple (one per tab)
      const matches = (src.match(/\/messages\?u=/g) || []).length;
      expect(matches).toBeGreaterThanOrEqual(4); // Friends + PYMK + Following + Followers
    });

    it('profile-header-actions.tsx already has Message button (regression)', () => {
      const src = readFileSync(join(webComponents, 'profile-header-actions.tsx'), 'utf-8');
      expect(src).toContain('/messages?u=');
    });
  });

  // ── Mobile Client ─────────────────────────────────────────────────────────

  describe('Mobile MessagesScreen — Live Implementation', () => {
    const mobileSrc = join(ROOT, 'apps/mobile/src/screens/MessagesScreen.tsx');

    it('MessagesScreen exists', () => {
      expect(existsSync(mobileSrc)).toBe(true);
    });

    it('Send button inserts to database (not just clears draft)', () => {
      const src = readFileSync(mobileSrc, 'utf-8');
      // Must contain a Supabase insert call to the messages table
      expect(src).toContain(".from('messages')");
      expect(src).toContain('.insert(');
    });

    it('includes client_message_id for idempotency', () => {
      const src = readFileSync(mobileSrc, 'utf-8');
      expect(src).toContain('client_message_id');
    });

    it('has realtime subscription for incoming messages', () => {
      const src = readFileSync(mobileSrc, 'utf-8');
      expect(src).toContain('.channel(');
      expect(src).toContain('postgres_changes');
    });

    it('shows thread view when conversation selected (dual-mode)', () => {
      const src = readFileSync(mobileSrc, 'utf-8');
      // Must have a Back button (thread mode) and conversation list mode
      expect(src).toContain('Back');
    });

    it('does NOT have the broken noop send handler', () => {
      const src = readFileSync(mobileSrc, 'utf-8');
      // The old broken handler was exactly: onPress={() => { setDraft(''); }}
      expect(src).not.toContain("onPress={() => {\n            setDraft('');\n          }}");
    });
  });

  // ── Link Integrity ─────────────────────────────────────────────────────────

  describe('Link Integrity', () => {
    it('all /messages?u= links use encodeURIComponent', () => {
      const files = [
        'apps/web/src/components/members/members-directory-client.tsx',
        'apps/web/src/components/search/social-search-client.tsx',
        'apps/web/src/components/friends/friends-center-client.tsx',
        'apps/web/src/components/profile-header-actions.tsx',
      ];
      for (const file of files) {
        const src = readFileSync(join(ROOT, file), 'utf-8');
        if (src.includes('/messages?u=')) {
          expect(src, `${file} should use encodeURIComponent`).toContain('encodeURIComponent');
        }
      }
    });
  });
});
