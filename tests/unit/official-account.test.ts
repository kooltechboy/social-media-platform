import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OfficialService } from '../../apps/web/src/lib/official/official-service';
import { TukubiBotPublisher } from '../../apps/web/src/lib/official/bot-publisher';
import {
  SENSITIVE_CONTENT_TYPES,
  AUTO_PUBLISHABLE_BOT_TYPES,
  OfficialAccount,
} from '../../apps/web/src/lib/official/types';

describe('TUKUBI Official Account & Automated Publishing System', () => {
  let mockSupabase: any;
  let officialService: OfficialService;
  let botPublisher: TukubiBotPublisher;

  const mockOfficialProfile = {
    id: '11111111-1111-1111-1111-111111111111',
    username: 'tukubi',
    display_name: 'TUKUBI',
    avatar_url: null,
    bio: '🌴 The Caribbean Connected.\nConnecting Caribbean people, culture, creators, businesses & the global diaspora.\n🌎 Born in the Caribbean. Built for the World.',
    is_official: true,
    is_verified: true,
  };

  const mockOfficialAccount: OfficialAccount = {
    id: '22222222-2222-2222-2222-222222222222',
    profile_id: mockOfficialProfile.id,
    classification: 'official_platform',
    department: 'Executive & Platform Communications',
    status: 'active',
    is_system_account: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    profile: mockOfficialProfile,
  };

  beforeEach(() => {
    mockSupabase = {
      from: vi.fn((table: string) => {
        const queryBuilder: any = {
          select: vi.fn().mockReturnThis(),
          insert: vi.fn().mockReturnThis(),
          update: vi.fn().mockReturnThis(),
          delete: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          neq: vi.fn().mockReturnThis(),
          ilike: vi.fn().mockReturnThis(),
          or: vi.fn().mockReturnThis(),
          single: vi.fn(),
          maybeSingle: vi.fn(),
        };

        if (table === 'profiles') {
          queryBuilder.maybeSingle.mockResolvedValue({ data: mockOfficialProfile, error: null });
        } else if (table === 'official_accounts') {
          queryBuilder.maybeSingle.mockResolvedValue({ data: mockOfficialAccount, error: null });
          queryBuilder.single.mockResolvedValue({ data: mockOfficialAccount, error: null });
        } else if (table === 'accounts') {
          // Regular non-admin account by default
          queryBuilder.maybeSingle.mockResolvedValue({ data: null, error: null });
        } else if (table === 'official_account_operators') {
          queryBuilder.maybeSingle.mockResolvedValue({
            data: { role: 'publisher' },
            error: null,
          });
        } else if (table === 'official_post_drafts') {
          queryBuilder.insert.mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: 'draft-123',
                  official_account_id: mockOfficialAccount.id,
                  content: 'Welcome to TUKUBI!',
                  content_type: 'announcement',
                  status: 'draft',
                  requires_approval: true,
                },
                error: null,
              }),
            }),
          });
          queryBuilder.single.mockResolvedValue({
            data: {
              id: 'draft-123',
              official_account_id: mockOfficialAccount.id,
              content: 'Welcome to TUKUBI!',
              content_type: 'announcement',
              status: 'approved',
              requires_approval: true,
              official_account: { profile_id: mockOfficialProfile.id },
            },
            error: null,
          });
          queryBuilder.update.mockReturnValue({
            eq: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: 'draft-123',
                  status: 'approved',
                },
                error: null,
              }),
            }),
          });
        } else if (table === 'posts') {
          queryBuilder.insert.mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: 'post-999' },
                error: null,
              }),
            }),
          });
          queryBuilder.single.mockResolvedValue({
            data: {
              id: 'post-999',
              author_id: mockOfficialProfile.id,
              is_official: true,
            },
            error: null,
          });
        } else if (table === 'audit_logs') {
          queryBuilder.insert.mockResolvedValue({ data: null, error: null });
        }

        return queryBuilder;
      }),
    };

    officialService = new OfficialService(mockSupabase);
    botPublisher = new TukubiBotPublisher(mockSupabase);
  });

  describe('1. Official Account Identification & Resolution', () => {
    it('retrieves official account by @tukubi handle with verified official platform status', async () => {
      const account = await officialService.getOfficialAccountByUsername('@tukubi');
      expect(account).not.toBeNull();
      expect(account?.profile?.username).toBe('tukubi');
      expect(account?.profile?.display_name).toBe('TUKUBI');
      expect(account?.profile?.is_official).toBe(true);
      expect(account?.classification).toBe('official_platform');
      expect(account?.is_system_account).toBe(true);
    });

    it('returns null for non-official or non-existent usernames', async () => {
      mockSupabase.from = vi.fn((table: string) => ({
        select: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      }));
      const nonExistent = await officialService.getOfficialAccountByUsername('random_user');
      expect(nonExistent).toBeNull();
    });
  });

  describe('2. Human Operator Authorization & RBAC', () => {
    it('allows super_admin or admin to operate official accounts', async () => {
      mockSupabase.from = vi.fn((table: string) => {
        if (table === 'accounts') {
          return {
            select: vi.fn().mockReturnThis(),
            or: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: { role: 'super_admin', status: 'active' },
              error: null,
            }),
          };
        }
        return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis() };
      });

      const hasAccess = await officialService.verifyOperatorPermission(
        mockOfficialAccount.id,
        'admin-user-id',
        'owner'
      );
      expect(hasAccess).toBe(true);
    });

    it('enforces operator role hierarchy (owner > administrator > editor > publisher > moderator)', async () => {
      // User with 'publisher' role
      mockSupabase.from = vi.fn((table: string) => {
        if (table === 'accounts') {
          return {
            select: vi.fn().mockReturnThis(),
            or: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
        }
        if (table === 'official_account_operators') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: { role: 'publisher' },
              error: null,
            }),
          };
        }
        return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis() };
      });

      // Publisher can publish
      const canPublish = await officialService.verifyOperatorPermission(
        mockOfficialAccount.id,
        'operator-id',
        'publisher'
      );
      expect(canPublish).toBe(true);

      // Publisher CANNOT perform administrator-level tasks
      const canAdmin = await officialService.verifyOperatorPermission(
        mockOfficialAccount.id,
        'operator-id',
        'administrator'
      );
      expect(canAdmin).toBe(false);
    });

    it('rejects unauthorized users with no operator record', async () => {
      mockSupabase.from = vi.fn((table: string) => ({
        select: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      }));

      const isAuthorized = await officialService.verifyOperatorPermission(
        mockOfficialAccount.id,
        'unauthorized-user',
        'publisher'
      );
      expect(isAuthorized).toBe(false);
    });
  });

  describe('3. Content Classification & Approval Pipeline', () => {
    it('classifies sensitive content types properly and requires approval', () => {
      expect(SENSITIVE_CONTENT_TYPES.has('announcement')).toBe(true);
      expect(SENSITIVE_CONTENT_TYPES.has('platform_update')).toBe(true);
      expect(SENSITIVE_CONTENT_TYPES.has('safety')).toBe(true);
      expect(SENSITIVE_CONTENT_TYPES.has('news')).toBe(true);
      expect(SENSITIVE_CONTENT_TYPES.has('community')).toBe(false);
    });

    it('creates an official draft and appends immutable audit log entry', async () => {
      const draft = await officialService.createDraft({
        officialAccountId: mockOfficialAccount.id,
        authorOperatorId: 'operator-123',
        actorType: 'human_operator',
        content: 'Official Caribbean Connectivity Announcement',
        contentType: 'announcement',
      });

      expect(draft.id).toBe('draft-123');
      expect(mockSupabase.from).toHaveBeenCalledWith('audit_logs');
    });

    it('publishes approved drafts into the production posts feed with is_official = true', async () => {
      const result = await officialService.publishDraft('draft-123', 'operator-123');
      expect(result.postId).toBe('post-999');
      expect(mockSupabase.from).toHaveBeenCalledWith('posts');
      expect(mockSupabase.from).toHaveBeenCalledWith('audit_logs');
    });

    it('blocks publishing unapproved drafts that require approval', async () => {
      mockSupabase.from = vi.fn((table: string) => {
        if (table === 'official_post_drafts') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'draft-unapproved',
                official_account_id: mockOfficialAccount.id,
                status: 'pending_approval',
                requires_approval: true,
              },
              error: null,
            }),
          };
        }
        return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis() };
      });

      await expect(
        officialService.publishDraft('draft-unapproved', 'operator-123')
      ).rejects.toThrow('Draft requires approval before it can be published.');
    });
  });

  describe('4. TUKUBI Bot Least-Privilege Automation', () => {
    it('routes sensitive bot submissions to pending_approval queue', async () => {
      const submission = await botPublisher.submitBotContent({
        officialAccountUsername: 'tukubi',
        content: 'System-wide maintenance scheduled for midnight.',
        contentType: 'announcement', // Sensitive
        allowAutoPublish: true,
      });

      expect(submission.status).toBe('pending_approval');
      expect(submission.message).toContain('routed to authorized human operator queue');
    });

    it('allows auto-publishing of safe non-sensitive categories when permitted', async () => {
      expect(AUTO_PUBLISHABLE_BOT_TYPES.has('community')).toBe(true);
      expect(AUTO_PUBLISHABLE_BOT_TYPES.has('creator_spotlight')).toBe(true);
      expect(AUTO_PUBLISHABLE_BOT_TYPES.has('welcome')).toBe(true);

      const submission = await botPublisher.submitBotContent({
        officialAccountUsername: 'tukubi',
        content: 'Welcome to all our new Caribbean creators joining today! 🌴',
        contentType: 'welcome',
        allowAutoPublish: true,
      });

      expect(submission.status).toBe('published');
      expect(submission.postId).toBeDefined();
    });
  });

  describe('5. Direct Publishing & Pinned Posts', () => {
    it('allows direct publishing by authorized operators with optional pin', async () => {
      const result = await officialService.directPublish({
        officialAccountId: mockOfficialAccount.id,
        operatorUserId: 'operator-123',
        content: '🌴 Welcome to TUKUBI — The Caribbean Connected.',
        contentType: 'welcome',
        isPinned: true,
      });

      expect(result.postId).toBe('post-999');
    });

    it('toggles pinned status on official posts and logs to audit_logs', async () => {
      const success = await officialService.togglePin('post-999', 'operator-123', true);
      expect(success).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('audit_logs');
    });
  });
});
