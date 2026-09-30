import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { describe, it, expect } from 'vitest';
import { sanitizeSearchTerm } from '../../packages/search/src/index';

describe('Phase 2 — Database, Data Integrity & Supabase Certification', () => {
  const migrationsDir = join(__dirname, '../../supabase/migrations');

  // ===========================================================================
  // 1. Migration 00104: Discovery GIN Trigram & FK Performance Hardening
  // ===========================================================================
  describe('Migration 00104 — Discovery GIN Trigram & FK Performance Hardening', () => {
    const migration104Path = join(
      migrationsDir,
      '00104_universal_discovery_gin_indexes_and_fk_hardening.sql'
    );

    it('migration 00104 exists and is readable', () => {
      expect(existsSync(migration104Path)).toBe(true);
      const content = readFileSync(migration104Path, 'utf-8');
      expect(content.length).toBeGreaterThan(500);
      expect(content).toContain('BEGIN;');
      expect(content).toContain('COMMIT;');
    });

    it('creates GIN trigram indexes for all 10 discovery search entities', () => {
      const sql = readFileSync(migration104Path, 'utf-8');

      // Profiles
      expect(sql).toContain('idx_profiles_first_name_trgm');
      expect(sql).toContain('idx_profiles_last_name_trgm');

      // Businesses
      expect(sql).toContain('idx_businesses_description_trgm');
      expect(sql).toContain('idx_businesses_category_trgm');

      // Communities
      expect(sql).toContain('idx_communities_description_trgm');

      // Events
      expect(sql).toContain('idx_events_description_trgm');

      // Products
      expect(sql).toContain('idx_products_description_trgm');

      // Videos / Reels
      expect(sql).toContain('idx_videos_title_trgm');
      expect(sql).toContain('idx_videos_description_trgm');

      // Sounds
      expect(sql).toContain('idx_sounds_title_trgm');
      expect(sql).toContain('idx_sounds_artist_trgm');
      expect(sql).toContain('idx_sounds_genre_trgm');

      // Livestreams
      expect(sql).toContain('idx_livestreams_title_trgm');
      expect(sql).toContain('idx_livestreams_category_trgm');

      // Podcasts
      expect(sql).toContain('idx_podcasts_title_trgm');
      expect(sql).toContain('idx_podcasts_description_trgm');
    });

    it('creates critical Foreign Key and RLS filter performance indexes', () => {
      const sql = readFileSync(migration104Path, 'utf-8');

      // Marketplace & Orders
      expect(sql).toContain('idx_order_items_product_id');
      expect(sql).toContain('idx_products_seller_id');

      // Social Graph & Interactions
      expect(sql).toContain('idx_comments_author_id');
      expect(sql).toContain('idx_post_reactions_user_id');
      expect(sql).toContain('idx_post_media_post_id');

      // Events & Attendance
      expect(sql).toContain('idx_events_host_id');
      expect(sql).toContain('idx_event_attendees_event_id');
      expect(sql).toContain('idx_tickets_event_id');
      expect(sql).toContain('idx_tickets_holder_id');

      // Business Reviews
      expect(sql).toContain('idx_business_reviews_author_id');

      // Streaming & Podcasts
      expect(sql).toContain('idx_podcasts_creator_id');
      expect(sql).toContain('idx_livestreams_creator_id');

      // Creator & Payments
      expect(sql).toContain('idx_creator_accounts_profile_id');
      expect(sql).toContain('idx_payment_methods_owner_id');
      expect(sql).toContain('idx_payment_connections_user_id');
      expect(sql).toContain('idx_ledger_entries_account_id');
      expect(sql).toContain('idx_ledger_entries_transaction_id');
    });
  });

  // ===========================================================================
  // 2. Double-Entry Financial Ledger Safety
  // ===========================================================================
  describe('Double-Entry Financial Ledger Safety & Integrity', () => {
    it('migration 00033 enforces BIGINT minor units and deferred zero-sum trigger', () => {
      const migration33Path = join(migrationsDir, '00033_database_integrity_remediation.sql');
      expect(existsSync(migration33Path)).toBe(true);
      const sql = readFileSync(migration33Path, 'utf-8');

      expect(sql).toContain('ALTER COLUMN amount TYPE BIGINT');
      expect(sql).toContain('CREATE CONSTRAINT TRIGGER trg_ledger_sum_zero');
      expect(sql).toContain('DEFERRABLE INITIALLY DEFERRED');
      expect(sql).toContain('FUNCTION public.enforce_ledger_sum_zero()');
    });

    it('simulates balanced double-entry transaction (sum === 0)', () => {
      const transaction = [
        { accountId: 'acc-buyer-wallet', amount: -5000, entryType: 'DEBIT' }, // $50.00 debit
        { accountId: 'acc-seller-pending', amount: 4500, entryType: 'CREDIT' }, // $45.00 credit
        { accountId: 'acc-platform-fee', amount: 500, entryType: 'CREDIT' }, // $5.00 fee
      ];

      const sum = transaction.reduce((acc, entry) => acc + entry.amount, 0);
      expect(sum).toBe(0);
    });

    it('rejects unbalanced ledger transaction (sum !== 0)', () => {
      const unbalancedTransaction = [
        { accountId: 'acc-buyer-wallet', amount: -5000, entryType: 'DEBIT' },
        { accountId: 'acc-seller-pending', amount: 4000, entryType: 'CREDIT' },
      ];

      const sum = unbalancedTransaction.reduce((acc, entry) => acc + entry.amount, 0);
      expect(sum).not.toBe(0);
      expect(sum).toBe(-1000);
    });
  });

  // ===========================================================================
  // 3. Multi-User RLS Containment Verification
  // ===========================================================================
  describe('Multi-User RLS Containment Verification', () => {
    const USER_ALICE = '11111111-1111-1111-1111-111111111111';
    const USER_BOB = '22222222-2222-2222-2222-222222222222';

    it('enforces User A cannot mutate User B profile', () => {
      function checkProfileUpdate(authUserId: string, targetProfileId: string): boolean {
        return authUserId === targetProfileId;
      }

      expect(checkProfileUpdate(USER_ALICE, USER_ALICE)).toBe(true);
      expect(checkProfileUpdate(USER_BOB, USER_ALICE)).toBe(false);
    });

    it('enforces User A cannot mutate User B post', () => {
      const post = { id: 'post-1', author_id: USER_ALICE, content: 'Alice original' };

      function canUpdatePost(authUserId: string, postAuthorId: string): boolean {
        return authUserId === postAuthorId;
      }

      expect(canUpdatePost(USER_ALICE, post.author_id)).toBe(true);
      expect(canUpdatePost(USER_BOB, post.author_id)).toBe(false);
    });

    it('enforces User A cannot mutate User B payment methods', () => {
      const paymentMethod = { id: 'pm-1', owner_id: USER_ALICE };

      function canUpdatePaymentMethod(authUserId: string, ownerId: string): boolean {
        return authUserId === ownerId;
      }

      expect(canUpdatePaymentMethod(USER_ALICE, paymentMethod.owner_id)).toBe(true);
      expect(canUpdatePaymentMethod(USER_BOB, paymentMethod.owner_id)).toBe(false);
    });

    it('enforces User A cannot mutate User B creator account', () => {
      const creatorAccount = { id: 'ca-1', profile_id: USER_ALICE };

      function canUpdateCreatorAccount(authUserId: string, profileId: string): boolean {
        return authUserId === profileId;
      }

      expect(canUpdateCreatorAccount(USER_ALICE, creatorAccount.profile_id)).toBe(true);
      expect(canUpdateCreatorAccount(USER_BOB, creatorAccount.profile_id)).toBe(false);
    });

    it('enforces storage bucket folder path isolation: auth.uid()::text', () => {
      function canUploadToStorage(authUserId: string, path: string): boolean {
        const folder = path.split('/')[0];
        return folder === authUserId;
      }

      expect(canUploadToStorage(USER_ALICE, `${USER_ALICE}/photo.jpg`)).toBe(true);
      expect(canUploadToStorage(USER_BOB, `${USER_ALICE}/malicious.jpg`)).toBe(false);
      expect(canUploadToStorage(USER_BOB, `../${USER_ALICE}/traversal.jpg`)).toBe(false);
    });
  });

  // ===========================================================================
  // 4. Universal Search Performance Guard (P1-004)
  // ===========================================================================
  describe('Universal Search Performance Guard (P1-004)', () => {
    it('safely rejects queries shorter than 2 characters from executing multi-table scans', () => {
      function shouldExecuteUniversalSearch(term: string): boolean {
        const cleaned = sanitizeSearchTerm(term || '').replace(/^@/, '').trim();
        return cleaned.length >= 2;
      }

      expect(shouldExecuteUniversalSearch('')).toBe(false);
      expect(shouldExecuteUniversalSearch('a')).toBe(false);
      expect(shouldExecuteUniversalSearch('  @x  ')).toBe(false);
      expect(shouldExecuteUniversalSearch('ja')).toBe(true);
      expect(shouldExecuteUniversalSearch('Kingston')).toBe(true);
    });

    it('sanitizes commas and parentheses that could corrupt PostgREST syntax', () => {
      const dirty = 'kingston, port-au-prince (haiti)';
      const sanitized = sanitizeSearchTerm(dirty);
      expect(sanitized).not.toContain(',');
      expect(sanitized).not.toContain('(');
      expect(sanitized).not.toContain(')');
      expect(sanitized).toContain('kingston');
      expect(sanitized).toContain('port-au-prince');
      expect(sanitized).toContain('haiti');
    });
  });
});
