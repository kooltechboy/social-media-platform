import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { describe, it, expect, vi } from 'vitest';
import { resolveUserForMessaging } from '../../apps/web/src/lib/messaging/identity';
import { getOrCreateDirectConversation } from '../../apps/web/src/lib/messaging/direct-conversations';

const ROOT = join(__dirname, '../..');

describe('TUKUBI Messaging P0 Rebuild — Full Certification Suite', () => {

  // ── 1. Database Layer (Migration 00070) ──────────────────────────────────
  describe('Migration 00070: Database Integrity & Realtime Notifications', () => {
    const migPath = join(ROOT, 'supabase/migrations/00070_messaging_p0_rebuild_and_realtime_notifications.sql');

    it('migration file exists and is populated', () => {
      expect(existsSync(migPath)).toBe(true);
      const sql = readFileSync(migPath, 'utf-8');
      expect(sql.length).toBeGreaterThan(1000);
    });

    it('registers conversations, conversation_members, and notifications in supabase_realtime publication', () => {
      const sql = readFileSync(migPath, 'utf-8');
      expect(sql).toContain('supabase_realtime');
      expect(sql).toContain('conversation_members');
      expect(sql).toContain('conversations');
      expect(sql).toContain('notifications');
    });

    it('enforces symmetric canonical_pair to prevent duplicates', () => {
      const sql = readFileSync(migPath, 'utf-8');
      expect(sql).toContain('canonical_pair');
      expect(sql).toContain('pair_key');
      expect(sql).toContain('current_uid < target_user_id');
    });

    it('enforces self-messaging rejection and block validation in RPC', () => {
      const sql = readFileSync(migPath, 'utf-8');
      expect(sql).toContain('cannot_message_self');
      expect(sql).toContain('blocks');
      expect(sql).toContain('user_blocked');
    });

    it('defines automated notification trigger fn_notify_message_recipients on messages table', () => {
      const sql = readFileSync(migPath, 'utf-8');
      expect(sql).toContain('fn_notify_message_recipients');
      expect(sql).toContain('trg_messages_notify_recipients');
      expect(sql).toContain("INSERT INTO public.notifications");
      expect(sql).toContain("'message'");
    });

    it('marks notifications as read in mark_conversation_read RPC', () => {
      const sql = readFileSync(migPath, 'utf-8');
      expect(sql).toContain('mark_conversation_read');
      expect(sql).toContain('UPDATE public.notifications');
      expect(sql).toContain("entity_type = 'conversation'");
      expect(sql).toContain('entity_id = conv_id');
    });
  });

  // ── 2. Canonical Identity Resolution ─────────────────────────────────────
  describe('Identity Service: resolveUserForMessaging', () => {
    it('resolves user by @username', async () => {
      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'profiles') {
            return {
              select: vi.fn().mockReturnThis(),
              ilike: vi.fn().mockReturnThis(),
              limit: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  id: '11111111-1111-1111-1111-111111111111',
                  username: 'islandvibes',
                  display_name: 'Island Vibes',
                  avatar_url: 'https://cdn.tukubi.caribbean/avatar.jpg',
                  account_type: 'creator',
                  is_verified: true,
                },
                error: null,
              }),
            };
          }
          return {};
        }),
      } as any;

      const { user } = await resolveUserForMessaging('@islandvibes', mockSupabase);
      expect(user).not.toBeNull();
      expect(user?.id).toBe('11111111-1111-1111-1111-111111111111');
      expect(user?.username).toBe('islandvibes');
      expect(user?.displayName).toBe('Island Vibes');
      expect(user?.avatarUrl).toBe('https://cdn.tukubi.caribbean/avatar.jpg');
    });

    it('resolves user by UUID when passed a valid UUID string', async () => {
      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'profiles') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  id: '22222222-2222-2222-2222-222222222222',
                  username: 'calypso_queen',
                  display_name: 'Calypso Queen',
                  avatar_url: null,
                  account_type: 'personal',
                  is_verified: false,
                },
                error: null,
              }),
            };
          }
          return {};
        }),
      } as any;

      const { user } = await resolveUserForMessaging('22222222-2222-2222-2222-222222222222', mockSupabase);
      expect(user).not.toBeNull();
      expect(user?.id).toBe('22222222-2222-2222-2222-222222222222');
      expect(user?.username).toBe('calypso_queen');
      expect(user?.displayName).toBe('Calypso Queen');
    });

    it('returns null when user is not found', async () => {
      const mockSupabase = {
        from: vi.fn(() => ({
          select: vi.fn().mockReturnThis(),
          ilike: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
      } as any;

      const { user } = await resolveUserForMessaging('nonexistent_user', mockSupabase);
      expect(user).toBeNull();
    });
  });

  // ── 3. Direct Conversation Service ───────────────────────────────────────
  describe('Direct Conversation Service: getOrCreateDirectConversation', () => {
    it('rejects self-messaging', async () => {
      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'profiles') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              ilike: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data: { id: '11111111-1111-1111-1111-111111111111', username: 'user1', display_name: 'User 1' },
                error: null,
              }),
            };
          }
          return {};
        }),
      } as any;

      const res = await getOrCreateDirectConversation(
        '11111111-1111-1111-1111-111111111111',
        '11111111-1111-1111-1111-111111111111',
        mockSupabase
      );
      expect(res.conversationId).toBeNull();
      expect(res.error).toBe('Cannot start conversation with yourself.');
    });

    it('checks blocks bidirectionally and returns error when blocked', async () => {
      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'profiles') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              ilike: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data: { id: '22222222-2222-2222-2222-222222222222', username: 'target', display_name: 'Target' },
                error: null,
              }),
            };
          }
          if (table === 'blocks') {
            return {
              select: vi.fn().mockReturnThis(),
              or: vi.fn().mockReturnThis(),
              limit: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data: { blocker_id: '22222222-2222-2222-2222-222222222222', blocked_id: '11111111-1111-1111-1111-111111111111' },
                error: null,
              }),
            };
          }
          return {};
        }),
      } as any;

      const res = await getOrCreateDirectConversation(
        '22222222-2222-2222-2222-222222222222',
        '11111111-1111-1111-1111-111111111111',
        mockSupabase
      );
      expect(res.conversationId).toBeNull();
      expect(res.error).toBe('This user is not available for messaging.');
    });

    it('invokes get_or_create_direct_conversation RPC and returns conversationId', async () => {
      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'profiles') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              ilike: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data: { id: '22222222-2222-2222-2222-222222222222', username: 'target', display_name: 'Target' },
                error: null,
              }),
            };
          }
          if (table === 'blocks') {
            return {
              select: vi.fn().mockReturnThis(),
              or: vi.fn().mockReturnThis(),
              limit: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            };
          }
          return {};
        }),
        rpc: vi.fn().mockResolvedValue({
          data: 'conv-12345',
          error: null,
        }),
      } as any;

      const res = await getOrCreateDirectConversation(
        '22222222-2222-2222-2222-222222222222',
        '11111111-1111-1111-1111-111111111111',
        mockSupabase
      );
      expect(res.conversationId).toBe('conv-12345');
      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_or_create_direct_conversation', {
        target_user_id: '22222222-2222-2222-2222-222222222222',
      });
    });
  });

  // ── 4. Web Touchpoints Across Ecosystem ──────────────────────────────────
  describe('Universal Web Message Touchpoints', () => {
    it('Profile page (/profile/[username]) has prominent Message action', () => {
      const src = readFileSync(join(ROOT, 'apps/web/src/app/profile/[username]/page.tsx'), 'utf-8');
      expect(src).toContain('/messages?u=');
      expect(src).toContain('Message');
    });

    it('Marketplace product page (/marketplace/[id]) has Message Seller action', () => {
      const src = readFileSync(join(ROOT, 'apps/web/src/app/marketplace/[id]/page.tsx'), 'utf-8');
      expect(src).toContain('/messages?u=');
      expect(src).toContain('Message Seller');
    });

    it('Feed stream (feed-stream.tsx) has Message Author and comment Msg actions', () => {
      const src = readFileSync(join(ROOT, 'apps/web/src/components/feed-stream.tsx'), 'utf-8');
      expect(src).toContain('/messages?u=');
      expect(src).toContain('Message Author');
    });

    it('Reels viewer (reels-feed-viewer.tsx) has Message action in rail and share modal', () => {
      const src = readFileSync(join(ROOT, 'apps/web/src/components/reels/reels-feed-viewer.tsx'), 'utf-8');
      expect(src).toContain('/messages?u=');
      expect(src).toContain('Message');
      expect(src).toContain('Message @');
    });

    it('Notifications page (/notifications) handles message kind with icon and Open Conversation link', () => {
      const src = readFileSync(join(ROOT, 'apps/web/src/app/notifications/page.tsx'), 'utf-8');
      expect(src).toContain("kind === 'message'");
      expect(src).toContain('MessageSquare');
      expect(src).toContain('/messages?c=');
      expect(src).toContain('Open Conversation →');
    });

    it('App header and Mobile nav show unread badges for messages', () => {
      const headerSrc = readFileSync(join(ROOT, 'apps/web/src/components/app-header.tsx'), 'utf-8');
      expect(headerSrc).toContain('useUnreadMessagesCount');
      expect(headerSrc).toContain('href="/messages"');
      expect(headerSrc).toContain('unreadMessagesCount > 0');

      const mobileNavSrc = readFileSync(join(ROOT, 'apps/web/src/components/mobile-nav.tsx'), 'utf-8');
      expect(mobileNavSrc).toContain('useUnreadMessagesCount');
      expect(mobileNavSrc).toContain("tab.href === '/messages' && unreadMessagesCount > 0");
    });
  });

  // ── 5. Messages Desktop & Mobile Two-Panel Parity ────────────────────────
  describe('Messages Center Client Layout & Search', () => {
    const centerSrc = readFileSync(join(ROOT, 'apps/web/src/components/messages/messages-center-client.tsx'), 'utf-8');

    it('includes dual-mode search for both conversations and registered people', () => {
      expect(centerSrc).toContain('Search people or conversations');
      expect(centerSrc).toContain(".from('profiles')");
      expect(centerSrc).toContain('searchedPeople');
      expect(centerSrc).toContain('People');
    });

    it('fixes mobile two-panel layout without vertical stacking defect', () => {
      expect(centerSrc).toContain("mobileView === 'list' ? 'hidden md:flex' : 'flex'");
      expect(centerSrc).toContain("mobileView === 'thread' ? 'hidden md:flex' : 'flex'");
    });
  });

  // ── 6. Mobile Messages Screen Parity ─────────────────────────────────────
  describe('Mobile MessagesScreen Parity', () => {
    const mobileSrc = readFileSync(join(ROOT, 'apps/mobile/src/screens/MessagesScreen.tsx'), 'utf-8');

    it('uses body column instead of non-existent content column', () => {
      expect(mobileSrc).toContain('body:');
      expect(mobileSrc).not.toContain('content: draft.trim()');
    });

    it('invokes mark_conversation_read with conv_id parameter', () => {
      expect(mobileSrc).toContain("mark_conversation_read', { conv_id: item.id }");
    });
  });
});
